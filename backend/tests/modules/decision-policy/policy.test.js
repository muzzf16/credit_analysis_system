"use strict";
const { test, describe } = require('node:test');
const assert = require('node:assert');
const OverrideDomain = require('../../../src/modules/decision-policy/entities/OverrideDomain');
const DecisionPolicy = require('../../../src/modules/decision-policy/entities/DecisionPolicy');
const AuthorityPolicy = require('../../../src/modules/decision-policy/authority/AuthorityPolicy');
const DecisionPolicyBuilder = require('../../../src/modules/decision-policy/builder/DecisionPolicyBuilder');

describe('Decision Policy Platform Tests', () => {
  describe('AuthorityPolicy Constraint', () => {
    test('Should resolve to BRANCH_MANAGER for 50M limit', () => {
      const auth = AuthorityPolicy.evaluate({ loanAmount: 50000000 }, {});
      assert.strictEqual(auth, 'BRANCH_MANAGER');
    });

    test('Should resolve to CREDIT_COMMITTEE for 300M limit', () => {
      const auth = AuthorityPolicy.evaluate({ loanAmount: 300000000 }, {});
      assert.strictEqual(auth, 'CREDIT_COMMITTEE');
    });

    test('Should resolve to BOARD_OF_DIRECTORS for 800M limit', () => {
      const auth = AuthorityPolicy.evaluate({ loanAmount: 800000000 }, {});
      assert.strictEqual(auth, 'BOARD_OF_DIRECTORS');
    });
  });

  describe('DecisionPolicy Entity', () => {
    test('Should enforce immutability', () => {
      const override = new OverrideDomain({ enabled: false });
      const policy = new DecisionPolicy({
        authority: 'BRANCH_MANAGER',
        escalation: { escalated: false },
        override: override,
        conditions: [],
        committeeRules: { requiredQuorum: 3 }
      });
      
      assert.strictEqual(Object.isFrozen(policy), true);
      assert.strictEqual(Object.isFrozen(policy.escalation), true);
      assert.strictEqual(Object.isFrozen(policy.conditions), true);
    });
  });

  describe('DecisionPolicyBuilder E2E', () => {
    test('Should build fully aggregated Governance Policy', () => {
      const mockContext = {
        loanAmount: 200000000,
        businessAgeYears: 1 // Trigger escalation
      };
      
      const mockIntent = {
        recommendation: 'APPROVE',
        riskLevel: 'LOW',
        conditions: []
      };

      const policy = DecisionPolicyBuilder.build(mockContext, mockIntent);
      
      assert.strictEqual(policy.authority, 'CREDIT_COMMITTEE');
      assert.strictEqual(policy.escalation.escalated, true);
      assert.strictEqual(policy.override.enabled, false);
      assert.strictEqual(policy.conditions.length, 1); // STANDARD_ADMIN_FEE from ConditionPolicy
      assert.strictEqual(policy.committeeRules.requiredQuorum, 3);
    });
  });
});
