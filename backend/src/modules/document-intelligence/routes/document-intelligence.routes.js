const express = require('express');
const router = express.Router();
const { upload } = require('../../../middleware/upload');
const { authenticate } = require('../../../middleware/auth');
const DocumentIntelligenceController = require('../controllers/document-intelligence.controller');

// All endpoints require authentication
router.use(authenticate);

// Queue & Job Management Routes
router.post('/upload', upload.single('file'), DocumentIntelligenceController.upload);
router.post('/jobs/:id/process', DocumentIntelligenceController.process);
router.get('/jobs', DocumentIntelligenceController.list);
router.get('/jobs/:id', DocumentIntelligenceController.get);
router.put('/jobs/:id', DocumentIntelligenceController.update);
router.post('/jobs/:id/map', DocumentIntelligenceController.map);
router.delete('/jobs/:id', DocumentIntelligenceController.delete);

module.exports = router;
