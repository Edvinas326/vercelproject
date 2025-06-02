document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('reset-email-form');
    const resetForm = document.getElementById('new-password-form');
    const emailFormDiv = document.getElementById('email-form');
    const resetFormDiv = document.getElementById('reset-form');

    // Handle email submission
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const messageElement = document.getElementById('email-message');

            try {
                // In a real application, this would be an API call
                // For demo, we'll simulate the process
                const resetToken = generateResetToken();
                localStorage.setItem(`reset_${email}`, JSON.stringify({
                    token: resetToken,
                    expires: Date.now() + (60 * 60 * 1000) // 1 hour expiration
                }));

                // Show success message
                messageElement.style.color = 'green';
                messageElement.textContent = 'Reset link sent! Please check your email.';
                
                // Simulate email sending (in real app, this would be done by the server)
                console.log(`Reset link: ${window.location.origin}/forgot%20password/forgot-password.html?token=${resetToken}&email=${email}`);

                // In a real application, you would make an API call like this:
                /*
                const response = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) throw new Error('Failed to send reset email');
                */

            } catch (error) {
                messageElement.style.color = 'red';
                messageElement.textContent = 'Failed to send reset email. Please try again.';
                console.error('Error:', error);
            }
        });
    }

    // Handle password reset
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const messageElement = document.getElementById('reset-message');

            // Get token and email from URL
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const email = params.get('email');

            if (newPassword !== confirmPassword) {
                messageElement.style.color = 'red';
                messageElement.textContent = 'Passwords do not match';
                return;
            }

            try {
                // Verify token (in real app, this would be done server-side)
                const resetData = JSON.parse(localStorage.getItem(`reset_${email}`));
                
                if (!resetData || resetData.token !== token) {
                    throw new Error('Invalid or expired reset token');
                }

                if (Date.now() > resetData.expires) {
                    throw new Error('Reset token has expired');
                }

                // Update password (in real app, this would be an API call)
                const userData = JSON.parse(localStorage.getItem(email));
                if (userData) {
                    userData.password = newPassword; // In real app, this would be hashed
                    localStorage.setItem(email, JSON.stringify(userData));
                }

                // Clear reset token
                localStorage.removeItem(`reset_${email}`);

                messageElement.style.color = 'green';
                messageElement.textContent = 'Password reset successful!';

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = '../login page/login.html';
                }, 2000);

            } catch (error) {
                messageElement.style.color = 'red';
                messageElement.textContent = error.message || 'Failed to reset password';
                console.error('Error:', error);
            }
        });
    }

    // Check if we're on the reset page with a token
    const params = new URLSearchParams(window.location.search);
    if (params.has('token') && params.has('email')) {
        emailFormDiv.classList.add('hidden');
        resetFormDiv.classList.remove('hidden');
    }
});

// Helper function to generate a reset token
function generateResetToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}