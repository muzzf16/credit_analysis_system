const svc = require('./dashboard.service');
const { success, error } = require('../../utils/response');

async function get(req, res) {
  try {
    let data;
    switch (req.user.role) {
      case 'DIREKSI':
      case 'ADMIN':
      case 'SPI':
      case 'KABID':
        data = await svc.getDireksiDashboard();
        break;
      case 'AO':
        data = await svc.getAoDashboard(req.user.id);
        break;
      case 'ANALIS':
        data = await svc.getAnalisDashboard(req.user.id);
        break;
      default:
        data = await svc.getDireksiDashboard();
    }
    return success(res, data, 'Dashboard berhasil diambil.');
  } catch (err) { return error(res, err.message, 500); }
}

module.exports = { get };
