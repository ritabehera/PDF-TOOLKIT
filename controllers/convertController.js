const ConvertService = require('../services/convertService');
const HistoryModel = require('../models/History');
const { cleanupFile } = require('../utils/fileHelpers');

class ConvertController {
  static async imagesToPDF(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Please upload image file(s).' });
      }

      const filePaths = req.files.map(f => f.path);
      const result = await ConvertService.imagesToPDF(filePaths);

      filePaths.forEach(fp => cleanupFile(fp));

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Image to PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async textToPDF(req, res, next) {
    try {
      const text = req.body.text || (req.file ? require('fs').readFileSync(req.file.path, 'utf8') : '');
      if (!text) return res.status(400).json({ error: 'Please provide text content.' });

      const result = await ConvertService.textToPDF(text);
      if (req.file) cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Text to PDF',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async pdfToText(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const result = await ConvertService.pdfToText(req.file.path);
      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'PDF to Text',
        fileName: result.filename,
        downloadUrl: result.url
      });

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async pdfToHTML(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const result = await ConvertService.pdfToHTML(req.file.path);
      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'PDF to HTML',
        fileName: result.filename,
        downloadUrl: result.url
      });

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async pdfToImage(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const format = req.body.format || 'png';
      const result = await ConvertService.pdfToImage(req.file.path, format);
      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'PDF to Image',
        fileName: result.filename,
        fileSize: result.size,
        downloadUrl: result.url
      });

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ConvertController;
