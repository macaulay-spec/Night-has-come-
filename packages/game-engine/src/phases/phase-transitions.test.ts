import { describe, it, expect } from 'vitest';

import { canTransition, PHASE_TRANSITIONS } from './index.js';

describe('Phase Transitions', () => {
  it('allows LOBBY_OPEN → LOBBY_READY_CHECK', () => {
    expect(canTransition('LOBBY_OPEN', 'LOBBY_READY_CHECK')).toBe(true);
  });

  it('allows ASSIGNMENT → ORIENTATION', () => {
    expect(canTransition('ASSIGNMENT', 'ORIENTATION')).toBe(true);
  });

  it('allows BLACKOUT_OPEN → BLACKOUT_LOCKED', () => {
    expect(canTransition('BLACKOUT_OPEN', 'BLACKOUT_LOCKED')).toBe(true);
  });

  it('allows DISCUSSION → NOMINATION', () => {
    expect(canTransition('DISCUSSION', 'NOMINATION')).toBe(true);
  });

  it('allows NOMINATION → DEFENSE', () => {
    expect(canTransition('NOMINATION', 'DEFENSE')).toBe(true);
  });

  it('allows VOTE_OPEN → VOTE_LOCKED', () => {
    expect(canTransition('VOTE_OPEN', 'VOTE_LOCKED')).toBe(true);
  });

  it('allows WIN_CHECK → RESULTS', () => {
    expect(canTransition('WIN_CHECK', 'RESULTS')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('LOBBY_OPEN', 'BLACKOUT_OPEN')).toBe(false);
    expect(canTransition('DISCUSSION', 'BLACKOUT_OPEN')).toBe(false);
    expect(canTransition('RESULTS', 'DISCUSSION')).toBe(false);
  });

  it('RESULTS has no outgoing transitions', () => {
    expect(PHASE_TRANSITIONS.RESULTS).toEqual([]);
  });

  it('VOIDED_MATCH has no outgoing transitions', () => {
    expect(PHASE_TRANSITIONS.VOIDED_MATCH).toEqual([]);
  });

  it('every declared phase has transition rules', () => {
    const phases = Object.keys(PHASE_TRANSITIONS);
    expect(phases.length).toBeGreaterThanOrEqual(15);
    for (const phase of phases) {
      expect(Array.isArray(PHASE_TRANSITIONS[phase as keyof typeof PHASE_TRANSITIONS])).toBe(true);
    }
  });
});
