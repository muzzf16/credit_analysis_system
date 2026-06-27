class PdfRenderer {
  render(makDocument) {
    return {
      format: 'pdf',
      content: this._generatePdfContent(makDocument),
      metadata: { generatedAt: makDocument.generatedAt },
    };
  }

  _generatePdfContent(doc) {
    return `
MEMORANDUM ANALISA KREDIT
========================

Ringkasan Eksekutif:
${doc.executiveSummary}

Analisis Keuangan:
${doc.financialAnalysis}

Analisis Agunan:
${doc.collateralAnalysis}

Penilaian Risiko:
${doc.riskAssessment}

Kekuatan:
${doc.strengths}

Kelemahan:
${doc.weaknesses}

Mitigasi:
${doc.mitigation}

Rekomendasi:
${doc.recommendation}
    `.trim();
  }
}

module.exports = PdfRenderer;