import type { GamePhase } from '@night-has-come/contracts';

// ─── Phase Transition Map ───────────────────────────────────────────

/**
 * Defines which phase can follow which phase.
 * The game engine enforces this; clients cannot transition phases.
 */
export const PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOBBY_OPEN: ['LOBBY_READY_CHECK'],
  LOBBY_READY_CHECK: ['ASSIGNMENT', 'LOBBY_OPEN'],
  ASSIGNMENT: ['ORIENTATION'],
  ORIENTATION: ['BLACKOUT_OPEN'],
  BLACKOUT_OPEN: ['BLACKOUT_LOCKED'],
  BLACKOUT_LOCKED: ['BLACKOUT_RESOLUTION'],
  BLACKOUT_RESOLUTION: ['DAWN_REVEAL'],
  DAWN_REVEAL: ['DISCUSSION'],
  DISCUSSION: ['NOMINATION', 'WIN_CHECK'],
  NOMINATION: ['DEFENSE', 'DISCUSSION'],
  DEFENSE: ['VOTE_OPEN'],
  VOTE_OPEN: ['VOTE_LOCKED'],
  VOTE_LOCKED: ['JUDGMENT_RESOLUTION'],
  JUDGMENT_RESOLUTION: ['WIN_CHECK', 'DISCUSSION', 'PROTOCOL_LOCK_PRESENTATION'],
  PROTOCOL_LOCK_PRESENTATION: ['WIN_CHECK', 'BLACKOUT_OPEN'],
  WIN_CHECK: ['RESULTS', 'BLACKOUT_OPEN', 'DISCUSSION'],
  RESULTS: [],
  RECOVERY_PAUSE: ['LOBBY_OPEN', 'ASSIGNMENT', 'BLACKOUT_OPEN', 'DISCUSSION', 'RESULTS', 'VOIDED_MATCH'],
  VOIDED_MATCH: [],
};

/**
 * Validate that a phase transition is legal.
 */
export function canTransition(from: GamePhase, to: GamePhase): boolean {
  const allowed = PHASE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Phases where blackout actions can be submitted.
 */
export const BLACKOUT_ACTION_PHASES: GamePhase[] = [
  'BLACKOUT_OPEN',
];

/**
 * Phases where nominations can occur.
 */
export const NOMINATION_PHASES: GamePhase[] = [
  'NOMINATION',
];

/**
 * Phases where voting can occur.
 */
export const VOTING_PHASES: GamePhase[] = [
  'VOTE_OPEN',
];

/**
 * Phases where chat is allowed per channel.
 */
export const CHAT_ALLOWED_PHASES: Record<string, GamePhase[]> = {
  public: ['LOBBY_OPEN', 'LOBBY_READY_CHECK', 'ORIENTATION', 'DISCUSSION', 'NOMINATION', 'DEFENSE', 'RESULTS'],
  faction: ['BLACKOUT_OPEN', 'BLACKOUT_LOCKED', 'BLACKOUT_RESOLUTION'],
  dead: ['DISCUSSION', 'NOMINATION', 'DEFENSE', 'VOTE_OPEN', 'VOTE_LOCKED', 'JUDGMENT_RESOLUTION', 'RESULTS'],
  system: [], // system messages can be sent at any time
};

/**
 * Check if a channel is legal in the current phase.
 */
export function canChat(phase: GamePhase, channel: string): boolean {
  if (channel === 'system') return true;
  const allowed = CHAT_ALLOWED_PHASES[channel];
  if (!allowed) return false;
  return allowed.includes(phase);
}
