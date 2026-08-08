import type { PendingAction, GameState, AbilityResult, ResolvedAction } from '../state/index.js';

// ─── Blackout Resolution Order ──────────────────────────────────────

/**
 * Resolve blackout actions in the specified priority order.
 * Higher priority resolves first.
 * Same-priority actions resolve by deterministic ordering (playerId).
 */
export const RESOLUTION_PRIORITIES: Record<string, number> = {
  // 1. Global rule modifiers (reserved for future use)
  'global_modifier': 100,

  // 2. Role-altering effects
  'role_alter': 90,

  // 3. Information distortion
  'information_distortion': 80,
  'mask': 80,
  'frame': 80,
  'lure': 80,

  // 4. Protection/prevention
  'protection': 70,
  'guard': 70,
  'sever': 70,
  'dampen': 70,
  'vanish': 70,
  'extinguish': 70,
  'reflect': 70,
  'absorb': 70,

  // 5. Investigation
  'investigation': 60,
  'observe': 60,
  'trace_signal': 60,
  'read_echo': 60,
  'appraise': 60,

  // 6. Manipulation
  'manipulation': 50,
  'mark': 50,
  'whisper': 50,
  'restore': 50,
  'illuminate': 50,

  // 7. Attacks/eliminations
  'attack': 40,
  'strike': 40,

  // 8. Private results
  'private_result': 30,

  // 9. Public dawn events
  'public_event': 20,
  'rewind': 20,

  // 10. Win-condition evaluation
  'win_check': 10,
};

/**
 * Resolve all pending blackout actions.
 * Returns the resolved actions in order and the mutated game state.
 */
export function resolveBlackoutActions(
  state: GameState,
): { resolvedActions: ResolvedAction[]; state: GameState } {
  const sorted = [...state.pendingActions].sort((a, b) => {
    const prioA = RESOLUTION_PRIORITIES[a.actionType] ?? 50;
    const prioB = RESOLUTION_PRIORITIES[b.actionType] ?? 50;
    if (prioA !== prioB) return prioB - prioA; // higher priority first
    // Deterministic tiebreak: by actorId
    return a.actorId.localeCompare(b.actorId);
  });

  const resolved: ResolvedAction[] = [];
  const modifiedState = { ...state };

  for (const action of sorted) {
    const result = resolveAction(modifiedState, action);
    resolved.push(result);

    // Remove from pending
    modifiedState.pendingActions = modifiedState.pendingActions.filter(
      (a) => a.actionId !== action.actionId,
    );
  }

  return { resolvedActions: resolved, state: modifiedState };
}

/**
 * Resolve a single action. This is a simplified version;
 * the full implementation will use the role registry ability handlers.
 */
function resolveAction(state: GameState, action: PendingAction): ResolvedAction {
  // In the full implementation, this dispatches to role-specific handlers
  // based on the actor's role and the action type.
  const results: AbilityResult[] = [];

  const actor = state.players.get(action.actorId);

  results.push({
    abilityId: action.actionType,
    actorId: action.actorId,
    targetIds: action.targetIds,
    success: true,
    publicMessage: actor
      ? `${actor.displayName} performed ${action.actionType}`
      : `Action ${action.actionType} resolved`,
    privateResult: null,
    modifiers: [],
  });

  return {
    actionId: action.actionId,
    actorId: action.actorId,
    actionType: action.actionType,
    targetIds: action.targetIds,
    resolvedAt: new Date().toISOString(),
    results,
  };
}

/**
 * Get the priority for an action type.
 */
export function getActionPriority(actionType: string): number {
  return RESOLUTION_PRIORITIES[actionType] ?? 50;
}
