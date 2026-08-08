import { z } from 'zod';

// ─── Client → Server Events ─────────────────────────────────────────

export const ClientEventType = z.enum([
  'room:join',
  'room:leave',
  'room:ready',
  'match:action.submit',
  'match:vote.submit',
  'match:nomination.submit',
  'match:chat.send',
  'match:ack',
  'match:reconnect',
  'spectator:join',
]);
export type ClientEventType = z.infer<typeof ClientEventType>;

// ─── Server → Client Events ─────────────────────────────────────────

export const ServerEventType = z.enum([
  'room:state',
  'match:started',
  'match:projection',
  'match:phase.started',
  'match:phase.timer',
  'match:action.accepted',
  'match:action.rejected',
  'match:chat.message',
  'match:vote.status',
  'match:judgment.result',
  'match:elimination',
  'match:win',
  'match:snapshot',
  'match:error',
  'presence:update',
  'moderation:notice',
]);
export type ServerEventType = z.infer<typeof ServerEventType>;

// ─── Command Envelope ───────────────────────────────────────────────

export const CommandEnvelope = z.object({
  gameId: z.string().uuid(),
  actorId: z.string().uuid(),
  actionType: z.string(),
  targetId: z.string().uuid().optional(),
  clientCommandId: z.string().uuid(),
  clientStateVersion: z.number().int().min(0),
  idempotencyKey: z.string(),
  payload: z.record(z.unknown()).default({}),
});
export type CommandEnvelope = z.infer<typeof CommandEnvelope>;

// ─── Chat Message ───────────────────────────────────────────────────

export const ChatChannel = z.enum(['public', 'faction', 'dead', 'system', 'whisper']);
export type ChatChannel = z.infer<typeof ChatChannel>;

export const ChatMessage = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  channel: ChatChannel,
  senderId: z.string().uuid(),
  senderName: z.string(),
  content: z.string().max(500),
  timestamp: z.string().datetime(),
  isFiltered: z.boolean().default(false),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

// ─── Reconnect Payload ──────────────────────────────────────────────

export const ReconnectPayload = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
  authToken: z.string(),
  lastKnownSequence: z.number().int().min(0),
});
export type ReconnectPayload = z.infer<typeof ReconnectPayload>;
