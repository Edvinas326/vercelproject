// Using Supabase for authentication
import supabase from '../supabase-config.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded for signup page");
    
    // Add null checks for elements
    const signupForm = document.getElementById('signup-form');
    const roleSelect = document.getElementById('signup-role');
    const classSelection = document.getElementById('class-selection');
    const verificationDiv = document.getElementById('verification-code-div');
    
    // Check if elements exist before adding listeners
    if (!signupForm || !roleSelect) {
        console.error('Required elements not found');
        return;
    }
    
    // Debugging - log when signup form is found
    console.log("Signup form found:", signupForm);
    
    // Optional elements
    if (!classSelection) {
        console.warn('Class selection element not found');
    }
    
    if (!verificationDiv) {
        console.warn('Verification div element not found');
    }
    
    // Verification codes with additional school information
    const VERIFICATION_CODES = {
        'teacher': {
            codes: {
                'TEACH2025_SCH1': {
                    schoolName: 'School One',
                    department: 'General',
                    expiresAt: '2025-12-31'
                },
                'TEACH2025_SCH2': {
                    schoolName: 'School Two',
                    department: 'General',
                    expiresAt: '2025-12-31'
                }
            },
            maxAttempts: 3
        }
    };

    // Track verification attempts
    let verificationAttempts = 0;
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Show/hide class selection and verification code based on role
    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            const role = roleSelect.value;
            console.log("Role selected:", role);
            
            if (classSelection) {
                classSelection.classList.add('hidden');
            }
            if (verificationDiv) {
                verificationDiv.classList.add('hidden');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Signup form submitted");
            
            // Show signup in progress
            showMessage('Creating account...', 'blue');
            
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const role = document.getElementById('signup-role').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Log form data for debugging (remove sensitive data in production)
            console.log("Signup data:", { firstName, lastName, username, email, role });
            
            // Make sure the role is valid
            if (!role || !['student', 'teacher', 'admin', 'parent'].includes(role)) {
                showError('Please select a valid role');
                return;
            }
            
            // Get class if element exists
            let classGroup = '';
            const classElement = document.getElementById('signup-class');
            if (classElement) {
                classGroup = classElement.value;
            }

            // Basic validation
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            
            if (!email || !username || !firstName || !lastName) {
                showError('Please fill in all required fields');
                return;
            }
            
            try {
                console.log("Creating user with role:", role);
                
                // Step 1: Create the user in Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`,
                            username: username,
                            role: role,
                            class: classGroup
                        }
                    }
                });
                
                if (authError) {
                    console.error('Supabase signup error:', authError);
                    showError('Error creating account: ' + authError.message);
                    return;
                }
                
                if (!authData?.user) {
                    showError('Failed to create user account');
                    return;
                }
                
                console.log('Auth signup successful:', authData);
                
                // Step 2: Create the profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        full_name: `${firstName} ${lastName}`,
                        username: username,
                        email: email,
                        role: role
                    })
                    .select()
                    .single();
                
                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // Try to update if it already exists
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: authData.user.id,
                            full_name: `${firstName} ${lastName}`,
                            username: username,
                            email: email,
                            role: role
                        })
                        .select()
                        .single();
                    
                    if (updateError) {
                        console.error('Profile update error:', updateError);
                        showError('Account created but profile setup failed. Please try logging in.');
                        return;
                    }
                }
                
                // Store user data in localStorage
                localStorage.setItem('current_user', JSON.stringify({
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: `${firstName} ${lastName}`,
                    username: username,
                    role: role
                }));
                
                // Show success message
                showSuccess('Account created successfully! Redirecting to login...');
                
                // Clear the form
                signupForm.reset();
                
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '../login page/login.html';
                }, 2000);
                
            } catch (error) {
                console.error('Unexpected error during signup:', error);
                showError('An unexpected error occurred. Please try again.');
            }
        });
    }

    // Helper functions
    function showError(message) {
        showMessage(message, 'red');
    }

    function showSuccess(message) {
        showMessage(message, 'green');
    }
    
    function showMessage(message, color) {
        const messageElement = document.getElementById('signup-message');
        if (messageElement) {
            messageElement.style.color = color;
            messageElement.innerText = message;
        } else {
            console.warn('Message element not found:', message);
        }
    }

    function navigateToPage(url) {
        if (!url) {
            console.error('No URL provided for navigation');
            return;
        }
        
        document.body.classList.add('fade-out');
        setTimeout(() => {
            try {
                window.location.href = url;
            } catch (error) {
                console.error('Navigation failed:', error);
                document.body.classList.remove('fade-out');
            }
        }, 500);
    }
});

async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    const username = document.getElementById('username').value;
    
    if (!email || !password || !fullName || !username) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        // Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    username: username,
                    role: 'student'
                }
            }
        });
        
        if (authError) {
            console.error('Auth error:', authError);
            showError(authError.message);
            return;
        }
        
        if (!authData.user) {
            showError('Failed to create user account');
            return;
        }
        
        // The profile will be automatically created by the database trigger
        // We'll verify it was created successfully
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (profileError) {
            console.error('Profile error:', profileError);
            showError('Account created but profile setup failed. Please contact support.');
            return;
        }
        
        if (!profileData) {
            showError('Account created but profile not found. Please contact support.');
            return;
        }
        
        // Store user data in localStorage
        localStorage.setItem('current_user', JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            username: username,
            role: 'student'
        }));
        
        // Show success message
        showSuccess('Account created successfully! Redirecting to login...');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = '/login-page/loginpage.html';
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError('An unexpected error occurred. Please try again.');
    }
} 