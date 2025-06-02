// Initialize Supabase client
const supabase = window.supabase;

class GPACalculator {
    constructor() {
        this.modal = document.getElementById('gpaCalculatorModal');
        this.closeBtn = document.getElementById('closeGpaCalculator');
        this.addCourseBtn = document.getElementById('addCourse');
        this.removeCourseBtn = document.getElementById('removeCourse');
        this.calculateBtn = document.getElementById('calculateGpa');
        this.courseInputs = document.getElementById('courseInputs');
        this.gpaResult = document.getElementById('gpaResult');
        
        this.initializeEventListeners();
        this.updateRemoveButton();
    }

    initializeEventListeners() {
        // Modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Add/Remove course events
        this.addCourseBtn.addEventListener('click', () => this.addCourse());
        this.removeCourseBtn.addEventListener('click', () => this.removeCourse());

        // Calculate GPA event
        this.calculateBtn.addEventListener('click', () => this.calculateGPA());

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        document.body.style.overflow = '';
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

    async calculateGPA() {
        let totalPoints = 0;
        let courses = [];

        // Collect all course data
        this.courseInputs.querySelectorAll('.course-input').forEach(course => {
            const courseName = course.querySelector('input').value.trim();
            const grade = parseFloat(course.querySelector('select').value);
            
            // Only include courses with names
            if (courseName) {
                totalPoints += grade;

                courses.push({
                    name: courseName,
                    grade: grade
                });
            }
        });

        // Calculate average
        let average = 0;
        if (courses.length > 0) {
            average = (totalPoints / courses.length).toFixed(2);
        }

        // Update result with detailed breakdown
        this.updateGPADisplay(average, courses);

        // Save the average to profile
        await this.saveAverageToProfile(average);
    }

    updateGPADisplay(average, courses) {
        // Create detailed results HTML
        let resultsHTML = `
            <div class="text-center mb-6">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Jūsų vidurkis:</p>
                <p class="text-4xl font-bold text-blue-600 dark:text-blue-400">${average}</p>
            </div>
        `;

        // Add course breakdown if there are courses
        if (courses.length > 0) {
            resultsHTML += `
                <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Dalykų sąrašas:</h4>
                    <div class="space-y-3">
            `;

            courses.forEach(course => {
                resultsHTML += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-700 dark:text-gray-300">${course.name}</span>
                        <span class="text-gray-600 dark:text-gray-400">${course.grade} balai</span>
                    </div>
                `;
            });

            resultsHTML += `
                    </div>
                    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-700 dark:text-gray-300">Dalykų skaičius:</span>
                            <span class="text-gray-900 dark:text-white font-medium">${courses.length}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update the result display
        this.gpaResult.innerHTML = resultsHTML;
    }

    async saveAverageToProfile(average) {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                console.error('Authentication error:', authError);
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    gpa: parseFloat(average),
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving average:', error);
                return;
            }

            // Show success message
            Toastify({
                text: "Vidurkis sėkmingai išsaugotas",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#10B981",
            }).showToast();

        } catch (error) {
            console.error('Error in saveAverageToProfile:', error);
            Toastify({
                text: "Klaida išsaugant vidurkį",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#EF4444",
            }).showToast();
        }
    }
}

// Initialize GPA Calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const calculator = new GPACalculator();
    
    // Add click event listener to the GPA calculator link
    const gpaCalculatorLink = document.getElementById('gpaCalculatorLink');
    if (gpaCalculatorLink) {
        gpaCalculatorLink.addEventListener('click', (e) => {
            e.preventDefault();
            calculator.openModal();
        });
    }
}); 