const fs = require('fs');
const path = require('path');

const { PipelinePlan, instance: pipelineRegistry } = require('../../decision/pipeline/registry/pipeline.registry');
const { instance: profileRegistry } = require('../../profiles/registry/profile.registry');
const { instance: stageRegistry } = require('../../rules/stage/registry/stage.registry');
const { instance: ruleRegistry } = require('../../rules/registry/rule.registry');
const { instance: extractorRegistry } = require('../../facts/registry/extractor.registry');
const { instance: factDefinitionRegistry } = require('../../facts/registry/definition.registry');
const { instance: capabilityDefinitionRegistry } = require('../../capabilities/registry/definition.registry');
const { instance: capabilityEvaluatorRegistry } = require('../../capabilities/registry/evaluator.registry');
const { instance: decisionFactDefinitionRegistry } = require('../../decision-facts/registry/definition.registry');
const { instance: decisionFactProjectorRegistry } = require('../../decision-facts/registry/projector.registry');
const { instance: intentDefinitionRegistry } = require('../../decision-intent/registry/definition.registry');
const { instance: intentProjectorRegistry } = require('../../decision-intent/registry/projector.registry');

const FinancialStage = require('../../rules/stage/financial/FinancialStage');
const DSRMaximumRule = require('../../rules/library/financial/DSRMaximumRule');
const DSRFormula = require('../../rules/formulas/financial/DSR.formula');
const { instance: formulaRegistry } = require('../../rules/registry/formula.registry');
const FinancialFactsExtractor = require('../../facts/extractors/financial/FinancialFactsExtractor');
const FinancialCapabilityEvaluator = require('../../capabilities/evaluators/FinancialCapabilityEvaluator');
const FinancialEligibilityProjector = require('../../decision-facts/projectors/FinancialEligibilityProjector');
const StandardIntentProjector = require('../../decision-intent/projectors/StandardIntentProjector');

let _bootstrapped = false;

/**
 * Bootstrap registries required for the Credit Decision Platform v1.0 pipeline.
 * Idempotent — safe to call multiple times.
 */
function bootstrapDecisionPlatform() {
  if (_bootstrapped) return;

  // Pipeline plan
  const planPath = path.join(__dirname, '../../decision/plans/productive.plan.json');
  if (!pipelineRegistry.get('PRODUCTIVE_STANDARD')) {
    const planData = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    pipelineRegistry.register(new PipelinePlan(planData));
  }

  // Stage profiles
  const profileDir = path.join(__dirname, '../../profiles/fixtures');
  profileRegistry.loadFromDirectory(profileDir);

  // Stages & rules
  if (!stageRegistry.get('FINANCIAL')) stageRegistry.register(FinancialStage);
  if (!ruleRegistry.get('DSR_MAX')) ruleRegistry.register(DSRMaximumRule);
  if (!formulaRegistry.get('DSR')) formulaRegistry.register(DSRFormula);

  // Facts
  factDefinitionRegistry.loadFromDirectory(
    path.join(__dirname, '../../facts/definitions')
  );
  if (!extractorRegistry.get('FINANCIAL')) {
    extractorRegistry.register(FinancialFactsExtractor);
  }

  // Capabilities
  capabilityDefinitionRegistry.loadFromDirectory(
    path.join(__dirname, '../../capabilities/definitions')
  );
  if (!capabilityEvaluatorRegistry.get('FINANCIAL')) {
    capabilityEvaluatorRegistry.register(FinancialCapabilityEvaluator);
  }

  // Decision facts
  decisionFactDefinitionRegistry.loadFromDirectory(
    path.join(__dirname, '../../decision-facts/definitions')
  );
  if (!decisionFactProjectorRegistry.get('FINANCIAL_ELIGIBILITY')) {
    decisionFactProjectorRegistry.register(FinancialEligibilityProjector);
  }

  // Decision intent
  intentDefinitionRegistry.loadFromDirectory(
    path.join(__dirname, '../../decision-intent/definitions')
  );
  if (!intentProjectorRegistry.get('STANDARD_INTENT')) {
    intentProjectorRegistry.register(StandardIntentProjector);
  }

  _bootstrapped = true;
}

function resetBootstrap() {
  _bootstrapped = false;
}

module.exports = {
  bootstrapDecisionPlatform,
  resetBootstrap,
};
