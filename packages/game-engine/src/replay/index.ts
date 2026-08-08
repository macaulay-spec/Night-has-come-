import type { GameState, GameEventRecord } from '../state/index.js';

// ─── Deterministic Replay ───────────────────────────────────────────

/**
 * A replay record contains all events needed to reconstruct a game.
 */
export interface ReplayRecord {
  gameId: string;
  seed: string;
  rulesetId: string;
  version: number;
  initialPlayerIds: string[];
  events: GameEventRecord[];
  snapshots: ReplaySnapshot[];
  startedAt: string;
  endedAt: string | null;
  winningFaction: string | null;
}

export interface ReplaySnapshot {
  sequence: number;
  serverTime: string;
  phase: string;
  stateHash: string;
  playerStates: ReplayPlayerState[];
}

export interface ReplayPlayerState {
  playerId: string;
  status: string;
  isAlive: boolean;
  roleId: string | null;
  faction: string | null;
}

/**
 * Create a replay snapshot from the current game state.
 */
export function createReplaySnapshot(state: GameState): ReplaySnapshot {
  const playerStates: ReplayPlayerState[] = [];
  for (const [, player] of state.players) {
    playerStates.push({
      playerId: player.playerId,
      status: player.status,
      isAlive: player.isAlive,
      roleId: player.roleId,
      faction: player.faction,
    });
  }

  return {
    sequence: state.sequenceNumber,
    serverTime: new Date().toISOString(),
    phase: state.phase,
    stateHash: computeStateHash(state),
    playerStates,
  };
}

/**
 * Verify that replaying the same seed + commands produces the same result.
 * This is a critical test for deterministic engine behavior.
 */
export function verifyReplayDeterminism(
  originalState: GameState,
  replayedState: GameState,
): { deterministic: boolean; differences: string[] } {
  const differences: string[] = [];

  if (originalState.phase !== replayedState.phase) {
    differences.push(`Phase mismatch: ${originalState.phase} vs ${replayedState.phase}`);
  }

  if (originalState.sequenceNumber !== replayedState.sequenceNumber) {
    differences.push(`Sequence mismatch: ${originalState.sequenceNumber} vs ${replayedState.sequenceNumber}`);
  }

  if (originalState.winningFaction !== replayedState.winningFaction) {
    differences.push(
      `Win faction mismatch: ${originalState.winningFaction} vs ${replayedState.winningFaction}`,
    );
  }

  // Compare player states
  for (const [id, player] of originalState.players) {
    const replayed = replayedState.players.get(id);
    if (!replayed) {
      differences.push(`Player ${id} missing from replayed state`);
      continue;
    }
    if (player.isAlive !== replayed.isAlive) {
      differences.push(`Player ${id} alive mismatch: ${player.isAlive} vs ${replayed.isAlive}`);
    }
    if (player.roleId !== replayed.roleId) {
      differences.push(`Player ${id} role mismatch: ${player.roleId} vs ${replayed.roleId}`);
    }
  }

  return { deterministic: differences.length === 0, differences };
}

/**
 * Compute a deterministic hash of game state.
 * Used for snapshot verification.
 */
export function computeStateHash(state: GameState): string {
  // In production, use a proper hash (SHA-256).
  // For now, use a simple deterministic string.
  const parts: string[] = [
    state.gameId,
    state.seed,
    state.phase,
    String(state.sequenceNumber),
  ];

  for (const id of state.playerOrder) {
    const p = state.players.get(id);
    if (p) {
      parts.push(`${id}:${p.isAlive}:${p.roleId ?? 'null'}:${p.status}`);
    }
  }

  // Simple hash (replace with crypto.subtle.digest in production)
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
