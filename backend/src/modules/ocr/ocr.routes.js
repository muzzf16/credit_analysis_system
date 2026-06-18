const router = require('express').Router();
const ctrl = require('./ocr.controller');
const { authenticate } = require('../../middleware/auth');
const { upload: multerUpload } = require('../../middleware/upload');

// All OCR routes require authentication
router.use(authenticate);

// Route for processing OCR
router.post('/', multerUpload.single('file'), ctrl.processDocumentOCR);

module.exports = router;
