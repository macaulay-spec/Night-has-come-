import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';

export function CreateRoomPage() {
  const { token } = useAuth();
  const { socket, connected, on } = useSocket();
  const navigate = useNavigate();
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [creating, setCreating] = useState(false);

  React.useEffect(() => {
    if (!socket || !connected) return;
    const unsub = on<{ gameId: string; code: string }>('room:created', (data) => {
      setCreating(false);
      navigate(`/lobby/${data.gameId}`);
    });
    return unsub;
  }, [socket, connected]);

  function handleCreate() {
    if (!socket || !connected) return;
    setCreating(true);
    socket.emit('room:create', { maxPlayers, mode: 'STANDARD' });
  }

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <button onClick={() => navigate('/home')} className="text-[#9BA6B8] hover:text-[#F4F6FA] text-sm">← Back</button>
        <h1 className="text-2xl font-bold">Create Room</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-2">Players: {maxPlayers}</label>
            <input type="range" min={6} max={12} value={maxPlayers} onChange={e => setMaxPlayers(+e.target.value)}
              className="w-full accent-[#72C8FF]" />
            <div className="flex justify-between text-xs text-[#5E6D88] mt-1">
              <span>6</span><span>8</span><span>10</span><span>12</span>
            </div>
          </div>

          {!connected && <p className="text-[#F4B942] text-sm">Connecting to server...</p>}

          <button onClick={handleCreate} disabled={creating || !connected}
            className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-3 rounded-md hover:bg-[#5EB8EF] disabled:opacity-50 transition-colors">
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
