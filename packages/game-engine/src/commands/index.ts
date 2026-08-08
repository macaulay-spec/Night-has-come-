import type { GamePhase } from '@night-has-come/contracts';

import type { GameState, PendingAction } from '../state/index.js';

// ─── Command Validation ─────────────────────────────────────────────

export interface CommandValidationResult {
  valid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface CommandContext {
  gameState: GameState;
  actorId: string;
  actionType: string;
  targetId?: string;
  clientCommandId: string;
  clientStateVersion: number;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

/**
 * Validate a command against the current game state.
 * This is the central validation that runs server-side for every command.
 */
export function validateCommand(ctx: CommandContext): CommandValidationResult {
  const { gameState, actorId, actionType, targetId, clientCommandId } = ctx;

  // 1. Find the actor
  const actor = gameState.players.get(actorId);
  if (!actor) {
    return { valid: false, errorCode: 'FORBIDDEN', errorMessage: 'Actor not in game' };
  }

  // 2. Check player is alive for gameplay commands
  const gameplayCommands = ['USE_ABILITY', 'NOMINATE', 'VOTE'];
  if (gameplayCommands.includes(actionType) && !actor.isAlive) {
    return { valid: false, errorCode: 'PLAYER_ELIMINATED', errorMessage: 'Eliminated players cannot act' };
  }

  // 3. Check duplicate command (idempotency)
  const existingAction = gameState.pendingActions.find(
    (a) => a.actionId === clientCommandId || gameState.resolvedActions.some(
      (r) => r.actionId === clientCommandId,
    ),
  );
  if (existingAction) {
    return { valid: false, errorCode: 'DUPLICATE_COMMAND', errorMessage: 'Command already processed' };
  }

  // 4. Phase-specific validation
  const phaseValidation = validateCommandForPhase(actionType, gameState.phase);
  if (!phaseValidation.valid) {
    return phaseValidation;
  }

  // 5. Target validation
  if (targetId) {
    const target = gameState.players.get(targetId);
    if (!target) {
      return { valid: false, errorCode: 'TARGET_INVALID', errorMessage: 'Target not in game' };
    }
    if (actionType === 'USE_ABILITY' || actionType === 'NOMINATE') {
      if (!target.isAlive && actionType === 'NOMINATE') {
        return { valid: false, errorCode: 'TARGET_INVALID', errorMessage: 'Cannot nominate eliminated player' };
      }
    }
  }

  return { valid: true, errorCode: null, errorMessage: null };
}

function validateCommandForPhase(
  actionType: string,
  phase: GamePhase,
): CommandValidationResult {
  const phaseMap: Record<string, GamePhase[]> = {
    USE_ABILITY: ['BLACKOUT_OPEN'],
    NOMINATE: ['NOMINATION'],
    VOTE: ['VOTE_OPEN'],
    DEFENSE_STATEMENT: ['DEFENSE'],
    CHAT_SEND: [
      'LOBBY_OPEN', 'LOBBY_READY_CHECK', 'ORIENTATION',
      'DISCUSSION', 'NOMINATION', 'DEFENSE', 'RESULTS',
      'BLACKOUT_OPEN', 'BLACKOUT_LOCKED',
    ],
    READY: ['LOBBY_OPEN', 'LOBBY_READY_CHECK'],
    LEAVE_MATCH: ['LOBBY_OPEN', 'LOBBY_READY_CHECK', 'ASSIGNMENT', 'RESULTS'],
    RECONNECT: [], // always allowed via separate flow
  };

  const allowedPhases = phaseMap[actionType];
  if (!allowedPhases) {
    return { valid: false, errorCode: 'INVALID_PHASE', errorMessage: `Unknown action type: ${actionType}` };
  }

  if (!allowedPhases.includes(phase)) {
    return {
      valid: false,
      errorCode: 'INVALID_PHASE',
      errorMessage: `Action '${actionType}' not allowed in phase '${phase}'`,
    };
  }

  return { valid: true, errorCode: null, errorMessage: null };
}

/**
 * Create a pending action from a validated command.
 */
export function createPendingAction(
  ctx: CommandContext,
  priority: number = 0,
): PendingAction {
  return {
    actionId: ctx.clientCommandId,
    actorId: ctx.actorId,
    actionType: ctx.actionType,
    targetIds: ctx.targetId ? [ctx.targetId] : [],
    submittedAt: new Date().toISOString(),
    phase: ctx.gameState.phase,
    priority,
    payload: ctx.payload,
  };
}
