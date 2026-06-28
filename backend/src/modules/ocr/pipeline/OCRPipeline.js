const OCRContext = require('./OCRContext');
const PipelineResult = require('./PipelineResult');
const EngineFactory = require('../engines/EngineFactory');
const DocumentRegistry = require('../learning/registry/document-registry');
const EventStore = require('../learning/events/event.store');
const ManifestLoader = require('../manifest/manifest.loader');
const crypto = require('crypto');

class OCRPipeline {
  constructor(buffer, documentType, mime) {
    this.buffer = buffer;
    this.documentType = documentType;
    this.mime = mime;
    this.context = null;
    this.manifest = ManifestLoader.load();
  }

  async execute() {
    try {
      await this.validateInput();
      await this.buildContext();
      
      // Fire OCR_STARTED event
      await this.logEvent('OCR_STARTED');
      
      await this.selectEngine();
      
      const engine = this.context.engine;
      
      const preStart = Date.now();
      await engine.preprocess(this.context);
      this.context.timings.preprocessing = Date.now() - preStart;
      
const recStart = Date.now();
       this.context.rawText = await engine.recognize(this.context);
       this.context.timings.recognition = Date.now() - recStart;
       
       // Debug log for OCR text
       console.log(`[OCR DEBUG] Type: ${this.context.documentType}, Raw Text:\n${this.context.rawText}`);
       
       const postStart = Date.now();
       await engine.postprocess(this.context);
       this.context.timings.postprocessing = Date.now() - postStart;
       
       // Store Tesseract confidences before parse overwrites evidence
       if (this.context.tesseractConfidences) {
         this.context._tesseractConfidences = { ...this.context.tesseractConfidences };
       }
       
       await this.normalize();
       await this.parse();
       await this.validateOutput();
      
      this.context.timings.total = Date.now() - this.context.timings.start;
      
      // Fire OCR_COMPLETED event
      await this.logEvent('OCR_COMPLETED');
      
      return this.response();
    } catch (error) {
      console.error('OCR Pipeline failed:', error);
      if (this.context) {
        await this.logEvent('OCR_FAILED', { error: error.message });
      }
      throw error; 
    }
  }

  async validateInput() {
    if (!this.buffer) throw { status: 400, message: 'Buffer file kosong atau tidak valid.' };
    if (!this.documentType) throw { status: 400, message: 'Tipe dokumen wajib ditentukan.' };
  }

  async buildContext() {
    const docReg = DocumentRegistry.register(this.buffer, this.documentType);
    const sessionId = `ocr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    this.context = new OCRContext({
      buffer: this.buffer,
      documentType: this.documentType,
      mime: this.mime,
      sessionId: sessionId,
      documentId: docReg.documentId,
      pipelineFingerprint: this.manifest.fingerprint,
      buildId: this.manifest.buildId
    });
    
    // We store the document hash in metadata for events
    this.context.metadata.documentHash = docReg.hash;
  }
  
  async logEvent(eventType, extraData = {}) {
    if (!this.context) return;
    
    await EventStore.append({
      eventType,
      eventId: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      sessionId: this.context.sessionId,
      pipeline: {
        fingerprint: this.context.pipelineFingerprint,
        buildId: this.context.buildId
      },
      document: {
        documentId: this.context.documentId,
        hash: this.context.metadata.documentHash,
        type: this.context.documentType
      },
      engine: this.context.engine ? {
        name: this.context.engine.constructor.name
      } : null,
      ...extraData
    });
  }

  async selectEngine() {
    this.context.engine = EngineFactory.create(this.context);
  }

  async normalize() {
    const LabelNormalizer = require('../normalizers/label.normalizer');
    LabelNormalizer.normalize(this.context);
  }

  async parse() {
    const { parseDocumentText } = require('../utils/parsers');
    this.context.parsedData = parseDocumentText(this.context.rawText, this.context.documentType);
    
    // SLIK Debugging from original code
    if (this.context.documentType === 'slik') {
      const parsedData = this.context.parsedData;
      const text = this.context.rawText;
      console.log('[OCR SLIK] Parsed result:', JSON.stringify({
        totalFasilitas: parsedData.totalFasilitas,
        totalPlafon: parsedData.totalPlafon,
        totalBakiDebet: parsedData.totalBakiDebet,
        kolektibilitasTertinggi: parsedData.kolektibilitasTertinggi,
        facilities: parsedData.detailSlik?.map(f => ({
          bank: f.bank,
          plafon: f.plafon,
          bakiDebet: f.bakiDebet,
          jatuhTempo: f.jatuhTempo,
          kolektibilitas: f.kolektibilitas
        }))
      }, null, 2));
      
      const busanIdx = text.indexOf('BUSSAN');
      const seaIdx = text.indexOf('SEABANK');
      const sampleIdx = busanIdx >= 0 ? busanIdx : seaIdx >= 0 ? seaIdx : 1000;
      console.log('[OCR SLIK] Text around first bank (±500 chars):\n', 
        text.substring(Math.max(0, sampleIdx - 200), sampleIdx + 600));
      
      require('fs').writeFileSync('/tmp/slik_raw.txt', text);
      console.log('[OCR SLIK] Full raw text saved to /tmp/slik_raw.txt');
    }
  }

  async validateOutput() {
    const EvidenceValidator = require('../validators/evidence.validator');
    this.context.evidence = EvidenceValidator.calculate(this.context);
  }

  response() {
    return new PipelineResult(this.context);
  }
}

module.exports = OCRPipeline;
