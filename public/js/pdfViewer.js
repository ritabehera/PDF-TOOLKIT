/**
 * PDF.js Canvas Preview Renderer
 */

if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

class PDFPreviewRenderer {
  static async renderPageToCanvas(fileOrArrayBuffer, pageNum = 1, canvasElement) {
    if (!pdfjsLib) return;

    let loadingTask;
    if (fileOrArrayBuffer instanceof ArrayBuffer) {
      loadingTask = pdfjsLib.getDocument({ data: fileOrArrayBuffer });
    } else {
      const buffer = await fileOrArrayBuffer.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: buffer });
    }

    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageNum);

    const viewport = page.getViewport({ scale: 1.2 });
    canvasElement.height = viewport.height;
    canvasElement.width = viewport.width;

    const renderContext = {
      canvasContext: canvasElement.getContext('2d'),
      viewport: viewport
    };

    await page.render(renderContext).promise;
    return { width: viewport.width, height: viewport.height, pageCount: pdfDoc.numPages };
  }

  /**
   * Render interactive page thumbnail grid with manual visual page selection
   */
  static async renderPageThumbnails(file, containerElement, onSelectionChange) {
    if (!pdfjsLib || !file) return;

    containerElement.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:10px;"><i class="fa-solid fa-spinner fa-spin"></i> Rendering visual page thumbnails...</div>';

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const numPages = pdfDoc.numPages;

      containerElement.innerHTML = `
        <div class="page-selector-widget" style="margin-top:16px;">
          <div class="page-selector-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <span style="font-weight:600; font-size:0.9rem; color:var(--text-main);"><i class="fa-solid fa-list-check" style="color:var(--accent-primary);"></i> Visual Page Range Selector (${numPages} Pages)</span>
            <div class="btn-group" style="display:flex; gap:6px;">
              <button type="button" class="chip-btn" id="btnSelectAllPages">Select All</button>
              <button type="button" class="chip-btn" id="btnDeselectAllPages">Deselect All</button>
              <button type="button" class="chip-btn" id="btnSelectOddPages">Odd</button>
              <button type="button" class="chip-btn" id="btnSelectEvenPages">Even</button>
            </div>
          </div>
          
          <div class="range-slider-box" style="display:flex; gap:10px; align-items:center; margin-bottom:14px; background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--glass-border);">
            <span style="font-size:0.8rem; color:var(--text-muted);">Custom Range:</span>
            <span style="font-size:0.8rem;">Page</span>
            <input type="number" id="rangeStartInput" min="1" max="${numPages}" value="1" style="width:55px; padding:4px 6px; border-radius:4px; border:1px solid var(--glass-border); background:var(--bg-primary); color:var(--text-main); text-align:center;">
            <span style="font-size:0.8rem;">to</span>
            <input type="number" id="rangeEndInput" min="1" max="${numPages}" value="${numPages}" style="width:55px; padding:4px 6px; border-radius:4px; border:1px solid var(--glass-border); background:var(--bg-primary); color:var(--text-main); text-align:center;">
            <button type="button" class="btn btn-glass btn-sm" id="btnApplyRange">Apply Range</button>
          </div>

          <div class="thumbnail-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:12px; max-height:260px; overflow-y:auto; padding:6px;">
          </div>
        </div>
      `;

      const grid = containerElement.querySelector('.thumbnail-grid');
      const selectedPages = new Set();
      for (let i = 1; i <= numPages; i++) selectedPages.add(i);

      const updateOutput = () => {
        const sorted = Array.from(selectedPages).sort((a, b) => a - b);
        let rangeStr = 'all';
        if (sorted.length === 0) {
          rangeStr = '';
        } else if (sorted.length === numPages) {
          rangeStr = 'all';
        } else {
          rangeStr = sorted.join(', ');
        }
        if (onSelectionChange) onSelectionChange(rangeStr, sorted);
      };

      for (let p = 1; p <= numPages; p++) {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-thumb-card selected';
        pageItem.setAttribute('data-page', p);
        pageItem.style.cssText = 'cursor:pointer; border:2px solid var(--accent-primary); border-radius:8px; padding:6px; text-align:center; background:var(--bg-secondary); position:relative; transition:all 0.2s;';

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%; height:auto; border-radius:4px; display:block;';
        
        const badge = document.createElement('div');
        badge.className = 'page-badge';
        badge.style.cssText = 'font-size:0.75rem; font-weight:600; margin-top:6px; color:var(--text-main); display:flex; align-items:center; justify-content:center; gap:4px;';
        badge.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--accent-primary);"></i> Page ${p}`;

        pageItem.appendChild(canvas);
        pageItem.appendChild(badge);
        grid.appendChild(pageItem);

        // Render page preview on canvas
        pdfDoc.getPage(p).then(pageObj => {
          const viewport = pageObj.getViewport({ scale: 0.3 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          pageObj.render({ canvasContext: canvas.getContext('2d'), viewport });
        });

        // Click handler to toggle selection
        pageItem.addEventListener('click', () => {
          if (selectedPages.has(p)) {
            selectedPages.delete(p);
            pageItem.style.borderColor = 'var(--glass-border)';
            const icon = badge.querySelector('i');
            icon.style.color = 'var(--text-muted)';
            icon.className = 'fa-regular fa-circle';
          } else {
            selectedPages.add(p);
            pageItem.style.borderColor = 'var(--accent-primary)';
            const icon = badge.querySelector('i');
            icon.style.color = 'var(--accent-primary)';
            icon.className = 'fa-solid fa-circle-check';
          }
          updateOutput();
        });
      }

      // Helper Button Listeners
      containerElement.querySelector('#btnSelectAllPages')?.addEventListener('click', () => {
        selectedPages.clear();
        for (let i = 1; i <= numPages; i++) selectedPages.add(i);
        grid.querySelectorAll('.page-thumb-card').forEach(card => {
          card.style.borderColor = 'var(--accent-primary)';
          const icon = card.querySelector('i');
          if (icon) { icon.className = 'fa-solid fa-circle-check'; icon.style.color = 'var(--accent-primary)'; }
        });
        updateOutput();
      });

      containerElement.querySelector('#btnDeselectAllPages')?.addEventListener('click', () => {
        selectedPages.clear();
        grid.querySelectorAll('.page-thumb-card').forEach(card => {
          card.style.borderColor = 'var(--glass-border)';
          const icon = card.querySelector('i');
          if (icon) { icon.className = 'fa-regular fa-circle'; icon.style.color = 'var(--text-muted)'; }
        });
        updateOutput();
      });

      containerElement.querySelector('#btnSelectOddPages')?.addEventListener('click', () => {
        selectedPages.clear();
        for (let i = 1; i <= numPages; i += 2) selectedPages.add(i);
        grid.querySelectorAll('.page-thumb-card').forEach(card => {
          const pNum = parseInt(card.getAttribute('data-page'), 10);
          const isOdd = pNum % 2 !== 0;
          card.style.borderColor = isOdd ? 'var(--accent-primary)' : 'var(--glass-border)';
          const icon = card.querySelector('i');
          if (icon) {
            icon.className = isOdd ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
            icon.style.color = isOdd ? 'var(--accent-primary)' : 'var(--text-muted)';
          }
        });
        updateOutput();
      });

      containerElement.querySelector('#btnSelectEvenPages')?.addEventListener('click', () => {
        selectedPages.clear();
        for (let i = 2; i <= numPages; i += 2) selectedPages.add(i);
        grid.querySelectorAll('.page-thumb-card').forEach(card => {
          const pNum = parseInt(card.getAttribute('data-page'), 10);
          const isEven = pNum % 2 === 0;
          card.style.borderColor = isEven ? 'var(--accent-primary)' : 'var(--glass-border)';
          const icon = card.querySelector('i');
          if (icon) {
            icon.className = isEven ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
            icon.style.color = isEven ? 'var(--accent-primary)' : 'var(--text-muted)';
          }
        });
        updateOutput();
      });

      containerElement.querySelector('#btnApplyRange')?.addEventListener('click', () => {
        const start = parseInt(containerElement.querySelector('#rangeStartInput').value, 10) || 1;
        const end = parseInt(containerElement.querySelector('#rangeEndInput').value, 10) || numPages;

        selectedPages.clear();
        for (let i = Math.max(1, start); i <= Math.min(numPages, end); i++) {
          selectedPages.add(i);
        }

        grid.querySelectorAll('.page-thumb-card').forEach(card => {
          const pNum = parseInt(card.getAttribute('data-page'), 10);
          const inRange = selectedPages.has(pNum);
          card.style.borderColor = inRange ? 'var(--accent-primary)' : 'var(--glass-border)';
          const icon = card.querySelector('i');
          if (icon) {
            icon.className = inRange ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
            icon.style.color = inRange ? 'var(--accent-primary)' : 'var(--text-muted)';
          }
        });
        updateOutput();
      });

      updateOutput();

    } catch (err) {
      console.warn('Failed to render page thumbnails:', err.message);
      containerElement.innerHTML = '';
    }
  }

  /**
   * Convert all PDF document pages into high-resolution PNG / JPEG images
   */
  static async convertPDFToImages(file, format = 'png', scale = 2.0) {
    if (!pdfjsLib || !file) return [];

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const numPages = pdfDoc.numPages;
      const results = [];

      const isJpg = format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg';
      const mimeType = isJpg ? 'image/jpeg' : 'image/png';
      const ext = isJpg ? 'jpg' : 'png';

      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (isJpg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        const baseName = (file.name || 'document').replace(/\.pdf$/i, '');
        const filename = `${baseName}_page_${p}.${ext}`;

        results.push({
          pageNum: p,
          totalPages: numPages,
          filename,
          dataUrl,
          width: viewport.width,
          height: viewport.height
        });
      }

      return results;
    } catch (err) {
      console.error('PDF to Image rendering error:', err);
      return [];
    }
  }
}

window.PDFPreviewRenderer = PDFPreviewRenderer;
