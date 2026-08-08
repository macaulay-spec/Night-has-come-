import type { RoleDefinition, Faction } from '@night-has-come/contracts';
import {
  CIVIC_ROLES,
  VEIL_ROLES,
  INDEPENDENT_ROLES,
  SPECIAL_ROLES,
} from '@night-has-come/contracts';

// ─── Role Registry ──────────────────────────────────────────────────

/**
 * Data-driven role definitions.
 * All role logic flows from these definitions.
 * No giant conditional branches in UI code.
 */
export const ROLE_REGISTRY: Record<string, RoleDefinition> = {
  // ── CIVIC ─────────────────────────────────────────────────────────

  [CIVIC_ROLES.WITNESS]: {
    id: CIVIC_ROLES.WITNESS,
    displayName: 'Witness',
    faction: 'CIVIC',
    objective: 'Identify and eliminate all Veil players.',
    abilities: [
      {
        id: 'witness:observe',
        name: 'Observe',
        description: 'Watch one player during Blackout to see if they acted.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil players can use abilities that mask their activity.',
    tutorialExplanation: 'As the Witness, watch one player each Blackout to learn if they performed an action.',
    recommendedPlayerCounts: { min: 6, max: 30 },
    telemetryTags: ['investigation', 'beginner-friendly'],
    version: 1,
  },

  [CIVIC_ROLES.BULWARK]: {
    id: CIVIC_ROLES.BULWARK,
    displayName: 'Bulwark',
    faction: 'CIVIC',
    objective: 'Protect Civic players and eliminate all Veil players.',
    abilities: [
      {
        id: 'bulwark:guard',
        name: 'Guard',
        description: 'Protect one player from elimination during Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: 3,
        canTargetSelf: true,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil can target unprotected players or use abilities that bypass protection.',
    tutorialExplanation: 'As the Bulwark, protect one player each Blackout. Protected players survive attacks.',
    recommendedPlayerCounts: { min: 8, max: 30 },
    telemetryTags: ['protection', 'support'],
    version: 1,
  },

  [CIVIC_ROLES.SIGNAL_KEEPER]: {
    id: CIVIC_ROLES.SIGNAL_KEEPER,
    displayName: 'Signal Keeper',
    faction: 'CIVIC',
    objective: 'Track hidden signals and eliminate all Veil players.',
    abilities: [
      {
        id: 'signal-keeper:trace',
        name: 'Trace Signal',
        description: 'Detect if two players share the same faction.',
        trigger: 'BLACKOUT',
        targetType: 'MULTIPLE_PLAYERS',
        cooldown: 1,
        charges: 2,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil players with disguise abilities may falsify faction signals.',
    tutorialExplanation: 'As the Signal Keeper, compare two players each Blackout to learn if they share a faction.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['investigation', 'comparison'],
    version: 1,
  },

  [CIVIC_ROLES.MENDER]: {
    id: CIVIC_ROLES.MENDER,
    displayName: 'Mender',
    faction: 'CIVIC',
    objective: 'Keep Civic players alive and eliminate all Veil.',
    abilities: [
      {
        id: 'mender:restore',
        name: 'Restore',
        description: 'Restore one use of ability to a player who has used theirs.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 2,
        charges: 2,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil can eliminate high-value targets before they are restored.',
    tutorialExplanation: 'As the Mender, restore one ability charge to a player who has spent theirs.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['support', 'resource'],
    version: 1,
  },

  [CIVIC_ROLES.ECHO_READER]: {
    id: CIVIC_ROLES.ECHO_READER,
    displayName: 'Echo Reader',
    faction: 'CIVIC',
    objective: 'Read past actions and eliminate all Veil players.',
    abilities: [
      {
        id: 'echo-reader:read-echo',
        name: 'Read Echo',
        description: 'Learn what type of action a player performed last Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil can use abilities that mask or falsify action echoes.',
    tutorialExplanation: 'As the Echo Reader, examine one player each Blackout to learn their last action type.',
    recommendedPlayerCounts: { min: 8, max: 30 },
    telemetryTags: ['investigation', 'pattern'],
    version: 1,
  },

  [CIVIC_ROLES.ARCHIVIST]: {
    id: CIVIC_ROLES.ARCHIVIST,
    displayName: 'Archivist',
    faction: 'CIVIC',
    objective: 'Record the truth and eliminate all Veil players.',
    abilities: [
      {
        id: 'archivist:archive',
        name: 'Archive',
        description: 'Record current vote results. Once per game, reveal all archived votes publicly.',
        trigger: 'VOTE',
        targetType: 'NONE',
        cooldown: 0,
        charges: 3,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil can coordinate to spread votes and reduce actionable information.',
    tutorialExplanation: 'As the Archivist, record vote distributions and reveal them once per game.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['investigation', 'information'],
    version: 1,
  },

  [CIVIC_ROLES.MEDIATOR]: {
    id: CIVIC_ROLES.MEDIATOR,
    displayName: 'Mediator',
    faction: 'CIVIC',
    objective: 'Guide discussion and eliminate all Veil players.',
    abilities: [
      {
        id: 'mediator:extend',
        name: 'Extend Discussion',
        description: 'Add 30 seconds to the discussion phase once per game.',
        trigger: 'DISCUSSION',
        targetType: 'NONE',
        cooldown: 0,
        charges: 1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
      {
        id: 'mediator:reopen-nomination',
        name: 'Reopen Nomination',
        description: 'After a tie, allow one additional nomination round.',
        trigger: 'NOMINATION',
        targetType: 'NONE',
        cooldown: 0,
        charges: 1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: false,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil can pressure the Mediator into using abilities early.',
    tutorialExplanation: 'As the Mediator, you can extend discussion and break ties with an additional vote.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['support', 'time-control'],
    version: 1,
  },

  [CIVIC_ROLES.LANTERN_BEARER]: {
    id: CIVIC_ROLES.LANTERN_BEARER,
    displayName: 'Lantern Bearer',
    faction: 'CIVIC',
    objective: 'Illuminate the truth and eliminate all Veil players.',
    abilities: [
      {
        id: 'lantern-bearer:illuminate',
        name: 'Illuminate',
        description: 'Reveal one eliminated player\'s role to all Civic players.',
        trigger: 'DAWN',
        targetType: 'SINGLE_PLAYER',
        cooldown: 2,
        charges: 2,
        canTargetSelf: false,
        canTargetFaction: false,
        allowedTargetStatuses: ['ELIMINATED'],
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: true,
    },
    counterplay: 'Veil can use abilities that obscure eliminated players\' roles.',
    tutorialExplanation: 'As the Lantern Bearer, reveal a dead player\'s role to all Civic players.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['investigation', 'information'],
    version: 1,
  },

  // ── VEIL ──────────────────────────────────────────────────────────

  [VEIL_ROLES.VEILBLADE]: {
    id: VEIL_ROLES.VEILBLADE,
    displayName: 'Veilblade',
    faction: 'VEIL',
    objective: 'Eliminate all Civic players until Veil controls the majority.',
    abilities: [
      {
        id: 'veilblade:strike',
        name: 'Strike',
        description: 'Eliminate one player during Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: true,
      factionChatAccess: true,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Civic protection and investigation roles can track and counter the Veilblade.',
    tutorialExplanation: 'As the Veilblade, you are the primary attacker. Coordinate with your Veil allies.',
    recommendedPlayerCounts: { min: 6, max: 30 },
    telemetryTags: ['offensive', 'core-veil'],
    version: 1,
  },

  [VEIL_ROLES.MASKSMITH]: {
    id: VEIL_ROLES.MASKSMITH,
    displayName: 'Masksmith',
    faction: 'VEIL',
    objective: 'Obscure the truth and help Veil control the majority.',
    abilities: [
      {
        id: 'masksmith:mask',
        name: 'Mask',
        description: 'Disguise one Veil player to appear as Civic to investigation abilities this Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: 3,
        canTargetSelf: true,
        canTargetFaction: true,
      },
    ],
    informationContract: {
      seesFactionMembers: true,
      factionChatAccess: true,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Some investigation abilities can pierce masks.',
    tutorialExplanation: 'As the Masksmith, disguise Veil players to appear as Civic to investigators.',
    recommendedPlayerCounts: { min: 8, max: 30 },
    telemetryTags: ['deception', 'support'],
    version: 1,
  },

  [VEIL_ROLES.THREADCUTTER]: {
    id: VEIL_ROLES.THREADCUTTER,
    displayName: 'Threadcutter',
    faction: 'VEIL',
    objective: 'Silence investigators and help Veil control the majority.',
    abilities: [
      {
        id: 'threadcutter:sever',
        name: 'Sever',
        description: 'Block one player\'s investigation ability this Blackout. They receive no result.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: 2,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: true,
      factionChatAccess: true,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Civic can run multiple investigators; Threadcutter cannot block them all.',
    tutorialExplanation: 'As the Threadcutter, block one investigator each Blackout from receiving results.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['disruption', 'support'],
    version: 1,
  },

  [VEIL_ROLES.WHISPER_BROKER]: {
    id: VEIL_ROLES.WHISPER_BROKER,
    displayName: 'Whisper Broker',
    faction: 'VEIL',
    objective: 'Spread misinformation and help Veil control the majority.',
    abilities: [
      {
        id: 'whisper-broker:whisper',
        name: 'Whisper',
        description: 'Send a false system message to one Civic player appearing as game information.',
        trigger: 'DAWN',
        targetType: 'SINGLE_PLAYER',
        cooldown: 2,
        charges: 2,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: true,
      factionChatAccess: true,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Players can cross-reference information to identify false messages.',
    tutorialExplanation: 'As the Whisper Broker, send false information to Civic players to sow confusion.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['deception', 'misinformation'],
    version: 1,
  },

  [VEIL_ROLES.DECOY]: {
    id: VEIL_ROLES.DECOY,
    displayName: 'Decoy',
    faction: 'VEIL',
    objective: 'Draw attention away from Veil allies and help Veil control.',
    abilities: [
      {
        id: 'decoy:lure',
        name: 'Lure',
        description: 'Make yourself appear as the target of all investigation abilities this Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SELF',
        cooldown: 2,
        charges: 2,
        canTargetSelf: true,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: true,
      factionChatAccess: true,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Investigators who see a pattern of results on the same player should be suspicious.',
    tutorialExplanation: 'As the Decoy, redirect all investigations to yourself, protecting your allies.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['deception', 'protection'],
    version: 1,
  },

  [VEIL_ROLES.FALSE_WITNESS]: {
    id: VEIL_ROLES.FALSE_WITNESS,
    displayName: 'False Witness',
    faction: 'VEIL',
    objective: 'Corrupt investigation results and help Veil control.',
    abilities: [
      {
        id: 'false-witness:frame',
        name: 'Frame',
        description: 'Plant false evidence: one Civic player appears as Veil to investigations this Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: 3,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: true,
      factionChatAccess: true,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Multiple investigations on different nights can reveal the frame pattern.',
    tutorialExplanation: 'As the False Witness, plant false evidence to make a Civic player appear as Veil.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['deception', 'investigation-distortion'],
    version: 1,
  },

  // ── INDEPENDENT ───────────────────────────────────────────────────

  [INDEPENDENT_ROLES.SABLE]: {
    id: INDEPENDENT_ROLES.SABLE,
    displayName: 'Sable',
    faction: 'INDEPENDENT',
    objective: 'Survive until the end of the game. Win by being alive when any faction wins.',
    abilities: [
      {
        id: 'sable:vanish',
        name: 'Vanish',
        description: 'Become immune to all actions targeting you this Blackout.',
        trigger: 'BLACKOUT',
        targetType: 'SELF',
        cooldown: 2,
        charges: 2,
        canTargetSelf: true,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Sable must survive the vote; they can be nominated and eliminated during the day.',
    tutorialExplanation: 'As Sable, survive to the end by any means. You vanish during Blackout to avoid death.',
    recommendedPlayerCounts: { min: 8, max: 30 },
    telemetryTags: ['survival', 'independent'],
    version: 1,
  },

  [INDEPENDENT_ROLES.LAST_LIGHT]: {
    id: INDEPENDENT_ROLES.LAST_LIGHT,
    displayName: 'Last Light',
    faction: 'INDEPENDENT',
    objective: 'Be the last player alive, or survive until only two players remain.',
    abilities: [
      {
        id: 'last-light:extinguish',
        name: 'Extinguish',
        description: 'If you are the target of elimination, the attacker is eliminated instead (once per game).',
        trigger: 'REACTIVE',
        targetType: 'SINGLE_PLAYER',
        cooldown: 0,
        charges: 1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Last Light can still be eliminated by vote; the reactive ability only triggers on Blackout attacks.',
    tutorialExplanation: 'As Last Light, your survival is paramount. Your death reflects back upon your attacker once.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['survival', 'reactive'],
    version: 1,
  },

  [INDEPENDENT_ROLES.RUIN_ARTIST]: {
    id: INDEPENDENT_ROLES.RUIN_ARTIST,
    displayName: 'Ruin Artist',
    faction: 'INDEPENDENT',
    objective: 'Cause three players to be eliminated by vote. Win when your third target is eliminated.',
    abilities: [
      {
        id: 'ruin-artist:mark',
        name: 'Mark',
        description: 'Secretly mark a player. If they are eliminated by vote, gain progress toward your goal.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Players who notice a pattern of voting manipulation may identify the Ruin Artist.',
    tutorialExplanation: 'As the Ruin Artist, mark players and manipulate votes to get them eliminated.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['manipulation', 'independent'],
    version: 1,
  },

  [INDEPENDENT_ROLES.BROKER_OF_NAMES]: {
    id: INDEPENDENT_ROLES.BROKER_OF_NAMES,
    displayName: 'Broker of Names',
    faction: 'INDEPENDENT',
    objective: 'Correctly identify the faction of 3 eliminated players. Win after your third correct guess.',
    abilities: [
      {
        id: 'broker-of-names:appraise',
        name: 'Appraise',
        description: 'Guess the faction of an eliminated player. If correct, gain a charge toward victory.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
        allowedTargetStatuses: ['ELIMINATED'],
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Players can bluff about eliminated players\' factions to confuse the Broker.',
    tutorialExplanation: 'As the Broker of Names, guess eliminated players\' factions to build your collection.',
    recommendedPlayerCounts: { min: 10, max: 30 },
    telemetryTags: ['knowledge', 'independent'],
    version: 1,
  },

  // ── SPECIAL ───────────────────────────────────────────────────────

  [SPECIAL_ROLES.HOLLOW]: {
    id: SPECIAL_ROLES.HOLLOW,
    displayName: 'Hollow',
    faction: 'CIVIC',
    objective: 'Absorb abilities and eliminate all Veil players.',
    abilities: [
      {
        id: 'hollow:absorb',
        name: 'Absorb',
        description: 'Copy the ability of the last player who targeted you. Use it next Blackout.',
        trigger: 'REACTIVE',
        targetType: 'SELF',
        cooldown: 0,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil players can avoid targeting the Hollow or feed them useless abilities.',
    tutorialExplanation: 'As the Hollow, you absorb and copy the abilities used on you.',
    recommendedPlayerCounts: { min: 12, max: 30 },
    telemetryTags: ['adaptive', 'special'],
    version: 1,
  },

  [SPECIAL_ROLES.CLOCKMAKER]: {
    id: SPECIAL_ROLES.CLOCKMAKER,
    displayName: 'Clockmaker',
    faction: 'CIVIC',
    objective: 'Control time and eliminate all Veil players.',
    abilities: [
      {
        id: 'clockmaker:rewind',
        name: 'Rewind',
        description: 'Undo the last Blackout elimination (once per game). The target survives.',
        trigger: 'DAWN',
        targetType: 'NONE',
        cooldown: 0,
        charges: 1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Clockmaker can only rewind once; Veil can force the rewind early.',
    tutorialExplanation: 'As the Clockmaker, you can undo one elimination during the game.',
    recommendedPlayerCounts: { min: 12, max: 30 },
    telemetryTags: ['time-control', 'special'],
    version: 1,
  },

  [SPECIAL_ROLES.GLASS_CHILD]: {
    id: SPECIAL_ROLES.GLASS_CHILD,
    displayName: 'Glass Child',
    faction: 'CIVIC',
    objective: 'Reflect the truth and eliminate all Veil players.',
    abilities: [
      {
        id: 'glass-child:reflect',
        name: 'Reflect',
        description: 'Anyone targeting you with an ability sees their own role information reflected back.',
        trigger: 'REACTIVE',
        targetType: 'SELF',
        cooldown: 0,
        charges: -1,
        canTargetSelf: false,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Veil can use abilities that don\'t directly target or work through intermediaries.',
    tutorialExplanation: 'As the Glass Child, abilities used on you reflect back misleading information.',
    recommendedPlayerCounts: { min: 12, max: 30 },
    telemetryTags: ['defensive', 'special'],
    version: 1,
  },

  [SPECIAL_ROLES.NULL_SIGNAL]: {
    id: SPECIAL_ROLES.NULL_SIGNAL,
    displayName: 'Null Signal',
    faction: 'INDEPENDENT',
    objective: 'Create silence. Win if no player uses an ability for two consecutive Blackouts.',
    abilities: [
      {
        id: 'null-signal:dampen',
        name: 'Dampen',
        description: 'All abilities targeting your chosen player this Blackout fail silently.',
        trigger: 'BLACKOUT',
        targetType: 'SINGLE_PLAYER',
        cooldown: 1,
        charges: -1,
        canTargetSelf: true,
        canTargetFaction: false,
      },
    ],
    informationContract: {
      seesFactionMembers: false,
      factionChatAccess: false,
      receivesActionResults: true,
      seesEliminatedRoles: false,
    },
    counterplay: 'Players who notice silent ability failures should suspect Null Signal interference.',
    tutorialExplanation: 'As Null Signal, your goal is silence. Dampen abilities and hope for quiet nights.',
    recommendedPlayerCounts: { min: 12, max: 30 },
    telemetryTags: ['disruption', 'special', 'independent'],
    version: 1,
  },
};

// ─── Role Registry Helpers ──────────────────────────────────────────

export function getRole(id: string): RoleDefinition | undefined {
  return ROLE_REGISTRY[id];
}

export function getRolesByFaction(faction: Faction): RoleDefinition[] {
  const roles: RoleDefinition[] = [];
  for (const role of Object.values(ROLE_REGISTRY)) {
    if (role.faction === faction) {
      roles.push(role);
    }
  }
  return roles;
}

export function getRoleIdsByFaction(faction: Faction): string[] {
  return getRolesByFaction(faction).map((r: RoleDefinition) => r.id);
}

export function validateRoleAssignment(
  roleId: string,
  playerCount: number,
): boolean {
  const role = ROLE_REGISTRY[roleId];
  if (!role) return false;
  return (
    playerCount >= role.recommendedPlayerCounts.min &&
    playerCount <= role.recommendedPlayerCounts.max
  );
}
