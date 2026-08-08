import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';

interface GP { id: string; displayName: string; slotIndex: number; isReady: boolean; isAlive: boolean; isHost: boolean; isAI: boolean; }
interface RoleI { roleId: string; faction: string; roleName: string; abilityDesc?: string; }
interface PhaseI { phase: string; endsAt: string; duration: number; nomineeId?: string; nomineeName?: string; }
interface ChatM { id: string; senderId: string | null; senderName: string; channel: string; content: string; timestamp: string; }
interface ElimI { playerId: string; displayName: string; faction?: string; byBlackout?: boolean; wasEliminatedByVote?: boolean; }
interface WinI { winningFaction: string; reason: string; }
interface ResultI { winner: string; reason: string; players: { id: string; displayName: string; isAlive: boolean; roleId: string | null; faction: string | null; roleName: string | null; isAI: boolean; }[]; }

const ROLE_EMOJI: Record<string, string> = {
  'civic:witness':'👁','civic:bulwark':'🛡','civic:signal-keeper':'📡','civic:mender':'🔧',
  'civic:echo-reader':'🔮','civic:archivist':'📚','civic:mediator':'⚖','civic:lantern-bearer':'🏮',
  'veil:veilblade':'🗡','veil:masksmith':'🎭','veil:threadcutter':'✂','veil:whisper-broker':'🌫',
  'veil:decoy':'🪞','veil:false-witness':'📝','independent:sable':'🦅','independent:last-light':'🕯',
  'independent:ruin-artist':'💥','independent:broker-of-names':'📜',
};

function fc(f: string | null) { if (f==='CIVIC') return 'text-[#72C8FF]'; if (f==='VEIL') return 'text-[#C35CFF]'; if (f==='INDEPENDENT') return 'text-[#F0B86B]'; return 'text-[#9BA6B8]'; }
function fbg(f: string | null) { if (f==='CIVIC') return 'bg-[#72C8FF20]'; if (f==='VEIL') return 'bg-[#C35CFF20]'; if (f==='INDEPENDENT') return 'bg-[#F0B86B20]'; return 'bg-[#1D2432]'; }

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket, connected, on, emit } = useSocket();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('LOADING');
  const [phaseEndsAt, setPhaseEndsAt] = useState(0);
  const [players, setPlayers] = useState<GP[]>([]);
  const [role, setRole] = useState<RoleI | null>(null);
  const [factionMembers, setFactionMembers] = useState<{ playerId: string; displayName: string }[]>([]);
  const [messages, setMessages] = useState<ChatM[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatChannel, setChatChannel] = useState<'public'|'faction'>('public');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const [voteCast, setVoteCast] = useState(false);
  const [elim, setElim] = useState<ElimI | null>(null);
  const [win, setWin] = useState<WinI | null>(null);
  const [results, setResults] = useState<ResultI | null>(null);
  const [votesCast, setVotesCast] = useState(0);
  const [totalAlive, setTotalAlive] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [nomineeId, setNomineeId] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!phaseEndsAt) return;
    const tick = () => setTimeLeft(Math.max(0, Math.floor((phaseEndsAt - Date.now()) / 1000)));
    tick(); const iv = setInterval(tick, 500); return () => clearInterval(iv);
  }, [phaseEndsAt]);

  // Auto-scroll chat
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);

  // Sound effects
  function playSound(type: string) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.value = 0.08;
      if (type === 'phase') { osc.frequency.value = 440; gain.gain.value = 0.05; osc.start(); osc.stop(ctx.currentTime + 0.3); }
      else if (type === 'elim') { osc.frequency.value = 150; osc.type = 'sawtooth'; osc.start(); osc.stop(ctx.currentTime + 0.8); }
      else if (type === 'vote') { osc.frequency.value = 600; osc.start(); osc.stop(ctx.currentTime + 0.15); }
      else if (type === 'win') { osc.frequency.value = 880; gain.gain.value = 0.06; osc.start(); osc.stop(ctx.currentTime + 1); }
    } catch { /* audio not supported */ }
  }

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const us = [
      on<PhaseI>('match:phase.started', (d) => {
        setPhase(d.phase); setPhaseEndsAt(new Date(d.endsAt).getTime());
        setActionDone(false); setVoteCast(false); setSelectedTarget(null); setElim(null);
        if (d.nomineeId) setNomineeId(d.nomineeId);
        playSound('phase');
      }),
      on<RoleI>('match:role', (d) => setRole(d)),
      on<{ members: { playerId: string; displayName: string }[] }>('match:faction_info', (d) => setFactionMembers(d.members)),
      on<ChatM>('match:chat.message', (d) => setMessages(p => [...p.slice(-199), d])),
      on<ElimI>('match:elimination', (d) => { setElim(d); playSound('elim'); setPlayers(p => p.map(x => x.id === d.playerId ? { ...x, isAlive: false } : x)); setTimeout(() => setElim(null), 8000); }),
      on<{ votesCast: number; totalAlive: number }>('match:vote.status', (d) => { setVotesCast(d.votesCast); setTotalAlive(d.totalAlive); }),
      on<{ tied: boolean; message: string }>('match:judgment.result', (d) => { setMessages(p => [...p, { id: crypto.randomUUID(), senderId: null, senderName: 'System', channel: 'system', content: d.message, timestamp: new Date().toISOString() }]); }),
      on<WinI>('match:win', (d) => { setWin(d); setPhase('RESULTS'); playSound('win'); }),
      on<ResultI>('match:results', (d) => { setResults(d); setPhase('RESULTS'); }),
      on<{ phase: string; players: GP[]; role: RoleI | null }>('match:snapshot', (d) => { setPhase(d.phase); setPlayers(d.players); if (d.role) setRole(d.role); }),
    ];
    return () => us.forEach(fn => fn());
  }, [socket]);

  function doAction() { if (!selectedTarget || actionDone) return; emit('match:action.submit', { gameId, actionType: 'USE_ABILITY', targetId: selectedTarget, clientCommandId: crypto.randomUUID() }); setActionDone(true); playSound('vote'); }
  function doNominate() { if (!selectedTarget) return; emit('match:nomination.submit', { gameId, targetId: selectedTarget }); setActionDone(true); }
  function doVote() { if (voteCast) return; emit('match:vote.submit', { gameId, targetId: selectedTarget }); setVoteCast(true); playSound('vote'); }
  function doChat() { if (!chatInput.trim()) return; emit('match:chat.send', { gameId, channel: chatChannel, content: chatInput.trim() }); setChatInput(''); }

  const amAlive = true; // simplified

  function renderContent() {
    switch (phase) {
      case 'ORIENTATION':
        return (
          <div className="text-center space-y-6 py-10 animate-phase-fade">
            <div className="text-7xl">{role ? (ROLE_EMOJI[role.roleId] ?? '?') : '?'}</div>
            <div className="space-y-2">
              <h2 className={`text-2xl font-bold ${fc(role?.faction ?? null)}`}>{role?.roleName ?? 'Unknown Role'}</h2>
              <p className="text-[#9BA6B8] text-sm max-w-xs mx-auto">{role?.abilityDesc}</p>
            </div>
            {role?.faction === 'VEIL' && factionMembers.length > 0 && (
              <div className="bg-[#C35CFF08] border border-[#C35CFF20] rounded-md p-3 text-sm mx-auto max-w-xs">
                <p className="text-[#C35CFF] text-xs mb-1">Your Veil allies:</p>
                {factionMembers.map(m => <span key={m.playerId} className="text-[#C35CFF] mr-2 text-xs">{m.displayName}</span>)}
              </div>
            )}
            {role?.faction === 'INDEPENDENT' && (
              <div className="bg-[#F0B86B08] border border-[#F0B86B20] rounded-md p-3 text-sm mx-auto max-w-xs">
                <p className="text-[#F0B86B] text-xs">You are Independent. Your victory is your own.</p>
              </div>
            )}
          </div>
        );

      case 'BLACKOUT_OPEN':
        return (
          <div className="space-y-3 animate-phase-fade">
            <div className="text-center py-3"><h2 className="text-xl font-bold text-[#C35CFF]">🌑 BLACKOUT</h2><p className="text-[#9BA6B8] text-xs">Select your target before time runs out</p></div>
            <div className="space-y-1">
              {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-sm transition-colors ${
                    selectedTarget === p.id ? 'border-[#C35CFF] bg-[#C35CFF10]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                  }`}>
                  <span className={p.isAI ? 'text-[#F0B86B]' : 'text-[#9BA6B8]'}>{p.isAI ? '🤖' : p.slotIndex + 1}</span>
                  <span className="flex-1">{p.displayName}</span>
                </button>
              ))}
            </div>
            <button onClick={doAction} disabled={!selectedTarget || actionDone}
              className={`w-full py-3 rounded-md font-semibold transition-colors ${actionDone ? 'bg-[#1D2432] text-[#455066]' : 'bg-[#C35CFF] text-white hover:bg-[#B04AE8]'}`}>
              {actionDone ? 'Action Submitted' : 'Confirm Action'}
            </button>
          </div>
        );

      case 'DAWN_REVEAL':
        return (
          <div className="text-center py-12 animate-phase-fade space-y-4">
            <h2 className="text-2xl font-bold text-[#F4B942]">🌅 DAWN</h2>
            <p className="text-[#9BA6B8]">The Blackout has ended.</p>
            {elim && <div className="bg-[#F05D6710] border border-[#F05D6720] rounded-md p-4"><p className="text-[#F05D67] font-bold">{elim.displayName}</p><p className="text-[#9BA6B8] text-xs">was eliminated during the Blackout</p></div>}
            {!elim && <p className="text-[#72D69A] text-sm">No one was eliminated tonight.</p>}
          </div>
        );

      case 'DISCUSSION':
        return (
          <div className="text-center py-6 animate-phase-fade space-y-2">
            <h2 className="text-xl font-bold text-[#72C8FF]">💬 DISCUSSION</h2>
            <p className="text-[#9BA6B8] text-xs">Discuss who to nominate</p>
            {elim && <div className="bg-[#F05D6710] border border-[#F05D6720] rounded-md p-3 text-sm"><span className="text-[#F05D67]">{elim.displayName}</span> <span className="text-[#9BA6B8]">was eliminated</span></div>}
          </div>
        );

      case 'NOMINATION':
        return (
          <div className="space-y-3 animate-phase-fade">
            <div className="text-center py-3"><h2 className="text-xl font-bold text-[#F4B942]">⚡ NOMINATION</h2><p className="text-[#9BA6B8] text-xs">Choose someone to put on trial</p></div>
            <div className="space-y-1">
              {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-sm ${
                    selectedTarget === p.id ? 'border-[#F4B942] bg-[#F4B94210]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                  }`}>{p.displayName}</button>
              ))}
            </div>
            <button onClick={doNominate} disabled={!selectedTarget || actionDone}
              className={`w-full py-3 rounded-md font-semibold ${actionDone ? 'bg-[#1D2432] text-[#455066]' : 'bg-[#F4B942] text-[#080A10] hover:bg-[#E0A838]'}`}>{actionDone ? 'Nominated' : 'Nominate'}</button>
          </div>
        );

      case 'DEFENSE':
        return (
          <div className="text-center py-6 animate-phase-fade space-y-3">
            <h2 className="text-xl font-bold text-[#F4B942]">🛡 DEFENSE</h2>
            <p className="text-[#9BA6B8] text-sm">The nominated player may defend themselves</p>
            <p className="text-[#F4F6FA] text-xs">Waiting for the vote...</p>
          </div>
        );

      case 'VOTE_OPEN':
        return (
          <div className="space-y-3 animate-phase-fade">
            <div className="text-center py-3">
              <h2 className="text-xl font-bold text-[#F05D67]">🗳 VOTE</h2>
              <p className="text-[#9BA6B8] text-xs">{votesCast}/{totalAlive || players.filter(p => p.isAlive).length} votes cast</p>
            </div>
            <div className="space-y-1">
              {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-sm ${
                    selectedTarget === p.id ? 'border-[#F05D67] bg-[#F05D6710]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'
                  }`}>{p.displayName}</button>
              ))}
              <button onClick={() => setSelectedTarget(null)}
                className={`w-full px-4 py-3 rounded-md border text-sm ${selectedTarget === null ? 'border-[#5E6D88] bg-[#5E6D8810]' : 'border-[#1D2432] bg-[#0E121B] hover:border-[#323C50]'}`}>
                <span className="text-[#9BA6B8]">Abstain</span>
              </button>
            </div>
            <button onClick={doVote} disabled={voteCast}
              className={`w-full py-3 rounded-md font-semibold ${voteCast ? 'bg-[#1D2432] text-[#72D69A]' : 'bg-[#F05D67] text-white hover:bg-[#D04A55]'}`}>{voteCast ? 'Vote Cast ✓' : 'Cast Vote'}</button>
          </div>
        );

      case 'RESULTS':
        return (
          <div className="text-center py-8 animate-phase-fade space-y-6">
            {win ? (
              <>
                <h2 className={`text-3xl font-bold ${fc(win.winningFaction)}`}>{win.winningFaction === 'CIVIC' ? '🏆 CIVIC VICTORY' : win.winningFaction === 'VEIL' ? '🏆 VEIL VICTORY' : 'GAME OVER'}</h2>
                <p className="text-[#9BA6B8] text-sm">{win.reason}</p>
              </>
            ) : (
              <h2 className="text-2xl font-bold">GAME OVER</h2>
            )}
            {results && (
              <div className="space-y-1 text-left max-w-xs mx-auto">
                <p className="text-[#9BA6B8] text-xs uppercase tracking-wide mb-2">Final Roster</p>
                {results.players.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0E121B] border border-[#1D2432] text-xs">
                    <span className={`w-2 h-2 rounded-full ${p.isAlive ? 'bg-[#72D69A]' : 'bg-[#F05D67]'}`} />
                    <span className="flex-1">{p.displayName}{p.isAI ? ' (AI)' : ''}</span>
                    <span className={fc(p.faction)}>{p.roleName ?? (p.faction ?? '?')}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/home')} className="bg-[#72C8FF] text-[#080A10] font-semibold py-3 px-8 rounded-md hover:bg-[#5EB8EF] transition-colors">Return Home</button>
          </div>
        );

      default:
        return <div className="text-center py-12 animate-phase-fade"><p className="text-[#9BA6B8] text-lg animate-pulse">{phase === 'LOADING' ? 'Waiting for game...' : phase}</p></div>;
    }
  }

  return (
    <div className="min-h-screen bg-[#080A10] text-[#F4F6FA] flex flex-col">
      {/* Timer header */}
      <header className="sticky top-0 z-10 bg-[#080A10]/95 backdrop-blur border-b border-[#1D2432]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${phase==='BLACKOUT_OPEN'?'text-[#C35CFF]':phase==='DISCUSSION'?'text-[#72C8FF]':phase==='NOMINATION'?'text-[#F4B942]':phase==='VOTE_OPEN'?'text-[#F05D67]':'text-[#9BA6B8]'}`}>
              {phase.replace(/_/g,' ')}
            </span>
            {role && (
              <button onClick={() => setShowRole(true)} className={`text-[10px] px-2 py-0.5 rounded-full border ${fc(role.faction)} ${fbg(role.faction)}`}>
                {role.roleName?.split(' ')[0] ?? '?'}
              </button>
            )}
            {!connected && <span className="text-[9px] text-[#F05D67]">OFFLINE</span>}
          </div>
          <div className="text-lg font-mono font-bold tabular-nums">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
        </div>
        <div className="h-0.5 bg-[#1D2432]"><div className={`h-full transition-all duration-500 ${phase==='BLACKOUT_OPEN'?'bg-[#C35CFF]':phase==='VOTE_OPEN'?'bg-[#F05D67]':'bg-[#72C8FF]'}`} style={{width:`${Math.min(100,phaseEndsAt?100-(timeLeft/Math.max(1,(phaseEndsAt-Date.now())/1000+timeLeft))*100:0)}%`}} /></div>
      </header>

      {/* Player rail */}
      <div className="flex gap-1 px-2 py-2 overflow-x-auto border-b border-[#1D2432] bg-[#0E121B]">
        {players.map(p => (
          <div key={p.id} className={`flex-shrink-0 w-10 text-center ${!p.isAlive ? 'opacity-40' : ''}`}>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${!p.isAlive?'bg-[#F05D6720] text-[#F05D67]':p.isAI?'bg-[#F0B86B20] text-[#F0B86B]':'bg-[#1D2432] text-[#9BA6B8]'}`}>
              {!p.isAlive?'✕':p.isAI?'🤖':p.slotIndex+1}
            </div>
            <p className="text-[9px] text-[#5E6D88] truncate mt-0.5">{p.displayName.slice(0,4)}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-4 py-4">{renderContent()}</main>

      {/* Chat messages */}
      <div ref={chatRef} className="max-h-32 overflow-y-auto px-4 pb-1 space-y-0.5">
        {messages.slice(-15).map(m => (
          <div key={m.id} className="text-xs leading-relaxed">
            {m.channel === 'system' ? <span className="text-[#F4B942]">⚡ {m.content}</span> :
             m.channel === 'faction' ? <><span className="text-[#9BA6B8]">[{m.senderName}]</span> <span className="text-[#C35CFF]">{m.content}</span></> :
             <><span className="text-[#5E6D88]">{m.senderName}:</span> <span>{m.content}</span></>}
          </div>
        ))}
      </div>

      {/* Chat input */}
      <footer className="border-t border-[#1D2432] bg-[#0E121B] p-2">
        <div className="flex gap-2">
          {role?.faction === 'VEIL' && (
            <button onClick={() => setChatChannel(c => c==='public'?'faction':'public')}
              className={`text-[10px] px-2 rounded border ${chatChannel==='faction'?'border-[#C35CFF] text-[#C35CFF] bg-[#C35CFF10]':'border-[#1D2432] text-[#5E6D88]'}`}>
              {chatChannel==='public'?'All':'Veil'}
            </button>
          )}
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && doChat()} maxLength={500}
            className="flex-1 bg-[#080A10] border border-[#1D2432] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#72C8FF40] placeholder:text-[#455066]"
            placeholder={chatChannel==='faction'?'Veil chat...':'Send message...'} />
          <button onClick={doChat} className="text-[#72C8FF] text-sm font-medium px-2">Send</button>
        </div>
      </footer>

      {/* Role card modal */}
      {showRole && role && (
        <div className="fixed inset-0 bg-[#080A10]/95 flex items-center justify-center z-50 p-4" onClick={()=>setShowRole(false)}>
          <div className="bg-[#151A25] border border-[#1D2432] rounded-lg p-6 max-w-xs w-full space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="text-6xl">{ROLE_EMOJI[role.roleId]??'?'}</div>
              <h2 className={`text-xl font-bold ${fc(role.faction)}`}>{role.roleName}</h2>
              <p className="text-[#9BA6B8] text-xs">Faction: {role.faction}</p>
              <p className="text-[#5E6D88] text-xs">{role.abilityDesc}</p>
            </div>
            {factionMembers.length > 0 && (
              <div className="bg-[#C35CFF08] border border-[#C35CFF20] rounded-md p-2 text-xs">
                <p className="text-[#C35CFF] mb-1">Allies:</p>
                {factionMembers.map(m => <span key={m.playerId} className="text-[#C35CFF] mr-1">{m.displayName}</span>)}
              </div>
            )}
            <button onClick={()=>setShowRole(false)} className="w-full border border-[#1D2432] rounded-md py-2 text-sm text-[#9BA6B8] hover:text-[#F4F6FA]">Close</button>
          </div>
        </div>
      )}

      {/* Elimination overlay */}
      {elim && (
        <div className="fixed inset-0 bg-[#080A10]/90 flex items-center justify-center z-50 px-4 animate-phase-fade">
          <div className="bg-[#151A25] border border-[#F05D6730] rounded-lg p-6 max-w-xs w-full text-center space-y-3">
            <p className="text-[#F05D67] text-xl font-bold">{elim.displayName}</p>
            <p className="text-[#9BA6B8] text-sm">has been eliminated</p>
            {elim.faction && <p className={`text-xs ${fc(elim.faction)}`}>Faction: {elim.faction}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
