const CreditApplicationBuilder = require('../entities/CreditApplication');

class PengajuanAdapter {
  /**
   * Adapts a legacy 'pengajuan' database record into a Canonical CreditApplication
   * @param {Object} legacyRecord - The database object
   * @returns {Object} Canonical CreditApplication
   */
  static adapt(legacyRecord) {
    if (!legacyRecord) return null;

    const builder = new CreditApplicationBuilder();

    // Map ID
    if (legacyRecord.id_pengajuan) {
      builder.setApplicationId(legacyRecord.id_pengajuan);
    } else {
      builder.generateApplicationId();
    }

    // Map Product
    // Assuming legacy format like 'KMK', 'KK', 'KP'
    let productEnum = 'KREDIT_MODAL_KERJA';
    if (legacyRecord.jenis_kredit === 'KK') productEnum = 'KREDIT_KONSUMTIF';
    if (legacyRecord.jenis_kredit === 'KP') productEnum = 'KREDIT_PEGAWAI';
    builder.setProduct(productEnum);

    // Map Status
    // Assuming legacy format like 'DRAFT', 'SURVEY', 'ANALISA'
    let statusEnum = 'DATA_COLLECTION';
    if (legacyRecord.status_pengajuan === 'SURVEY') statusEnum = 'SURVEY';
    if (legacyRecord.status_pengajuan === 'ANALISA') statusEnum = 'ASSESSMENT';
    if (legacyRecord.status_pengajuan === 'KOMITE') statusEnum = 'COMMITTEE';
    if (legacyRecord.status_pengajuan === 'SETUJU') statusEnum = 'APPROVED';
    if (legacyRecord.status_pengajuan === 'TOLAK') statusEnum = 'REJECTED';
    if (legacyRecord.status_pengajuan === 'BATAL') statusEnum = 'CANCELLED';
    builder.setStatus(statusEnum);

    // Map AO
    builder.setAccountOfficer(legacyRecord.id_ao || 'UNKNOWN_AO');

    // Map Dates
    builder.setSubmittedAt(legacyRecord.tanggal_pengajuan || new Date().toISOString());

    // Map Metadata
    builder.setMetadata({
      createdAt: legacyRecord.created_at || new Date().toISOString(),
      createdBy: legacyRecord.created_by || 'SYSTEM',
      source: 'LEGACY_PENGAJUAN_DB',
      version: '1.0'
    });

    return builder.build();
  }
}

module.exports = PengajuanAdapter;
