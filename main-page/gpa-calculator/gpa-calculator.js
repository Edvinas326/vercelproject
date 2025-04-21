import supabase from '../../supabase-config.js'

// Move saveGPAToProfile outside the class
async function saveGPAToProfile(gpa) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            console.error('Authentication error:', authError)
            return
        }

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                gpa: parseFloat(gpa),
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error saving GPA:', error)
            return
        }

        // Show success message
        const notification = document.createElement('div')
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg'
        notification.textContent = 'GPA updated successfully!'
        document.body.appendChild(notification)

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove()
        }, 3000)

    } catch (error) {
        console.error('Error in saveGPAToProfile:', error)
    }
}

class GPACalculator {
    constructor() {
        this.modal = document.getElementById('gpaCalculatorModal');
        this.closeBtn = document.getElementById('closeGpaModal');
        this.addCourseBtn = document.getElementById('addCourse');
        this.removeCourseBtn = document.getElementById('removeCourse');
        this.calculateBtn = document.getElementById('calculateGpa');
        this.courseInputs = document.getElementById('courseInputs');
        this.gpaResult = document.getElementById('gpaResult');
        
        this.initializeEventListeners();
        this.updateRemoveButton();
    }

    initializeEventListeners() {
        // Close modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Add/Remove course events
        this.addCourseBtn.addEventListener('click', () => this.addCourse());
        this.removeCourseBtn.addEventListener('click', () => this.removeCourse());

        // Calculate GPA event
        this.calculateBtn.addEventListener('click', () => this.calculateGPA());
    }

    openModal() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }

    addCourse() {
        const newCourse = this.courseInputs.children[0].cloneNode(true);
        newCourse.querySelector('input').value = '';
        newCourse.querySelector('select').selectedIndex = 0;
        this.courseInputs.appendChild(newCourse);
        this.updateRemoveButton();
    }

    removeCourse() {
        if (this.courseInputs.children.length > 1) {
            this.courseInputs.removeChild(this.courseInputs.lastChild);
        }
        this.updateRemoveButton();
    }

    updateRemoveButton() {
        this.removeCourseBtn.disabled = this.courseInputs.children.length <= 1;
        this.removeCourseBtn.classList.toggle('opacity-50', this.courseInputs.children.length <= 1);
    }

    calculateGPA() {
        let totalQualityPoints = 0;
        let totalCredits = 0;
        let courses = [];

        // Collect all course data
        this.courseInputs.querySelectorAll('.course-input').forEach(course => {
            const courseName = course.querySelector('input').value.trim();
            const grade = parseFloat(course.querySelectorAll('select')[0].value);
            const credits = parseFloat(course.querySelectorAll('select')[1].value);
            
            // Only include courses with names
            if (courseName) {
                totalQualityPoints += (grade * credits);
                totalCredits += credits;

                courses.push({
                    name: courseName,
                    grade: grade,
                    credits: credits,
                    qualityPoints: (grade * credits)
                });
            }
        });

        // Calculate GPA
        let gpa = 0;
        if (totalCredits > 0) {
            gpa = (totalQualityPoints / totalCredits).toFixed(2);
        }

        // Update result with detailed breakdown
        this.updateGPADisplay(gpa, courses, totalCredits, totalQualityPoints);

        // Save the GPA to profile
        saveGPAToProfile(gpa);
    }

    updateGPADisplay(gpa, courses, totalCredits, totalQualityPoints) {
        // Create detailed results HTML
        let resultsHTML = `
            <div class="text-center mb-4">
                <span class="text-3xl font-bold">${gpa}</span>
                <p class="text-sm text-gray-600 dark:text-gray-400">Cumulative GPA</p>
            </div>
        `;

        // Add course breakdown if there are courses
        if (courses.length > 0) {
            resultsHTML += `
                <div class="mt-4 border-t pt-4">
                    <h4 class="font-semibold mb-2">Course Breakdown:</h4>
                    <div class="space-y-2">
            `;

            courses.forEach(course => {
                resultsHTML += `
                    <div class="flex justify-between text-sm">
                        <span>${course.name}</span>
                        <span>
                            ${this.getLetterGrade(course.grade)} (${course.credits} credits)
                        </span>
                    </div>
                `;
            });

            resultsHTML += `
                    </div>
                    <div class="mt-4 pt-4 border-t text-sm">
                        <div class="flex justify-between">
                            <span>Total Credits:</span>
                            <span>${totalCredits}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Total Quality Points:</span>
                            <span>${totalQualityPoints.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update the result display
        this.gpaResult.innerHTML = resultsHTML;
    }

    getLetterGrade(grade) {
        if (grade === 4.0) return 'A';
        if (grade === 3.7) return 'A-';
        if (grade === 3.3) return 'B+';
        if (grade === 3.0) return 'B';
        if (grade === 2.7) return 'B-';
        if (grade === 2.3) return 'C+';
        if (grade === 2.0) return 'C';
        if (grade === 1.7) return 'C-';
        if (grade === 1.3) return 'D+';
        if (grade === 1.0) return 'D';
        return 'F';
    }
}

// Initialize GPA Calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load the GPA Calculator HTML - update the path to be relative to main-page.html
    fetch('./gpa-calculator/gpa-calculator.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            
            // Initialize the calculator
            const calculator = new GPACalculator();
            
            // Add click event to the GPA Calculator link using ID
            const gpaLink = document.getElementById('gpaCalculatorLink');
            
            if (gpaLink) {
                gpaLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    calculator.openModal();
                });
            } else {
                console.error('GPA Calculator link not found');
            }
        })
        .catch(error => console.error('Error loading GPA Calculator:', error));
}); 