// Admin Panel Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all admin panel functionality
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Initialize dark mode toggle
    initializeDarkMode();
    
    // Initialize user menu
    initializeUserMenu();
    
    // Initialize action buttons
    initializeActionButtons();
    
    // Initialize search and filters
    initializeSearchAndFilters();

    // Initialize table actions
    initializeTableActions();
}

function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Set initial icon state
        const isDarkMode = document.documentElement.classList.contains('dark');
        const sunIcon = darkModeToggle.querySelector('svg:first-of-type');
        const moonIcon = darkModeToggle.querySelector('svg:last-of-type');
        
        if (isDarkMode) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
        
        // Add click handler
        darkModeToggle.addEventListener('click', () => {
            const isDarkMode = document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            
            // Update icons
            if (isDarkMode) {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            } else {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }
        });
    }
}

function initializeUserMenu() {
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
    
    // Initialize sign out buttons
    const signoutButtons = document.querySelectorAll('#signout-button, #direct-signout-button');
    signoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('current_user');
                window.location.href = '../../login page/login.html';
            });
        }
    });
}

function initializeActionButtons() {
    console.log('Initializing action buttons...');
    
    // New User Button - Only on users.html
    const newUserButton = document.querySelector('button:has(svg[stroke="currentColor"]):has(path[d="M12 6v6m0 0v6m0-6h6m-6 0H6"])');
    if (newUserButton && window.location.pathname.includes('users.html')) {
        newUserButton.addEventListener('click', () => {
            showModal('new-user-modal');
        });
    }
    
    // New Content Button - Only on content.html
    const newContentButton = document.querySelector('button:has(svg[stroke="currentColor"]):has(path[d="M12 6v6m0 0v6m0-6h6m-6 0H6"])');
    if (newContentButton && window.location.pathname.includes('content.html')) {
        newContentButton.addEventListener('click', () => {
            showModal('new-content-modal');
        });
    }
    
    // New School Button - Only on schools.html
    if (window.location.pathname.includes('schools.html')) {
        console.log('On schools page, looking for new school button...');
        // Try multiple selectors to find the button
        const newSchoolButton = document.querySelector('button.px-4.py-2.bg-red-600.text-white.rounded-md.hover\\:bg-red-700.flex.items-center');
        console.log('Found new school button:', newSchoolButton);
        
        if (newSchoolButton) {
            // Remove any existing click handlers
            newSchoolButton.replaceWith(newSchoolButton.cloneNode(true));
            const newButton = document.querySelector('button.px-4.py-2.bg-red-600.text-white.rounded-md.hover\\:bg-red-700.flex.items-center');
            
            // Add new click handler
            newButton.addEventListener('click', () => {
                console.log('New school button clicked');
                const modal = document.getElementById('new-school-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                } else {
                    console.error('Modal not found');
                }
            });
        }
    }
}

function initializeSearchAndFilters() {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterTable(searchTerm);
        });
    }
    
    // Initialize school filter
    if (window.location.pathname.includes('content.html')) {
        initializeSchoolFilter();
    }

    // Initialize filters
    const filterSelects = document.querySelectorAll('select');
    filterSelects.forEach(select => {
        // Set filter names
        if (!select.name) {
            if (select.querySelector('option[value="primary"]')) {
                select.name = 'type';
            } else if (select.querySelector('option[value="vilnius"]')) {
                select.name = 'city';
            } else if (select.querySelector('option[value="article"]')) {
                select.name = 'category';
            } else if (select.querySelector('option[value="1"]')) {
                select.name = 'school';
            }
        }
        
        // Add change event listener
        select.addEventListener('change', () => {
            applyFilters();
        });
    });
}

function initializeSchoolFilter() {
    const schoolSelect = document.querySelector('select[name="school"]');
    if (schoolSelect) {
        // Clear existing options except the first one
        while (schoolSelect.options.length > 1) {
            schoolSelect.remove(1);
        }

        // Add schools from the schools list
        const schools = [
            { id: 1, name: 'Vilniaus Gimnazija', type: 'Gimnazija' },
            { id: 2, name: 'Kauno Gimnazija', type: 'Gimnazija' },
            { id: 3, name: 'Klaipėdos Gimnazija', type: 'Gimnazija' },
            { id: 4, name: 'Vilniaus Pradinė Mokykla', type: 'Pradinė mokykla' },
            { id: 5, name: 'Kauno Vidurinė Mokykla', type: 'Vidurinė mokykla' }
        ];

        schools.forEach(school => {
            const option = document.createElement('option');
            option.value = school.name;
            option.textContent = school.name;
            schoolSelect.appendChild(option);
        });
    }
}

function filterTable(searchTerm) {
    const table = document.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = searchTerm === '' || text.includes(searchTerm) ? '' : 'none';
    });
}

function applyFilters() {
    const table = document.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    const typeFilter = document.querySelector('select[name="type"]')?.value;
    const cityFilter = document.querySelector('select[name="city"]')?.value;
    const schoolFilter = document.querySelector('select[name="school"]')?.value;
    
    rows.forEach(row => {
        let show = true;
        
        // If no filters are selected, show all rows
        if (!typeFilter && !cityFilter && !schoolFilter) {
            row.style.display = '';
            return;
        }

        // Check type filter
        if (typeFilter) {
            const typeCell = row.querySelector('td:first-child .text-sm.text-gray-500');
            if (typeCell && typeCell.textContent.trim().toLowerCase() !== typeFilter.toLowerCase()) {
                show = false;
            }
        }

        // Check city filter
        if (cityFilter && show) {
            const cityCell = row.querySelector('td:nth-child(3)');
            if (cityCell && cityCell.textContent.trim().toLowerCase() !== cityFilter.toLowerCase()) {
                show = false;
            }
        }

        // Check school filter
        if (schoolFilter && show) {
            const schoolName = row.querySelector('td:first-child .text-sm.font-medium').textContent.trim();
            if (schoolName !== schoolFilter) {
                show = false;
            }
        }

        row.style.display = show ? '' : 'none';
    });
}

function showModal(modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    console.log('Modal element:', modal);
    
    if (modal) {
        // Add flex display to center the modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Add close button handler
        const closeButton = modal.querySelector('.close-modal');
        if (closeButton) {
            closeButton.onclick = () => closeModal(modal);
        }

        // Add cancel button handler
        const cancelButton = modal.querySelector('button[type="button"]');
        if (cancelButton) {
            cancelButton.onclick = () => closeModal(modal);
        }

        // Add click outside handler
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        };

        // Add form submit handler for new school
        if (modalId === 'new-school-modal') {
            const form = modal.querySelector('form');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const newSchool = {
                        name: formData.get('name'),
                        address: formData.get('address'),
                        city: formData.get('city'),
                        status: formData.get('status')
                    };
                    addNewSchoolRow(newSchool);
                    closeModal(modal);
                };
            }
        }
    } else {
        console.error('Modal not found:', modalId);
    }
}

function closeModal(modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    // Reset form if it exists
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

function initializeTableActions() {
    // Handle edit and delete buttons in content table
    if (window.location.pathname.includes('content.html')) {
        const editButtons = document.querySelectorAll('button[data-action="edit"]');
        const deleteButtons = document.querySelectorAll('button[data-action="delete"]');

        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                // Generate a unique ID for the row if it doesn't have one
                if (!row.dataset.rowId) {
                    row.dataset.rowId = 'row_' + Date.now();
                }
                const contentData = {
                    rowId: row.dataset.rowId,
                    title: row.querySelector('td:first-child .text-sm.font-medium').textContent,
                    description: row.querySelector('td:first-child .text-sm.text-gray-500').textContent,
                    type: row.querySelector('td:nth-child(2) span').textContent.trim(),
                    author: row.querySelector('td:nth-child(3)').textContent.trim(),
                    date: row.querySelector('td:nth-child(4)').textContent.trim()
                };
                showEditContentModal(contentData);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const contentTitle = row.querySelector('td:first-child .text-sm.font-medium').textContent;
                showDeleteConfirmation(contentTitle, () => {
                    // Remove the row from the table
                    row.remove();
                });
            });
        });

        // Handle new content form submission
        const newContentForm = document.querySelector('#new-content-form');
        if (newContentForm) {
            newContentForm.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(newContentForm);
                const newContent = {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    type: formData.get('type'),
                    author: 'John Doe', // Default author
                    date: new Date().toISOString().split('T')[0] // Current date
                };
                addNewContentRow(newContent);
                newContentForm.reset();
                document.getElementById('new-content-modal').classList.add('hidden');
                document.getElementById('new-content-modal').classList.remove('flex');
            };
        }
    }
}

function showEditContentModal(contentData) {
    const modal = document.getElementById('new-content-modal');
    if (modal) {
        // Update modal title
        modal.querySelector('h2').textContent = 'Redaguoti Turinį';
        
        // Fill form with existing data
        const form = modal.querySelector('form');
        form.querySelector('[name="title"]').value = contentData.title;
        form.querySelector('[name="description"]').value = contentData.description;
        form.querySelector('[name="type"]').value = contentData.type.toLowerCase();
        
        // Update submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Išsaugoti';

        // Store the row reference for updating
        form.dataset.rowId = contentData.rowId;
        
        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Add form submit handler
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedData = {
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                author: contentData.author,
                date: contentData.date
            };
            updateContentRow(updatedData, form.dataset.rowId);
            closeModal(modal);
        };

        // Add close button handler
        const closeButton = modal.querySelector('.close-modal');
        if (closeButton) {
            closeButton.onclick = () => closeModal(modal);
        }

        // Add cancel button handler
        const cancelButton = modal.querySelector('button[type="button"]');
        if (cancelButton) {
            cancelButton.onclick = () => closeModal(modal);
        }

        // Add click outside handler
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        };
    }
}

function updateContentRow(updatedData, rowId) {
    const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
    if (row) {
        // Update title and description
        const titleCell = row.querySelector('td:first-child');
        titleCell.innerHTML = `
            <div class="text-sm font-medium text-gray-900 dark:text-white">${updatedData.title}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${updatedData.description}</div>
        `;

        // Update type
        const typeCell = row.querySelector('td:nth-child(2)');
        typeCell.innerHTML = `
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                ${updatedData.type}
            </span>
        `;

        // Keep author and date unchanged
    }
}

function showDeleteConfirmation(title, onConfirm) {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Patvirtinti ištrynimą</h2>
                <button class="close-modal text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <p class="text-gray-700 dark:text-gray-300 mb-6">Ar tikrai norite ištrinti "${title}"?</p>
            <div class="flex justify-end space-x-3">
                <button class="close-modal px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    Atšaukti
                </button>
                <button class="confirm-delete px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                    Ištrinti
                </button>
            </div>
        </div>
    `;

    // Add modal to the page
    document.body.appendChild(modal);

    // Handle close button
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    // Handle confirm button
    const confirmButton = modal.querySelector('.confirm-delete');
    confirmButton.addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function addNewContentRow(content) {
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        const row = document.createElement('tr');
        row.dataset.rowId = 'row_' + Date.now();
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">${content.title}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${content.description}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    ${content.type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${content.author}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${content.date}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button data-action="edit" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3">
                    Redaguoti
                </button>
                <button data-action="delete" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                    Ištrinti
                </button>
            </td>
        `;
        tbody.appendChild(row);

        // Reinitialize event listeners for the new row
        initializeTableActions();
    }
}

function addNewSchoolRow(school) {
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        const row = document.createElement('tr');
        row.dataset.rowId = 'row_' + Date.now();
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">${school.name}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${school.address}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${school.city}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${school.phone}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${school.email}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button data-action="edit" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3">
                    Redaguoti
                </button>
                <button data-action="delete" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                    Ištrinti
                </button>
            </td>
        `;
        tbody.appendChild(row);

        // Reinitialize event listeners for the new row
        initializeTableActions();
    }
}

// Export functions for use in other files
window.adminPanel = {
    initializeAdminPanel,
    showModal,
    filterTable,
    applyFilters
}; 