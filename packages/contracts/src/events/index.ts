import { z } from 'zod';

// ─── Game Event ─────────────────────────────────────────────────────

export const GameEvent = z.object({
  eventId: z.string().uuid(),
  gameId: z.string().uuid(),
  sequence: z.number().int().min(0),
  serverTime: z.string().datetime(),
  schemaVersion: z.number().int().min(1).default(1),
  visibility: z.enum([
    'public',
    'player_private',
    'faction_private',
    'spectator_delayed',
    'admin_sensitive',
  ]),
  type: z.string(),
  payload: z.record(z.unknown()),
  actorId: z.string().uuid().nullish(),
  targetIds: z.array(z.string().uuid()).default([]),
});
export type GameEvent = z.infer<typeof GameEvent>;

// ─── Event Types ────────────────────────────────────────────────────

export const GameEventType = z.enum([
  'game:created',
  'game:player_joined',
  'game:player_left',
  'game:phase_changed',
  'game:role_assigned',
  'game:ability_used',
  'game:ability_result',
  'game:nomination',
  'game:defense',
  'game:vote_cast',
  'game:vote_result',
  'game:elimination',
  'game:win',
  'game:recovery',
  'game:voided',
  'game:snapshot',
]);
export type GameEventType = z.infer<typeof GameEventType>;

// ─── Snapshot ───────────────────────────────────────────────────────

export const GameSnapshot = z.object({
  gameId: z.string().uuid(),
  sequence: z.number().int().min(0),
  serverTime: z.string().datetime(),
  phase: z.string(),
  phaseEndTime: z.string().datetime().nullish(),
  players: z.array(
    z.object({
      playerId: z.string().uuid(),
      status: z.string(),
      isAlive: z.boolean(),
    }),
  ),
  stateHash: z.string(),
});
export type GameSnapshot = z.infer<typeof GameSnapshot>;
