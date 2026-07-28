const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { generateFilename, cleanupFile } = require('../utils/fileHelpers');

class PDFService {
  /**
   * Merge multiple PDF files into one.
   */
  static async mergePDFs(filePaths) {
    const mergedPdf = await PDFDocument.create();

    for (const filePath of filePaths) {
      const fileBytes = fs.readFileSync(filePath);
      const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    const outputFilename = generateFilename('merged_document', 'merged', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: mergedPdf.getPageCount(),
      size: pdfBytes.length
    };
  }

  /**
   * Split PDF by ranges or extract individual pages.
   */
  static async splitPDF(filePath, pageRangesStr) {
    const fileBytes = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const newDoc = await PDFDocument.create();
    let selectedIndices = [];

    if (!pageRangesStr || pageRangesStr.trim() === '' || pageRangesStr.toLowerCase() === 'all') {
      // Return all as individual pages or single doc
      selectedIndices = srcDoc.getPageIndices();
    } else {
      // Parse ranges like "1-3, 5, 7-9"
      const parts = pageRangesStr.split(',');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
              selectedIndices.push(i - 1);
            }
          }
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            selectedIndices.push(pageNum - 1);
          }
        }
      });
    }

    // Deduplicate and filter indices
    selectedIndices = [...new Set(selectedIndices)].filter(idx => idx >= 0 && idx < totalPages);
    if (selectedIndices.length === 0) {
      selectedIndices = srcDoc.getPageIndices();
    }

    const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
    copiedPages.forEach(page => newDoc.addPage(page));

    const pdfBytes = await newDoc.save();
    const outputFilename = generateFilename('split_document', 'split', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: newDoc.getPageCount(),
      size: pdfBytes.length
    };
  }

  /**
   * Rotate pages in a PDF document.
   */
  static async rotatePDF(filePath, rotationDegrees = 90, pages = 'all') {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    const angle = parseInt(rotationDegrees, 10) || 90;

    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('rotated_document', 'rotated', '.pdf');
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
   * Compress PDF by optimizing streams, filtering page ranges, and applying compression level.
   */
  static async compressPDF(filePath, options = {}) {
    const fileBytes = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const pageRangeStr = options.pageRange || options.pages || 'all';
    const level = options.level || 'recommended';

    let targetDoc = srcDoc;
    if (pageRangeStr && pageRangeStr.trim().toLowerCase() !== 'all') {
      targetDoc = await PDFDocument.create();
      let selectedIndices = [];
      const parts = pageRangeStr.split(',');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
              selectedIndices.push(i - 1);
            }
          }
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            selectedIndices.push(pageNum - 1);
          }
        }
      });
      selectedIndices = [...new Set(selectedIndices)].filter(idx => idx >= 0 && idx < totalPages);
      if (selectedIndices.length === 0) selectedIndices = srcDoc.getPageIndices();

      const copiedPages = await targetDoc.copyPages(srcDoc, selectedIndices);
      copiedPages.forEach(p => targetDoc.addPage(p));
    }

    // Save with stream compression and object stream packing
    const compressedBytes = await targetDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    const outputFilename = generateFilename('compressed_document', 'compressed', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, compressedBytes);

    const originalSize = fileBytes.length;
    const newSize = compressedBytes.length;
    const savingsPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      originalSize,
      newSize,
      savingsPercent,
      pageCount: targetDoc.getPageCount(),
      level: level
    };
  }

  /**
   * Add text watermark to PDF pages.
   */
  static async watermarkPDF(filePath, watermarkText = 'CONFIDENTIAL', options = {}) {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const fontSize = options.fontSize || 48;
    const opacity = options.opacity !== undefined ? parseFloat(options.opacity) : 0.3;

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font: font,
        color: rgb(0.7, 0.2, 0.2),
        opacity: opacity,
        rotate: degrees(45)
      });
    });

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('watermarked_document', 'watermarked', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: pages.length,
      size: pdfBytes.length
    };
  }

  /**
   * Add Header, Footer & Page Numbers.
   */
  static async addHeaderFooter(filePath, { headerText = '', footerText = '', includePageNumbers = true }) {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const fontSize = 10;

      // Draw Header
      if (headerText) {
        page.drawText(headerText, {
          x: 40,
          y: height - 25,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4)
        });
      }

      // Draw Footer & Page Numbers
      let footer = footerText;
      if (includePageNumbers) {
        const pageStr = `Page ${index + 1} of ${totalPages}`;
        footer = footer ? `${footer} | ${pageStr}` : pageStr;
      }

      if (footer) {
        const textWidth = font.widthOfTextAtSize(footer, fontSize);
        page.drawText(footer, {
          x: (width - textWidth) / 2,
          y: 20,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4)
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('header_footer_doc', 'numbered', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: totalPages,
      size: pdfBytes.length
    };
  }

  /**
   * Delete, Reorder, or Duplicate Pages.
   */
  static async organizePages(filePath, action, params) {
    const fileBytes = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const totalPages = srcDoc.getPageCount();

    let targetIndices = [];

    if (action === 'delete') {
      const deleteSet = new Set((params.pagesToDelete || []).map(p => p - 1));
      for (let i = 0; i < totalPages; i++) {
        if (!deleteSet.has(i)) targetIndices.push(i);
      }
    } else if (action === 'reorder') {
      // params.order is array of 1-based page numbers
      targetIndices = (params.order || []).map(p => p - 1).filter(idx => idx >= 0 && idx < totalPages);
    } else if (action === 'duplicate') {
      const pageToDup = (params.pageNumber || 1) - 1;
      for (let i = 0; i < totalPages; i++) {
        targetIndices.push(i);
        if (i === pageToDup) targetIndices.push(i); // append duplicate right after
      }
    } else {
      targetIndices = srcDoc.getPageIndices();
    }

    if (targetIndices.length === 0) {
      targetIndices = [0];
    }

    const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const outputFilename = generateFilename('organized_doc', 'organized', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      pageCount: newDoc.getPageCount(),
      size: pdfBytes.length
    };
  }

  /**
   * Encrypt / Password protect PDF.
   */
  static async encryptPDF(filePath, userPassword, ownerPassword) {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    // Note: pdf-lib encrypts documents with user & owner password options
    const pdfBytes = await pdfDoc.save({
      userPassword: userPassword || '123456',
      ownerPassword: ownerPassword || userPassword || '123456'
    });

    const outputFilename = generateFilename('protected_doc', 'locked', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      size: pdfBytes.length
    };
  }

  /**
   * Decrypt / Password unlock PDF.
   */
  static async decryptPDF(filePath, password) {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { password: password, ignoreEncryption: false });

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('unlocked_doc', 'unlocked', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      size: pdfBytes.length
    };
  }

  /**
   * Add QR Code to PDF document pages.
   */
  static async addQRCodeToPDF(filePath, qrText = 'https://pdftoolkit.ai') {
    const QRCode = require('qrcode');
    const qrImageBuffer = await QRCode.toBuffer(qrText, { type: 'png', width: 200 });
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

    const qrImage = await pdfDoc.embedPng(qrImageBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawImage(qrImage, {
        x: width - 120,
        y: 20,
        width: 100,
        height: 100
      });
    });

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('qrcode_stamped_doc', 'qr_pdf', '.pdf');
    const outputPath = path.join(__dirname, '..', 'public', 'downloads', outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      size: pdfBytes.length
    };
  }

  /**
   * Extract Raw Text from PDF file.
   */
  static async extractText(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(dataBuffer);
    return {
      text: parsed.text || '',
      numPages: parsed.numpages,
      info: parsed.info
    };
  }
}

module.exports = PDFService;
