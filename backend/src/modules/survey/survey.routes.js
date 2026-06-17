const router = require('express').Router();
const ctrl = require('./survey.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/pengajuan/:pengajuanId', ctrl.getByPengajuanId);
router.post('/', authorize('ADMIN', 'AO'), auditTrail('survey'), ctrl.create);

module.exports = router;
