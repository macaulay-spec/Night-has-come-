import { z } from 'zod';

// ─── Base Identifiers ───────────────────────────────────────────────

export const GameIdSchema = z.string().uuid();
export type GameId = string;

export const PlayerIdSchema = z.string().uuid();
export type PlayerId = string;

export const UserIdSchema = z.string().uuid();
export type UserId = string;

export const RoomIdSchema = z.string().uuid();
export type RoomId = string;

export const RoomCodeSchema = z.string().length(6);
export type RoomCode = string;

export const CommandIdSchema = z.string().uuid();
export type CommandId = string;

export const EventIdSchema = z.string().uuid();
export type EventId = string;

// ─── Factions ───────────────────────────────────────────────────────

export const Faction = z.enum(['CIVIC', 'VEIL', 'INDEPENDENT']);
export type Faction = z.infer<typeof Faction>;

// ─── Player Lifecycle ───────────────────────────────────────────────

export const PlayerStatus = z.enum([
  'ACTIVE',
  'DISCONNECTED',
  'RECONNECTING',
  'ELIMINATED',
  'SPECTATOR',
  'FORFEITED',
]);
export type PlayerStatus = z.infer<typeof PlayerStatus>;

// ─── Game Phases ────────────────────────────────────────────────────

export const GamePhase = z.enum([
  'LOBBY_OPEN',
  'LOBBY_READY_CHECK',
  'ASSIGNMENT',
  'ORIENTATION',
  'BLACKOUT_OPEN',
  'BLACKOUT_LOCKED',
  'BLACKOUT_RESOLUTION',
  'DAWN_REVEAL',
  'DISCUSSION',
  'NOMINATION',
  'DEFENSE',
  'VOTE_OPEN',
  'VOTE_LOCKED',
  'JUDGMENT_RESOLUTION',
  'PROTOCOL_LOCK_PRESENTATION',
  'WIN_CHECK',
  'RESULTS',
  'RECOVERY_PAUSE',
  'VOIDED_MATCH',
]);
export type GamePhase = z.infer<typeof GamePhase>;

// ─── Game Mode ──────────────────────────────────────────────────────

export const GameMode = z.enum([
  'GUIDED_TRIAL',
  'STANDARD',
  'ADVANCED_SCRIPT',
  'CUSTOM_ROOM',
  'PRACTICE',
  'SPECTATOR',
  'RANKED',
  'EVENT_PROTOCOL',
]);
export type GameMode = z.infer<typeof GameMode>;

// ─── Visibility ─────────────────────────────────────────────────────

export const Visibility = z.enum([
  'public',
  'player_private',
  'faction_private',
  'spectator_delayed',
  'admin_sensitive',
]);
export type Visibility = z.infer<typeof Visibility>;

// ─── Projection Types ───────────────────────────────────────────────

export const ProjectionType = z.enum([
  'PUBLIC_PROJECTION',
  'PLAYER_PRIVATE_PROJECTION',
  'FACTION_PRIVATE_PROJECTION',
  'SPECTATOR_PROJECTION',
  'ADMIN_SENSITIVE_PROJECTION',
]);
export type ProjectionType = z.infer<typeof ProjectionType>;

// ─── Command Action Types ───────────────────────────────────────────

export const ActionType = z.enum([
  'USE_ABILITY',
  'NOMINATE',
  'VOTE',
  'DEFENSE_STATEMENT',
  'CHAT_SEND',
  'READY',
  'LEAVE_MATCH',
  'RECONNECT',
]);
export type ActionType = z.infer<typeof ActionType>;

// ─── Error Codes ────────────────────────────────────────────────────

export const ErrorCode = z.enum([
  'AUTH_REQUIRED',
  'FORBIDDEN',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'MATCH_NOT_ACTIVE',
  'INVALID_PHASE',
  'PLAYER_ELIMINATED',
  'TARGET_INVALID',
  'ACTION_ALREADY_LOCKED',
  'TIMER_EXPIRED',
  'STALE_STATE',
  'RATE_LIMITED',
  'DUPLICATE_COMMAND',
  'RECONNECT_EXPIRED',
  'SERVER_RECOVERY',
  'MODERATION_BLOCKED',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

// ─── Voting ─────────────────────────────────────────────────────────

export const VoteChoice = z.object({
  targetId: z.string().uuid().nullable(), // null = abstain
});
export type VoteChoice = z.infer<typeof VoteChoice>;

export const VoteTierResult = z.enum([
  'ELIMINATED',
  'RUNOFF',
  'NO_ELIMINATION',
  'TIED',
]);
export type VoteTierResult = z.infer<typeof VoteTierResult>;

// ─── Win Condition ──────────────────────────────────────────────────

export const WinConditionResult = z.object({
  winningFaction: Faction.nullable(),
  description: z.string(),
  isDraw: z.boolean(),
});
export type WinConditionResult = z.infer<typeof WinConditionResult>;

// ─── Game State Summary ─────────────────────────────────────────────

export const GameStatus = z.enum([
  'LOBBY',
  'IN_PROGRESS',
  'COMPLETED',
  'VOIDED',
  'RECOVERY',
]);
export type GameStatus = z.infer<typeof GameStatus>;

// ─── Player Preset ──────────────────────────────────────────────────

export const PlayerPreset = z.object({
  playerCount: z.number().int().min(6).max(30),
  civicCount: z.number().int().min(1),
  veilCount: z.number().int().min(1),
  independentCount: z.number().int().min(0),
});
export type PlayerPreset = z.infer<typeof PlayerPreset>;
