import type { Faction, GameMode } from '@night-has-come/contracts';

// ─── Ruleset ────────────────────────────────────────────────────────

export interface Ruleset {
  id: string;
  name: string;
  version: number;
  mode: GameMode;
  minPlayers: number;
  maxPlayers: number;
  roleDistribution: RoleDistributionRule[];
  timerOverrides: Partial<TimerConfig>;
  votingRules: VotingRules;
  allowedRoles: string[];
  bannedRoleCombinations: string[][];
  chatRules: ChatRules;
  winConditionModifiers: WinConditionModifier[];
  isDefault: boolean;
}

export interface RoleDistributionRule {
  faction: Faction;
  count: number; // Fixed count
  allowedRoles: string[]; // Which roles can fill this slot
}

export interface TimerConfig {
  lobby: number;
  orientation: number;
  blackout: number;
  dawn: number;
  discussion: number;
  nomination: number;
  defense: number;
  voting: number;
  protocolLockPresentation: number;
  reconnectGrace: number;
}

export interface VotingRules {
  allowSelfVote: boolean;
  allowSkipVote: boolean;
  abstentionCountsForDenominator: boolean;
  majorityType: 'MAJORITY' | 'PLURALITY';
  maxRunoffs: number;
  runoffDuration: number;
  revealEliminatedRole: boolean;
  revealEliminatedFaction: boolean;
}

export interface ChatRules {
  publicChatEnabled: boolean;
  factionChatEnabled: boolean;
  deadChatEnabled: boolean;
  whisperEnabled: boolean;
  quickChatEnabled: boolean;
}

export interface WinConditionModifier {
  type: string;
  faction: Faction;
  condition: string;
  value: number;
}

// ─── Default Rulesets ───────────────────────────────────────────────

export const STANDARD_RULESET: Ruleset = {
  id: 'standard-6-12',
  name: 'Standard',
  version: 1,
  mode: 'STANDARD',
  minPlayers: 6,
  maxPlayers: 12,
  roleDistribution: [], // Dynamically filled based on player count
  timerOverrides: {},
  votingRules: {
    allowSelfVote: false,
    allowSkipVote: true,
    abstentionCountsForDenominator: true,
    majorityType: 'MAJORITY',
    maxRunoffs: 2,
    runoffDuration: 15,
    revealEliminatedRole: false,
    revealEliminatedFaction: true,
  },
  allowedRoles: [
    'civic:witness',
    'civic:bulwark',
    'civic:mender',
    'veil:veilblade',
    'veil:masksmith',
    'independent:sable',
  ],
  bannedRoleCombinations: [],
  chatRules: {
    publicChatEnabled: true,
    factionChatEnabled: true,
    deadChatEnabled: true,
    whisperEnabled: false,
    quickChatEnabled: true,
  },
  winConditionModifiers: [],
  isDefault: true,
};

// ─── Ruleset Validator ──────────────────────────────────────────────

export interface RulesetValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRuleset(ruleset: Ruleset): RulesetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check player count range
  if (ruleset.minPlayers < 6) {
    errors.push('Minimum players must be at least 6');
  }
  if (ruleset.maxPlayers > 30) {
    errors.push('Maximum players cannot exceed 30');
  }
  if (ruleset.minPlayers > ruleset.maxPlayers) {
    errors.push('Minimum players cannot exceed maximum players');
  }

  // Check role distribution (empty = filled dynamically at match start, which is valid)
  if (ruleset.roleDistribution.length > 0) {
    const totalRoles = ruleset.roleDistribution.reduce((sum, r) => sum + r.count, 0);
    if (totalRoles < ruleset.minPlayers) {
      errors.push(`Role distribution (${totalRoles}) less than minimum players (${ruleset.minPlayers})`);
    }
  }

  // Check for excessive investigation (more than 40% of roles) — only when distribution is specified
  if (ruleset.roleDistribution.length > 0) {
    const totalRoles = ruleset.roleDistribution.reduce((sum, r) => sum + r.count, 0);
    const investigationRoles = ruleset.roleDistribution
      .filter((r) => r.allowedRoles.some((role) => role.includes('witness') || role.includes('echo') || role.includes('signal')));
    const investigationCount = investigationRoles.reduce((sum, r) => sum + r.count, 0);
    if (investigationCount > totalRoles * 0.4) {
      warnings.push('Excessive investigation roles (>40%). May reduce deception viability.');
    }

    // Check for sufficient veil offensive capability
    const veilRoles = ruleset.roleDistribution.filter((r) => r.faction === 'VEIL');
    const veilCount = veilRoles.reduce((sum, r) => sum + r.count, 0);
    const hasAttacker = veilRoles.some((r) =>
      r.allowedRoles.some((role) => role.includes('veilblade')),
    );
    if (veilCount > 0 && !hasAttacker) {
      warnings.push('No Veilblade in Veil distribution. Veil may lack offensive capability.');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
