const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const DocumentIntelligenceController = require('../controllers/document-intelligence.controller');

router.post('/person', upload.single('file'), DocumentIntelligenceController.extractPerson);
router.post('/collateral', upload.single('file'), DocumentIntelligenceController.extractCollateral);
router.post('/credit-history', upload.single('file'), DocumentIntelligenceController.extractCreditHistory);

module.exports = router;
