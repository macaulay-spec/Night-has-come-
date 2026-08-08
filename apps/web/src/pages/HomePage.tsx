import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export function HomePage() {
  const { displayName, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1D2432]">
        <h1 className="text-lg font-bold">NIGHT HAS COME</h1>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="text-[#9BA6B8] hover:text-[#F4F6FA] text-sm">{displayName}</Link>
          <button onClick={() => { signOut(); navigate('/'); }} className="text-[#5E6D88] hover:text-[#F05D67] text-sm">Sign Out</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12 space-y-4">
        <p className="text-[#9BA6B8] text-center mb-8">Welcome back, <span className="text-[#F4F6FA]">{displayName}</span>.</p>

        <button onClick={() => navigate('/create')}
          className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-4 rounded-md hover:bg-[#5EB8EF] transition-colors text-lg">
          Create Room
        </button>

        <button onClick={() => navigate('/join')}
          className="w-full bg-[#151A25] text-[#F4F6FA] font-semibold py-4 rounded-md border border-[#1D2432] hover:border-[#323C50] transition-colors text-lg">
          Join Room
        </button>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Link to="/profile" className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 text-center hover:border-[#323C50] transition-colors">
            <span className="text-sm text-[#9BA6B8]">Profile</span>
          </Link>
          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 text-center">
            <span className="text-sm text-[#9BA6B8]">Stats</span>
          </div>
          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 text-center">
            <span className="text-sm text-[#9BA6B8]">Rules</span>
          </div>
          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 text-center">
            <span className="text-sm text-[#9BA6B8]">Settings</span>
          </div>
        </div>

        <div className="flex gap-2 justify-center pt-6">
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#72C8FF20] text-[#72C8FF]">6-12 Players</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#72D69A20] text-[#72D69A]">Text Chat</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F4B94220] text-[#F4B942]">Private Rooms</span>
        </div>
      </main>
    </div>
  );
}
