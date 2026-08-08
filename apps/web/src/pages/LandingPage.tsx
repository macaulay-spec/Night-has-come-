import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-lg">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">NIGHT HAS COME</h1>
          <p className="text-[#9BA6B8] text-lg">A game of lies, trust, and survival.</p>
        </div>

        <div className="flex gap-3 justify-center">
          <span className="px-3 py-1 rounded-full text-xs bg-[#72C8FF20] text-[#72C8FF] border border-[#72C8FF30]">CIVIC</span>
          <span className="px-3 py-1 rounded-full text-xs bg-[#C35CFF20] text-[#C35CFF] border border-[#C35CFF30]">VEIL</span>
          <span className="px-3 py-1 rounded-full text-xs bg-[#F0B86B20] text-[#F0B86B] border border-[#F0B86B30]">INDEPENDENT</span>
        </div>

        <p className="text-[#5E6D88] text-sm max-w-md mx-auto">
          A psychological survival social-deduction experience. Hidden identities. Deception. Suspicion. Can you tell who to trust?
        </p>

        <div className="flex flex-col gap-3">
          {isAuthenticated ? (
            <Link to="/home" className="bg-[#72C8FF] text-[#080A10] font-semibold py-3 px-8 rounded-md hover:bg-[#5EB8EF] transition-colors">
              Enter the Game
            </Link>
          ) : (
            <>
              <Link to="/signin" className="bg-[#151A25] text-[#F4F6FA] font-semibold py-3 px-8 rounded-md border border-[#1D2432] hover:border-[#323C50] transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="text-[#9BA6B8] hover:text-[#F4F6FA] transition-colors text-sm">
                New recruit? Create account →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
