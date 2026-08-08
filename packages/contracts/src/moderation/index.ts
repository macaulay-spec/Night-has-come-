import { z } from 'zod';

// ─── Report Categories ──────────────────────────────────────────────

export const ReportCategory = z.enum([
  'HARASSMENT',
  'HATE',
  'SEXUAL_CONTENT',
  'CHEATING',
  'GRIEFING',
  'EVASION',
  'SPAM',
  'OTHER',
]);
export type ReportCategory = z.infer<typeof ReportCategory>;

// ─── Report ─────────────────────────────────────────────────────────

export const PlayerReport = z.object({
  reportedUserId: z.string().uuid(),
  category: ReportCategory,
  description: z.string().max(1000),
  evidenceGameId: z.string().uuid().optional(),
  evidenceMessageId: z.string().uuid().optional(),
});
export type PlayerReport = z.infer<typeof PlayerReport>;

// ─── Sanction Types ─────────────────────────────────────────────────

export const SanctionType = z.enum([
  'WARNING',
  'MUTE',
  'CHAT_RESTRICTION',
  'MATCHMAKING_RESTRICTION',
  'SUSPENSION',
  'PERMANENT_BAN',
]);
export type SanctionType = z.infer<typeof SanctionType>;

// ─── Sanction ───────────────────────────────────────────────────────

export const Sanction = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: SanctionType,
  reason: z.string(),
  issuedBy: z.string().uuid(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  isAppealed: z.boolean().default(false),
  appealStatus: z.enum(['pending', 'approved', 'denied']).nullable(),
});
export type Sanction = z.infer<typeof Sanction>;

// ─── Profanity Filter Config ────────────────────────────────────────

export const ProfanityFilterMode = z.enum(['OFF', 'LENIENT', 'STRICT']);
export type ProfanityFilterMode = z.infer<typeof ProfanityFilterMode>;
