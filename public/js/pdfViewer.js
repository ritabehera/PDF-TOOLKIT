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
}

window.PDFPreviewRenderer = PDFPreviewRenderer;
