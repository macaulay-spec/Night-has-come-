import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';

interface LobbyPlayer {
  id: string; displayName: string; slotIndex: number;
  isReady: boolean; isAlive: boolean; isHost: boolean;
}
interface LobbyState {
  gameId: string; code: string; phase: string; hostId: string;
  maxPlayers: number; players: LobbyPlayer[];
}

export function LobbyPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket, connected, on, emit } = useSocket();
  const { displayName } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<LobbyState | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket || !connected) return;
    const unsub = on<LobbyState>('room:state', (data) => {
      setRoom(data);
      if (data.phase !== 'LOBBY_OPEN' && data.phase !== 'ASSIGNMENT') {
        navigate(`/game/${gameId}`);
      }
    });
    const unsub2 = on<{ phase: string }>('match:phase.started', (data) => {
      if (data.phase !== 'LOBBY_OPEN') {
        navigate(`/game/${gameId}`);
      }
    });
    return () => { unsub(); unsub2(); };
  }, [socket, connected, gameId]);

  function handleReady() {
    emit('room:ready', { gameId });
    setReady(true);
  }

  function handleStart() {
    emit('room:start', { gameId });
  }

  function copyCode() {
    if (room?.code) {
      navigator.clipboard.writeText(room.code).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isHost = room?.hostId === socket?.id;
  const playerCount = room?.players.length ?? 0;
  const readyCount = room?.players.filter(p => p.isReady).length ?? 0;
  const canStart = isHost && playerCount >= 6 && readyCount >= playerCount;
  const myPlayer = room?.players.find(p => p.id === socket?.id);

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1D2432]">
        <h1 className="font-bold">LOBBY</h1>
        <button onClick={copyCode} className="text-sm bg-[#151A25] px-3 py-1 rounded-md border border-[#1D2432] hover:border-[#323C50] transition-colors">
          {copied ? 'Copied!' : room?.code ?? '------'}
        </button>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4 overflow-auto">
        <div className="text-center text-[#9BA6B8] text-sm">
          Share the code: <span className="text-[#F4F6FA] font-mono tracking-widest">{room?.code}</span>
        </div>

        <div className="space-y-1">
          {room?.players.map((p) => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-md border ${
              p.id === socket?.id ? 'border-[#72C8FF30] bg-[#72C8FF08]' : 'border-[#1D2432] bg-[#0E121B]'
            }`}>
              <div className="w-8 h-8 rounded-full bg-[#1D2432] flex items-center justify-center text-sm font-medium text-[#9BA6B8]">
                {p.slotIndex + 1}
              </div>
              <span className="flex-1 text-sm">{p.displayName}</span>
              {p.isHost && <span className="text-[#F4B942] text-xs">HOST</span>}
              {p.isReady && <span className="text-[#72D69A] text-xs">✓ Ready</span>}
            </div>
          ))}
          {Array.from({ length: (room?.maxPlayers ?? 0) - playerCount }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-md border border-dashed border-[#1D2432] opacity-30">
              <div className="w-8 h-8 rounded-full bg-[#1D2432] flex items-center justify-center text-sm text-[#5E6D88]">{playerCount + i + 1}</div>
              <span className="text-sm text-[#5E6D88]">Waiting for player...</span>
            </div>
          ))}
        </div>

        <div className="text-center text-[#5E6D88] text-xs">
          {playerCount}/{room?.maxPlayers} players • {readyCount} ready
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-[#1D2432]">
        {isHost ? (
          <button onClick={handleStart} disabled={!canStart}
            className={`w-full font-semibold py-3 rounded-md transition-colors ${
              canStart ? 'bg-[#72C8FF] text-[#080A10] hover:bg-[#5EB8EF]' : 'bg-[#1D2432] text-[#455066] cursor-not-allowed'
            }`}>
            {playerCount < 6 ? `Need ${6 - playerCount} more players` : readyCount < playerCount ? 'Waiting for ready...' : 'Start Game'}
          </button>
        ) : (
          <button onClick={handleReady} disabled={ready || !!myPlayer?.isReady}
            className={`w-full font-semibold py-3 rounded-md transition-colors ${
              ready || myPlayer?.isReady ? 'bg-[#1D2432] text-[#72D69A] cursor-default' : 'bg-[#72C8FF] text-[#080A10] hover:bg-[#5EB8EF]'
            }`}>
            {ready || myPlayer?.isReady ? 'Ready ✓' : 'Ready Up'}
          </button>
        )}
      </footer>
    </div>
  );
}
