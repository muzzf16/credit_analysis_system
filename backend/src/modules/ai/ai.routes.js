const router = require('express').Router();
const ctrl = require('./ai.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

router.get('/narrative/:pengajuanId', authorize('ANALIS', 'KABID', 'DIREKSI', 'ADMIN'), ctrl.getNarrative);
router.post('/narrative/:pengajuanId', authorize('ANALIS', 'KABID', 'DIREKSI', 'ADMIN'), ctrl.generateNarrative);

module.exports = router;
