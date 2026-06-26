const crypto = require('crypto');

function assembleAgunan(debiturId, collateralDto) {
  if (!collateralDto || !collateralDto.collateral) {
    throw new Error('Collateral DTO is required');
  }

  const agunanId = crypto.randomUUID();
  const raw = collateralDto.collateral;

  return {
    agunanId,
    debiturId,
    jenisAgunan: raw.jenisSertifikat || 'UNKNOWN',
    spesifikasi: {
      nomorSertifikat: raw.nomorSertifikat,
      luas: raw.luas,
      lokasi: [raw.desa, raw.kecamatan, raw.kabupaten, raw.provinsi].filter(Boolean).join(', ')
    },
    ownership: {
      namaPemegangHak: raw.namaPemegangHak
    },
    valuation: {
      nilaiTaksasi: null,
      nilaiLikuidasi: null,
      tanggalTaksasi: null
    },
    metadata: {
      assembledAt: new Date().toISOString(),
      sources: [collateralDto.documentId]
    }
  };
}

module.exports = {
  assembleAgunan
};
