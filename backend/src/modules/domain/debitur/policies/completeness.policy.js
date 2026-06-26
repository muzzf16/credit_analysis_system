/**
 * Completeness Policy for Debitur
 * Pure function that determines the percentage of completeness
 * @param {Object} debiturEntity - The Debitur object
 * @returns {Object} completeness result
 */
function evaluateCompleteness(debiturEntity) {
  const missing = [];
  let totalScore = 0;
  const totalWeight = 100;

  // Identity logic
  if (debiturEntity?.identity?.nik) {
    totalScore += 25;
  } else {
    missing.push('identity.nik');
  }

  if (debiturEntity?.identity?.namaLengkap) {
    totalScore += 25;
  } else {
    missing.push('identity.namaLengkap');
  }

  // Employment logic
  if (debiturEntity?.employment?.pekerjaan) {
    totalScore += 20;
  } else {
    missing.push('employment.pekerjaan');
  }

  // Tax logic
  if (debiturEntity?.taxProfile?.npwp) {
    totalScore += 15;
  } else {
    missing.push('taxProfile.npwp');
  }

  // Contact logic
  if (debiturEntity?.contact?.phone) {
    totalScore += 15;
  } else {
    missing.push('contact.phone');
  }

  return {
    entity: 'Debitur',
    completeness: totalScore,
    missing: missing
  };
}

module.exports = evaluateCompleteness;
