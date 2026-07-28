/**
 * PDF AI Toolkit - Core Application & Tool Manager
 */

// Global State
const appState = {
  currentTool: 'dashboard',
  selectedFiles: [],
  theme: localStorage.getItem('pdf_theme') || 'dark',
  user: { name: 'Guest User', role: 'guest' }
};

// Custom Cursor Effects
document.addEventListener('mousemove', (e) => {
  const dot = document.getElementById('cursorDot');
  const outline = document.getElementById('cursorOutline');
  if (dot && outline) {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    outline.style.left = `${e.clientX}px`;
    outline.style.top = `${e.clientY}px`;
  }
});

// Toast Notification Manager
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Tool Metadata & Options Mapping
const toolRegistry = {
  merge: {
    name: 'Merge PDF',
    badge: 'Basic Tool',
    desc: 'Upload two or more PDF files to combine them into one seamless document.',
    endpoint: '/api/pdf/merge',
    multiple: true,
    renderOptions: () => '<p class="text-muted">Files will be merged in the order listed above. Drag items to reorder.</p>'
  },
  split: {
    name: 'Split PDF',
    badge: 'Basic Tool',
    desc: 'Extract specific page numbers or ranges (e.g. 1-3, 5, 8-10).',
    endpoint: '/api/pdf/split',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Page Range to Extract:</label>
        <input type="text" id="splitPagesInput" placeholder="e.g. 1-3, 5, 7" class="form-control" value="1-2">
      </div>`
  },
  rotate: {
    name: 'Rotate PDF',
    badge: 'Basic Tool',
    desc: 'Rotate all pages in your document clockwise.',
    endpoint: '/api/pdf/rotate',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Rotation Angle:</label>
        <select id="rotateDegreesSelect" class="form-control">
          <option value="90">90° Clockwise</option>
          <option value="180">180° Flip</option>
          <option value="270">270° Counter-Clockwise</option>
        </select>
      </div>`
  },
  compress: {
    name: 'Compress PDF',
    badge: 'Basic Tool',
    desc: 'Select Target Size Range (e.g. 1-100 KB, 100-200 KB) and specific page selection.',
    endpoint: '/api/pdf/compress',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label><i class="fa-solid fa-sliders"></i> Target File Size Range (Select KB Range):</label>
        <select id="compressRangePresetSelect" class="form-control" onchange="onCompressRangePresetChange(this.value)">
          <option value="1-100" selected>1 KB to 100 KB (Extreme Compression)</option>
          <option value="100-200">100 KB to 200 KB (High Compression)</option>
          <option value="200-500">200 KB to 500 KB (Medium Compression)</option>
          <option value="500-1000">500 KB to 1 MB (Standard Compression)</option>
          <option value="custom">Custom KB Range (User Input)</option>
        </select>
      </div>

      <div class="form-group mt-2" id="customKBRangeBox">
        <label>Selected Target Limit (Min KB to Max KB):</label>
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
          <input type="number" id="compressMinKBInput" class="form-control" placeholder="Min KB" value="1" style="flex:1;">
          <span style="color:var(--text-muted);">to</span>
          <input type="number" id="compressMaxKBInput" class="form-control" placeholder="Max KB" value="100" style="flex:1;">
          <span style="color:var(--text-muted); font-size:0.85rem;">KB</span>
        </div>
      </div>

      <div class="form-group mt-2">
        <label>Compression Level:</label>
        <select id="compressLevelSelect" class="form-control">
          <option value="recommended" selected>Recommended Compression (Balanced Quality & Size)</option>
          <option value="extreme">Extreme Compression (Smallest File Size)</option>
          <option value="low">Low Compression (Highest Quality)</option>
        </select>
      </div>

      <div class="form-group mt-2">
        <label>Page Range to Compress:</label>
        <input type="text" id="compressPagesInput" class="form-control" placeholder="e.g. 1-5 or all" value="all">
      </div>`
  },
  watermark: {
    name: 'Watermark PDF',
    badge: 'Basic Tool',
    desc: 'Stamp custom text or confidential overlays onto every page.',
    endpoint: '/api/pdf/watermark',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Watermark Text:</label>
        <input type="text" id="watermarkTextInput" class="form-control" value="CONFIDENTIAL">
      </div>`
  },
  organize: {
    name: 'Organize Pages',
    badge: 'Basic Tool',
    desc: 'Delete unwanted pages or duplicate specific pages.',
    endpoint: '/api/pdf/organize',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Action:</label>
        <select id="organizeActionSelect" class="form-control">
          <option value="delete">Delete Pages</option>
          <option value="duplicate">Duplicate Page</option>
        </select>
      </div>
      <div class="form-group mt-2">
        <label>Target Page(s):</label>
        <input type="text" id="organizePagesInput" class="form-control" placeholder="e.g. 1 (for page number)" value="1">
      </div>`
  },
  security: {
    name: 'Lock & Encrypt PDF',
    badge: 'Security',
    desc: 'Add password protection to secure your PDF from unauthorized viewing.',
    endpoint: '/api/pdf/encrypt',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Set Password:</label>
        <input type="password" id="encryptPasswordInput" class="form-control" placeholder="Enter security password" value="123456">
      </div>`
  },
  'ai-summary': {
    name: 'AI PDF Summary',
    badge: 'AI Feature',
    desc: 'Generate instant sentence summaries, reading time estimates, and top key points.',
    endpoint: '/api/ai/summarize',
    multiple: false,
    renderOptions: () => '<p class="text-muted">AI engine will extract key sentence structures and calculate topic weights.</p>'
  },
  'ai-explain': {
    name: 'AI Explain PDF',
    badge: 'AI Feature',
    desc: 'Break down complex documents into simplified explanations.',
    endpoint: '/api/ai/explain',
    multiple: false,
    renderOptions: () => '<p class="text-muted">Simplifies terminology and creates overview bullet points.</p>'
  },
  'ai-quiz': {
    name: 'AI Flashcards & Quiz Generator',
    badge: 'AI Feature',
    desc: 'Automatically build study flashcards and interactive quiz questions from document text.',
    endpoint: '/api/ai/flashcards',
    multiple: false,
    renderOptions: () => '<p class="text-muted">Creates Q&A flashcards and multiple-choice quiz questions.</p>'
  },
  'ai-analyzer': {
    name: 'AI Document Analyzer',
    badge: 'AI Feature',
    desc: 'Detect Resumes, Invoices, or Contracts and extract key structured metrics.',
    endpoint: '/api/ai/analyze',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Document Category:</label>
        <select id="analyzerTypeSelect" class="form-control">
          <option value="auto">Auto-Detect</option>
          <option value="resume">Resume / CV</option>
          <option value="invoice">Invoice / Receipt</option>
          <option value="contract">Legal Contract</option>
        </select>
      </div>`
  },
  ocr: {
    name: 'OCR Image to Text',
    badge: 'OCR Engine',
    desc: 'Extract text from scanned images and create a searchable PDF.',
    endpoint: '/api/ocr/searchable-pdf',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>OCR Language:</label>
        <select id="ocrLangSelect" class="form-control">
          <option value="eng">English</option>
          <option value="spa">Spanish</option>
          <option value="fra">French</option>
          <option value="deu">German</option>
        </select>
      </div>`
  },
  convert: {
    name: 'PDF Format Converter',
    badge: 'Conversion',
    desc: 'Convert Images to PDF, or PDF to Text / HTML formats.',
    endpoint: '/api/convert/images-to-pdf',
    multiple: true,
    renderOptions: () => `
      <div class="form-group">
        <label>Conversion Mode:</label>
        <select id="convertModeSelect" class="form-control" onchange="updateConvertEndpoint(this.value)">
          <option value="img2pdf">JPG/PNG Images to PDF</option>
          <option value="pdf2txt">PDF to Text (.txt)</option>
          <option value="pdf2html">PDF to HTML Web Page</option>
        </select>
      </div>`
  },
  'lock-pdf': {
    name: 'Lock PDF',
    badge: 'Security',
    desc: 'Encrypt your PDF document with strong password protection.',
    endpoint: '/api/pdf/encrypt',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Set Password:</label>
        <input type="password" id="encryptPasswordInput" class="form-control" placeholder="Enter password to lock PDF" value="123456">
      </div>`
  },
  'unlock-pdf': {
    name: 'Unlock PDF',
    badge: 'Security',
    desc: 'Remove password security from an encrypted PDF document.',
    endpoint: '/api/pdf/decrypt',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>PDF Password:</label>
        <input type="password" id="decryptPasswordInput" class="form-control" placeholder="Enter current password" value="123456">
      </div>`
  },
  'page-numbers': {
    name: 'Add Page Numbers & Header',
    badge: 'Basic Tool',
    desc: 'Add custom header text, footer, and automatic page numbering.',
    endpoint: '/api/pdf/header-footer',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Header Text:</label>
        <input type="text" id="headerTextInput" class="form-control" placeholder="e.g. Confidential Document" value="PDF AI Toolkit">
      </div>
      <div class="form-group mt-2">
        <label>Footer Text:</label>
        <input type="text" id="footerTextInput" class="form-control" placeholder="e.g. All Rights Reserved" value="All Rights Reserved">
      </div>`
  },
  'delete-pages': {
    name: 'Delete Pages',
    badge: 'Basic Tool',
    desc: 'Select specific page numbers to remove from your document.',
    endpoint: '/api/pdf/organize',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Page Number to Delete:</label>
        <input type="number" id="deletePageNumInput" class="form-control" min="1" value="1">
      </div>`
  },
  'extract-pages': {
    name: 'Extract Pages',
    badge: 'Basic Tool',
    desc: 'Extract specific pages into a new standalone PDF document.',
    endpoint: '/api/pdf/split',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>Pages to Extract (e.g. 1-3, 5):</label>
        <input type="text" id="extractPagesInput" class="form-control" value="1-2">
      </div>`
  },
  'pdf-to-text': {
    name: 'PDF to Text',
    badge: 'Conversion',
    desc: 'Extract all raw text content from a PDF into a clean .txt file.',
    endpoint: '/api/convert/pdf-to-text',
    multiple: false,
    renderOptions: () => '<p class="text-muted">Extracts structured raw text content from document pages.</p>'
  },
  'html-to-pdf': {
    name: 'HTML / Text to PDF',
    badge: 'Conversion',
    desc: 'Convert formatted text or HTML code directly into a formatted PDF document.',
    endpoint: '/api/convert/text-to-pdf',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>HTML or Text Content:</label>
        <textarea id="htmlTextInput" class="form-control" rows="5" placeholder="Enter HTML or text content here..."><h1>Sample HTML Title</h1><p>This is a converted PDF page generated from raw HTML text.</p></textarea>
      </div>`
  },
  'qr-code': {
    name: 'Add QR Code to PDF',
    badge: 'Tool',
    desc: 'Generate and stamp a QR Code onto all pages of your PDF document.',
    endpoint: '/api/pdf/qrcode',
    multiple: false,
    renderOptions: () => `
      <div class="form-group">
        <label>QR Code Content / URL:</label>
        <input type="text" id="qrTextInput" class="form-control" value="https://pdftoolkit.ai">
      </div>`
  }
};

// Switch Tool Navigation
function switchTool(toolKey) {
  appState.currentTool = toolKey;
  appState.selectedFiles = [];
  updateFileListUI();

  // Hide all view panels
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));

  // Update navigation styling
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tool') === toolKey);
  });

  if (toolKey === 'dashboard') {
    document.getElementById('view-dashboard').classList.add('active');
    document.getElementById('activeToolTitle').textContent = 'Dashboard';
    document.getElementById('activeToolBadge').innerHTML = '<i class="fa-solid fa-sparkles"></i> Overview';
    loadMetrics();
    return;
  }

  if (toolKey === 'ai-chat') {
    document.getElementById('view-ai-chat').classList.add('active');
    document.getElementById('activeToolTitle').textContent = 'AI Chat with PDF';
    document.getElementById('activeToolBadge').innerHTML = '<i class="fa-solid fa-brain"></i> Interactive AI';
    return;
  }

  if (toolKey === 'canvas-editor') {
    document.getElementById('view-canvas-editor').classList.add('active');
    document.getElementById('activeToolTitle').textContent = 'Draw & Digital Sign Canvas';
    document.getElementById('activeToolBadge').innerHTML = '<i class="fa-solid fa-pen-nib"></i> Editor';
    return;
  }

  if (toolKey === 'history') {
    document.getElementById('view-history').classList.add('active');
    document.getElementById('activeToolTitle').textContent = 'Processing History';
    document.getElementById('activeToolBadge').innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Activity';
    loadHistory();
    return;
  }

  if (toolKey === 'admin') {
    document.getElementById('view-admin').classList.add('active');
    document.getElementById('activeToolTitle').textContent = 'Admin Diagnostics';
    document.getElementById('activeToolBadge').innerHTML = '<i class="fa-solid fa-user-shield"></i> Metrics';
    loadAdminMetrics();
    return;
  }

  // Generic Tool Workspace
  const toolMeta = toolRegistry[toolKey];
  if (toolMeta) {
    document.getElementById('view-tool-workspace').classList.add('active');
    document.getElementById('activeToolTitle').textContent = toolMeta.name;
    document.getElementById('activeToolBadge').textContent = toolMeta.badge;
    document.getElementById('activeToolName').textContent = toolMeta.name;
    document.getElementById('activeToolDesc').textContent = toolMeta.desc;
    document.getElementById('toolOptionsBox').innerHTML = toolMeta.renderOptions();

    document.getElementById('resultBox').style.display = 'none';
    document.getElementById('progressWrapper').style.display = 'none';

    // Set file input multiple mode
    const fileInput = document.getElementById('fileInput');
    fileInput.multiple = toolMeta.multiple;
  }
}

// Convert Endpoint Dynamic Updater
function updateConvertEndpoint(mode) {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput) return;
  
  // Clear file selection on mode change to prevent cross-format error
  appState.selectedFiles = [];
  updateFileListUI();

  if (mode === 'img2pdf') {
    toolRegistry.convert.endpoint = '/api/convert/images-to-pdf';
    fileInput.multiple = true;
    fileInput.accept = '.png,.jpg,.jpeg,.webp,.pdf';
  } else if (mode === 'pdf2txt') {
    toolRegistry.convert.endpoint = '/api/convert/pdf-to-text';
    fileInput.multiple = false;
    fileInput.accept = '.pdf';
  } else if (mode === 'pdf2html') {
    toolRegistry.convert.endpoint = '/api/convert/pdf-to-html';
    fileInput.multiple = false;
    fileInput.accept = '.pdf';
  }
}

// Drag and Drop Upload Setup
function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFiles(Array.from(fileInput.files));
    }
  });
}

function handleFiles(files) {
  const currentToolMeta = toolRegistry[appState.currentTool];
  if (!currentToolMeta.multiple) {
    appState.selectedFiles = [files[0]];
  } else {
    appState.selectedFiles = [...appState.selectedFiles, ...files];
  }
  updateFileListUI();
}

function updateFileListUI() {
  const listContainer = document.getElementById('selectedFilesList');
  const processBtn = document.getElementById('processBtn');

  if (!listContainer || !processBtn) return;

  listContainer.innerHTML = '';

  if (appState.selectedFiles.length === 0) {
    processBtn.disabled = true;
    return;
  }

  processBtn.disabled = false;

  appState.selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <div class="file-item-left">
        <i class="fa-solid fa-file-pdf file-item-icon"></i>
        <div class="file-item-details">
          <h5>${file.name}</h5>
          <span>${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>
      <button class="icon-btn" onclick="removeSelectedFile(${index})">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    listContainer.appendChild(item);
  });

  // Render visual page thumbnail selector if page-based tool
  let visualThumbContainer = document.getElementById('visualPageSelectorContainer');
  if (!visualThumbContainer) {
    visualThumbContainer = document.createElement('div');
    visualThumbContainer.id = 'visualPageSelectorContainer';
    listContainer.after(visualThumbContainer);
  }
  visualThumbContainer.innerHTML = '';

  const pageTools = ['compress', 'split', 'extract-pages', 'delete-pages', 'organize'];
  if (pageTools.includes(appState.currentTool) && appState.selectedFiles.length > 0) {
    const firstFile = appState.selectedFiles[0];
    if (firstFile.name.toLowerCase().endsWith('.pdf') && window.PDFPreviewRenderer) {
      window.PDFPreviewRenderer.renderPageThumbnails(firstFile, visualThumbContainer, (rangeStr) => {
        const compressInput = document.getElementById('compressPagesInput');
        const extractInput = document.getElementById('extractPagesInput');
        const splitInput = document.getElementById('splitPagesInput');
        const deleteInput = document.getElementById('deletePageNumInput');

        if (compressInput) compressInput.value = rangeStr || 'all';
        if (extractInput) extractInput.value = rangeStr || '1-2';
        if (splitInput) splitInput.value = rangeStr || 'all';
        if (deleteInput && rangeStr) deleteInput.value = rangeStr.split(',')[0].trim() || '1';
      });
    }
  }
}

function removeSelectedFile(index) {
  appState.selectedFiles.splice(index, 1);
  updateFileListUI();
}

function setCompressKBRange(min, max) {
  const minInput = document.getElementById('compressMinKBInput');
  const maxInput = document.getElementById('compressMaxKBInput');
  if (minInput) minInput.value = min;
  if (maxInput) maxInput.value = max;
}

function onCompressRangePresetChange(val) {
  const minInput = document.getElementById('compressMinKBInput');
  const maxInput = document.getElementById('compressMaxKBInput');
  if (!minInput || !maxInput) return;

  if (val === '1-100') {
    minInput.value = 1;
    maxInput.value = 100;
  } else if (val === '100-200') {
    minInput.value = 100;
    maxInput.value = 200;
  } else if (val === '200-500') {
    minInput.value = 200;
    maxInput.value = 500;
  } else if (val === '500-1000') {
    minInput.value = 500;
    maxInput.value = 1000;
  }
}

// Process Document Execution Handler
async function executeToolProcess() {
  const toolMeta = toolRegistry[appState.currentTool];
  if (!toolMeta || appState.selectedFiles.length === 0) return;

  const processBtn = document.getElementById('processBtn');
  const progressWrapper = document.getElementById('progressWrapper');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercent = document.getElementById('progressPercent');
  const resultBox = document.getElementById('resultBox');
  const resultContent = document.getElementById('resultContent');

  processBtn.disabled = true;
  progressWrapper.style.display = 'block';
  resultBox.style.display = 'none';

  let progress = 10;
  progressBarFill.style.width = `${progress}%`;
  progressPercent.textContent = `${progress}%`;

  const interval = setInterval(() => {
    if (progress < 85) {
      progress += Math.floor(Math.random() * 10) + 5;
      progressBarFill.style.width = `${progress}%`;
      progressPercent.textContent = `${progress}%`;
    }
  }, 250);

  const formData = new FormData();
  if (toolMeta.multiple) {
    appState.selectedFiles.forEach(file => formData.append('files', file));
  } else {
    formData.append('file', appState.selectedFiles[0]);
  }

  // Gather Tool Options
  if (appState.currentTool === 'compress') {
    const levelSelect = document.getElementById('compressLevelSelect');
    const pagesInput = document.getElementById('compressPagesInput');
    const minInput = document.getElementById('compressMinKBInput');
    const maxInput = document.getElementById('compressMaxKBInput');

    if (levelSelect) formData.append('level', levelSelect.value);
    if (pagesInput) formData.append('pages', pagesInput.value);
    if (minInput) formData.append('minKB', minInput.value);
    if (maxInput) formData.append('maxKB', maxInput.value);
  } else if (appState.currentTool === 'split' || appState.currentTool === 'extract-pages') {
    const input = document.getElementById('extractPagesInput') || document.getElementById('splitPagesInput');
    formData.append('pages', input ? input.value : '1-2');
  } else if (appState.currentTool === 'rotate') {
    formData.append('degrees', document.getElementById('rotateDegreesSelect').value);
  } else if (appState.currentTool === 'watermark') {
    formData.append('text', document.getElementById('watermarkTextInput').value);
  } else if (appState.currentTool === 'organize') {
    formData.append('action', document.getElementById('organizeActionSelect').value);
    formData.append('pagesToDelete', JSON.stringify([parseInt(document.getElementById('organizePagesInput').value, 10)]));
  } else if (appState.currentTool === 'delete-pages') {
    formData.append('action', 'delete');
    formData.append('pagesToDelete', JSON.stringify([parseInt(document.getElementById('deletePageNumInput').value, 10)]));
  } else if (appState.currentTool === 'security' || appState.currentTool === 'lock-pdf') {
    formData.append('password', document.getElementById('encryptPasswordInput').value);
  } else if (appState.currentTool === 'unlock-pdf') {
    formData.append('password', document.getElementById('decryptPasswordInput').value);
  } else if (appState.currentTool === 'page-numbers') {
    formData.append('headerText', document.getElementById('headerTextInput').value);
    formData.append('footerText', document.getElementById('footerTextInput').value);
    formData.append('includePageNumbers', 'true');
  } else if (appState.currentTool === 'html-to-pdf') {
    formData.append('text', document.getElementById('htmlTextInput').value);
  } else if (appState.currentTool === 'qr-code') {
    formData.append('qrText', document.getElementById('qrTextInput').value);
  } else if (appState.currentTool === 'ai-analyzer') {
    formData.append('docType', document.getElementById('analyzerTypeSelect').value);
  } else if (appState.currentTool === 'ocr') {
    formData.append('language', document.getElementById('ocrLangSelect').value);
  }

  try {
    const res = await fetch(toolMeta.endpoint, {
      method: 'POST',
      body: formData
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { error: `Server error (${res.status} ${res.statusText})` };
    }

    clearInterval(interval);
    progressBarFill.style.width = '100%';
    progressPercent.textContent = '100%';

    setTimeout(() => {
      progressWrapper.style.display = 'none';
      processBtn.disabled = false;

      if (!res.ok || data.error) {
        showToast(data.error || `Server error (${res.status})`, 'error');
      } else {
        showToast('Document processed successfully!', 'success');
        renderResult(data);
      }
    }, 400);

  } catch (err) {
    console.error('API execution error:', err);
    clearInterval(interval);
    progressWrapper.style.display = 'none';
    processBtn.disabled = false;
    showToast('Failed to connect to server. Please ensure local server is running.', 'error');
  }
}

// Render Result UI Output
function renderResult(data) {
  const resultBox = document.getElementById('resultBox');
  const resultContent = document.getElementById('resultContent');
  resultBox.style.display = 'block';

  const res = data.result || data;

  if (res.url) {
    let extraMetrics = '';
    if (res.originalSize && res.newSize) {
      extraMetrics = `
        <div style="display:flex; gap:12px; margin: 12px 0; flex-wrap:wrap;">
          <span class="badge badge-ai">Original Size: ${(res.originalSize / (1024 * 1024)).toFixed(2)} MB</span>
          <span class="badge badge-ai" style="background:rgba(16, 185, 129, 0.2); color:#10b981;">New Size: ${(res.newSize / (1024 * 1024)).toFixed(2)} MB</span>
          <span class="badge badge-ai">Savings: ${res.savingsPercent || 0}%</span>
          ${res.pageCount ? `<span class="badge badge-ai">Pages: ${res.pageCount}</span>` : ''}
        </div>
      `;
    }

    resultContent.innerHTML = `
      <p>Your processed file is ready for download:</p>
      ${extraMetrics}
      <div style="margin-top: 12px;">
        <a href="${res.url}" download="${res.filename}" class="btn btn-primary btn-glow">
          <i class="fa-solid fa-download"></i> Download ${res.filename}
        </a>
      </div>
    `;
  } else if (res.summary) {
    // AI Summary Output
    resultContent.innerHTML = `
      <div class="ai-summary-output">
        <h4><i class="fa-solid fa-sparkles"></i> Executive Summary</h4>
        <p style="margin: 10px 0; line-height: 1.6;">${res.summary}</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <span class="badge badge-ai">Reading Time: ${res.readingTime}</span>
          <span class="badge badge-ai">Pages: ${res.pageCount}</span>
        </div>
      </div>
    `;
  } else if (res.flashcards) {
    // AI Quiz & Flashcards Output
    const cardHtml = res.flashcards.map(fc => `
      <div style="background:var(--bg-secondary); padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid var(--glass-border);">
        <strong>Q: ${fc.question}</strong>
        <p style="margin-top:4px; color:var(--text-muted);">A: ${fc.answer}</p>
      </div>
    `).join('');

    resultContent.innerHTML = `
      <div>
        <h4><i class="fa-solid fa-graduation-cap"></i> AI Flashcards Generated</h4>
        <div style="margin-top:12px;">${cardHtml}</div>
      </div>
    `;
  } else {
    resultContent.innerHTML = `<pre style="background:var(--bg-secondary); padding:12px; border-radius:8px;">${JSON.stringify(res, null, 2)}</pre>`;
  }
}

// Metrics Loader
async function loadMetrics() {
  try {
    const res = await fetch('/api/dashboard/metrics');
    const data = await res.json();
    if (data.metrics) {
      document.getElementById('statTotalFiles').textContent = data.metrics.totalFilesProcessed;
      document.getElementById('statAiOps').textContent = data.metrics.totalAiOps;
    }
  } catch (err) {
    console.warn('Failed to load metrics:', err.message);
  }
}

// History Loader
async function loadHistory() {
  const tbody = document.getElementById('historyTableBody');
  try {
    const res = await fetch('/api/dashboard/metrics');
    const data = await res.json();
    if (data.recentHistory && data.recentHistory.length > 0) {
      tbody.innerHTML = data.recentHistory.map(h => `
        <tr>
          <td>${new Date(h.timestamp).toLocaleTimeString()}</td>
          <td><span class="badge badge-ai">${h.toolName}</span></td>
          <td>${h.fileName || 'document.pdf'}</td>
          <td>${h.fileSize ? (h.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}</td>
          <td><span style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> ${h.status}</span></td>
          <td>${h.downloadUrl !== '#' ? `<a href="${h.downloadUrl}" download style="color:var(--accent-primary);">Download</a>` : '-'}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No processing history recorded yet.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading history.</td></tr>';
  }
}

// Admin Loader
async function loadAdminMetrics() {
  try {
    const res = await fetch('/api/dashboard/metrics');
    const data = await res.json();
    document.getElementById('adminActiveStorage').textContent = `${data.metrics.activeStorageMB} MB`;
    document.getElementById('adminUserCount').textContent = data.metrics.totalUsers;

    const list = document.getElementById('toolStatsList');
    if (data.toolStats && Object.keys(data.toolStats).length > 0) {
      list.innerHTML = Object.entries(data.toolStats).map(([tool, count]) => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--glass-border);">
          <span>${tool}</span>
          <strong>${count} operations</strong>
        </div>
      `).join('');
    }
  } catch (err) {
    console.warn('Failed to load admin stats:', err);
  }
}

// Theme Toggle Handler
function initThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeIcon');

  btn.addEventListener('click', () => {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', appState.theme);
    localStorage.setItem('pdf_theme', appState.theme);

    if (appState.theme === 'light') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  });
}

// Initialize Application Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initDropzone();
  initThemeToggle();

  // Navigation Click Listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tool = item.getAttribute('data-tool');
      switchTool(tool);
    });
  });

  // Mobile Sidebar Toggle
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  const sidebar = document.getElementById('sidebar');
  const closeBtn = document.getElementById('closeSidebarBtn');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => sidebar.classList.remove('mobile-open'));
  }

  // Process Button Click
  const processBtn = document.getElementById('processBtn');
  if (processBtn) {
    processBtn.addEventListener('click', executeToolProcess);
  }

  // Initial Data Load
  loadMetrics();
});
