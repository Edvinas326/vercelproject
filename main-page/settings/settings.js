document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://llymgjymayusaengcdvy.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1nanltYXl1c2FlbmdjZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTA5OTMsImV4cCI6MjA1NTM4Njk5M30.nye3BqcpHJmcSt1KKu6aioaP4NyhyutLcxSnr5Gv_-M'
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        window.location.href = '../../login page/login.html'
        return
    }

    // Get form elements
    const fullNameInput = document.getElementById('fullName')
    const usernameInput = document.getElementById('username')
    const schoolInput = document.getElementById('school')
    const bioInput = document.getElementById('bio')
    const gradeLevelInput = document.getElementById('gradeLevel')
    const gpaInput = document.getElementById('gpa')

    // Get email field and change button
    const emailInput = document.getElementById('email')
    const changeEmailBtn = document.getElementById('changeEmailBtn')

    // Load current profile data
    const loadProfile = async () => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (profile) {
                fullNameInput.value = profile.full_name || ''
                usernameInput.value = profile.username || ''
                schoolInput.value = profile.school || ''
                bioInput.value = profile.bio || ''
                gradeLevelInput.value = profile.grade_level || ''
                gpaInput.value = profile.gpa || ''
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

    // Load current email
    if (user && emailInput) {
        emailInput.value = user.email
    }

    // Initialize profile data
    await loadProfile()

    // Add debounce function to prevent too many updates
    const debounce = (func, wait) => {
        let timeout
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout)
                func(...args)
            }
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)
        }
    }

    // Function to update profile
    const updateProfile = async (field, value) => {
        try {
            // First, check if profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError
            }

            const profileData = {
                id: user.id,
                [field]: value,
                updated_at: new Date().toISOString()
            }

            if (!existingProfile) {
                profileData.created_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from('profiles')
                .upsert(profileData)

            if (error) throw error

            showNotification('Profile updated successfully')
        } catch (error) {
            console.error('Error updating profile:', error)
            showNotification('Failed to update profile: ' + error.message, true)
        }
    }

    // Debounced update function
    const debouncedUpdate = debounce((field, value) => {
        updateProfile(field, value)
    }, 500)

    // Add input event listeners
    fullNameInput.addEventListener('input', (e) => {
        debouncedUpdate('full_name', e.target.value)
    })

    usernameInput.addEventListener('input', (e) => {
        debouncedUpdate('username', e.target.value)
    })

    schoolInput.addEventListener('input', (e) => {
        debouncedUpdate('school', e.target.value)
    })

    bioInput.addEventListener('input', (e) => {
        debouncedUpdate('bio', e.target.value)
    })

    gradeLevelInput.addEventListener('change', (e) => {
        debouncedUpdate('grade_level', e.target.value)
    })

    gpaInput.addEventListener('input', (e) => {
        const gpa = parseFloat(e.target.value)
        if (!isNaN(gpa) && gpa >= 0 && gpa <= 4) {
            debouncedUpdate('gpa', gpa)
        }
    })

    // Handle email change
    if (changeEmailBtn) {
        changeEmailBtn.addEventListener('click', async () => {
            const newEmail = prompt('Enter new email address:', user.email)
            
            if (newEmail && newEmail !== user.email) {
                try {
                    const { error } = await supabase.auth.updateUser({
                        email: newEmail
                    })

                    if (error) throw error

                    alert('Verification email sent. Please check your inbox to confirm the email change.')
                } catch (error) {
                    console.error('Error updating email:', error)
                    alert('Failed to update email. Please try again.')
                }
            }
        })
    }

    // Notification function
    const showNotification = (message, isError = false) => {
        const notification = document.createElement('div')
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
            isError ? 'bg-red-500' : 'bg-green-500'
        } transition-opacity duration-300`
        notification.textContent = message

        document.body.appendChild(notification)

        setTimeout(() => {
            notification.style.opacity = '0'
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 300)
        }, 3000)
    }

    // Handle dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle')
    if (darkModeToggle) {
        darkModeToggle.checked = document.documentElement.classList.contains('dark')
        
        darkModeToggle.addEventListener('change', () => {
            document.documentElement.classList.toggle('dark')
            localStorage.setItem('darkMode', darkModeToggle.checked ? 'enabled' : 'disabled')
        })
    }

    // Handle sign out
    const signoutButton = document.getElementById('signout-button')
    if (signoutButton) {
        signoutButton.addEventListener('click', async (e) => {
            e.preventDefault()
            const { error } = await supabase.auth.signOut()
            if (!error) {
                window.location.href = '../../login page/login.html'
            }
        })
    }

    // Add these functions to handle photo upload
    async function handlePhotoUpload() {
        const fileInput = document.getElementById('photo-upload');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file first');
            return;
        }

        // Add file size check
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_FILE_SIZE) {
            alert('File is too large. Maximum size is 2MB');
            return;
        }

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // Create a unique file name using the user's ID and timestamp
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            
            // Upload the file to Supabase storage (note: removed 'public/' from path)
            const { data, error: uploadError } = await supabase.storage
                .from('profile-photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(fileName);

            // Update the user's profile in the database
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update the image preview
            document.getElementById('current-profile-photo').src = publicUrl;
            
            // Trigger an event to update other parts of the application
            window.dispatchEvent(new CustomEvent('profile-photo-updated', { 
                detail: { photoUrl: publicUrl }
            }));

            // Show success message
            alert('Profile photo updated successfully!');

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert(`Error uploading photo: ${error.message || 'Please try again'}`);
        }
    }

    // Add event listeners
    document.getElementById('upload-photo-btn').addEventListener('click', handlePhotoUpload);

    // Add this function to load the profile photo
    async function loadProfilePhoto() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get the user's profile data
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Update profile photo if exists
            if (profile?.avatar_url) {
                const profilePhotoElement = document.getElementById('current-profile-photo');
                profilePhotoElement.src = profile.avatar_url;
            }
        } catch (error) {
            console.error('Error loading profile photo:', error);
        }
    }

    // Load the profile photo when the page loads
    await loadProfilePhoto();
}) 