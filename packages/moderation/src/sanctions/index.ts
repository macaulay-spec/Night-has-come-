import type { SanctionType } from '@night-has-come/contracts';

// ─── Sanction Application ───────────────────────────────────────────

export interface SanctionAction {
  userId: string;
  type: SanctionType;
  reason: string;
  issuedBy: string;
  durationMinutes: number | null; // null = permanent
  expiresAt: string | null;
}

/**
 * Determine the appropriate sanction for a given offense count.
 */
export function getSanctionForOffense(
  offenseType: string,
  offenseCount: number,
): SanctionType | null {
  const escalationMap: Record<string, SanctionType[]> = {
    harassment: ['WARNING', 'MUTE', 'CHAT_RESTRICTION', 'SUSPENSION', 'PERMANENT_BAN'],
    hate: ['CHAT_RESTRICTION', 'SUSPENSION', 'PERMANENT_BAN'],
    sexual_content: ['WARNING', 'SUSPENSION', 'PERMANENT_BAN'],
    cheating: ['WARNING', 'SUSPENSION', 'SUSPENSION', 'PERMANENT_BAN'],
    griefing: ['WARNING', 'MATCHMAKING_RESTRICTION', 'SUSPENSION'],
    evasion: ['SUSPENSION', 'PERMANENT_BAN'],
    spam: ['WARNING', 'MUTE', 'CHAT_RESTRICTION'],
  };

  const escalation = escalationMap[offenseType];
  if (!escalation) return null;

  const index = Math.min(offenseCount - 1, escalation.length - 1);
  return escalation[index] ?? null;
}

/**
 * Get the duration for a sanction type.
 */
export function getSanctionDuration(type: SanctionType): number | null {
  const durations: Record<string, number | null> = {
    WARNING: null, // No duration, just a record
    MUTE: 60, // 1 hour
    CHAT_RESTRICTION: 1440, // 24 hours
    MATCHMAKING_RESTRICTION: 4320, // 72 hours
    SUSPENSION: 10080, // 7 days
    PERMANENT_BAN: null, // Permanent
  };
  return durations[type] ?? null;
}
