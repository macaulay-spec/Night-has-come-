import { z } from 'zod';

// ─── Friendship ─────────────────────────────────────────────────────

export const FriendshipStatus = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'BLOCKED',
]);
export type FriendshipStatus = z.infer<typeof FriendshipStatus>;

export const Friendship = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  friendId: z.string().uuid(),
  status: FriendshipStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Friendship = z.infer<typeof Friendship>;

// ─── Friend Request ─────────────────────────────────────────────────

export const FriendRequest = z.object({
  targetUserId: z.string().uuid(),
});
export type FriendRequest = z.infer<typeof FriendRequest>;

// ─── Invitation ─────────────────────────────────────────────────────

export const InvitationTokenSchema = z.string().length(32);
export type InvitationToken = string;

export const RoomInvitation = z.object({
  token: InvitationTokenSchema,
  roomId: z.string().uuid(),
  roomCode: z.string().length(6),
  inviterId: z.string().uuid(),
  inviterName: z.string(),
  expiresAt: z.string().datetime(),
  maxUses: z.number().int().min(1).default(1),
  useCount: z.number().int().min(0).default(0),
});
export type RoomInvitation = z.infer<typeof RoomInvitation>;

// ─── Presence ───────────────────────────────────────────────────────

export const PresenceState = z.enum([
  'ONLINE',
  'IN_MATCH',
  'IN_LOBBY',
  'AWAY',
  'OFFLINE',
]);
export type PresenceState = z.infer<typeof PresenceState>;

export const Presence = z.object({
  userId: z.string().uuid(),
  state: PresenceState,
  gameId: z.string().uuid().nullable(),
  lastSeen: z.string().datetime(),
});
export type Presence = z.infer<typeof Presence>;
