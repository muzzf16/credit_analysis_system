function evaluateCapabilities(agunanEntity) {
  const capabilities = {
    specification: 'MISSING',
    ownership: 'MISSING',
    valuation: 'MISSING'
  };

  if (agunanEntity?.spesifikasi?.nomorSertifikat && agunanEntity?.spesifikasi?.luas) {
    capabilities.specification = 'READY';
  }

  if (agunanEntity?.ownership?.namaPemegangHak) {
    capabilities.ownership = 'READY';
  }

  if (agunanEntity?.valuation?.nilaiTaksasi) {
    capabilities.valuation = 'READY';
  }

  return { capabilities };
}

module.exports = evaluateCapabilities;
