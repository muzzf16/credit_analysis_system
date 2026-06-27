const DocumentIntelligenceService = require('../services/document-intelligence.service');
const { success, error } = require('../../../utils/response');

class DocumentIntelligenceController {

  static async upload(req, res) {
    try {
      if (!req.file) {
        return error(res, 'File wajib diunggah.', 400);
      }

      const { debitur_id, pengajuan_id } = req.body;
      const job = await DocumentIntelligenceService.uploadAndCreateJob(
        req.file,
        debitur_id,
        pengajuan_id,
        req.user.id
      );

      return success(res, job, 'File berhasil diunggah ke Queue Document Intelligence Center.', 201);
    } catch (err) {
      console.error('[Doc Intel Controller] Upload Error:', err);
      return error(res, err.message || 'Gagal mengunggah dokumen.', err.status || 500);
    }
  }

  static async process(req, res) {
    try {
      const { id } = req.params;
      const job = await DocumentIntelligenceService.processJob(id);
      return success(res, job, 'Proses ekstraksi dokumen berhasil dijalankan.');
    } catch (err) {
      console.error('[Doc Intel Controller] Process Error:', err);
      return error(res, err.message || 'Gagal memproses dokumen.', err.status || 500);
    }
  }

  static async list(req, res) {
    try {
      const { status, document_type, pengajuan_id, limit, offset } = req.query;
      const result = await DocumentIntelligenceService.getJobs({
        status,
        documentType: document_type,
        pengajuanId: pengajuan_id,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0
      });
      return success(res, result, 'Daftar dokumen berhasil diambil.');
    } catch (err) {
      console.error('[Doc Intel Controller] List Error:', err);
      return error(res, err.message || 'Gagal mengambil daftar dokumen.', 500);
    }
  }

  static async get(req, res) {
    try {
      const { id } = req.params;
      const job = await DocumentIntelligenceService.getJobById(id);
      return success(res, job, 'Detail dokumen berhasil diambil.');
    } catch (err) {
      console.error('[Doc Intel Controller] Get Error:', err);
      return error(res, err.message || 'Gagal mengambil detail dokumen.', err.status || 500);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { extracted_data } = req.body;
      if (!extracted_data) {
        return error(res, 'Data hasil ekstraksi (extracted_data) wajib dikirim.', 400);
      }

      const job = await DocumentIntelligenceService.updateJobData(id, extracted_data);
      return success(res, job, 'Data hasil ekstraksi berhasil diperbarui.');
    } catch (err) {
      console.error('[Doc Intel Controller] Update Error:', err);
      return error(res, err.message || 'Gagal memperbarui data dokumen.', err.status || 500);
    }
  }

  static async map(req, res) {
    try {
      const { id } = req.params;
      const result = await DocumentIntelligenceService.mapJobToDomain(id, req.user.id);
      return success(res, result, 'Data berhasil dipetakan ke database sistem.');
    } catch (err) {
      console.error('[Doc Intel Controller] Map Error:', err);
      return error(res, err.message || 'Gagal memetakan data dokumen.', err.status || 500);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await DocumentIntelligenceService.deleteJob(id);
      return success(res, null, 'Job dokumen berhasil dihapus.');
    } catch (err) {
      console.error('[Doc Intel Controller] Delete Error:', err);
      return error(res, err.message || 'Gagal menghapus job dokumen.', err.status || 500);
    }
  }
}

module.exports = DocumentIntelligenceController;
