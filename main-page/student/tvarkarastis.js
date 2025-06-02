// Initialize Supabase client
const supabaseClient = window.supabase;

// Calendar state
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let currentUserId = null;

// DOM Elements
const calendarDays = document.getElementById('calendar-days');
const currentMonthElement = document.getElementById('current-month');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const addEventButton = document.getElementById('add-event-btn');
const eventModal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const cancelEventButton = document.getElementById('cancel-event');

// Event type colors
const eventTypeColors = {
    homework: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    test: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    project: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    meeting: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

// Initialize calendar
async function initializeCalendar() {
    await getCurrentUser();
    updateCalendar();
    setupEventListeners();
}

// Get current user
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        if (user) {
            currentUserId = user.id;
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
}

// Update calendar display
function updateCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7
    const totalDays = lastDay.getDate();
    
    // Update month and year display
    const monthNames = ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 
                       'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'];
    currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear calendar
    calendarDays.innerHTML = '';
    
    // Add previous month's days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i > 0; i--) {
        const day = prevMonthLastDay - i + 1;
        const dayElement = createDayElement(day, 'prev-month');
        calendarDays.appendChild(dayElement);
    }
    
    // Add current month's days
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = createDayElement(day, 'current-month');
        calendarDays.appendChild(dayElement);
    }
    
    // Add next month's days
    const remainingDays = 42 - (startingDay - 1 + totalDays); // 42 = 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createDayElement(day, 'next-month');
        calendarDays.appendChild(dayElement);
    }
    
    // Update events
    updateEvents();
}

// Create day element
function createDayElement(day, monthType) {
    const dayElement = document.createElement('div');
    dayElement.className = `min-h-[100px] p-2 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 ${
        monthType === 'current-month' ? '' : 'bg-gray-50 dark:bg-gray-800/50'
    }`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'text-sm font-medium text-gray-900 dark:text-gray-100 mb-1';
    dayNumber.textContent = day;
    
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'space-y-1';
    eventsContainer.id = `day-${day}-events`;
    
    dayElement.appendChild(dayNumber);
    dayElement.appendChild(eventsContainer);
    
    return dayElement;
}

// Update events
async function updateEvents() {
    try {
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        const { data: events, error } = await supabaseClient
            .from('calendar_events')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: true });
            
        if (error) throw error;
        
        // Clear existing events
        const eventContainers = document.querySelectorAll('[id^="day-"]');
        eventContainers.forEach(container => container.innerHTML = '');
        
        // Add events to calendar
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const day = eventDate.getDate();
            const eventContainer = document.getElementById(`day-${day}-events`);
            
            if (eventContainer) {
                const eventElement = createEventElement(event);
                eventContainer.appendChild(eventElement);
            }
        });
        
        // Update events list
        updateEventsList(events);
        
    } catch (error) {
        console.error('Error fetching events:', error);
        showNotification('Klaida gaunant įvykius', 'error');
    }
}

// Create event element
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = `p-3 rounded-lg ${eventTypeColors[event.event_type]} mb-3 transition-all duration-200 hover:shadow-md`;
    eventElement.style.cursor = 'pointer';
    
    const eventContent = document.createElement('div');
    eventContent.className = 'space-y-2';
    
    // Title and time
    const titleTimeContainer = document.createElement('div');
    titleTimeContainer.className = 'flex justify-between items-start';
    
    const title = document.createElement('div');
    title.className = 'font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis';
    title.textContent = event.title;
    
    const time = document.createElement('div');
    time.className = 'text-xs ml-2 whitespace-nowrap';
    time.textContent = event.time || '';
    
    titleTimeContainer.appendChild(title);
    titleTimeContainer.appendChild(time);
    
    // Description
    if (event.description) {
        const description = document.createElement('div');
        description.className = 'text-xs line-clamp-2';
        description.textContent = event.description;
        eventContent.appendChild(description);
    }
    
    // Event options menu
    const optionsButton = document.createElement('button');
    optionsButton.className = 'absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700';
    optionsButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>';
    
    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10';
    optionsMenu.innerHTML = `
        <div class="py-1">
            <button class="edit-event w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Redaguoti
            </button>
            <button class="delete-event w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                Ištrinti
            </button>
        </div>
    `;
    
    eventElement.appendChild(eventContent);
    eventElement.appendChild(optionsButton);
    eventElement.appendChild(optionsMenu);
    
    // Event handlers
    optionsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEventOptions(optionsMenu);
    });
    
    optionsMenu.querySelector('.edit-event').addEventListener('click', (e) => {
        e.stopPropagation();
        editEvent(event);
    });
    
    optionsMenu.querySelector('.delete-event').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEvent(event.id);
    });
    
    return eventElement;
}

// Toggle event options menu
function toggleEventOptions(menu) {
    const allMenus = document.querySelectorAll('.options-menu');
    allMenus.forEach(m => {
        if (m !== menu) m.classList.add('hidden');
    });
    menu.classList.toggle('hidden');
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Ar tikrai norite ištrinti šį įvykį?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('calendar_events')
            .delete()
            .eq('id', eventId);
            
        if (error) throw error;
        
        showNotification('Įvykis sėkmingai ištrintas', 'success');
        updateEvents();
        
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('Klaida trinant įvykį', 'error');
    }
}

// Edit event
function editEvent(event) {
    showEventForm(event);
}

// Show event form
function showEventForm(event = null) {
    const titleInput = document.getElementById('event-title');
    const descriptionInput = document.getElementById('event-description');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const typeInput = document.getElementById('event-type');
    
    if (event) {
        titleInput.value = event.title;
        descriptionInput.value = event.description || '';
        dateInput.value = event.date;
        timeInput.value = event.time || '';
        typeInput.value = event.event_type;
        eventForm.dataset.eventId = event.id;
    } else {
        eventForm.reset();
        delete eventForm.dataset.eventId;
    }
    
    eventModal.classList.remove('hidden');
}

// Hide event form
function hideEventForm() {
    eventModal.classList.add('hidden');
    eventForm.reset();
    delete eventForm.dataset.eventId;
}

// Update events list
function updateEventsList(events) {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="p-4 text-center text-gray-500 dark:text-gray-400">
                Nėra artėjančių įvykių
            </div>
        `;
        return;
    }
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0`;
        
        const date = new Date(event.date);
        const formattedDate = date.toLocaleDateString('lt-LT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        eventElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">${event.title}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${formattedDate} ${event.time || ''}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${eventTypeColors[event.event_type]}">
                    ${getEventTypeLabel(event.event_type)}
                </span>
            </div>
            ${event.description ? `<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">${event.description}</p>` : ''}
        `;
        
        eventsList.appendChild(eventElement);
    });
}

// Get event type label
function getEventTypeLabel(type) {
    const labels = {
        homework: 'Namų darbai',
        test: 'Kontrolinis darbas',
        project: 'Projektas',
        meeting: 'Susirinkimas',
        other: 'Kitas'
    };
    return labels[type] || type;
}

// Setup event listeners
function setupEventListeners() {
    // Month navigation
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });
    
    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });
    
    // Add event button
    addEventButton.addEventListener('click', () => {
        showEventForm();
    });
    
    // Cancel event button
    cancelEventButton.addEventListener('click', hideEventForm);
    
    // Event form submission
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            event_type: document.getElementById('event-type').value,
            user_id: currentUserId
        };
        
        try {
            if (eventForm.dataset.eventId) {
                // Update existing event
                const { error } = await supabaseClient
                    .from('calendar_events')
                    .update(formData)
                    .eq('id', eventForm.dataset.eventId);
                    
                if (error) throw error;
                showNotification('Įvykis sėkmingai atnaujintas', 'success');
                
            } else {
                // Create new event
                const { error } = await supabaseClient
                    .from('calendar_events')
                    .insert([formData]);
                    
                if (error) throw error;
                showNotification('Įvykis sėkmingai sukurtas', 'success');
            }
            
            hideEventForm();
            updateEvents();
            
        } catch (error) {
            console.error('Error saving event:', error);
            showNotification('Klaida išsaugant įvykį', 'error');
        }
    });
    
    // Close modal when clicking outside
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            hideEventForm();
        }
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const options = {
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: type === 'success' ? '#10B981' : '#EF4444'
    };
    
    Toastify(options).showToast();
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCalendar); 