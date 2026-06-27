const DecisionKernelBuilder = require('../builder/DecisionKernelBuilder');
const DecisionRevision = require('../entities/DecisionRevision');
const { DecisionEvents } = require('../events/decision.events');

/**
 * DecisionRevisionService
 * Creates new immutable DecisionKernel revisions — never mutates prior versions.
 */
class DecisionRevisionService {
  /**
   * Create the first DecisionKernel (V1) from assessment + intent + policy.
   */
  static createInitial(assessmentContext, decisionIntent, decisionPolicy, trigger = 'DecisionRequested', correlationId = null) {
    const kernel = DecisionKernelBuilder.build(assessmentContext, decisionIntent, decisionPolicy, {
      revision: 1,
    });

    const revision = new DecisionRevision({
      revisionId: kernel.revisionId,
      decisionId: kernel.decisionId,
      revision: 1,
      previousRevisionId: null,
      assessmentId: kernel.assessmentId,
      trigger,
      createdAt: kernel.audit.createdAt,
      kernelFingerprint: kernel.audit.fingerprints.decision,
      correlationId,
    });

    return { kernel, revision, eventType: DecisionEvents.DECISION_KERNEL_CREATED };
  }

  /**
   * Create a new revision (V2, V3, ...) from updated intent/policy context.
   * Previous kernel remains immutable.
   */
  static createRevision(previousKernel, assessmentContext, decisionIntent, decisionPolicy, trigger = 'DecisionRevisionCreated', correlationId = null) {
    if (!previousKernel) {
      throw new Error('DecisionRevisionService.createRevision requires a previous DecisionKernel.');
    }

    const nextRevision = previousKernel.revision + 1;
    const kernel = DecisionKernelBuilder.build(assessmentContext, decisionIntent, decisionPolicy, {
      decisionId: previousKernel.decisionId,
      revision: nextRevision,
      previousRevisionId: previousKernel.revisionId,
    });

    const revision = new DecisionRevision({
      revisionId: kernel.revisionId,
      decisionId: kernel.decisionId,
      revision: nextRevision,
      previousRevisionId: previousKernel.revisionId,
      assessmentId: kernel.assessmentId,
      trigger,
      createdAt: kernel.audit.createdAt,
      kernelFingerprint: kernel.audit.fingerprints.decision,
      correlationId,
    });

    return { kernel, revision, eventType: DecisionEvents.DECISION_REVISION_CREATED };
  }
}

module.exports = DecisionRevisionService;
