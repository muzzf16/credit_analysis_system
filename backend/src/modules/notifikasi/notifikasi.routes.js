const router = require('express').Router();
const ctrl = require('./notifikasi.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);
router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/:id/read', ctrl.markAsRead);
router.post('/send-wa', authorize('ADMIN'), ctrl.sendWa);

module.exports = router;
