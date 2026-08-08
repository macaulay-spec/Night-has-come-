import { describe, it, expect } from 'vitest';

import type { GameState } from '../state/index.js';

import { validateCommand } from './index.js';

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: '00000000-0000-0000-0000-000000000001',
    version: 1,
    seed: 'test-seed',
    status: 'IN_PROGRESS',
    phase: 'BLACKOUT_OPEN',
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
    ...overrides,
  } as GameState;
}

describe('Command Validation', () => {
  it('rejects commands from players not in game', () => {
    const state = createMockState();
    const result = validateCommand({
      gameState: state,
      actorId: 'unknown-player',
      actionType: 'USE_ABILITY',
      clientCommandId: 'cmd-1',
      clientStateVersion: 0,
      idempotencyKey: 'ik-1',
      payload: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('FORBIDDEN');
  });

  it('rejects commands from eliminated players', () => {
    const state = createMockState();
    state.players.set('player-1', {
      playerId: 'player-1',
      userId: 'user-1',
      displayName: 'Test Player',
      slotIndex: 0,
      status: 'ELIMINATED',
      isAlive: false,
      isHost: false,
      isReady: false,
      isAI: false,
      roleId: null,
      faction: null,
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
      reconnectExpiresAt: null,
      lastSequenceAck: 0,
      pendingActions: [],
      usedAbilities: new Map(),
      cooldowns: new Map(),
    });

    const result = validateCommand({
      gameState: state,
      actorId: 'player-1',
      actionType: 'NOMINATE',
      clientCommandId: 'cmd-1',
      clientStateVersion: 0,
      idempotencyKey: 'ik-1',
      payload: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('PLAYER_ELIMINATED');
  });

  it('rejects actions in wrong phase', () => {
    const state = createMockState({ phase: 'DISCUSSION' });
    state.players.set('player-1', {
      playerId: 'player-1',
      userId: 'user-1',
      displayName: 'Test Player',
      slotIndex: 0,
      status: 'ACTIVE',
      isAlive: true,
      isHost: false,
      isReady: false,
      isAI: false,
      roleId: null,
      faction: null,
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
      reconnectExpiresAt: null,
      lastSequenceAck: 0,
      pendingActions: [],
      usedAbilities: new Map(),
      cooldowns: new Map(),
    });

    const result = validateCommand({
      gameState: state,
      actorId: 'player-1',
      actionType: 'USE_ABILITY',
      clientCommandId: 'cmd-1',
      clientStateVersion: 0,
      idempotencyKey: 'ik-1',
      payload: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_PHASE');
  });

  it('rejects duplicate commands', () => {
    const state = createMockState();
    state.players.set('player-1', {
      playerId: 'player-1',
      userId: 'user-1',
      displayName: 'Test Player',
      slotIndex: 0,
      status: 'ACTIVE',
      isAlive: true,
      isHost: false,
      isReady: false,
      isAI: false,
      roleId: null,
      faction: null,
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
      reconnectExpiresAt: null,
      lastSequenceAck: 0,
      pendingActions: [],
      usedAbilities: new Map(),
      cooldowns: new Map(),
    });
    state.pendingActions.push({
      actionId: 'cmd-1',
      actorId: 'player-1',
      actionType: 'USE_ABILITY',
      targetIds: [],
      submittedAt: new Date().toISOString(),
      phase: 'BLACKOUT_OPEN',
      priority: 50,
      payload: {},
    });

    const result = validateCommand({
      gameState: state,
      actorId: 'player-1',
      actionType: 'USE_ABILITY',
      clientCommandId: 'cmd-1',
      clientStateVersion: 0,
      idempotencyKey: 'ik-1',
      payload: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('DUPLICATE_COMMAND');
  });

  it('accepts valid commands', () => {
    const state = createMockState();
    state.players.set('player-1', {
      playerId: 'player-1',
      userId: 'user-1',
      displayName: 'Test Player',
      slotIndex: 0,
      status: 'ACTIVE',
      isAlive: true,
      isHost: false,
      isReady: false,
      isAI: false,
      roleId: null,
      faction: null,
      connectedAt: new Date().toISOString(),
      disconnectedAt: null,
      reconnectExpiresAt: null,
      lastSequenceAck: 0,
      pendingActions: [],
      usedAbilities: new Map(),
      cooldowns: new Map(),
    });

    const result = validateCommand({
      gameState: state,
      actorId: 'player-1',
      actionType: 'USE_ABILITY',
      clientCommandId: 'cmd-new',
      clientStateVersion: 0,
      idempotencyKey: 'ik-new',
      payload: {},
    });
    expect(result.valid).toBe(true);
    expect(result.errorCode).toBeNull();
  });
});
