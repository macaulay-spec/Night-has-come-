import { describe, it, expect } from 'vitest';

import type { GameState } from '../state/index.js';

import { createVoteSession, castVote, lockVote, getMajorityThreshold } from './index.js';

function createMockState(): GameState {
  return {
    gameId: '00000000-0000-0000-0000-000000000001',
    version: 1,
    seed: 'test-seed',
    status: 'IN_PROGRESS',
    phase: 'VOTE_OPEN',
    phaseStartedAt: new Date().toISOString(),
    phaseEndsAt: null,
    mode: 'STANDARD',
    players: new Map(),
    playerOrder: [],
    maxPlayers: 12,
    minPlayers: 6,
    roleDistribution: [],
    roleAssignments: new Map(),
    currentVote: null,
    voteHistory: [],
    pendingActions: [],
    resolvedActions: [],
    actionSequence: 0,
    messages: [],
    events: [],
    sequenceNumber: 0,
    winCondition: null,
    winningFaction: null,
    snapshotSequence: 0,
    snapshotHash: '',
  } as GameState;
}

describe('Voting System', () => {
  describe('createVoteSession', () => {
    it('creates a new vote session', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nominator-1', 'nominee-1');
      expect(session.nominatorId).toBe('nominator-1');
      expect(session.nomineeId).toBe('nominee-1');
      expect(session.locked).toBe(false);
      expect(session.votes.size).toBe(0);
      expect(session.runoffCount).toBe(0);
    });
  });

  describe('castVote', () => {
    it('accepts a valid vote', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      const result = castVote(session, 'voter-1', 'nominee-1');
      expect(result.success).toBe(true);
      expect(session.votes.get('voter-1')).toBe('nominee-1');
    });

    it('accepts abstention', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      const result = castVote(session, 'voter-1', null);
      expect(result.success).toBe(true);
      expect(session.votes.get('voter-1')).toBeNull();
    });

    it('rejects double voting', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      castVote(session, 'voter-1', 'nominee-1');
      const result = castVote(session, 'voter-1', 'other-player');
      expect(result.success).toBe(false);
    });

    it('rejects voting after lock', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      session.locked = true;
      const result = castVote(session, 'voter-1', 'nominee-1');
      expect(result.success).toBe(false);
    });
  });

  describe('computeVoteResult', () => {
    it('identifies clear winner', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      castVote(session, 'voter-1', 'nominee-1');
      castVote(session, 'voter-2', 'nominee-1');
      castVote(session, 'voter-3', 'other');
      lockVote(session);
      expect(session.result?.eliminatedId).toBe('nominee-1');
      expect(session.result?.isRunoff).toBe(false);
    });

    it('detects ties and triggers runoff', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      castVote(session, 'voter-1', 'nominee-1');
      castVote(session, 'voter-2', 'player-2');
      lockVote(session);
      expect(session.result?.isRunoff).toBe(true);
      expect(session.result?.tiedPlayerIds).toContain('nominee-1');
      expect(session.result?.tiedPlayerIds).toContain('player-2');
    });

    it('handles all-abstain scenario', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      castVote(session, 'voter-1', null);
      castVote(session, 'voter-2', null);
      lockVote(session);
      expect(session.result?.isNoElimination).toBe(true);
    });

    it('prevents runoff after max runoffs', () => {
      const state = createMockState();
      const session = createVoteSession(state, 'nom-1', 'nominee-1');
      session.runoffCount = 2; // max allowed
      castVote(session, 'voter-1', 'nominee-1');
      castVote(session, 'voter-2', 'player-2');
      lockVote(session);
      expect(session.result?.isRunoff).toBe(false);
      expect(session.result?.isNoElimination).toBe(true);
    });
  });

  describe('getMajorityThreshold', () => {
    it('computes correct thresholds', () => {
      expect(getMajorityThreshold(5)).toBe(3);
      expect(getMajorityThreshold(6)).toBe(4);
      expect(getMajorityThreshold(7)).toBe(4);
      expect(getMajorityThreshold(8)).toBe(5);
      expect(getMajorityThreshold(12)).toBe(7);
    });
  });
});
