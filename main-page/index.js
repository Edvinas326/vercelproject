import supabase from '../supabase-config.js'

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize mobile menu
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileMenuButton && sidebar) {
            mobileMenuButton.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
            });
        }

        // Get current user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
            console.log('No authenticated user found, redirecting to login');
            window.location.href = '../login page/login.html';
            return;
        }
        
        console.log('User authenticated:', user);
        console.log('User metadata:', user.user_metadata);
        
        // Get user's profile to check their role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
            
        if (profileError) {
            console.error('Error fetching profile:', profileError);
        }
        
        // Determine user role (prefer profile role over metadata)
        let userRole = 'student'; // Default role
        
        if (profile && profile.role) {
            userRole = profile.role;
            console.log('User role from profile:', userRole);
        } else if (user.user_metadata && user.user_metadata.role) {
            userRole = user.user_metadata.role;
            console.log('User role from metadata:', userRole);
        }
        
        console.log('Final user role determined:', userRole);
        
        // Check user role and show/hide teacher dashboard link and button
        const teacherDashboardLink = document.getElementById('teacher-dashboard-link');
        const teacherDashboardBtn = document.getElementById('teacher-dashboard-btn');
        const studentDashboardLink = document.getElementById('student-dashboard-link');
        const studentDashboardBtn = document.getElementById('student-dashboard-btn');
        
        if (userRole === 'teacher') {
            console.log('User is a teacher, showing teacher dashboard UI elements');
            // Show the teacher sidebar link
            if (teacherDashboardLink) {
                teacherDashboardLink.classList.remove('hidden');
            }
            
            // Show the teacher dashboard button in the nav bar
            if (teacherDashboardBtn) {
                teacherDashboardBtn.classList.remove('hidden');
            }
            
            // Hide student elements
            if (studentDashboardLink) {
                studentDashboardLink.classList.add('hidden');
            }
            if (studentDashboardBtn) {
                studentDashboardBtn.classList.add('hidden');
            }
        } else {
            console.log('User is a student, showing student dashboard UI elements');
            // Show the student sidebar link
            if (studentDashboardLink) {
                studentDashboardLink.classList.remove('hidden');
            }
            
            // Show the student dashboard button in the nav bar
            if (studentDashboardBtn) {
                studentDashboardBtn.classList.remove('hidden');
            }
            
            // Hide teacher elements
            if (teacherDashboardLink) {
                teacherDashboardLink.classList.add('hidden');
            }
            if (teacherDashboardBtn) {
                teacherDashboardBtn.classList.add('hidden');
            }
        }

        // Ensure sidebar is visible on desktop
        if (window.innerWidth >= 768) { // md breakpoint
            sidebar.classList.remove('-translate-x-full');
        }
    } catch (error) {
        console.error('Error in index.js:', error);
    }
}); 