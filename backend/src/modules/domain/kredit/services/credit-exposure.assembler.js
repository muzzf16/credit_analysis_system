const crypto = require('crypto');

function assembleCreditExposure(debiturId, creditHistoryDto) {
  if (!creditHistoryDto || !creditHistoryDto.creditHistory) {
    throw new Error('Credit History DTO is required');
  }

  const exposureId = crypto.randomUUID();
  const raw = creditHistoryDto.creditHistory;

  return {
    exposureId,
    debiturId,
    summary: {
      totalFasilitas: raw.summary.totalFasilitas,
      totalPlafon: raw.summary.totalPlafon,
      totalBakiDebet: raw.summary.totalBakiDebet,
      kolektibilitasTertinggi: raw.summary.kolektibilitasTertinggi
    },
    facilities: raw.facilities.map(fac => ({
      bank: fac.bank,
      plafon: fac.plafon,
      bakiDebet: fac.bakiDebet,
      kolektibilitas: fac.kolektibilitas,
      jatuhTempo: fac.jatuhTempo
    })),
    metadata: {
      assembledAt: new Date().toISOString(),
      sources: [creditHistoryDto.documentId]
    }
  };
}

module.exports = {
  assembleCreditExposure
};
