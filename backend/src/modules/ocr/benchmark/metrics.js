class Metrics {
  /**
   * Calculates Levenshtein distance between two strings
   */
  static levenshteinDistance(a, b) {
    if (!a) return b ? b.length : 0;
    if (!b) return a.length;
    
    a = a.toLowerCase();
    b = b.toLowerCase();
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(matrix[i][j - 1] + 1, // insertion
                     matrix[i - 1][j] + 1) // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Returns a similarity score between 0 and 100
   */
  static stringSimilarity(a, b) {
    if (!a && !b) return 100;
    if (!a || !b) return 0;
    const distance = this.levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return Math.max(0, (1 - distance / maxLen) * 100);
  }
}

module.exports = Metrics;
