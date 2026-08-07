import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ChevronRight, Copy, Crown, DoorOpen, Eye, HelpCircle,
  LockKeyhole, MessageCircle, Moon, Plus, Send, Settings, ShieldCheck,
  Sun, Users, Volume2, Vote, X, Zap
} from 'lucide-react';
import './styles.css';

const players = [
  { name: 'Mara V.', color: 'violet', host: true },
  { name: 'Jonah', color: 'blue' },
  { name: 'Kemi', color: 'gold' },
  { name: 'Rae', color: 'pink' },
  { name: 'Theo', color: 'green' },
  { name: 'You', color: 'red' },
];

function App() {
  const [screen, setScreen] = useState('home');
  const [modal, setModal] = useState(null);
  const [name, setName] = useState('Avery');
  const [noticeAccepted, setNoticeAccepted] = useState(false);

  const go = (next) => { setModal(null); setScreen(next); };

  return <main className="app-shell">
    <div className="ambient-glow glow-one" /><div className="ambient-glow glow-two" />
    <div className="grain" />
    <header className="site-header">
      <button className="brand" onClick={() => go('home')} aria-label="Go to home">
        <span className="brand-mark"><span /></span>
        <span>NOCTURNE <b>PROTOCOL</b></span>
      </button>
      <div className="header-actions">
        <span className="prototype-pill">INTERACTIVE PROTOTYPE</span>
        <button className="icon-button" aria-label="Settings" onClick={() => go('settings')}><Settings size={18} /></button>
      </div>
    </header>

    <section className="content">
      {screen === 'home' && <Home onGo={go} name={name} />}
      {screen === 'age' && <AgeGate accepted={noticeAccepted} setAccepted={setNoticeAccepted} onGo={go} />}
      {screen === 'identity' && <Identity name={name} setName={setName} onGo={go} />}
      {screen === 'create' && <CreateRoom onGo={go} />}
      {screen === 'join' && <JoinRoom onGo={go} />}
      {screen === 'lobby' && <Lobby onGo={go} />}
      {screen === 'role' && <RoleReveal onGo={go} />}
      {screen === 'day' && <DayGame onGo={go} onModal={setModal} />}
      {screen === 'night' && <NightGame onGo={go} onModal={setModal} />}
      {screen === 'results' && <Results onGo={go} />}
      {screen === 'settings' && <SettingsView onGo={go} />}
    </section>

    {modal === 'vote' && <VoteModal close={() => setModal(null)} onGo={go} />}
    {modal === 'action' && <ActionModal close={() => setModal(null)} onGo={go} />}
  </main>;
}

function Back({ onGo, label = 'Back' }) { return <button className="back" onClick={() => onGo('home')}><ArrowLeft size={17}/>{label}</button>; }
function Avatar({ player, small = false }) { return <span className={`avatar ${player.color} ${small ? 'small' : ''}`}>{player.name.slice(0, 1)}</span>; }

function Home({ onGo, name }) {
  return <div className="home-view page-enter">
    <div className="home-copy">
      <p className="eyebrow"><span className="live-dot" /> PRIVATE SOCIAL DEDUCTION</p>
      <h1>Trust is a<br/><em>limited resource.</em></h1>
      <p className="lede">A cinematic game of secrets, suspicion, and survival for the people you know best.</p>
      <div className="home-actions">
        <button className="button primary" onClick={() => onGo('create')}><Plus size={19}/> Create a room</button>
        <button className="button secondary" onClick={() => onGo('join')}><DoorOpen size={19}/> Join with code</button>
      </div>
      <button className="text-link" onClick={() => onGo('age')}><ShieldCheck size={16}/> Read content and safety notice <ChevronRight size={16}/></button>
    </div>
    <div className="signal-card">
      <div className="signal-top"><span>ACTIVE NETWORK</span><span className="signal-status">SECURE</span></div>
      <div className="signal-code">06:42</div>
      <div className="signal-line" />
      <p>THE PROTOCOL AWAITS<br/>YOUR NEXT GROUP.</p>
      <div className="signal-footer"><span>WELCOME, {name.toUpperCase()}</span><Zap size={15}/></div>
    </div>
  </div>
}

function AgeGate({ accepted, setAccepted, onGo }) {
 return <div className="centered-view narrow page-enter"><Back onGo={onGo}/><div className="notice-mark">18<span>+</span></div><p className="eyebrow centered">CONTENT NOTICE</p><h2>Enter by choice.</h2><p className="body-copy">Nocturne Protocol contains mature psychological themes, social deception, and dark fictional scenarios. All events take place only inside the game.</p><label className="consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span className="check"/> I confirm that I am 18 or older.</label><button className="button primary full" disabled={!accepted} onClick={() => onGo('identity')}>Continue <ChevronRight size={18}/></button><button className="text-link centered-link" onClick={() => onGo('home')}>Leave experience</button></div>
}

function Identity({ name, setName, onGo }) {
 return <div className="centered-view narrow page-enter"><Back onGo={onGo}/><p className="eyebrow centered">IDENTITY SETUP</p><h2>What should we call you?</h2><p className="body-copy">Your name is visible only to the people in your room. You can change it later.</p><div className="identity-preview"><span className="avatar red">{name.slice(0,1)}</span><span>{name || 'Your name'}</span></div><label className="field-label">DISPLAY NAME<input autoFocus maxLength="18" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter a name"/></label><button className="button primary full" disabled={!name.trim()} onClick={() => onGo('home')}>Enter protocol <ChevronRight size={18}/></button></div>
}

function CreateRoom({ onGo }) {
 const [playersCount, setPlayersCount] = useState(6); const [mode, setMode] = useState('Standard');
 return <div className="form-page page-enter"><Back onGo={onGo}/><div className="page-title"><p className="eyebrow">NEW SESSION</p><h2>Create a room</h2><p>Configure the night. Invite only the people you trust.</p></div><div className="settings-grid"><label className="field-label">ROOM NAME <input placeholder="Friday after dark" /></label><div className="setting-block"><div className="setting-heading"><span>PLAYER COUNT</span><b>{playersCount} players</b></div><input className="range" type="range" min="4" max="10" value={playersCount} onChange={e=>setPlayersCount(e.target.value)}/><div className="range-labels"><span>4</span><span>10</span></div></div><div className="setting-block"><div className="setting-heading"><span>RULE SET</span><HelpCircle size={15}/></div><div className="mode-pills">{['Standard','High Stakes','Chaos'].map(item=><button key={item} onClick={()=>setMode(item)} className={mode===item?'active':''}>{item}</button>)}</div><p className="setting-note">{mode==='Standard'?'Balanced roles. One re-vote if the room is tied.':'Additional mechanics will be available after MVP.'}</p></div><div className="two-columns"><label className="field-label">DAY LENGTH<select defaultValue="4"><option value="4">4 minutes</option><option>5 minutes</option><option>6 minutes</option></select></label><label className="field-label">NIGHT LENGTH<select defaultValue="90"><option value="90">90 seconds</option><option>2 minutes</option></select></label></div></div><button className="button primary full create-button" onClick={()=>onGo('lobby')}><LockKeyhole size={18}/> Create private room</button></div>
}

function JoinRoom({ onGo }) { const [code,setCode]=useState(''); return <div className="centered-view narrow page-enter"><Back onGo={onGo}/><p className="eyebrow centered">PRIVATE INVITATION</p><h2>Join a room</h2><p className="body-copy">Enter the four-character code shared by your host.</p><input className="code-input" value={code} onChange={e=>setCode(e.target.value.toUpperCase().slice(0,4))} placeholder="— — — —" maxLength="4"/><button className="button primary full" disabled={code.length<4} onClick={()=>onGo('lobby')}>Enter room <ChevronRight size={18}/></button><p className="microcopy"><LockKeyhole size={13}/> Private rooms are never publicly listed.</p></div> }

function Lobby({ onGo }) { return <div className="lobby-page page-enter"><div className="lobby-heading"><Back onGo={onGo} label="Leave room"/><div className="room-code"><p>ROOM CODE</p><b>V7K9</b><button aria-label="Copy code"><Copy size={15}/></button></div></div><div className="lobby-layout"><section className="room-panel"><div className="room-panel-head"><div><p className="eyebrow">FRIDAY AFTER DARK</p><h2>Waiting room</h2></div><span className="count-chip"><Users size={15}/> {players.length}/10</span></div><p className="room-subtitle">Share the code. The room opens when everyone arrives.</p><div className="player-list">{players.map(p=><div className="player-row" key={p.name}><Avatar player={p}/><span>{p.name}</span>{p.host&&<span className="host-badge"><Crown size={13}/> HOST</span>}<span className="ready-dot" /></div>)}</div><button className="button primary full" onClick={()=>onGo('role')}><Moon size={18}/> Begin the first night</button><p className="microcopy centered-text">Minimum 4 players · Standard rules · 4 min day</p></section><Chat /></div></div> }

function Chat(){ return <section className="chat-panel"><div className="chat-head"><MessageCircle size={17}/><span>ROOM CHAT</span><span className="chat-count">6 ONLINE</span></div><div className="messages"><p><b>Mara V.</b> · We are waiting for Theo.</p><p><b>Kemi</b> · I already don’t trust any of you.</p><p className="system-message">The host can begin when ready.</p></div><div className="chat-compose"><input placeholder="Message the room..."/><button aria-label="Send message"><Send size={16}/></button></div></section> }

function RoleReveal({ onGo }) { return <div className="role-view page-enter"><p className="eyebrow centered">YOUR PRIVATE DOSSIER</p><div className="role-card"><div className="role-card-top"><Eye size={20}/><span>CLASSIFIED</span></div><div className="role-symbol"><Moon size={52}/></div><p>YOU ARE</p><h1>THE DOCTOR</h1><div className="role-divider"/><h3>Keep the town alive.</h3><p className="role-description">Each night, choose one living player to protect. You may protect yourself once.</p><div className="role-meta"><span>TEAM <b>TOWN</b></span><span>ABILITY <b>PROTECT</b></span></div></div><button className="button primary" onClick={()=>onGo('day')}>I understand <ChevronRight size={18}/></button><p className="microcopy centered-text"><Eye size={13}/> Never show this screen to another player.</p></div> }

function DayGame({onGo,onModal}) { return <div className="game-view page-enter"><GameHeader phase="DAY" time="03:42" onGo={onGo}/><div className="game-layout"><section className="match-panel"><div className="event-card"><span className="event-icon sun"><Sun size={18}/></span><div><p className="eyebrow">DAY ONE</p><h3>The room is awake.</h3><p>Talk carefully. Someone in this room is working against you.</p></div></div><div className="players-status">{players.map(p=><div key={p.name} className="mini-player"><Avatar player={p} small/><span>{p.name}</span><i /></div>)}</div><div className="game-actions"><button className="button primary" onClick={()=>onModal('vote')}><Vote size={18}/> Cast your vote</button><button className="button secondary" onClick={()=>onGo('night')}><Moon size={18}/> Preview night</button></div></section><Chat /></div></div> }
function GameHeader({phase,time,onGo}){return <div className="game-header"><button className="brand compact" onClick={()=>onGo('home')}><span className="brand-mark"><span/></span> NOCTURNE</button><div className={`phase-clock ${phase.toLowerCase()}`}><span>{phase === 'DAY'?<Sun size={16}/>:<Moon size={16}/>} {phase}</span><b>{time}</b></div><button className="icon-button"><Volume2 size={18}/></button></div>}
function NightGame({onGo,onModal}) { return <div className="game-view night-view page-enter"><GameHeader phase="NIGHT" time="01:18" onGo={onGo}/><div className="night-center"><div className="night-orbit"><div className="orbit-one"/><div className="orbit-two"/><div className="doctor-glyph"><ShieldCheck size={42}/></div></div><p className="eyebrow centered">DOCTOR'S TURN</p><h2>Someone needs your protection.</h2><p className="body-copy">Choose carefully. Your decision remains private until the night is resolved.</p><button className="button primary" onClick={()=>onModal('action')}><ShieldCheck size={18}/> Protect a player</button><p className="microcopy centered-text">You may protect yourself once. You cannot protect the same player two nights in a row.</p></div></div>}

function VoteModal({close,onGo}) { const [selected,setSelected]=useState(null); return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={close}><X size={19}/></button><p className="eyebrow">DAY ONE · SECRET VOTE</p><h2>Who do you suspect?</h2><p className="body-copy">Your choice can be changed before the timer expires.</p><div className="target-list">{players.filter(p=>p.name!=='You').map(p=><button key={p.name} onClick={()=>setSelected(p.name)} className={`target ${selected===p.name?'selected':''}`}><Avatar player={p}/><span>{p.name}</span>{selected===p.name&&<Vote size={17}/>}</button>)}</div><button className="button primary full" disabled={!selected} onClick={()=>{close();onGo('night')}}>Confirm vote for {selected || 'player'}</button><button className="skip-button">Abstain from voting</button></div></div> }
function ActionModal({close,onGo}) { const [selected,setSelected]=useState(null); return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={close}><X size={19}/></button><p className="eyebrow">NIGHT ONE · DOCTOR</p><h2>Choose who to protect.</h2><p className="body-copy">If Mafia target this player tonight, they survive.</p><div className="target-list">{players.map(p=><button key={p.name} onClick={()=>setSelected(p.name)} className={`target ${selected===p.name?'selected':''}`}><Avatar player={p}/><span>{p.name}</span>{selected===p.name&&<ShieldCheck size={17}/>}</button>)}</div><button className="button primary full" disabled={!selected} onClick={()=>{close();onGo('results')}}>Protect {selected || 'player'}</button></div></div> }
function Results({onGo}){return <div className="results-view page-enter"><p className="eyebrow centered">SESSION COMPLETE · 3 ROUNDS</p><div className="winner-seal"><ShieldCheck size={28}/></div><h1>THE TOWN<br/><em>ENDURES.</em></h1><p className="lede centered-text">Every Mafia member has been identified. For now, the protocol is silent.</p><div className="results-grid">{players.map((p,i)=><div className="result-player" key={p.name}><Avatar player={p}/><div><b>{p.name}</b><span>{i===1?'MAFIA':i===5?'DOCTOR':'CIVILIAN'}</span></div><i className={i===1?'out':''}>{i===1?'ELIMINATED':'SURVIVED'}</i></div>)}</div><div className="results-actions"><button className="button primary" onClick={()=>onGo('lobby')}><Zap size={18}/> Play again</button><button className="button secondary" onClick={()=>onGo('home')}>Leave room</button></div></div>}
function SettingsView({onGo}){return <div className="centered-view narrow page-enter"><Back onGo={onGo}/><p className="eyebrow centered">PREFERENCES</p><h2>Settings</h2><div className="settings-list">{[['Sound effects',true],['Ambient audio',true],['Reduce motion',false],['Mature themes',true]].map(([l,on])=><div className="toggle-row" key={l}><span>{l}</span><button className={`toggle ${on?'on':''}`}><i/></button></div>)}</div><button className="text-link centered-link"><HelpCircle size={16}/> Rules, safety & privacy</button></div>}

createRoot(document.getElementById('root')).render(<App />);
