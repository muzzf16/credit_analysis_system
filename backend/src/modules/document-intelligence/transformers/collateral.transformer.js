const BaseTransformer = require('./base.transformer');

class CollateralTransformer extends BaseTransformer {
  static transform(pipelineResult) {
    const businessObj = this.getBaseStructure(pipelineResult);
    const data = pipelineResult.data || {};
    
    // Construct Collateral domain entity from SHM, SHGB, etc.
    businessObj.collateral = {
      jenisSertifikat: pipelineResult.type.toUpperCase() || null, // e.g., SHM
      nomorSertifikat: data.nomorHakMilik || null,
      provinsi: data.provinsi || null,
      kabupaten: data.kabupaten || null,
      kecamatan: data.kecamatan || null,
      desa: data.desa || null,
      nomorSuratUkur: data.suratUkur || null,
      luas: data.luas || null,
      namaPemegangHak: data.namaPemegangHak || null
    };

    // Domain validation
    let isDataComplete = true;
    const requiredFields = ['nomorSertifikat', 'luas'];
    requiredFields.forEach(field => {
      if (!businessObj.collateral[field]) {
        isDataComplete = false;
      }
    });

    businessObj.validation.isDataComplete = isDataComplete;
    businessObj.validation.isReadyForAppraisal = isDataComplete && !!businessObj.collateral.luas;

    return businessObj;
  }
}

module.exports = CollateralTransformer;
