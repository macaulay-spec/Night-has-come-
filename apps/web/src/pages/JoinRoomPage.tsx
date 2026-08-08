import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSocket } from '../hooks/useSocket.js';

export function JoinRoomPage() {
  const { socket, connected, on } = useSocket();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!socket || !connected) return;
    const unsub1 = on<{ gameId: string; code: string }>('room:joined', (data) => {
      navigate(`/lobby/${data.gameId}`);
    });
    const unsub2 = on<{ code: string; message: string }>('match:error', (data) => {
      setError(data.message);
    });
    return () => { unsub1(); unsub2(); };
  }, [socket, connected]);

  function handleJoin() {
    if (!socket || !connected || code.length < 4) return;
    setError('');
    socket.emit('room:join', { code: code.toUpperCase() });
  }

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <button onClick={() => navigate('/home')} className="text-[#9BA6B8] hover:text-[#F4F6FA] text-sm">← Back</button>
        <h1 className="text-2xl font-bold">Join Room</h1>

        <div className="space-y-4">
          {error && <div className="bg-[#F05D6720] text-[#F05D67] text-sm p-3 rounded-md border border-[#F05D6730]">{error}</div>}
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-1">Room Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6}
              className="w-full bg-[#0E121B] border border-[#1D2432] rounded-md px-4 py-3 text-[#F4F6FA] text-xl text-center tracking-[0.3em] font-mono focus:outline-none focus:border-[#72C8FF40]"
              placeholder="XXXXXX" />
          </div>
          <button onClick={handleJoin} disabled={!connected || code.length < 4}
            className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-3 rounded-md hover:bg-[#5EB8EF] disabled:opacity-50 transition-colors">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
