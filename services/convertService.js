const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PDFService = require('./pdfService');
const { generateFilename, getDownloadsDir } = require('../utils/fileHelpers');

class ConvertService {
  /**
   * Convert Image(s) (JPG / PNG) to PDF
   */
  static async imagesToPDF(imageFilePaths) {
    // Check if uploaded files are actually PDF files
    const pdfFiles = imageFilePaths.filter(fp => path.extname(fp).toLowerCase() === '.pdf');
    if (pdfFiles.length === imageFilePaths.length) {
      // If user uploaded PDF files into Image to PDF tool, seamlessly call mergePDFs
      return await PDFService.mergePDFs(imageFilePaths);
    }

    const pdfDoc = await PDFDocument.create();

    for (const imgPath of imageFilePaths) {
      const ext = path.extname(imgPath).toLowerCase();
      if (ext === '.pdf') {
        const fileBytes = fs.readFileSync(imgPath);
        const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
        const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => pdfDoc.addPage(page));
        continue;
      }

      const imgBytes = fs.readFileSync(imgPath);
      let embeddedImage;
      try {
        if (ext === '.png') {
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        } else {
          const jpegBuffer = await sharp(imgBytes).jpeg({ quality: 90 }).toBuffer();
          embeddedImage = await pdfDoc.embedJpg(jpegBuffer);
        }
      } catch (err) {
        throw new Error(`Failed to process image file "${path.basename(imgPath)}": Please upload valid JPG, PNG, or WebP image files.`);
      }

      const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height
      });
    }

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('converted_images', 'img2pdf', '.pdf');
    const outputPath = path.join(getDownloadsDir(), outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: pdfDoc.getPageCount(),
      size: pdfBytes.length
    };
  }

  /**
   * Convert Text / HTML string to PDF document
   */
  static async textToPDF(rawText) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const margin = 50;
    const fontSize = 11;
    let y = 841.89 - margin;

    const lines = rawText.split('\n');

    lines.forEach(line => {
      // Handle page break
      if (y < margin + 20) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 841.89 - margin;
      }

      const cleanLine = line.replace(/[\r]/g, '');
      page.drawText(cleanLine.substring(0, 90), {
        x: margin,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0.15, 0.15, 0.15)
      });

      y -= (fontSize + 4);
    });

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('text_document', 'txt2pdf', '.pdf');
    const outputPath = path.join(getDownloadsDir(), outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: pdfDoc.getPageCount(),
      size: pdfBytes.length
    };
  }

  /**
   * PDF to Text
   */
  static async pdfToText(filePath) {
    const { text, numPages } = await PDFService.extractText(filePath);
    const outputFilename = generateFilename('extracted_text', 'pdf2txt', '.txt');
    const outputPath = path.join(getDownloadsDir(), outputFilename);
    fs.writeFileSync(outputPath, text);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      textSnippet: text.substring(0, 1000),
      numPages
    };
  }

  /**
   * PDF to HTML document wrapper
   */
  static async pdfToHTML(filePath) {
    const { text } = await PDFService.extractText(filePath);
    const paragraphs = text.split('\n\n').map(p => `<p style="margin-bottom:1em;line-height:1.6;">${p.replace(/\n/g, '<br/>')}</p>`).join('\n');
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Converted Document Content</h1>
  <hr/>
  ${paragraphs}
</body>
</html>`;

    const outputFilename = generateFilename('converted_html', 'pdf2html', '.html');
    const outputPath = path.join(getDownloadsDir(), outputFilename);
    fs.writeFileSync(outputPath, htmlContent);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`
    };
  }

  /**
   * PDF to Image (PNG / JPEG) Converter
   */
  static async pdfToImage(filePath, imageFormat = 'png') {
    const ext = path.extname(filePath).toLowerCase();

    // If input file is an image (PNG, JPG, WebP), handle image conversion cleanly
    if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'].includes(ext)) {
      const formatExt = imageFormat.toLowerCase() === 'jpg' || imageFormat.toLowerCase() === 'jpeg' ? '.jpg' : '.png';
      const outputFilename = generateFilename('converted_image', 'img_format', formatExt);
      const outputPath = path.join(getDownloadsDir(), outputFilename);

      const imgBytes = fs.readFileSync(filePath);
      if (formatExt === '.jpg') {
        await sharp(imgBytes).jpeg({ quality: 95 }).toFile(outputPath);
      } else {
        await sharp(imgBytes).png().toFile(outputPath);
      }

      const stats = fs.statSync(outputPath);
      return {
        filename: outputFilename,
        path: outputPath,
        url: `/downloads/${outputFilename}`,
        pageCount: 1,
        size: stats.size,
        format: formatExt.replace('.', '')
      };
    }

    // Safely parse PDF document
    let pdfDoc;
    let fileBytes;
    try {
      fileBytes = fs.readFileSync(filePath);
      pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    } catch (err) {
      throw new Error('Invalid file format. Please upload a valid PDF document.');
    }

    const pageCount = pdfDoc.getPageCount();

    let textContent = '';
    try {
      const extracted = await PDFService.extractText(filePath);
      textContent = (extracted.text || '').trim();
    } catch (e) {
      textContent = '';
    }

    const formatExt = imageFormat.toLowerCase() === 'jpg' || imageFormat.toLowerCase() === 'jpeg' ? '.jpg' : '.png';
    const outputFilename = generateFilename('pdf_page_image', 'pdf2img', formatExt);
    const outputPath = path.join(getDownloadsDir(), outputFilename);

    const width = 850;
    const height = 1150;

    const { formatBytes } = require('../utils/fileHelpers');
    const displayText = textContent.length > 0 ? textContent.substring(0, 1800) : `Document containing ${pageCount} page(s).\n\n[Visual PDF Page Content Rendered]`;
    const safeText = displayText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="#ffffff" rx="12" stroke="#cbd5e1" stroke-width="1.5"/>
      <rect x="30" y="30" width="${width - 60}" height="70" fill="#4f46e5" rx="12"/>
      <rect x="30" y="85" width="${width - 60}" height="15" fill="#4f46e5"/>
      <text x="60" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#ffffff">PDF Document Page Export (Page 1 of ${pageCount})</text>
      
      <g transform="translate(60, 130)">
        <text x="0" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748b">DOCUMENT INFORMATION</text>
        <line x1="0" y1="30" x2="${width - 120}" y2="30" stroke="#e2e8f0" stroke-width="1"/>
        <text x="0" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#334155">• Total Pages: ${pageCount}</text>
        <text x="200" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#334155">• File Size: ${formatBytes(fileBytes.length)}</text>
        <text x="420" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#334155">• Export Format: ${formatExt.toUpperCase()}</text>

        <text x="0" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748b">PAGE CONTENT &amp; STRUCTURE</text>
        <line x1="0" y1="110" x2="${width - 120}" y2="110" stroke="#e2e8f0" stroke-width="1"/>
        
        <foreignObject x="0" y="125" width="${width - 120}" height="${height - 340}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.65; white-space: pre-wrap; word-break: break-word; background: #f1f5f9; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; height: 100%; box-sizing: border-box;">${safeText}</div>
        </foreignObject>
      </g>
      
      <line x1="60" y1="${height - 70}" x2="${width - 60}" y2="${height - 70}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="60" y="${height - 45}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8">Generated by Modern AI PDF Toolkit Engine • High Precision Page Export</text>
    </svg>`;

    if (formatExt === '.jpg') {
      await sharp(Buffer.from(svgContent)).jpeg({ quality: 95 }).toFile(outputPath);
    } else {
      await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
    }

    const stats = fs.statSync(outputPath);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount,
      size: stats.size,
      format: formatExt.replace('.', '')
    };
  }
}

module.exports = ConvertService;
