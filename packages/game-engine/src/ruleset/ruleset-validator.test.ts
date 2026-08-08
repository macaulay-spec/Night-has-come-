import { describe, it, expect } from 'vitest';

import { validateRuleset, STANDARD_RULESET } from './index.js';
import type { Ruleset } from './index.js';

describe('Ruleset Validator', () => {
  it('accepts valid standard ruleset', () => {
    const result = validateRuleset(STANDARD_RULESET);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects rulesets with min players < 6', () => {
    const ruleset: Ruleset = { ...STANDARD_RULESET, minPlayers: 4 };
    const result = validateRuleset(ruleset);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum players must be at least 6');
  });

  it('rejects rulesets with max players > 30', () => {
    const ruleset: Ruleset = { ...STANDARD_RULESET, maxPlayers: 50 };
    const result = validateRuleset(ruleset);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Maximum players cannot exceed 30');
  });

  it('rejects rulesets with min > max', () => {
    const ruleset: Ruleset = { ...STANDARD_RULESET, minPlayers: 15, maxPlayers: 10 };
    const result = validateRuleset(ruleset);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum players cannot exceed maximum players');
  });

  it('warns about excessive investigation roles', () => {
    const ruleset: Ruleset = {
      ...STANDARD_RULESET,
      roleDistribution: [
        { faction: 'CIVIC', count: 5, allowedRoles: ['civic:witness', 'civic:signal-keeper', 'civic:echo-reader'] },
        { faction: 'CIVIC', count: 1, allowedRoles: ['civic:bulwark'] },
        { faction: 'VEIL', count: 4, allowedRoles: ['veil:veilblade'] },
      ],
    };
    const result = validateRuleset(ruleset);
    // Should warn about excessive investigation (5/10 = 50%)
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('investigation'))).toBe(true);
  });
});
