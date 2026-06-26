/**
 * Policy Lifecycle State Machine
 * 
 * Defines the valid states and transitions for a PolicyPack.
 * States: DRAFT → REVIEW → APPROVED → ACTIVE → SUSPENDED → ARCHIVED
 */

const PolicyStates = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED'
};

const PolicyTransitions = {
  [PolicyStates.DRAFT]: [PolicyStates.REVIEW],
  [PolicyStates.REVIEW]: [PolicyStates.APPROVED, PolicyStates.DRAFT], // Draft if rejected
  [PolicyStates.APPROVED]: [PolicyStates.ACTIVE, PolicyStates.ARCHIVED], // Archived if cancelled before active
  [PolicyStates.ACTIVE]: [PolicyStates.SUSPENDED, PolicyStates.ARCHIVED],
  [PolicyStates.SUSPENDED]: [PolicyStates.ACTIVE, PolicyStates.ARCHIVED],
  [PolicyStates.ARCHIVED]: [] // Terminal state
};

class LifecycleMachine {
  constructor(initialState = PolicyStates.DRAFT) {
    if (!Object.values(PolicyStates).includes(initialState)) {
      throw new Error(`Invalid initial state: ${initialState}`);
    }
    this._state = initialState;
    this._history = [{ state: initialState, timestamp: new Date().toISOString() }];
  }

  get state() {
    return this._state;
  }

  get history() {
    return [...this._history];
  }

  canTransitionTo(nextState) {
    const allowed = PolicyTransitions[this._state] || [];
    return allowed.includes(nextState);
  }

  transitionTo(nextState, reason = null) {
    if (!this.canTransitionTo(nextState)) {
      throw new Error(`Invalid transition from ${this._state} to ${nextState}`);
    }

    this._state = nextState;
    this._history.push({
      state: nextState,
      timestamp: new Date().toISOString(),
      reason
    });

    return this._state;
  }

  isActive() {
    return this._state === PolicyStates.ACTIVE;
  }
}

module.exports = {
  PolicyStates,
  PolicyTransitions,
  LifecycleMachine
};
