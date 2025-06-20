// Question Editor for TheQuestions
class QuestionEditor {
    constructor() {
        this.questions = {};
        this.currentQuestionId = null;
        this.setName = '';

        // Initialize 
        this.init();
    }

    init() {
        // Set up event listeners
        this.attachEventListeners();

        // Initialize with empty questions set
        this.initializeEmptySet();

        // Check for URL parameters
        this.checkForLoadParameters();        // Show empty state initially and update position counter
        this.showEmptyState();
        this.updatePositionCounter();
    }

    initializeEmptySet() {
        const rows = ['A', 'B', 'C', 'D', 'E'];

        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const id = `${rows[col]}${row + 1}`;
                this.questions[id] = {
                    question: '',
                    answer: '',
                    questionImage: null,
                    answerImage: null
                };
            }
        }
    }

    checkForLoadParameters() {
        // Check if we have a file to load from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const loadFile = urlParams.get('load');
        const editQuestionId = urlParams.get('edit');
        const current = urlParams.get('current');

        if (loadFile) {
            this.loadQuestionSet(loadFile);
        } else if (editQuestionId) {
            // We're editing a specific question from the game

            // Try to load questions from local storage
            const savedQuestions = localStorage.getItem('quizGame_questions');
            if (savedQuestions) {
                this.questions = JSON.parse(savedQuestions);

                // Set the question ID dropdown to the specific question
                if (this.questions[editQuestionId]) {
                    this.currentQuestionId = editQuestionId;

                    // Update the dropdown and form
                    setTimeout(() => {
                        document.getElementById('question-id').value = editQuestionId;
                        this.updateFormFromQuestion(editQuestionId);

                        // Show a message to the user
                        alert(`Editing question ${editQuestionId}`);
                    }, 100);
                }
            }
        } else if (current) {
            // We're editing the current question set from the game

            // Try to load questions from local storage
            const savedQuestions = localStorage.getItem('quizGame_questions');
            if (savedQuestions) {
                this.questions = JSON.parse(savedQuestions);

                // Get the current set name if available
                const currentSetName = localStorage.getItem('quizGame_currentSetName') || 'Current Questions';
                document.getElementById('set-name').value = currentSetName;
                this.setName = currentSetName;

                // Update the question list
                this.updateQuestionList();

                // Find the first question with content to show
                const firstQuestionId = Object.keys(this.questions).find(id =>
                    this.questions[id].question || this.questions[id].answer ||
                    this.questions[id].questionImage || this.questions[id].answerImage
                );

                if (firstQuestionId) {
                    this.currentQuestionId = firstQuestionId;
                    document.getElementById('question-id').value = firstQuestionId;
                    this.updateFormFromQuestion(firstQuestionId);
                }
            }
        }
    }

    attachEventListeners() {
        // Back to game button
        document.getElementById('back-to-game-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Save question set button
        document.getElementById('export-set-btn').addEventListener('click', () => {
            this.saveQuestionSet();
        });

        // Add new question button
        document.getElementById('add-question-btn').addEventListener('click', () => {
            this.addNewQuestion();
        });

        // Save question button
        document.getElementById('save-question-btn').addEventListener('click', () => {
            this.saveCurrentQuestion();
        });

        // Delete question button
        document.getElementById('delete-question-btn').addEventListener('click', () => {
            this.deleteCurrentQuestion();
        });

        // Set name input
        document.getElementById('set-name').addEventListener('input', (e) => {
            this.setName = e.target.value;
        });

        // Question ID dropdown
        document.getElementById('question-id').addEventListener('change', (e) => {
            if (this.currentQuestionId) {
                // Save current question first
                this.saveFormToQuestion(this.currentQuestionId);
            }

            // Update position
            this.currentQuestionId = e.target.value;
            this.updateFormFromQuestion(this.currentQuestionId);
        });

        // Image uploads and removals
        document.getElementById('question-image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'question');
        });

        document.getElementById('answer-image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'answer');
        });

        document.getElementById('remove-question-image').addEventListener('click', () => {
            this.removeImage('question');
        });

        document.getElementById('remove-answer-image').addEventListener('click', () => {
            this.removeImage('answer');
        });

        // Auto-detect Arabic text direction
        document.getElementById('question-text').addEventListener('input', (e) => {
            this.setTextDirection(e.target, e.target.value);
        });

        document.getElementById('answer-text').addEventListener('input', (e) => {
            this.setTextDirection(e.target, e.target.value);
        });
    }

    // Helper method to detect Arabic text
    containsArabic(text) {
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(text);
    }

    // Set text direction based on content
    setTextDirection(element, text) {
        if (this.containsArabic(text)) {
            element.setAttribute('dir', 'rtl');
        } else {
            element.setAttribute('dir', 'ltr');
        }
    }

    addNewQuestion() {
        // Find first empty position
        const emptyPosition = this.findEmptyPosition();
        if (!emptyPosition) {
            alert('All positions are filled. Please edit an existing question or delete one first.');
            return;
        }

        // Select this position and show form
        document.getElementById('question-id').value = emptyPosition;
        this.currentQuestionId = emptyPosition;

        // Clear form
        document.getElementById('question-text').value = '';
        document.getElementById('answer-text').value = '';
        this.removeImage('question');
        this.removeImage('answer');

        // Show edit area and hide empty state
        this.showEditArea();

        // Update question list
        this.updateQuestionList();
    } 
    
    findEmptyPosition() {
        for (const id in this.questions) {
            const q = this.questions[id];
            // Check if all fields are empty
            if (!q.question && !q.answer && !q.questionImage && !q.answerImage) {
                return id;
            }
        }
        return null; // All positions are filled
    } 
    
    
    saveCurrentQuestion() {
        if (!this.currentQuestionId) return;

        this.saveFormToQuestion(this.currentQuestionId);
        this.updateQuestionList();
        this.updatePositionCounter();

        // Show feedback
        alert(`Question ${this.currentQuestionId} saved!`);
    }

    deleteCurrentQuestion() {
        if (!this.currentQuestionId) return;

        const id = this.currentQuestionId;
        if (confirm(`Are you sure you want to delete question ${id}?`)) {
            // Clear question data
            this.questions[id] = {
                question: '',
                answer: '',
                questionImage: null,
                answerImage: null
            };

            // Clear form
            document.getElementById('question-text').value = '';
            document.getElementById('answer-text').value = '';
            this.removeImage('question');
            this.removeImage('answer');        // Update list and position counter
            this.updateQuestionList();
            this.updatePositionCounter();
        }
    }

    saveFormToQuestion(id) {
        const questionText = document.getElementById('question-text').value.trim();
        const answerText = document.getElementById('answer-text').value.trim();

        if (!questionText && !answerText) return; // Don't save empty questions

        this.questions[id] = {
            question: questionText,
            answer: answerText,
            questionImage: this.questions[id].questionImage,
            answerImage: this.questions[id].answerImage
        };
    }
    updateFormFromQuestion(id) {
        const question = this.questions[id];
        if (!question) return;

        // Update form fields
        document.getElementById('question-text').value = question.question || '';
        document.getElementById('answer-text').value = question.answer || '';

        // Set text direction
        this.setTextDirection(document.getElementById('question-text'), question.question || '');
        this.setTextDirection(document.getElementById('answer-text'), question.answer || '');

        // Update images
        const questionImagePreview = document.getElementById('question-image-preview');
        const answerImagePreview = document.getElementById('answer-image-preview');

        if (question.questionImage) {
            // If we have a preview image (during current session), use that
            if (question.questionImagePreview) {
                questionImagePreview.src = question.questionImagePreview;
            }
            // Otherwise check if it's a path to an existing image
            else if (typeof question.questionImage === 'string' && !question.questionImage.startsWith('data:')) {
                questionImagePreview.src = `images/${question.questionImage}`;

                // Add error handling
                questionImagePreview.onerror = () => {
                    console.warn(`Could not load question image: ${question.questionImage}`);
                    questionImagePreview.classList.add('hidden');
                    document.getElementById('remove-question-image').classList.add('hidden');
                };
            }
            // Fallback for data URLs
            else {
                questionImagePreview.src = question.questionImage;
            }

            questionImagePreview.classList.remove('hidden');
            document.getElementById('remove-question-image').classList.remove('hidden');
        } else {
            questionImagePreview.classList.add('hidden');
            document.getElementById('remove-question-image').classList.add('hidden');
        }

        if (question.answerImage) {
            // If we have a preview image (during current session), use that
            if (question.answerImagePreview) {
                answerImagePreview.src = question.answerImagePreview;
            }
            // Otherwise check if it's a path to an existing image
            else if (typeof question.answerImage === 'string' && !question.answerImage.startsWith('data:')) {
                answerImagePreview.src = `${question.answerImage}`;

                // Add error handling
                answerImagePreview.onerror = () => {
                    console.warn(`Could not load answer image: ${question.answerImage}`);
                    answerImagePreview.classList.add('hidden');
                    document.getElementById('remove-answer-image').classList.add('hidden');
                };
            }
            // Fallback for data URLs
            else {
                answerImagePreview.src = question.answerImage;
            }

            answerImagePreview.classList.remove('hidden');
            document.getElementById('remove-answer-image').classList.remove('hidden');
        } else {
            answerImagePreview.classList.add('hidden');
            document.getElementById('remove-answer-image').classList.add('hidden');
        }

        // Show edit area
        this.showEditArea();
    }


    handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image file is too large. Maximum size is 2MB.');
            return;
        }

        // Check if it's an image file
        if (!file.type.startsWith('image/')) {
            alert('Selected file is not an image.');
            return;
        }

        // Create form data for upload
        const formData = new FormData();
        formData.append('image', file);

        // Show loading indicator
        const previewElement = document.getElementById(`${type}-image-preview`);
        previewElement.classList.remove('hidden');
        previewElement.src = 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQACgABACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkEAAoAAgAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkEAAoAAwAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkEAAoABAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQACgAFACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQACgAGACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAAKAAcALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==';

        // Upload the image to the server
        fetch('api.php?action=upload_image', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show preview and remove button
                    previewElement.src = data.path;
                    previewElement.classList.remove('hidden');
                    document.getElementById(`remove-${type}-image`).classList.remove('hidden');

                    // Store image path in current question
                    if (this.currentQuestionId) {
                        this.questions[this.currentQuestionId][`${type}Image`] = data.path;
                    }
                } else {
                    alert('Failed to upload image: ' + (data.error || 'Unknown error'));
                    previewElement.classList.add('hidden');
                }
            })
            .catch(error => {
                console.error('Error uploading image:', error);
                alert('Error uploading image: ' + error.message);
                previewElement.classList.add('hidden');
            });
    }

    // Generate a random unique ID for images
    generateUniqueImageId() {
        return 'img_' + Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            '_' + Date.now().toString();
    }
    removeImage(type) {
        // Hide preview and remove button
        document.getElementById(`${type}-image-preview`).classList.add('hidden');
        document.getElementById(`remove-${type}-image`).classList.add('hidden');

        // Clear file input
        document.getElementById(`${type}-image-upload`).value = '';

        // Remove from current question
        if (this.currentQuestionId) {
            // Get the current image filename first
            const currentImageFile = this.questions[this.currentQuestionId][`${type}Image`];

            // If this was a file that was pending upload, remove it from the upload queue
            if (this.imagesToUpload && currentImageFile && this.imagesToUpload[currentImageFile]) {
                delete this.imagesToUpload[currentImageFile];
            }

            // Remove the image reference and preview
            this.questions[this.currentQuestionId][`${type}Image`] = null;
            this.questions[this.currentQuestionId][`${type}ImagePreview`] = null;
        }
    }

    showEditArea() {
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('question-edit-area').classList.add('active');
    }

    showEmptyState() {
        document.getElementById('empty-state').classList.remove('hidden');
        document.getElementById('question-edit-area').classList.remove('active');
    } 
    
    updateQuestionList() {
        const listElement = document.getElementById('question-list');
        listElement.innerHTML = '';

        for (const id in this.questions) {
            const question = this.questions[id];

            // Only show questions that have content (text or images)
            if (question.question || question.answer || question.questionImage || question.answerImage) {
                const item = document.createElement('div');
                item.className = 'question-list-item';
                if (id === this.currentQuestionId) {
                    item.classList.add('active');
                }

                const idSpan = document.createElement('span');
                idSpan.className = 'question-list-id';
                idSpan.textContent = id; const textSpan = document.createElement('span');
                textSpan.className = 'question-list-text';

                // Show text content or indicator
                let displayText = question.question || '(No question text)';

                // Add indicators for images if present
                if (question.questionImage || question.answerImage) {
                    let imgIndicator = '';
                    if (question.questionImage) imgIndicator += '🖼️Q ';
                    if (question.answerImage) imgIndicator += '🖼️A ';
                    displayText = imgIndicator + displayText;
                }

                textSpan.textContent = displayText;

                // Set appropriate text direction
                if (question.question && this.containsArabic(question.question)) {
                    textSpan.dir = 'rtl';
                } else {
                    textSpan.dir = 'ltr';
                }

                item.appendChild(idSpan);
                item.appendChild(textSpan);

                item.addEventListener('click', () => {
                    if (this.currentQuestionId) {
                        // Save current question first
                        this.saveFormToQuestion(this.currentQuestionId);
                    }

                    this.currentQuestionId = id;
                    this.updateFormFromQuestion(id);
                    document.getElementById('question-id').value = id;

                    // Update active state in list
                    const activeItems = document.querySelectorAll('.question-list-item.active');
                    activeItems.forEach(activeItem => activeItem.classList.remove('active'));
                    item.classList.add('active');
                });

                listElement.appendChild(item);
            }
        }
    }

    updatePositionCounter() {
        // Count filled positions
        let filledCount = 0;
        let totalCount = 0;

        for (const id in this.questions) {
            totalCount++;
            const q = this.questions[id];
            if (q.question || q.answer || q.questionImage || q.answerImage) {
                filledCount++;
            }
        }

        // Display the count in the UI
        const counterElement = document.getElementById('position-counter');
        if (counterElement) {
            counterElement.textContent = `${filledCount}/${totalCount} positions filled`;
        } else {
            // Create counter element if it doesn't exist
            const container = document.querySelector('.editor-header');
            const counter = document.createElement('div');
            counter.id = 'position-counter';
            counter.className = 'position-counter';
            counter.textContent = `${filledCount}/${totalCount} positions filled`;

            // Add some basic styling inline
            counter.style.fontSize = '0.9rem';
            counter.style.marginLeft = '10px';
            counter.style.color = '#666';

            // Insert after the set name input
            const setNameInput = document.getElementById('set-name');
            if (setNameInput && container) {
                container.insertBefore(counter, setNameInput.nextSibling);
            }
        }
    }

    async loadQuestionSet(filename) {
        try {
            // Show loading feedback
            document.getElementById('set-name').value = 'Loading...';

            // Load questions from the PHP API
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

            // Update the questions
            this.questions = questions;

            // Set the name (without .csv extension)
            this.setName = filename.replace(/\.csv$/i, '');
            document.getElementById('set-name').value = this.setName;        // Update the question list and position counter
            this.updateQuestionList();
            this.updatePositionCounter();

            // Show first question if any
            const firstQuestionId = Object.keys(questions).find(id =>
                questions[id].question || questions[id].answer ||
                questions[id].questionImage || questions[id].answerImage
            );

            if (firstQuestionId) {
                this.currentQuestionId = firstQuestionId;
                document.getElementById('question-id').value = firstQuestionId;
                this.updateFormFromQuestion(firstQuestionId);
            } else {
                this.showEmptyState();
            }

        } catch (error) {
            console.error('Error loading question set:', error);
            alert(`Error loading question set: ${error.message}`);
            document.getElementById('set-name').value = '';
        }
    } async saveQuestionSet() {
        try {
            // Get set name or use a default
            let setName = document.getElementById('set-name').value.trim();
            if (!setName) {
                setName = 'question_set_' + new Date().toISOString().slice(0, 10);
            }

            // Generate CSV from questions
            const csvContent = this.generateCSV();

            // Validate if there are actual questions
            const hasQuestions = Object.values(this.questions).some(
                q => q.question || q.answer || q.questionImage || q.answerImage
            );

            if (!hasQuestions) {
                alert('Cannot save an empty question set. Please add at least one question.');
                return;
            }

            // Add .csv extension if not present
            if (!setName.toLowerCase().endsWith('.csv')) {
                setName += '.csv';
            }

            // Save to server using the PHP API
            const response = await fetch('api.php?action=save_question_file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: setName,
                    csvContent: csvContent
                })
            });

            const result = await response.json(); if (result.success) {
                // Also update the local storage with the current questions and set name
                localStorage.setItem('quizGame_questions', JSON.stringify(this.questions));
                localStorage.setItem('quizGame_currentSetName', setName);

                alert(`Question set saved as "${setName}"`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error saving question set:', error);
            alert('Error saving question set: ' + error.message);
        }
    }

    // Function to download multiple image files sequentially
    async downloadImages(imageDownloads) {
        let downloadCount = 0;
        const totalImages = imageDownloads.length;

        for (const image of imageDownloads) {
            try {
                // Create and trigger download
                const url = URL.createObjectURL(image.fileData);
                const link = document.createElement('a');
                link.href = url;
                link.download = image.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                downloadCount++;

                // Wait a bit between downloads to avoid browser issues
                await new Promise(resolve => setTimeout(resolve, 700));

                // Show progress
                if (downloadCount < totalImages) {
                    alert(`Downloaded ${downloadCount} of ${totalImages} images. Click OK to continue downloading.`);
                }

            } catch (err) {
                console.error(`Failed to download image ${image.fileName}:`, err);
                if (!confirm(`Failed to download ${image.fileName}. Continue with remaining images?`)) {
                    break;
                }
            }
        }

        return downloadCount;
    }

    parseCSV(csv) {
        const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
        const questions = {};

        // Initialize empty questions first
        const rows = ['A', 'B', 'C', 'D', 'E'];
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const id = `${rows[col]}${row + 1}`;
                questions[id] = {
                    question: '',
                    answer: '',
                    questionImage: null,
                    answerImage: null
                };
            }
        }

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

                if (id && (question || answer)) {
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

    generateCSV() {
        let csv = 'Question ID,Question,Answer,Question Image,Answer Image\n';

        for (const [id, data] of Object.entries(this.questions)) {
            // Skip empty questions
            if (!data.question && !data.answer) continue;

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
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuestionEditor();
});
