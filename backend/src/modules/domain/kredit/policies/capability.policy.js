function evaluateCapabilities(creditExposureEntity) {
  const capabilities = {
    summary: 'MISSING',
    facilities: 'MISSING',
    risk: 'UNKNOWN'
  };

  if (creditExposureEntity?.summary?.totalPlafon !== undefined) {
    capabilities.summary = 'READY';
  }

  if (Array.isArray(creditExposureEntity?.facilities) && creditExposureEntity.facilities.length > 0) {
    capabilities.facilities = 'READY';
  }

  // Determine risk level based on Kolektibilitas
  const kol = creditExposureEntity?.summary?.kolektibilitasTertinggi;
  if (kol === 1) {
    capabilities.risk = 'LOW';
  } else if (kol === 2) {
    capabilities.risk = 'MEDIUM';
  } else if (kol > 2) {
    capabilities.risk = 'HIGH';
  }

  return { capabilities };
}

module.exports = evaluateCapabilities;
