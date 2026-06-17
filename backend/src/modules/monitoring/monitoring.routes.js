const router = require('express').Router();
const ctrl = require('./monitoring.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);

// Summary must come before :id to avoid route conflict
router.get('/summary', ctrl.getSummary);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN', 'KABID', 'DIREKSI'), auditTrail('monitoring'), ctrl.create);
router.put('/:id', authorize('ADMIN', 'KABID', 'DIREKSI'), auditTrail('monitoring'), ctrl.update);
router.post('/:id/pembayaran', authorize('ADMIN', 'KABID', 'TELLER'), auditTrail('pembayaran'), ctrl.recordPayment);

module.exports = router;
