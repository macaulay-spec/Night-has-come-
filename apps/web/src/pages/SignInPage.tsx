import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function SignInPage() {
  const { signIn } = useAuth(); const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(localStorage.getItem('nhc_player_name') ?? '');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name || name.length < 1) { setError('Enter a display name.'); return; }
    if (name.length > 32) { setError('Name too long (max 32).'); return; }
    localStorage.setItem('nhc_player_name', name);
    signIn(name); navigate('/home');
  }

  return (
    <div className="min-h-screen bg-[#080A10] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">NIGHT HAS COME</h1>
          <p className="text-[#9BA6B8] text-sm mt-1">Enter your identity</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-[#F05D6720] text-[#F05D67] text-sm p-3 rounded-md border border-[#F05D6730]">{error}</div>}
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-1">Display Name</label>
            <input autoFocus value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={32}
              className="w-full bg-[#0E121B] border border-[#1D2432] rounded-md px-3 py-2.5 text-[#F4F6FA] focus:outline-none focus:border-[#72C8FF40] placeholder:text-[#455066]"
              placeholder="Agent name" />
          </div>
          <button className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-2.5 rounded-md hover:bg-[#5EB8EF] transition-colors">
            Enter the Game
          </button>
        </form>
        <p className="text-center text-[#9BA6B8] text-sm">
          First time? <Link to="/signup" className="text-[#72C8FF] hover:underline">Create identity</Link>
        </p>
      </div>
    </div>
  );
}
