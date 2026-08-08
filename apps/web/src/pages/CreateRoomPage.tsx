import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';

export function CreateRoomPage() {
  const { socket, connected, on } = useSocket();
  const navigate = useNavigate();
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [aiCount, setAiCount] = useState(4);
  const [creating, setCreating] = useState(false);

  React.useEffect(() => {
    if (!socket) return;
    const u = on<{ gameId: string; code: string }>('room:created', (d) => {
      setCreating(false); navigate(`/lobby/${d.gameId}`);
    });
    return u;
  }, [socket]);

  function handleCreate() {
    if (!socket || !connected) return;
    setCreating(true);
    socket.emit('room:create', { maxPlayers, mode: 'STANDARD', aiCount });
  }

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <button onClick={() => navigate('/home')} className="text-[#9BA6B8] hover:text-[#F4F6FA] text-sm">← Back</button>
        <h1 className="text-2xl font-bold">Create Room</h1>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-2">Players: {maxPlayers}</label>
            <input type="range" min={6} max={12} value={maxPlayers} onChange={e => setMaxPlayers(+e.target.value)} className="w-full accent-[#72C8FF]" />
            <div className="flex justify-between text-xs text-[#5E6D88] mt-1"><span>6</span><span>8</span><span>10</span><span>12</span></div>
          </div>

          <div>
            <label className="text-sm text-[#9BA6B8] block mb-2">AI Players: {aiCount}</label>
            <input type="range" min={0} max={maxPlayers - 1} value={aiCount} onChange={e => setAiCount(+e.target.value)} className="w-full accent-[#F0B86B]" />
            <div className="flex justify-between text-xs text-[#5E6D88] mt-1"><span>0 (no AI)</span><span>{maxPlayers - 1} (max)</span></div>
            <p className="text-[#5E6D88] text-[10px] mt-1">AI fill empty seats to reach minimum players</p>
          </div>

          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-3 text-xs text-[#9BA6B8]">
            <p>With {maxPlayers} players and {aiCount} AI: <b className="text-[#F4F6FA]">{maxPlayers - aiCount} human</b> slots available. Minimum 6 players required to start (AI count toward this).</p>
          </div>

          <button onClick={handleCreate} disabled={creating || !connected}
            className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-3 rounded-md hover:bg-[#5EB8EF] disabled:opacity-50 transition-colors">
            {!connected ? 'Connecting...' : creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
