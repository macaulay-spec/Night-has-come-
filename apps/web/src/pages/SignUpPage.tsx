import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function SignUpPage() {
  const { signIn } = useAuth(); const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) { setError('Choose a display name.'); return; }
    if (name.length > 32) { setError('Name too long.'); return; }
    localStorage.setItem('nhc_player_name', name);
    signIn(name); navigate('/home');
  }

  return (
    <div className="min-h-screen bg-[#080A10] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Join the Protocol</h1>
          <p className="text-[#9BA6B8] text-sm mt-1">Create your agent profile</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-[#F05D6720] text-[#F05D67] text-sm p-3 rounded-md border border-[#F05D6730]">{error}</div>}
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-1">Display Name</label>
            <input autoFocus value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={32}
              className="w-full bg-[#0E121B] border border-[#1D2432] rounded-md px-3 py-2.5 text-[#F4F6FA] focus:outline-none focus:border-[#72C8FF40] placeholder:text-[#455066]"
              placeholder="Agent name" />
          </div>
          <p className="text-[#5E6D88] text-xs">This is your in-game identity. No email or password.</p>
          <button className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-2.5 rounded-md hover:bg-[#5EB8EF] transition-colors">
            Enter the Protocol
          </button>
        </form>
        <p className="text-center text-[#9BA6B8] text-sm">
          Already enlisted? <Link to="/signin" className="text-[#72C8FF] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
