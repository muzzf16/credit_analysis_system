const router = require('express').Router();
const ctrl = require('./users.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
router.get('/roles', ctrl.getRoles);
router.get('/', authorize('ADMIN', 'DIREKSI'), ctrl.getAll);
router.get('/:id', authorize('ADMIN', 'DIREKSI'), ctrl.getById);
router.post('/', authorize('ADMIN'), auditTrail('users'), ctrl.create);
router.put('/:id', authorize('ADMIN'), auditTrail('users'), ctrl.update);
router.put('/:id/reset-password', authorize('ADMIN'), auditTrail('users'), ctrl.resetPassword);

module.exports = router;
