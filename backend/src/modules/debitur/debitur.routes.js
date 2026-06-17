const router = require('express').Router();
const ctrl = require('./debitur.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN', 'AO'), auditTrail('debitur'), ctrl.create);
router.put('/:id', authorize('ADMIN', 'AO'), auditTrail('debitur'), ctrl.update);

module.exports = router;
