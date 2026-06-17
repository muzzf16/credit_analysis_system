const router = require('express').Router();
const ctrl = require('./analisa.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditTrail } = require('../../middleware/auditTrail');

router.use(authenticate);
// Konsumtif
router.get('/konsumtif/:pengajuanId', ctrl.getKonsumtif);
router.post('/konsumtif', authorize('ADMIN', 'ANALIS'), auditTrail('analisa_konsumtif'), ctrl.saveKonsumtif);
// Produktif
router.get('/produktif/:pengajuanId', ctrl.getProduktif);
router.post('/produktif', authorize('ADMIN', 'ANALIS'), auditTrail('analisa_produktif'), ctrl.saveProduktif);

module.exports = router;
