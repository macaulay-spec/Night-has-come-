import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useSocket } from '../hooks/useSocket.js';

interface GamePlayer {
  id: string; displayName: string; slotIndex: number;
  isReady: boolean; isAlive: boolean; isHost: boolean;
}
interface RoleInfo { roleId: string; faction: string; }
interface FactionMember { playerId: string; displayName: string; }
interface PhaseInfo { phase: string; endsAt: string; }
interface ChatMessage { id: string; senderId: string | null; senderName: string; channel: string; content: string; timestamp: string; }
interface EliminationInfo { playerId: string; displayName: string; faction?: string; wasEliminatedByVote?: boolean; }
interface WinInfo { winningFaction: string; reason: string; }

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket, connected, on, emit } = useSocket();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<string>('LOADING');
  const [phaseEndsAt, setPhaseEndsAt] = useState<number>(0);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [role, setRole] = useState<RoleInfo | null>(null);
  const [factionMembers, setFactionMembers] = useState<FactionMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatChannel, setChatChannel] = useState<'public' | 'faction'>('public');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [voteCast, setVoteCast] = useState(false);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [elimination, setElimination] = useState<EliminationInfo | null>(null);
  const [winResult, setWinResult] = useState<WinInfo | null>(null);
  const [votesCast, setVotesCast] = useState(0);
  const [totalAlive, setTotalAlive] = useState(0);
  const [showRoleCard, setShowRoleCard] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!phaseEndsAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((phaseEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !connected) return;

    const unsubs = [
      on<PhaseInfo>('match:phase.started', (data) => {
        setPhase(data.phase);
        setPhaseEndsAt(new Date(data.endsAt).getTime());
        setActionSubmitted(false);
        setVoteCast(false);
        setSelectedTarget(null);
        setElimination(null);
        if (data.phase === 'RESULTS') {
          setPhase('RESULTS');
        }
      }),

      on<RoleInfo>('match:role', (data) => {
        setRole(data);
      }),

      on<{ members: FactionMember[] }>('match:faction_info', (data) => {
        setFactionMembers(data.members);
      }),

      on<ChatMessage>('match:chat.message', (data) => {
        setChatMessages(prev => [...prev.slice(-99), data]);
      }),

      on<{ playerId: string; displayName: string; faction?: string; }>('match:elimination', (data) => {
        setElimination(data);
        setPlayers(prev => prev.map(p => p.id === data.playerId ? { ...p, isAlive: false } : p));
        setTimeout(() => setElimination(null), 8000);
      }),

      on<{ votesCast: number; totalAlive: number }>('match:vote.status', (data) => {
        setVotesCast(data.votesCast);
        setTotalAlive(data.totalAlive);
      }),

      on<WinInfo>('match:win', (data) => {
        setWinResult(data);
        setPhase('RESULTS');
      }),

      on<{ message: string }>('match:error', (data) => {
        console.warn('Game error:', data.message);
      }),
    ];

    return () => unsubs.forEach(fn => fn());
  }, [socket, connected]);

  // Send action
  function handleAbility() {
    if (!selectedTarget || actionSubmitted) return;
    emit('match:action.submit', {
      gameId, actionType: 'USE_ABILITY', targetId: selectedTarget,
      clientCommandId: crypto.randomUUID(),
    });
    setActionSubmitted(true);
  }

  function handleNominate() {
    if (!selectedTarget) return;
    emit('match:nomination.submit', { gameId, targetId: selectedTarget });
    setActionSubmitted(true);
  }

  function handleVote() {
    if (voteCast) return;
    emit('match:vote.submit', { gameId, targetId: selectedTarget });
    setVoteCast(true);
  }

  function handleChat() {
    if (!chatInput.trim()) return;
    emit('match:chat.send', { gameId, channel: chatChannel, content: chatInput.trim() });
    setChatInput('');
  }

  // Get faction color
  function factionColor(faction: string | null | undefined) {
    if (faction === 'CIVIC') return 'text-[#72C8FF]';
    if (faction === 'VEIL') return 'text-[#C35CFF]';
    if (faction === 'INDEPENDENT') return 'text-[#F0B86B]';
    return 'text-[#9BA6B8]';
  }

  // Role display
  const roleEmojis: Record<string, string> = {
    'civic:witness': '👁', 'civic:bulwark': '🛡', 'civic:signal-keeper': '📡',
    'civic:mender': '🔧', 'civic:echo-reader': '🔮', 'civic:archivist': '📚',
    'civic:mediator': '⚖', 'civic:lantern-bearer': '🏮',
    'veil:veilblade': '🗡', 'veil:masksmith': '🎭', 'veil:threadcutter': '✂',
    'veil:whisper-broker': '🌫', 'veil:decoy': '🪞', 'veil:false-witness': '📝',
    'independent:sable': '🦅', 'independent:last-light': '🕯', 'independent:ruin-artist': '💥',
    'independent:broker-of-names': '📜',
  };

  const roleDisplayName: Record<string, string> = {
    'civic:witness': 'Witness', 'civic:bulwark': 'Bulwark', 'civic:signal-keeper': 'Signal Keeper',
    'civic:mender': 'Mender', 'civic:echo-reader': 'Echo Reader', 'civic:archivist': 'Archivist',
    'civic:mediator': 'Mediator', 'civic:lantern-bearer': 'Lantern Bearer',
    'veil:veilblade': 'Veilblade', 'veil:masksmith': 'Masksmith', 'veil:threadcutter': 'Threadcutter',
    'veil:whisper-broker': 'Whisper Broker', 'veil:decoy': 'Decoy', 'veil:false-witness': 'False Witness',
    'independent:sable': 'Sable', 'independent:last-light': 'Last Light', 'independent:ruin-artist': 'Ruin Artist',
    'independent:broker-of-names': 'Broker of Names',
  };

  // Phase-specific UI
  function renderPhaseUI() {
    switch (phase) {
      case 'ORIENTATION':
        return (
          <div className="text-center space-y-4 py-12 animate-phase-fade">
            <div className="text-6xl">{role ? roleEmojis[role.roleId] ?? '❓' : '❓'}</div>
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold ${factionColor(role?.faction)}`}>{role ? roleDisplayName[role.roleId] ?? role.roleId : '...'}</h2>
              <p className="text-[#9BA6B8] text-sm">{role?.faction === 'CIVIC' ? 'You serve the Civic. Find the Veil.' : role?.faction === 'VEIL' ? 'You are Veil. Eliminate the Civic.' : 'You walk your own path.'}</p>
            </div>
            {factionMembers.length > 0 && (
              <div className="bg-[#C35CFF10] border border-[#C35CFF20] rounded-md p-3 text-sm">
                <p className="text-[#C35CFF] text-xs mb-1">Your Veil allies:</p>
                {factionMembers.map(m => <span key={m.playerId} className="text-[#C35CFF] mr-2">{m.displayName}</span>)}
              </div>
            )}
          </div>
        );

      case 'BLACKOUT_OPEN':
        return (
          <div className="space-y-4 animate-phase-fade">
            <div className="text-center py-4">
              <h2 className="text-xl font-bold text-[#C35CFF]">BLACKOUT</h2>
              <p className="text-[#9BA6B8] text-sm">Select your target</p>
            </div>
            <div className="space-y-1">
              {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border transition-colors text-left ${
                    selectedTarget === p.id ? 'border-[#C35CFF] bg-[#C35CFF10]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                  }`}>
                  <span className="w-6 h-6 rounded-full bg-[#1D2432] flex items-center justify-center text-xs text-[#9BA6B8]">{p.slotIndex + 1}</span>
                  <span className="flex-1 text-sm">{p.displayName}</span>
                  {selectedTarget === p.id && <span className="text-[#C35CFF] text-xs">Selected</span>}
                </button>
              ))}
            </div>
            <button onClick={handleAbility} disabled={!selectedTarget || actionSubmitted}
              className={`w-full font-semibold py-3 rounded-md transition-colors ${
                actionSubmitted ? 'bg-[#1D2432] text-[#455066]' : 'bg-[#C35CFF] text-white hover:bg-[#B04AE8] disabled:opacity-50'
              }`}>
              {actionSubmitted ? 'Action Submitted' : 'Confirm Action'}
            </button>
          </div>
        );

      case 'DAWN_REVEAL':
        return (
          <div className="text-center py-12 animate-phase-fade space-y-4">
            <h2 className="text-2xl font-bold text-[#F4B942]">DAWN</h2>
            <p className="text-[#9BA6B8]">The Blackout has ended...</p>
            {elimination && (
              <div className="bg-[#F05D6710] border border-[#F05D6720] rounded-md p-4">
                <p className="text-[#F05D67] text-sm">{elimination.displayName} has been eliminated</p>
              </div>
            )}
          </div>
        );

      case 'DISCUSSION':
        return (
          <div className="text-center py-8 animate-phase-fade space-y-2">
            <h2 className="text-xl font-bold text-[#72C8FF]">DISCUSSION</h2>
            <p className="text-[#9BA6B8] text-sm">Discuss who to nominate for elimination</p>
            {elimination && (
              <div className="bg-[#F05D6710] border border-[#F05D6720] rounded-md p-3">
                <p className="text-[#F05D67] text-sm">{elimination.displayName} was eliminated</p>
              </div>
            )}
          </div>
        );

      case 'NOMINATION':
        return (
          <div className="space-y-4 animate-phase-fade">
            <div className="text-center py-4">
              <h2 className="text-xl font-bold text-[#F4B942]">NOMINATION</h2>
              <p className="text-[#9BA6B8] text-sm">Select a player to nominate</p>
            </div>
            <div className="space-y-1">
              {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border transition-colors ${
                    selectedTarget === p.id ? 'border-[#F4B942] bg-[#F4B94210]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                  }`}>
                  <span className="text-sm">{p.displayName}</span>
                </button>
              ))}
            </div>
            <button onClick={handleNominate} disabled={!selectedTarget || actionSubmitted}
              className="w-full bg-[#F4B942] text-[#080A10] font-semibold py-3 rounded-md hover:bg-[#E0A838] disabled:opacity-50 transition-colors">
              {actionSubmitted ? 'Nominated' : 'Nominate'}
            </button>
          </div>
        );

      case 'VOTE_OPEN':
        return (
          <div className="space-y-4 animate-phase-fade">
            <div className="text-center py-4">
              <h2 className="text-xl font-bold text-[#F05D67]">VOTE</h2>
              <p className="text-[#9BA6B8] text-sm">Cast your vote ({votesCast}/{totalAlive || players.filter(p => p.isAlive).length} voted)</p>
            </div>
            <div className="space-y-1">
              {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border ${
                    selectedTarget === p.id ? 'border-[#F05D67] bg-[#F05D6710]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                  }`}>
                  <span className="text-sm">{p.displayName}</span>
                </button>
              ))}
              <button onClick={() => setSelectedTarget(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border ${
                  selectedTarget === null ? 'border-[#5E6D88] bg-[#5E6D8810]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                }`}>
                <span className="text-sm text-[#9BA6B8]">Abstain</span>
              </button>
            </div>
            <button onClick={handleVote} disabled={voteCast || selectedTarget === undefined}
              className={`w-full font-semibold py-3 rounded-md transition-colors ${
                voteCast ? 'bg-[#1D2432] text-[#72D69A]' : 'bg-[#F05D67] text-white hover:bg-[#D04A55]'
              }`}>
              {voteCast ? 'Vote Cast ✓' : 'Cast Vote'}
            </button>
          </div>
        );

      case 'RESULTS':
        return (
          <div className="text-center py-12 animate-phase-fade space-y-6">
            {winResult ? (
              <>
                <h2 className={`text-3xl font-bold ${factionColor(winResult.winningFaction)}`}>
                  {winResult.winningFaction === 'CIVIC' ? 'CIVIC VICTORY' : winResult.winningFaction === 'VEIL' ? 'VEIL VICTORY' : 'GAME OVER'}
                </h2>
                <p className="text-[#9BA6B8]">{winResult.reason}</p>
                <button onClick={() => navigate('/home')}
                  className="bg-[#72C8FF] text-[#080A10] font-semibold py-3 px-8 rounded-md hover:bg-[#5EB8EF] transition-colors">
                  Return Home
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#F4F6FA]">GAME OVER</h2>
                <button onClick={() => navigate('/home')}
                  className="bg-[#72C8FF] text-[#080A10] font-semibold py-3 px-8 rounded-md hover:bg-[#5EB8EF] transition-colors">
                  Return Home
                </button>
              </>
            )}

            <div className="space-y-1 pt-4">
              <p className="text-[#9BA6B8] text-xs uppercase tracking-wide mb-2">Final Roster</p>
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0E121B] border border-[#1D2432]">
                  <span className={`w-2 h-2 rounded-full ${p.isAlive ? 'bg-[#72D69A]' : 'bg-[#F05D67]'}`} />
                  <span className="text-sm">{p.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 animate-phase-fade">
            <p className="text-[#9BA6B8] text-lg">{phase}</p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex flex-col">
      {/* Timer Header */}
      <header className="sticky top-0 z-10 bg-[#080A10] border-b border-[#1D2432]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase ${phase === 'BLACKOUT_OPEN' ? 'text-[#C35CFF]' : phase === 'DISCUSSION' ? 'text-[#72C8FF]' : phase === 'NOMINATION' ? 'text-[#F4B942]' : phase === 'VOTE_OPEN' ? 'text-[#F05D67]' : 'text-[#9BA6B8]'}`}>
              {phase.replace(/_/g, ' ')}
            </span>
            {role && (
              <button onClick={() => setShowRoleCard(true)} className={`text-xs px-2 py-0.5 rounded-full ${factionColor(role.faction)} bg-opacity-10 border`}>
                {roleDisplayName[role.roleId]?.split(' ')[0] ?? '?'}
              </button>
            )}
          </div>
          <div className="text-lg font-mono font-bold tabular-nums">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-[#1D2432]">
          <div className={`h-full transition-all duration-500 ${
            phase === 'BLACKOUT_OPEN' ? 'bg-[#C35CFF]' : phase === 'DISCUSSION' ? 'bg-[#72C8FF]' : 'bg-[#72C8FF]'
          }`} style={{ width: phaseEndsAt ? `${100 - (timeLeft / (Math.max(1, (phaseEndsAt - Date.now()) / 1000 + timeLeft)) * 100)}%` : '0%' }} />
        </div>
      </header>

      {/* Player Rail - top scroll on mobile */}
      <div className="flex gap-1 px-2 py-2 overflow-x-auto border-b border-[#1D2432] bg-[#0E121B]">
        {players.map(p => (
          <div key={p.id} className={`flex-shrink-0 w-10 text-center px-1 ${
            !p.isAlive ? 'opacity-40' : ''
          }`}>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
              !p.isAlive ? 'bg-[#F05D6720] text-[#F05D67]' : 'bg-[#1D2432] text-[#9BA6B8]'
            }`}>
              {p.slotIndex + 1}
            </div>
            <p className="text-[9px] text-[#5E6D88] truncate mt-0.5">{p.displayName.slice(0, 3)}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-4">
        {renderPhaseUI()}

        {/* Chat messages */}
        <div className="mt-4 space-y-2">
          {chatMessages.slice(-20).map(msg => (
            <div key={msg.id} className="text-xs">
              {msg.channel === 'system' ? (
                <span className="text-[#F4B942]">⚡ {msg.content}</span>
              ) : (
                <>
                  <span className="text-[#5E6D88]">{msg.senderName}: </span>
                  <span className={msg.channel === 'faction' ? 'text-[#C35CFF]' : 'text-[#F4F6FA]'}>{msg.content}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Chat Input */}
      <footer className="border-t border-[#1D2432] bg-[#0E121B] p-3">
        <div className="flex gap-2">
          {role?.faction === 'VEIL' && (
            <button onClick={() => setChatChannel(c => c === 'public' ? 'faction' : 'public')}
              className={`text-xs px-2 rounded-md border transition-colors ${
                chatChannel === 'faction' ? 'border-[#C35CFF] text-[#C35CFF] bg-[#C35CFF10]' : 'border-[#1D2432] text-[#5E6D88]'
              }`}>
              {chatChannel === 'public' ? 'All' : 'Veil'}
            </button>
          )}
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} maxLength={500}
            className="flex-1 bg-[#080A10] border border-[#1D2432] rounded-md px-3 py-2 text-sm text-[#F4F6FA] focus:outline-none focus:border-[#72C8FF40]"
            placeholder={chatChannel === 'faction' ? 'Veil chat...' : 'Send message...'} />
          <button onClick={handleChat} className="text-[#72C8FF] text-sm font-medium px-2">Send</button>
        </div>
      </footer>

      {/* Role Card Modal */}
      {showRoleCard && role && (
        <div className="fixed inset-0 bg-[#080A10]/90 flex items-center justify-center z-50 p-4" onClick={() => setShowRoleCard(false)}>
          <div className="bg-[#151A25] border border-[#1D2432] rounded-lg p-6 max-w-xs w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="text-5xl">{roleEmojis[role.roleId] ?? '❓'}</div>
              <h2 className={`text-xl font-bold ${factionColor(role.faction)}`}>{roleDisplayName[role.roleId] ?? role.roleId}</h2>
              <p className="text-[#9BA6B8] text-xs">Faction: {role.faction}</p>
            </div>
            {factionMembers.length > 0 && (
              <div className="bg-[#C35CFF08] border border-[#C35CFF20] rounded-md p-2 text-xs">
                <p className="text-[#C35CFF]">Allies: {factionMembers.map(m => m.displayName).join(', ')}</p>
              </div>
            )}
            <button onClick={() => setShowRoleCard(false)}
              className="w-full border border-[#1D2432] rounded-md py-2 text-sm text-[#9BA6B8] hover:text-[#F4F6FA] transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Elimination Modal */}
      {elimination && (
        <div className="fixed inset-0 bg-[#080A10]/90 flex items-center justify-center z-50 px-4 animate-phase-fade">
          <div className="bg-[#151A25] border border-[#F05D6730] rounded-lg p-6 max-w-xs w-full text-center space-y-3">
            <p className="text-[#F05D67] text-lg font-bold">{elimination.displayName}</p>
            <p className="text-[#9BA6B8] text-sm">has been eliminated</p>
            {elimination.faction && <p className={`text-xs ${factionColor(elimination.faction)}`}>Faction: {elimination.faction}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
