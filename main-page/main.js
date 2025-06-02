// Main Page Module
(function() {
    console.log('main.js loaded')

    // Local storage keys
    const LOCAL_CURRENT_USER_KEY = 'current_user';
    const LOCAL_PROFILES_KEY = 'local_profiles';
    const LOCAL_POSTS_KEY = 'local_posts';

    // Emergency user creation if none exists
    function ensureUserExists() {
        console.log("Checking if user exists in localStorage...");
        
        const sessionData = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
        
        if (!sessionData) {
            console.log("No user found, creating emergency test user");
            
            // Create a test student user
            const emergencyUser = {
                user: {
                    id: '3',
                    email: 'teststudent@test.com',
                    user_metadata: {
                        first_name: 'Test',
                        last_name: 'Student',
                        username: 'teststudent',
                        role: 'student'
                    }
                },
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };
            
            localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(emergencyUser));
            return emergencyUser;
        }
        
        console.log("User found in localStorage:", JSON.parse(sessionData));
        return JSON.parse(sessionData);
    }

    // Profile display function 
    async function loadAndDisplayProfile(userId) {
        try {
            console.log('Loading profile for user:', userId)
            
            // Get session from localStorage
            const sessionData = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
            if (!sessionData) {
                console.error('No user session found in loadAndDisplayProfile');
                
                // Create an emergency user instead of redirecting
                const emergencySession = ensureUserExists();
                const emergencyUser = emergencySession.user;
                
                // Get profile from localStorage or create one
                const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
                let profile = profiles.find(p => p.id === emergencyUser.id);
                
                // If profile doesn't exist, create a basic one
                if (!profile) {
                    profile = createEmergencyProfile(emergencyUser);
                }
                
                // Display the profile
                displayProfile(profile, emergencyUser);
                return;
            }
            
            const session = JSON.parse(sessionData);
            const user = session.user;
            
            if (!user || !user.id) {
                console.error('Invalid user session in loadAndDisplayProfile');
                
                // Create an emergency user
                const emergencySession = ensureUserExists();
                const emergencyUser = emergencySession.user;
                
                // Get profile from localStorage
                const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
                let profile = profiles.find(p => p.id === emergencyUser.id);
                
                if (!profile) {
                    profile = createEmergencyProfile(emergencyUser);
                }
                
                displayProfile(profile, emergencyUser);
                return;
            }
            
            // Get profile from localStorage
            const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
            let profile = profiles.find(p => p.id === user.id);
            
            // If profile doesn't exist, create a basic one
            if (!profile) {
                profile = createEmergencyProfile(user);
            }
            
            // Display the profile
            displayProfile(profile, user);
            
        } catch (error) {
            console.error('Error in loadAndDisplayProfile:', error);
            
            // Instead of redirecting, try to recover with emergency profile
            const emergencySession = ensureUserExists();
            const emergencyUser = emergencySession.user;
            const emergencyProfile = createEmergencyProfile(emergencyUser);
            displayProfile(emergencyProfile, emergencyUser);
        }
    }
    
    // Create emergency profile
    function createEmergencyProfile(user) {
        console.log('Creating emergency profile for user:', user);
        
        const profile = {
            id: user.id,
            full_name: user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name || 'Emergency User',
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'emergency_user',
            email: user.email || 'emergency@test.com',
            role: user.user_metadata?.role || 'student',
            bio: 'Emergency profile created automatically',
            school: 'Test School',
            grade_level: '12',
            gpa: 3.5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
            
        // Save the new profile
        const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
        const existingProfileIndex = profiles.findIndex(p => p.id === user.id);
        
        if (existingProfileIndex >= 0) {
            profiles[existingProfileIndex] = profile;
        } else {
            profiles.push(profile);
        }
        
        localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
        return profile;
    }

    // Function to display profile data
    function displayProfile(profile, user) {
        console.log('Displaying profile:', profile);
        
        // Update profile elements
        const elements = {
            'profile-name': profile.full_name || 'No name set',
            'profile-username': profile.username ? `@${profile.username}` : 'No username set',
            'profile-school': profile.school || 'No school set',
            'profile-email': user.email || 'No email set',
            'profile-bio': profile.bio || 'Click settings to add a bio',
            'profile-updated': profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never',
            'profile-grade': profile.grade_level || 'Click settings to set grade level',
            'profile-gpa': profile.gpa ? profile.gpa.toFixed(2) + '/4.00' : 'Click settings to set GPA'
        }

        // Update each element if it exists
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id)
            if (element) {
                console.log(`Updating ${id} with value:`, value)
                element.textContent = value
            } else {
                console.log(`Element ${id} not found in the DOM`)
            }
        })

        // Update all profile photos with avatar_url if it exists
        const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=random`
        const avatarUrl = profile.avatar_url || defaultAvatarUrl
        
        // Update all elements with profile-photo class
        const profilePhotos = document.querySelectorAll('.profile-photo')
        profilePhotos.forEach(photo => {
            photo.src = avatarUrl
        })

        // Update navigation bar name
        const userNameElement = document.getElementById('user-name')
        if (userNameElement) {
            userNameElement.textContent = profile.full_name || profile.username || 'User'
        }

        // Check if user is a teacher and show teacher dashboard button
        const userRole = user.user_metadata?.role || profile.role;
        if (userRole === 'teacher') {
            // Show the teacher dashboard container above post box
            const teacherDashboardContainer = document.getElementById('teacher-dashboard-container')
            if (teacherDashboardContainer) {
                teacherDashboardContainer.classList.remove('hidden')
            }
            
            // Hide quick access sidebar for teachers
            const quickAccessSidebar = document.getElementById('quick-access-sidebar')
            if (quickAccessSidebar) {
                quickAccessSidebar.classList.add('hidden')
            }
            
            // Expand the main content area to fill the space where quick access was
            const mainContentArea = document.getElementById('main-content-area')
            if (mainContentArea) {
                mainContentArea.classList.remove('md:col-span-6')
                mainContentArea.classList.add('md:col-span-9')
            }
            
            // Hide academic info cards (GPA and Class Level) for teachers
            const academicInfoCards = document.getElementById('academic-info-cards')
            if (academicInfoCards) {
                academicInfoCards.classList.add('hidden')
            }
            
            // Hide bio section for teachers
            const bioElement = document.getElementById('profile-bio')
            if (bioElement) {
                // Find the parent div that contains the bio (the div with class mb-6)
                const bioContainer = bioElement.closest('.mb-6')
                if (bioContainer) {
                    bioContainer.classList.add('hidden')
                }
            }
        } else if (userRole === 'admin') {
            // Show admin dashboard button
            const teacherDashboardContainer = document.getElementById('teacher-dashboard-container')
            if (teacherDashboardContainer) {
                teacherDashboardContainer.classList.remove('hidden')
                
                // Change the text to indicate it's for admin
                const dashboardTitle = teacherDashboardContainer.querySelector('h2')
                if (dashboardTitle) {
                    dashboardTitle.textContent = 'Administratoriaus režimas'
                }
                
                const dashboardDescription = teacherDashboardContainer.querySelector('p')
                if (dashboardDescription) {
                    dashboardDescription.textContent = 'Valdykite visą sistemą'
                }
                
                // Change the button link
                const dashboardLink = teacherDashboardContainer.querySelector('a')
                if (dashboardLink) {
                    dashboardLink.href = './admin/admin.html'
                }
            }
            
            // Hide quick access sidebar for admin
            const quickAccessSidebar = document.getElementById('quick-access-sidebar')
            if (quickAccessSidebar) {
                quickAccessSidebar.classList.add('hidden')
            }
            
            // Expand the main content area to fill the space where quick access was
            const mainContentArea = document.getElementById('main-content-area')
            if (mainContentArea) {
                mainContentArea.classList.remove('md:col-span-6')
                mainContentArea.classList.add('md:col-span-9')
            }
        }
    }

    // Main initialization
    document.addEventListener("DOMContentLoaded", async () => {
        console.log('DOM loaded')
        
        try {
            // Make sure user exists or create one
            const session = ensureUserExists();
            const user = session.user;
            console.log('Using user:', user);
            
            // Show local storage notice
            const noticeElement = document.createElement('div');
            noticeElement.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-center py-1 text-white text-sm';
            noticeElement.textContent = '⚠️ Local Storage Mode: Your data is stored in this browser only';
            document.body.prepend(noticeElement);
            
            // Load profile data
            await loadAndDisplayProfile(user.id);
            
            // Initialize dark mode
            initializeDarkMode();
            
            // Initialize signout button
            const signoutButton = document.getElementById('signout-button');
            if (signoutButton) {
                signoutButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Signing out...');
                    localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
                    // Use the correct absolute URL to avoid path resolution issues
                    window.open('http://127.0.0.1:5501/login page/login.html', '_self');
                });
            }

        } catch (error) {
            console.error('Error in main.js:', error);
            
            // Create emergency user data to avoid redirect
            ensureUserExists();
            
            // Try again with emergency user
            const emergencySession = ensureUserExists();
            const emergencyUser = emergencySession.user;
            await loadAndDisplayProfile(emergencyUser.id);
        }
    })

    // Dark mode toggle functionality
    function initializeDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;
        
        // Check for saved dark mode preference
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled' || 
                          (localStorage.getItem('darkMode') === null && 
                           window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Set initial icon visibility
        updateDarkModeIcons(darkModeToggle, isDarkMode);

        // Toggle dark mode
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDarkMode = document.documentElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            
            // Force icon visibility update
            updateDarkModeIcons(darkModeToggle, isDarkMode);
        });
    }

    // Helper function to update dark mode icons
    function updateDarkModeIcons(button, isDarkMode) {
        if (!button) return;
        
        const sunIcon = button.querySelector('svg:first-of-type');
        const moonIcon = button.querySelector('svg:last-of-type');
        
        if (isDarkMode) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    // Add this function to update profile photos across the app
    function updateProfilePhotosInUI(photoUrl) {
      // Update all profile photo elements that have the 'profile-photo' class
      const profilePhotos = document.querySelectorAll('.profile-photo');
      profilePhotos.forEach(photo => {
        photo.src = photoUrl;
      });
    }

    // Listen for profile photo updates
    window.addEventListener('profile-photo-updated', (event) => {
      updateProfilePhotosInUI(event.detail.photoUrl);
    });
})(); 