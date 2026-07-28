const PDFService = require('../services/pdfService');
const HistoryModel = require('../models/History');
const { cleanupFile } = require('../utils/fileHelpers');

class PDFController {
  static async merge(req, res, next) {
    try {
      if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge.' });
      }

      const filePaths = req.files.map(f => f.path);
      const result = await PDFService.mergePDFs(filePaths);

      // Clean up uploaded temp files
      filePaths.forEach(fp => cleanupFile(fp));

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Merge PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF files merged successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async split(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const pageRanges = req.body.pages || 'all';
      const result = await PDFService.splitPDF(req.file.path, pageRanges);

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Split PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF split successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async rotate(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const degrees = req.body.degrees || 90;
      const result = await PDFService.rotatePDF(req.file.path, degrees);

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Rotate PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF rotated successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async compress(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const level = req.body.level || 'recommended';
      const pageRange = req.body.pages || req.body.pageRange || 'all';

      const result = await PDFService.compressPDF(req.file.path, { level, pageRange });

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Compress PDF',
        fileName: result.filename,
        fileSize: result.newSize,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF compressed successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async watermark(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const watermarkText = req.body.text || 'CONFIDENTIAL';
      const opacity = req.body.opacity || 0.3;

      const result = await PDFService.watermarkPDF(req.file.path, watermarkText, { opacity });

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Watermark PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'Watermark applied successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async headerFooter(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const { headerText, footerText, includePageNumbers } = req.body;
      const result = await PDFService.addHeaderFooter(req.file.path, {
        headerText,
        footerText,
        includePageNumbers: includePageNumbers === 'true' || includePageNumbers === true
      });

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Page Numbers & Header',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'Header and footer added successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async organize(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const { action, pagesToDelete, order, pageNumber } = req.body;
      const result = await PDFService.organizePages(req.file.path, action, {
        pagesToDelete: pagesToDelete ? JSON.parse(pagesToDelete) : [],
        order: order ? JSON.parse(order) : [],
        pageNumber: parseInt(pageNumber, 10) || 1
      });

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: `Organize PDF (${action})`,
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF pages organized successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async encrypt(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const password = req.body.password || '123456';
      const result = await PDFService.encryptPDF(req.file.path, password);

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Encrypt PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF encrypted successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async decrypt(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const password = req.body.password;
      const result = await PDFService.decryptPDF(req.file.path, password);

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Decrypt PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'PDF decrypted successfully.', result });
    } catch (err) {
      next(err);
    }
  }

  static async addQRCode(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const qrText = req.body.qrText || 'https://pdftoolkit.ai';
      const result = await PDFService.addQRCodeToPDF(req.file.path, qrText);

      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Add QR Code to PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, message: 'QR Code stamped on PDF successfully.', result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PDFController;
