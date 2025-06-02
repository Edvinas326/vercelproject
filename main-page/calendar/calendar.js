// Get Supabase client from window object
const supabase = window.supabase;

// State
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let userId = null;

// DOM Elements
const calendarDays = document.getElementById('calendar-days');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const addEventButton = document.getElementById('add-event-button');
const eventModal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const cancelEventButton = document.getElementById('cancel-event');

// Event type colors
const eventTypeColors = {
    homework: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    test: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    project: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

// Lithuanian month names
const months = [
    'Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis',
    'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'
];

// Initialize calendar
async function initializeCalendar() {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
            userId = user.id;
        }

        // Set up event listeners
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

        addEventButton.addEventListener('click', () => {
            showEventForm();
        });

        cancelEventButton.addEventListener('click', () => {
            hideEventForm();
        });

        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleEventSubmit();
        });

        // Initial calendar update
        await updateCalendar();
    } catch (error) {
        console.error('Error initializing calendar:', error);
        showNotification('Klaida inicializuojant kalendorių', 'error');
    }
}

// Update calendar display
async function updateCalendar() {
    try {
        // Update month display
        currentMonthElement.textContent = `${months[currentMonth]} ${currentYear}`;

        // Clear existing calendar
        calendarDays.innerHTML = '';

        // Get first day of the month and total days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

        // Fetch events for the current month
        const events = await fetchEventsForMonth(currentYear, currentMonth);

        // Add previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthLastDate - i;
            const dayElement = createDayElement(day, 'prev-month');
            calendarDays.appendChild(dayElement);
        }

        // Add current month's days
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && 
                             today.getFullYear() === currentYear;

        for (let i = 1; i <= lastDate; i++) {
            const date = new Date(currentYear, currentMonth, i).toISOString().split('T')[0];
            const dayEvents = events.filter(event => event.date === date);
            const isToday = isCurrentMonth && i === today.getDate();
            
            const dayElement = createDayElement(i, 'current-month', {
                date,
                isToday,
                events: dayEvents
            });
            calendarDays.appendChild(dayElement);
        }

        // Add next month's days
        const totalDays = firstDay + lastDate;
        const remainingDays = 42 - totalDays; // 6 rows * 7 days = 42

        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = createDayElement(i, 'next-month');
            calendarDays.appendChild(dayElement);
        }

        // Update events list
        updateEventsList(events);
    } catch (error) {
        console.error('Error updating calendar:', error);
        showNotification('Klaida atnaujinant kalendorių', 'error');
    }
}

// Create day element
function createDayElement(day, monthType, options = {}) {
    const div = document.createElement('div');
    div.className = `p-2 text-center relative ${monthType === 'current-month' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-gray-400'}`;
    
    if (options.isToday) {
        div.classList.add('bg-blue-50', 'dark:bg-blue-900', 'font-semibold', 'text-blue-600', 'dark:text-blue-300');
    }

    if (options.events && options.events.length > 0) {
        div.classList.add('has-event');
        const eventDot = document.createElement('div');
        eventDot.className = 'absolute bottom-2 left-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2';
        div.appendChild(eventDot);
    }

    div.textContent = day;

    if (options.date) {
        div.dataset.date = options.date;
        div.addEventListener('click', () => showEventForm(options.date));
    }

    return div;
}

// Fetch events for a specific month
async function fetchEventsForMonth(year, month) {
    try {
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date');

        if (error) throw error;
        return events || [];
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

// Update events list
function updateEventsList(events) {
    calendarDays.innerHTML = '';
    
    if (!events || events.length === 0) {
        calendarDays.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                Šį mėnesį nėra įvykių
            </div>
        `;
        return;
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    events.forEach(event => {
        const eventElement = createEventElement(event);
        calendarDays.appendChild(eventElement);
    });
}

// Create event element
function createEventElement(event) {
    const div = document.createElement('div');
    div.className = `event-item ${eventTypeColors[event.event_type] || eventTypeColors.other} rounded-lg p-3 mb-3`;
    
    const date = new Date(event.date).toLocaleDateString('lt-LT');
    const time = event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' }) : '';
    
    div.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
                <h4 class="font-medium text-sm truncate">${event.title}</h4>
                <p class="text-xs opacity-75">${date} ${time}</p>
                ${event.description ? `<p class="text-xs mt-1 line-clamp-2">${event.description}</p>` : ''}
            </div>
            <div class="flex items-center space-x-2 ml-4">
                <button onclick="editEvent('${event.id}')" class="p-1 hover:bg-white/20 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="deleteEvent('${event.id}')" class="p-1 hover:bg-white/20 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Show event form
function showEventForm(date = null) {
    const form = eventForm;
    const modal = eventModal;
    
    // Reset form
    form.reset();
    
    // Set date if provided
    if (date) {
        form.querySelector('#event-date').value = date;
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

// Hide event form
function hideEventForm() {
    eventModal.classList.add('hidden');
}

// Handle event form submission
async function handleEventSubmit() {
    const form = eventForm;
    const formData = new FormData(form);
    
    try {
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            event_type: formData.get('event_type'),
            user_id: userId
        };
        
        const { error } = await supabase
            .from('calendar_events')
            .insert([eventData]);
            
        if (error) throw error;
        
        showNotification('Įvykis sėkmingai pridėtas!', 'success');
        hideEventForm();
        await updateCalendar();
    } catch (error) {
        console.error('Error creating event:', error);
        showNotification('Klaida kuriant įvykį', 'error');
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Ar tikrai norite ištrinti šį įvykį?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId)
            .eq('user_id', userId);
            
        if (error) throw error;
        
        showNotification('Įvykis sėkmingai ištrintas!', 'success');
        await updateCalendar();
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('Klaida ištrinant įvykį', 'error');
    }
}

// Edit event
async function editEvent(eventId) {
    try {
        const { data: event, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('id', eventId)
            .eq('user_id', userId)
            .single();
            
        if (error) throw error;
        
        const form = eventForm;
        form.querySelector('#event-title').value = event.title;
        form.querySelector('#event-description').value = event.description || '';
        form.querySelector('#event-date').value = event.date;
        form.querySelector('#event-time').value = event.time || '';
        form.querySelector('#event-type').value = event.event_type;
        
        showEventForm();
    } catch (error) {
        console.error('Error fetching event:', error);
        showNotification('Klaida gaunant įvykio duomenis', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const options = {
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: type === 'success' ? "#10B981" : "#EF4444",
    };
    
    Toastify(options).showToast();
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCalendar); 
document.addEventListener('DOMContentLoaded', loadCalendarHTML) 
document.addEventListener('DOMContentLoaded', loadCalendarHTML) 