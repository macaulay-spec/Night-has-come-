import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

const API = '/api';

export function SignUpPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? 'Sign up failed');
      } else {
        signIn(json.data.token, json.data.userId, json.data.displayName);
        navigate('/home');
      }
    } catch {
      setError('Network error. Check that the API server is running.');
    } finally {
      setLoading(false);
    }
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
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={32}
              className="w-full bg-[#0E121B] border border-[#1D2432] rounded-md px-3 py-2.5 text-[#F4F6FA] focus:outline-none focus:border-[#72C8FF40]" placeholder="Agent name" />
          </div>
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-1">Email</label>
            <input autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0E121B] border border-[#1D2432] rounded-md px-3 py-2.5 text-[#F4F6FA] focus:outline-none focus:border-[#72C8FF40]" placeholder="agent@night.com" />
          </div>
          <div>
            <label className="text-sm text-[#9BA6B8] block mb-1">Password</label>
            <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0E121B] border border-[#1D2432] rounded-md px-3 py-2.5 text-[#F4F6FA] focus:outline-none focus:border-[#72C8FF40]" placeholder="Min 8 characters" />
          </div>
          <button disabled={loading} className="w-full bg-[#72C8FF] text-[#080A10] font-semibold py-2.5 rounded-md hover:bg-[#5EB8EF] disabled:opacity-50 transition-colors">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-[#9BA6B8] text-sm">
          Already enlisted? <Link to="/signin" className="text-[#72C8FF] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
