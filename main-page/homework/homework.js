// Import Supabase client
import supabase from '../../supabase-config.js';

// DOM Elements
const homeworkList = document.getElementById('homeworkList');
const filterButton = document.getElementById('filterButton');
const sortButton = document.getElementById('sortButton');
const darkModeToggle = document.getElementById('darkModeToggle');

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? 'enabled' : 'disabled');
});

// Initialize dark mode
if (localStorage.getItem('darkMode') === 'enabled' ||
    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// Homework Status Colors
const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'overdue': 'bg-red-100 text-red-800'
};

// Create Homework Item Element
function createHomeworkItem(homework) {
    const dueDate = new Date(homework.due_date);
    const now = new Date();
    const isOverdue = dueDate < now && homework.status !== 'completed';
    const status = isOverdue ? 'overdue' : (homework.status || 'pending');
    
    return `
        <div class="p-6 hover:bg-gray-50 transition-colors">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-4">
                        <h3 class="text-lg font-semibold text-gray-900">${homework.title}</h3>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || statusColors.pending}">
                            ${status}
                        </span>
                    </div>
                    <p class="mt-2 text-gray-600">${homework.description || ''}</p>
                    <div class="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Due: ${dueDate.toLocaleDateString()}
                        </div>
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${homework.estimatedTime || 'N/A'} hours
                        </div>
                    </div>
                </div>
                <div class="flex space-x-4">
                    <button class="text-gray-400 hover:text-gray-600" onclick="editHomework('${homework.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                    </button>
                    <button class="text-gray-400 hover:text-gray-600" onclick="deleteHomework('${homework.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Fetch and Display Homework
async function fetchHomework() {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('Authentication error:', userError);
            window.location.href = '../login page/login.html';
            return;
        }

        // Set up real-time subscription for homework
        const homeworkChannel = supabase
            .channel('homework_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'homework_assignments',
                    filter: `student_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Homework changed:', payload);
                    loadHomework(user.id);
                }
            )
            .subscribe((status) => {
                console.log('Homework subscription status:', status);
            });

        // Initial load
        await loadHomework(user.id);
    } catch (error) {
        console.error('Error in fetchHomework:', error);
    }
}

// Load homework data
async function loadHomework(userId) {
    try {
        const { data: homeworkData, error } = await supabase
            .from('homework_assignments')
            .select(`
                id,
                title,
                description,
                due_date,
                class_id,
                created_at,
                updated_at,
                homework_submissions(status)
            `)
            .order('due_date', { ascending: true });

        if (error) {
            throw error;
        }

        homeworkList.innerHTML = '';
        
        if (homeworkData.length === 0) {
            homeworkList.innerHTML = '<p class="text-center text-gray-500 p-6">No homework assignments found.</p>';
            return;
        }

        homeworkData.forEach((homework) => {
            const submission = homework.homework_submissions && homework.homework_submissions[0];
            homework.status = submission ? submission.status : 'pending';
            
            homeworkList.innerHTML += createHomeworkItem(homework);
        });
    } catch (error) {
        console.error('Error loading homework:', error);
        homeworkList.innerHTML = '<p class="text-center text-red-500 p-6">Error loading homework assignments. Please try again.</p>';
    }
}

// Delete homework function for button click
window.deleteHomework = async (homeworkId) => {
    if (!confirm('Are you sure you want to delete this homework?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('homework_assignments')
            .delete()
            .eq('id', homeworkId);
            
        if (error) throw error;
        
        // No need to refresh manually due to real-time subscription
    } catch (error) {
        console.error('Error deleting homework:', error);
        alert('Failed to delete homework: ' + error.message);
    }
};

// Edit homework function for button click
window.editHomework = (homeworkId) => {
    // Implement homework editing functionality
    console.log('Edit homework:', homeworkId);
    // This would open a modal or redirect to an edit page
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchHomework();
}); 