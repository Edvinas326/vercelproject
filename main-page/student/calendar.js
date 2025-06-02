// Initialize Supabase client
const { createClient } = supabase;
const supabaseUrl = 'https://btlkhjvfgotdspjucqhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGtoanZmZ290ZHNwanVjcWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDU4OTIsImV4cCI6MjA2MjIyMTg5Mn0.QRw30CjtxaWrwihv2hmEo9SdvaKKjYQcpeTQwWkq2T4';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Get current user ID
let currentUserId = null;

// Get current user
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        currentUserId = user.id;
    } catch (error) {
        console.error('Error getting current user:', error);
    }
}

// Calendar initialization
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// DOM Elements
const calendarElements = {
    container: document.getElementById('calendar-container'),
    days: document.getElementById('calendar-days'),
    eventsList: document.getElementById('events-list'),
    prevButton: document.getElementById('prev-month'),
    nextButton: document.getElementById('next-month')
};

// Initialize calendar
async function initializeCalendar() {
    // Add event listeners
    calendarElements.prevButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });

    calendarElements.nextButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });

    // Add event button listener
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', showEventForm);
    }

    // Initial calendar render
    await updateCalendar();
}

// Update calendar display
async function updateCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7
    const totalDays = lastDay.getDate();
    
    // Clear previous calendar
    calendarElements.days.innerHTML = '';
    
    // Add previous month's days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i > 0; i--) {
        const dayElement = createDayElement(prevMonthLastDay - i + 1, '');
        calendarElements.days.appendChild(dayElement);
    }
    
    // Add current month's days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isToday = isSameDay(date, new Date());
        const dayElement = createDayElement(day, isToday ? 'bg-blue-50 dark:bg-blue-900/20' : '');
        calendarElements.days.appendChild(dayElement);
    }
    
    // Add next month's days
    const remainingDays = 42 - (startingDay - 1 + totalDays); // 42 = 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createDayElement(day, '');
        calendarElements.days.appendChild(dayElement);
    }
    
    // Update events
    await updateEvents();
}

// Create day element
function createDayElement(day, className) {
    const div = document.createElement('div');
    div.className = `min-h-[60px] p-1 border border-gray-200 dark:border-gray-700 ${className}`;
    div.innerHTML = `<span class="text-sm text-gray-900 dark:text-gray-100">${day}</span>`;
    return div;
}

// Update events list
async function updateEvents() {
    try {
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);

        const { data: events, error } = await supabaseClient
            .from('calendar_events')
            .select('id, title, description, date, time, event_type')
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching events:', error);
            return;
        }

        // Clear events list
        calendarElements.eventsList.innerHTML = '';

        if (!events || events.length === 0) {
            const noEvents = document.createElement('div');
            noEvents.className = 'text-sm text-gray-500 dark:text-gray-400 text-center py-4';
            noEvents.textContent = 'Šį mėnesį nėra įvykių';
            calendarElements.eventsList.appendChild(noEvents);
            return;
        }

        // Group events by date
        const eventsByDate = {};
        events.forEach(event => {
            const date = event.date;
            if (!eventsByDate[date]) {
                eventsByDate[date] = [];
            }
            eventsByDate[date].push(event);
        });

        // Display events
        Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
            dateHeader.textContent = new Date(date).toLocaleDateString('lt-LT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            calendarElements.eventsList.appendChild(dateHeader);

            dateEvents.forEach(event => {
                const eventElement = createEventElement(event);
                calendarElements.eventsList.appendChild(eventElement);
            });
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'text-sm text-red-500 dark:text-red-400 text-center py-4';
        errorMessage.textContent = 'Klaida gaunant įvykius';
        calendarElements.eventsList.appendChild(errorMessage);
    }
}

// Create event element
function createEventElement(event) {
    const div = document.createElement('div');
    div.className = 'event-item bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm mb-3 text-sm hover:shadow-md transition-shadow duration-200';
    
    const eventType = event.event_type || 'other';
    const typeColors = {
        homework: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        test: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        project: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        meeting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    div.innerHTML = `
        <div class="flex flex-col space-y-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 flex-1 min-w-0">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${typeColors[eventType]} whitespace-nowrap">
                        ${event.title}
                    </span>
                    <span class="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        ${event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
                <div class="relative ml-2 flex-shrink-0">
                    <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200" onclick="toggleEventOptions('${event.id}')">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                    </button>
                    <div id="event-options-${event.id}" class="hidden absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                        <div class="py-1">
                            <button onclick="editEvent('${event.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                <span>Redaguoti</span>
                            </button>
                            <button onclick="deleteEvent('${event.id}')" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                <span>Ištrinti</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            ${event.description ? `
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">${event.description}</p>
            ` : ''}
        </div>
    `;
    
    return div;
}

// Toggle event options menu
window.toggleEventOptions = function(eventId) {
    const optionsMenu = document.getElementById(`event-options-${eventId}`);
    const allMenus = document.querySelectorAll('[id^="event-options-"]');
    
    // Close all other menus
    allMenus.forEach(menu => {
        if (menu.id !== `event-options-${eventId}`) {
            menu.classList.add('hidden');
        }
    });
    
    // Toggle current menu
    optionsMenu.classList.toggle('hidden');
};

// Close all event option menus when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('[id^="event-options-"]') && !event.target.closest('button')) {
        const allMenus = document.querySelectorAll('[id^="event-options-"]');
        allMenus.forEach(menu => menu.classList.add('hidden'));
    }
});

// Delete event
window.deleteEvent = async function(eventId) {
    if (!confirm('Ar tikrai norite ištrinti šį įvykį?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('calendar_events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;

        // Refresh calendar
        await updateCalendar();

        // Show success message
        Toastify({
            text: "Įvykis sėkmingai ištrintas",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#10B981"
            }
        }).showToast();
    } catch (error) {
        console.error('Error deleting event:', error);
        Toastify({
            text: "Klaida ištrinant įvykį",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#EF4444"
            }
        }).showToast();
    }
};

// Edit event
window.editEvent = async function(eventId) {
    try {
        const { data: event, error } = await supabaseClient
            .from('calendar_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        // Show modal with event data
        showEventForm(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        Toastify({
            text: "Klaida gaunant įvykio duomenis",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#EF4444"
            }
        }).showToast();
    }
};

// Update showEventForm to handle editing
async function showEventForm(eventData = null) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'eventModal';

    // Create modal content
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        ${eventData ? 'Redaguoti įvykį' : 'Pridėti naują įvykį'}
                    </h3>
                    <button class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" id="closeModal">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="eventForm" class="space-y-4">
                    <input type="hidden" id="eventId" value="${eventData ? eventData.id : ''}">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pavadinimas</label>
                        <input type="text" id="eventTitle" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                               value="${eventData ? eventData.title : ''}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aprašymas</label>
                        <textarea id="eventDescription"
                                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                  rows="3">${eventData ? eventData.description : ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                        <input type="date" id="eventDate" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                               value="${eventData ? eventData.date : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Laikas</label>
                        <input type="time" id="eventTime" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                               value="${eventData ? eventData.time : '12:00'}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipas</label>
                        <select id="eventType" required
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                            <option value="homework" ${eventData && eventData.event_type === 'homework' ? 'selected' : ''}>Namų darbai</option>
                            <option value="test" ${eventData && eventData.event_type === 'test' ? 'selected' : ''}>Kontrolinis darbas</option>
                            <option value="project" ${eventData && eventData.event_type === 'project' ? 'selected' : ''}>Projektas</option>
                            <option value="meeting" ${eventData && eventData.event_type === 'meeting' ? 'selected' : ''}>Susirinkimas</option>
                            <option value="other" ${eventData && eventData.event_type === 'other' ? 'selected' : ''}>Kita</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelEvent"
                                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            Atšaukti
                        </button>
                        <button type="submit"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            ${eventData ? 'Atnaujinti' : 'Išsaugoti'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.appendChild(modal);

    // Add event listeners
    const closeModal = () => {
        document.body.removeChild(modal);
    };

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelEvent').addEventListener('click', closeModal);

    // Handle form submission
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserId) {
            Toastify({
                text: "Klaida: Vartotojas neprisijungęs",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "#EF4444"
                }
            }).showToast();
            return;
        }

        const eventId = document.getElementById('eventId').value;
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const type = document.getElementById('eventType').value;

        try {
            let result;
            if (eventId) {
                // Update existing event
                result = await supabaseClient
                    .from('calendar_events')
                    .update({
                        title,
                        description,
                        date,
                        time,
                        event_type: type
                    })
                    .eq('id', eventId)
                    .select('id, title, description, date, time, event_type')
                    .single();
            } else {
                // Create new event
                result = await supabaseClient
                    .from('calendar_events')
                    .insert({
                        title,
                        description,
                        date,
                        time,
                        event_type: type,
                        user_id: currentUserId
                    })
                    .select('id, title, description, date, time, event_type')
                    .single();
            }

            if (result.error) throw result.error;

            // Close modal and refresh calendar
            closeModal();
            await updateCalendar();

            // Show success message
            Toastify({
                text: eventId ? "Įvykis sėkmingai atnaujintas" : "Įvykis sėkmingai pridėtas",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "#10B981"
                }
            }).showToast();
        } catch (error) {
            console.error('Error saving event:', error);
            Toastify({
                text: "Klaida išsaugant įvykį",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "#EF4444"
                }
            }).showToast();
        }
    });
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await getCurrentUser();
    initializeCalendar();
}); 