const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const AIController = require('../controllers/aiController');

router.post('/summarize', upload.single('file'), AIController.summarize);
router.post('/explain', upload.single('file'), AIController.explain);
router.post('/chat', upload.single('file'), AIController.chat);
router.post('/flashcards', upload.single('file'), AIController.flashcardsAndQuiz);
router.post('/analyze', upload.single('file'), AIController.analyzeDocument);

module.exports = router;
