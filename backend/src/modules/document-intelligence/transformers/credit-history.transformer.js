const BaseTransformer = require('./base.transformer');

class CreditHistoryTransformer extends BaseTransformer {
  static transform(pipelineResult) {
    const businessObj = this.getBaseStructure(pipelineResult);
    const data = pipelineResult.data || {};
    
    // Construct CreditHistory domain entity from SLIK or other BI Checking docs
    businessObj.creditHistory = {
      summary: {
        totalFasilitas: data.totalFasilitas || 0,
        totalPlafon: data.totalPlafon || 0,
        totalBakiDebet: data.totalBakiDebet || 0,
        kolektibilitasTertinggi: data.kolektibilitasTertinggi || null
      },
      facilities: (data.detailSlik || []).map(fac => ({
        bank: fac.bank,
        plafon: fac.plafon,
        bakiDebet: fac.bakiDebet,
        kolektibilitas: fac.kolektibilitas,
        jatuhTempo: fac.jatuhTempo
      }))
    };

    // Domain validation
    businessObj.validation.isDataComplete = businessObj.creditHistory.facilities.length === businessObj.creditHistory.summary.totalFasilitas;
    businessObj.validation.hasBadCredit = businessObj.creditHistory.summary.kolektibilitasTertinggi > 2;

    return businessObj;
  }
}

module.exports = CreditHistoryTransformer;
