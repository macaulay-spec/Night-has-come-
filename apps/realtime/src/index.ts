import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@night-has-come/config';

// In-memory state for development (backed by Redis in production)
const rooms = new Map<string, RoomState>();
const pendingActions = new Map<string, ActionState[]>();
const chatHistory = new Map<string, ChatRecord[]>();

interface Player {
  id: string;
  userId: string;
  displayName: string;
  socketId: string;
  slotIndex: number;
  isAlive: boolean;
  isReady: boolean;
  isHost: boolean;
  isAI: boolean;
  roleId: string | null;
  faction: string | null;
}

interface RoomState {
  code: string;
  hostId: string;
  gameId: string;
  phase: string;
  maxPlayers: number;
  minPlayers: number;
  mode: string;
  players: Map<string, Player>;
  phaseStartedAt: string;
  phaseEndsAt: string | null;
  sequenceNumber: number;
  roleAssignments: Map<string, { roleId: string; faction: string }>;
  currentVote: VoteSession | null;
}

interface ActionState {
  actionId: string;
  actorId: string;
  actionType: string;
  targetId: string | null;
  phase: string;
  timestamp: string;
}

interface VoteSession {
  nominationId: string;
  nominatorId: string;
  nomineeId: string;
  votes: Map<string, string | null>;
  locked: boolean;
  runoffCount: number;
}

interface ChatRecord {
  id: string;
  senderId: string | null;
  senderName: string;
  channel: string;
  content: string;
  timestamp: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function verifyServerToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_SECRET) as { sub: string };
}

function createRoleDistribution(playerCount: number): { civic: number; veil: number; independent: number } {
  const presets: Record<number, { civic: number; veil: number; independent: number }> = {
    6: { civic: 4, veil: 2, independent: 0 },
    8: { civic: 5, veil: 2, independent: 1 },
    10: { civic: 6, veil: 3, independent: 1 },
    12: { civic: 7, veil: 3, independent: 2 },
    15: { civic: 9, veil: 4, independent: 2 },
  };
  return presets[playerCount] ?? { civic: Math.ceil(playerCount * 0.55), veil: Math.floor(playerCount * 0.3), independent: playerCount - Math.ceil(playerCount * 0.55) - Math.floor(playerCount * 0.3) };
}

function getRolesByFaction(faction: string): string[] {
  const civic = ['civic:witness', 'civic:bulwark', 'civic:signal-keeper', 'civic:mender', 'civic:echo-reader', 'civic:archivist', 'civic:mediator', 'civic:lantern-bearer'];
  const veil = ['veil:veilblade', 'veil:masksmith', 'veil:threadcutter', 'veil:whisper-broker', 'veil:decoy', 'veil:false-witness'];
  const independent = ['independent:sable', 'independent:last-light', 'independent:ruin-artist', 'independent:broker-of-names'];
  const map: Record<string, string[]> = { CIVIC: civic, VEIL: veil, INDEPENDENT: independent };
  return map[faction] ?? ['civic:witness'];
}

function assignRoles(players: Player[]): Map<string, { roleId: string; faction: string }> {
  const aliveCount = players.filter(p => !p.isAI).length;
  const dist = createRoleDistribution(aliveCount);
  const assignments = new Map<string, { roleId: string; faction: string }>();

  const slots: { roleId: string; faction: string }[] = [];
  for (let i = 0; i < dist.civic; i++) {
    const roles = getRolesByFaction('CIVIC');
    slots.push({ roleId: roles[i % roles.length] ?? 'civic:witness', faction: 'CIVIC' });
  }
  for (let i = 0; i < dist.veil; i++) {
    const roles = getRolesByFaction('VEIL');
    slots.push({ roleId: roles[i % roles.length] ?? 'veil:veilblade', faction: 'VEIL' });
  }
  for (let i = 0; i < dist.independent; i++) {
    if (dist.independent > 0) {
      const roles = getRolesByFaction('INDEPENDENT');
      slots.push({ roleId: roles[i % roles.length] ?? 'independent:sable', faction: 'INDEPENDENT' });
    }
  }

  // Fisher-Yates shuffle
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j]!, slots[i]!];
  }

  const humanPlayers = players.filter(p => !p.isAI);
  for (let i = 0; i < humanPlayers.length; i++) {
    const player = humanPlayers[i]!;
    const slot = slots[i];
    if (slot) {
      assignments.set(player.id, { roleId: slot.roleId, faction: slot.faction });
    }
  }

  return assignments;
}

async function main() {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: { origin: env.WEB_URL, methods: ['GET', 'POST'], credentials: true },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth['token'];
    if (token) {
      try {
        const payload = verifyServerToken(token);
        socket.data.userId = payload.sub;
        socket.data.authenticated = true;
      } catch {
        socket.data.authenticated = false;
        socket.data.userId = null;
      }
    } else {
      socket.data.authenticated = false;
      socket.data.userId = null;
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.info(`Socket connected: ${socket.id} (auth: ${socket.data.authenticated})`);

    // ── Room Management ────────────────────────────────────────────

    socket.on('room:create', (data: { maxPlayers?: number; mode?: string }) => {
      const code = generateRoomCode();
      const gameId = crypto.randomUUID();
      const room: RoomState = {
        code,
        hostId: socket.id,
        gameId,
        phase: 'LOBBY_OPEN',
        maxPlayers: data.maxPlayers ?? 12,
        minPlayers: 6,
        mode: data.mode ?? 'STANDARD',
        players: new Map(),
        phaseStartedAt: new Date().toISOString(),
        phaseEndsAt: null,
        sequenceNumber: 0,
        roleAssignments: new Map(),
        currentVote: null,
      };
      rooms.set(gameId, room);

      const player: Player = {
        id: socket.id,
        userId: socket.data.userId ?? socket.id,
        displayName: socket.data.userId ? `Player_${socket.data.userId.slice(0, 4)}` : socket.id.slice(0, 6),
        socketId: socket.id,
        slotIndex: 0,
        isAlive: true,
        isReady: false,
        isHost: true,
        isAI: false,
        roleId: null,
        faction: null,
      };
      room.players.set(socket.id, player);
      socket.join(gameId);

      socket.emit('room:created', { gameId, code, phase: 'LOBBY_OPEN' });
      broadcastRoomState(io, gameId);
    });

    socket.on('room:join', (data: { code: string }) => {
      const room = Array.from(rooms.values()).find(r => r.code === data.code.toUpperCase());
      if (!room) {
        socket.emit('match:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        return;
      }
      if (room.players.size >= room.maxPlayers) {
        socket.emit('match:error', { code: 'ROOM_FULL', message: 'Room is full' });
        return;
      }

      const slotIndex = findFreeSlot(room);
      const player: Player = {
        id: socket.id,
        userId: socket.data.userId ?? socket.id,
        displayName: socket.data.userId ? `Player_${socket.data.userId.slice(0, 4)}` : socket.id.slice(0, 6),
        socketId: socket.id,
        slotIndex,
        isAlive: true,
        isReady: false,
        isHost: false,
        isAI: false,
        roleId: null,
        faction: null,
      };
      room.players.set(socket.id, player);
      socket.join(room.gameId);

      socket.emit('room:joined', { gameId: room.gameId, code: room.code, phase: 'LOBBY_OPEN' });
      broadcastRoomState(io, room.gameId);
    });

    socket.on('room:ready', (data: { gameId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (player) {
        player.isReady = true;
        broadcastRoomState(io, data.gameId);
      }
    });

    socket.on('room:start', (data: { gameId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room || room.players.get(socket.id)?.isHost !== true) return;

      const readyPlayers = Array.from(room.players.values()).filter(p => p.isReady);
      if (readyPlayers.length < room.minPlayers) {
        socket.emit('match:error', { code: 'INVALID_PHASE', message: 'Not enough players ready' });
        return;
      }

      // Assign roles
      room.roleAssignments = assignRoles(Array.from(room.players.values()));
      room.phase = 'ASSIGNMENT';
      room.phaseStartedAt = new Date().toISOString();

      // Tell each player their role
      for (const [playerId, player] of room.players) {
        const assignment = room.roleAssignments.get(playerId);
        if (assignment) {
          player.roleId = assignment.roleId;
          player.faction = assignment.faction;
          io.to(playerId).emit('match:role', {
            roleId: assignment.roleId,
            faction: assignment.faction,
          });
        }
      }

      // Veil players see each other
      const veilPlayers = Array.from(room.players.entries())
        .filter(([, p]) => p.faction === 'VEIL')
        .map(([id, p]) => ({ playerId: id, displayName: p.displayName }));
      for (const [id, p] of room.players) {
        if (p.faction === 'VEIL') {
          io.to(id).emit('match:faction_info', { members: veilPlayers });
        }
      }

      // Transition phases
      setTimeout(() => transitionPhase(io, room, 'ORIENTATION'), 2000);
      setTimeout(() => transitionPhase(io, room, 'BLACKOUT_OPEN'), 32000);

      broadcastRoomState(io, data.gameId);
    });

    // ── Game Actions ────────────────────────────────────────────────

    socket.on('match:action.submit', (data: { gameId: string; actionType: string; targetId?: string; clientCommandId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player || !player.isAlive) {
        socket.emit('match:error', { code: 'PLAYER_ELIMINATED', message: 'Cannot act while eliminated' });
        return;
      }

      // Phase validation
      const actionPhaseMap: Record<string, string[]> = {
        'USE_ABILITY': ['BLACKOUT_OPEN'],
        'NOMINATE': ['NOMINATION'],
        'VOTE': ['VOTE_OPEN'],
        'DEFENSE_STATEMENT': ['DEFENSE'],
        'CHAT_SEND': ['LOBBY_OPEN', 'ORIENTATION', 'DISCUSSION', 'NOMINATION', 'DEFENSE', 'BLACKOUT_OPEN'],
      };

      const allowedPhases = actionPhaseMap[data.actionType] ?? [];
      if (!allowedPhases.includes(room.phase)) {
        socket.emit('match:action.rejected', { code: 'INVALID_PHASE', message: `Cannot ${data.actionType} in phase ${room.phase}` });
        return;
      }

      const action: ActionState = {
        actionId: data.clientCommandId,
        actorId: socket.id,
        actionType: data.actionType,
        targetId: data.targetId ?? null,
        phase: room.phase,
        timestamp: new Date().toISOString(),
      };

      const gameActions = pendingActions.get(data.gameId) ?? [];
      gameActions.push(action);
      pendingActions.set(data.gameId, gameActions);

      socket.emit('match:action.accepted', { actionId: data.clientCommandId });

      // For Blackout, check if everyone has acted
      if (room.phase === 'BLACKOUT_OPEN') {
        const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
        const actedPlayers = gameActions.filter(a => a.phase === 'BLACKOUT_OPEN').map(a => a.actorId);
        const allActed = alivePlayers.every(p => actedPlayers.includes(p.id));

        if (allActed || Date.now() - new Date(room.phaseStartedAt).getTime() > 45000) {
          resolveBlackout(io, room);
        }
      }
    });

    socket.on('match:chat.send', (data: { gameId: string; channel: string; content: string }) => {
      const room = rooms.get(data.gameId);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (!player) return;

      const msg: ChatRecord = {
        id: crypto.randomUUID(),
        senderId: socket.id,
        senderName: player.displayName,
        channel: data.channel,
        content: data.content.slice(0, 500),
        timestamp: new Date().toISOString(),
      };
      const history = chatHistory.get(data.gameId) ?? [];
      history.push(msg);
      chatHistory.set(data.gameId, history);

      if (data.channel === 'faction') {
        // Only send to same faction
        for (const [id, p] of room.players) {
          if (p.faction === player.faction) {
            io.to(id).emit('match:chat.message', msg);
          }
        }
      } else {
        io.to(data.gameId).emit('match:chat.message', msg);
      }
    });

    // ── Voting ──────────────────────────────────────────────────────

    socket.on('match:nomination.submit', (data: { gameId: string; targetId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room || room.phase !== 'NOMINATION') return;

      room.currentVote = {
        nominationId: crypto.randomUUID(),
        nominatorId: socket.id,
        nomineeId: data.targetId,
        votes: new Map(),
        locked: false,
        runoffCount: 0,
      };
      room.phase = 'DEFENSE';
      room.phaseStartedAt = new Date().toISOString();

      io.to(data.gameId).emit('match:phase.started', { phase: 'DEFENSE', endsAt: new Date(Date.now() + 20000).toISOString() });
      broadcastRoomState(io, data.gameId);

      setTimeout(() => {
        room.phase = 'VOTE_OPEN';
        room.phaseStartedAt = new Date().toISOString();
        io.to(data.gameId).emit('match:phase.started', { phase: 'VOTE_OPEN', endsAt: new Date(Date.now() + 45000).toISOString() });
        broadcastRoomState(io, data.gameId);
        setTimeout(() => resolveVote(io, room), 45000);
      }, 20000);
    });

    socket.on('match:vote.submit', (data: { gameId: string; targetId: string | null }) => {
      const room = rooms.get(data.gameId);
      if (!room || !room.currentVote || room.currentVote.locked) return;

      const player = room.players.get(socket.id);
      if (!player || !player.isAlive) return;

      room.currentVote.votes.set(socket.id, data.targetId);
      io.to(data.gameId).emit('match:vote.status', {
        votesCast: room.currentVote.votes.size,
        totalAlive: Array.from(room.players.values()).filter(p => p.isAlive).length,
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.info(`Socket disconnected: ${socket.id}`);
      // In production: mark player as disconnected, start reconnect grace timer
      for (const [gameId, room] of rooms) {
        const player = room.players.get(socket.id);
        if (player) {
          player.isReady = false;
          broadcastRoomState(io, gameId);
        }
      }
    });

    // ── Spectator ───────────────────────────────────────────────────

    socket.on('spectator:join', (data: { gameId: string }) => {
      const room = rooms.get(data.gameId);
      if (!room) return;
      socket.join(data.gameId);
      io.to(socket.id).emit('match:projection', {
        phase: room.phase,
        players: Array.from(room.players.values()).map(p => ({
          id: p.id,
          displayName: p.displayName,
          isAlive: p.isAlive,
          slotIndex: p.slotIndex,
        })),
        phaseStartedAt: room.phaseStartedAt,
      });
    });
  });

  httpServer.listen(env.REALTIME_PORT, () => {
    console.info(`Realtime server on port ${env.REALTIME_PORT}`);
  });
}

// ── Helpers ─────────────────────────────────────────────────────────

function findFreeSlot(room: RoomState): number {
  const taken = new Set(Array.from(room.players.values()).map(p => p.slotIndex));
  for (let i = 0; i < room.maxPlayers; i++) if (!taken.has(i)) return i;
  return room.players.size;
}

function broadcastRoomState(io: Server, gameId: string) {
  const room = rooms.get(gameId);
  if (!room) return;
  io.to(gameId).emit('room:state', {
    gameId,
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    phaseStartedAt: room.phaseStartedAt,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      displayName: p.displayName,
      slotIndex: p.slotIndex,
      isReady: p.isReady,
      isAlive: p.isAlive,
      isHost: p.isHost,
    })),
    currentVote: room.currentVote ? {
      nominationId: room.currentVote.nominationId,
      lockStatus: room.currentVote.locked,
    } : null,
  });
}

function transitionPhase(io: Server, room: RoomState, phase: string) {
  room.phase = phase;
  room.phaseStartedAt = new Date().toISOString();
  io.to(room.gameId).emit('match:phase.started', {
    phase,
    endsAt: new Date(Date.now() + getPhaseDuration(phase, room) * 1000).toISOString(),
  });
  broadcastRoomState(io, room.gameId);

  // Auto-transition from ORIENTATION to BLACKOUT
  if (phase === 'ORIENTATION') {
    setTimeout(() => transitionPhase(io, room, 'BLACKOUT_OPEN'), 30000);
  }
  if (phase === 'BLACKOUT_OPEN') {
    setTimeout(() => resolveBlackout(io, room), 45000);
  }
  if (phase === 'DAWN_REVEAL') {
    setTimeout(() => transitionPhase(io, room, 'DISCUSSION'), 12000);
  }
  if (phase === 'DISCUSSION') {
    setTimeout(() => transitionPhase(io, room, 'NOMINATION'), 180000);
  }
}

function getPhaseDuration(phase: string, room: RoomState): number {
  const durations: Record<string, number> = {
    LOBBY_OPEN: 300,
    ASSIGNMENT: 5,
    ORIENTATION: 30,
    BLACKOUT_OPEN: 45,
    BLACKOUT_RESOLUTION: 10,
    DAWN_REVEAL: 12,
    DISCUSSION: 180,
    NOMINATION: 30,
    DEFENSE: 20,
    VOTE_OPEN: 45,
    RESULTS: 30,
  };
  return durations[phase] ?? 30;
}

function resolveBlackout(io: Server, room: RoomState) {
  room.phase = 'BLACKOUT_RESOLUTION';
  room.phaseStartedAt = new Date().toISOString();

  const actions = pendingActions.get(room.gameId) ?? [];
  const attackActions = actions.filter(a => a.actionType === 'USE_ABILITY');

  // Simple resolution: first attack on a valid target eliminates them
  for (const action of attackActions) {
    const target = action.targetId ? room.players.get(action.targetId) : null;
    if (target && target.isAlive && action.targetId) {
      target.isAlive = false;
      io.to(room.gameId).emit('match:elimination', {
        playerId: action.targetId,
        displayName: target.displayName,
      });
      break;
    }
  }

  pendingActions.set(room.gameId, []);

  setTimeout(() => {
    room.phase = 'DAWN_REVEAL';
    room.phaseStartedAt = new Date().toISOString();
    io.to(room.gameId).emit('match:phase.started', { phase: 'DAWN_REVEAL', endsAt: new Date(Date.now() + 12000).toISOString() });
    broadcastRoomState(io, room.gameId);

    // Check win condition
    const aliveVeil = Array.from(room.players.values()).filter(p => p.isAlive && p.faction === 'VEIL').length;
    const aliveCivic = Array.from(room.players.values()).filter(p => p.isAlive && p.faction === 'CIVIC').length;

    if (aliveVeil === 0) {
      room.phase = 'RESULTS';
      io.to(room.gameId).emit('match:win', { winningFaction: 'CIVIC', reason: 'All Veil eliminated' });
    } else if (aliveCivic <= aliveVeil) {
      room.phase = 'RESULTS';
      io.to(room.gameId).emit('match:win', { winningFaction: 'VEIL', reason: 'Veil controls the majority' });
    } else {
      setTimeout(() => transitionPhase(io, room, 'DISCUSSION'), 12000);
    }

    broadcastRoomState(io, room.gameId);
  }, 10000);
}

function resolveVote(io: Server, room: RoomState) {
  if (!room.currentVote) return;
  room.currentVote.locked = true;

  const votes = room.currentVote.votes;
  const tally = new Map<string | null, number>();
  for (const [, target] of votes) {
    tally.set(target, (tally.get(target) ?? 0) + 1);
  }

  let maxVotes = 0;
  let topTarget: string | null = null;
  let isTie = false;
  for (const [target, count] of tally) {
    if (count > maxVotes) { maxVotes = count; topTarget = target; isTie = false; }
    else if (count === maxVotes && target !== topTarget) { isTie = true; }
  }

  if (topTarget && !isTie) {
    const eliminated = room.players.get(topTarget);
    if (eliminated) {
      eliminated.isAlive = false;
      io.to(room.gameId).emit('match:elimination', {
        playerId: topTarget,
        displayName: eliminated.displayName,
        faction: eliminated.faction,
        wasEliminatedByVote: true,
      });
      room.phase = 'PROTOCOL_LOCK_PRESENTATION';
    }
  } else {
    io.to(room.gameId).emit('match:judgment.result', { tied: true, message: 'Vote tied — no elimination' });
  }

  room.currentVote = null;
  broadcastRoomState(io, room.gameId);

  setTimeout(() => {
    const aliveVeil = Array.from(room.players.values()).filter(p => p.isAlive && p.faction === 'VEIL').length;
    const aliveCivic = Array.from(room.players.values()).filter(p => p.isAlive && p.faction === 'CIVIC').length;
    if (aliveVeil === 0) {
      room.phase = 'RESULTS';
      io.to(room.gameId).emit('match:win', { winningFaction: 'CIVIC', reason: 'All Veil eliminated' });
    } else if (aliveCivic <= aliveVeil) {
      room.phase = 'RESULTS';
      io.to(room.gameId).emit('match:win', { winningFaction: 'VEIL', reason: 'Veil controls the majority' });
    } else {
      transitionPhase(io, room, 'BLACKOUT_OPEN');
    }
    broadcastRoomState(io, room.gameId);
  }, 12000);
}

main();
