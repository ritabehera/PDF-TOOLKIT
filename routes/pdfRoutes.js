const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { pdfOpLimiter } = require('../middleware/rateLimiter');
const PDFController = require('../controllers/pdfController');

router.post('/merge', pdfOpLimiter, upload.array('files', 20), PDFController.merge);
router.post('/split', pdfOpLimiter, upload.single('file'), PDFController.split);
router.post('/rotate', pdfOpLimiter, upload.single('file'), PDFController.rotate);
router.post('/compress', pdfOpLimiter, upload.single('file'), PDFController.compress);
router.post('/watermark', pdfOpLimiter, upload.single('file'), PDFController.watermark);
router.post('/header-footer', pdfOpLimiter, upload.single('file'), PDFController.headerFooter);
router.post('/organize', pdfOpLimiter, upload.single('file'), PDFController.organize);
router.post('/encrypt', pdfOpLimiter, upload.single('file'), PDFController.encrypt);
router.post('/decrypt', pdfOpLimiter, upload.single('file'), PDFController.decrypt);

module.exports = router;
