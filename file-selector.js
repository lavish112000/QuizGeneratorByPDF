/**
 * File Selector JavaScript
 * Handles file selection, upload, and extraction configuration
 */

class FileSelector {
    constructor() {
        this.selectedFiles = [];
        this.selectedFormat = 'pdf';
        this.uploadMethod = 'upload';
        this.sampleFiles = [];
        
        this.initializeEventListeners();
        this.loadSampleFiles();
    }

    initializeEventListeners() {
        // Format selection
        document.querySelectorAll('.format-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectFormat(card.dataset.format);
            });
        });

        // Upload method toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchUploadMethod(btn.dataset.method);
            });
        });

        // File upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // Action buttons
        document.getElementById('extractBtn').addEventListener('click', () => this.extractQuestions());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewContent());
        document.getElementById('cancelExtraction').addEventListener('click', () => this.cancelExtraction());

        // Option changes
        document.getElementById('includeContext').addEventListener('change', () => this.updateOptions());
        document.getElementById('questionCount').addEventListener('change', () => this.updateOptions());
        document.getElementById('difficulty').addEventListener('change', () => this.updateOptions());
        
        document.querySelectorAll('input[name="questionTypes"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateOptions());
        });
    }

    selectFormat(format) {
        this.selectedFormat = format;
        
        // Update UI
        document.querySelectorAll('.format-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-format="${format}"]`).classList.add('active');

        // Update file input accept attribute
        const fileInput = document.getElementById('fileInput');
        const acceptMap = {
            'pdf': '.pdf',
            'txt': '.txt',
            'docx': '.docx',
            'doc': '.doc'
        };
        
        if (format === 'all') {
            fileInput.accept = '.pdf,.txt,.docx,.doc';
        } else {
            fileInput.accept = acceptMap[format];
        }

        this.updateSupportedFormats();
    }

    switchUploadMethod(method) {
        console.log(`🔄 Switching upload method from '${this.uploadMethod}' to '${method}'`);
        this.uploadMethod = method;
        
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // Show/hide upload methods
        document.querySelectorAll('.upload-method').forEach(methodEl => {
            methodEl.classList.remove('active');
        });
        document.getElementById(`${method}Method`).classList.add('active');
    }

    updateSupportedFormats() {
        const supportedFormats = document.querySelector('.supported-formats');
        const formatNames = {
            'pdf': 'PDF',
            'txt': 'TXT',
            'docx': 'DOCX',
            'doc': 'DOC'
        };

        if (this.selectedFormat === 'all') {
            supportedFormats.innerHTML = Object.values(formatNames)
                .map(name => `<span class="format-tag">${name}</span>`).join('');
        } else {
            supportedFormats.innerHTML = `<span class="format-tag">${formatNames[this.selectedFormat]}</span>`;
        }
    }

    handleFileSelect(files) {
        const validFiles = [];
        const allowedExtensions = this.selectedFormat === 'all' 
            ? ['.pdf', '.txt', '.docx', '.doc']
            : [`.${this.selectedFormat}`];

        Array.from(files).forEach(file => {
            const extension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
            if (allowedExtensions.includes(extension)) {
                // Check if file already selected
                if (!this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
                    validFiles.push({
                        file: file,
                        name: file.name,
                        size: file.size,
                        type: extension.substr(1),
                        id: Date.now() + Math.random()
                    });
                }
            } else {
                this.showNotification(`File "${file.name}" is not a supported format.`, 'warning');
            }
        });

        this.selectedFiles.push(...validFiles);
        this.updateSelectedFilesDisplay();
        this.updateActionButtons();
    }

    async loadSampleFiles() {
        console.log('📁 Loading sample files...');
        try {
            const response = await fetch('/api/sample-files');
            if (response.ok) {
                this.sampleFiles = await response.json();
                console.log(`✅ Loaded ${this.sampleFiles.length} sample files:`, this.sampleFiles);
            } else {
                console.error('❌ Failed to load sample files, using fallback');
                // Fallback to hardcoded files
                this.sampleFiles = [
                    { name: 'Sample Quiz 1.pdf', size: '2.5 MB', type: 'pdf', description: 'Mathematics questions' },
                    { name: 'Science Quiz.pdf', size: '1.8 MB', type: 'pdf', description: 'Physics and Chemistry' },
                    { name: 'History Notes.pdf', size: '3.2 MB', type: 'pdf', description: 'World History content' }
                ];
            }
        } catch (error) {
            console.error('❌ Error loading sample files:', error);
            // Fallback to hardcoded files
            this.sampleFiles = [
                { name: 'Sample Quiz 1.pdf', size: '2.5 MB', type: 'pdf', description: 'Mathematics questions' },
                { name: 'Science Quiz.pdf', size: '1.8 MB', type: 'pdf', description: 'Physics and Chemistry' },
                { name: 'History Notes.pdf', size: '3.2 MB', type: 'pdf', description: 'World History content' }
            ];
        }

        this.renderSampleFiles();
    }

    renderSampleFiles() {
        const grid = document.getElementById('sampleFilesGrid');
        grid.innerHTML = this.sampleFiles.map(file => `
            <div class="sample-file-card" data-file-id="${file.name}">
                <div class="file-icon">
                    <i class="fas fa-file-${file.type === 'pdf' ? 'pdf' : file.type === 'txt' ? 'alt' : 'word'}"></i>
                </div>
                <h4>${file.name}</h4>
                <p>${file.description}</p>
                <div class="file-meta">
                    <span class="file-size">${file.size}</span>
                    <span class="file-type">${file.type.toUpperCase()}</span>
                </div>
            </div>
        `).join('');

        // Add click events
        grid.querySelectorAll('.sample-file-card').forEach(card => {
            card.addEventListener('click', () => this.toggleSampleFile(card));
        });
    }

    toggleSampleFile(card) {
        const fileId = card.dataset.fileId;
        const file = this.sampleFiles.find(f => f.name === fileId);
        
        console.log(`🎯 toggleSampleFile: ${fileId}`, file);
        
        if (card.classList.contains('selected')) {
            // Remove from selection
            card.classList.remove('selected');
            this.selectedFiles = this.selectedFiles.filter(f => f.name !== fileId);
            console.log(`➖ Removed file: ${fileId}. Total selected: ${this.selectedFiles.length}`);
        } else {
            // Add to selection
            card.classList.add('selected');
            this.selectedFiles.push({
                ...file,
                id: Date.now() + Math.random(),
                isSample: true
            });
            console.log(`➕ Added file: ${fileId}. Total selected: ${this.selectedFiles.length}`);
        }

        this.updateSelectedFilesDisplay();
        this.updateActionButtons();
    }

    updateSelectedFilesDisplay() {
        const selectedFilesContainer = document.getElementById('selectedFiles');
        const filesList = document.getElementById('filesList');

        if (this.selectedFiles.length === 0) {
            selectedFilesContainer.classList.add('hidden');
            return;
        }

        selectedFilesContainer.classList.remove('hidden');
        
        filesList.innerHTML = this.selectedFiles.map(file => `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas fa-file-${file.type === 'pdf' ? 'pdf' : file.type === 'txt' ? 'alt' : 'word'}"></i>
                    </div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)} • ${file.type.toUpperCase()}${file.isSample ? ' • Sample File' : ''}</p>
                    </div>
                </div>
                <button class="remove-file" onclick="fileSelector.removeFile('${file.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
        
        // Update sample file UI if it was a sample file
        const sampleCard = document.querySelector(`[data-file-id="${this.selectedFiles.find(f => f.id === fileId)?.name}"]`);
        if (sampleCard) {
            sampleCard.classList.remove('selected');
        }

        this.updateSelectedFilesDisplay();
        this.updateActionButtons();
    }

    updateActionButtons() {
        const extractBtn = document.getElementById('extractBtn');
        const previewBtn = document.getElementById('previewBtn');
        const extractionOptions = document.getElementById('extractionOptions');
        
        const hasFiles = this.selectedFiles.length > 0;
        
        console.log(`🔍 updateActionButtons: hasFiles=${hasFiles}, selectedFiles=${this.selectedFiles.length}, uploadMethod=${this.uploadMethod}`);
        
        extractBtn.disabled = !hasFiles;
        previewBtn.disabled = !hasFiles;
        
        if (hasFiles) {
            extractionOptions.classList.remove('hidden');
            console.log('✅ Extraction options shown');
        } else {
            extractionOptions.classList.add('hidden');
            console.log('❌ Extraction options hidden');
        }
    }    updateOptions() {
        // This method can be used to validate and update extraction options
        console.log('Options updated');
    }

    formatFileSize(bytes) {
        if (typeof bytes === 'string') return bytes; // Already formatted
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async previewContent() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('Please select files first.', 'warning');
            return;
        }

        try {
            // Create preview modal
            this.showPreviewModal();
            
            if (this.uploadMethod === 'upload' && this.selectedFiles.length > 0) {
                // Preview uploaded files
                await this.previewUploadedFiles();
            } else if (this.uploadMethod === 'samples') {
                // Preview sample files
                await this.previewSampleFiles();
            }
        } catch (error) {
            console.error('Preview failed:', error);
            this.showNotification('Preview failed. Please try again.', 'error');
            this.hidePreviewModal();
        }
    }

    async extractQuestions() {
        console.log('🚀 extractQuestions called');
        console.log(`Selected files: ${this.selectedFiles.length}`, this.selectedFiles);
        console.log(`Upload method: ${this.uploadMethod}`);
        
        if (this.selectedFiles.length === 0) {
            console.warn('⚠️ No files selected');
            this.showNotification('Please select files first.', 'warning');
            return;
        }

        // Get extraction options
        const options = {
            questionCount: document.getElementById('questionCount').value,
            includeContext: document.getElementById('includeContext').checked,
            difficulty: document.getElementById('difficulty').value,
            questionTypes: Array.from(document.querySelectorAll('input[name="questionTypes"]:checked'))
                .map(cb => cb.value)
        };

        console.log('🎯 Extraction options:', options);
        console.log('📂 Selected files:', this.selectedFiles);

        this.showProgressModal();
        
        try {
            // Determine extraction method based on upload method and files
            if (this.uploadMethod === 'samples') {
                console.log('📁 Using sample files method (uploadMethod=samples)');
                await this.extractFromSamples(options);
            } else if (this.uploadMethod === 'upload' && this.selectedFiles.length > 0) {
                console.log('📤 Using upload method (uploadMethod=upload, files selected)');
                await this.uploadAndExtract(options);
            } else {
                console.log('� Defaulting to sample files method (no valid upload files)');
                // Default to sample files if upload method but no files
                await this.extractFromSamples(options);
            }
            
            console.log('🎉 Extraction completed, navigating to exam...');
            // Navigate to exam interface
            window.location.href = '/exam';
            
        } catch (error) {
            console.error('❌ Extraction failed:', error);
            this.showNotification('Extraction failed. Please try again.', 'error');
            this.hideProgressModal();
        }
    }

    async uploadAndExtract(options) {
        console.log('🚀 Starting upload and extract process...');
        console.log('📁 Selected files count:', this.selectedFiles.length);
        console.log('📁 Selected files:', this.selectedFiles);
        
        if (this.selectedFiles.length === 0) {
            console.warn('⚠️ No files selected for upload');
            throw new Error('No files selected for upload');
        }
        
        // Step 1: Upload files
        const formData = new FormData();
        for (const file of this.selectedFiles) {
            console.log(`📄 Adding file to upload: ${file.name} (${file.size} bytes, type: ${file.type})`);
            formData.append('files', file);
        }
        
        console.log('📤 Uploading files...');
        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Upload failed:', errorText);
            throw new Error(`Failed to upload files: ${errorText}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('✅ Upload successful:', uploadResult);
        
        // Step 2: Start extraction with progress simulation
        await this.simulateExtraction();
        
        // Step 3: Trigger actual backend extraction
        console.log('🎯 Starting backend extraction with options:', options);
        const extractionResponse = await fetch('/api/start-extraction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        });
        
        if (!extractionResponse.ok) {
            const errorText = await extractionResponse.text();
            console.error('❌ Extraction start failed:', errorText);
            throw new Error(`Failed to start extraction: ${errorText}`);
        }
        
        const extractionResult = await extractionResponse.json();
        console.log('✅ Extraction started successfully:', extractionResult);
    }

    async extractFromSamples(options) {
        console.log('📁 Starting sample files extraction...');
        console.log('Sample files selected:', this.selectedFiles);
        
        // Use existing sample files for extraction
        await this.simulateExtraction();
        
        // Trigger backend extraction with samples
        console.log('🎯 Starting backend extraction with samples and options:', options);
        const extractionResponse = await fetch('/api/start-extraction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...options,
                useSamples: true
            })
        });
        
        if (!extractionResponse.ok) {
            const errorText = await extractionResponse.text();
            console.error('❌ Sample extraction start failed:', errorText);
            throw new Error(`Failed to start extraction: ${errorText}`);
        }
        
        const extractionResult = await extractionResponse.json();
        console.log('✅ Sample extraction started successfully:', extractionResult);
    }

    showProgressModal() {
        const modal = document.getElementById('progressModal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    hideProgressModal() {
        const modal = document.getElementById('progressModal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    async simulateExtraction() {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressMessage = document.getElementById('progressMessage');
        const questionsFound = document.getElementById('questionsFound');
        const filesProcessed = document.getElementById('filesProcessed');
        const currentFile = document.getElementById('currentFile');

        const steps = [
            { progress: 10, message: 'Initializing extraction...', questions: 0, files: 0 },
            { progress: 25, message: 'Processing file formats...', questions: 5, files: 1 },
            { progress: 45, message: 'Extracting text content...', questions: 15, files: 2 },
            { progress: 65, message: 'Analyzing question patterns...', questions: 28, files: 3 },
            { progress: 80, message: 'Generating options...', questions: 42, files: 4 },
            { progress: 95, message: 'Finalizing questions...', questions: 50, files: this.selectedFiles.length },
            { progress: 100, message: 'Extraction complete!', questions: 50, files: this.selectedFiles.length }
        ];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            progressFill.style.width = `${step.progress}%`;
            progressPercentage.textContent = `${step.progress}%`;
            progressMessage.textContent = step.message;
            questionsFound.textContent = step.questions;
            filesProcessed.textContent = step.files;
            
            if (i < this.selectedFiles.length) {
                currentFile.textContent = this.selectedFiles[i]?.name || 'Processing...';
            } else {
                currentFile.textContent = 'All files processed';
            }

            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    cancelExtraction() {
        this.hideProgressModal();
        this.showNotification('Extraction cancelled.', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showPreviewModal() {
        let previewModal = document.getElementById('previewModal');
        if (!previewModal) {
            previewModal = this.createPreviewModal();
        }
        previewModal.classList.remove('hidden');
        previewModal.style.display = 'flex';
    }

    hidePreviewModal() {
        const previewModal = document.getElementById('previewModal');
        if (previewModal) {
            previewModal.classList.add('hidden');
            previewModal.style.display = 'none';
        }
    }

    createPreviewModal() {
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content preview-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-eye"></i> Content Preview</h3>
                    <button type="button" class="close-btn" onclick="document.getElementById('previewModal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="preview-tabs">
                        <button class="tab-btn active" data-tab="content">
                            <i class="fas fa-file-text"></i> Content
                        </button>
                        <button class="tab-btn" data-tab="metadata">
                            <i class="fas fa-info-circle"></i> Metadata
                        </button>
                    </div>
                    <div class="preview-content">
                        <div class="tab-content active" id="contentTab">
                            <div class="preview-text" id="previewText">
                                Loading content...
                            </div>
                        </div>
                        <div class="tab-content" id="metadataTab">
                            <div class="metadata-info" id="metadataInfo">
                                Loading metadata...
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('previewModal').style.display='none'">
                        Close
                    </button>
                    <button type="button" class="btn btn-primary" onclick="fileSelector.extractQuestions()">
                        <i class="fas fa-magic"></i> Extract Questions
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add tab switching functionality
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                modal.querySelector(`#${btn.dataset.tab}Tab`).classList.add('active');
            });
        });
        
        return modal;
    }

    async previewUploadedFiles() {
        const previewText = document.getElementById('previewText');
        const metadataInfo = document.getElementById('metadataInfo');
        
        let allContent = '';
        let allMetadata = [];
        
        for (const file of this.selectedFiles) {
            try {
                const content = await this.extractFileContent(file);
                allContent += `\\n\\n=== ${file.name} ===\\n\\n${content}`;
                
                allMetadata.push({
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    type: file.type || 'Unknown',
                    lastModified: new Date(file.lastModified).toLocaleString()
                });
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                allContent += `\\n\\n=== ${file.name} ===\\n\\nError reading file: ${error.message}`;
            }
        }
        
        previewText.innerHTML = `<pre>${this.escapeHtml(allContent.substring(0, 5000))}${allContent.length > 5000 ? '\\n\\n... (content truncated)' : ''}</pre>`;
        
        metadataInfo.innerHTML = allMetadata.map(meta => `
            <div class="metadata-item">
                <h4><i class="fas fa-file"></i> ${meta.name}</h4>
                <p><strong>Size:</strong> ${meta.size}</p>
                <p><strong>Type:</strong> ${meta.type}</p>
                <p><strong>Modified:</strong> ${meta.lastModified}</p>
            </div>
        `).join('');
    }

    async previewSampleFiles() {
        const previewText = document.getElementById('previewText');
        const metadataInfo = document.getElementById('metadataInfo');
        
        try {
            const response = await fetch('/api/preview-samples');
            const data = await response.json();
            
            if (data.success) {
                previewText.innerHTML = `<pre>${this.escapeHtml(data.content.substring(0, 5000))}${data.content.length > 5000 ? '\\n\\n... (content truncated)' : ''}</pre>`;
                
                metadataInfo.innerHTML = data.metadata.map(meta => `
                    <div class="metadata-item">
                        <h4><i class="fas fa-file-pdf"></i> ${meta.name}</h4>
                        <p><strong>Size:</strong> ${meta.size}</p>
                        <p><strong>Pages:</strong> ${meta.pages || 'Unknown'}</p>
                        <p><strong>Modified:</strong> ${meta.lastModified}</p>
                    </div>
                `).join('');
            } else {
                throw new Error(data.message || 'Failed to load sample files');
            }
        } catch (error) {
            previewText.innerHTML = `<div class="error">Failed to load sample files: ${error.message}</div>`;
            metadataInfo.innerHTML = '<div class="error">No metadata available</div>';
        }
    }

    async extractFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                        resolve(e.target.result);
                    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                        resolve('PDF content preview not available in browser. Content will be extracted on server.');
                    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                        resolve('Word document content preview not available in browser. Content will be extracted on server.');
                    } else {
                        resolve('File content preview not available for this format.');
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Notification styles (add to CSS)
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 15px 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        z-index: 10000;
        transform: translateX(400px);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        font-weight: 600;
        color: #2c3e50;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        border-left: 4px solid #4ecdc4;
    }
    
    .notification.warning {
        border-left: 4px solid #f39c12;
    }
    
    .notification.error {
        border-left: 4px solid #e74c3c;
    }
    
    .notification.info {
        border-left: 4px solid #667eea;
    }
    
    .notification i {
        font-size: 1.2rem;
    }
    
    .notification.success i {
        color: #4ecdc4;
    }
    
    .notification.warning i {
        color: #f39c12;
    }
    
    .notification.error i {
        color: #e74c3c;
    }
    
    .notification.info i {
        color: #667eea;
    }
`;

// Add notification styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize file selector
let fileSelector;
document.addEventListener('DOMContentLoaded', () => {
    fileSelector = new FileSelector();
});
