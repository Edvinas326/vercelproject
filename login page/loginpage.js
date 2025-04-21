const SUPABASE_URL = 'https://llymgjymayusaengcdvy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1nanltYXl1c2FlbmdjZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTA5OTMsImV4cCI6MjA1NTM4Njk5M30.nye3BqcpHJmcSt1KKu6aioaP4NyhyutLcxSnr5Gv_-M'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

document.addEventListener("DOMContentLoaded", () => {
    const loginContainer = document.getElementById('login-container');
    const signupSection = document.getElementById('signup-section');

    // Event listener for login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                })
                
                if (error) throw error
                
                // Store the session token
                const session = data.session;
                
                document.getElementById('login-message').style.color = 'green';
                document.getElementById('login-message').innerText = 'Login successful!';
                
                // Redirect to main page with updated path
                setTimeout(() => {
                    navigateToPage('../main-page/main-page.html');
                }, 1000);
                
            } catch (error) {
                document.getElementById('login-message').innerText = 'Invalid email or password: ' + error.message;
            }
        });
    }

    // Show signup section
    const showSignupButton = document.getElementById('show-signup');
    if (showSignupButton) {
        showSignupButton.addEventListener('click', () => {
            loginContainer.classList.add('hidden'); // Hide the login container
            setTimeout(() => {
                signupSection.classList.remove('hidden'); // Show the signup section
            }, 500); // Match this duration with the CSS transition duration
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

    // Add this function for smooth page transitions
    function navigateToPage(url) {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = url;
        }, 500); // Match this with your CSS transition duration
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