// Import Supabase client
import supabase from '../../supabase-config.js';

// DOM elements
const scheduleGrid = document.getElementById('schedule-grid');
const classesList = document.getElementById('classes-list');
const addClassModal = document.getElementById('add-class-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelAddBtn = document.getElementById('cancel-add');
const addClassForm = document.getElementById('add-class-form');
const viewTabs = document.getElementById('view-tabs');
const weeklyView = document.getElementById('weekly-view');
const listView = document.getElementById('list-view');

// Sample data (in a real app, this would be fetched from Supabase)
const sampleClasses = [
    {
        id: 1,
        title: 'Mathematics 101',
        code: 'MATH101',
        startTime: '09:00',
        endTime: '10:30',
        days: ['mon', 'wed', 'fri'],
        room: 'A201',
        instructor: 'Dr. Smith',
        credits: 3,
        color: 'blue'
    },
    {
        id: 2,
        title: 'Introduction to Computer Science',
        code: 'CS202',
        startTime: '11:00',
        endTime: '12:30',
        days: ['tue', 'thu'],
        room: 'B103',
        instructor: 'Prof. Johnson',
        credits: 4,
        color: 'green'
    },
    {
        id: 3,
        title: 'English Literature',
        code: 'ENG210',
        startTime: '14:00',
        endTime: '15:30',
        days: ['mon', 'wed'],
        room: 'C302',
        instructor: 'Dr. Williams',
        credits: 3,
        color: 'purple'
    },
    {
        id: 4,
        title: 'Introduction to Psychology',
        code: 'PSYCH101',
        startTime: '13:00',
        endTime: '14:30',
        days: ['tue', 'thu'],
        room: 'D405',
        instructor: 'Dr. Miller',
        credits: 3,
        color: 'red'
    },
    {
        id: 5,
        title: 'Physics for Scientists',
        code: 'PHYS202',
        startTime: '15:00',
        endTime: '16:30',
        days: ['mon', 'wed', 'fri'],
        room: 'E107',
        instructor: 'Dr. Brown',
        credits: 4,
        color: 'yellow'
    }
];

// Time slots for the schedule grid
const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

// Day indexes for positioning classes
const dayIndexes = {
    'mon': 0,
    'tue': 1,
    'wed': 2,
    'thu': 3,
    'fri': 4,
    'sat': 5,
    'sun': 6
};

// Store grid cells for positioning
const gridCellsByDay = {
    'mon': [],
    'tue': [],
    'wed': [],
    'thu': [],
    'fri': [],
    'sat': [],
    'sun': []
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializeScheduleGrid();
    renderClasses();
    setupEventListeners();
    initDarkMode();
    
    // Update classes on window resize to ensure proper positioning
    window.addEventListener('resize', () => {
        renderClasses();
    });
});

// Initialize the schedule grid with time slots
function initializeScheduleGrid() {
    // Clear any existing content
    scheduleGrid.innerHTML = '';
    
    // Reset cell storage
    Object.keys(gridCellsByDay).forEach(day => {
        gridCellsByDay[day] = new Array(timeSlots.length).fill(null);
    });
    
    // For each time slot
    timeSlots.forEach((time, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex';
        rowDiv.dataset.timeRow = rowIndex;
        
        // Create time label cell
        const timeLabel = document.createElement('div');
        timeLabel.className = 'w-24 p-2 text-xs text-gray-500 dark:text-gray-400 text-right pr-3 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 z-10';
        timeLabel.textContent = time;
        
        // Create grid cells for each day
        const gridCells = document.createElement('div');
        gridCells.className = 'flex-1 grid grid-cols-7';
        
        // Add 7 cells, one for each day of the week
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const day = Object.keys(dayIndexes)[dayIndex];
            const cell = document.createElement('div');
            cell.className = 'border-b border-l border-gray-200 dark:border-gray-700 h-8';
            cell.dataset.time = time;
            cell.dataset.day = day;
            cell.dataset.rowIndex = rowIndex;
            cell.dataset.dayIndex = dayIndex;
            
            if (rowIndex % 2 === 0) {
                cell.classList.add('bg-gray-50', 'dark:bg-gray-750');
            }
            
            // Store cell reference for positioning
            gridCellsByDay[day][rowIndex] = cell;
            
            gridCells.appendChild(cell);
        }
        
        rowDiv.appendChild(timeLabel);
        rowDiv.appendChild(gridCells);
        scheduleGrid.appendChild(rowDiv);
    });
}

// Render classes to the schedule grid and list view
function renderClasses() {
    // Clear previous content
    const allClassSlots = document.querySelectorAll('.class-slot');
    allClassSlots.forEach(slot => slot.remove());
    classesList.innerHTML = '';
    
    // Render each class
    sampleClasses.forEach(classItem => {
        renderClassToSchedule(classItem);
        renderClassToList(classItem);
    });
    
    // Update statistics
    updateScheduleStats();
}

// Render a class to the weekly schedule grid
function renderClassToSchedule(classItem) {
    // For each day the class is scheduled
    classItem.days.forEach(day => {
        const startTimeIndex = timeSlots.indexOf(classItem.startTime);
        const endTimeIndex = timeSlots.indexOf(classItem.endTime);
        const dayIndex = dayIndexes[day];
        
        if (startTimeIndex === -1 || endTimeIndex === -1) {
            console.error('Invalid time slot for class:', classItem);
            return;
        }
        
        // Get the starting cell
        const startCell = gridCellsByDay[day][startTimeIndex];
        
        if (!startCell) {
            console.error('Start cell not found for', day, startTimeIndex);
            return;
        }
        
        // Create class slot element
        const classSlot = document.createElement('div');
        classSlot.className = `class-slot absolute rounded-md p-2 overflow-hidden z-20 bg-${classItem.color}-100 dark:bg-${classItem.color}-900 text-${classItem.color}-800 dark:text-${classItem.color}-200 border border-${classItem.color}-200 dark:border-${classItem.color}-800 hover:shadow-md transition-transform cursor-pointer`;
        classSlot.dataset.classId = classItem.id;
        
        // Set content
        classSlot.innerHTML = `
            <div class="font-medium text-sm truncate">${classItem.title}</div>
            <div class="text-xs truncate">${classItem.room}</div>
        `;
        
        // Get dimensions from cell
        const cellRect = startCell.getBoundingClientRect();
        const gridRect = scheduleGrid.getBoundingClientRect();
        
        // Calculate duration in 30-min blocks
        const durationBlocks = endTimeIndex - startTimeIndex;
        const cellHeight = 32; // Fixed cell height
        
        // Position directly using the grid cell system
        classSlot.style.position = 'absolute';
        classSlot.style.top = `${startTimeIndex * cellHeight}px`;
        classSlot.style.left = `${96 + (dayIndex * ((gridRect.width - 96) / 7))}px`; // 96px is width of time column (w-24)
        classSlot.style.width = `${(gridRect.width - 96) / 7 - 2}px`; // Subtract 2px for borders
        classSlot.style.height = `${durationBlocks * cellHeight}px`;
        
        // Add hover effect
        classSlot.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.02)';
            this.style.zIndex = '30';
        });
        
        classSlot.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
            this.style.zIndex = '20';
        });
        
        // Add click handler to show class details
        classSlot.addEventListener('click', function() {
            alert(`Class Details:\n${classItem.title} (${classItem.code})\nInstructor: ${classItem.instructor}\nRoom: ${classItem.room}\nTime: ${classItem.startTime} - ${classItem.endTime}`);
        });
        
        scheduleGrid.appendChild(classSlot);
    });
}

// Update schedule statistics
function updateScheduleStats() {
    // Calculate total class hours
    let totalHours = 0;
    let totalCredits = 0;
    const busyDays = new Set();
    
    sampleClasses.forEach(classItem => {
        // Calculate class duration in hours
        const startTime = classItem.startTime.split(':').map(Number);
        const endTime = classItem.endTime.split(':').map(Number);
        const durationHours = (endTime[0] + endTime[1]/60) - (startTime[0] + startTime[1]/60);
        
        // Multiply by number of days
        totalHours += durationHours * classItem.days.length;
        
        // Add credits
        totalCredits += classItem.credits;
        
        // Track busy days
        classItem.days.forEach(day => busyDays.add(day));
    });
    
    // Calculate free days
    const freeDays = Object.keys(dayIndexes).filter(day => !busyDays.has(day));
    
    // Update statistics in UI
    document.querySelector('.grid-cols-3 > div:nth-child(1) .text-2xl').textContent = totalHours.toFixed(1);
    document.querySelector('.grid-cols-3 > div:nth-child(1) .bg-primary-500').style.width = `${Math.min(100, (totalHours / 20) * 100)}%`;
    document.querySelector('.grid-cols-3 > div:nth-child(1) .mt-2').textContent = `${totalHours.toFixed(1)} hours out of recommended 20`;
    
    document.querySelector('.grid-cols-3 > div:nth-child(2) .text-2xl').textContent = totalCredits;
    document.querySelector('.grid-cols-3 > div:nth-child(2) .bg-primary-500').style.width = `${Math.min(100, (totalCredits / 20) * 100)}%`;
    document.querySelector('.grid-cols-3 > div:nth-child(2) .mt-2').textContent = `${totalCredits} credits out of recommended 20`;
    
    document.querySelector('.grid-cols-3 > div:nth-child(3) .text-2xl').textContent = freeDays.length;
    
    // Update free days display
    const freeDaysContainer = document.querySelector('.grid-cols-3 > div:nth-child(3) .flex');
    freeDaysContainer.innerHTML = '';
    
    const dayNames = {
        'mon': 'Monday',
        'tue': 'Tuesday',
        'wed': 'Wednesday',
        'thu': 'Thursday', 
        'fri': 'Friday',
        'sat': 'Saturday',
        'sun': 'Sunday'
    };
    
    freeDays.forEach(day => {
        const daySpan = document.createElement('span');
        daySpan.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-2';
        daySpan.textContent = dayNames[day];
        freeDaysContainer.appendChild(daySpan);
    });
}

// Render a class to the list view
function renderClassToList(classItem) {
    const row = document.createElement('tr');
    
    // Format days of week
    const daysAbbr = {
        'mon': 'Mon',
        'tue': 'Tue',
        'wed': 'Wed',
        'thu': 'Thu',
        'fri': 'Fri',
        'sat': 'Sat',
        'sun': 'Sun'
    };
    
    const formattedDays = classItem.days.map(day => daysAbbr[day]).join(', ');
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-8 w-2 bg-${classItem.color}-500 rounded-full"></div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${classItem.title}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${classItem.code}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            ${formattedDays}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            ${classItem.startTime} - ${classItem.endTime}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            ${classItem.room}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            ${classItem.instructor}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-class-id="${classItem.id}">Remove</button>
        </td>
    `;
    
    // Add event listener for remove button
    const removeBtn = row.querySelector('button[data-class-id]');
    removeBtn.addEventListener('click', function() {
        const classId = parseInt(this.dataset.classId);
        removeClassById(classId);
    });
    
    classesList.appendChild(row);
}

// Remove a class by ID
function removeClassById(classId) {
    if (confirm('Are you sure you want to remove this class from your schedule?')) {
        // Filter out the class with the given ID
        const newClasses = sampleClasses.filter(c => c.id !== classId);
        
        // Update the classes array (in a real app, would also update Supabase)
        sampleClasses.length = 0;
        sampleClasses.push(...newClasses);
        
        // Re-render the schedule
        renderClasses();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Modal close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            addClassModal.classList.add('hidden');
            addClassModal.classList.remove('flex');
        });
    }
    
    // Cancel adding a class
    if (cancelAddBtn) {
        cancelAddBtn.addEventListener('click', function() {
            addClassModal.classList.add('hidden');
            addClassModal.classList.remove('flex');
            if (addClassForm) addClassForm.reset();
        });
    }
    
    // Submit handler for the add class form
    if (addClassForm) {
        addClassForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            
            // Validate that at least one day is selected
            if (formData.getAll('days').length === 0) {
                alert('Please select at least one day of the week.');
                return;
            }
            
            // Add the new class
            addNewClass(formData);
            
            // Reset the form
            this.reset();
        });
    }
    
    // Tab switching for views
    viewTabs.querySelectorAll('button').forEach(tab => {
        tab.addEventListener('click', function() {
            // Get the view to show
            const viewToShow = this.dataset.view;
            
            // Update active tab styling
            viewTabs.querySelectorAll('button').forEach(t => {
                t.classList.remove('active-tab', 'border-primary-500', 'text-primary-600', 'dark:text-primary-400');
                t.classList.add('inactive-tab', 'border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300');
            });
            
            this.classList.remove('inactive-tab', 'border-transparent', 'hover:text-gray-600', 'hover:border-gray-300', 'dark:hover:text-gray-300');
            this.classList.add('active-tab', 'border-primary-500', 'text-primary-600', 'dark:text-primary-400');
            
            // Show the selected view, hide the other
            if (viewToShow === 'weekly') {
                weeklyView.classList.remove('hidden');
                listView.classList.add('hidden');
            } else {
                weeklyView.classList.add('hidden');
                listView.classList.remove('hidden');
            }
        });
    });
}

// Add a new class to the schedule (kept for potential future use)
function addNewClass(formData) {
    // Create a new class object
    const newClass = {
        id: sampleClasses.length > 0 ? Math.max(...sampleClasses.map(c => c.id)) + 1 : 1,
        title: formData.get('class-title'),
        code: formData.get('course-code'),
        startTime: formData.get('start-time'),
        endTime: formData.get('end-time'),
        days: Array.from(formData.getAll('days')),
        room: formData.get('room'),
        instructor: formData.get('instructor'),
        credits: parseInt(formData.get('credits')),
        color: formData.get('color')
    };
    
    // Add to the classes array (in a real app, would also add to Supabase)
    sampleClasses.push(newClass);
    
    // Re-render the schedule
    renderClasses();
    
    // Hide the modal
    addClassModal.classList.add('hidden');
    addClassModal.classList.remove('flex');
}

// Initialize dark mode
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDarkMode = document.documentElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            
            // Update icon visibility
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
} 