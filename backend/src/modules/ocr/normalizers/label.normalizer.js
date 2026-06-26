const fs = require('fs');
const path = require('path');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class LabelNormalizer {
  /**
   * Normalizes ONLY the labels in the raw OCR text using document-specific dictionaries
   * @param {OCRContext} context 
   */
  static normalize(context) {
    const docType = context.documentType;
    let text = context.rawText;
    const corrections = [];
    
    try {
      const dictPath = path.join(__dirname, '../knowledge/dictionary', `${docType}.json`);
      if (fs.existsSync(dictPath)) {
        const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
        if (dict.labels) {
          for (const [badLabel, goodLabel] of Object.entries(dict.labels)) {
            // We want to match the label if it's treated as a label, meaning:
            // 1. It is preceded by a newline or whitespace
            // 2. It is followed by optional whitespace, then a colon, semicolon, equals sign, newline, or end of string
            const escaped = escapeRegExp(badLabel);
            // using negative lookbehind for non-whitespace to act like a robust \b, 
            // and lookahead for our label delimiters
            const regex = new RegExp(`(?<=^|\\s)${escaped}(?=\\s*(?:[:;=]|\\n|$))`, 'gi');
            
            const matches = text.match(regex);
            if (matches && matches.length > 0) {
              text = text.replace(regex, goodLabel);
              corrections.push({
                from: badLabel,
                to: goodLabel,
                count: matches.length
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('LabelNormalizer failed to load or parse dictionary:', e);
    }
    
    context.rawText = text;
    context.metadata.corrections = corrections;
  }
}

module.exports = LabelNormalizer;
