const OCRService = require('../services/ocrService');
const HistoryModel = require('../models/History');
const { cleanupFile } = require('../utils/fileHelpers');

class OCRController {
  static async recognize(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload an image file.' });
      const language = req.body.language || 'eng';

      const result = await OCRService.recognizeImage(req.file.path, language);
      cleanupFile(req.file.path);

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async searchablePDF(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload an image or scanned document.' });
      const language = req.body.language || 'eng';

      const result = await OCRService.createSearchablePDF(req.file.path, language);
      cleanupFile(req.file.path);

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'Searchable PDF OCR',
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

module.exports = OCRController;
