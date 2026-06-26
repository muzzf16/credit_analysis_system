const OCRService = require('../../ocr/services/ocr.service');
const PersonTransformer = require('../transformers/person.transformer');
const CollateralTransformer = require('../transformers/collateral.transformer');
const CreditHistoryTransformer = require('../transformers/credit-history.transformer');

class DocumentIntelligenceController {
  
  static async extractPerson(req, res) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
      const type = req.body.type || 'ktp'; // Could be ktp, kitas, passport
      
      const pipelineResult = await OCRService.processOCR(req.file.buffer, type, req.file.mimetype);
      const businessObject = PersonTransformer.transform(pipelineResult);
      
      res.status(200).json({ success: true, data: businessObject });
    } catch (error) {
      console.error('DocumentIntelligence Person Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada ekstraksi Person' });
    }
  }

  static async extractCollateral(req, res) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
      const type = req.body.type || 'shm'; 
      
      const pipelineResult = await OCRService.processOCR(req.file.buffer, type, req.file.mimetype);
      const businessObject = CollateralTransformer.transform(pipelineResult);
      
      res.status(200).json({ success: true, data: businessObject });
    } catch (error) {
      console.error('DocumentIntelligence Collateral Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada ekstraksi Collateral' });
    }
  }

  static async extractCreditHistory(req, res) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
      const type = req.body.type || 'slik'; 
      
      const pipelineResult = await OCRService.processOCR(req.file.buffer, type, req.file.mimetype);
      const businessObject = CreditHistoryTransformer.transform(pipelineResult);
      
      res.status(200).json({ success: true, data: businessObject });
    } catch (error) {
      console.error('DocumentIntelligence CreditHistory Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada ekstraksi Credit History' });
    }
  }

}

module.exports = DocumentIntelligenceController;
