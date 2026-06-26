const Joi = require('joi');

const facilitySchema = Joi.object({
  bank: Joi.string().required(),
  plafon: Joi.number().min(0).required(),
  bakiDebet: Joi.number().min(0).required(),
  kolektibilitas: Joi.number().min(1).max(5).required(),
  jatuhTempo: Joi.date().iso().allow(null, '')
});

const creditExposureSchema = Joi.object({
  exposureId: Joi.string().required(),
  debiturId: Joi.string().required(),
  summary: Joi.object({
    totalFasilitas: Joi.number().min(0).required(),
    totalPlafon: Joi.number().min(0).required(),
    totalBakiDebet: Joi.number().min(0).required(),
    kolektibilitasTertinggi: Joi.number().min(1).max(5).required()
  }).required(),
  facilities: Joi.array().items(facilitySchema).required(),
  metadata: Joi.object().optional()
});

module.exports = {
  creditExposureSchema
};
