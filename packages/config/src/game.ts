/**
 * Default game configuration.
 * All values are server-authoritative and versioned.
 */
export const gameConfig = {
  version: 1,

  timers: {
    lobby: 20, // seconds after minimum players ready
    orientation: 30,
    blackout: {
      small: 45,  // 6-12 players
      medium: 60, // 13-20 players
      large: 75,  // 21-30 players
    },
    dawn: 12,
    discussion: {
      small: 150,  // 6-8 players
      medium: 180, // 9-12 players
      large: 240,  // 13-20 players
      xlarge: 300, // 21-30 players
    },
    nomination: 30,
    defense: 20, // per nominated player
    voting: 45,
    protocolLockPresentation: 12,
    reconnectGrace: 120, // seconds in public games
    hostTransfer: 30, // seconds after host disconnect
  },

  playerPresets: {
    6:  { civic: 4, veil: 2, independent: 0 },
    8:  { civic: 5, veil: 2, independent: 1 },
    10: { civic: 6, veil: 3, independent: 1 },
    12: { civic: 7, veil: 3, independent: 2 },
    15: { civic: 9, veil: 4, independent: 2 },
  },

  voting: {
    majorityThresholds: {
      6: 4,  7: 4,  8: 5,  9: 5,
      10: 6, 11: 6, 12: 7,
    },
    runoffDuration: 15,
    maxRunoffs: 2,
    allowSelfVote: false,
    allowSkipVote: true,
    abstentionCountsForDenominator: true,
  },

  rooms: {
    codeLength: 6,
    codeChars: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // no confusing chars
    expirationMinutes: 60,
    maxPublicRooms: 100,
  },

  matchmaking: {
    maxQueueTime: 300,
    backfillWindow: 60,
  },

  limits: {
    maxPlayersPerMatch: 30,
    maxSpectators: 10,
    maxMessageLength: 500,
    maxReportDescriptionLength: 1000,
    maxDisplayNameLength: 32,
    maxBioLength: 200,
  },
} as const;
