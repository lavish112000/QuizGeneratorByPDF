// Modern Exam Interface JavaScript with API Integration
class ExamInterface {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.markedQuestions = new Set();
        this.timeRemaining = 90 * 60; // 1.5 hours in seconds
        this.timerInterval = null;
        this.examStartTime = Date.now();
        
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
        try {
            // Show enhanced loading messages
            const loadingElement = document.querySelector('.loading-text');
            const loadingBar = document.getElementById('loadingBar');
            const loadingPercentage = document.getElementById('loadingPercentage');
            const questionsFound = document.getElementById('questionsFound');
            const currentFileLoading = document.getElementById('currentFileLoading');
            const extractionStatus = document.getElementById('extractionStatus');
            
            // Start with checking server connection
            if (loadingElement) {
                loadingElement.innerHTML = `
                    🔌 Connecting to PDF processing server...<br>
                    📊 Checking extraction progress<br>
                    ⚡ Preparing advanced interface...
                `;
            }
            
            if (extractionStatus) extractionStatus.textContent = 'Connecting...';
            
            // First check if extraction is in progress
            let extractionComplete = false;
            let attempts = 0;
            const maxAttempts = 60; // 60 seconds timeout
            
            while (!extractionComplete && attempts < maxAttempts) {
                try {
                    const progressResponse = await fetch('/api/extraction-progress');
                    const progressData = await progressResponse.json();
                    
                    // Update loading UI with progress
                    if (loadingBar) loadingBar.style.width = progressData.progress + '%';
                    if (loadingPercentage) loadingPercentage.textContent = progressData.progress + '%';
                    if (questionsFound) questionsFound.textContent = progressData.questions_found;
                    if (currentFileLoading) currentFileLoading.textContent = progressData.current_file || 'Waiting...';
                    if (extractionStatus) extractionStatus.textContent = progressData.status;
                    
                    if (loadingElement) {
                        loadingElement.innerHTML = `
                            📚 ${progressData.message}<br>
                            🎯 Found ${progressData.questions_found} questions so far<br>
                            📄 Processing: ${progressData.current_file || 'Initializing...'}
                        `;
                    }
                    
                    if (progressData.status === 'completed') {
                        extractionComplete = true;
                        break;
                    } else if (progressData.status === 'error') {
                        throw new Error(progressData.message);
                    } else if (progressData.status === 'idle') {
                        // Start extraction if not started
                        console.log('🚀 Starting extraction process...');
                        await fetch('/api/start-extraction', { method: 'POST' });
                    }
                    
                } catch (progressError) {
                    console.log('⚠️ Progress check failed, trying direct question load...');
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            
            // Now try to load questions
            console.log('📥 Loading questions from API...');
            if (loadingElement) {
                loadingElement.innerHTML = `
                    📥 Loading extracted questions...<br>
                    🔄 Finalizing exam interface<br>
                    ✅ Almost ready to start!
                `;
            }
            if (extractionStatus) extractionStatus.textContent = 'Loading questions...';
            
            const response = await fetch('/api/questions');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.questions && data.questions.length > 0) {
                this.questions = data.questions;
                console.log(`✅ Loaded ${this.questions.length} questions from ${data.source || 'PDF files'}`);
                
                // Final loading updates
                if (loadingBar) loadingBar.style.width = '100%';
                if (loadingPercentage) loadingPercentage.textContent = '100%';
                if (questionsFound) questionsFound.textContent = this.questions.length;
                if (extractionStatus) extractionStatus.textContent = 'Complete!';
                
                if (loadingElement) {
                    loadingElement.innerHTML = `
                        ✅ Successfully loaded ${this.questions.length} questions!<br>
                        🎯 Advanced PDF extraction complete<br>
                        🚀 Launching exam interface...
                    `;
                }
            } else {
                throw new Error('No questions received from API');
            }
        } catch (error) {
            console.error('❌ Error loading questions from API:', error);
            console.log('📚 Loading fallback questions...');
            
            // Update loading UI with fallback message
            const loadingElement = document.querySelector('.loading-text');
            const extractionStatus = document.getElementById('extractionStatus');
            
            if (loadingElement) {
                loadingElement.innerHTML = `
                    ⚠️ PDF extraction unavailable<br>
                    📚 Loading demo questions<br>
                    💡 Run 'python exam_server.py' for full functionality
                `;
            }
            if (extractionStatus) extractionStatus.textContent = 'Using fallback';
            
            // Fallback questions if API is not available
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
            
            // Update counters for fallback
            const questionsFound = document.getElementById('questionsFound');
            const loadingBar = document.getElementById('loadingBar');
            const loadingPercentage = document.getElementById('loadingPercentage');
            
            if (questionsFound) questionsFound.textContent = this.questions.length;
            if (loadingBar) loadingBar.style.width = '100%';
            if (loadingPercentage) loadingPercentage.textContent = '100%';
        }
        
        // Final loading animation
        await this.simulateLoadingComplete();
    }
    
    async simulateLoadingComplete() {
        // Simulate final loading steps with smooth progress
        const finalSteps = [
            'Optimizing question display...',
            'Setting up navigation...',
            'Preparing timer system...',
            'Finalizing interface...',
            'Ready to start exam!'
        ];
        
        const loadingElement = document.querySelector('.loading-text');
        
        for (let i = 0; i < finalSteps.length; i++) {
            if (loadingElement) {
                loadingElement.innerHTML = `
                    ✅ Questions loaded successfully!<br>
                    🔧 ${finalSteps[i]}<br>
                    🎯 Advanced exam interface ready
                `;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextQuestion());
        
        // Control buttons
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveAnswer());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearAnswer());
        document.getElementById('markBtn')?.addEventListener('click', () => this.markForReview());
        
        // Submit button
        document.getElementById('submitBtn')?.addEventListener('click', () => this.showSubmitModal());
        
        // Modal events
        document.getElementById('confirmSubmit')?.addEventListener('click', () => this.submitExam());
        document.getElementById('cancelSubmit')?.addEventListener('click', () => this.hideSubmitModal());
        document.getElementById('closeModal')?.addEventListener('click', () => this.hideSubmitModal());
        
        // Enhanced Action Button - Mark for Review with visual feedback
        const markBtn = document.getElementById('markBtn');
        if (markBtn) {
            markBtn.addEventListener('click', () => {
                this.markForReview();
                // Add visual feedback
                markBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    markBtn.style.transform = '';
                }, 150);
            });
        }
        
        // Enhanced Save Button with auto-next functionality
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveAnswer();
                // Add visual feedback
                saveBtn.style.background = 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
                setTimeout(() => {
                    saveBtn.style.background = '';
                }, 500);
                
                // Auto-proceed to next question after save
                setTimeout(() => {
                    if (this.currentQuestionIndex < this.questions.length - 1) {
                        this.nextQuestion();
                    }
                }, 300);
            });
        }
        
        // Enhanced Clear Button with confirmation
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // Visual confirmation feedback
                clearBtn.style.background = 'linear-gradient(135deg, #fd746c 0%, #ff9068 100%)';
                setTimeout(() => {
                    clearBtn.style.background = '';
                }, 300);
                this.clearAnswer();
            });
        }
        
        // Timer click functionality for time extension (if needed)
        const timer = document.getElementById('timer');
        if (timer) {
            timer.addEventListener('click', () => {
                this.showTimeInfo();
            });
        }
        
        // Progress bar click functionality
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const targetQuestion = Math.floor(percentage * this.questions.length);
                this.goToQuestion(targetQuestion);
            });
        }
        
        // Keyboard shortcuts with enhanced functionality
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                // Ctrl + shortcuts
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveAnswer();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.markForReview();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.showSubmitModal();
                        break;
                    default:
                        // No action for other Ctrl combinations
                        break;
                }
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    e.preventDefault();
                    this.previousQuestion();
                    break;
                case 'ArrowRight':
                case 'd':
                    e.preventDefault();
                    this.nextQuestion();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveAnswer();
                    break;
                case 'c':
                    e.preventDefault();
                    this.clearAnswer();
                    break;
                case 'm':
                    e.preventDefault();
                    this.markForReview();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideSubmitModal();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    e.preventDefault();
                    this.selectOption(parseInt(e.key));
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToQuestion(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToQuestion(this.questions.length - 1);
                    break;
                default:
                    // Do nothing for other keys
                    break;
            }
        });
        
        // Auto-save answers
        document.querySelectorAll('input[name="answer"]').forEach(input => {
            input.addEventListener('change', () => {
                this.answers[this.getCurrentQuestionId()] = input.value;
                this.updateQuestionNavigator();
            });
        });
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent text selection
        document.addEventListener('selectstart', (e) => e.preventDefault());
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();
            
            if (this.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
    }
    
    updateTimer() {
        const hours = Math.floor(this.timeRemaining / 3600);
        const minutes = Math.floor((this.timeRemaining % 3600) / 60);
        const seconds = this.timeRemaining % 60;
        
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = timeStr;
        
        // Warning colors
        const timerElement = document.getElementById('timer');
        if (this.timeRemaining <= 300) { // Last 5 minutes
            timerElement.style.color = '#ff4757';
            timerElement.style.animation = 'pulse 1s infinite';
        } else if (this.timeRemaining <= 900) { // Last 15 minutes
            timerElement.style.color = '#ffa502';
        }
    }
    
    timeUp() {
        clearInterval(this.timerInterval);
        alert('⏰ Time\'s up! Your exam will be submitted automatically.');
        this.submitExam();
    }
    
    updateDisplay() {
        if (this.questions.length === 0) return;
        
        const question = this.questions[this.currentQuestionIndex];
        
        // Update question text
        document.getElementById('questionText').textContent = question.text;
        
        // Update question number
        document.getElementById('currentQuestionNumber').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        
        // Update question status
        const questionStatus = document.getElementById('questionStatus');
        if (questionStatus) {
            const isAnswered = this.answers[question.id];
            const isMarked = this.markedQuestions.has(question.id);
            
            if (isAnswered && isMarked) {
                questionStatus.innerHTML = '<i class="fas fa-check-circle"></i> Answered & Marked';
                questionStatus.className = 'status-indicator answered marked';
            } else if (isAnswered) {
                questionStatus.innerHTML = '<i class="fas fa-check-circle"></i> Answered';
                questionStatus.className = 'status-indicator answered';
            } else if (isMarked) {
                questionStatus.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
                questionStatus.className = 'status-indicator marked';
            } else {
                questionStatus.innerHTML = '<i class="fas fa-circle"></i> Not Answered';
                questionStatus.className = 'status-indicator not-answered';
            }
        }
        
        // Update options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            
            const optionNumber = index + 1;
            const isSelected = this.answers[question.id] === optionNumber.toString();
            
            optionDiv.innerHTML = `
                <input type="radio" id="option${optionNumber}" name="answer" value="${optionNumber}" ${isSelected ? 'checked' : ''}>
                <label for="option${optionNumber}" class="option-label">
                    ${option}
                </label>
            `;
            
            optionsContainer.appendChild(optionDiv);
        });
        
        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.currentQuestionIndex === 0;
        document.getElementById('nextBtn').disabled = this.currentQuestionIndex === this.questions.length - 1;
        
        // Update progress bar
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        if (progressPercentage) {
            progressPercentage.textContent = Math.round(progress) + '%';
        }
        
        // Update question navigator
        this.updateQuestionNavigator();
        
        // Re-attach event listeners for new options
        document.querySelectorAll('input[name="answer"]').forEach(input => {
            input.addEventListener('change', () => {
                this.answers[this.getCurrentQuestionId()] = input.value;
                this.updateQuestionNavigator();
            });
        });
    }
    
    updateQuestionNavigator() {
        const navigator = document.getElementById('questionGrid');
        if (!navigator) return;
        
        navigator.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const button = document.createElement('button');
            button.className = 'question-nav-btn';
            button.textContent = index + 1;
            
            // Add status classes
            if (index === this.currentQuestionIndex) {
                button.classList.add('current');
            }
            if (this.answers[question.id]) {
                button.classList.add('answered');
            }
            if (this.markedQuestions.has(question.id)) {
                button.classList.add('marked');
            }
            
            button.addEventListener('click', () => {
                this.currentQuestionIndex = index;
                this.updateDisplay();
            });
            
            navigator.appendChild(button);
        });
        
        // Update stats
        const totalQuestions = this.questions.length;
        const answeredQuestions = Object.keys(this.answers).length;
        const markedQuestions = this.markedQuestions.size;
        const unansweredQuestions = totalQuestions - answeredQuestions;
        
        const answeredCountEl = document.getElementById('answeredCount');
        const markedCountEl = document.getElementById('markedCount');
        const unansweredCountEl = document.getElementById('unansweredCount');
        
        if (answeredCountEl) answeredCountEl.textContent = answeredQuestions;
        if (markedCountEl) markedCountEl.textContent = markedQuestions;
        if (unansweredCountEl) unansweredCountEl.textContent = unansweredQuestions;
    }
    
    getCurrentQuestionId() {
        return this.questions[this.currentQuestionIndex].id;
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.updateDisplay();
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.updateDisplay();
        }
    }
    
    saveAnswer() {
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (selectedOption) {
            this.answers[this.getCurrentQuestionId()] = selectedOption.value;
            this.updateQuestionNavigator();
            this.showNotification('✅ Answer saved!', 'success');
        } else {
            this.showNotification('⚠️ Please select an answer first', 'warning');
        }
    }
    
    clearAnswer() {
        delete this.answers[this.getCurrentQuestionId()];
        const options = document.querySelectorAll('input[name="answer"]');
        options.forEach(option => option.checked = false);
        this.updateQuestionNavigator();
        this.showNotification('🗑️ Answer cleared!', 'info');
    }
    
    markForReview() {
        const questionId = this.getCurrentQuestionId();
        if (this.markedQuestions.has(questionId)) {
            this.markedQuestions.delete(questionId);
            this.showNotification('📌 Mark removed!', 'info');
        } else {
            this.markedQuestions.add(questionId);
            this.showNotification('🔖 Marked for review!', 'info');
        }
        this.updateQuestionNavigator();
    }
    
    selectOption(optionNumber) {
        const option = document.getElementById(`option${optionNumber}`);
        if (option) {
            option.checked = true;
            this.answers[this.getCurrentQuestionId()] = optionNumber.toString();
            this.updateQuestionNavigator();
        }
    }
    
    showTimeInfo() {
        if (this.timeLimit > 0) {
            const elapsed = Math.floor((Date.now() - this.examStartTime) / 1000);
            const remaining = this.timeLimit - elapsed;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            
            this.showNotification(
                `⏰ Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`,
                'info'
            );
        } else {
            const elapsed = Math.floor((Date.now() - this.examStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            this.showNotification(
                `⏱️ Time elapsed: ${minutes}:${seconds.toString().padStart(2, '0')}`,
                'info'
            );
        }
    }
    
    goToQuestion(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.questions.length) {
            this.currentQuestionIndex = questionIndex;
            this.updateDisplay();
            this.showNotification(
                `📍 Navigated to question ${questionIndex + 1}`,
                'success'
            );
        }
    }
    
    showSubmitModal() {
        const totalQuestions = this.questions.length;
        const answeredQuestions = Object.keys(this.answers).length;
        const unansweredQuestions = totalQuestions - answeredQuestions;
        
        document.getElementById('modalAnswered').textContent = answeredQuestions;
        document.getElementById('modalTotal').textContent = totalQuestions;
        document.getElementById('modalUnanswered').textContent = unansweredQuestions;
        
        const submitModal = document.getElementById('submitModal');
        submitModal.classList.remove('hidden');
        submitModal.style.display = 'flex';
    }
    
    hideSubmitModal() {
        const submitModal = document.getElementById('submitModal');
        submitModal.classList.add('hidden');
        submitModal.style.display = 'none';
    }
    
    async submitExam() {
        clearInterval(this.timerInterval);
        
        const timeTaken = Math.floor((Date.now() - this.examStartTime) / 1000);
        
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: this.answers,
                    time_taken: timeTaken,
                    marked_questions: Array.from(this.markedQuestions)
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showResults(result);
            } else {
                throw new Error('Failed to submit exam');
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            // Show offline results
            this.showOfflineResults();
        }
        
        this.hideSubmitModal();
    }
    
    showResults(result) {
        const percentage = result.percentage;
        let grade = 'F';
        let gradeColor = '#ff4757';
        
        if (percentage >= 90) { grade = 'A+'; gradeColor = '#2ed573'; }
        else if (percentage >= 80) { grade = 'A'; gradeColor = '#2ed573'; }
        else if (percentage >= 70) { grade = 'B'; gradeColor = '#1e90ff'; }
        else if (percentage >= 60) { grade = 'C'; gradeColor = '#ffa502'; }
        else if (percentage >= 50) { grade = 'D'; gradeColor = '#ff6b47'; }
        
        const resultHtml = `
            <div class="result-container">
                <div class="result-header">
                    <h2>🎓 Exam Results</h2>
                    <div class="grade-display" style="color: ${gradeColor}">
                        <span class="grade">${grade}</span>
                        <span class="percentage">${percentage}%</span>
                    </div>
                </div>
                
                <div class="result-stats">
                    <div class="stat-item">
                        <div class="stat-number">${result.total}</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                    <div class="stat-item correct">
                        <div class="stat-number">${result.correct}</div>
                        <div class="stat-label">Correct</div>
                    </div>
                    <div class="stat-item incorrect">
                        <div class="stat-number">${result.incorrect}</div>
                        <div class="stat-label">Incorrect</div>
                    </div>
                    <div class="stat-item unattempted">
                        <div class="stat-number">${result.unattempted}</div>
                        <div class="stat-label">Unattempted</div>
                    </div>
                </div>
                
                <div class="time-taken">
                    <p>⏱️ Time Taken: ${Math.floor(result.time_taken / 60)} minutes ${result.time_taken % 60} seconds</p>
                </div>
                
                <div class="result-actions">
                    <button onclick="window.location.reload()" class="btn-primary">🔄 Take Another Exam</button>
                    <button onclick="window.close()" class="btn-secondary">❌ Close</button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = resultHtml;
    }
    
    showOfflineResults() {
        const totalQuestions = this.questions.length;
        const answeredQuestions = Object.keys(this.answers).length;
        
        // Calculate offline results (simplified)
        let correct = 0;
        this.questions.forEach(question => {
            const userAnswer = this.answers[question.id];
            if (userAnswer) {
                const answerLetter = String.fromCharCode(64 + parseInt(userAnswer));
                if (answerLetter === question.correct) {
                    correct++;
                }
            }
        });
        
        const percentage = Math.round((correct / totalQuestions) * 100);
        
        this.showResults({
            total: totalQuestions,
            correct: correct,
            incorrect: answeredQuestions - correct,
            unattempted: totalQuestions - answeredQuestions,
            percentage: percentage,
            time_taken: Math.floor((Date.now() - this.examStartTime) / 1000)
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const examContainer = document.getElementById('examContainer');
        
        if (loadingScreen && examContainer) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    examContainer.classList.remove('exam-container-hidden');
                    
                    // Animate exam container entrance
                    examContainer.style.opacity = '0';
                    examContainer.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        examContainer.style.transition = 'all 0.5s ease';
                        examContainer.style.opacity = '1';
                        examContainer.style.transform = 'translateY(0)';
                    }, 50);
                }, 500);
            }, 1500); // Wait a bit longer to show completion
        }
    }
    
    setExamDate() {
        const examDate = document.getElementById('examDate');
        if (examDate) {
            const now = new Date();
            examDate.textContent = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
}

// Initialize exam when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ExamInterface();
});

// Prevent page unload during exam
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? Your progress will be lost!';
});
