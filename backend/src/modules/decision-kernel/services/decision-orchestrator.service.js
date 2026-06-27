const PipelineEngine = require('../../decision/pipeline/PipelineEngine');
const FactsBuilder = require('../../facts/builder/FactsBuilder');
const CapabilityBuilder = require('../../capabilities/builder/CapabilityBuilder');
const DecisionFactsProjector = require('../../decision-facts/builder/DecisionFactsProjector');
const DecisionIntentBuilder = require('../../decision-intent/builder/DecisionIntentBuilder');
const DecisionPolicyBuilder = require('../../decision-policy/builder/DecisionPolicyBuilder');
const DecisionRevisionService = require('../services/decision-revision.service');
const { bootstrapDecisionPlatform } = require('../bootstrap/decision-platform.bootstrap');

const DEFAULT_PIPELINE = 'PRODUCTIVE_STANDARD';
const DEFAULT_INTENT_CODE = 'STANDARD_INTENT';

/**
 * DecisionOrchestrator
 * Executes the full deterministic decision chain:
 * Pipeline → Facts → Capabilities → DecisionFacts → Intent → Policy → Kernel
 */
class DecisionOrchestrator {
  /**
   * @param {Object} assessmentContext
   * @param {Object} [options]
   * @param {string} [options.pipelinePlan]
   * @param {string} [options.intentCode]
   * @param {string} [options.correlationId]
   * @returns {{ kernel, revision, pipelineResult, factCollection, capabilityCollection, decisionFactsCollection, intent, policy }}
   */
  static execute(assessmentContext, options = {}) {
    bootstrapDecisionPlatform();

    const pipelinePlan = options.pipelinePlan || DEFAULT_PIPELINE;
    const intentCode = options.intentCode || DEFAULT_INTENT_CODE;
    const policyContext = DecisionOrchestrator._enrichPolicyContext(assessmentContext);

    const pipelineResult = PipelineEngine.execute({
      assessment: DecisionOrchestrator._buildPipelineAssessment(assessmentContext),
      policy: {
        pipelinePlan,
        version: '1.0.0',
        fingerprint: assessmentContext.policy?.fingerprint || 'unknown',
      },
      execution: {
        correlationId: options.correlationId || assessmentContext.assessmentId,
        startedAt: new Date().toISOString(),
      },
    });

    const factCollection = FactsBuilder.build(pipelineResult);
    const capabilityCollection = CapabilityBuilder.build(factCollection);
    const decisionFactsCollection = DecisionFactsProjector.build(capabilityCollection);
    const intent = DecisionIntentBuilder.build(intentCode, decisionFactsCollection);
    const policy = DecisionPolicyBuilder.build(policyContext, intent);

    const { kernel, revision } = DecisionRevisionService.createInitial(
      assessmentContext,
      intent,
      policy,
      'DecisionRequested',
      options.correlationId || null
    );

    return {
      kernel,
      revision,
      pipelineResult,
      factCollection,
      capabilityCollection,
      decisionFactsCollection,
      intent,
      policy,
    };
  }

  static _enrichPolicyContext(assessmentContext) {
    const snapshot = assessmentContext.caseSnapshot || {};
    const application = snapshot.data?.application || {};
    return {
      ...assessmentContext,
      loanAmount: application.plafon || application.loanAmount || 0,
      businessAgeYears: application.businessAgeYears || snapshot.data?.usaha?.lamaUsaha || 5,
      manualOverride: assessmentContext.manualOverride || null,
    };
  }

  static _buildPipelineAssessment(assessmentContext) {
    const snapshot = assessmentContext.caseSnapshot || {};
    const application = snapshot.data?.application || {};
    return {
      income: application.penghasilan || application.income || 10_000_000,
      installment: application.angsuran_perbulan || application.installment || 2_000_000,
      assessmentId: assessmentContext.assessmentId,
    };
  }
}

module.exports = DecisionOrchestrator;
