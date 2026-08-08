import type {
  GameId,
  PlayerId,
  GamePhase,
  PlayerStatus,
  Faction,
  GameMode,
  GameStatus,
} from '@night-has-come/contracts';

// ─── Player State ───────────────────────────────────────────────────

export interface PlayerState {
  playerId: PlayerId;
  userId: string;
  displayName: string;
  slotIndex: number;
  status: PlayerStatus;
  isAlive: boolean;
  isHost: boolean;
  isReady: boolean;
  isAI: boolean;
  roleId: string | null;
  faction: Faction | null;
  connectedAt: string;
  disconnectedAt: string | null;
  reconnectExpiresAt: string | null;
  lastSequenceAck: number;
  pendingActions: string[]; // ability IDs still available
  usedAbilities: Map<string, number>; // ability ID → times used
  cooldowns: Map<string, number>; // ability ID → phases remaining
}

// ─── Vote State ─────────────────────────────────────────────────────

export interface VoteState {
  nominationId: string;
  nominatorId: PlayerId;
  nomineeId: PlayerId;
  defenseStatement: string | null;
  votes: Map<PlayerId, PlayerId | null>; // voter → target (null = abstain)
  locked: boolean;
  startedAt: string;
  lockedAt: string | null;
  result: VoteResult | null;
  runoffCount: number;
}

export interface VoteResult {
  eliminatedId: PlayerId | null;
  tiedPlayerIds: PlayerId[];
  isRunoff: boolean;
  isNoElimination: boolean;
  votesByTarget: Map<PlayerId | null, number>;
}

// ─── Ability Result ─────────────────────────────────────────────────

export interface AbilityResult {
  abilityId: string;
  actorId: PlayerId;
  targetIds: PlayerId[];
  success: boolean;
  publicMessage: string | null;
  privateResult: Record<string, unknown> | null;
  modifiers: AbilityModifier[];
}

export interface AbilityModifier {
  type: string;
  targetId?: PlayerId;
  duration?: number;
  value?: unknown;
}

// ─── Game State ─────────────────────────────────────────────────────

export interface GameState {
  // Identity
  gameId: GameId;
  version: number; // schema version
  seed: string; // server-generated seed

  // Status
  status: GameStatus;
  phase: GamePhase;
  phaseStartedAt: string;
  phaseEndsAt: string | null;
  mode: GameMode;

  // Players
  players: Map<PlayerId, PlayerState>;
  playerOrder: PlayerId[]; // determined by slot
  maxPlayers: number;
  minPlayers: number;

  // Roles
  roleDistribution: { faction: Faction; count: number }[];
  roleAssignments: Map<PlayerId, string>; // playerId → roleId

  // Voting
  currentVote: VoteState | null;
  voteHistory: VoteState[];

  // Actions
  pendingActions: PendingAction[];
  resolvedActions: ResolvedAction[];
  actionSequence: number;

  // Chat
  messages: GameMessage[];

  // Events
  events: GameEventRecord[];
  sequenceNumber: number;

  // Win
  winCondition: WinState | null;
  winningFaction: Faction | null;

  // Replay
  snapshotSequence: number;
  snapshotHash: string;
}

export interface PendingAction {
  actionId: string;
  actorId: PlayerId;
  actionType: string;
  targetIds: PlayerId[];
  submittedAt: string;
  phase: GamePhase;
  priority: number; // for resolution ordering
  payload: Record<string, unknown>;
}

export interface ResolvedAction {
  actionId: string;
  actorId: PlayerId;
  actionType: string;
  targetIds: PlayerId[];
  resolvedAt: string;
  results: AbilityResult[];
}

export interface GameMessage {
  id: string;
  senderId: string | null; // null = system
  senderName: string;
  content: string;
  channel: 'public' | 'faction' | 'dead' | 'system';
  timestamp: string;
  isFiltered: boolean;
}

export interface GameEventRecord {
  eventId: string;
  sequence: number;
  type: string;
  serverTime: string;
  visibility: 'public' | 'player_private' | 'faction_private' | 'spectator_delayed' | 'admin_sensitive';
  actorId: string | null;
  targetIds: string[];
  payload: Record<string, unknown>;
}

export interface WinState {
  isGameOver: boolean;
  winningFaction: Faction | null;
  reason: string;
  evaluatedAt: string;
  isDraw: boolean;
}
