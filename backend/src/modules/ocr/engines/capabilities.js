const EngineCapabilities = {
  tesseract: {
    name: 'tesseract',
    version: '5.5.0', // matching manifest version
    image: true,
    pdf: false,
    multiline: true,
    table: false,
    confidence: true
  },
  pdfText: {
    name: 'pdfText',
    version: '2.0.0', // matching manifest version
    image: false,
    pdf: true,
    multiline: true,
    table: false,
    confidence: false
  }
  // Future engines like GLM, Paddle can be added here
};

module.exports = EngineCapabilities;
