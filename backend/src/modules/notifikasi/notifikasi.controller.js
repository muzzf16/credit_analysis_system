const svc = require('./notifikasi.service');
const { success, error } = require('../../utils/response');

async function getNotifications(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await svc.getNotifications(req.user.id, page, limit);
    return success(res, result.data, 'Success', 200, result.meta);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getUnreadCount(req, res) {
  try {
    const count = await svc.getUnreadCount(req.user.id);
    return success(res, { count });
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function markAsRead(req, res) {
  try {
    const data = await svc.markAsRead(req.params.id, req.user.id);
    return success(res, data, 'Notifikasi telah dibaca.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function sendWa(req, res) {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return error(res, 'Phone dan message harus diisi.', 400);
    }
    const result = await svc.sendWhatsApp(phone, message);
    return success(res, result, 'Pesan WhatsApp terkirim.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { getNotifications, getUnreadCount, markAsRead, sendWa };
