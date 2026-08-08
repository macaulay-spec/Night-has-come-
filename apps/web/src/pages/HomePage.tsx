import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';

export function HomePage() {
  const { displayName, signOut } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1D2432]">
        <h1 className="font-bold text-sm">NIGHT HAS COME</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#72D69A]' : 'bg-[#F05D67]'}`} />
          <Link to="/profile" className="text-[#9BA6B8] hover:text-[#F4F6FA] text-xs">{displayName}</Link>
          <button onClick={() => { signOut(); navigate('/'); }} className="text-[#5E6D88] hover:text-[#F05D67] text-xs ml-2">Exit</button>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-10 space-y-3">
        <p className="text-center text-[#9BA6B8] text-sm mb-6">Welcome, <span className="text-[#F4F6FA]">{displayName}</span>.</p>

        <button onClick={() => navigate('/create')}
          className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-4 rounded-md hover:bg-[#5EB8EF] transition-colors text-base">
          🎮 Create Room
        </button>

        <button onClick={() => navigate('/join')}
          className="w-full bg-[#151A25] text-[#F4F6FA] font-semibold py-4 rounded-md border border-[#1D2432] hover:border-[#323C50] transition-colors text-base">
          🔗 Join Room
        </button>

        <div className="grid grid-cols-2 gap-2 pt-6">
          <Link to="/rules" className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 text-center hover:border-[#323C50]"><span className="text-sm text-[#9BA6B8]">📖 Rules</span></Link>
          <Link to="/profile" className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 text-center hover:border-[#323C50]"><span className="text-sm text-[#9BA6B8]">👤 Profile</span></Link>
        </div>

        <div className="flex gap-2 justify-center pt-6 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#72D69A20] text-[#72D69A]">Text Chat</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#72C8FF20] text-[#72C8FF]">6-12 Players</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F0B86B20] text-[#F0B86B]">AI Fill</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C35CFF20] text-[#C35CFF]">Roles</span>
        </div>
      </main>
    </div>
  );
}
