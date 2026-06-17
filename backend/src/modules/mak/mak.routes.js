const router = require('express').Router();
const ctrl = require('./mak.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.get('/pengajuan/:pengajuanId', authorize('ANALIS', 'KABID', 'DIREKSI', 'ADMIN'), ctrl.getMakData);
router.post('/generate/:pengajuanId', authorize('ANALIS', 'KABID', 'DIREKSI', 'ADMIN'), ctrl.generateMak);

module.exports = router;
