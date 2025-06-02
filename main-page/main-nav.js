// Function to load the main navigation bar
function loadMainNav() {
    // Load the navigation HTML
    fetch('main-nav.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load navigation');
            }
            return response.text();
        })
        .then(html => {
            // Insert the navigation HTML
            const navContainer = document.querySelector('.main-nav-container');
            if (navContainer) {
                navContainer.innerHTML = html;
                
                // Set up dark mode toggle
                const darkModeToggle = document.getElementById('darkModeToggle');
                if (darkModeToggle) {
                    darkModeToggle.addEventListener('click', () => {
                        const isDarkMode = document.documentElement.classList.toggle('dark');
                        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
                        
                        // Update icon visibility
                        const sunIcon = darkModeToggle.querySelector('svg:first-of-type');
                        const moonIcon = darkModeToggle.querySelector('svg:last-of-type');
                        
                        if (isDarkMode) {
                            sunIcon.style.display = 'block';
                            moonIcon.style.display = 'none';
                        } else {
                            sunIcon.style.display = 'none';
                            moonIcon.style.display = 'block';
                        }
                    });
                }

                // Set up logout button
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', () => {
                        // Clear user data from localStorage
                        localStorage.removeItem('current_user');
                        localStorage.removeItem('local_profiles');
                        
                        // Redirect to login page
                        window.location.href = '/login-page/loginpage.html';
                    });
                }
            } else {
                console.error('Navigation container not found');
            }
        })
        .catch(error => {
            console.error('Error loading navigation:', error);
            // Add error handling to show a message if the navigation fails to load
            const navContainer = document.querySelector('.main-nav-container');
            if (navContainer) {
                navContainer.innerHTML = '<div class="p-4 text-red-600">Error loading navigation. Please refresh the page.</div>';
            }
        });
}

// Load the navigation when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMainNav);
} else {
    loadMainNav();
} 