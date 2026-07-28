const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PDFService = require('./pdfService');
const { generateFilename } = require('../utils/fileHelpers');

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
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
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
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
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
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
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
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, htmlContent);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`
    };
  }
}

module.exports = ConvertService;
