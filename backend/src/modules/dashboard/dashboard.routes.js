const router = require('express').Router();
const ctrl = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.get);

module.exports = router;
