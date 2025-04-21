import supabase from '../../supabase-config.js'

async function loadCalendarHTML() {
    try {
        const response = await fetch('calendar/calendar.html')
        const html = await response.text()
        document.getElementById('calendar-container').innerHTML = html

        // Initialize calendar after HTML is loaded
        initializeCalendar()
    } catch (error) {
        console.error('Error loading calendar:', error)
    }
}

function initializeCalendar() {
    // Get DOM elements after they're loaded
    const calendarElements = {
        monthDisplay: document.getElementById('currentMonth'),
        prevButton: document.getElementById('prevMonth'),
        nextButton: document.getElementById('nextMonth'),
        daysGrid: document.getElementById('calendar-days'),
        eventsList: document.getElementById('events-list'),
        addEventButton: document.getElementById('add-event-button'),
        eventModal: document.getElementById('event-modal'),
        eventForm: document.getElementById('event-form')
    }

    console.log('Checking calendar elements: ', calendarElements)

    if (!calendarElements.monthDisplay || !calendarElements.prevButton || 
        !calendarElements.nextButton || !calendarElements.daysGrid || 
        !calendarElements.eventsList || !calendarElements.eventModal) {
        console.error('Required calendar elements not found')
        return
    }

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    async function fetchEventsForMonth(year, month) {
        try {
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const { data: events, error } = await supabase
                .from('calendar_events')
                .select('*')
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

    async function updateCalendar() {
        try {
            // Update month/year display
            calendarElements.monthDisplay.textContent = `${months[currentMonth]} ${currentYear}`;

            // Clear existing calendar
            calendarElements.daysGrid.innerHTML = '';

            // Get first day of the month and total days
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
            const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

            // Fetch events for the current month
            const events = await fetchEventsForMonth(currentYear, currentMonth);

            // Add previous month's days
            for (let i = firstDay - 1; i >= 0; i--) {
                const day = prevMonthLastDate - i;
                calendarElements.daysGrid.innerHTML += `
                    <div class="p-2 text-gray-400">
                        ${day}
                    </div>
                `;
            }

            // Add current month's days
            const today = new Date();
            const isCurrentMonth = today.getMonth() === currentMonth && 
                                 today.getFullYear() === currentYear;

            for (let i = 1; i <= lastDate; i++) {
                const date = new Date(currentYear, currentMonth, i).toISOString().split('T')[0];
                const dayEvents = events.filter(event => event.date === date);
                const isToday = isCurrentMonth && i === today.getDate();
                const hasEvents = dayEvents.length > 0;
                
                // Get the event type for styling (use the first event's type if multiple events)
                const eventType = hasEvents ? `event-${dayEvents[0].event_type}` : '';
                
                calendarElements.daysGrid.innerHTML += `
                    <div class="p-2 hover:bg-gray-100 cursor-pointer relative 
                        ${isToday ? 'today' : ''} 
                        ${hasEvents ? 'has-event ' + eventType : ''}" 
                        data-date="${date}">
                        <span>${i}</span>
                        ${hasEvents ? `
                            <div class="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                                ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            // Add click handlers for days
            const dayElements = calendarElements.daysGrid.querySelectorAll('div:not(.text-gray-400)');
            dayElements.forEach(day => {
                day.addEventListener('click', () => {
                    const date = day.dataset.date;
                    openEventModal(date);
                });
            });

            // Update events list
            updateEventsList(events);

        } catch (error) {
            console.error('Error updating calendar:', error);
        }
    }

    // Define deleteCalendarEvent within initializeCalendar scope
    async function deleteCalendarEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            // Show success message
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
            notification.textContent = 'Event deleted successfully!';
            document.body.appendChild(notification);

            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);

            // Refresh calendar to show updated events
            await updateCalendar();

        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    }

    // Expose deleteCalendarEvent to window scope
    window.deleteCalendarEvent = deleteCalendarEvent;

    function updateEventsList(events) {
        calendarElements.eventsList.innerHTML = '';
        if (!events || events.length === 0) {
            calendarElements.eventsList.innerHTML = '<p class="text-gray-500 text-sm text-center">No events this month</p>';
            return;
        }

        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        events.forEach(event => {
            const eventDate = new Date(event.date).toLocaleDateString();
            calendarElements.eventsList.innerHTML += `
                <div class="event-item group hover:bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center flex-1 min-w-0">
                            <div class="w-2 h-2 ${getEventTypeColor(event.event_type)} rounded-full mt-2 mr-3"></div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium truncate">${event.title}</div>
                                <div class="text-sm text-gray-600">${eventDate}</div>
                                <div class="text-sm text-gray-500 truncate">${event.description || ''}</div>
                            </div>
                        </div>
                        <button onclick="deleteCalendarEvent('${event.id}')" 
                                class="invisible group-hover:visible text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 self-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span class="text-sm">Delete</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    function getEventTypeColor(type) {
        const colors = {
            'test': 'text-red-500',
            'homework': 'text-blue-500',
            'project': 'text-green-500',
            'meeting': 'text-yellow-500',
            'other': 'text-gray-500'
        };
        return colors[type] || colors.other;
    }

    // Navigation event listeners
    calendarElements.prevButton.addEventListener('click', async (e) => {
        e.preventDefault();
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        await updateCalendar();
    });

    calendarElements.nextButton.addEventListener('click', async (e) => {
        e.preventDefault();
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        await updateCalendar();
    });

    // Modal functions
    async function openEventModal(date) {
        if (!calendarElements.eventModal || !calendarElements.eventForm) {
            console.error('Modal or form elements not found');
            return;
        }

        try {
            // Format date for display
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Set modal date
            calendarElements.eventModal.querySelector('#modalDate').textContent = formattedDate;
            calendarElements.eventModal.querySelector('#eventDate').value = date;

            // Fetch events for this date
            const { data: events, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('date', date)
                .order('created_at');

            if (error) throw error;

            // Update events list in modal
            const modalEventsList = document.getElementById('modal-events-list');
            modalEventsList.innerHTML = '';

            if (events && events.length > 0) {
                events.forEach(event => {
                    modalEventsList.innerHTML += `
                        <div class="event-item mb-3 p-3 bg-gray-50 rounded-lg">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h5 class="font-medium text-gray-900">${event.title}</h5>
                                    <p class="text-sm text-gray-600">${event.description || ''}</p>
                                    <span class="text-xs text-gray-500">${event.event_type}</span>
                                </div>
                                <button onclick="deleteCalendarEvent('${event.id}')" 
                                        class="text-gray-400 hover:text-red-500 p-1">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `;
                });
            } else {
                modalEventsList.innerHTML = `
                    <p class="text-gray-500 text-center py-4">No events for this date</p>
                `;
            }

            // Show modal
            calendarElements.eventModal.classList.remove('hidden');
            calendarElements.eventModal.classList.add('flex');

        } catch (error) {
            console.error('Error opening event modal:', error);
            alert('Failed to load events. Please try again.');
        }
    }

    window.closeEventModal = function() {
        if (calendarElements.eventModal) {
            calendarElements.eventModal.classList.add('hidden');
            calendarElements.eventModal.classList.remove('flex');
        }
    }

    // Add event button click handler
    const addEventButton = document.createElement('button');
    addEventButton.className = 'bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors';
    addEventButton.textContent = 'Add Event';
    calendarElements.monthDisplay.parentNode.appendChild(addEventButton);

    addEventButton.addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        openEventModal(today);
    });

    // Event form handling
    if (calendarElements.eventForm) {
        calendarElements.eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const user = await supabase.auth.getUser();
                if (!user.data.user) {
                    alert('Please log in to add events');
                    return;
                }

                const eventData = {
                    user_id: user.data.user.id,
                    title: calendarElements.eventForm.querySelector('#eventTitle').value,
                    description: calendarElements.eventForm.querySelector('#eventDescription').value,
                    date: calendarElements.eventForm.querySelector('#eventDate').value,
                    event_type: calendarElements.eventForm.querySelector('#eventType').value
                };

                const { error } = await supabase
                    .from('calendar_events')
                    .insert(eventData);

                if (error) throw error;

                // Clear form
                calendarElements.eventForm.reset();
                
                // Close modal
                closeEventModal();
                
                // Refresh calendar to show new event
                await updateCalendar();
                
                // Show success message
                alert('Event saved successfully!');
            } catch (error) {
                console.error('Error saving event:', error);
                alert('Failed to save event. Please try again.');
            }
        });
    } else {
        console.error('Event form not found');
    }

    // Initialize calendar
    updateCalendar();
}

// Load calendar when the page is ready
document.addEventListener('DOMContentLoaded', loadCalendarHTML) 