const router = require('express').Router();
const ctrl = require('./slik.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/pengajuan/:pengajuanId', ctrl.getByPengajuanId);
router.post('/', authorize('ADMIN', 'ANALIS'), auditTrail('slik'), ctrl.create);

module.exports = router;
