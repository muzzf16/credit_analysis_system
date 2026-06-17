const router = require('express').Router();
const ctrl = require('./agunan.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/pengajuan/:pengajuanId', ctrl.getByPengajuanId);
router.post('/', authorize('ADMIN', 'AO', 'ANALIS'), auditTrail('agunan'), ctrl.create);
router.post('/:agunanId/foto', authorize('ADMIN', 'AO', 'ANALIS'), auditTrail('agunan_foto'), ctrl.addFoto);

module.exports = router;
