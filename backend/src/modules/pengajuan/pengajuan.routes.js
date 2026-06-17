const router = require('express').Router();
const ctrl = require('./pengajuan.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN', 'AO'), auditTrail('pengajuan'), ctrl.create);
router.put('/:id/status', authorize('ADMIN', 'AO', 'ANALIS', 'KABID', 'DIREKSI'), auditTrail('pengajuan'), ctrl.updateStatus);
router.put('/:id/assign-analis', authorize('ADMIN', 'KABID'), auditTrail('pengajuan'), ctrl.assignAnalis);

module.exports = router;
