import { z } from 'zod';

import { Faction } from '../game/index.js';

// ─── Role ID ────────────────────────────────────────────────────────

export const RoleIdSchema = z.string();
export type RoleId = string;

// ─── Ability Definition ─────────────────────────────────────────────

export const AbilityTargetType = z.enum([
  'SINGLE_PLAYER',
  'SELF',
  'MULTIPLE_PLAYERS',
  'NONE',
  'GLOBAL',
  'FACTION',
]);
export type AbilityTargetType = z.infer<typeof AbilityTargetType>;

export const AbilityTrigger = z.enum([
  'BLACKOUT',
  'DAWN',
  'DISCUSSION',
  'NOMINATION',
  'VOTE',
  'PASSIVE',
  'REACTIVE',
]);
export type AbilityTrigger = z.infer<typeof AbilityTrigger>;

export const AbilityDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  trigger: AbilityTrigger,
  targetType: AbilityTargetType,
  cooldown: z.number().int().min(0).default(1), // phases between uses, 0 = no cooldown
  charges: z.number().int().min(1).default(1), // total uses per game, -1 = unlimited
  canTargetSelf: z.boolean().default(false),
  canTargetFaction: z.boolean().default(false),
  allowedTargetStatuses: z.array(z.string()).optional(),
});
export type AbilityDefinition = z.infer<typeof AbilityDefinition>;

// ─── Role Definition ────────────────────────────────────────────────

export const RoleDefinition = z.object({
  id: RoleIdSchema,
  displayName: z.string(),
  faction: Faction,
  objective: z.string(),
  abilities: z.array(AbilityDefinition),
  informationContract: z.object({
    seesFactionMembers: z.boolean().default(false),
    factionChatAccess: z.boolean().default(false),
    receivesActionResults: z.boolean().default(true),
    seesEliminatedRoles: z.boolean().default(false),
  }),
  privateResultSchema: z.string().optional(),
  publicResultSchema: z.string().optional(),
  counterplay: z.string(),
  tutorialExplanation: z.string(),
  recommendedPlayerCounts: z.object({
    min: z.number().int().min(6),
    max: z.number().int().max(30),
  }),
  telemetryTags: z.array(z.string()),
  version: z.number().int().min(1),
  tags: z.array(z.string()).optional(),
});
export type RoleDefinition = z.infer<typeof RoleDefinition>;

// ─── Role Assignment ────────────────────────────────────────────────

export const RoleAssignment = z.object({
  playerId: z.string().uuid(),
  roleId: RoleIdSchema,
  faction: Faction,
  assignedAt: z.string().datetime(),
});
export type RoleAssignment = z.infer<typeof RoleAssignment>;

// ─── Predefined Role IDs ────────────────────────────────────────────

export const CIVIC_ROLES = {
  WITNESS: 'civic:witness',
  BULWARK: 'civic:bulwark',
  SIGNAL_KEEPER: 'civic:signal-keeper',
  MENDER: 'civic:mender',
  ECHO_READER: 'civic:echo-reader',
  ARCHIVIST: 'civic:archivist',
  MEDIATOR: 'civic:mediator',
  LANTERN_BEARER: 'civic:lantern-bearer',
} as const;

export const VEIL_ROLES = {
  VEILBLADE: 'veil:veilblade',
  MASKSMITH: 'veil:masksmith',
  THREADCUTTER: 'veil:threadcutter',
  WHISPER_BROKER: 'veil:whisper-broker',
  DECOY: 'veil:decoy',
  FALSE_WITNESS: 'veil:false-witness',
} as const;

export const INDEPENDENT_ROLES = {
  SABLE: 'independent:sable',
  LAST_LIGHT: 'independent:last-light',
  RUIN_ARTIST: 'independent:ruin-artist',
  BROKER_OF_NAMES: 'independent:broker-of-names',
} as const;

export const SPECIAL_ROLES = {
  HOLLOW: 'special:hollow',
  CLOCKMAKER: 'special:clockmaker',
  GLASS_CHILD: 'special:glass-child',
  NULL_SIGNAL: 'special:null-signal',
} as const;
