/**
 * login-redirect.js - Handles redirecting to login page from anywhere in the application
 */

// Function to redirect to login page
function redirectToLogin() {
    console.log('Redirecting to login page...');
    
    // Clear authentication data
    localStorage.removeItem('current_user');
    localStorage.removeItem('supabase.auth.token');
    
    try {
        // Try relative path from project root
        window.location.href = './login page/login.html';
    } catch (e) {
        console.error('Error redirecting:', e);
        
        // Fallback: Try with encoded space
        window.location.href = './login%20page/login.html';
    }
}

// Function to handle logout
function handleLogout() {
    // Clear user data
    localStorage.removeItem('current_user');
    localStorage.removeItem('supabase.auth.token');
    
    console.log('User logged out successfully');
    
    // Redirect to login page
    redirectToLogin();
}

// Export functions if using as a module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        redirectToLogin,
        handleLogout
    };
} 