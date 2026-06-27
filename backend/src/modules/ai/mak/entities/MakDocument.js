class MakDocument {
  constructor(narrative) {
    this.executiveSummary = narrative.executiveSummary;
    this.borrowerProfile = narrative.borrowerProfile;
    this.financialAnalysis = narrative.financialAnalysis;
    this.collateralAnalysis = narrative.collateralAnalysis;
    this.riskAssessment = narrative.riskAssessment;
    this.strengths = narrative.strengths;
    this.weaknesses = narrative.weaknesses;
    this.mitigation = narrative.mitigation;
    this.recommendation = narrative.recommendation;
    this.appendix = narrative.appendix || [];
    this.generatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      executiveSummary: this.executiveSummary,
      borrowerProfile: this.borrowerProfile,
      financialAnalysis: this.financialAnalysis,
      collateralAnalysis: this.collateralAnalysis,
      riskAssessment: this.riskAssessment,
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      mitigation: this.mitigation,
      recommendation: this.recommendation,
      appendix: this.appendix,
      generatedAt: this.generatedAt,
    };
  }
}

module.exports = MakDocument;