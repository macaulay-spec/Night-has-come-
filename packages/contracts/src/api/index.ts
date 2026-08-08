import { z } from 'zod';

import { ErrorCode } from '../game/index.js';

// ─── API Error Response ─────────────────────────────────────────────

export const ApiError = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

// ─── API Success Response ───────────────────────────────────────────

export const ApiSuccess = <T extends z.ZodType>(data: T) =>
  z.object({
    data,
    meta: z.object({
      timestamp: z.string().datetime(),
    }),
  });

// ─── Pagination ─────────────────────────────────────────────────────

export const PaginationParams = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
});
export type PaginationParams = z.infer<typeof PaginationParams>;

export const PaginationMeta = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  total: z.number().int().min(0).optional(),
});

// ─── Auth Endpoints ─────────────────────────────────────────────────

export const SessionResponse = z.object({
  userId: z.string().uuid(),
  email: z.string().email().nullable(),
  displayName: z.string(),
  isBanned: z.boolean(),
  createdAt: z.string().datetime(),
});

// ─── Profile Endpoints ──────────────────────────────────────────────

export const ProfileUpdate = z.object({
  displayName: z.string().min(1).max(32).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(200).optional(),
});
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;

// ─── Room Endpoints ─────────────────────────────────────────────────

export const CreateRoomRequest = z.object({
  name: z.string().min(1).max(50).optional(),
  maxPlayers: z.number().int().min(6).max(30).default(12),
  gameMode: z.string().default('STANDARD'),
  isPrivate: z.boolean().default(false),
  allowSpectators: z.boolean().default(true),
  rulesetId: z.string().optional(),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequest>;

export const JoinRoomRequest = z.object({
  code: z.string().length(6),
  invitationToken: z.string().optional(),
});
export type JoinRoomRequest = z.infer<typeof JoinRoomRequest>;
