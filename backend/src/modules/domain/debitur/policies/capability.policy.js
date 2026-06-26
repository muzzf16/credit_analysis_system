/**
 * Capability Policy for Debitur
 * Pure function that determines workflow capabilities (READY vs MISSING)
 * @param {Object} debiturEntity - The Debitur object
 * @returns {Object} capabilities result
 */
function evaluateCapabilities(debiturEntity) {
  const capabilities = {
    identity: 'MISSING',
    financial: 'MISSING',
    contact: 'MISSING'
  };

  // Identity is READY if NIK and Nama are present
  if (debiturEntity?.identity?.nik && debiturEntity?.identity?.namaLengkap) {
    capabilities.identity = 'READY';
  }

  // Financial is READY if employment or tax profile exists
  if (debiturEntity?.employment?.pekerjaan || debiturEntity?.taxProfile?.npwp) {
    capabilities.financial = 'READY';
  }

  // Contact is READY if phone or email exists
  if (debiturEntity?.contact?.phone || debiturEntity?.contact?.email) {
    capabilities.contact = 'READY';
  }

  return { capabilities };
}

module.exports = evaluateCapabilities;
