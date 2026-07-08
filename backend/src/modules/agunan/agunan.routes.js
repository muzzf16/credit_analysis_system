const router = require('express').Router();
const ctrl = require('./agunan.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');
const { upload: multerUpload } = require('../../middleware/upload');

router.use(authenticate);
router.get('/pengajuan/:pengajuanId', ctrl.getByPengajuanId);
router.post('/', authorize('ADMIN', 'AO', 'ANALIS'), auditTrail('agunan'), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('ADMIN', 'AO', 'ANALIS'), auditTrail('agunan_update'), ctrl.update);
router.post('/:agunanId/foto', authorize('ADMIN', 'AO', 'ANALIS'), multerUpload.single('file'), auditTrail('agunan_foto'), ctrl.addFoto);
router.delete('/:agunanId/foto/:fotoId', authorize('ADMIN', 'AO', 'ANALIS'), auditTrail('agunan_foto_delete'), ctrl.deleteFoto);

module.exports = router;
