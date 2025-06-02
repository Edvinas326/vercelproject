document.addEventListener('DOMContentLoaded', async () => {
    // Local storage keys
    const LOCAL_CURRENT_USER_KEY = 'current_user';
    const LOCAL_PROFILES_KEY = 'local_profiles';

    // Check authentication via localStorage
    const sessionData = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
    if (!sessionData) {
        window.location.href = '../../login page/login.html';
        return;
    }

    const session = JSON.parse(sessionData);
    const user = session.user;
    if (!user || !user.id) {
        window.location.href = '../../login page/login.html';
        return;
    }

    // Get form elements
    const fullNameInput = document.getElementById('fullName');
    const usernameInput = document.getElementById('username');
    const schoolInput = document.getElementById('school');
    const bioInput = document.getElementById('bio');
    const gradeLevelInput = document.getElementById('gradeLevel');
    const gpaInput = document.getElementById('gpa');

    // Get email field and change button
    const emailInput = document.getElementById('email');
    const changeEmailBtn = document.getElementById('changeEmailBtn');

    // Load current profile data
    const loadProfile = async () => {
        try {
            // Get profile from localStorage
            const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
            const profile = profiles.find(p => p.id === user.id);

            if (profile) {
                fullNameInput.value = profile.full_name || '';
                usernameInput.value = profile.username || '';
                schoolInput.value = profile.school || '';
                bioInput.value = profile.bio || '';
                gradeLevelInput.value = profile.grade_level || '';
                gpaInput.value = profile.gpa || '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    // Load current email
    if (user && emailInput) {
        emailInput.value = user.email;
    }

    // Initialize profile data
    await loadProfile();

    // Add debounce function to prevent too many updates
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Function to update profile
    const updateProfile = async (field, value) => {
        try {
            // Get existing profiles
            const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
            
            // Find user profile
            let profile = profiles.find(p => p.id === user.id);
            
            // Create profile if it doesn't exist
            if (!profile) {
                profile = {
                    id: user.id,
                    created_at: new Date().toISOString()
                };
                profiles.push(profile);
            }
            
            // Update the field and updated_at timestamp
            profile[field] = value;
            profile.updated_at = new Date().toISOString();
            
            // Save back to localStorage
            localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
            
            showNotification('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile: ' + error.message, true);
        }
    };

    // Debounced update function
    const debouncedUpdate = debounce((field, value) => {
        updateProfile(field, value);
    }, 500);

    // Add input event listeners
    fullNameInput.addEventListener('input', (e) => {
        debouncedUpdate('full_name', e.target.value);
    });

    usernameInput.addEventListener('input', (e) => {
        debouncedUpdate('username', e.target.value);
    });

    schoolInput.addEventListener('input', (e) => {
        debouncedUpdate('school', e.target.value);
    });

    bioInput.addEventListener('input', (e) => {
        debouncedUpdate('bio', e.target.value);
    });

    gradeLevelInput.addEventListener('change', (e) => {
        debouncedUpdate('grade_level', e.target.value);
    });

    gpaInput.addEventListener('input', (e) => {
        const gpa = parseFloat(e.target.value);
        if (!isNaN(gpa) && gpa >= 0 && gpa <= 4) {
            debouncedUpdate('gpa', gpa);
        }
    });

    // Handle email change
    if (changeEmailBtn) {
        changeEmailBtn.addEventListener('click', async () => {
            const newEmail = prompt('Enter new email address:', user.email);
            
            if (newEmail && newEmail !== user.email) {
                try {
                    // Update email in session
                    const session = JSON.parse(localStorage.getItem(LOCAL_CURRENT_USER_KEY));
                    session.user.email = newEmail;
                    localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(session));
                    
                    // Update email in profile
                    const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
                    const profile = profiles.find(p => p.id === user.id);
                    if (profile) {
                        profile.email = newEmail;
                        localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
                    }
                    
                    // Update UI
                    emailInput.value = newEmail;
                    
                    alert('Email updated successfully!');
                } catch (error) {
                    console.error('Error updating email:', error);
                    alert('Failed to update email. Please try again.');
                }
            }
        });
    }

    // Notification function
    const showNotification = (message, isError = false) => {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
            isError ? 'bg-red-500' : 'bg-green-500'
        } transition-opacity duration-300`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    };

    // Handle profile photo upload
    async function handlePhotoUpload() {
        const fileInput = document.getElementById('photo-upload');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file first');
            return;
        }

        try {
            // Read file as data URL
            const reader = new FileReader();
            reader.onload = async (e) => {
                const photoUrl = e.target.result;
                
                // Update profile with photo URL
                const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
                const profile = profiles.find(p => p.id === user.id);
                
                if (profile) {
                    profile.avatar_url = photoUrl;
                    profile.updated_at = new Date().toISOString();
                    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
                    
                    // Update the image preview
                    document.getElementById('current-profile-photo').src = photoUrl;
                    
                    // Trigger an event to update other parts of the application
                    window.dispatchEvent(new CustomEvent('profile-photo-updated', { 
                        detail: { photoUrl }
                    }));
                    
                    alert('Profile photo updated successfully!');
                }
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo: ' + error.message);
        }
    }

    // Add event listeners for photo upload
    const uploadPhotoBtn = document.getElementById('upload-photo-btn');
    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', handlePhotoUpload);
    }

    // Load profile photo
    async function loadProfilePhoto() {
        try {
            // Get profile from localStorage
            const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
            const profile = profiles.find(p => p.id === user.id);
            
            // Update profile photo if exists
            const profilePhotoElement = document.getElementById('current-profile-photo');
            if (profile?.avatar_url && profilePhotoElement) {
                profilePhotoElement.src = profile.avatar_url;
            }
        } catch (error) {
            console.error('Error loading profile photo:', error);
        }
    }

    // Load the profile photo when the page loads
    await loadProfilePhoto();
}); 