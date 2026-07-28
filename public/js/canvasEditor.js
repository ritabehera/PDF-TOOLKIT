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
    showToast('Canvas annotations cleared.', 'info');
  });

  document.getElementById('saveCanvasBtn')?.addEventListener('click', async () => {
    const pdfCanvas = document.getElementById('pdfRenderCanvas');
    const drawCanvas = document.getElementById('annotationCanvas');

    if (!pdfCanvas || pdfCanvas.style.display === 'none') {
      showToast('Please open a PDF file first.', 'warning');
      return;
    }

    showToast('Exporting annotated PDF document...', 'info');

    // Create offscreen merged canvas
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = pdfCanvas.width;
    combinedCanvas.height = pdfCanvas.height;
    const cCtx = combinedCanvas.getContext('2d');

    // Draw PDF page base & draw annotations layer on top
    cCtx.drawImage(pdfCanvas, 0, 0);
    cCtx.drawImage(drawCanvas, 0, 0);

    combinedCanvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('Failed to export canvas image.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('files', blob, 'annotated_page.png');

      try {
        const res = await fetch('/api/convert/images-to-pdf', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.result && data.result.url) {
          showToast('Annotated PDF exported successfully! Downloading...', 'success');
          
          // Trigger actual browser file download
          const link = document.createElement('a');
          link.href = data.result.url;
          link.download = data.result.filename || 'annotated_document.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          showToast(data.error || 'Failed to export PDF file.', 'error');
        }
      } catch (err) {
        showToast('Failed to export PDF document.', 'error');
      }
    }, 'image/png');
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
  const drawCanvas = document.getElementById('annotationCanvas');
  if (sigCanvas && drawCanvas) {
    const ctx = drawCanvas.getContext('2d');
    const x = Math.max(20, (drawCanvas.width - sigCanvas.width) / 2);
    const y = Math.max(20, (drawCanvas.height - sigCanvas.height) / 2);
    ctx.drawImage(sigCanvas, x, y);
  }
  closeSignatureModal();
  showToast('Digital signature stamped onto document page!', 'success');
}
