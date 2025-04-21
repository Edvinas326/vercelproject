// Import Supabase client
import supabase from '../supabase-config.js';

// Initialize posts functionality
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('Authentication error:', userError);
            window.location.href = '../login page/login.html';
            return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
        }

        // Initialize post creation
        initializePostCreation(user.id);
        
        // Load posts
        await loadPosts();

        // Set up real-time subscription for posts
        const postsChannel = supabase
            .channel('public:posts')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                },
                (payload) => {
                    console.log('Post change detected:', payload);
                    loadPosts();
                }
            )
            .subscribe();

    } catch (error) {
        console.error('Error initializing posts:', error);
    }
});

// Initialize post creation form
function initializePostCreation(userId) {
    const postForm = document.querySelector('.post-creation-form');
    const postContent = document.querySelector('.post-content');
    const postSubmitButton = document.querySelector('.post-submit');

    if (!postForm || !postContent || !postSubmitButton) {
        console.error('Post creation elements not found');
        return;
    }

    console.log('Initializing post creation with user ID:', userId);

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = postContent.value.trim();
        if (!content) return;

        try {
            // Disable the button while submitting
            postSubmitButton.disabled = true;
            postSubmitButton.textContent = 'Posting...';
            
            // Double-check we have the current user ID
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            
            const actualUserId = user.id;
            console.log('Creating post with user ID:', actualUserId);

            // Create new post
            const { data, error } = await supabase
                .from('posts')
                .insert([
                    { 
                        user_id: actualUserId,  
                        content: content,
                        category: 'General'
                    }
                ])
                .select();

            if (error) throw error;
            
            console.log('Post created successfully:', data);

            // Clear the input
            postContent.value = '';
            
            if (data && data.length > 0) {
                const newPost = data[0];
                
                // Get the post container
                const postsContainer = document.getElementById('posts-container');
                
                // If currently showing "no posts" message, clear it
                if (postsContainer.querySelector('p.text-gray-500')) {
                    postsContainer.innerHTML = '';
                }
                
                // Get user profile for the post
                console.log(`Getting profile for new post, user_id: ${actualUserId}`);

                // First try direct lookup
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', actualUserId)
                    .single();
                    
                if (profileError) {
                    console.log(`Direct profile lookup failed for new post, trying to load all profiles...`);
                    
                    // Try to get all profiles and find a match
                    const { data: allProfiles, error: allProfilesError } = await supabase
                        .from('profiles')
                        .select('*')
                        .limit(100);
                        
                    if (allProfilesError || !allProfiles || allProfiles.length === 0) {
                        console.log(`Could not find any profiles for new post, using generic placeholder`);
                        const shortId = actualUserId.substring(0, 4);
                        newPost.profile = { 
                            full_name: `User ${shortId}`,
                            username: null,
                            avatar_url: null
                        };
                    } else {
                        // Look for a profile that might match this user in any way
                        const matchedProfile = allProfiles.find(p => 
                            p.id === actualUserId || 
                            p.user_id === actualUserId || 
                            p.auth_id === actualUserId);
                        
                        if (matchedProfile) {
                            console.log(`Found matching profile for new post through search`);
                            newPost.profile = matchedProfile;
                        } else {
                            console.log(`No matching profile found for new post among ${allProfiles.length} profiles`);
                            const shortId = actualUserId.substring(0, 4);
                            newPost.profile = { 
                                full_name: `User ${shortId}`,
                                username: null,
                                avatar_url: null
                            };
                        }
                    }
                } else {
                    console.log(`Direct profile lookup successful for new post`);
                    newPost.profile = profileData;
                }
                
                // Create the post element
                const postElement = createPostElement(newPost, actualUserId);
                
                // Add animation class
                postElement.style.opacity = '0';
                postElement.style.transform = 'translateY(20px)';
                postElement.style.transition = 'opacity 0.3s, transform 0.3s';
                
                // Add to the beginning of the posts container
                if (postsContainer.firstChild) {
                    postsContainer.insertBefore(postElement, postsContainer.firstChild);
                } else {
                    postsContainer.appendChild(postElement);
                }
                
                // Trigger animation
                setTimeout(() => {
                    postElement.style.opacity = '1';
                    postElement.style.transform = 'translateY(0)';
                }, 10);
            }
            
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post: ' + error.message);
        } finally {
            // Re-enable the button
            postSubmitButton.disabled = false;
            postSubmitButton.textContent = 'Post';
        }
    });
}

// Load posts from the database
async function loadPosts() {
    console.log("Starting to load posts...");
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
        console.error('Posts container not found');
        return;
    }

    try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('User not authenticated');
            window.location.href = '../login page/login.html';
            return;
        }
        console.log("Current user ID:", user.id);

        // First, display a loading state
        postsContainer.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 text-center">
                <div class="animate-pulse flex flex-col items-center">
                    <div class="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2.5"></div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
                <p class="text-gray-500 dark:text-gray-400 mt-4">Loading posts...</p>
            </div>
        `;

        // Fetch posts with proper ordering
        console.log("Fetching posts from database...");
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }

        // Clear existing posts
        postsContainer.innerHTML = '';
        
        if (!posts || posts.length === 0) {
            console.log("No posts found");
            postsContainer.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 text-center">
                    <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p class="text-gray-500 dark:text-gray-400 mb-2">No posts yet.</p>
                    <p class="text-primary-500 dark:text-primary-400 font-medium">Be the first to share something!</p>
                </div>
            `;
            return;
        }

        console.log(`Fetched ${posts.length} posts, now loading profiles for each...`);

        // For each post, fetch the corresponding profile
        for (const post of posts) {
            try {
                console.log(`Processing post ${post.id}, user_id: ${post.user_id}`);
                
                // First try direct lookup
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', post.user_id)
                    .single();
                
                if (profileError) {
                    console.log(`Direct profile lookup failed, trying to load all profiles...`);
                    
                    // Try to get all profiles and find a match - this is inefficient but works for small datasets
                    const { data: allProfiles, error: allProfilesError } = await supabase
                        .from('profiles')
                        .select('*')
                        .limit(100);
                        
                    if (allProfilesError || !allProfiles || allProfiles.length === 0) {
                        console.log(`Could not find any profiles, using generic placeholder`);
                        const shortId = post.user_id.substring(0, 4);
                        post.profile = { 
                            full_name: `User ${shortId}`,
                            username: null,
                            avatar_url: null
                        };
                    } else {
                        // Look for a profile that might match this user in any way
                        const matchedProfile = allProfiles.find(p => 
                            p.id === post.user_id || 
                            p.user_id === post.user_id || 
                            p.auth_id === post.user_id);
                        
                        if (matchedProfile) {
                            console.log(`Found matching profile for user ${post.user_id} through search`);
                            post.profile = matchedProfile;
                        } else {
                            console.log(`No matching profile found among ${allProfiles.length} profiles`);
                            const shortId = post.user_id.substring(0, 4);
                            post.profile = { 
                                full_name: `User ${shortId}`,
                                username: null,
                                avatar_url: null
                            };
                        }
                    }
                } else {
                    console.log(`Direct profile lookup successful for user ${post.user_id}`);
                    post.profile = profileData;
                }
                
                // Create and append post element
                const postElement = createPostElement(post, user.id);
                postsContainer.appendChild(postElement);
            } catch (profileFetchError) {
                console.error(`Error processing post ${post.id}:`, profileFetchError);
                // Still create the post element with default/placeholder data
                post.profile = { 
                    full_name: 'Unknown User',
                    username: null,
                    avatar_url: null
                };
                const postElement = createPostElement(post, user.id);
                postsContainer.appendChild(postElement);
            }
        }

    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p class="text-red-500 dark:text-red-400 font-medium mb-2">Error loading posts</p>
                <p class="text-gray-500 dark:text-gray-400">Please refresh the page to try again</p>
            </div>
        `;
    }
}

// Create a post element
function createPostElement(post, currentUserId) {
    const postEl = document.createElement('div');
    postEl.className = 'post-card bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 border border-gray-100 dark:border-gray-700';
    postEl.setAttribute('data-post-id', post.id);
    
    // Use the profile data we fetched separately, with fallbacks for each property
    const profileData = post.profile || {};
    const fullName = profileData.full_name || 'Unknown User';
    const username = profileData.username ? `@${profileData.username}` : '';
    
    // Create a default avatar URL if none exists
    let avatarUrl;
    if (profileData.avatar_url) {
        avatarUrl = profileData.avatar_url;
    } else {
        // Use UI Avatars with the name as a fallback
        const namePlaceholder = encodeURIComponent(fullName || 'User');
        avatarUrl = `https://ui-avatars.com/api/?name=${namePlaceholder}&background=random`;
    }
    
    const isOwnPost = post.user_id === currentUserId;
    
    // Format the post date
    let postDate;
    try {
        postDate = new Date(post.created_at).toLocaleString();
    } catch (e) {
        console.error('Error formatting post date:', e);
        postDate = 'Unknown date';
    }

    // Ensure the post content is not null
    const postContent = post.content || '';

    postEl.innerHTML = `
        <div class="flex items-start space-x-4">
            <img src="${avatarUrl}" alt="Profile" class="w-12 h-12 rounded-full profile-photo">
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white">${fullName}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${username} · ${postDate}</p>
                    </div>
                    ${isOwnPost ? `
                        <div class="relative dropdown-container">
                            <button class="post-menu-btn text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 focus:outline-none" aria-label="Post options">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm-2 6a2 2 0 104 0 2 2 0 00-4 0z"></path>
                                </svg>
                            </button>
                            <div class="post-dropdown hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                                <div class="py-1">
                                    <button class="edit-post-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                        </svg>
                                        Edit Post
                                    </button>
                                    <button class="delete-post-btn w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center" data-post-id="${post.id}">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        Delete Post
                                    </button>
                                    <button class="report-post-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                        Report Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="relative dropdown-container">
                            <button class="post-menu-btn text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 focus:outline-none" aria-label="Post options">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm-2 6a2 2 0 104 0 2 2 0 00-4 0z"></path>
                                </svg>
                            </button>
                            <div class="post-dropdown hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                                <div class="py-1">
                                    <button class="report-post-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                        Report Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
                <p class="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">${postContent}</p>
                <div class="mt-4 flex items-center space-x-4">
                    <button class="like-btn flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors" data-post-id="${post.id}">
                        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                        </svg>
                        <span>${post.likes_count || 0}</span>
                    </button>
                    <button class="comment-btn flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors" data-post-id="${post.id}">
                        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>${post.comments_count || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for dropdown menu (for both own posts and other users' posts)
    const menuBtn = postEl.querySelector('.post-menu-btn');
    const dropdown = postEl.querySelector('.post-dropdown');
    
    if (menuBtn && dropdown) {
        // Toggle dropdown menu with smooth animation
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // If dropdown is hidden, show it
            if (dropdown.classList.contains('hidden')) {
                dropdown.classList.remove('hidden', 'closing');
                menuBtn.classList.add('active');
                
                // Add click outside listener to close the dropdown
                setTimeout(() => {
                    window.addEventListener('click', function closeDropdown(e) {
                        if (!dropdown.contains(e.target) && e.target !== menuBtn) {
                            closeDropdownWithAnimation();
                            window.removeEventListener('click', closeDropdown);
                        }
                    });
                }, 0);
            } else {
                // If dropdown is visible, close it with animation
                closeDropdownWithAnimation();
            }
        });
        
        // Function to close dropdown with animation
        function closeDropdownWithAnimation() {
            dropdown.classList.add('closing');
            menuBtn.classList.remove('active');
            setTimeout(() => {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('closing');
            }, 150); // Match this timing with the CSS transition duration
        }
    }

    // Add additional event listeners based on post ownership
    if (isOwnPost) {
        // Delete button
        const deleteBtn = postEl.querySelector('.delete-post-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deletePost(post.id);
            });
        }
        
        // Edit button
        const editBtn = postEl.querySelector('.edit-post-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                editPost(post);
            });
        }
    }
    
    // Report button (available for all posts)
    const reportBtn = postEl.querySelector('.report-post-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            reportPost(post.id);
        });
    }
    
    // Like button
    const likeBtn = postEl.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            toggleLike(post.id, currentUserId);
        });
    }
    
    return postEl;
}

// Delete a post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    try {
        console.log('Attempting to delete post:', postId);
        
        // Get current user for verification
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        // Find the post element in the DOM before deleting from database
        const postElement = document.querySelector(`.post-item[data-post-id="${postId}"]`);
        
        // Perform the delete operation
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) {
            console.error('Deletion error:', error);
            throw error;
        }
        
        console.log('Post deleted successfully');
        
        // Remove the post from the DOM if found
        if (postElement) {
            // Add a fade-out animation
            postElement.style.transition = 'opacity 0.3s, transform 0.3s';
            postElement.style.opacity = '0';
            postElement.style.transform = 'translateY(-10px)';
            
            // Remove the element after animation completes
            setTimeout(() => {
                postElement.remove();
                
                // If no posts left, show "no posts" message
                const postsContainer = document.getElementById('posts-container');
                if (postsContainer && !postsContainer.querySelector('.post-item')) {
                    postsContainer.innerHTML = `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No posts yet. Be the first to post!</p>
                        </div>
                    `;
                }
            }, 300);
        }
        
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post: ' + error.message);
    }
}

// Toggle like on a post
async function toggleLike(postId, userId) {
    try {
        const likeButton = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
        const countSpan = likeButton?.querySelector('span');
        if (!countSpan) return;
        
        // Get current count
        let currentCount = parseInt(countSpan.textContent) || 0;
        
        // Show visual feedback immediately
        likeButton.classList.add('animate-pulse');
        
        // Check if post is already liked using a robust approach
        let isLiked = false;
        try {
            // Try to directly check post likes
            const { data: postLikes, error: likesError } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', userId);
                
            if (!likesError && postLikes && postLikes.length > 0) {
                isLiked = true;
            }
        } catch (checkError) {
            console.warn('Error checking likes, using fallback approach:', checkError);
            // Continue with fallback approach - visual feedback only
        }
            
        try {
            if (isLiked) {
                // Unlike the post - update UI immediately
                countSpan.textContent = Math.max(0, currentCount - 1);
                likeButton.classList.remove('text-blue-500');
                likeButton.classList.add('text-gray-500');
                
                // Unlike in database
                await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId);
            } else {
                // Like the post - update UI immediately
                countSpan.textContent = currentCount + 1;
                likeButton.classList.remove('text-gray-500');
                likeButton.classList.add('text-blue-500');
                
                // Like in database
                await supabase
                    .from('post_likes')
                    .insert([{ post_id: postId, user_id: userId }]);
            }
            
            // Try to update post's like count in database
            await manualUpdateLikesCount(postId);
            
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert UI changes on error
            if (isLiked) {
                countSpan.textContent = currentCount;
                likeButton.classList.add('text-blue-500');
                likeButton.classList.remove('text-gray-500');
            } else {
                countSpan.textContent = currentCount;
                likeButton.classList.remove('text-blue-500');
                likeButton.classList.add('text-gray-500');
            }
        } finally {
            // Remove the animation class
            setTimeout(() => {
                likeButton.classList.remove('animate-pulse');
            }, 500);
        }

    } catch (error) {
        console.error('Error in toggleLike function:', error);
    }
}

// Fallback function to manually update likes count
async function manualUpdateLikesCount(postId) {
    try {
        // Get the current count of likes
        const { data: likesCount, error: countError } = await supabase
            .from('post_likes')
            .select('id', { count: 'exact' })
            .eq('post_id', postId);
        
        if (countError) {
            console.warn('Error counting likes:', countError);
            return;
        }
        
        // Update the post with the new count
        const { error: updateError } = await supabase
            .from('posts')
            .update({ likes_count: likesCount ? likesCount.length : 0 })
            .eq('id', postId);
            
        if (updateError) {
            console.warn('Error updating likes count:', updateError);
        }
    } catch (error) {
        console.error('Error in manual likes update:', error);
    }
}

// Edit a post
async function editPost(post) {
    // Create a modal for editing the post
    const modalHtml = `
        <div id="edit-post-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-900">Edit Post</h3>
                    <button id="close-edit-modal" class="text-gray-400 hover:text-gray-600 focus:outline-none">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-4">
                    <form id="edit-post-form">
                        <textarea 
                            id="edit-post-content" 
                            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors"
                            rows="6"
                        >${post.content}</textarea>
                        <div class="flex justify-end mt-4 space-x-3">
                            <button 
                                type="button" 
                                id="cancel-edit-post" 
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                id="save-edit-post" 
                                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Get elements
    const modal = document.getElementById('edit-post-modal');
    const closeBtn = document.getElementById('close-edit-modal');
    const cancelBtn = document.getElementById('cancel-edit-post');
    const form = document.getElementById('edit-post-form');
    const contentField = document.getElementById('edit-post-content');
    
    // Focus on the content area
    contentField.focus();
    
    // Function to close the modal
    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modalContainer.remove();
        }, 300);
    };
    
    // Add event listeners
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedContent = contentField.value.trim();
        if (!updatedContent) return;
        
        const saveBtn = document.getElementById('save-edit-post');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        try {
            // Update the post in the database
            const { error } = await supabase
                .from('posts')
                .update({ content: updatedContent })
                .eq('id', post.id);
                
            if (error) throw error;
            
            // Update the post in the DOM
            const postElement = document.querySelector(`.post-item[data-post-id="${post.id}"]`);
            if (postElement) {
                const contentEl = postElement.querySelector('p.mt-2.text-gray-700');
                if (contentEl) {
                    contentEl.textContent = updatedContent;
                    
                    // Add a highlight effect to show the update
                    contentEl.classList.add('bg-yellow-50');
                    setTimeout(() => {
                        contentEl.classList.remove('bg-yellow-50');
                        contentEl.classList.add('transition-colors', 'duration-1000');
                    }, 50);
                }
            }
            
            closeModal();
            
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post: ' + error.message);
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Prevent closing when clicking inside the modal content
    modal.querySelector('.bg-white').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Add escape key to close
    document.addEventListener('keydown', function escapeClose(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeClose);
        }
    });
}

// Report a post
async function reportPost(postId) {
    // Create a modal for reporting
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
    modalContainer.id = 'report-modal';
    
    modalContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative">
            <button type="button" class="close-modal absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Report Post</h3>
            <form id="report-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <select id="report-reason" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Select a reason</option>
                        <option value="spam">Spam</option>
                        <option value="harassment">Harassment or bullying</option>
                        <option value="inappropriate">Inappropriate content</option>
                        <option value="violence">Violence or harmful content</option>
                        <option value="fraud">Fraud or scam</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Additional Details (optional)</label>
                    <textarea id="report-details" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="4" placeholder="Please provide any additional information that will help us understand your report"></textarea>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="cancel-report px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">Submit Report</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Handle close modal
    const closeModal = () => {
        modalContainer.classList.add('fade-out');
        setTimeout(() => {
            modalContainer.remove();
        }, 300);
    };
    
    // Add event listeners for modal controls
    modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
    modalContainer.querySelector('.cancel-report').addEventListener('click', closeModal);
    
    // Handle outside click
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
    
    // Handle form submission
    const reportForm = document.getElementById('report-form');
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reason = document.getElementById('report-reason').value;
        const details = document.getElementById('report-details').value;
        
        if (!reason) {
            alert('Please select a reason for your report');
            return;
        }
        
        try {
            // Show submitting state
            const submitBtn = reportForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            // Get the current user ID
            const { data: { user } } = await supabase.auth.getUser();
            
            // Insert directly into the post_reports table
            const { data, error } = await supabase
                .from('post_reports')
                .insert({
                    post_id: postId,
                    reported_by: user.id,
                    reason: reason,
                    details: details || null
                    // status will default to 'pending' via trigger
                })
                .select('id')
                .single();
            
            if (error) throw error;
            
            console.log('Report submitted successfully:', data);
            
            // Close the modal
            closeModal();
            
            // Show success message
            const successToast = document.createElement('div');
            successToast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
            successToast.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Report submitted successfully</span>
                </div>
            `;
            
            document.body.appendChild(successToast);
            
            // Remove the toast after 3 seconds
            setTimeout(() => {
                successToast.classList.add('fade-out');
                setTimeout(() => {
                    successToast.remove();
                }, 300);
            }, 3000);
            
        } catch (error) {
            console.error('Error submitting report:', error);
            
            // Provide a more user-friendly error message
            let errorMessage = 'Failed to submit report';
            
            if (error.message) {
                // Extract the more specific error message if available
                errorMessage += ': ' + error.message;
            } else if (error.details) {
                errorMessage += ': ' + error.details;
            }
            
            alert(errorMessage);
            
            // Re-enable the submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Export functions that might be needed elsewhere
export { loadPosts, createPostElement }; 