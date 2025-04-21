const SUPABASE_URL = 'https://llymgjymayusaengcdvy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1nanltYXl1c2FlbmdjZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTA5OTMsImV4cCI6MjA1NTM4Njk5M30.nye3BqcpHJmcSt1KKu6aioaP4NyhyutLcxSnr5Gv_-M'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

document.addEventListener("DOMContentLoaded", () => {
    // Add null checks for elements
    const signupForm = document.getElementById('signup-form');
    const roleSelect = document.getElementById('signup-role');
    const classSelection = document.getElementById('class-selection');
    const verificationDiv = document.getElementById('verification-code-div');
    
    // Check if elements exist before adding listeners
    if (!signupForm || !roleSelect || !classSelection || !verificationDiv) {
        console.error('Required elements not found');
        return;
    }
    
    // Verification codes with additional school information
    const VERIFICATION_CODES = {
        'teacher': {
            codes: {
                'TEACH2024_SCH1': {
                    schoolName: 'School One',
                    department: 'General',
                    expiresAt: '2024-12-31'
                },
                'TEACH2024_SCH2': {
                    schoolName: 'School Two',
                    department: 'General',
                    expiresAt: '2024-12-31'
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
    roleSelect.addEventListener('change', () => {
        const role = roleSelect.value;
        if (role === 'student' || role === 'parent') {
            classSelection.classList.remove('hidden');
            verificationDiv.classList.add('hidden');
        } else if (role === 'teacher') {
            classSelection.classList.add('hidden');
            verificationDiv.classList.remove('hidden');
        } else {
            classSelection.classList.add('hidden');
            verificationDiv.classList.add('hidden');
        }
    });

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const role = document.getElementById('signup-role').value;
            const classGroup = document.getElementById('signup-class').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            // Basic validation
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            try {
                console.log('Signing up with data:', { firstName, lastName, email, role }); // Debug log
                
                // Sign up the user with Supabase
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            username: username,
                            role: role,
                            class: classGroup
                        }
                    }
                })
                
                if (error) throw error
                
                console.log('Signup data:', {
                    user: data.user,
                    metadata: data.user?.user_metadata
                });
                
                showSuccess('Account created successfully! Redirecting to login...');
                
                // Clear the form
                signupForm.reset();
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = '../login page/login.html';
                }, 2000);
                
            } catch (error) {
                console.error('Signup error:', error); // Debug log
                showError('Error creating account: ' + error.message);
            }
        });
    }

    // Helper functions
    function showError(message) {
        const messageElement = document.getElementById('signup-message');
        messageElement.style.color = 'red';
        messageElement.innerText = message;
    }

    function showSuccess(message) {
        const messageElement = document.getElementById('signup-message');
        messageElement.style.color = 'green';
        messageElement.innerText = message;
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