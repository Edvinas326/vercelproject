// Student Dashboard Module
(function() {
    // Local storage keys - kept inside closure to avoid global conflicts
    const LOCAL_CURRENT_USER_KEY = 'current_user';
    const LOCAL_PROFILES_KEY = 'local_profiles';

    document.addEventListener('DOMContentLoaded', () => {
        console.log('Student dashboard loaded');
        
        // Check if user is authenticated and is a student
        const sessionData = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
        if (!sessionData) {
            console.error('No user session found');
            window.location.href = '../../login page/login.html';
            return;
        }
        
        const session = JSON.parse(sessionData);
        
        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            console.log('Session expired');
            localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
            window.location.href = '../../login page/login.html';
            return;
        }
        
        const user = session.user;
        if (!user || !user.id) {
            console.error('Invalid user in session');
            window.location.href = '../../login page/login.html';
            return;
        }
        
        // Check if user is a student
        const userRole = user.user_metadata?.role;
        if (userRole !== 'student') {
            console.error('User is not a student, redirecting');
            window.location.href = '../index.html';
            return;
        }
        
        console.log('Student user verified:', user);
        
        // Update profile display
        updateStudentProfile(user);
        
        // Setup logout button
        const signoutButton = document.getElementById('signout-button');
        if (signoutButton) {
            signoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
                window.location.href = '../../login page/login.html';
            });
        }
        
        // Setup user menu dropdown
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }
        
        // Setup dark mode toggle
        const html = document.documentElement;
        const toggle = document.getElementById('darkModeToggle');
        const sunIcon = toggle.querySelector('svg:nth-child(1)');
        const moonIcon = toggle.querySelector('svg:nth-child(2)');

        function setIcons() {
            if (html.classList.contains('dark')) {
                sunIcon.style.display = '';
                moonIcon.style.display = 'none';
            } else {
                sunIcon.style.display = 'none';
                moonIcon.style.display = '';
            }
        }

        function setDarkMode(enabled) {
            if (enabled) {
                html.classList.add('dark');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                html.classList.remove('dark');
                localStorage.setItem('darkMode', 'disabled');
            }
            setIcons();
        }

        // Initial mode
        const saved = localStorage.getItem('darkMode');
        if (saved === 'enabled') {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }

        toggle.addEventListener('click', function () {
            setDarkMode(!html.classList.contains('dark'));
        });

        // Load and display all posts
        loadAndDisplayPosts();
    });

    // Function to update student profile information
    function updateStudentProfile(user) {
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        const sidebarProfileImage = document.getElementById('sidebar-profile-image');
        
        if (userName) {
            userName.textContent = user.user_metadata?.full_name || 'Student';
        }
        
        if (userAvatar) {
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'Student')}&background=random`;
        }
        
        if (sidebarProfileImage) {
            sidebarProfileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'Student')}&background=random`;
        }
    }

    // Function to load and display all posts
    async function loadAndDisplayPosts() {
        const postsFeed = document.querySelector('.posts-feed');
        if (!postsFeed) return;
        postsFeed.innerHTML = '<div class="text-gray-400 text-center py-8">Loading posts...</div>';

        try {
            // Use Supabase to fetch posts
            const { createClient } = window.supabase || {};
            let supabaseClient;
            if (createClient) {
                // If using CDN
                supabaseClient = createClient(
                    'https://btlkhjvfgotdspjucqhh.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGtoanZmZ290ZHNwanVjcWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDU4OTIsImV4cCI6MjA2MjIyMTg5Mn0.QRw30CjtxaWrwihv2hmEo9SdvaKKjYQcpeTQwWkq2T4'
                );
            } else if (window.supabase) {
                supabaseClient = window.supabase;
            } else if (window.default && window.default.from) {
                supabaseClient = window.default;
            } else if (window.supabase && window.supabase.from) {
                supabaseClient = window.supabase;
            } else if (window.createClient) {
                supabaseClient = window.createClient(
                    'https://btlkhjvfgotdspjucqhh.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGtoanZmZ290ZHNwanVjcWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDU4OTIsImV4cCI6MjA2MjIyMTg5Mn0.QRw30CjtxaWrwihv2hmEo9SdvaKKjYQcpeTQwWkq2T4'
                );
            } else {
                // Try import from /supabase-config.js
                try {
                    const module = await import('/supabase-config.js');
                    supabaseClient = module.default;
                } catch (e) {
                    postsFeed.innerHTML = '<div class="text-red-500 text-center py-8">Could not load posts (Supabase not found)</div>';
                    return;
                }
            }

            const { data: posts, error } = await supabaseClient
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!posts || posts.length === 0) {
                postsFeed.innerHTML = '<div class="text-gray-400 text-center py-8">No posts yet.</div>';
                return;
            }

            postsFeed.innerHTML = '';
            posts.forEach(post => {
                postsFeed.innerHTML += renderPost(post);
            });
        } catch (err) {
            postsFeed.innerHTML = '<div class="text-red-500 text-center py-8">Failed to load posts.</div>';
            console.error('Error loading posts:', err);
        }
    }

    // Function to render a post as HTML (matching teacher look)
    function renderPost(post) {
        // Simulate profile data for demo; in production, fetch from profiles table
        const profileData = post.profile || {};
        const fullName = profileData.full_name || post.author_name || 'Unknown User';
        const username = profileData.username ? `@${profileData.username}` : (post.author_username ? `@${post.author_username}` : '');
        let avatarUrl;
        if (profileData.avatar_url) {
            avatarUrl = profileData.avatar_url;
        } else {
            const namePlaceholder = encodeURIComponent(fullName || 'User');
            avatarUrl = `https://ui-avatars.com/api/?name=${namePlaceholder}&background=random`;
        }
        const currentUserId = JSON.parse(localStorage.getItem('current_user')).user.id;
        const isOwnPost = post.user_id === currentUserId;
        let postDate;
        try {
            postDate = new Date(post.created_at).toLocaleString();
        } catch (e) {
            postDate = 'Unknown date';
        }
        const postContent = post.content || '';
        return `
        <div class="post-card bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 ease-in-out" data-post-id="${post.id}">
            <div class="flex items-start space-x-4">
                <img src="${avatarUrl}" alt="Profile" class="w-12 h-12 rounded-full profile-photo">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">${fullName}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${username} · ${postDate}</p>
                        </div>
                        <div class="relative dropdown-container">
                            <button class="post-menu-btn text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none" aria-label="Post options">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm-2 6a2 2 0 104 0 2 2 0 00-4 0z"></path>
                                </svg>
                            </button>
                            <div class="post-dropdown hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                                <div class="py-1">
                                    ${isOwnPost ? `
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
                                    ` : ''}
                                    <button class="report-post-btn w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                        Report Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">${postContent}</p>
                    <div class="mt-4 flex items-center space-x-4">
                        <button class="like-btn flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" data-post-id="${post.id}">
                            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            <span>${post.likes_count || 0}</span>
                        </button>
                        <button class="comment-btn flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" data-post-id="${post.id}">
                            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            <span>${post.comments_count || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // Event delegation for like, reply, and report buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.like-btn')) {
            const postId = e.target.closest('.like-btn').dataset.postId;
            console.log('Like clicked for post', postId);
            // TODO: Implement like functionality
        } else if (e.target.closest('.reply-btn')) {
            const postId = e.target.closest('.reply-btn').dataset.postId;
            console.log('Reply clicked for post', postId);
            // TODO: Implement reply functionality (e.g., open reply box)
        } else if (e.target.closest('.report-btn')) {
            const postId = e.target.closest('.report-btn').dataset.postId;
            console.log('Report clicked for post', postId);
            // TODO: Implement report functionality (e.g., open report modal)
        }
    });
})(); 