const router = require('express').Router();
const ctrl = require('./dokumen.controller');
const { authenticate } = require('../../middleware/auth');
const { upload: multerUpload } = require('../../middleware/upload');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/referensi/:referensiId', ctrl.getByReferensi);
router.get('/:id/download', ctrl.download);
router.post('/', multerUpload.single('file'), auditTrail('dokumen'), ctrl.upload);

module.exports = router;
