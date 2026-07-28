const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const OCRController = require('../controllers/ocrController');

router.post('/recognize', upload.single('file'), OCRController.recognize);
router.post('/searchable-pdf', upload.single('file'), OCRController.searchablePDF);

module.exports = router;
