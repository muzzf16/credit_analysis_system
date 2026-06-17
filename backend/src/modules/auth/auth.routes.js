const router = require('express').Router();
const ctrl = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');

router.post('/login', ctrl.login);
router.post('/refresh-token', ctrl.refreshToken);
router.put('/change-password', authenticate, ctrl.changePassword);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
