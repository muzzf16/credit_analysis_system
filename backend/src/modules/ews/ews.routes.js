const router = require('express').Router();
const ctrl = require('./ews.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);

// Summary & Scan must come before :id to prevent route param conflict
router.get('/summary', ctrl.getSummary);
router.post('/scan', authorize('ADMIN', 'KABID', 'SPI'), auditTrail('ews'), ctrl.scanEws);
router.post('/visit', authorize('ADMIN', 'AO'), auditTrail('ews'), ctrl.logAoVisit);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/:id/resolve', authorize('ADMIN', 'KABID', 'DIREKSI', 'SPI'), auditTrail('ews'), ctrl.resolveAlert);

module.exports = router;
