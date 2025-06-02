// Teacher Dashboard Module
(function() {
    // Local storage keys - kept inside closure to avoid global conflicts
    const LOCAL_CURRENT_USER_KEY = 'current_user';
    const LOCAL_PROFILES_KEY = 'local_profiles';
    const LOCAL_ACTIVITIES_KEY = 'teacher_activities';
    const LOCAL_EVENTS_KEY = 'teacher_events';

    // Sample data for activities and events
    const sampleActivities = [
        {
            type: 'submission',
            student: 'Jonas Jonaitis',
            subject: 'Matematika',
            class: '10 klasė',
            time: 'Prieš 15 minučių',
            icon: 'upload'
        },
        {
            type: 'grading',
            count: 5,
            subject: 'Fizika',
            class: '11 klasė',
            time: 'Prieš 1 valandą',
            icon: 'check'
        },
        {
            type: 'question',
            student: 'Petras Petraičius',
            subject: 'Biologija',
            class: '9 klasė',
            time: 'Prieš 2 valandas',
            icon: 'warning'
        },
        {
            type: 'submission',
            student: 'Ona Onaitė',
            subject: 'Lietuvių kalba',
            class: '11 klasė',
            time: 'Prieš 3 valandas',
            icon: 'upload'
        },
        {
            type: 'grading',
            count: 3,
            subject: 'Anglų kalba',
            class: '10 klasė',
            time: 'Prieš 4 valandas',
            icon: 'check'
        }
    ];

    const sampleEvents = [
        {
            title: 'Kontrolinis darbas - Matematika',
            class: '10 klasė',
            time: '10:00',
            date: 'Šiandien',
            type: 'exam'
        },
        {
            title: 'Tėvų susirinkimas',
            class: '9 klasė',
            time: '17:30',
            date: 'Rytoj',
            type: 'meeting'
        },
        {
            title: 'Projekto pristatymas',
            class: '11 klasė',
            time: '09:15',
            date: 'Pirmadienis',
            type: 'presentation'
        },
        {
            title: 'Mokytojų taryba',
            time: '14:00',
            date: 'Antradienis',
            type: 'meeting'
        },
        {
            title: 'Olimpiada - Fizika',
            class: '11 klasė',
            time: '11:30',
            date: 'Trečiadienis',
            type: 'exam'
        }
    ];

    // Initialize local storage with sample data if empty
    function initializeLocalData() {
        if (!localStorage.getItem(LOCAL_ACTIVITIES_KEY)) {
            localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(sampleActivities));
        }
        if (!localStorage.getItem(LOCAL_EVENTS_KEY)) {
            localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(sampleEvents));
        }
    }

    // Function to create activity HTML
    function createActivityHTML(activity) {
        const iconMap = {
            upload: {
                icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z',
                bgColor: 'bg-blue-100 dark:bg-blue-800',
                textColor: 'text-blue-600 dark:text-blue-300'
            },
            check: {
                icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
                bgColor: 'bg-green-100 dark:bg-green-800',
                textColor: 'text-green-600 dark:text-green-300'
            },
            warning: {
                icon: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z',
                bgColor: 'bg-yellow-100 dark:bg-yellow-800',
                textColor: 'text-yellow-600 dark:text-yellow-300'
            }
        };

        const icon = iconMap[activity.icon];
        const activityText = activity.type === 'grading' 
            ? `Jūs įvertinote ${activity.count} namų darbus`
            : activity.type === 'submission'
                ? `${activity.student} pateikė namų darbą`
                : `Naujas klausimas iš ${activity.student}`;

        return `
            <li class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-start">
                    <span class="flex-shrink-0 h-8 w-8 rounded-full ${icon.bgColor} flex items-center justify-center">
                        <svg class="h-4 w-4 ${icon.textColor}" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="${icon.icon}" clip-rule="evenodd"></path>
                        </svg>
                    </span>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">${activityText}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${activity.subject} ${activity.class} • ${activity.time}</p>
                    </div>
                </div>
            </li>
        `;
    }

    // Function to create event HTML
    function createEventHTML(event) {
        const typeColors = {
            exam: {
                bg: 'bg-blue-100 dark:bg-blue-800',
                text: 'text-blue-800 dark:text-blue-200'
            },
            meeting: {
                bg: 'bg-purple-100 dark:bg-purple-800',
                text: 'text-purple-800 dark:text-purple-200'
            },
            presentation: {
                bg: 'bg-green-100 dark:bg-green-800',
                text: 'text-green-800 dark:text-green-200'
            }
        };

        const colors = typeColors[event.type] || typeColors.meeting;

        return `
            <li class="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                    <p class="font-medium text-gray-900 dark:text-white">${event.title}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${event.class ? event.class + ' • ' : ''}${event.time}</p>
                </div>
                <span class="${colors.bg} ${colors.text} text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                    ${event.date}
                </span>
            </li>
        `;
    }

    // Function to load more activities
    function loadMoreActivities(container, currentCount = 3) {
        const activities = JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY)) || [];
        const activitiesList = container.querySelector('ul');
        const showMoreButton = container.querySelector('a[href="#"]');
        
        if (currentCount >= activities.length) {
            showMoreButton.style.display = 'none';
            return;
        }

        const nextActivities = activities.slice(currentCount, currentCount + 3);
        nextActivities.forEach(activity => {
            activitiesList.insertAdjacentHTML('beforeend', createActivityHTML(activity));
        });

        if (currentCount + 3 >= activities.length) {
            showMoreButton.style.display = 'none';
        }
    }

    // Function to load more events
    function loadMoreEvents(container, currentCount = 3) {
        const events = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY)) || [];
        const eventsList = container.querySelector('ul');
        const showMoreButton = container.querySelector('a[href="#"]');
        
        if (currentCount >= events.length) {
            showMoreButton.style.display = 'none';
            return;
        }

        const nextEvents = events.slice(currentCount, currentCount + 3);
        nextEvents.forEach(event => {
            eventsList.insertAdjacentHTML('beforeend', createEventHTML(event));
        });

        if (currentCount + 3 >= events.length) {
            showMoreButton.style.display = 'none';
        }
    }

    // Function to show all activities in modal
    function showAllActivities() {
        const modal = document.getElementById('activitiesModal');
        const modalList = document.getElementById('modalActivitiesList');
        const activities = JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY)) || [];
        
        // Clear existing content
        modalList.innerHTML = '';
        
        // Add all activities to the modal
        activities.forEach(activity => {
            modalList.insertAdjacentHTML('beforeend', createActivityHTML(activity));
        });
        
        // Show the modal
        modal.classList.remove('hidden');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }

    // Function to close the activities modal
    function closeActivitiesModal() {
        const modal = document.getElementById('activitiesModal');
        modal.classList.add('hidden');
        // Restore body scrolling
        document.body.style.overflow = 'auto';
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log('Teacher dashboard loaded');
        
        // Initialize local data
        initializeLocalData();
        
        // Check if user is authenticated and is a teacher
        const sessionData = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
        if (!sessionData) {
            console.error('No user session found');
            window.location.href = '../../login page/login.html';
            return;
        }
        
        const session = JSON.parse(sessionData);
        
        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            console.log('Session expired');
            localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
            window.location.href = '../../login page/login.html';
            return;
        }
        
        const user = session.user;
        if (!user || !user.id) {
            console.error('Invalid user in session');
            window.location.href = '../../login page/login.html';
            return;
        }
        
        // Check if user is a teacher
        const userRole = user.user_metadata?.role;
        if (userRole !== 'teacher') {
            console.error('User is not a teacher, redirecting');
            window.location.href = '../main-page.html';
            return;
        }
        
        console.log('Teacher user verified:', user);
        
        // Update profile display
        updateTeacherProfile(user);
        
        // Setup logout button
        const signoutButton = document.getElementById('signout-button');
        if (signoutButton) {
            signoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
                window.location.href = '../../login page/login.html';
            });
        }
        
        // Setup user menu dropdown
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }
        
        // Setup dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const isDarkMode = document.documentElement.classList.toggle('dark');
                localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
                
                // Update icons
                const sunIcon = darkModeToggle.querySelector('svg:first-of-type');
                const moonIcon = darkModeToggle.querySelector('svg:last-of-type');
                
                if (isDarkMode) {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                } else {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                }
            });
        }
        
        // Show local storage notice
        const noticeElement = document.createElement('div');
        noticeElement.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-center py-1 text-white text-sm';
        noticeElement.textContent = '⚠️ Local Storage Mode: Your data is stored in this browser only';
        document.body.prepend(noticeElement);

        // Setup "Show more" buttons
        const activitiesContainer = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow.p-6:first-of-type');
        const eventsContainer = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow.p-6:last-of-type');

        if (activitiesContainer) {
            // Find the "Rodyti daugiau" link within the activities container
            const showMoreActivitiesButton = Array.from(activitiesContainer.querySelectorAll('a')).find(
                link => link.textContent.trim() === 'Rodyti daugiau'
            );
            
            if (showMoreActivitiesButton) {
                showMoreActivitiesButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAllActivities();
                });
            }
        }

        if (eventsContainer) {
            // Find the "Rodyti visus įvykius" link within the events container
            const showMoreEventsButton = Array.from(eventsContainer.querySelectorAll('a')).find(
                link => link.textContent.trim() === 'Rodyti visus įvykius'
            );
            
            if (showMoreEventsButton) {
                showMoreEventsButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const currentCount = eventsContainer.querySelectorAll('ul li').length;
                    loadMoreEvents(eventsContainer, currentCount);
                });
            }
        }

        // Setup modal close button
        const closeModalButton = document.getElementById('closeActivitiesModal');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeActivitiesModal);
        }

        // Close modal when clicking outside
        const modal = document.getElementById('activitiesModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeActivitiesModal();
                }
            });
        }

        // Close modal when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                closeActivitiesModal();
            }
        });

        // Setup card links
        const allLinks = document.querySelectorAll('a[href="#"]');
        allLinks.forEach(link => {
            const linkText = link.textContent.trim();
            switch(linkText) {
                case 'Peržiūrėti visus mokinius':
                    link.href = 'students.html';
                    break;
                case 'Tvarkyti klases':
                    link.href = 'classes.html';
                    break;
                case 'Sukurti naują užduotį':
                    link.href = 'assignments.html';
                    break;
            }
        });
    });

    // Function to update teacher profile display
    function updateTeacherProfile(user) {
        // Get profile data
        const profiles = JSON.parse(localStorage.getItem(LOCAL_PROFILES_KEY)) || [];
        let profile = profiles.find(p => p.id === user.id);
        
        if (!profile) {
            console.warn('Teacher profile not found');
            return;
        }
        
        // Update profile image
        const profileImage = document.getElementById('profile-image');
        const sidebarProfileImage = document.getElementById('sidebar-profile-image');
        
        const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'Teacher')}&background=random`;
        const avatarUrl = profile.avatar_url || defaultAvatarUrl;
        
        if (profileImage) profileImage.src = avatarUrl;
        if (sidebarProfileImage) sidebarProfileImage.src = avatarUrl;
        
        // Update username display
        const userNameDisplay = document.getElementById('user-name-display');
        if (userNameDisplay) {
            userNameDisplay.textContent = profile.full_name || 'Teacher';
        }
    }
})(); 