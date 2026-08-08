import express from 'express';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env['PORT']) || Number(process.env['REALTIME_PORT']) || 3002;
const JWT_SECRET = process.env['JWT_SECRET'] || 'dev-secret-32-chars-minimum-length-here';
const isProd = process.env['NODE_ENV'] === 'production';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Player {
  id: string; userId: string; displayName: string; socketId: string;
  slotIndex: number; isAlive: boolean; isReady: boolean; isHost: boolean;
  isAI: boolean; roleId: string | null; faction: string | null;
  cooldowns: number; // phases until can act again
  charges: Record<string, number>; // ability → remaining uses
}

interface RoomState {
  code: string; hostId: string; gameId: string; phase: string;
  maxPlayers: number; minPlayers: number; mode: string;
  players: Map<string, Player>;
  phaseStartedAt: number;
  roleAssignments: Map<string, { roleId: string; faction: string; displayName: string }>;
  currentVote: VoteSession | null;
  aiPlayers: string[];
  activeTimers: Set<ReturnType<typeof setTimeout>>;
  rosterLocked: boolean;
}

interface VoteSession {
  nominationId: string; nominatorId: string; nomineeId: string;
  votes: Map<string, string | null>; locked: boolean; runoffCount: number;
}

interface ChatRecord {
  id: string; senderId: string | null; senderName: string;
  channel: string; content: string; timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

const rooms = new Map<string, RoomState>();
const pendingActions = new Map<string, { actorId: string; targetId: string | null; phase: string }[]>();
const chatHistory = new Map<string, ChatRecord[]>();
const processedCommands = new Set<string>(); // idempotency

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(): string { let c = ''; for (let i = 0; i < 6; i++) c += CHARS[Math.floor(Math.random() * CHARS.length)]; return c; }
function uid(): string { return crypto.randomUUID(); }

const PRESETS: Record<number, { civic: number; veil: number; independent: number }> = {
  6: { civic: 4, veil: 2, independent: 0 }, 8: { civic: 5, veil: 2, independent: 1 },
  10: { civic: 6, veil: 3, independent: 1 }, 12: { civic: 7, veil: 3, independent: 2 },
  15: { civic: 9, veil: 4, independent: 2 },
};

function getDist(n: number) {
  return PRESETS[n] ?? { civic: Math.ceil(n * 0.55), veil: Math.floor(n * 0.3), independent: Math.max(0, n - Math.ceil(n * 0.55) - Math.floor(n * 0.3)) };
}

const ROLES_BY_FACTION: Record<string, string[]> = {
  CIVIC: ['civic:witness','civic:bulwark','civic:signal-keeper','civic:mender','civic:echo-reader','civic:archivist','civic:mediator','civic:lantern-bearer'],
  VEIL: ['veil:veilblade','veil:masksmith','veil:threadcutter','veil:whisper-broker','veil:decoy','veil:false-witness'],
  INDEPENDENT: ['independent:sable','independent:last-light','independent:ruin-artist','independent:broker-of-names'],
};

const ROLE_DISPLAY: Record<string, string> = {
  'civic:witness':'Witness','civic:bulwark':'Bulwark','civic:signal-keeper':'Signal Keeper',
  'civic:mender':'Mender','civic:echo-reader':'Echo Reader','civic:archivist':'Archivist',
  'civic:mediator':'Mediator','civic:lantern-bearer':'Lantern Bearer',
  'veil:veilblade':'Veilblade','veil:masksmith':'Masksmith','veil:threadcutter':'Threadcutter',
  'veil:whisper-broker':'Whisper Broker','veil:decoy':'Decoy','veil:false-witness':'False Witness',
  'independent:sable':'Sable','independent:last-light':'Last Light','independent:ruin-artist':'Ruin Artist',
  'independent:broker-of-names':'Broker of Names',
};

const ROLE_DESC: Record<string, string> = {
  'civic:witness':'Watch one player each Blackout to see if they acted.',
  'civic:bulwark':'Protect one player from elimination each Blackout (3 charges).',
  'civic:signal-keeper':'Compare two players to see if they share a faction (2 charges).',
  'civic:mender':'Restore one ability charge to another player (2 charges).',
  'civic:echo-reader':'Learn what type of action a player performed last Blackout.',
  'civic:archivist':'Record vote results. Reveal all archived votes once per game.',
  'civic:mediator':'Extend discussion by 30s. Break ties with an additional vote.',
  'civic:lantern-bearer':'Reveal one eliminated player\'s role to all Civic (2 charges).',
  'veil:veilblade':'The primary attacker. Eliminate one player each Blackout.',
  'veil:masksmith':'Disguise a Veil player to appear Civic to investigators (3 charges).',
  'veil:threadcutter':'Block one investigator from receiving results (2 charges).',
  'veil:whisper-broker':'Send false system messages to Civic players (2 charges).',
  'veil:decoy':'Redirect all investigations to yourself this Blackout (2 charges).',
  'veil:false-witness':'Frame a Civic player to appear as Veil to investigators (3 charges).',
  'independent:sable':'Survive until the end. Vanish during Blackout to avoid death.',
  'independent:last-light':'Be the last alive or survive to final 2. Your death reflects once.',
  'independent:ruin-artist':'Mark players. Get 3 marked players eliminated by vote to win.',
  'independent:broker-of-names':'Guess eliminated players\' factions. 3 correct guesses wins.',
};

const AI_NAMES = ['Ash','Raven','Cipher','Ghost','Shade','Echo','Phantom','Wraith','Silas','Nyx'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

function assignRoles(players: Player[]): Map<string, { roleId: string; faction: string; displayName: string }> {
  const humans = players.filter(p => !p.isAI).length;
  const total = players.length;
  const dist = getDist(total);

  const slots: { roleId: string; faction: string }[] = [];
  for (let i = 0; i < dist.civic; i++) { const r = ROLES_BY_FACTION['CIVIC']!; slots.push({ roleId: r[i % r.length]!, faction: 'CIVIC' }); }
  for (let i = 0; i < dist.veil; i++) { const r = ROLES_BY_FACTION['VEIL']!; slots.push({ roleId: r[i % r.length]!, faction: 'VEIL' }); }
  for (let i = 0; i < dist.independent; i++) { const r = ROLES_BY_FACTION['INDEPENDENT']!; slots.push({ roleId: r[i % r.length]!, faction: 'INDEPENDENT' }); }
  const shuffled = shuffle(slots);

  const assignments = new Map<string, { roleId: string; faction: string; displayName: string }>();
  const shuffledPlayers = shuffle(players);
  for (let i = 0; i < shuffledPlayers.length; i++) {
    const p = shuffledPlayers[i]!;
    const s = shuffled[i];
    if (s) assignments.set(p.id, { roleId: s.roleId, faction: s.faction, displayName: ROLE_DISPLAY[s.roleId]??s.roleId });
  }
  return assignments;
}

function factionColor(f: string | null): string {
  if (f === 'CIVIC') return '#72C8FF'; if (f === 'VEIL') return '#C35CFF'; if (f === 'INDEPENDENT') return '#F0B86B'; return '#9BA6B8';
}

function clearTimers(room: RoomState) {
  for (const t of room.activeTimers) clearTimeout(t);
  room.activeTimers.clear();
}

function safeTimeout(room: RoomState, fn: () => void, ms: number) {
  const t = setTimeout(() => { room.activeTimers.delete(t); fn(); }, ms);
  room.activeTimers.add(t);
  return t;
}

function broadcastRoom(io: Server, gameId: string) {
  const room = rooms.get(gameId); if (!room) return;
  io.to(gameId).emit('room:state', {
    gameId, code: room.code, phase: room.phase, hostId: room.hostId,
    maxPlayers: room.maxPlayers, phaseStartedAt: new Date(room.phaseStartedAt).toISOString(),
    players: Array.from(room.players.values()).map(p => ({
      id: p.id, displayName: p.displayName, slotIndex: p.slotIndex,
      isReady: p.isReady, isAlive: p.isAlive, isHost: p.isHost, isAI: p.isAI,
    })),
    currentVote: room.currentVote ? { nominationId: room.currentVote.nominationId, lockStatus: room.currentVote.locked } : null,
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE ENGINE
// ═══════════════════════════════════════════════════════════════════

function setPhase(io: Server, room: RoomState, phase: string, duration: number) {
  clearTimers(room);
  room.phase = phase;
  room.phaseStartedAt = Date.now();
  io.to(room.gameId).emit('match:phase.started', { phase, endsAt: new Date(Date.now() + duration * 1000).toISOString(), duration });
  broadcastRoom(io, room.gameId);
  return safeTimeout(room, () => onPhaseEnd(io, room, phase), duration * 1000);
}

function onPhaseEnd(io: Server, room: RoomState, endedPhase: string) {
  switch (endedPhase) {
    case 'ASSIGNMENT': setPhase(io, room, 'ORIENTATION', 20); break;
    case 'ORIENTATION': setPhase(io, room, 'BLACKOUT_OPEN', 45); break;
    case 'BLACKOUT_OPEN': resolveBlackout(io, room); break;
    case 'BLACKOUT_RESOLUTION': dawnPhase(io, room); break;
    case 'DAWN_REVEAL': checkWinThen(io, room, () => setPhase(io, room, 'DISCUSSION', 120)); break;
    case 'DISCUSSION': setPhase(io, room, 'NOMINATION', 30); break;
    case 'NOMINATION': checkWinThen(io, room, () => {
      if (!room.currentVote) setPhase(io, room, 'BLACKOUT_OPEN', 45);
    }); break;
    case 'DEFENSE': setPhase(io, room, 'VOTE_OPEN', 45); break;
    case 'VOTE_OPEN': resolveVote(io, room); break;
    case 'PROTOCOL_LOCK_PRESENTATION': checkWinThen(io, room, () => setPhase(io, room, 'BLACKOUT_OPEN', 45)); break;
  }
}

function checkWinThen(io: Server, room: RoomState, next: () => void) {
  const alive = Array.from(room.players.values()).filter(p => p.isAlive && p.faction);
  const aliveVeil = alive.filter(p => p.faction === 'VEIL').length;
  const aliveCivic = alive.filter(p => p.faction === 'CIVIC').length;
  if (aliveVeil === 0) { endGame(io, room, 'CIVIC', 'All Veil eliminated'); return; }
  if (aliveCivic <= aliveVeil) { endGame(io, room, 'VEIL', 'Veil controls the majority'); return; }
  if (alive.length <= 2) { endGame(io, room, 'VEIL', 'Too few players remain'); return; }
  next();
}

function endGame(io: Server, room: RoomState, winner: string, reason: string) {
  clearTimers(room);
  room.phase = 'RESULTS';
  room.phaseStartedAt = Date.now();
  io.to(room.gameId).emit('match:win', { winningFaction: winner, reason });
  // Reveal all roles on game end
  const reveal = Array.from(room.players.values()).map(p => ({
    id: p.id, displayName: p.displayName, isAlive: p.isAlive, isAI: p.isAI,
    roleId: p.roleId, faction: p.faction, roleName: p.roleId ? ROLE_DISPLAY[p.roleId] : null,
  }));
  io.to(room.gameId).emit('match:results', { winner, reason, players: reveal });
  broadcastRoom(io, room.gameId);
}

function resolveBlackout(io: Server, room: RoomState) {
  setPhase(io, room, 'BLACKOUT_RESOLUTION', 8);
  const actions = pendingActions.get(room.gameId) ?? [];
  // Filter: only Veilblade attacks (for now)
  const attacks = actions.filter(a => {
    const p = room.players.get(a.actorId);
    return p && p.roleId === 'veil:veilblade' && a.targetId;
  });
  if (attacks.length > 0) {
    const attack = attacks[0]!;
    const target = attack.targetId ? room.players.get(attack.targetId) : null;
    if (target && target.isAlive) {
      target.isAlive = false;
      io.to(room.gameId).emit('match:elimination', { playerId: target.id, displayName: target.displayName, byBlackout: true });
      addSystemMsg(io, room, `${target.displayName} was eliminated during the Blackout.`);
    }
  }
  pendingActions.set(room.gameId, []);
}

function dawnPhase(io: Server, room: RoomState) {
  const elim = Array.from(room.players.values()).find(p => !p.isAlive && p.faction);
  io.to(room.gameId).emit('match:dawn', {
    eliminated: elim ? { id: elim.id, displayName: elim.displayName, faction: elim.faction } : null,
    aliveCount: Array.from(room.players.values()).filter(p => p.isAlive).length,
  });
  checkWinThen(io, room, () => setPhase(io, room, 'DISCUSSION', 120));
}

function resolveVote(io: Server, room: RoomState) {
  if (!room.currentVote) { setPhase(io, room, 'BLACKOUT_OPEN', 45); return; }
  room.currentVote.locked = true;
  const tally = new Map<string | null, number>();
  for (const [, t] of room.currentVote.votes) tally.set(t, (tally.get(t) ?? 0) + 1);

  let max = 0; let top: string | null = null; let tied = false;
  for (const [t, c] of tally) {
    if (c > max) { max = c; top = t; tied = false; }
    else if (c === max && t !== top) { tied = true; }
  }

  if (top && !tied) {
    const p = room.players.get(top);
    if (p) {
      p.isAlive = false;
      io.to(room.gameId).emit('match:elimination', { playerId: p.id, displayName: p.displayName, faction: p.faction, wasEliminatedByVote: true });
      addSystemMsg(io, room, `${p.displayName} was eliminated by vote. Faction: ${p.faction ?? 'Unknown'}`);
    }
  } else {
    io.to(room.gameId).emit('match:judgment.result', { tied: true, message: tied ? 'Vote tied — no elimination.' : 'Not enough votes.' });
    addSystemMsg(io, room, 'The vote was tied. No one was eliminated.');
  }
  room.currentVote = null;
  room.phase = 'PROTOCOL_LOCK_PRESENTATION';
  broadcastRoom(io, room.gameId);
  checkWinThen(io, room, () => setPhase(io, room, 'BLACKOUT_OPEN', 45));
}

function addSystemMsg(io: Server, room: RoomState, content: string) {
  const msg: ChatRecord = { id: uid(), senderId: null, senderName: 'System', channel: 'system', content, timestamp: new Date().toISOString() };
  const h = chatHistory.get(room.gameId) ?? [];
  h.push(msg); chatHistory.set(room.gameId, h);
  io.to(room.gameId).emit('match:chat.message', msg);
}

// ═══════════════════════════════════════════════════════════════════
// AI PLAYERS
// ═══════════════════════════════════════════════════════════════════

function createAIPlayer(slotIndex: number, name: string): Player {
  return {
    id: `ai-${uid()}`, userId: `ai-${uid()}`, displayName: name, socketId: '',
    slotIndex, isAlive: true, isReady: true, isHost: false, isAI: true,
    roleId: null, faction: null, cooldowns: 0, charges: {},
  };
}

function getAIAction(room: RoomState, ai: Player): { targetId: string | null; action: string } {
  const alive = Array.from(room.players.values()).filter(p => p.isAlive && p.id !== ai.id);
  if (alive.length === 0) return { targetId: null, action: 'NONE' };

  if (ai.roleId === 'veil:veilblade') {
    // Target non-Veil players, prefer Civic
    const nonVeil = alive.filter(p => p.faction !== 'VEIL');
    const targets = nonVeil.length > 0 ? nonVeil : alive;
    const target = targets[Math.floor(Math.random() * targets.length)]!;
    return { targetId: target.id, action: 'USE_ABILITY' };
  }

  // Non-attackers: pick random target
  const target = alive[Math.floor(Math.random() * alive.length)]!;
  return { targetId: target.id, action: 'USE_ABILITY' };
}

function aiChat(room: RoomState, ai: Player): string | null {
  if (Math.random() > 0.4) return null; // Only speak 40% of the time per phase
  const phrases = [
    'I have a bad feeling about this.',
    'We need to be more careful.',
    'Someone is not being honest.',
    'I am watching everyone closely.',
    'The evidence is unclear.',
    'Let\'s think about this logically.',
    'I noticed something unusual.',
    'Who do you suspect?',
  ];
  return phrases[Math.floor(Math.random() * phrases.length)]!;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVER
// ═══════════════════════════════════════════════════════════════════

const app = express();
const httpServer = createServer(app);

// Serve static frontend (built with `cd apps/web && npx vite build`)
import fs from 'fs';
const distPath = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  app.get(/^(?!\/socket\.io|\/health).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.get('/', (_req, res) => res.json({ status: 'NIGHT HAS COME server running', note: 'Build frontend first: cd apps/web && npx vite build' }));
}

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 10000, pingTimeout: 5000,
});

io.on('connection', (socket: Socket) => {
  console.info(`[connect] ${socket.id}`);

  // ── ROOM CREATE ──────────────────────────────────────────────────
  socket.on('room:create', (data: { maxPlayers?: number; mode?: string; aiCount?: number }) => {
    const code = genCode(); const gameId = uid();
    const room: RoomState = {
      code, hostId: socket.id, gameId, phase: 'LOBBY_OPEN',
      maxPlayers: data.maxPlayers ?? 12, minPlayers: 6, mode: data.mode ?? 'STANDARD',
      players: new Map(), phaseStartedAt: Date.now(),
      roleAssignments: new Map(), currentVote: null, aiPlayers: [],
      activeTimers: new Set(), rosterLocked: false,
    };

    const host: Player = {
      id: socket.id, userId: socket.id, displayName: socket.data.displayName ?? `Host_${socket.id.slice(0,4)}`,
      socketId: socket.id, slotIndex: 0, isAlive: true, isReady: true, isHost: true,
      isAI: false, roleId: null, faction: null, cooldowns: 0, charges: {},
    };
    room.players.set(socket.id, host);

    // Add AI players
    const aiCount = data.aiCount ?? 0;
    for (let i = 0; i < Math.min(aiCount, room.maxPlayers - 1); i++) {
      const ai = createAIPlayer(i + 1, AI_NAMES[i % AI_NAMES.length]!);
      room.players.set(ai.id, ai);
    }

    rooms.set(gameId, room);
    socket.join(gameId);
    socket.data.gameId = gameId;
    socket.emit('room:created', { gameId, code, phase: 'LOBBY_OPEN' });
    broadcastRoom(io, gameId);
  });

  // ── ROOM JOIN ────────────────────────────────────────────────────
  socket.on('room:join', (data: { code: string; displayName?: string }) => {
    const room = Array.from(rooms.values()).find(r => r.code === data.code.toUpperCase());
    if (!room) { socket.emit('match:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' }); return; }
    if (room.players.size >= room.maxPlayers) { socket.emit('match:error', { code: 'ROOM_FULL', message: 'Room is full.' }); return; }
    if (room.rosterLocked) { socket.emit('match:error', { code: 'MATCH_NOT_ACTIVE', message: 'Match already started.' }); return; }

    const taken = new Set(Array.from(room.players.values()).map(p => p.slotIndex));
    let slot = 0; while (taken.has(slot)) slot++;

    const player: Player = {
      id: socket.id, userId: socket.id, displayName: data.displayName ?? `Player_${socket.id.slice(0,4)}`,
      socketId: socket.id, slotIndex: slot, isAlive: true, isReady: false, isHost: false,
      isAI: false, roleId: null, faction: null, cooldowns: 0, charges: {},
    };
    room.players.set(socket.id, player);
    socket.join(room.gameId);
    socket.data.gameId = room.gameId;
    socket.emit('room:joined', { gameId: room.gameId, code: room.code, phase: 'LOBBY_OPEN' });
    broadcastRoom(io, room.gameId);
    addSystemMsg(io, room, `${player.displayName} joined the room.`);
  });

  // ── READY / START ────────────────────────────────────────────────
  socket.on('room:ready', (data: { gameId: string }) => {
    const room = rooms.get(data.gameId); if (!room) return;
    const p = room.players.get(socket.id); if (p) { p.isReady = true; broadcastRoom(io, data.gameId); }
  });

  socket.on('room:start', (data: { gameId: string }) => {
    const room = rooms.get(data.gameId);
    if (!room || room.players.get(socket.id)?.isHost !== true) return;

    const humans = Array.from(room.players.values()).filter(p => !p.isAI && p.isReady);
    const totalPlayers = room.players.size;
    if (totalPlayers < room.minPlayers) { socket.emit('match:error', { code: 'INVALID_PHASE', message: `Need at least ${room.minPlayers} players.` }); return; }

    room.rosterLocked = true;
    room.roleAssignments = assignRoles(Array.from(room.players.values()));

    for (const [pid, player] of room.players) {
      const a = room.roleAssignments.get(pid);
      if (a) { player.roleId = a.roleId; player.faction = a.faction; }
    }

    // Send roles only to real players
    const veilMembers = Array.from(room.players.entries())
      .filter(([, p]) => p.faction === 'VEIL')
      .map(([id, p]) => ({ playerId: id, displayName: p.displayName }));

    for (const [pid, player] of room.players) {
      if (player.isAI) continue;
      const a = room.roleAssignments.get(pid);
      if (a) {
        io.to(pid).emit('match:role', {
          roleId: a.roleId, faction: a.faction, roleName: a.displayName,
          abilityDesc: ROLE_DESC[a.roleId] ?? 'No special ability.',
        });
      }
      if (player.faction === 'VEIL') {
        io.to(pid).emit('match:faction_info', { members: veilMembers.filter(m => m.playerId !== pid) });
      }
    }

    setPhase(io, room, 'ASSIGNMENT', 3);
    addSystemMsg(io, room, 'Roles have been assigned. The Protocol begins.');
  });

  // ── ACTIONS ──────────────────────────────────────────────────────
  socket.on('match:action.submit', (data: { gameId: string; actionType: string; targetId?: string; clientCommandId: string }) => {
    if (processedCommands.has(data.clientCommandId)) return;
    processedCommands.add(data.clientCommandId);

    const room = rooms.get(data.gameId); if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) { socket.emit('match:error', { code: 'PLAYER_ELIMINATED', message: 'You are eliminated.' }); return; }

    const phaseMap: Record<string, string[]> = {
      'USE_ABILITY': ['BLACKOUT_OPEN'], 'NOMINATE': ['NOMINATION'],
      'VOTE': ['VOTE_OPEN'], 'CHAT_SEND': ['LOBBY_OPEN','ORIENTATION','DISCUSSION','NOMINATION','DEFENSE','BLACKOUT_OPEN','DAWN_REVEAL','RESULTS'],
    };
    if (!(phaseMap[data.actionType] ?? []).includes(room.phase)) {
      socket.emit('match:action.rejected', { code: 'INVALID_PHASE', message: `Cannot do that in ${room.phase}.` }); return;
    }

    const actions = pendingActions.get(data.gameId) ?? [];
    actions.push({ actorId: socket.id, targetId: data.targetId ?? null, phase: room.phase });
    pendingActions.set(data.gameId, actions);
    socket.emit('match:action.accepted', { actionId: data.clientCommandId });

    // Check all acted in Blackout
    if (room.phase === 'BLACKOUT_OPEN') {
      const alive = Array.from(room.players.values()).filter(p => p.isAlive && !p.isAI);
      const acted = new Set(actions.filter(a => a.phase === 'BLACKOUT_OPEN').map(a => a.actorId));
      // Run AI actions
      for (const [, ai] of room.players) {
        if (!ai.isAI || !ai.isAlive) continue;
        const aiAction = getAIAction(room, ai);
        if (aiAction.action === 'USE_ABILITY' && aiAction.targetId) {
          actions.push({ actorId: ai.id, targetId: aiAction.targetId, phase: 'BLACKOUT_OPEN' });
        }
        // AI might chat
        const msg = aiChat(room, ai);
        if (msg) {
          const chat: ChatRecord = { id: uid(), senderId: ai.id, senderName: ai.displayName, channel: 'public', content: msg, timestamp: new Date().toISOString() };
          const h = chatHistory.get(data.gameId) ?? []; h.push(chat); chatHistory.set(data.gameId, h);
          io.to(data.gameId).emit('match:chat.message', chat);
        }
      }
      pendingActions.set(data.gameId, actions);
      const allActed = alive.every(p => acted.has(p.id));
      if (allActed) { clearTimers(room); resolveBlackout(io, room); }
    }
  });

  // ── CHAT ─────────────────────────────────────────────────────────
  socket.on('match:chat.send', (data: { gameId: string; channel: string; content: string }) => {
    const room = rooms.get(data.gameId); if (!room) return;
    const player = room.players.get(socket.id); if (!player) return;

    const clean = data.content.slice(0, 500).trim(); if (!clean) return;
    const msg: ChatRecord = { id: uid(), senderId: socket.id, senderName: player.displayName, channel: data.channel ?? 'public', content: clean, timestamp: new Date().toISOString() };
    const h = chatHistory.get(data.gameId) ?? []; h.push(msg); chatHistory.set(data.gameId, h);

    if (data.channel === 'faction') {
      for (const [id, p] of room.players) {
        if (p.faction === player.faction) io.to(id).emit('match:chat.message', msg);
      }
    } else {
      io.to(data.gameId).emit('match:chat.message', msg);
    }
  });

  // ── VOTING ───────────────────────────────────────────────────────
  socket.on('match:nomination.submit', (data: { gameId: string; targetId: string }) => {
    const room = rooms.get(data.gameId);
    if (!room || room.phase !== 'NOMINATION' || room.currentVote) return;
    const target = room.players.get(data.targetId);
    if (!target || !target.isAlive) return;

    room.currentVote = { nominationId: uid(), nominatorId: socket.id, nomineeId: data.targetId, votes: new Map(), locked: false, runoffCount: 0 };
    clearTimers(room);
    room.phase = 'DEFENSE'; room.phaseStartedAt = Date.now();
    io.to(data.gameId).emit('match:phase.started', { phase: 'DEFENSE', endsAt: new Date(Date.now() + 20000).toISOString(), duration: 20, nomineeId: data.targetId, nomineeName: target.displayName });
    addSystemMsg(io, room, `${room.players.get(socket.id)?.displayName ?? 'Someone'} nominated ${target.displayName}.`);
    broadcastRoom(io, data.gameId);
    safeTimeout(room, () => {
      if (room.phase === 'DEFENSE') {
        room.phase = 'VOTE_OPEN'; room.phaseStartedAt = Date.now();
        io.to(data.gameId).emit('match:phase.started', { phase: 'VOTE_OPEN', endsAt: new Date(Date.now() + 45000).toISOString(), duration: 45, nomineeId: data.targetId });
        broadcastRoom(io, data.gameId);
        safeTimeout(room, () => { if (room.phase === 'VOTE_OPEN') resolveVote(io, room); }, 45000);
      }
    }, 20000);
  });

  socket.on('match:vote.submit', (data: { gameId: string; targetId: string | null }) => {
    const room = rooms.get(data.gameId);
    if (!room?.currentVote || room.currentVote.locked) return;
    const player = room.players.get(socket.id);
    if (!player?.isAlive) return;

    room.currentVote.votes.set(socket.id, data.targetId);
    io.to(data.gameId).emit('match:vote.status', {
      votesCast: room.currentVote.votes.size,
      totalAlive: Array.from(room.players.values()).filter(p => p.isAlive).length,
    });
  });

  // ── DISCONNECT / RECONNECT ───────────────────────────────────────
  socket.on('match:reconnect', (data: { gameId: string }) => {
    const room = rooms.get(data.gameId); if (!room) return;
    const player = room.players.get(socket.id);
    if (player) {
      player.socketId = socket.id;
      socket.join(data.gameId);
      socket.data.gameId = data.gameId;
      // Send current state
      socket.emit('match:snapshot', {
        phase: room.phase, phaseStartedAt: new Date(room.phaseStartedAt).toISOString(),
        players: Array.from(room.players.values()).map(p => ({
          id: p.id, displayName: p.displayName, isAlive: p.isAlive, isAI: p.isAI, slotIndex: p.slotIndex,
        })),
        role: player.roleId ? { roleId: player.roleId, faction: player.faction, roleName: ROLE_DISPLAY[player.roleId] } : null,
      });
      // Send recent chat
      const history = chatHistory.get(data.gameId) ?? [];
      for (const msg of history.slice(-30)) socket.emit('match:chat.message', msg);
      broadcastRoom(io, data.gameId);
    }
  });

  socket.on('disconnect', () => {
    const gid = socket.data.gameId; if (!gid) return;
    const room = rooms.get(gid); if (!room) return;
    const player = room.players.get(socket.id);
    if (player && !player.isAI) {
      player.isReady = false;
      addSystemMsg(io, room, `${player.displayName} disconnected.`);
      broadcastRoom(io, gid);
    }
  });

  // ── SPECTATOR ────────────────────────────────────────────────────
  socket.on('spectator:join', (data: { gameId: string }) => {
    const room = rooms.get(data.gameId); if (!room) return;
    socket.join(data.gameId);
    socket.emit('match:projection', {
      phase: room.phase,
      players: Array.from(room.players.values()).map(p => ({ id: p.id, displayName: p.displayName, isAlive: p.isAlive, slotIndex: p.slotIndex, isAI: p.isAI })),
      phaseStartedAt: new Date(room.phaseStartedAt).toISOString(),
    });
  });

  // ── LEAVE ────────────────────────────────────────────────────────
  socket.on('room:leave', (data: { gameId: string }) => {
    const room = rooms.get(data.gameId); if (!room) return;
    const player = room.players.get(socket.id);
    if (player) {
      room.players.delete(socket.id);
      addSystemMsg(io, room, `${player.displayName} left the room.`);
      broadcastRoom(io, data.gameId);
    }
    socket.leave(data.gameId);
    if (room.players.size === 0) { clearTimers(room); rooms.delete(data.gameId); }
  });
});

// ═══════════════════════════════════════════════════════════════════
// HEALTH + START
// ═══════════════════════════════════════════════════════════════════
app.get('/health', (_req, res) => res.json({ status: 'ok', activeRooms: rooms.size, uptime: process.uptime() }));

httpServer.listen(PORT, '0.0.0.0', () => {
  console.info(`🏴 NIGHT HAS COME server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  console.info(`   Frontend: http://localhost:${PORT}`);
  console.info(`   Health:   http://localhost:${PORT}/health`);
  // Room cleanup: remove idle rooms after 30 min
  setInterval(() => {
    for (const [id, room] of rooms) {
      if (room.phase === 'LOBBY_OPEN' && Date.now() - room.phaseStartedAt > 1800000) {
        clearTimers(room); rooms.delete(id);
      }
    }
  }, 60000);
});
