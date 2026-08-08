import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function ProfilePage() {
  const { displayName, userId, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA]">
      <header className="flex items-center px-4 py-3 border-b border-[#1D2432]">
        <button onClick={() => navigate('/home')} className="text-[#9BA6B8] hover:text-[#F4F6FA] text-sm">← Back</button>
        <h1 className="flex-1 text-center font-bold text-sm">Profile</h1>
        <div className="w-12" />
      </header>
      <main className="max-w-sm mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-[#1D2432] border-2 border-[#323C50] mx-auto flex items-center justify-center text-2xl text-[#9BA6B8]">
            {displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <h2 className="text-xl font-bold">{displayName}</h2>
          <p className="text-[#5E6D88] text-[10px] font-mono">ID: {userId?.slice(0, 8)}...</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-3 text-center">
            <div className="text-lg font-bold text-[#72C8FF]">0</div><div className="text-[9px] text-[#5E6D88]">Games</div>
          </div>
          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-3 text-center">
            <div className="text-lg font-bold text-[#72D69A]">0</div><div className="text-[9px] text-[#5E6D88]">Wins</div>
          </div>
          <div className="bg-[#0E121B] border border-[#1D2432] rounded-md p-3 text-center">
            <div className="text-lg font-bold text-[#F4B942]">Lv.1</div><div className="text-[9px] text-[#5E6D88]">Level</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#9BA6B8]"><span>Civic Games</span><span>0 (0%)</span></div>
          <div className="flex justify-between text-xs text-[#9BA6B8]"><span>Veil Games</span><span>0 (0%)</span></div>
          <div className="flex justify-between text-xs text-[#9BA6B8]"><span>Survival Rate</span><span>0%</span></div>
          <div className="flex justify-between text-xs text-[#9BA6B8]"><span>Vote Accuracy</span><span>0%</span></div>
        </div>

        <button onClick={() => { signOut(); navigate('/'); }}
          className="w-full border border-[#F05D6730] text-[#F05D67] py-2.5 rounded-md hover:bg-[#F05D6710] transition-colors text-sm">
          Sign Out & Exit
        </button>
      </main>
    </div>
  );
}
