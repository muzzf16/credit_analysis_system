class DocxRenderer {
  render(makDocument) {
    return {
      format: 'docx',
      content: this._generateDocxContent(makDocument),
      metadata: { generatedAt: makDocument.generatedAt },
    };
  }

  _generateDocxContent(doc) {
    return `
MEMORANDUM ANALISA KREDIT (DOCX FORMAT)
========================================

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

module.exports = DocxRenderer;
