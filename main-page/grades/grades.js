// Import Supabase client
import supabase from '../../supabase-config.js';

// DOM elements
const termSelector = document.getElementById('term-selector');
const currentCoursesTable = document.getElementById('current-courses-table');
const gradeHistoryAccordion = document.getElementById('grade-history-accordion');
const gradeChartContainer = document.getElementById('grade-chart-container');

// Sample data (would be fetched from database in a real app)
const sampleTerms = {
    'current': {
        name: 'Fall 2023',
        gpa: 3.92,
        courses: [
            { code: 'MATH101', name: 'Mathematics 101', instructor: 'Dr. Smith', credits: 4, grade: 'A (95%)', status: 'In Progress' },
            { code: 'CS202', name: 'Computer Science', instructor: 'Prof. Johnson', credits: 3, grade: 'B+ (87%)', status: 'In Progress' },
            { code: 'ENG210', name: 'English Literature', instructor: 'Dr. Williams', credits: 3, grade: 'A- (92%)', status: 'In Progress' }
        ]
    },
    'spring2023': {
        name: 'Spring 2023',
        gpa: 3.75,
        courses: [
            { code: 'PHYS101', name: 'Physics 101', instructor: 'Dr. Newton', credits: 4, grade: 'A (96%)', status: 'Completed' },
            { code: 'HIST202', name: 'History 202', instructor: 'Prof. Adams', credits: 3, grade: 'B (85%)', status: 'Completed' },
            { code: 'ART101', name: 'Introduction to Art', instructor: 'Ms. Picasso', credits: 2, grade: 'A- (91%)', status: 'Completed' }
        ]
    },
    'fall2022': {
        name: 'Fall 2022',
        gpa: 3.60,
        courses: [
            { code: 'CHEM101', name: 'Chemistry 101', instructor: 'Dr. Curie', credits: 4, grade: 'B+ (88%)', status: 'Completed' },
            { code: 'PSYCH201', name: 'Introduction to Psychology', instructor: 'Dr. Freud', credits: 3, grade: 'A (94%)', status: 'Completed' },
            { code: 'ECON101', name: 'Economics 101', instructor: 'Prof. Smith', credits: 3, grade: 'B (84%)', status: 'Completed' }
        ]
    },
    'fall2025': {
        name: 'Fall 2025',
        gpa: 3.92,
        courses: [
            { code: 'MATH101', name: 'Mathematics 101', instructor: 'Dr. Smith', credits: 4, grade: 'A (95%)', status: 'In Progress' },
            { code: 'CS202', name: 'Computer Science', instructor: 'Prof. Johnson', credits: 3, grade: 'B+ (87%)', status: 'In Progress' },
            { code: 'ENG210', name: 'English Literature', instructor: 'Dr. Williams', credits: 3, grade: 'A- (92%)', status: 'In Progress' }
        ]
    },
    'spring2025': {
        name: 'Spring 2025',
        gpa: 3.75,
        courses: [
            { code: 'PHYS101', name: 'Physics 101', instructor: 'Dr. Newton', credits: 4, grade: 'A (96%)', status: 'Completed' },
            { code: 'HIST202', name: 'History 202', instructor: 'Prof. Adams', credits: 3, grade: 'B (85%)', status: 'Completed' },
            { code: 'ART101', name: 'Introduction to Art', instructor: 'Ms. Picasso', credits: 2, grade: 'A- (91%)', status: 'Completed' }
        ]
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the UI
    loadCurrentTerm();
    loadGradeHistory();
    renderGradeDistribution();
    
    // Initialize dark mode
    initDarkMode();
});

// Set up event listeners
function setupEventListeners() {
    // Term selector change event
    termSelector.addEventListener('change', () => {
        loadCurrentTerm();
        renderGradeDistribution(); // Re-render chart when term changes
    });
    
    // Accordion buttons
    document.querySelectorAll('.term-accordion button').forEach(button => {
        button.addEventListener('click', toggleAccordion);
    });
}

// Load current term data
function loadCurrentTerm() {
    const selectedTerm = termSelector.value;
    const termData = sampleTerms[selectedTerm];
    
    if (termData) {
        // Clear the table
        currentCoursesTable.innerHTML = '';
        
        // Add rows for each course
        termData.courses.forEach(course => {
            const gradeClass = getGradeColorClass(course.grade);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${course.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">${course.code}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white">${course.instructor}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white">${course.credits}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gradeClass}">
                        ${course.grade}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${course.status}
                </td>
            `;
            
            currentCoursesTable.appendChild(row);
        });
    }
}

// Load grade history
function loadGradeHistory() {
    // Clear the accordion
    gradeHistoryAccordion.innerHTML = '';
    
    // Add each term (except current)
    Object.entries(sampleTerms).forEach(([termId, termData]) => {
        if (termId !== 'current') {
            const termDiv = document.createElement('div');
            termDiv.className = 'term-accordion';
            
            termDiv.innerHTML = `
                <button class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">${termData.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">GPA: ${termData.gpa}</p>
                    </div>
                    <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                <div class="term-content hidden px-6 py-4">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credits</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Final Grade</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${termData.courses.map(course => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">${course.name}</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">${course.code}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${course.credits}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColorClass(course.grade)}">${course.grade}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            gradeHistoryAccordion.appendChild(termDiv);
            
            // Add event listener
            const button = termDiv.querySelector('button');
            button.addEventListener('click', toggleAccordion);
        }
    });
}

// Toggle accordion
function toggleAccordion(e) {
    const button = e.currentTarget;
    const content = button.nextElementSibling;
    const icon = button.querySelector('svg');
    
    // Toggle content visibility
    content.classList.toggle('hidden');
    
    // Rotate the icon
    if (content.classList.contains('hidden')) {
        icon.classList.remove('rotate-180');
    } else {
        icon.classList.add('rotate-180');
    }
}

// Parse grade percentage from grade string
function parseGradePercentage(gradeString) {
    const percentMatch = gradeString.match(/\((\d+)%\)/);
    return percentMatch ? parseInt(percentMatch[1]) : 0;
}

// Extract letter grade from grade string
function extractLetterGrade(gradeString) {
    return gradeString.split(' ')[0];
}

// Get all grades from current and past terms
function getAllGrades() {
    const grades = [];
    
    // Get grades from all terms
    Object.values(sampleTerms).forEach(term => {
        term.courses.forEach(course => {
            grades.push({
                letter: extractLetterGrade(course.grade),
                percentage: parseGradePercentage(course.grade),
                credits: course.credits,
                course: course.name
            });
        });
    });
    
    return grades;
}

// Get grades only from the selected term
function getTermGrades(termId) {
    const term = sampleTerms[termId];
    if (!term) return [];
    
    return term.courses.map(course => ({
        letter: extractLetterGrade(course.grade),
        percentage: parseGradePercentage(course.grade),
        credits: course.credits,
        course: course.name
    }));
}

// Render grade distribution visualization
function renderGradeDistribution() {
    // Clear previous content
    gradeChartContainer.innerHTML = '';
    
    // Get grades from selected term or all terms
    const selectedTerm = termSelector.value;
    const grades = selectedTerm === 'all' ? getAllGrades() : getTermGrades(selectedTerm);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'flex flex-col h-full';
    
    // Create header with controls
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-4';
    header.innerHTML = `
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Showing grades for: ${selectedTerm === 'all' ? 'All Terms' : sampleTerms[selectedTerm].name}
        </div>
        <div class="flex space-x-2">
            <button id="view-letter" class="px-3 py-1 text-xs font-medium rounded-md bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                Letter
            </button>
            <button id="view-percent" class="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                Percentage
            </button>
        </div>
    `;
    
    // Create the chart area
    const chartArea = document.createElement('div');
    chartArea.className = 'flex-1 relative';
    
    // Create letter grade distribution (visible by default)
    const letterGradeChart = document.createElement('div');
    letterGradeChart.id = 'letter-grade-chart';
    letterGradeChart.className = 'absolute inset-0';
    
    // Create percentage grade distribution (hidden by default)
    const percentGradeChart = document.createElement('div');
    percentGradeChart.id = 'percent-grade-chart';
    percentGradeChart.className = 'absolute inset-0 hidden';
    
    // Add elements to the container
    chartArea.appendChild(letterGradeChart);
    chartArea.appendChild(percentGradeChart);
    chartContainer.appendChild(header);
    chartContainer.appendChild(chartArea);
    gradeChartContainer.appendChild(chartContainer);
    
    // Create letter grade distribution
    createLetterGradeChart(letterGradeChart, grades);
    
    // Create percentage grade distribution
    createPercentageGradeChart(percentGradeChart, grades);
    
    // Add event listeners for toggle buttons
    document.getElementById('view-letter').addEventListener('click', function() {
        this.classList.replace('bg-gray-100', 'bg-primary-100');
        this.classList.replace('text-gray-700', 'text-primary-700');
        this.classList.replace('dark:bg-gray-700', 'dark:bg-primary-900');
        this.classList.replace('dark:text-gray-300', 'dark:text-primary-300');
        
        document.getElementById('view-percent').classList.replace('bg-primary-100', 'bg-gray-100');
        document.getElementById('view-percent').classList.replace('text-primary-700', 'text-gray-700');
        document.getElementById('view-percent').classList.replace('dark:bg-primary-900', 'dark:bg-gray-700');
        document.getElementById('view-percent').classList.replace('dark:text-primary-300', 'dark:text-gray-300');
        
        letterGradeChart.classList.remove('hidden');
        percentGradeChart.classList.add('hidden');
    });
    
    document.getElementById('view-percent').addEventListener('click', function() {
        this.classList.replace('bg-gray-100', 'bg-primary-100');
        this.classList.replace('text-gray-700', 'text-primary-700');
        this.classList.replace('dark:bg-gray-700', 'dark:bg-primary-900');
        this.classList.replace('dark:text-gray-300', 'dark:text-primary-300');
        
        document.getElementById('view-letter').classList.replace('bg-primary-100', 'bg-gray-100');
        document.getElementById('view-letter').classList.replace('text-primary-700', 'text-gray-700');
        document.getElementById('view-letter').classList.replace('dark:bg-primary-900', 'dark:bg-gray-700');
        document.getElementById('view-letter').classList.replace('dark:text-primary-300', 'dark:text-gray-300');
        
        letterGradeChart.classList.add('hidden');
        percentGradeChart.classList.remove('hidden');
    });
}

// Create the letter grade distribution chart
function createLetterGradeChart(container, grades) {
    // Count grades by letter
    const gradeCounts = {};
    const gradeLetters = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
    
    // Initialize with zeros
    gradeLetters.forEach(letter => {
        gradeCounts[letter] = 0;
    });
    
    // Count grades
    grades.forEach(grade => {
        if (gradeCounts.hasOwnProperty(grade.letter)) {
            gradeCounts[grade.letter]++;
        }
    });
    
    // Filter out unused grades
    const filteredGrades = gradeLetters.filter(letter => gradeCounts[letter] > 0);
    
    // If no grades, show message
    if (filteredGrades.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <p class="text-gray-500 dark:text-gray-400">No grade data available</p>
            </div>
        `;
        return;
    }
    
    // Create chart
    const chartContent = document.createElement('div');
    chartContent.className = 'flex items-end justify-around h-full pt-4';
    
    // Create bars
    filteredGrades.forEach(letter => {
        const count = gradeCounts[letter];
        const percentage = Math.max(10, (count / grades.length) * 100); // Ensure minimum height for visibility
        
        const barColor = getBarColorForGrade(letter);
        
        const barDiv = document.createElement('div');
        barDiv.className = 'flex flex-col items-center';
        barDiv.innerHTML = `
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${count}</div>
            <div class="${barColor} rounded-t w-14 transform transition-all duration-700 ease-in-out" style="height: 0%"></div>
            <div class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">${letter}</div>
        `;
        
        chartContent.appendChild(barDiv);
        
        // Animate bar height after a short delay
        setTimeout(() => {
            const bar = barDiv.querySelector('div:nth-child(2)');
            bar.style.height = `${percentage}%`;
        }, 100);
    });
    
    container.appendChild(chartContent);
    
    // Add detail list below
    const detailList = document.createElement('div');
    detailList.className = 'mt-8 grid grid-cols-2 gap-2 text-xs';
    
    // Group courses by grade
    const coursesByGrade = {};
    grades.forEach(grade => {
        if (!coursesByGrade[grade.letter]) {
            coursesByGrade[grade.letter] = [];
        }
        coursesByGrade[grade.letter].push(grade.course);
    });
    
    // Add details for each grade with courses
    filteredGrades.forEach(letter => {
        if (coursesByGrade[letter] && coursesByGrade[letter].length > 0) {
            const gradeItem = document.createElement('div');
            gradeItem.className = 'bg-gray-50 dark:bg-gray-700 rounded p-2';
            
            gradeItem.innerHTML = `
                <div class="font-medium text-gray-800 dark:text-gray-200">${letter} Grade Courses:</div>
                <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
                    ${coursesByGrade[letter].map(course => `<li>${course}</li>`).join('')}
                </ul>
            `;
            
            detailList.appendChild(gradeItem);
        }
    });
    
    container.appendChild(detailList);
}

// Create the percentage grade distribution chart
function createPercentageGradeChart(container, grades) {
    // Create percentage ranges
    const ranges = [
        { min: 93, max: 100, label: '93-100%' },
        { min: 90, max: 92, label: '90-92%' },
        { min: 87, max: 89, label: '87-89%' },
        { min: 83, max: 86, label: '83-86%' },
        { min: 80, max: 82, label: '80-82%' },
        { min: 77, max: 79, label: '77-79%' },
        { min: 73, max: 76, label: '73-76%' },
        { min: 70, max: 72, label: '70-72%' },
        { min: 67, max: 69, label: '67-69%' },
        { min: 63, max: 66, label: '63-66%' },
        { min: 60, max: 62, label: '60-62%' },
        { min: 0, max: 59, label: 'Below 60%' }
    ];
    
    // Count grades by range
    const rangeCounts = ranges.map(range => {
        const count = grades.filter(grade => 
            grade.percentage >= range.min && grade.percentage <= range.max
        ).length;
        
        return {
            ...range,
            count
        };
    });
    
    // Filter out unused ranges
    const filteredRanges = rangeCounts.filter(range => range.count > 0);
    
    // If no grades, show message
    if (filteredRanges.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <p class="text-gray-500 dark:text-gray-400">No percentage data available</p>
            </div>
        `;
        return;
    }
    
    // Create chart
    const chartContent = document.createElement('div');
    chartContent.className = 'flex flex-col h-full';
    
    // Add histogram
    const histogram = document.createElement('div');
    histogram.className = 'flex items-end justify-around h-full pt-4';
    
    // Create bars
    filteredRanges.forEach(range => {
        const percentage = Math.max(10, (range.count / grades.length) * 100); // Ensure minimum height for visibility
        
        // Determine color based on percentage range
        let barColor;
        if (range.min >= 90) {
            barColor = 'bg-green-500 dark:bg-green-600';
        } else if (range.min >= 80) {
            barColor = 'bg-blue-500 dark:bg-blue-600';
        } else if (range.min >= 70) {
            barColor = 'bg-yellow-500 dark:bg-yellow-600';
        } else if (range.min >= 60) {
            barColor = 'bg-orange-500 dark:bg-orange-600';
        } else {
            barColor = 'bg-red-500 dark:bg-red-600';
        }
        
        const barDiv = document.createElement('div');
        barDiv.className = 'flex flex-col items-center';
        barDiv.innerHTML = `
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${range.count}</div>
            <div class="${barColor} rounded-t w-12 transform transition-all duration-700 ease-in-out" style="height: 0%"></div>
            <div class="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 text-center">${range.label}</div>
        `;
        
        histogram.appendChild(barDiv);
        
        // Animate bar height after a short delay
        setTimeout(() => {
            const bar = barDiv.querySelector('div:nth-child(2)');
            bar.style.height = `${percentage}%`;
        }, 100);
    });
    
    chartContent.appendChild(histogram);
    
    // Add grade distribution line
    const distributionContainer = document.createElement('div');
    distributionContainer.className = 'mt-6 px-4';
    
    // Create bell curve visualization
    const distributionLine = document.createElement('div');
    distributionLine.className = 'h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden';
    
    // Calculate average percentage
    const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
    const averagePercentage = totalPercentage / grades.length;
    
    // Create marker to show average
    const marker = document.createElement('div');
    marker.className = 'relative h-full';
    marker.innerHTML = `
        <div class="absolute h-4 w-4 bg-primary-500 rounded-full -top-1 transform -translate-x-1/2 transition-all duration-1000" 
             style="left: ${(averagePercentage / 100) * 100}%"></div>
        <div class="absolute w-24 text-center text-xs font-medium text-primary-500 -top-8 transform -translate-x-1/2 transition-all duration-1000"
             style="left: ${(averagePercentage / 100) * 100}%">
            Class Avg: ${averagePercentage.toFixed(1)}%
        </div>
    `;
    
    distributionLine.appendChild(marker);
    distributionContainer.appendChild(distributionLine);
    
    // Add scale labels
    const scaleLabels = document.createElement('div');
    scaleLabels.className = 'flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400';
    scaleLabels.innerHTML = `
        <div>0%</div>
        <div>50%</div>
        <div>100%</div>
    `;
    
    distributionContainer.appendChild(scaleLabels);
    chartContent.appendChild(distributionContainer);
    
    container.appendChild(chartContent);
}

// Get bar color based on grade letter
function getBarColorForGrade(letter) {
    if (letter.startsWith('A')) {
        return 'bg-green-500 dark:bg-green-600';
    } else if (letter.startsWith('B')) {
        return 'bg-blue-500 dark:bg-blue-600';
    } else if (letter.startsWith('C')) {
        return 'bg-yellow-500 dark:bg-yellow-600';
    } else if (letter.startsWith('D')) {
        return 'bg-orange-500 dark:bg-orange-600';
    } else {
        return 'bg-red-500 dark:bg-red-600';
    }
}

// Get color class based on grade
function getGradeColorClass(grade) {
    if (grade.startsWith('A')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (grade.startsWith('B')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (grade.startsWith('C')) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else if (grade.startsWith('D')) {
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    } else {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
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