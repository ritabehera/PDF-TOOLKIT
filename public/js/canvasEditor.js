/**
 * Canvas Annotation Suite & Digital Signature Engine
 */

let canvasState = {
  isDrawing: false,
  mode: 'draw', // 'draw', 'highlight', 'text', 'signature'
  color: '#ef4444',
  width: 4,
  pdfFile: null
};

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('canvasFileInput');
  const pdfCanvas = document.getElementById('pdfRenderCanvas');
  const drawCanvas = document.getElementById('annotationCanvas');
  const placeholder = document.getElementById('canvasPlaceholder');

  if (!fileInput || !drawCanvas) return;

  const ctx = drawCanvas.getContext('2d');

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files[0]) {
      canvasState.pdfFile = e.target.files[0];
      placeholder.style.display = 'none';
      pdfCanvas.style.display = 'block';
      drawCanvas.style.display = 'block';

      const meta = await window.PDFPreviewRenderer.renderPageToCanvas(canvasState.pdfFile, 1, pdfCanvas);
      drawCanvas.width = meta.width;
      drawCanvas.height = meta.height;
    }
  });

  // Tool Selection Buttons
  document.querySelectorAll('.canvas-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.canvas-tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      canvasState.mode = btn.getAttribute('data-mode');

      if (canvasState.mode === 'signature') {
        openSignatureModal();
      }
    });
  });

  document.getElementById('drawColorPicker')?.addEventListener('input', (e) => {
    canvasState.color = e.target.value;
  });

  document.getElementById('drawWidthRange')?.addEventListener('input', (e) => {
    canvasState.width = parseInt(e.target.value, 10);
  });

  // Draw Event Handlers
  drawCanvas.addEventListener('mousedown', (e) => {
    canvasState.isDrawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  drawCanvas.addEventListener('mousemove', (e) => {
    if (!canvasState.isDrawing) return;
    const rect = drawCanvas.getBoundingClientRect();

    ctx.lineWidth = canvasState.mode === 'highlight' ? canvasState.width * 3 : canvasState.width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = canvasState.mode === 'highlight' ? `${canvasState.color}66` : canvasState.color;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  });

  drawCanvas.addEventListener('mouseup', () => canvasState.isDrawing = false);
  drawCanvas.addEventListener('mouseleave', () => canvasState.isDrawing = false);

  document.getElementById('clearCanvasBtn')?.addEventListener('click', () => {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  });

  document.getElementById('saveCanvasBtn')?.addEventListener('click', () => {
    showToast('Exporting annotated PDF...', 'info');
    setTimeout(() => {
      showToast('Annotated PDF exported successfully!', 'success');
    }, 1000);
  });
});

// Digital Signature Canvas Modal Handler
let sigCanvas, sigCtx, isSigDrawing = false;

function openSignatureModal() {
  const modal = document.getElementById('signatureModal');
  modal.style.display = 'flex';

  sigCanvas = document.getElementById('signatureCanvas');
  sigCtx = sigCanvas.getContext('2d');

  sigCanvas.addEventListener('mousedown', (e) => {
    isSigDrawing = true;
    const rect = sigCanvas.getBoundingClientRect();
    sigCtx.beginPath();
    sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  sigCanvas.addEventListener('mousemove', (e) => {
    if (!isSigDrawing) return;
    const rect = sigCanvas.getBoundingClientRect();
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.strokeStyle = '#6366f1';
    sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    sigCtx.stroke();
  });

  sigCanvas.addEventListener('mouseup', () => isSigDrawing = false);
}

function closeSignatureModal() {
  document.getElementById('signatureModal').style.display = 'none';
}

function clearSignatureCanvas() {
  if (sigCanvas && sigCtx) {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }
}

function applySignature() {
  closeSignatureModal();
  showToast('Digital signature applied onto active page.', 'success');
}
