// Modern Exam Interface JavaScript
class ExamInterface {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.markedQuestions = new Set();
        this.timeRemaining = 90 * 60; // 1.5 hours in seconds
        this.timerInterval = null;
        
        this.init();
    }
    
    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.startTimer();
        this.updateDisplay();
        this.hideLoadingScreen();
        this.setExamDate();
    }
    
    async loadQuestions() {
        // Simulate loading questions from the generated quiz
        // In a real application, this would fetch from your Python backend
        this.questions = [
            {
                id: 1,
                text: "But just then, both of them were ______ by the soldiers",
                options: ["A. system", "B. process", "C. method", "D. captured"],
                correct: "D"
            },
            {
                id: 2,
                text: "______ is not innocent such as Uday",
                options: ["A. Method", "B. System", "C. Process", "D. Harmit"],
                correct: "D"
            },
            {
                id: 3,
                text: "The following ______ has been divided into four segments",
                options: ["A. process", "B. sentence", "C. method", "D. system"],
                correct: "B"
            },
            {
                id: 4,
                text: "If there is no need to substitute it, select No substitution ______",
                options: ["A. method", "B. required", "C. process", "D. system"],
                correct: "B"
            },
            {
                id: 5,
                text: "But, when the ______ was thrown in front of the lion, the lion licked him and quietly sat beside him",
                options: ["A. system", "B. slave", "C. method", "D. process"],
                correct: "B"
            },
            {
                id: 6,
                text: "______ out a tower of pots",
                options: ["A. knock", "B. process", "C. method", "D. system"],
                correct: "A"
            },
            {
                id: 7,
                text: "The following sentence has been divided into four ______",
                options: ["A. method", "B. system", "C. process", "D. segments"],
                correct: "D"
            },
            {
                id: 8,
                text: "How is the structure of health infrastructure and health care system in ______",
                options: ["A. Process", "B. Method", "C. System", "D. India"],
                correct: "D"
            },
            {
                id: 9,
                text: "Parts of the following sentence have been underlined and given as ______",
                options: ["A. options", "B. process", "C. system", "D. method"],
                correct: "A"
            },
            {
                id: 10,
                text: "Read the passage carefully and select the most ______ option to fill in each blank",
                options: ["A. appropriate", "B. process", "C. system", "D. method"],
                correct: "A"
            }
        ];
        
        // Simulate loading delay
        const loadingBar = document.getElementById('loadingBar');
        for (let i = 0; i <= 100; i += 10) {
            loadingBar.style.width = i + '%';
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        
        // Control buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveAnswer());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAnswer());
        document.getElementById('markBtn').addEventListener('click', () => this.markForReview());
        
        // Submit button
        document.getElementById('submitBtn').addEventListener('click', () => this.showSubmitModal());
        
        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => this.hideSubmitModal());
        document.getElementById('cancelSubmit').addEventListener('click', () => this.hideSubmitModal());
        document.getElementById('confirmSubmit').addEventListener('click', () => this.submitExam());
        
        // Panel toggle
        document.getElementById('panelToggle').addEventListener('click', () => this.togglePanel());
        
        // Option selection
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name === 'answer') {
                this.selectOption(e.target.value);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousQuestion();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextQuestion();
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    this.saveAnswer();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    this.markForReview();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    e.preventDefault();
                    this.selectOption(e.key);
                    break;
                default:
                    // Do nothing for other keys
                    break;
            }
        });
    }
    
    startTimer() {
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.autoSubmitExam();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const hours = Math.floor(this.timeRemaining / 3600);
        const minutes = Math.floor((this.timeRemaining % 3600) / 60);
        const seconds = this.timeRemaining % 60;
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        
        // Change timer color when time is running low
        const timerContainer = document.querySelector('.timer-container');
        if (this.timeRemaining < 300) { // Less than 5 minutes
            timerContainer.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
            timerContainer.style.animation = 'pulse 1s infinite';
        } else if (this.timeRemaining < 900) { // Less than 15 minutes
            timerContainer.style.background = 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
        }
    }
    
    updateDisplay() {
        this.displayQuestion();
        this.updateQuestionGrid();
        this.updateProgress();
        this.updateStats();
        this.updateNavigationButtons();
    }
    
    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;
        
        // Update question header
        document.getElementById('currentQuestionNumber').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        
        // Update question text with animation
        const questionTextElement = document.getElementById('questionText');
        questionTextElement.style.opacity = '0';
        
        setTimeout(() => {
            questionTextElement.textContent = question.text;
            questionTextElement.style.opacity = '1';
            questionTextElement.classList.add('fadeInLeft');
        }, 150);
        
        // Update options
        this.displayOptions(question.options);
        
        // Update question status
        this.updateQuestionStatus();
    }
    
    displayOptions(options) {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            
            const isSelected = this.answers[this.currentQuestionIndex + 1] === (index + 1).toString();
            
            if (isSelected) {
                optionElement.classList.add('selected');
            }
            
            optionElement.innerHTML = `
                <input type="radio" name="answer" value="${index + 1}" ${isSelected ? 'checked' : ''}>
                <span class="option-text">${option}</span>
            `;
            
            // Add click handler for the entire option
            optionElement.addEventListener('click', () => {
                const radio = optionElement.querySelector('input[type="radio"]');
                radio.checked = true;
                this.selectOption((index + 1).toString());
            });
            
            container.appendChild(optionElement);
            
            // Add animation delay
            setTimeout(() => {
                optionElement.classList.add('fadeInRight');
            }, index * 100);
        });
    }
    
    selectOption(value) {
        // Remove selected class from all options
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to chosen option
        const selectedOption = document.querySelector(`input[value="${value}"]`).closest('.option');
        selectedOption.classList.add('selected');
        
        // Store answer
        this.answers[this.currentQuestionIndex + 1] = value;
        
        // Update displays
        this.updateQuestionStatus();
        this.updateStats();
        this.updateProgress();
        this.updateQuestionGrid();
        
        // Visual feedback
        this.showToast('Answer selected!', 'success');
    }
    
    updateQuestionStatus() {
        const statusElement = document.getElementById('questionStatus');
        const questionId = this.currentQuestionIndex + 1;
        
        if (this.markedQuestions.has(questionId)) {
            statusElement.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
            statusElement.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        } else if (this.answers[questionId]) {
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Answered';
            statusElement.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        } else {
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Not Answered';
            statusElement.style.background = 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
        }
    }
    
    updateQuestionGrid() {
        const grid = document.getElementById('questionGrid');
        grid.innerHTML = '';
        
        this.questions.forEach((_, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.textContent = index + 1;
            
            const questionId = index + 1;
            
            // Set status classes
            if (index === this.currentQuestionIndex) {
                questionItem.classList.add('current');
            } else if (this.markedQuestions.has(questionId)) {
                questionItem.classList.add('marked');
            } else if (this.answers[questionId]) {
                questionItem.classList.add('answered');
            } else {
                questionItem.classList.add('not-answered');
            }
            
            // Add click handler
            questionItem.addEventListener('click', () => {
                this.goToQuestion(index);
            });
            
            grid.appendChild(questionItem);
        });
    }
    
    updateProgress() {
        const answered = Object.keys(this.answers).length;
        const total = this.questions.length;
        const percentage = Math.round((answered / total) * 100);
        
        document.getElementById('progressPercentage').textContent = percentage + '%';
        document.getElementById('progressFill').style.width = percentage + '%';
    }
    
    updateStats() {
        const answered = Object.keys(this.answers).length;
        const marked = this.markedQuestions.size;
        const unanswered = this.questions.length - answered;
        
        document.getElementById('answeredCount').textContent = answered;
        document.getElementById('markedCount').textContent = marked;
        document.getElementById('unansweredCount').textContent = unanswered;
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finish';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.updateDisplay();
            this.animateTransition('slideLeft');
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.updateDisplay();
            this.animateTransition('slideRight');
        } else {
            this.showSubmitModal();
        }
    }
    
    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestionIndex = index;
            this.updateDisplay();
            this.animateTransition('fadeIn');
        }
    }
    
    saveAnswer() {
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (selectedOption) {
            this.selectOption(selectedOption.value);
            this.showToast('Answer saved successfully!', 'success');
        } else {
            this.showToast('Please select an answer first!', 'warning');
        }
    }
    
    clearAnswer() {
        const questionId = this.currentQuestionIndex + 1;
        delete this.answers[questionId];
        
        // Clear radio buttons
        document.querySelectorAll('input[name="answer"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Remove selected class
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        
        this.updateDisplay();
        this.showToast('Answer cleared!', 'info');
    }
    
    markForReview() {
        const questionId = this.currentQuestionIndex + 1;
        
        if (this.markedQuestions.has(questionId)) {
            this.markedQuestions.delete(questionId);
            this.showToast('Question unmarked!', 'info');
        } else {
            this.markedQuestions.add(questionId);
            this.showToast('Question marked for review!', 'warning');
        }
        
        this.updateDisplay();
    }
    
    showSubmitModal() {
        this.updateSubmitSummary();
        document.getElementById('submitModal').style.display = 'flex';
    }
    
    hideSubmitModal() {
        document.getElementById('submitModal').style.display = 'none';
    }
    
    updateSubmitSummary() {
        const answered = Object.keys(this.answers).length;
        const marked = this.markedQuestions.size;
        
        document.getElementById('summaryTotal').textContent = this.questions.length;
        document.getElementById('summaryAnswered').textContent = answered;
        document.getElementById('summaryMarked').textContent = marked;
        document.getElementById('summaryTime').textContent = this.formatTime(this.timeRemaining);
    }
    
    submitExam() {
        clearInterval(this.timerInterval);
        
        // Calculate results
        const results = this.calculateResults();
        
        // Show results
        this.showResults(results);
        
        this.hideSubmitModal();
    }
    
    autoSubmitExam() {
        clearInterval(this.timerInterval);
        this.showToast('Time up! Exam submitted automatically.', 'warning');
        
        setTimeout(() => {
            this.submitExam();
        }, 2000);
    }
    
    calculateResults() {
        let correct = 0;
        let attempted = 0;
        
        this.questions.forEach((question, index) => {
            const questionId = index + 1;
            const userAnswer = this.answers[questionId];
            
            if (userAnswer) {
                attempted++;
                if (userAnswer === question.correct.replace(/[^\d]/g, '')) {
                    correct++;
                }
            }
        });
        
        return {
            total: this.questions.length,
            attempted,
            correct,
            incorrect: attempted - correct,
            unattempted: this.questions.length - attempted,
            percentage: Math.round((correct / this.questions.length) * 100)
        };
    }
    
    showResults(results) {
        const container = document.querySelector('.exam-container');
        container.innerHTML = `
            <div class="results-container">
                <div class="results-card">
                    <div class="results-header">
                        <i class="fas fa-trophy"></i>
                        <h1>Exam Completed!</h1>
                        <p>Your performance summary</p>
                    </div>
                    
                    <div class="results-content">
                        <div class="score-circle">
                            <div class="score-value">${results.percentage}%</div>
                            <div class="score-label">Overall Score</div>
                        </div>
                        
                        <div class="results-stats">
                            <div class="stat-card correct">
                                <div class="stat-icon"><i class="fas fa-check"></i></div>
                                <div class="stat-number">${results.correct}</div>
                                <div class="stat-label">Correct</div>
                            </div>
                            
                            <div class="stat-card incorrect">
                                <div class="stat-icon"><i class="fas fa-times"></i></div>
                                <div class="stat-number">${results.incorrect}</div>
                                <div class="stat-label">Incorrect</div>
                            </div>
                            
                            <div class="stat-card unattempted">
                                <div class="stat-icon"><i class="fas fa-minus"></i></div>
                                <div class="stat-number">${results.unattempted}</div>
                                <div class="stat-label">Unattempted</div>
                            </div>
                        </div>
                        
                        <div class="results-actions">
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="fas fa-redo"></i>
                                Take Again
                            </button>
                            <button class="btn btn-secondary" onclick="window.print()">
                                <i class="fas fa-print"></i>
                                Print Results
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add results-specific styles
        this.addResultsStyles();
    }
    
    addResultsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .results-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .results-card {
                background: var(--bg-card);
                backdrop-filter: blur(20px);
                border-radius: var(--radius-xl);
                padding: 40px;
                text-align: center;
                box-shadow: var(--shadow-strong);
                border: 1px solid rgba(255,255,255,0.1);
                max-width: 600px;
                width: 100%;
                animation: scaleIn 0.6s ease;
            }
            
            .results-header h1 {
                font-size: 36px;
                margin: 20px 0 10px;
                background: var(--success-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .results-header i {
                font-size: 48px;
                color: #ffd700;
                animation: bounce 2s infinite;
            }
            
            .score-circle {
                width: 150px;
                height: 150px;
                border-radius: 50%;
                background: var(--success-gradient);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin: 30px auto;
                animation: pulse 2s infinite;
            }
            
            .score-value {
                font-size: 36px;
                font-weight: 700;
                color: var(--text-white);
            }
            
            .score-label {
                font-size: 14px;
                color: var(--text-white);
                opacity: 0.9;
            }
            
            .results-stats {
                display: flex;
                justify-content: space-around;
                margin: 40px 0;
                gap: 20px;
            }
            
            .stat-card {
                background: var(--bg-card);
                padding: 20px;
                border-radius: var(--radius-lg);
                border: 1px solid rgba(255,255,255,0.1);
                flex: 1;
            }
            
            .stat-card.correct { border-left: 4px solid #4facfe; }
            .stat-card.incorrect { border-left: 4px solid #fd746c; }
            .stat-card.unattempted { border-left: 4px solid #ffecd2; }
            
            .stat-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .stat-number {
                font-size: 28px;
                font-weight: 700;
                color: var(--text-white);
            }
            
            .stat-label {
                color: var(--text-light);
                font-size: 14px;
            }
            
            .results-actions {
                margin-top: 40px;
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    togglePanel() {
        const panel = document.querySelector('.question-panel');
        panel.classList.toggle('collapsed');
    }
    
    animateTransition(type) {
        const questionSection = document.querySelector('.question-section');
        questionSection.style.animation = `${type} 0.3s ease`;
        
        setTimeout(() => {
            questionSection.style.animation = '';
        }, 300);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add toast styles if not already added
        if (!document.querySelector('#toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: var(--radius-md);
                    color: var(--text-white);
                    font-weight: 500;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: var(--shadow-medium);
                    animation: slideInRight 0.3s ease;
                }
                
                .toast-success { background: var(--success-gradient); }
                .toast-warning { background: var(--warning-gradient); color: var(--text-primary); }
                .toast-info { background: var(--primary-gradient); }
                .toast-error { background: var(--danger-gradient); }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            error: 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    setExamDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('examDate').textContent = dateStr;
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        setTimeout(() => {
            loadingScreen.style.animation = 'fadeIn 0.5s ease reverse';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 500);
    }
}

// Initialize the exam interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.examInterface = new ExamInterface();
});

// Prevent accidental page refresh/navigation
window.addEventListener('beforeunload', (e) => {
    if (window.examInterface && window.examInterface.timeRemaining > 0) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
        return e.returnValue;
    }
});
