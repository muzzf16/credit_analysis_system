const router = require('express').Router();
const ctrl = require('./approval.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/pending', authorize('ADMIN', 'KABID', 'DIREKSI'), ctrl.getPending);
router.get('/pengajuan/:pengajuanId', ctrl.getByPengajuanId);
router.post('/', authorize('ADMIN', 'KABID', 'DIREKSI'), auditTrail('approval'), ctrl.submit);

module.exports = router;
