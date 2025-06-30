// NEET Prep Hub - Complete JavaScript Application
// Save this as: script.js

class NEETApp {
    constructor() {
        // Initialize application state
        this.studySessions = this.loadFromLocalStorage('studySessions', []);
        this.chatMessages = this.loadFromLocalStorage('chatMessages', []);
        this.currentSection = 'doubt-solver';
        this.timerInterval = null;
        this.timerStartTime = null;
        this.currentTimerSession = null;
        
        // API Configuration
        this.apiConfig = null;
        this.systemPrompt = "You are a helpful NEET preparation assistant specialized in Physics, Chemistry, and Biology. Provide clear, concise explanations suitable for medical entrance exam preparation. Keep your responses focused and practical for students preparing for medical entrance exams.";
        
        // Initialize the application
        this.init();
    }
    
    // Get API configuration from server
    async getAPIConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            return {
                apiKey: config.openaiApiKey || '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',
                baseUrl:https://openrouter.ai/api/v1 config.apiBaseUrl || 'https://openrouter.ai/api/v1',
                model: config.model || 'deepseek/deepseek-r1'
            };
        } catch (error) {
            console.error('Failed to fetch API configuration:', error);
            return { apiKey: '', baseUrl: '', model: '' };
        }
    }
    
    async init() {
        this.apiConfig = await this.getAPIConfig();
        this.setupEventListeners();
        this.setupCharCounter();
        this.loadChatMessages();
        this.updateStudyStats();
        this.renderRecentSessions();
        
        // Show motivational popup on first load
        this.showMotivationPopup();
    }

    loadFromLocalStorage(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }

    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    showMotivationPopup() {
        const popup = document.getElementById('motivationPopup');
        if (popup) {
            popup.classList.remove('hidden');
        }
    }

    hideMotivationPopup() {
        const popup = document.getElementById('motivationPopup');
        if (popup) {
            popup.classList.add('hidden');
        }
    }

    setupEventListeners() {
        // Motivation popup
        const startJourneyBtn = document.getElementById('startJourneyBtn');
        if (startJourneyBtn) {
            startJourneyBtn.addEventListener('click', () => {
                this.hideMotivationPopup();
                this.showToast('Welcome to your success journey!', 'success');
            });
        }

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Chat functionality
        const sendBtn = document.getElementById('sendQuestionBtn');
        const questionInput = document.getElementById('questionInput');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendQuestion());
        }

        if (questionInput) {
            questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendQuestion();
                }
            });
        }

        // Timer functionality
        const timerBtn = document.getElementById('timerBtn');
        const closeTimerBtn = document.getElementById('closeTimerBtn');
        const startTimerBtn = document.getElementById('startTimerBtn');
        const stopTimerBtn = document.getElementById('stopTimerBtn');

        if (timerBtn) {
            timerBtn.addEventListener('click', () => this.showTimerModal());
        }

        if (closeTimerBtn) {
            closeTimerBtn.addEventListener('click', () => this.hideTimerModal());
        }

        if (startTimerBtn) {
            startTimerBtn.addEventListener('click', () => this.startTimer());
        }

        if (stopTimerBtn) {
            stopTimerBtn.addEventListener('click', () => this.stopTimer());
        }

        // Study planner functionality
        const generateTimetableBtn = document.getElementById('generateTimetableBtn');
        const customizeTimetableBtn = document.getElementById('customizeTimetableBtn');
        const applyCustomizationBtn = document.getElementById('applyCustomizationBtn');
        const resetTimetableBtn = document.getElementById('resetTimetableBtn');

        if (generateTimetableBtn) {
            generateTimetableBtn.addEventListener('click', () => this.generateTimetable());
        }

        if (customizeTimetableBtn) {
            customizeTimetableBtn.addEventListener('click', () => this.toggleCustomization());
        }

        if (applyCustomizationBtn) {
            applyCustomizationBtn.addEventListener('click', () => this.applyCustomization());
        }

        if (resetTimetableBtn) {
            resetTimetableBtn.addEventListener('click', () => this.resetTimetable());
        }

        // Priority sliders
        const sliders = ['physics', 'chemistry', 'biology'];
        sliders.forEach(subject => {
            const slider = document.getElementById(`${subject}Slider`);
            if (slider) {
                slider.addEventListener('input', () => this.updatePriorityValues());
            }
        });

        // Textbook reader
        const closeReaderBtn = document.getElementById('closeReaderBtn');
        if (closeReaderBtn) {
            closeReaderBtn.addEventListener('click', () => {
                const reader = document.getElementById('textbookReader');
                const list = document.getElementById('textbookList');
                if (reader && list) {
                    reader.classList.add('hidden');
                    list.classList.remove('hidden');
                }
            });
        }
    }

    switchSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active', 'text-primary', 'border-primary', 'font-semibold');
            tab.classList.add('text-gray-400');
        });

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Activate selected tab
        const activeTab = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'text-primary', 'border-primary', 'font-semibold');
            activeTab.classList.remove('text-gray-400');
        }

        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
        }

        this.currentSection = sectionId;
    }

    setupCharCounter() {
        const questionInput = document.getElementById('questionInput');
        const charCount = document.getElementById('charCount');

        if (questionInput && charCount) {
            questionInput.addEventListener('input', () => {
                const count = questionInput.value.length;
                charCount.textContent = `${count}/500`;
                
                if (count > 450) {
                    charCount.classList.add('text-red-400');
                    charCount.classList.remove('text-gray-400');
                } else {
                    charCount.classList.add('text-gray-400');
                    charCount.classList.remove('text-red-400');
                }
            });
        }
    }

    async sendQuestion() {
        const questionInput = document.getElementById('questionInput');
        const question = questionInput.value.trim();

        if (!question) {
            this.showToast('Please enter a question', 'error');
            return;
        }

        if (question.length > 500) {
            this.showToast('Question too long. Please keep it under 500 characters.', 'error');
            return;
        }

        // Add user message to chat
        this.addChatMessage(question, 'user');
        questionInput.value = '';
        document.getElementById('charCount').textContent = '0/500';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callAPI(question);
            this.hideTypingIndicator();
            this.addChatMessage(response, 'ai');
            
            // Save to localStorage
            this.chatMessages.push(
                { message: question, sender: 'user', timestamp: new Date().toISOString() },
                { message: response, sender: 'ai', timestamp: new Date().toISOString() }
            );
            this.saveToLocalStorage('chatMessages', this.chatMessages);
        } catch (error) {
            this.hideTypingIndicator();
            console.error('API Error:', error);
            this.addChatMessage('Sorry, I encountered an error. Please try again or check your API configuration.', 'ai');
        }
    }

    async callAPI(question) {
        const { apiKey, baseUrl, model } = this.apiConfig;

        if (!apiKey) {
            return 'API key not configured. Please set your OpenAI API key in the server configuration.';
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: question }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response received';
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-3';

        const isUser = sender === 'user';
        const bgColor = isUser ? 'bg-secondary' : 'bg-primary';
        const alignment = isUser ? 'ml-auto flex-row-reverse space-x-reverse' : '';

        messageDiv.className += ` ${alignment}`;

        messageDiv.innerHTML = `
            <div class="${bgColor} rounded-full p-2 text-white">
                <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="bg-dark-surface rounded-lg p-4 max-w-md">
                <p class="text-gray-300">${this.formatMessage(message)}</p>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    loadChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        // Keep only the welcome message
        const welcomeMessage = chatMessages.querySelector('.flex');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }

        // Load stored messages
        this.chatMessages.forEach(msg => {
            this.addChatMessage(msg.message, msg.sender);
        });
    }

    formatMessage(message) {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
        
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    showTimerModal() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideTimerModal() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    startTimer() {
        const subject = document.getElementById('subjectSelect').value;
        const task = document.getElementById('taskInput').value.trim();

        if (!task) {
            this.showToast('Please enter a task description', 'error');
            return;
        }

        this.timerStartTime = Date.now();
        this.currentTimerSession = { subject, task };

        // Update UI
        document.getElementById('startTimerBtn').classList.add('hidden');
        document.getElementById('stopTimerBtn').classList.remove('hidden');
        document.getElementById('currentTask').classList.remove('hidden');
        document.getElementById('taskDisplay').textContent = task;

        // Start timer interval
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);

        this.showToast(`Timer started for ${subject}`, 'success');
    }

    async stopTimer() {
        if (!this.timerStartTime || !this.currentTimerSession) return;

        const endTime = Date.now();
        const duration = endTime - this.timerStartTime;
        const session = {
            ...this.currentTimerSession,
            duration,
            date: new Date().toISOString(),
            timestamp: this.timerStartTime
        };

        // Save session
        this.studySessions.unshift(session);
        this.saveToLocalStorage('studySessions', this.studySessions);

        // Clear timer
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerStartTime = null;
        this.currentTimerSession = null;

        // Reset UI
        document.getElementById('startTimerBtn').classList.remove('hidden');
        document.getElementById('stopTimerBtn').classList.add('hidden');
        document.getElementById('currentTask').classList.add('hidden');
        document.getElementById('timerDisplay').textContent = '00:00:00';
        document.getElementById('taskInput').value = '';

        // Update statistics
        this.updateStudyStats();
        this.renderRecentSessions();

        // Hide modal and show success
        this.hideTimerModal();
        this.showToast(`Study session completed! Duration: ${this.formatDuration(duration)}`, 'success');
    }

    updateTimerDisplay() {
        if (!this.timerStartTime) return;

        const elapsed = Date.now() - this.timerStartTime;
        const display = document.getElementById('timerDisplay');
        if (display) {
            display.textContent = this.formatTime(elapsed);
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    formatDuration(milliseconds) {
        const totalMinutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    updateStudyStats() {
        const today = new Date().toDateString();
        const todaySessions = this.studySessions.filter(session => 
            new Date(session.date).toDateString() === today
        );

        const stats = {
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        todaySessions.forEach(session => {
            if (stats.hasOwnProperty(session.subject)) {
                stats[session.subject] += session.duration;
            }
        });

        // Update display
        Object.keys(stats).forEach(subject => {
            const element = document.getElementById(`${subject.toLowerCase()}Time`);
            if (element) {
                element.textContent = this.formatDuration(stats[subject]);
            }
        });
    }

    renderRecentSessions() {
        const container = document.getElementById('sessionsList');
        if (!container) return;

        if (this.studySessions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-clock text-4xl mb-4 text-gray-600"></i>
                    <p>No study sessions yet. Start your first session using the timer!</p>
                </div>
            `;
            return;
        }

        const recentSessions = this.studySessions.slice(0, 10);
        container.innerHTML = recentSessions.map(session => `
            <div class="bg-dark-surface rounded-lg p-4 border border-gray-600 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center ${this.getSubjectColor(session.subject)}">
                        <i class="fas ${this.getSubjectIcon(session.subject)} text-white"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-white">${session.subject}</h4>
                        <p class="text-gray-400 text-sm">${session.task}</p>
                        <p class="text-gray-500 text-xs">${this.formatDate(session.date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold text-white">${this.formatDuration(session.duration)}</p>
                    <p class="text-gray-400 text-sm">Duration</p>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        
        return date.toLocaleDateString();
    }

    getSubjectColor(subject) {
        const colors = {
            'Physics': 'bg-primary',
            'Chemistry': 'bg-accent',
            'Biology': 'bg-red-500'
        };
        return colors[subject] || 'bg-gray-500';
    }

    getSubjectIcon(subject) {
        const icons = {
            'Physics': 'fa-atom',
            'Chemistry': 'fa-flask',
            'Biology': 'fa-dna'
        };
        return icons[subject] || 'fa-book';
    }

    showToast(message, type = 'info') 