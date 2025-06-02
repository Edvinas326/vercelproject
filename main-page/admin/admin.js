// Admin Dashboard Module
(function() {
    // Local storage keys - kept inside closure to avoid global conflicts
    const LOCAL_CURRENT_USER_KEY = 'current_user';
    const LOCAL_PROFILES_KEY = 'local_profiles';

    document.addEventListener('DOMContentLoaded', () => {
        console.log('Admin dashboard loaded');
        
        // DIAGNOSTIKOS REŽIMAS - išjungiame automatinį peradresavimą
        const DIAGNOSTICS_MODE = false; // Changed to false to allow proper redirection
        
        // Funkcija peradresavimui, kuri gali būti išjungta diagnostikos režime
        function redirectTo(url) {
            if (DIAGNOSTICS_MODE) {
                console.error('DIAGNOSTIKA: Būtų peradresuota į ' + url);
                return false;
            } else {
                window.location.href = url;
                return true;
            }
        }
        
        // Funkcija, kuri sukuria fiktyvią admin sesiją
        function createFakeAdminSession() {
            try {
                const adminId = 'admin-' + Date.now();
                // Sukuriame fiktyvią admin sesiją
                const fakeSession = {
                    user: {
                        id: adminId,
                        email: 'edvinassaulenas1@gmail.com',
                        user_metadata: { role: 'admin' }
                    },
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dienų galiojimas
                };
                
                // Išsaugome sesiją localStorage
                localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(fakeSession));
                console.log('Sesijos duomenys sukurti', fakeSession);
                
                // Atnaujinti profilį local_profiles
                let profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
                
                // Sukuriame arba atnaujiname admin profilį
                const adminProfile = {
                    id: adminId,
                    full_name: 'Administratorius',
                    username: 'admin',
                    email: 'edvinassaulenas1@gmail.com',
                    role: 'admin',
                    avatar_url: 'https://ui-avatars.com/api/?name=Admin&background=red',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                // Ieškome ar jau yra profilis su šiuo ID arba el. paštu
                const existingIndex = profiles.findIndex(p => 
                    p.id === adminId || 
                    p.email === 'edvinassaulenas1@gmail.com'
                );
                
                if (existingIndex >= 0) {
                    // Atnaujiname esamą profilį
                    profiles[existingIndex] = {
                        ...profiles[existingIndex],
                        ...adminProfile
                    };
                } else {
                    // Pridedame naują profilį
                    profiles.push(adminProfile);
                }
                
                localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
                console.log('Profilis atnaujintas localStorage', adminProfile);
                
                return true;
            } catch (e) {
                console.error('Klaida kuriant sesiją:', e);
                return false;
            }
        }
        
        // Check if user is authenticated and is an admin
        const sessionData = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
        if (!sessionData) {
            console.error('No user session found');
            // Try to create a new admin session
            if (createFakeAdminSession()) {
                console.log('Created new admin session');
            } else {
                return redirectTo('../../login page/login.html');
            }
        }
        
        let session;
        try {
            session = JSON.parse(sessionData);
            console.log('Sesijos duomenys:', session);
        } catch (e) {
            console.error('Klaida analizuojant sesijos duomenis:', e);
            // Try to create a new admin session
            if (createFakeAdminSession()) {
                console.log('Created new admin session');
            } else {
                return redirectTo('../../login page/login.html');
            }
        }
        
        // Check if session is expired
        const expiresAt = new Date(session.expires_at);
        const now = new Date();
        if (expiresAt < now) {
            console.log('Session expired. Expires at:', expiresAt, 'Current time:', now);
            // Try to create a new admin session
            if (createFakeAdminSession()) {
                console.log('Created new admin session');
            } else {
                localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
                return redirectTo('../../login page/login.html');
            }
        }
        
        const user = session.user;
        if (!user || !user.id) {
            console.error('Invalid user in session. User:', user);
            // Try to create a new admin session
            if (createFakeAdminSession()) {
                console.log('Created new admin session');
            } else {
                return redirectTo('../../login page/login.html');
            }
        }
        
        // Check if user is an admin - check both user_metadata and profiles table
        const userRole = user.user_metadata?.role;
        console.log('User metadata:', user.user_metadata);
        console.log('User role from metadata:', userRole);
        
        const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
        console.log('All profiles:', profiles);
        
        const userProfile = profiles.find(p => p.id === user.id);
        console.log('User profile:', userProfile);
        
        const profileRole = userProfile?.role;
        console.log('Profile role:', profileRole);
        
        // Allow admin access if either the metadata or profile has admin role
        if (userRole !== 'admin' && profileRole !== 'admin') {
            console.error('User is not an admin, redirecting. User role:', userRole, 'Profile role:', profileRole);
            // Try to create a new admin session
            if (createFakeAdminSession()) {
                console.log('Created new admin session');
            } else {
                return redirectTo('../main-page.html');
            }
        }
        
        console.log('Admin user verified:', user);
        
        // Setup logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            console.log('Found logout button, adding click handler');
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Logout button clicked');
                // Clear all admin-related data
                localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
                localStorage.removeItem(LOCAL_PROFILES_KEY);
                // Redirect to login page
                redirectTo('../../login page/login.html');
            });
        } else {
            console.error('Logout button not found');
        }
        
        // Setup dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const isDarkMode = document.documentElement.classList.toggle('dark');
                localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
                
                // Update icons
                const sunIcon = darkModeToggle.querySelector('svg:first-of-type');
                const moonIcon = darkModeToggle.querySelector('svg:last-of-type');
                
                if (sunIcon && moonIcon) {
                    sunIcon.style.display = isDarkMode ? 'block' : 'none';
                    moonIcon.style.display = isDarkMode ? 'none' : 'block';
                }
            });
        }
        
        // Show local storage notice
        const noticeElement = document.createElement('div');
        noticeElement.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-center py-1 text-white text-sm';
        noticeElement.textContent = '⚠️ Local Storage Mode: Your data is stored in this browser only';
        document.body.prepend(noticeElement);
    });
})(); 