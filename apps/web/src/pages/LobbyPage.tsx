import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../hooks/useAuth.js';

interface LP { id: string; displayName: string; slotIndex: number; isReady: boolean; isAlive: boolean; isHost: boolean; isAI: boolean; }
interface LS { gameId: string; code: string; phase: string; hostId: string; maxPlayers: number; players: LP[]; }

export function LobbyPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket, connected, on, emit } = useSocket();
  const { displayName } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<LS | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => { if (connected) setConnecting(false); }, [connected]);

  useEffect(() => {
    if (!socket) return;
    const u1 = on<LS>('room:state', (d) => {
      setRoom(d);
      if (d.phase !== 'LOBBY_OPEN' && d.phase !== 'ASSIGNMENT') navigate(`/game/${gameId}`);
    });
    const u2 = on<{ phase: string }>('match:phase.started', (d) => {
      if (d.phase !== 'LOBBY_OPEN') navigate(`/game/${gameId}`);
    });
    return () => { u1(); u2(); };
  }, [socket, gameId]);

  function handleReady() { emit('room:ready', { gameId }); setReady(true); }
  function handleStart() { emit('room:start', { gameId }); }
  function copyCode() { if (room?.code) { navigator.clipboard.writeText(room.code).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); } }

  const isHost = room?.hostId === socket?.id;
  const playerCount = room?.players.length ?? 0;
  const readyCount = room?.players.filter(p => p.isReady).length ?? 0;
  const canStart = isHost && playerCount >= 6 && readyCount >= playerCount;

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1D2432]">
        <h1 className="font-bold text-sm">LOBBY</h1>
        <div className="flex items-center gap-2">
          {!connected && <span className="text-[#F4B942] text-xs">Connecting...</span>}
          <button onClick={copyCode} className="text-sm bg-[#151A25] px-3 py-1 rounded-md border border-[#1D2432] hover:border-[#323C50] font-mono tracking-widest">
            {copied ? 'Copied!' : room?.code ?? '------'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4 overflow-auto">
        <p className="text-center text-[#9BA6B8] text-xs">Share code: <span className="text-[#F4F6FA] font-mono text-sm">{room?.code}</span></p>

        <div className="space-y-1">
          {room?.players.map(p => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-md border ${
              p.id === socket?.id ? 'border-[#72C8FF30] bg-[#72C8FF08]' : 'border-[#1D2432] bg-[#0E121B]'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                p.isAI ? 'bg-[#F0B86B20] text-[#F0B86B]' : 'bg-[#1D2432] text-[#9BA6B8]'
              }`}>{p.isAI ? '🤖' : p.slotIndex + 1}</div>
              <span className="flex-1 text-sm">{p.displayName}{p.isAI ? ' (AI)' : ''}</span>
              {p.isHost && <span className="text-[#F4B942] text-xs">HOST</span>}
              {p.isReady && <span className="text-[#72D69A] text-xs">✓</span>}
            </div>
          ))}
          {Array.from({ length: (room?.maxPlayers ?? 0) - playerCount }).map((_, i) => (
            <div key={`e-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-md border border-dashed border-[#1D2432] opacity-30">
              <div className="w-8 h-8 rounded-full bg-[#1D2432]" />
              <span className="text-sm text-[#5E6D88]">Empty seat</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[#5E6D88] text-xs">{playerCount}/{room?.maxPlayers} players • {readyCount} ready • min 6 to start</p>
      </main>

      <footer className="px-4 py-3 border-t border-[#1D2432] space-y-2">
        <div className="flex gap-2 text-xs text-[#5E6D88]">
          <span>Server: {connected ? '🟢 Connected' : '🔴 Offline'}</span>
        </div>
        {isHost ? (
          <button onClick={handleStart} disabled={!canStart}
            className={`w-full font-semibold py-3 rounded-md transition-colors ${
              canStart ? 'bg-[#72C8FF] text-[#080A10] hover:bg-[#5EB8EF]' : 'bg-[#1D2432] text-[#455066]'
            }`}>
            {playerCount < 6 ? `Need ${6 - playerCount} more players` : 'Start Game'}
          </button>
        ) : (
          <button onClick={handleReady} disabled={ready}
            className={`w-full font-semibold py-3 rounded-md transition-colors ${
              ready ? 'bg-[#1D2432] text-[#72D69A]' : 'bg-[#72C8FF] text-[#080A10] hover:bg-[#5EB8EF]'
            }`}>{ready ? 'Ready ✓' : 'Ready Up'}
          </button>
        )}
      </footer>
    </div>
  );
}
