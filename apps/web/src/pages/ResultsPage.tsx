import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function ResultsPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex items-center justify-center">
      <div className="text-center space-y-6">
        <h2 className="text-2xl font-bold">Game Results</h2>
        <p className="text-[#9BA6B8] text-sm">Match {gameId?.slice(0, 8)}...</p>
        <button onClick={() => navigate('/home')}
          className="bg-[#72C8FF] text-[#080A10] font-semibold py-3 px-8 rounded-md hover:bg-[#5EB8EF]">
          Return Home
        </button>
      </div>
    </div>
  );
}
