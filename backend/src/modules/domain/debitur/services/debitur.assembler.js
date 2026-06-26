const crypto = require('crypto');

/**
 * Pure function to assemble a Debitur entity from multiple Document Intelligence sources
 * @param {Object} personDto - Result from PersonTransformer
 * @param {Object} [taxDto] - Result from NPWP Transformer (Optional)
 * @returns {Object} Valid Debitur state
 */
function assembleDebitur(personDto, taxDto = null) {
  if (!personDto || !personDto.person) {
    throw new Error('Person DTO is required to assemble Debitur');
  }

  // Generate deterministic Debitur ID or use a UUID
  const debiturId = crypto.randomUUID();

  const debitur = {
    debiturId,
    identity: {
      nik: personDto.person.nik,
      namaLengkap: personDto.person.namaLengkap,
      tempatLahir: personDto.person.tempatLahir,
      tanggalLahir: personDto.person.tanggalLahir,
      jenisKelamin: personDto.person.jenisKelamin,
      agama: personDto.person.agama,
      statusPerkawinan: personDto.person.statusPerkawinan
    },
    address: {
      alamatLengkap: personDto.person.alamat
    },
    employment: {
      pekerjaan: personDto.person.pekerjaan
    },
    taxProfile: {
      npwp: taxDto ? taxDto.npwp : null
    },
    contact: {},
    metadata: {
      assembledAt: new Date().toISOString(),
      sources: [personDto.documentId]
    }
  };

  return debitur;
}

module.exports = {
  assembleDebitur
};
