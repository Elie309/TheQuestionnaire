// TheQuestions Quiz Game
class QuizGame {
    constructor() {
        this.questions = this.getDefaultQuestions();
        this.answeredQuestions = new Set(JSON.parse(localStorage.getItem('quizGame_answeredQuestions')) || []);       
        
        // Create Questions button
        document.getElementById('create-btn').addEventListener('click', () => {
            window.location.href = 'editor.html';
        });
        this.currentQuestion = null;
        this.showingAnswer = false;

        this.init();
    }

    init() {
        this.renderBoard();
        this.attachEventListeners();
        this.updateProgress();
        this.loadGameState();
    }
    getDefaultQuestions() {
        // Try to load questions from sample_questions.csv first
        const questions = {};
        const rows = ['A', 'B', 'C', 'D', 'E'];

        // First try to load from local storage in case there are saved questions
        const savedQuestions = localStorage.getItem('quizGame_questions');
        if (savedQuestions) {
            return JSON.parse(savedQuestions);
        }

        // If not in local storage, try to fetch from the CSV file
        let loadedFromFile = false;
        try {
            // Create a fallback for when the sample file isn't found
            const defaultQuestions = this.createFallbackQuestions();

            // Try to load from the sample CSV
            this.loadSampleCSV()
                .then(loadedQuestions => {
                    // Only save if we have questions and haven't saved anything yet
                    if (loadedQuestions && Object.keys(loadedQuestions).length > 0) {
                        this.questions = loadedQuestions;
                        this.saveGameState();
                        this.renderBoard();
                        this.updateProgress();
                        console.log('Loaded questions from sample_questions.csv');
                    }
                })
                .catch(error => {
                    console.error('Error loading sample questions:', error);
                });

            // Return default questions for initial render - they'll be replaced if CSV loads
            return defaultQuestions;
        } catch (error) {
            console.error('Error in getDefaultQuestions:', error);

            // Fallback to hardcoded questions if everything else fails
            return this.createFallbackQuestions();
        }
    }

    createFallbackQuestions() {
        // Fallback questions in case CSV file can't be loaded
        const questions = {};
        const rows = ['A', 'B', 'C', 'D', 'E'];

        // Create basic grid of placeholder questions
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const id = `${rows[col]}${row + 1}`;
                questions[id] = {
                    question: `Sample question ${id}`,
                    answer: `Sample answer ${id}`,
                    questionImage: null,
                    answerImage: null
                };
            }
        }

        return questions;
    } async loadSampleCSV() {
        try {
            // Fetch the sample_questions.csv file using our PHP API
            const response = await fetch('api.php?action=load_question_file&file=sample_questions.csv');
            
            console.log('Loading sample CSV from api.php');
            
            if (!response.ok) {
                console.error('Failed to load sample CSV:', response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log(response)

            const data = await response.json();
            console.log('Sample CSV data:', data);
            if (data.error) {

                throw new Error(data.error);
            }

            return this.parseCSV(data.content);
        } catch (error) {
            console.error('Error loading sample CSV:', error);
            return null;
        }
    }    renderBoard() {
        const boardGrid = document.getElementById('board-grid');
        boardGrid.innerHTML = '';

        const rows = ['A', 'B', 'C', 'D', 'E'];

        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const id = `${rows[col]}${row + 1}`;
                const cell = document.createElement('button');
                cell.className = 'question-cell';
                cell.textContent = id;
                cell.setAttribute('data-question-id', id);
                cell.setAttribute('aria-label', `Question ${id}`);

                if (this.answeredQuestions.has(id)) {
                    cell.classList.add('answered');
                    cell.disabled = true;
                }

                cell.addEventListener('click', () => this.showQuestion(id));
                boardGrid.appendChild(cell);
            }
        }
    }
    attachEventListeners() {
        // Settings dropdown
        document.getElementById('settings-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettingsDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeSettingsDropdown();
        });

        // Prevent dropdown from closing when clicking inside it
        document.getElementById('settings-dropdown').addEventListener('click', (e) => {
            e.stopPropagation();
        });        // Load Questions button
        document.getElementById('load-questions-btn').addEventListener('click', () => {
            this.closeSettingsDropdown();
            this.showQuestionSetsModal();
        });

        // Import button
        document.getElementById('import-btn').addEventListener('click', () => {
            this.closeSettingsDropdown();
            document.getElementById('file-input').click();
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.closeSettingsDropdown();
            this.exportQuestions();
        });        // Create Questions button
        document.getElementById('create-btn').addEventListener('click', () => {
            this.closeSettingsDropdown();
            window.location.href = 'editor.html';
        });        // Edit Questions button
        document.getElementById('edit-questions-btn').addEventListener('click', () => {
            this.closeSettingsDropdown();
            this.editCurrentQuestions();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.closeSettingsDropdown();
            this.resetGame();
        });

        // File input
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.returnToBoard();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // Modal close button
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeQuestionSetsModal();
        });

        // Close modal when clicking outside
        document.getElementById('question-sets-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('question-sets-modal')) {
                this.closeQuestionSetsModal();
            }
        });
    }

    toggleSettingsDropdown() {
        const dropdown = document.getElementById('settings-dropdown');
        dropdown.classList.toggle('hidden');
    }

    closeSettingsDropdown() {
        const dropdown = document.getElementById('settings-dropdown');
        dropdown.classList.add('hidden');
    }

    showQuestion(questionId) {
        if (this.answeredQuestions.has(questionId)) {
            return;
        }

        this.currentQuestion = questionId;
        this.showingAnswer = false;

        const question = this.questions[questionId];
        if (!question) {
            console.error('Question not found:', questionId);
            return;
        }

        // Hide board and show question display
        document.getElementById('quiz-board').classList.add('hidden');
        document.getElementById('question-display').classList.remove('hidden');
        // Update question display
        document.getElementById('question-id').textContent = `Question ${questionId}`;

        const questionTextEl = document.getElementById('question-text');
        const answerTextEl = document.getElementById('answer-text');

        // Set text content
        questionTextEl.textContent = question.question;
        answerTextEl.textContent = question.answer;

        // Set appropriate text direction based on content
        this.setTextDirection(questionTextEl, question.question);
        this.setTextDirection(answerTextEl, question.answer);        // Handle images
        const questionImage = document.getElementById('question-image');
        const answerImage = document.getElementById('answer-image');

        if (question.questionImage) {
            // Check if the image is a data URL or a file path
            if (question.questionImage.startsWith('data:')) {
                questionImage.src = question.questionImage;
            } else {
                // Assume it's a path to the images folder
                questionImage.src = `${question.questionImage}`;
            }
            questionImage.classList.remove('hidden');

            // Add error handling for images
            questionImage.onerror = () => {
                console.error('Failed to load question image:', question.questionImage);
                questionImage.classList.add('hidden');
            };
        } else {
            questionImage.classList.add('hidden');
        }

        if (question.answerImage) {
            // Check if the image is a data URL or a file path
            if (question.answerImage.startsWith('data:')) {
                answerImage.src = question.answerImage;
            } else {
                // Assume it's a path to the images folder
                answerImage.src = `${question.answerImage}`;
            }
            answerImage.classList.remove('hidden');

            // Add error handling for images
            answerImage.onerror = () => {
                console.error('Failed to load answer image:', question.answerImage);
                answerImage.classList.add('hidden');
            };
        } else {
            answerImage.classList.add('hidden');
        }

        // Hide answer initially
        document.getElementById('answer-content').classList.add('hidden');
        document.getElementById('instruction-text').textContent = 'Press any key to reveal answer';

        // Set text direction
        this.setTextDirection(document.getElementById('question-text'), question.question);
        this.setTextDirection(document.getElementById('answer-text'), question.answer);

        // Focus for accessibility
        document.getElementById('question-display').focus();
    }

    handleKeyPress(e) {
        if (document.getElementById('question-display').classList.contains('hidden')) {
            return;
        }

        // Prevent default for arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        if (!this.showingAnswer) {
            // Show answer
            this.showingAnswer = true;
            document.getElementById('answer-content').classList.remove('hidden');
            document.getElementById('instruction-text').textContent = 'Press any key to return to board';

            // Show answer image if it exists
            const answerImage = document.getElementById('answer-image');
            if (this.questions[this.currentQuestion].answerImage) {
                answerImage.classList.remove('hidden');
            }
        } else {
            // Return to board and mark as answered
            this.markAsAnswered(this.currentQuestion);
            this.returnToBoard();
        }
    }

    markAsAnswered(questionId) {
        this.answeredQuestions.add(questionId);
        this.saveGameState();
        this.updateProgress();
    }

    returnToBoard() {
        document.getElementById('question-display').classList.add('hidden');
        document.getElementById('quiz-board').classList.remove('hidden');
        this.renderBoard();
        this.currentQuestion = null;
        this.showingAnswer = false;
    }

    updateProgress() {
        const total = Object.keys(this.questions).length;
        const answered = this.answeredQuestions.size;
        document.getElementById('progress-text').textContent = `Questions answered: ${answered}/${total}`;
    }

    resetGame() {
        if (confirm('Are you sure you want to reset the game? This will clear all progress.')) {
            this.answeredQuestions.clear();
            this.saveGameState();
            this.renderBoard();
            this.updateProgress();
            this.returnToBoard();
        }
    }    saveGameState() {
        try {
            localStorage.setItem('quizGame_answeredQuestions', JSON.stringify([...this.answeredQuestions]));
            localStorage.setItem('quizGame_questions', JSON.stringify(this.questions));
            
            // Make sure currentSetName is saved if it exists
            const currentSetName = localStorage.getItem('quizGame_currentSetName');
            if (!currentSetName) {
                localStorage.setItem('quizGame_currentSetName', 'current_questions');
            }
        } catch (error) {
            console.warn('Failed to save game state:', error);
        }
    }

    loadGameState() {
        try {
            const savedAnswered = localStorage.getItem('quizGame_answeredQuestions');
            const savedQuestions = localStorage.getItem('quizGame_questions');

            if (savedAnswered) {
                this.answeredQuestions = new Set(JSON.parse(savedAnswered));
            }

            if (savedQuestions) {
                this.questions = JSON.parse(savedQuestions);
            }

            this.renderBoard();
            this.updateProgress();
        } catch (error) {
            console.warn('Failed to load game state:', error);
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
            this.importCSV(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            alert('Excel import requires a library. Please use CSV format instead.\n\nCSV Format:\nQuestion ID,Question,Answer,Question Image,Answer Image\nA1,What is 2+2?,4,,\nA2,Capital of France?,Paris,,');
        } else {
            alert('Please select a CSV file (.csv) or Excel file (.xlsx, .xls)');
        }

        // Reset file input
        event.target.value = '';
    }

    importCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const questions = this.parseCSV(csv);

                if (Object.keys(questions).length > 0) {
                    if (confirm(`Import ${Object.keys(questions).length} questions? This will replace current questions.`)) {
                        this.questions = questions;
                        this.answeredQuestions.clear();
                        this.saveGameState();
                        this.renderBoard();
                        this.updateProgress();
                        this.returnToBoard();
                        alert('Questions imported successfully!');
                    }
                } else {
                    alert('No valid questions found in the file.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csv) {
        const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
        const questions = {};

        // Skip header if it exists
        let startIndex = 0;
        if (lines[0] && (lines[0].toLowerCase().includes('question') || lines[0].toLowerCase().includes('id'))) {
            startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const columns = this.parseCSVLine(line);

            if (columns.length >= 3) {
                const id = columns[0].trim();
                const question = columns[1].trim();
                const answer = columns[2].trim();
                const questionImage = columns[3] ? columns[3].trim() : null;
                const answerImage = columns[4] ? columns[4].trim() : null;

                if (id && question && answer) {
                    questions[id] = {
                        question,
                        answer,
                        questionImage,
                        answerImage
                    };
                }
            }
        }

        return questions;
    }

    parseCSVLine(line) {
        const columns = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        columns.push(current);
        return columns.map(col => col.replace(/^"|"$/g, ''));
    }

    exportQuestions() {
        try {
            const csv = this.generateCSV();

            // Add UTF-8 BOM for Excel compatibility with Arabic characters
            const BOM = "\uFEFF"; // UTF-8 BOM (byte order mark)
            const csvWithBOM = BOM + csv;

            // Create blob with BOM
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'quiz_questions.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                alert('Download not supported in this browser');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting questions');
        }
    }

    generateCSV() {
        let csv = 'Question ID,Question,Answer,Question Image,Answer Image\n';

        for (const [id, data] of Object.entries(this.questions)) {
            const question = this.escapeCSV(data.question);
            const answer = this.escapeCSV(data.answer);
            const questionImage = data.questionImage || '';
            const answerImage = data.answerImage || '';

            csv += `${id},${question},${answer},${questionImage},${answerImage}\n`;
        }

        return csv;
    }

    escapeCSV(text) {
        if (typeof text !== 'string') return '';

        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    }

    // Helper function to detect if text contains Arabic characters
    containsArabic(text) {
        // Unicode range for Arabic characters
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(text);
    }

    // Set direction attribute based on text content
    setTextDirection(element, text) {
        if (this.containsArabic(text)) {
            element.setAttribute('dir', 'rtl');
        } else {
            element.setAttribute('dir', 'ltr');
        }
    }

    showQuestionSetsModal() {
        // Get available question sets
        this.loadAvailableQuestionSets()
            .then(() => {
                // Show the modal
                document.getElementById('question-sets-modal').classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error loading question sets:', error);
                alert('Error loading question sets. Please try again.');
            });
    }

    closeQuestionSetsModal() {
        document.getElementById('question-sets-modal').classList.add('hidden');
    }

    async loadAvailableQuestionSets() {
        try {
            const setsListElement = document.getElementById('question-sets-list');
            setsListElement.innerHTML = '<div class="loading">Loading available question sets...</div>';

            document.getElementById('question-sets-modal').classList.remove('hidden');

            // Get the available question files
            const questionSets = await this.fetchAvailableSets();

            // Clear loading message
            setsListElement.innerHTML = '';

            if (questionSets.length === 0) {
                setsListElement.innerHTML = '<div class="no-sets">No question sets available</div>';
                return;
            }

            // Create elements for each question set
            questionSets.forEach(set => {
                const setElement = document.createElement('button');
                setElement.className = 'question-set-item';
                setElement.addEventListener('click', () => this.loadQuestionSet(set.name));

                
                const nameElement = document.createElement('span');
                nameElement.className = 'question-set-name';
                nameElement.textContent = set.name;
                
                
                setElement.appendChild(nameElement);
                setsListElement.appendChild(setElement);
            });
        } catch (error) {
            console.error('Error loading question sets:', error);
            
            const setsListElement = document.getElementById('question-sets-list');
            setsListElement.innerHTML = '<div class="error">Error loading question sets</div>';
        }
    }

    async fetchAvailableSets() {
        try {
            const response = await fetch('api.php?action=list_question_files');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            return data.files || [];
        } catch (error) {
            console.error('Error fetching available question sets:', error);
            return [];
        }
    }
    
    async processFileList(files) {
        const sets = [];

        // Process each file
        for (const filename of files) {
            try {
                // Get the file content
                const response = await fetch(`questions/${filename}`);
                if (!response.ok) {
                    console.warn(`Could not load ${filename}`);
                    continue;
                }

                const csv = await response.text();

                // Count questions
                const lines = csv.split('\n').filter(line => line.trim());
                // Subtract header line if it exists
                const questionCount = lines[0].toLowerCase().includes('question') ? lines.length - 1 : lines.length;

                // Format name from filename
                let name = filename.replace('.csv', '');
                name = name.replace(/_/g, ' ');
                name = name.split(' ').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');

                sets.push({
                    filename,
                    name,
                    questionCount
                });
            } catch (error) {
                console.error(`Error processing ${filename}:`, error);
                // Continue to the next file even if this one fails
            }
        }

        return sets;
    }

    async loadQuestionSet(filename) {
        try {        // Close the modal
        this.closeQuestionSetsModal();

        // Show loading feedback
        const progress = document.getElementById('progress-text');
        const originalText = progress.textContent;
        progress.textContent = `Loading ${filename}...`;

        const response = await fetch(`api.php?action=load_question_file&file=${encodeURIComponent(filename)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        // Parse the CSV content
        const questions = this.parseCSV(data.content);
        if (!questions || Object.keys(questions).length === 0) {
            throw new Error('No valid questions found in the file');
        }

        // Update the questions and save to local storage
        this.questions = questions;
        localStorage.setItem('quizGame_questions', JSON.stringify(questions));
        
        // Save the current set name
        localStorage.setItem('quizGame_currentSetName', filename);
        
        // Reset answered questions
        this.answeredQuestions = new Set();
        localStorage.setItem('quizGame_answered', JSON.stringify(Array.from(this.answeredQuestions)));

            // Refresh the board and progress
            this.renderBoard();
            this.updateProgress();

            // Show feedback
            progress.textContent = originalText;
            alert(`Question set "${filename}" loaded successfully!`);
        } catch (error) {
            console.error('Error loading question set:', error);
            alert(`Error loading questions: ${error.message}`);
        }
    }

    editCurrentQuestions() {
        // Make sure current questions are saved in local storage
        this.saveGameState();
        
        // Get the currently active question set name from local storage
        let currentSetName = localStorage.getItem('quizGame_currentSetName');
        if (!currentSetName) {
            // If no set name is stored, use a default name
            currentSetName = 'current_questions';
        }
        
        // Navigate to editor with current question set
        window.location.href = `editor.html?current=true`;
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
});

// Service Worker registration for offline capability (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
