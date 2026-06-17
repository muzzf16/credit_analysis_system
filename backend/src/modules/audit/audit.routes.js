const router = require('express').Router();
const ctrl = require('./audit.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.use(authorize('SPI', 'ADMIN', 'DIREKSI'));

router.get('/summary', ctrl.getSummary);
router.get('/', ctrl.getAll);

module.exports = router;
