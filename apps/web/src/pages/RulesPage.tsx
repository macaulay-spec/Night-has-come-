import React from 'react';
import { useNavigate } from 'react-router-dom';

export function RulesPage() {
  const navigate = useNavigate();

  const rules = [
    { title: '🌑 Blackout Phase', detail: 'Each Blackout, all players choose a target in secret. Veil players eliminate targets. Civic players investigate, protect, or use special abilities. The Blackout ends after 45 seconds or when all living players have acted.' },
    { title: '🌅 Dawn', detail: 'The results of the Blackout are revealed. Eliminated players are announced. The faction of the eliminated player may be revealed depending on role abilities.' },
    { title: '💬 Discussion', detail: 'All living players discuss and debate. Share information, accuse suspects, defend yourself. Public chat is open to all living players. Veil players also have access to faction-only chat.' },
    { title: '⚡ Nomination', detail: 'Any living player can nominate one other living player for elimination. Only one nomination per round. The nominated player gets 20 seconds to defend themselves.' },
    { title: '🗳 Vote', detail: 'All living players vote: eliminate the nominated player or abstain. Majority vote eliminates. Ties result in no elimination (or a runoff if ruleset allows).' },
    { title: '🏆 Win Conditions', detail: 'CIVIC wins: All Veil eliminated. VEIL wins: Veil outnumbers or equals Civic. INDEPENDENT: Per-role conditions (survive, collect names, cause eliminations, etc.).' },
  ];

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA]">
      <header className="flex items-center px-4 py-3 border-b border-[#1D2432]">
        <button onClick={() => navigate(-1)} className="text-[#9BA6B8] hover:text-[#F4F6FA] text-sm">← Back</button>
        <h1 className="flex-1 text-center font-bold text-sm">Game Rules</h1>
        <div className="w-12" />
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-lg font-bold">THE VEIL PROTOCOL</h2>
          <p className="text-[#9BA6B8] text-xs">A game of hidden identities, deception, and survival</p>
        </div>
        {rules.map((r, i) => (
          <div key={i} className="bg-[#0E121B] border border-[#1D2432] rounded-md p-4 space-y-2">
            <h3 className="font-semibold text-sm">{r.title}</h3>
            <p className="text-[#9BA6B8] text-xs leading-relaxed">{r.detail}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
