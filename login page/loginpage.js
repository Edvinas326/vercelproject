// Using Supabase for authentication
import supabase from '../supabase-config.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");
    const loginContainer = document.getElementById('login-container');
    const signupSection = document.getElementById('signup-section');

    // Test directory access
    const testDirectories = () => {
        console.log("Current location:", window.location.href);
        console.log("Testing directory access...");
        
        // Test main page path
        fetch('../main-page/main-page.html', { method: 'HEAD' })
            .then(() => console.log("Main page accessible"))
            .catch(() => console.log("Main page NOT accessible"));
            
        // Test teacher dashboard path
        fetch('../main-page/teacher/dashboard.html', { method: 'HEAD' })
            .then(() => console.log("Teacher dashboard accessible"))
            .catch(() => console.log("Teacher dashboard NOT accessible"));
            
        // Test admin dashboard path
        fetch('../main-page/admin/admin.html', { method: 'HEAD' })
            .then(() => console.log("Admin dashboard accessible"))
            .catch(() => console.log("Admin dashboard NOT accessible"));
    };
    
    // Run directory tests
    testDirectories();
    
    // Add this function for smooth page transitions
    function navigateToPage(url) {
        console.log("Navigating to:", url);
        document.body.classList.add('fade-out');
        setTimeout(() => {
            console.log("Navigation timeout completed, changing location to:", url);
            window.location.href = url;
        }, 500); // Match this with your CSS transition duration
    }

    // Helper function to create a profile for a user if it doesn't exist
    async function ensureUserProfile(user) {
        // Check if profile exists
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
            
        if (error) {
            console.error('Error checking profile:', error);
            return null;
        }
        
        if (data) {
            console.log('User profile exists:', data);
            return data;
        }
        
        // Create profile if it doesn't exist
        console.log('Creating new profile for user:', user);
        
        const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email,
            username: user.user_metadata?.username || user.email.split('@')[0],
            email: user.email,
            role: user.user_metadata?.role || 'student',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
            
        if (profileError) {
            console.error('Error creating profile:', profileError);
            return null;
        }
        
        console.log('Profile created:', profile);
        return profile;
    }

    // Event listener for login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Show loading state
            const messageEl = document.getElementById('login-message');
            messageEl.style.color = 'blue';
            messageEl.innerText = 'Logging in...';

            // Use Supabase for authentication
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    console.error('Login error:', error.message);
                    messageEl.style.color = 'red';
                    messageEl.innerText = error.message || 'Invalid email or password';
                    return;
                }
                
                if (data && data.user) {
                    console.log('User signed in:', data.user);
                    console.log('User metadata:', data.user.user_metadata);
                    
                    // Store user session in localStorage
                    localStorage.setItem('current_user', JSON.stringify({
                        user: data.user,
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
                    }));
                    
                    // Ensure user has a profile
                    const userProfile = await ensureUserProfile(data.user);
                    
                    // Determine user role from profile (preferred) or metadata
                    let userRole = 'student'; // Default role
                    
                    if (userProfile && userProfile.role) {
                        userRole = userProfile.role;
                        console.log('User role from profile:', userRole);
                    } else if (data.user.user_metadata && data.user.user_metadata.role) {
                        userRole = data.user.user_metadata.role;
                        console.log('User role from metadata:', userRole);
                    }
                    
                    console.log('Final user role determined:', userRole);
                    
                    // Show success message
                    messageEl.style.color = 'green';
                    messageEl.innerText = 'Login successful!';
                    
                    // Redirect based on user role
                    setTimeout(() => {
                        console.log("Redirecting user with role:", userRole);
                        try {
                            if (userRole === 'teacher') {
                                // Redirect teachers to teacher dashboard
                                navigateToPage('../main-page/teacher/dashboard.html');
                            } else if (userRole === 'admin') {
                                // Redirect admin to admin panel
                                navigateToPage('../main-page/admin/admin.html');
                            } else {
                                // Redirect students to student dashboard
                                navigateToPage('../main-page/student/dashboard.html');
                            }
                            console.log("Redirection initiated");
                        } catch (error) {
                            console.error("Error during redirection:", error);
                            messageEl.style.color = 'red';
                            messageEl.innerText = 'Error during redirection: ' + error.message;
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('Unexpected login error:', error);
                messageEl.style.color = 'red';
                messageEl.innerText = 'An unexpected error occurred';
            }
        });
    }

    // Show signup section
    const showSignupButton = document.getElementById('show-signup');
    if (showSignupButton) {
        showSignupButton.addEventListener('click', () => {
            console.log("Sign up button clicked");
            window.location.href = '../signup page/signup.html';
        });
    }

    // Show login section
    const showLoginButton = document.getElementById('show-login');
    if (showLoginButton) {
        showLoginButton.addEventListener('click', () => {
            signupSection.classList.add('hidden'); // Hide the signup section
            setTimeout(() => {
                loginContainer.classList.remove('hidden'); // Show the login section
            }, 500); // Match this duration with the CSS transition duration
        });
    }

    // Update the signup button click handler
    const signupButton = document.querySelector('button[onclick]');
    if (signupButton) {
        signupButton.removeAttribute('onclick');
        signupButton.addEventListener('click', () => {
            navigateToPage('../signup page/signup.html');
        });
    }
});