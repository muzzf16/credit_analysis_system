const Joi = require('joi');

const ownershipSchema = Joi.object({
  namaPemegangHak: Joi.string().required(),
  hubunganDenganDebitur: Joi.string().allow(null, '')
});

const collateralValueSchema = Joi.object({
  nilaiTaksasi: Joi.number().min(0).allow(null),
  nilaiLikuidasi: Joi.number().min(0).allow(null),
  tanggalTaksasi: Joi.date().iso().allow(null, '')
});

const agunanSchema = Joi.object({
  agunanId: Joi.string().required(),
  debiturId: Joi.string().required(),
  jenisAgunan: Joi.string().required(), // SHM, BPKB, dll
  spesifikasi: Joi.object({
    nomorSertifikat: Joi.string().required(),
    luas: Joi.number().allow(null),
    lokasi: Joi.string().allow(null, '')
  }).required(),
  ownership: ownershipSchema.required(),
  valuation: collateralValueSchema.optional(),
  metadata: Joi.object().optional()
});

module.exports = {
  agunanSchema
};
