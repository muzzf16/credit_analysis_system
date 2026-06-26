const fs = require('fs');
const path = require('path');

class AuthorityPolicy {
  static evaluate(assessmentContext, decisionIntent) {
    const matrixPath = path.join(__dirname, 'authority-matrix.json');
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

    const requestedLimit = assessmentContext.loanAmount || 0;

    let selectedAuthority = 'BOARD_OF_DIRECTORS'; // Fallback to highest

    for (const rule of matrix) {
      if (rule.maxLimit === null || requestedLimit <= rule.maxLimit) {
        selectedAuthority = rule.authority;
        break;
      }
    }

    return selectedAuthority;
  }
}

module.exports = AuthorityPolicy;
