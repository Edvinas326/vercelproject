document.addEventListener('DOMContentLoaded', function() {
    const SUPABASE_URL = 'https://llymgjymayusaengcdvy.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1nanltYXl1c2FlbmdjZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTA5OTMsImV4cCI6MjA1NTM4Njk5M30.nye3BqcpHJmcSt1KKu6aioaP4NyhyutLcxSnr5Gv_-M'
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const profileForm = document.getElementById('profileForm');
    const pictureInput = document.getElementById('pictureInput');
    const profilePicture = document.getElementById('profilePicture');

    // Load user profile data
    async function loadProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login.html';
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (profile) {
                document.getElementById('fullName').value = profile.full_name || '';
                document.getElementById('username').value = profile.username || '';
                document.getElementById('school').value = profile.school || '';
                document.getElementById('gradeLevel').value = profile.grade_level || '';
                document.getElementById('bio').value = profile.bio || '';
                if (profile.avatar_url) {
                    profilePicture.src = profile.avatar_url;
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Failed to load profile data');
        }
    }

    // Handle profile picture upload
    pictureInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            profilePicture.src = publicUrl;

            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

        } catch (error) {
            console.error('Error uploading picture:', error);
            alert('Failed to upload profile picture');
        }
    });

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const profileData = {
                id: user.id,
                full_name: document.getElementById('fullName').value,
                username: document.getElementById('username').value,
                school: document.getElementById('school').value,
                grade_level: document.getElementById('gradeLevel').value,
                bio: document.getElementById('bio').value,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(profileData);

            if (error) throw error;

            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    });

    // Load profile data when page loads
    loadProfile();
}); 