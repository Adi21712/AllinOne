// Import converter modules
import { pdfToWord } from './converters/pdfToWord.js';
import { wordToPdf } from './converters/wordToPdf.js';
import { imageToPdf } from './converters/imageToPdf.js';
import { compressImage } from './converters/imageCompress.js';
import { showToast } from './utils.js';

// DOM Elements
const toolButtons = document.querySelectorAll('.tool-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.querySelector('.modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.querySelector('.modal-close');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const convertBtn = document.getElementById('convert-btn');
const cancelBtn = document.getElementById('cancel-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const toolOptions = document.getElementById('tool-options');

// State
let currentTool = null;
let files = [];
let options = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Initialize tool buttons
    toolButtons.forEach(button => {
        button.addEventListener('click', () => openToolModal(button.dataset.tool));
    });
    
    // Initialize modal close button
    modalClose.addEventListener('click', closeModal);
    
    // Initialize dropzone
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    // Initialize file input
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });
    
    // Initialize convert button
    convertBtn.addEventListener('click', startConversion);
    
    // Initialize cancel button
    cancelBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
});

// Open tool modal
function openToolModal(tool) {
    currentTool = tool;
    files = [];
    options = {};
    
    // Update modal title based on tool
    const toolNames = {
        'pdf-to-word': 'PDF to Word',
        'word-to-pdf': 'Word to PDF',
        'image-to-pdf': 'Image to PDF',
        'image-compressor': 'Image Compressor'
    };
    
    modalTitle.textContent = toolNames[tool] || 'Convert Files';
    
    // Update modal content based on tool
    updateToolOptions();
    renderFileList();
    
    // Show modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset file input
    fileInput.value = '';
}

// Update tool options based on current tool
function updateToolOptions() {
    toolOptions.innerHTML = '';
    
    switch (currentTool) {
        case 'pdf-to-word':
            toolOptions.innerHTML = `
                <div class="option-group">
                    <label class="option-label">Output Format</label>
                    <select class="option-select" id="output-format">
                        <option value="docx">DOCX (Microsoft Word)</option>
                        <option value="odt">ODT (OpenDocument Text)</option>
                    </select>
                </div>
            `;
            break;
            
        case 'word-to-pdf':
            toolOptions.innerHTML = `
                <div class="option-group">
                    <label class="option-label">PDF Quality</label>
                    <select class="option-select" id="pdf-quality">
                        <option value="high">High Quality</option>
                        <option value="medium" selected>Medium Quality</option>
                        <option value="low">Low Quality</option>
                    </select>
                </div>
            `;
            break;
            
        case 'image-to-pdf':
            toolOptions.innerHTML = `
                <div class="option-group">
                    <label class="option-label">Page Size</label>
                    <select class="option-select" id="page-size">
                        <option value="a4">A4</option>
                        <option value="letter" selected>Letter</option>
                        <option value="a5">A5</option>
                        <option value="auto">Auto (Image Size)</option>
                    </select>
                </div>
                <div class="option-group">
                    <label class="option-label">Orientation</label>
                    <select class="option-select" id="page-orientation">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>
                <div class="option-group">
                    <label class="option-label">
                        <input type="checkbox" id="combine-pages" checked>
                        Combine all images into one PDF
                    </label>
                </div>
            `;
            break;
            
        case 'image-compressor':
            toolOptions.innerHTML = `
                <div class="option-group">
                    <label class="option-label">Compression Level</label>
                    <select class="option-select" id="compression-level">
                        <option value="0.7">High Quality (70%)</option>
                        <option value="0.5" selected>Medium Quality (50%)</option>
                        <option value="0.3">Low Quality (30%)</option>
                    </select>
                </div>
                <div class="option-group">
                    <label class="option-label">Output Format</label>
                    <select class="option-select" id="output-format">
                        <option value="original">Keep Original</option>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>
            `;
            break;
    }
}

// Handle selected/dropped files
function handleFiles(newFiles) {
    // Validate files based on tool
    const validExtensions = getValidExtensions();
    const maxFiles = currentTool === 'image-to-pdf' || currentTool === 'image-compressor' ? 10 : 1;
    
    // Filter and add files
    for (let i = 0; i < newFiles.length && files.length < maxFiles; i++) {
        const file = newFiles[i];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (validExtensions.includes(extension)) {
            files.push(file);
        }
    }
    
    // Show error if no valid files
    if (files.length === 0) {
        showToast('No valid files selected. Please check the file format.', 'error');
        return;
    }
    
    // Show warning if too many files
    if (newFiles.length > maxFiles) {
        showToast(`Only the first ${maxFiles} files will be processed.`, 'warning');
    }
    
    // Update UI
    renderFileList();
    convertBtn.disabled = files.length === 0;
}

// Get valid file extensions based on current tool
function getValidExtensions() {
    switch (currentTool) {
        case 'pdf-to-word': return ['pdf'];
        case 'word-to-pdf': return ['doc', 'docx', 'odt'];
        case 'image-to-pdf': return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        case 'image-compressor': return ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
        default: return [];
    }
}

// Render file list
function renderFileList() {
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<p class="empty-message">No files selected</p>';
        return;
    }
    
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const extension = file.name.split('.').pop().toLowerCase();
        const fileSize = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <svg class="file-icon" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6"/>
            </svg>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${fileSize}</span>
            <button class="file-remove" data-index="${index}">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.file-remove').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            files.splice(index, 1);
            renderFileList();
            convertBtn.disabled = files.length === 0;
        });
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Start conversion process
async function startConversion() {
    if (files.length === 0) return;
    
    // Get options from form
    options = getToolOptions();
    
    // Show progress
    progressContainer.style.display = 'block';
    updateProgress(0);
    
    try {
        let results;
        
        // Call appropriate converter based on current tool
        switch (currentTool) {
            case 'pdf-to-word':
                results = await pdfToWord(files[0], options);
                break;
                
            case 'word-to-pdf':
                results = await wordToPdf(files[0], options);
                break;
                
            case 'image-to-pdf':
                results = await imageToPdf(files, options);
                break;
                
            case 'image-compressor':
                results = await compressImage(files, options);
                break;
        }
        
        // Download results
        if (Array.isArray(results)) {
            results.forEach(result => downloadFile(result));
        } else {
            downloadFile(results);
        }
        
        // Show success message
        showToast('Conversion completed successfully!', 'success');
        
        // Close modal after a delay
        setTimeout(closeModal, 1000);
        
    } catch (error) {
        console.error('Conversion error:', error);
        showToast('Conversion failed. Please try again.', 'error');
    } finally {
        progressContainer.style.display = 'none';
    }
}

// Get tool options from form
function getToolOptions() {
    const options = {};
    
    switch (currentTool) {
        case 'pdf-to-word':
            options.format = document.getElementById('output-format').value;
            break;
            
        case 'word-to-pdf':
            options.quality = document.getElementById('pdf-quality').value;
            break;
            
        case 'image-to-pdf':
            options.pageSize = document.getElementById('page-size').value;
            options.orientation = document.getElementById('page-orientation').value;
            options.combine = document.getElementById('combine-pages').checked;
            break;
            
        case 'image-compressor':
            options.quality = parseFloat(document.getElementById('compression-level').value);
            options.format = document.getElementById('output-format').value;
            break;
    }
    
    return options;
}

// Update progress bar
function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;
}

// Download file
function downloadFile(fileData) {
    const a = document.createElement('a');
    a.href = fileData.url;
    a.download = fileData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Revoke object URL after download
    setTimeout(() => {
        URL.revokeObjectURL(fileData.url);
    }, 100);
}
