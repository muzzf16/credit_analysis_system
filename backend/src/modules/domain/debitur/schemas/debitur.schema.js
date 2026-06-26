const Joi = require('joi');

const identitySchema = Joi.object({
  nik: Joi.string().length(16).required(),
  namaLengkap: Joi.string().required(),
  tempatLahir: Joi.string().allow(null, ''),
  tanggalLahir: Joi.date().iso().allow(null, ''),
  jenisKelamin: Joi.string().valid('L', 'P').allow(null, ''),
  agama: Joi.string().allow(null, ''),
  statusPerkawinan: Joi.string().allow(null, '')
});

const addressSchema = Joi.object({
  alamatLengkap: Joi.string().allow(null, ''),
  rt: Joi.string().allow(null, ''),
  rw: Joi.string().allow(null, ''),
  desa: Joi.string().allow(null, ''),
  kecamatan: Joi.string().allow(null, ''),
  kabupaten: Joi.string().allow(null, ''),
  provinsi: Joi.string().allow(null, '')
});

const employmentSchema = Joi.object({
  pekerjaan: Joi.string().allow(null, ''),
  namaInstansi: Joi.string().allow(null, ''),
  penghasilanBulanan: Joi.number().allow(null)
});

const debiturSchema = Joi.object({
  debiturId: Joi.string().required(),
  identity: identitySchema.required(),
  address: addressSchema.optional(),
  employment: employmentSchema.optional(),
  taxProfile: Joi.object({
    npwp: Joi.string().allow(null, '')
  }).optional(),
  contact: Joi.object({
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().allow(null, '')
  }).optional(),
  metadata: Joi.object().optional()
});

module.exports = {
  debiturSchema,
  identitySchema,
  addressSchema,
  employmentSchema
};
