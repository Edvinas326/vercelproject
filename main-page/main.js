console.log('main.js loaded')

import supabase from '../supabase-config.js'

// Profile display function
async function loadAndDisplayProfile(userId) {
    try {
        console.log('Loading profile for user:', userId)
        
        // Get user data for email
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            throw error
        }

        console.log('Loaded profile:', profile)

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

    } catch (error) {
        console.error('Error in loadAndDisplayProfile:', error)
    }
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
    console.log('DOM loaded')
    
    try {
        // Check if user is authenticated
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('User:', user)
        
        if (error || !user) {
            console.error('Auth error:', error)
            window.location.href = '../login page/login.html'
            return
        }

        // Load initial profile data
        await loadAndDisplayProfile(user.id)

        // Set up real-time subscription for profile updates
        const channel = supabase.channel('public:profiles')
        
        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Profile changed:', payload)
                    loadAndDisplayProfile(user.id)
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status)
            })

        initializeDarkMode();

    } catch (error) {
        console.error('Error in main.js:', error)
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

// Add listener for profile photo updates
window.addEventListener('profile-photo-updated', (event) => {
    const avatars = document.querySelectorAll('.profile-photo');
    avatars.forEach(avatar => {
        avatar.src = event.detail.photoUrl;
    });
}); 