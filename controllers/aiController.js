const AIService = require('../services/aiService');
const HistoryModel = require('../models/History');
const { AILogModel } = require('../models/Favorite');
const { cleanupFile } = require('../utils/fileHelpers');

class AIController {
  static async summarize(req, res, next) {
    const startTime = Date.now();
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const result = await AIService.summarize(req.file.path);
      cleanupFile(req.file.path);

      const durationMs = Date.now() - startTime;
      await AILogModel.log({
        userId: req.user ? req.user.id : 'guest',
        action: 'Summarize PDF',
        inputLength: result.wordCount,
        durationMs
      });

      await HistoryModel.add({
        userId: req.user ? req.user.id : 'guest',
        toolName: 'AI PDF Summary',
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async explain(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const result = await AIService.explain(req.file.path);
      cleanupFile(req.file.path);

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async chat(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });
      const question = req.body.question || 'What is the main summary of this document?';

      const result = await AIService.chat(req.file.path, question);
      cleanupFile(req.file.path);

      res.json({ success: true, question, result });
    } catch (err) {
      next(err);
    }
  }

  static async flashcardsAndQuiz(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a PDF file.' });

      const result = await AIService.generateFlashcardsAndQuiz(req.file.path);
      cleanupFile(req.file.path);

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  static async analyzeDocument(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Please upload a document file.' });
      const docType = req.body.docType || 'auto';

      const result = await AIService.analyzeDocument(req.file.path, docType);
      cleanupFile(req.file.path);

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AIController;
