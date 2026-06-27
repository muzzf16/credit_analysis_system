const { instance: promptDefinitionRegistry } = require('../registry/definition.registry');

class PromptBuilder {
  static build(promptContext, promptDefinitionCode) {
    const definition = promptDefinitionRegistry.get(promptDefinitionCode);
    if (!definition) {
      throw new Error(`Prompt definition not found: ${promptDefinitionCode}`);
    }

    const contextData = promptContext.toJSON();
    const rendered = {
      system: definition.system,
      developer: definition.developer,
      user: PromptBuilder._renderTemplate(definition.userTemplate, contextData, definition),
      metadata: {
        promptDefinition: definition.code,
        version: definition.version,
        locale: definition.locale,
        analysisMode: definition.analysisMode,
        targetAudience: definition.targetAudience,
      },
    };

    return rendered;
  }

  static _renderTemplate(template, context, definition) {
    let result = template;

    // Handle high-level composite templates first
    const generators = {
      'financialAnalysis': PromptBuilder._generateFinancialAnalysis(context),
      'collateralAnalysis': PromptBuilder._generateCollateralAnalysis(context),
      'riskAssessment': PromptBuilder._generateRiskAssessment(context),
      'strengths': context.strengths || 'Belum tersedia',
      'weaknesses': context.weaknesses || 'Belum tersedia',
      'mitigation': context.mitigation || 'Belum tersedia',
      'appendix': context.appendix ? JSON.stringify(context.appendix) : 'Belum tersedia',
    };

    for (const [key, val] of Object.entries(generators)) {
      result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val);
    }

    // Parse all other properties and apply formatting filters
    result = result.replace(/{{\s*([^}]+?)\s*}}/g, (match, pathAndFilter) => {
      const parts = pathAndFilter.split('|').map(p => p.trim());
      const path = parts[0];
      const filter = parts[1];

      let value = PromptBuilder._getValueByPath(context, path);

      // Special fallback if borrower paths are not populated directly in the context
      if ((value === undefined || value === null) && path.startsWith('borrower.')) {
        const field = path.split('.')[1];
        if (field === 'name') {
          value = context.summary?.assessmentId || 'N/A';
        } else {
          value = 'N/A';
        }
      }

      if (value === undefined || value === null) {
        value = 'N/A';
      }

      if (filter === 'formatRupiah') {
        return PromptBuilder._formatRupiah(Number(value) || 0);
      }

      return typeof value === 'number' ? String(value) : value;
    });

    return result;
  }

  static _getValueByPath(obj, path) {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  static _formatRupiah(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  static _generateFinancialAnalysis(context) {
    const facts = context.facts || {};
    return `Pendapatan: Rp ${PromptBuilder._formatRupiah(facts.income || 0)}, Cicilan: Rp ${PromptBuilder._formatRupiah(facts.installment || 0)}`;
  }

  static _generateCollateralAnalysis(context) {
    const caps = context.capabilities || {};
    return caps.collateral ? `Collateral: ${caps.collateral.secured ? 'Tersedia' : 'Tidak tersedia'}` : 'Tidak ada data agunan';
  }

  static _generateRiskAssessment(context) {
    return `Level risiko: ${context.risk?.level || 'N/A'}`;
  }
}

module.exports = PromptBuilder;