const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { generateFilename, getDownloadsDir } = require('../utils/fileHelpers');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

class OCRService {
  /**
   * Perform OCR on an image file (PNG, JPG, BMP, WEBP, etc.)
   */
  static async recognizeImage(imagePath, language = 'eng') {
    const ext = path.extname(imagePath).toLowerCase();
    
    // If the input file is a PDF file, extract text via PDFService instead of passing raw PDF to Tesseract
    if (ext === '.pdf') {
      const PDFService = require('./pdfService');
      try {
        const { text } = await PDFService.extractText(imagePath);
        return {
          text: text || 'No readable text found in PDF.',
          confidence: 95,
          language: language || 'eng'
        };
      } catch (err) {
        return {
          text: 'Failed to extract text from PDF document.',
          confidence: 0,
          language: language || 'eng'
        };
      }
    }

    const langMap = {
      'eng': 'eng',
      'spa': 'spa',
      'fra': 'fra',
      'deu': 'deu',
      'chi_sim': 'chi_sim',
      'auto': 'eng'
    };

    const targetLang = langMap[language] || 'eng';

    try {
      const result = await Tesseract.recognize(imagePath, targetLang, {
        logger: m => console.log(`[OCR Progress] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`)
      });

      return {
        text: result.data ? result.data.text : '',
        confidence: result.data ? Math.round(result.data.confidence) : 0,
        language: targetLang
      };
    } catch (err) {
      console.warn('Tesseract OCR error:', err.message);
      return {
        text: 'OCR processing error: Please upload a valid PNG, JPG, or WEBP image file.',
        confidence: 0,
        language: targetLang
      };
    }
  }

  /**
   * Convert an image or scanned document into a Searchable PDF document.
   */
  static async createSearchablePDF(imagePath, language = 'eng') {
    const ocrResult = await this.recognizeImage(imagePath, language);
    
    // Create new PDF with embedded text layer
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    const fontSize = 12;
    const textLines = ocrResult.text.split('\n');

    let y = 841.89 - margin;
    textLines.forEach(line => {
      if (line.trim().length > 0 && y > margin) {
        page.drawText(line.trim(), {
          x: margin,
          y: y,
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1)
        });
        y -= (fontSize + 6);
      }
    });

    const pdfBytes = await pdfDoc.save();
    const outputFilename = generateFilename('ocr_searchable_doc', 'ocr_pdf', '.pdf');
    const outputPath = path.join(getDownloadsDir(), outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      filename: outputFilename,
      path: outputPath,
      url: `/downloads/${outputFilename}`,
      extractedText: ocrResult.text,
      confidence: ocrResult.confidence,
      size: pdfBytes.length
    };
  }
}

module.exports = OCRService;
