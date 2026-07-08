const router = require('express').Router();
const ctrl = require('./document.controller');
const { authenticate } = require('../../middleware/auth');
const { upload: multerUpload } = require('../../middleware/upload');

// All document analysis routes require authentication
router.use(authenticate);

// Routes for document VLM extraction
router.post('/ktp', multerUpload.single('file'), ctrl.processKTP);
router.post('/kk', multerUpload.single('file'), ctrl.processKK);
router.post('/npwp', multerUpload.single('file'), ctrl.processNPWP);
router.post('/shm/page', multerUpload.single('file'), ctrl.processSHMPage);
router.post('/shm', multerUpload.single('file'), ctrl.processSHM);

router.post('/bpkb', multerUpload.single('file'), ctrl.processBPKB);
router.post('/sppt_pbb', multerUpload.single('file'), ctrl.processSpptPbb);
router.post('/survey', multerUpload.single('file'), ctrl.processSurvey);
router.post('/surat_nikah', multerUpload.single('file'), ctrl.processSuratNikah);

module.exports = router;
