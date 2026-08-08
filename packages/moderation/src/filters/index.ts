/**
 * Profanity and content filtering for NIGHT HAS COME.
 * Used for chat messages, display names, and other user-generated content.
 */

type FilterMode = 'OFF' | 'LENIENT' | 'STRICT';

// ─── Slur/Profanity Patterns ────────────────────────────────────────
// In production, use a comprehensive word list loaded from a secure source.
// This is a minimal implementation for the foundation.

const PROFANITY_PATTERNS: RegExp[] = [
  // Basic profanity patterns — extend in production
  /\b(f[u*]ck|sh[i*]t|d[a*]mn?|b[i*]tch|a[s*]s(?:hole)?)\b/i,
];

const SLUR_PATTERNS: RegExp[] = [
  // Slur patterns — extend substantially in production with comprehensive lists
  // Ethnic, racial, gender, orientation, and religious slurs must be filtered
  // These patterns are placeholders — real implementation needs a maintained database
];

const HARASSMENT_PATTERNS: RegExp[] = [
  /\b(k[i*]ll\s*(?:your|my)self|suicide)\b/i,
];

// ─── Filtering Functions ────────────────────────────────────────────

export interface FilterResult {
  isClean: boolean;
  filteredText: string;
  flags: FilterFlag[];
}

export interface FilterFlag {
  type: 'profanity' | 'slur' | 'harassment' | 'spam';
  matched: string;
  position: number;
}

/**
 * Check text against all active filters.
 */
export function filterText(text: string, mode: FilterMode = 'STRICT'): FilterResult {
  if (mode === 'OFF') {
    return { isClean: true, filteredText: text, flags: [] };
  }

  const flags: FilterFlag[] = [];
  let filteredText = text;

  // Slurs — always filtered at STRICT and LENIENT
  for (const pattern of SLUR_PATTERNS) {
    const match = pattern.exec(text);
    if (match && match[0]) {
      flags.push({ type: 'slur', matched: match[0], position: match.index });
      filteredText = filteredText.replace(pattern, '[filtered]');
    }
  }

  // Harassment — always filtered
  for (const pattern of HARASSMENT_PATTERNS) {
    const match = pattern.exec(text);
    if (match && match[0]) {
      flags.push({ type: 'harassment', matched: match[0], position: match.index });
      filteredText = filteredText.replace(pattern, '[filtered]');
    }
  }

  // Profanity — filtered at STRICT, flagged at LENIENT
  for (const pattern of PROFANITY_PATTERNS) {
    const match = pattern.exec(text);
    if (match && match[0]) {
      flags.push({ type: 'profanity', matched: match[0], position: match.index });
      if (mode === 'STRICT') {
        filteredText = filteredText.replace(pattern, '****');
      }
    }
  }

  return {
    isClean: flags.length === 0,
    filteredText,
    flags,
  };
}

/**
 * Check if a display name is acceptable.
 */
export function validateDisplayName(name: string): { valid: boolean; reason: string | null } {
  if (name.length < 1) {
    return { valid: false, reason: 'Display name must not be empty' };
  }
  if (name.length > 32) {
    return { valid: false, reason: 'Display name must be 32 characters or less' };
  }

  const result = filterText(name, 'STRICT');
  if (!result.isClean) {
    return { valid: false, reason: 'Display name contains inappropriate content' };
  }

  // Check for impersonation patterns (e.g., "Admin", "Moderator", "System")
  const impersonationPattern = /^(admin|moderator|mod|system|dev|staff|support)(_|\d)*$/i;
  if (impersonationPattern.test(name.trim())) {
    return { valid: false, reason: 'This display name is reserved' };
  }

  return { valid: true, reason: null };
}

/**
 * Detect spam patterns in rapid messages.
 */
export function detectSpam(
  messages: string[],
  _windowMs: number = 5000,
): { isSpam: boolean; reason: string | null } {
  if (messages.length < 5) {
    return { isSpam: false, reason: null };
  }

  // Check for repeated identical messages
  const uniqueMessages = new Set(messages);
  if (uniqueMessages.size === 1) {
    return { isSpam: true, reason: 'Repeated identical messages detected' };
  }

  // Check for very similar messages (Levenshtein distance < 3 for short messages)
  // Simplified: check if >80% of messages are similar
  let similarCount = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i] ?? '';
    const next = messages[i + 1] ?? '';
    if (levenshteinDistance(current, next) < 3) {
      similarCount++;
    }
  }

  if (similarCount > messages.length * 0.6) {
    return { isSpam: true, reason: 'Rapid similar messages detected' };
  }

  return { isSpam: false, reason: null };
}

// ─── Helpers ────────────────────────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0]![j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        (matrix[i - 1]?.[j] ?? 0) + 1,
        (matrix[i]?.[j - 1] ?? 0) + 1,
        (matrix[i - 1]?.[j - 1] ?? 0) + cost,
      );
    }
  }
  return matrix[a.length]?.[b.length] ?? 0;
}
