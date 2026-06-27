class HtmlRenderer {
  render(makDocument) {
    return {
      format: 'html',
      content: this._generateHtmlContent(makDocument),
      metadata: { generatedAt: makDocument.generatedAt },
    };
  }

  _generateHtmlContent(doc) {
    return `
<!DOCTYPE html>
<html>
<head><title>Memorandum Analisa Kredit</title></head>
<body>
  <h1>Memorandum Analisa Kredit</h1>
  <h2>Ringkasan Eksekutif</h2>
  <p>${doc.executiveSummary}</p>
  <h2>Analisis Keuangan</h2>
  <p>${doc.financialAnalysis}</p>
  <h2>Rekomendasi</h2>
  <p>${doc.recommendation}</p>
</body>
</html>
    `.trim();
  }
}

module.exports = HtmlRenderer;