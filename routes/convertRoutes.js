const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ConvertController = require('../controllers/convertController');

router.post('/images-to-pdf', upload.array('files', 20), ConvertController.imagesToPDF);
router.post('/text-to-pdf', upload.single('file'), ConvertController.textToPDF);
router.post('/pdf-to-text', upload.single('file'), ConvertController.pdfToText);
router.post('/pdf-to-html', upload.single('file'), ConvertController.pdfToHTML);
router.post('/pdf-to-image', upload.single('file'), ConvertController.pdfToImage);

module.exports = router;
