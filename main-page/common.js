// common.js - Shared functionality for all pages

// Ensure createClient is defined globally
let createClient;
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient !== 'undefined') {
    createClient = window.supabase.createClient;
} else if (typeof supabase !== 'undefined' && typeof supabase.createClient !== 'undefined') {
    createClient = supabase.createClient;
}

// Local storage keys
const LOCAL_CURRENT_USER_KEY = 'current_user';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Common JS loaded');
    
    // Initialize all interactive components
    initializeDarkMode();
    initializeUserMenu();
    initializeSignOut();
    initializeButtons();
    initializeNavigation();
    initializeFormSubmissions();
});

// Dark mode toggle functionality
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    // Check for saved dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled' || 
                      (localStorage.getItem('darkMode') === null && 
                       window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Set initial icon visibility
    updateDarkModeIcons(darkModeToggle, isDarkMode);

    // Toggle dark mode
    darkModeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDarkMode = document.documentElement.classList.contains('dark');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        
        // Force icon visibility update
        updateDarkModeIcons(darkModeToggle, isDarkMode);
    });
}

// Helper function to update dark mode icons
function updateDarkModeIcons(button, isDarkMode) {
    if (!button) return;
    
    const sunIcon = button.querySelector('svg:first-of-type');
    const moonIcon = button.querySelector('svg:last-of-type');
    
    // Check if both icons exist before trying to modify their styles
    if (!sunIcon || !moonIcon) {
        console.warn('Dark mode icons not found in the button');
        return;
    }
    
    if (isDarkMode) {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// User menu dropdown functionality
function initializeUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (!userMenuButton || !userDropdown) return;
    
    userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (!userDropdown.classList.contains('hidden')) {
            userDropdown.classList.add('hidden');
        }
    });
}

// Sign out functionality
function initializeSignOut() {
    const signOutButton = document.getElementById('signout-button');
    
    if (!signOutButton) return;
    
    signOutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Clear user session from localStorage
        localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
        localStorage.removeItem('supabase.auth.token');
        console.log('User signed out successfully');
        
        // Use window.open to avoid path resolution issues
        window.open('http://127.0.0.1:5501/login page/login.html', '_self');
    });
}

// Helper function to find elements containing specific text
function findElementsWithText(selector, text) {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).filter(el => el.textContent.includes(text));
}

// Initialize all buttons with click handlers
function initializeButtons() {
    // Calendar page buttons
    initializeCalendarButtons();
    
    // Reports page buttons
    initializeReportButtons();
    
    // Settings page buttons
    initializeSettingsButtons();
    
    // Common buttons across pages
    initializeCommonButtons();
}

// Calendar page specific buttons
function initializeCalendarButtons() {
    // New event button - any button with plus icon 
    const newEventButtons = document.querySelectorAll('button svg path[d="M12 6v6m0 0v6m0-6h6m-6 0H6"]');
    newEventButtons.forEach(path => {
        const button = path.closest('button');
        if (button) {
            button.addEventListener('click', () => {
                alert('Naujo įvykio funkcija bus įgyvendinta ateityje!');
            });
        }
    });
    
    // Month navigation buttons
    const prevMonthPaths = document.querySelectorAll('svg path[d="M15 19l-7-7 7-7"]');
    const nextMonthPaths = document.querySelectorAll('svg path[d="M9 5l7 7-7 7"]');
    
    prevMonthPaths.forEach(path => {
        const button = path.closest('button');
        if (button) {
            button.addEventListener('click', () => {
                alert('Ankstesnio mėnesio funkcija bus įgyvendinta ateityje!');
            });
        }
    });
    
    nextMonthPaths.forEach(path => {
        const button = path.closest('button');
        if (button) {
            button.addEventListener('click', () => {
                alert('Kito mėnesio funkcija bus įgyvendinta ateityje!');
            });
        }
    });
    
    // Today button
    const todayBtns = findElementsWithText('button', 'Šiandien');
    todayBtns.forEach(button => {
        button.addEventListener('click', () => {
            alert('Grįžimo į šiandienos datą funkcija bus įgyvendinta ateityje!');
        });
    });
}

// Reports page specific buttons
function initializeReportButtons() {
    // View report buttons with arrow icon
    document.querySelectorAll('svg path[d="M14 5l7 7m0 0l-7 7m7-7H3"]').forEach(path => {
        const button = path.closest('a');
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Ataskaitos peržiūros funkcija bus įgyvendinta ateityje!');
            });
        }
    });
    
    // Generate report button
    const generateReportBtns = findElementsWithText('button', 'Generuoti ataskaitą');
    generateReportBtns.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Ataskaitos generavimo funkcija bus įgyvendinta ateityje!');
        });
    });
    
    // Cancel button in report form
    const cancelReportBtns = findElementsWithText('button', 'Atšaukti');
    cancelReportBtns.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset form fields
            const form = button.closest('form');
            if (form) form.reset();
        });
    });
    
    // PDF download buttons
    const pdfButtons = findElementsWithText('button', 'Atsisiųsti PDF');
    pdfButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('PDF atsisiuntimo funkcija bus įgyvendinta ateityje!');
        });
    });
}

// Settings page specific buttons
function initializeSettingsButtons() {
    // Photo upload button
    const photoUploadButton = document.getElementById('upload-photo-button');
    if (photoUploadButton) {
        photoUploadButton.addEventListener('click', () => {
            const fileInput = document.getElementById('photo-upload');
            if (fileInput) {
                fileInput.click();
            }
        });
    }
    
    // Save settings buttons
    const saveButtons = findElementsWithText('button', 'Išsaugoti');
    saveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Nustatymų išsaugojimo funkcija bus įgyvendinta ateityje!');
        });
    });
}

// Common buttons across all pages
function initializeCommonButtons() {
    // "View" buttons
    const viewButtons = findElementsWithText('a, button', 'Peržiūrėti');
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Peržiūros funkcija bus įgyvendinta ateityje!');
        });
    });
    
    // Three-dot menu buttons - buttons with the three-dot icon
    document.querySelectorAll('svg path[d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"]').forEach(path => {
        const button = path.closest('button');
        if (button) {
            button.addEventListener('click', () => {
                alert('Meniu funkcija bus įgyvendinta ateityje!');
            });
        }
    });
}

// Initialize mobile navigation
function initializeNavigation() {
    // Handle mobile navigation if present (hamburger menu)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../settings/settings.html';
        });
    }
}

// Form submissions
function initializeFormSubmissions() {
    // Handle all forms to prevent default submission
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Formos pateikimo funkcija bus įgyvendinta ateityje!');
        });
    });
}

// Initialize all buttons with proper event listeners
function initializeButtons() {
    // View class details buttons
    const viewDetailsButtons = document.querySelectorAll('.btn-view-details');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const classId = this.getAttribute('data-class-id');
            if (classId) {
                window.location.href = `./class-details.html?id=${classId}`;
            }
        });
    });

    // Navigation buttons in sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't apply to links that should navigate normally
            if (!this.getAttribute('href') || this.getAttribute('href') === '#') {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                if (target) {
                    window.location.href = `./${target}.html`;
                }
            }
        });
    });

    // Course card buttons
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            if (courseId) {
                window.location.href = `./course-details.html?id=${courseId}`;
            }
        });
    });

    // Calendar event buttons
    const calendarEvents = document.querySelectorAll('.calendar-event');
    calendarEvents.forEach(event => {
        event.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-id');
            if (eventId) {
                showEventDetails(eventId);
            }
        });
    });

    // Action buttons (Add, Edit, Delete)
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.getAttribute('data-action');
            const targetId = this.getAttribute('data-target-id');
            
            if (action === 'add') {
                // Open add form/modal based on context
                openAddForm(this.getAttribute('data-type'));
            } else if (action === 'edit' && targetId) {
                // Open edit form/modal for specific item
                openEditForm(this.getAttribute('data-type'), targetId);
            } else if (action === 'delete' && targetId) {
                // Confirm and delete item
                confirmDelete(this.getAttribute('data-type'), targetId);
            }
        });
    });

    // User menu toggle button
    const userMenuButton = document.querySelector('.user-menu-button');
    const userMenu = document.querySelector('.user-menu');
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', function() {
            userMenu.classList.toggle('hidden');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }
}

/**
 * Initialize dark mode toggle functionality
 */
function initializeDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
            const isDarkMode = document.documentElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDarkMode);
        });
        
        // Set initial state based on localStorage
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}

/**
 * Show event details in a modal
 */
function showEventDetails(eventId) {
    console.log(`Showing details for event ID: ${eventId}`);
    // Implementation would depend on UI framework/approach
    // Here you would typically fetch event details and show in a modal
}

/**
 * Open add form modal
 */
function openAddForm(type) {
    console.log(`Opening add form for type: ${type}`);
    // Implementation for opening an add form modal based on type
    // (course, homework, resource, etc.)
}

/**
 * Open edit form modal
 */
function openEditForm(type, id) {
    console.log(`Opening edit form for ${type} ID: ${id}`);
    // Implementation for opening an edit form modal
}

/**
 * Confirm and handle deletion
 */
function confirmDelete(type, id) {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        console.log(`Deleting ${type} with ID: ${id}`);
        // Implementation for deletion logic
    }
} 