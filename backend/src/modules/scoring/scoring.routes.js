const router = require('express').Router();
const ctrl = require('./scoring.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/:pengajuanId', ctrl.getByPengajuanId);
router.post('/', authorize('ADMIN', 'ANALIS'), auditTrail('credit_scoring'), ctrl.save);

module.exports = router;
