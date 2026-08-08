import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  varchar,
  uniqueIndex,
  index,
  check,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ──────────────────────────────────────────────────────────

export const userStatusEnum = pgEnum('user_status', ['active', 'banned', 'suspended', 'deleted']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'declined', 'blocked']);
export const reportCategoryEnum = pgEnum('report_category', [
  'harassment', 'hate', 'sexual_content', 'cheating', 'griefing', 'evasion', 'spam', 'other',
]);
export const sanctionTypeEnum = pgEnum('sanction_type', [
  'warning', 'mute', 'chat_restriction', 'matchmaking_restriction', 'suspension', 'permanent_ban',
]);
export const gameStatusEnum = pgEnum('game_status', ['lobby', 'in_progress', 'completed', 'voided', 'recovery']);
export const playerStatusEnum = pgEnum('player_status', [
  'active', 'disconnected', 'reconnecting', 'eliminated', 'spectator', 'forfeited',
]);
export const eventVisibilityEnum = pgEnum('event_visibility', [
  'public', 'player_private', 'faction_private', 'spectator_delayed', 'admin_sensitive',
]);

// ─── Users ──────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  displayName: varchar('display_name', { length: 32 }).notNull(),
  avatarUrl: text('avatar_url'),
  bio: varchar('bio', { length: 200 }),
  status: userStatusEnum('status').default('active').notNull(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  fairPlayScore: integer('fair_play_score').default(100).notNull(),
  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ─── Sessions ───────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull(),
  deviceInfo: jsonb('device_info').default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Games ──────────────────────────────────────────────────────────

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomCode: varchar('room_code', { length: 6 }).notNull(),
  status: gameStatusEnum('status').default('lobby').notNull(),
  mode: varchar('mode', { length: 32 }).notNull().default('STANDARD'),
  rulesetId: varchar('ruleset_id', { length: 64 }),
  seed: text('seed').notNull(),
  maxPlayers: integer('max_players').notNull().default(12),
  currentPhase: varchar('current_phase', { length: 64 }),
  sequenceNumber: integer('sequence_number').default(0).notNull(),
  winningFaction: varchar('winning_faction', { length: 32 }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  roomCodeIdx: index('idx_games_room_code').on(table.roomCode),
  statusIdx: index('idx_games_status').on(table.status),
}));

// ─── Game Players ───────────────────────────────────────────────────

export const gamePlayers = pgTable('game_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  slotIndex: integer('slot_index').notNull(),
  displayName: varchar('display_name', { length: 32 }).notNull(),
  status: playerStatusEnum('status').default('active').notNull(),
  isAlive: boolean('is_alive').default(true).notNull(),
  isHost: boolean('is_host').default(false).notNull(),
  isReady: boolean('is_ready').default(false).notNull(),
  isAI: boolean('is_ai').default(false).notNull(),
  roleId: varchar('role_id', { length: 64 }),
  faction: varchar('faction', { length: 32 }),
  disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
  reconnectExpiresAt: timestamp('reconnect_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  gameIdIdx: index('idx_game_players_game').on(table.gameId),
  userIdIdx: index('idx_game_players_user').on(table.userId),
  gameSlotUnique: uniqueIndex('uq_game_players_slot').on(table.gameId, table.slotIndex),
}));

// ─── Role Assignments ───────────────────────────────────────────────

export const roleAssignments = pgTable('role_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  playerId: uuid('player_id').references(() => gamePlayers.id, { onDelete: 'cascade' }).notNull(),
  roleId: varchar('role_id', { length: 64 }).notNull(),
  faction: varchar('faction', { length: 32 }).notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  gamePlayerUnique: uniqueIndex('uq_role_assignments').on(table.gameId, table.playerId),
}));

// ─── Actions ────────────────────────────────────────────────────────

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  actorId: uuid('actor_id').references(() => gamePlayers.id, { onDelete: 'cascade' }).notNull(),
  actionType: varchar('action_type', { length: 64 }).notNull(),
  targetIds: jsonb('target_ids').default([]).notNull(),
  phase: varchar('phase', { length: 32 }).notNull(),
  priority: integer('priority').default(0).notNull(),
  payload: jsonb('payload').default({}).notNull(),
  result: jsonb('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  gameIdIdx: index('idx_actions_game').on(table.gameId),
  actorIdIdx: index('idx_actions_actor').on(table.actorId),
}));

// ─── Votes ──────────────────────────────────────────────────────────

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  voterId: uuid('voter_id').references(() => gamePlayers.id, { onDelete: 'cascade' }).notNull(),
  targetId: uuid('target_id').references(() => gamePlayers.id, { onDelete: 'cascade' }),
  nominationId: uuid('nomination_id').notNull(),
  phase: varchar('phase', { length: 32 }).notNull(),
  isAbstention: boolean('is_abstention').default(false).notNull(),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  gameIdIdx: index('idx_votes_game').on(table.gameId),
  voterNominationUnique: uniqueIndex('uq_votes_voter_nomination').on(table.voterId, table.nominationId),
}));

// ─── Chat Messages ──────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => gamePlayers.id, { onDelete: 'set null' }),
  senderName: varchar('sender_name', { length: 32 }).notNull(),
  channel: varchar('channel', { length: 16 }).notNull().default('public'),
  content: varchar('content', { length: 500 }).notNull(),
  isFiltered: boolean('is_filtered').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  gameIdIdx: index('idx_messages_game').on(table.gameId),
  channelIdx: index('idx_messages_channel').on(table.gameId, table.channel),
}));

// ─── Friendships ────────────────────────────────────────────────────

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  friendId: uuid('friend_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: friendshipStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userFriendUnique: uniqueIndex('uq_friendships').on(table.userId, table.friendId),
  userIdIdx: index('idx_friendships_user').on(table.userId),
  friendIdIdx: index('idx_friendships_friend').on(table.friendId),
}));

// ─── Invitations ────────────────────────────────────────────────────

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 32 }).unique().notNull(),
  roomId: uuid('room_id').notNull(),
  roomCode: varchar('room_code', { length: 6 }).notNull(),
  inviterId: uuid('inviter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  maxUses: integer('max_uses').default(1).notNull(),
  useCount: integer('use_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('idx_invitations_token').on(table.token),
}));

// ─── Reports ────────────────────────────────────────────────────────

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedUserId: uuid('reported_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: reportCategoryEnum('category').notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  evidenceGameId: uuid('evidence_game_id'),
  evidenceMessageId: uuid('evidence_message_id'),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  moderatorId: uuid('moderator_id').references(() => users.id, { onDelete: 'set null' }),
  resolution: varchar('resolution', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  reportedUserIdx: index('idx_reports_reported').on(table.reportedUserId),
  statusIdx: index('idx_reports_status').on(table.status),
}));

// ─── Sanctions / Bans ───────────────────────────────────────────────

export const sanctions = pgTable('sanctions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: sanctionTypeEnum('type').notNull(),
  reason: text('reason').notNull(),
  issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isAppealed: boolean('is_appealed').default(false).notNull(),
  appealStatus: varchar('appeal_status', { length: 16 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_sanctions_user').on(table.userId),
}));

// ─── Achievements ───────────────────────────────────────────────────

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 64 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  iconUrl: text('icon_url'),
  xpReward: integer('xp_reward').default(0).notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Player Achievements ────────────────────────────────────────────

export const playerAchievements = pgTable('player_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievementId: uuid('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }).notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  gameId: uuid('game_id'),
}, (table) => ({
  userAchievementUnique: uniqueIndex('uq_player_achievements').on(table.userId, table.achievementId),
}));

// ─── Player Statistics ──────────────────────────────────────────────

export const playerStatistics = pgTable('player_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  gamesPlayed: integer('games_played').default(0).notNull(),
  gamesWon: integer('games_won').default(0).notNull(),
  civicGames: integer('civic_games').default(0).notNull(),
  civicWins: integer('civic_wins').default(0).notNull(),
  veilGames: integer('veil_games').default(0).notNull(),
  veilWins: integer('veil_wins').default(0).notNull(),
  independentGames: integer('independent_games').default(0).notNull(),
  independentWins: integer('independent_wins').default(0).notNull(),
  survivalRate: integer('survival_rate').default(0).notNull(), // percentage * 100
  voteAccuracy: integer('vote_accuracy').default(0).notNull(), // percentage * 100
  totalKills: integer('total_kills').default(0).notNull(),
  totalProtections: integer('total_protections').default(0).notNull(),
  totalInvestigations: integer('total_investigations').default(0).notNull(),
  mvpCount: integer('mvp_count').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Cosmetics ──────────────────────────────────────────────────────

export const cosmetics = pgTable('cosmetics', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 64 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(), // avatar_frame, badge, nameplate, etc.
  rarity: varchar('rarity', { length: 16 }).default('common').notNull(),
  priceSoft: integer('price_soft').default(0), // soft currency
  pricePremium: integer('price_premium').default(0), // premium currency
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Inventories ────────────────────────────────────────────────────

export const inventories = pgTable('inventories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cosmeticId: uuid('cosmetic_id').references(() => cosmetics.id, { onDelete: 'cascade' }).notNull(),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }).defaultNow().notNull(),
  isEquipped: boolean('is_equipped').default(false).notNull(),
}, (table) => ({
  userCosmeticUnique: uniqueIndex('uq_inventories').on(table.userId, table.cosmeticId),
}));

// ─── Currencies ─────────────────────────────────────────────────────

export const currencies = pgTable('currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  softCurrency: integer('soft_currency').default(0).notNull(),
  premiumCurrency: integer('premium_currency').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Notifications ──────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  body: varchar('body', { length: 500 }).notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user').on(table.userId, table.isRead),
}));

// ─── Game Events (Event Sourcing) ───────────────────────────────────

export const gameEvents = pgTable('game_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  sequence: integer('sequence').notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  visibility: eventVisibilityEnum('visibility').notNull(),
  actorId: uuid('actor_id'),
  targetIds: jsonb('target_ids').default([]).notNull(),
  payload: jsonb('payload').default({}).notNull(),
  serverTime: timestamp('server_time', { withTimezone: true }).defaultNow().notNull(),
  schemaVersion: integer('schema_version').default(1).notNull(),
}, (table) => ({
  gameSequenceUnique: uniqueIndex('uq_game_events_sequence').on(table.gameId, table.sequence),
  gameIdIdx: index('idx_game_events_game').on(table.gameId),
}));

// ─── Audit Logs ─────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  details: jsonb('details').default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_audit_logs_user').on(table.userId),
  resourceIdx: index('idx_audit_logs_resource').on(table.resource, table.resourceId),
}));

// ─── Matchmaking Queue ──────────────────────────────────────────────

export const matchmakingEntries = pgTable('matchmaking_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  mode: varchar('mode', { length: 32 }).notNull().default('STANDARD'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
