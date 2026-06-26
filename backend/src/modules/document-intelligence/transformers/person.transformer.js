const BaseTransformer = require('./base.transformer');

class PersonTransformer extends BaseTransformer {
  static transform(pipelineResult) {
    const businessObj = this.getBaseStructure(pipelineResult);
    const data = pipelineResult.data || {};
    
    // We construct the Person domain entity from various possible document inputs (ktp, kitas, etc.)
    businessObj.person = {
      nik: data.nik || null,
      namaLengkap: data.nama || null,
      jenisKelamin: data.jenisKelamin || null,
      tempatLahir: data.tempatLahir || null,
      tanggalLahir: data.tanggalLahir || null,
      alamat: data.alamat || null,
      agama: data.agama || null,
      statusPerkawinan: data.statusPerkawinan || null,
      pekerjaan: data.pekerjaan || null,
      kewarganegaraan: data.kewarganegaraan || null
    };

    // Domain validation logic
    let isDataComplete = true;
    const requiredFields = ['nik', 'namaLengkap'];
    requiredFields.forEach(field => {
      if (!businessObj.person[field]) {
        isDataComplete = false;
      }
    });

    businessObj.validation.isDataComplete = isDataComplete;
    businessObj.validation.isNikFormatValid = businessObj.person.nik && /^\d{16}$/.test(businessObj.person.nik);
    
    return businessObj;
  }
}

module.exports = PersonTransformer;
