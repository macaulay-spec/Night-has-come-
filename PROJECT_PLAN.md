# Project Plan — Codename: Night Has Come

**Status:** Founder draft for review — no product code has been started  
**Prepared:** August 7, 2026  
**Decision owner:** Product founder  
**Author stance:** Product co-founder / technical lead

---

## 1. Executive decision

We will build an **original, mobile-first social deduction game for private groups**, presented as a cinematic psychological thriller.

The game lets 4–10 players enter a private room, receive secret identities, discuss and deceive one another during the Day, make hidden role decisions at Night, and reach a team win condition. It will feel tense, elegant, and mysterious rather than graphic or exploitative.

The current name **“Night Has Come” is a working codename only.** Because it is associated with an existing television property, we will not use its characters, story, visual assets, dialogue, or distinctive plot material. Before public launch, we will choose and clear an original product name and brand.

### The founder decision for Version 1

Build a **responsive web app and installable PWA**, not a native app first.

Why:
- A link or room code lets a whole group join immediately, on phone or desktop.
- No app-store approval delays while we learn whether the game is genuinely fun.
- Faster product iteration and multiplayer testing.
- The application will still be designed mobile-first and can later be packaged or rebuilt in Expo/React Native.
- The difficult work is secure multiplayer game logic, not native device features.

### What success looks like

A group of friends can open the game, join a private room in under two minutes, understand the rules without a host explaining them, play a full 20–35 minute match, and want to press **Play Again**.

---

## 2. Product thesis

### The problem

Most online social deduction games are either:
- visually generic party tools,
- difficult for first-time players to learn,
- optimized for public lobbies rather than friend groups,
- overly dependent on an external voice call,
- or too chaotic to create a polished shared experience.

Friends want a game that creates suspense and memorable conversations without requiring one person to manually host rules, track votes, secretly assign roles, or resolve disputes.

### Our solution

A private-room game master in the form of a beautifully designed app. The system runs every rule fairly, protects secret information, controls the rhythm of the game, and creates a dramatic atmosphere around every decision.

### Product promise

> Enter after dark. Trust carefully. Vote before time runs out.

### Experience principles

1. **The group is the game.** The app facilitates player interaction; it does not bury it beneath complicated mechanics.
2. **Tension, not gore.** We create psychological suspense with pacing, writing, sound, and visual mood—not graphic imagery.
3. **Fair by design.** The server is the referee. Roles, actions, votes, and timers are never trusted to a player device.
4. **Easy to begin, deep to replay.** A new player should understand their first turn in seconds; expert groups can later unlock richer modes.
5. **Privacy is a feature.** Private invite rooms are the starting point. Public matchmaking is not required to make the product valuable.
6. **Respect player agency.** Clear consent, content controls, reporting tools, accessibility options, and no coercive “punishment” mechanics.

---

## 3. Audience and initial use cases

### Primary audience

Adults aged 18+ who enjoy deception, horror/thrillers, party games, K-drama tension, Mafia/Werewolf, and playing with established friend groups.

### Core launch market

English-speaking, mobile-heavy private groups. The product should be globally usable from day one, with Nigeria and other mobile-first communities naturally supported through a lightweight web experience.

### Primary play contexts

1. **Same-room party:** Friends sit together while each uses a phone privately for role information and voting.
2. **Remote game night:** Friends join a room from different locations and use game text chat plus an external voice call if desired.
3. **Small social community:** A host repeatedly organizes private games with the same group.

### Explicitly not V1

- Public ranked matchmaking
- In-app voice chat
- Livestream/spectator broadcasting
- Creator scripting tools
- Real-world challenges, punishment mechanics, or dares
- Explicit sexual or graphic content
- Monetization that changes game odds

---

## 4. MVP: the product we will actually ship first

### Scope statement

A responsive private-room social deduction game for **4–10 guest players**, playable on a phone or desktop browser. It supports a complete standard match: lobby, secret roles, timed discussion, private role actions, voting, elimination, results, and replay.

### Must-have player journey

1. Player opens the site.
2. Player accepts the 18+ content notice and selects a display name.
3. Player creates a room or enters a short room code.
4. Players wait together in a lobby, see who has joined, and use lobby chat.
5. The host starts when the room has enough players.
6. The server privately assigns roles.
7. Players progress through timed Day and Night phases.
8. The server resolves all actions and announces outcomes.
9. A winning team is determined and all roles are revealed.
10. The host can start another match with the same group.

### MVP roles

| Role | Team | Purpose |
|---|---|---|
| Civilian | Town | Discuss, detect deception, and vote out Mafia. |
| Mafia | Mafia | Know fellow Mafia and jointly select a Night target. |
| Doctor | Town | Privately protect one living player each Night. |
| Investigator | Town | Privately learn whether one living player is Mafia or not. |

### MVP room rules (founder default)

| Rule | Decision |
|---|---|
| Players | 4–10 |
| Default game size | 6–8 players |
| Day timer | 4 minutes |
| Night timer | 90 seconds |
| Voting | Secret while voting; tally shown when resolved |
| Abstain/skip | Allowed by default |
| Ties | One short revote among tied players; a second tie means no elimination |
| Role reveals | Revealed at elimination in Standard mode |
| Doctor self-protection | Allowed once per game |
| Repeated Doctor protection | Not permitted on the same player in consecutive Nights |
| Investigator result | Alignment only: Mafia / Not Mafia |
| Mafia target choice | Mafia members each vote privately; majority decides; tie/no action means no target |
| Player disconnect | Player may return using a persistent room session; they auto-abstain if absent at phase end |
| Host disconnect | Host role transfers to the longest-present connected player; game continues |
| Eliminated players | Become silent spectators by default; can view public log but cannot chat or see hidden roles |

These defaults are intentionally simple. Hosts will gain more configuration only after the standard experience is proven.

### MVP screens

1. Splash / loading
2. Age and content confirmation
3. Guest identity setup
4. Home: Create room / Join room / Rules
5. Create room
6. Join room
7. Lobby
8. Private role reveal
9. Day phase: timer, public system log, chat, vote access
10. Vote selection and confirmation
11. Night phase: civilian wait state or role-specific action
12. Elimination / spectator state
13. Results and full role reveal
14. Play again / leave room
15. Settings: sound, reduced motion, content preference

### Deferred from MVP

| Feature | Why it waits |
|---|---|
| Accounts and profile history | Guest sessions let us validate the game faster. |
| Voice chat | Adds costly infrastructure, permissions, privacy, and moderation requirements. |
| Public rooms | Requires a serious moderation and anti-abuse operation. |
| Friends / direct messages | Not needed for private-code game validation. |
| Cosmetics / payment | Revenue should not distract from core retention. |
| Advanced roles | Rule complexity should follow successful core playtesting. |
| AI players | They introduce expectation, quality, and game-balance risk. |
| Native mobile apps | PWA delivers a lower-friction first version. |

---

## 5. Brand and creative direction

### Brand decision

Use the existing project name internally, but create a new original public brand before beta recruitment. The public brand must be checked for trademark, web-domain, and social-handle availability.

### Recommended visual direction: **Nocturnal Protocol**

This is a direction, not a final name.

- **World:** an unknown system convenes a group after dark.
- **Tone:** elegant, digital, secretive, ritualized, and unsettling.
- **Not:** copied K-drama imagery, school uniforms, real violence, gore, or grimy horror clichés.
- **Visual motifs:** signal noise, distant fog, monochrome portraits, timer pulses, sealed dossiers, soft red alerts, violet interface light.

### Design system

- Background: ink black / midnight blue
- Primary action: restrained signal red
- Secondary accent: electric violet
- Success / safe state: muted teal, never bright arcade green
- Text: warm off-white, accessible contrast
- Typography: condensed display type for phase headers; legible modern sans for content
- Motion: brief phase transitions, subtle ambient texture, clear reduced-motion alternative
- Sound: optional low-key ambience and non-startling phase cues

### Content boundary

The game supports mature psychological tension. It does not depict graphic injuries, use explicit sexual content, ask users to perform real-life tasks, or make humiliation the mechanic. The age confirmation explains this clearly.

---

## 6. Functional product specification

### 6.1 Room lifecycle

```text
Create room → Lobby → Start validation → Role reveal → Day → Vote resolution
→ Night → Action resolution → Win check → (Day again OR Results) → Replay / close
```

### 6.2 Server-owned game state

The backend is the sole authority for:
- membership and player presence,
- room host assignment,
- roles and teams,
- alive/eliminated status,
- current phase and canonical end timestamp,
- legal actions,
- votes and action resolution,
- role visibility,
- win conditions,
- event logs.

The client receives a **player-specific view** of the match. It must never receive the full role map while a match is active.

### 6.3 Privacy matrix

| Information | Civilian | Mafia | Doctor / Investigator | Eliminated spectator |
|---|---:|---:|---:|---:|
| Own role | Yes | Yes | Yes | Yes |
| Other Mafia identities | No | Yes | No | No |
| Active Mafia chat | No | Yes, at Night | No | No |
| Investigation result | No | No | Investigator only | No |
| Doctor target | No | No | Doctor only | No |
| Full role map before game ends | No | No | No | No |
| Public event log | Yes | Yes | Yes | Yes |

### 6.4 Phase behavior

#### Day
- Every living player sees the public discussion channel and a countdown.
- Players may vote once; changing a vote is permitted until the phase ends.
- Votes remain concealed until resolution.
- At expiry, the server tallies votes, resolves a tie rule, updates player state, emits a public result, and checks for a winner.

#### Night
- Civilian: sees a protected wait state and public phase countdown.
- Mafia: sees fellow Mafia, private Night channel, and target controls.
- Doctor: selects one eligible player to protect.
- Investigator: selects one eligible player to investigate.
- At expiry, server validates and resolves all actions in a deterministic order.

### 6.5 Win conditions

- **Town wins:** every Mafia member is eliminated.
- **Mafia wins:** living Mafia count is equal to or greater than living non-Mafia count.

---

## 7. Technical plan

### Architecture for the first production-quality MVP

```text
Browser / PWA (Next.js + TypeScript)
            │ HTTPS + Socket.IO
            ▼
Application API and real-time game server (Node.js + TypeScript)
            ├── PostgreSQL: durable rooms, games, player history, reports
            ├── Redis: active-room state, socket presence, timers, pub/sub
            └── Object/error logging service
```

### Client

- Next.js + TypeScript
- Responsive, touch-first UI with desktop support
- Socket.IO client for real-time match events
- Browser local storage only for non-sensitive preferences and reconnect session token
- Accessibility-first components: keyboard navigation, reduced motion, adequate contrast, semantic controls

### Server

- Node.js + TypeScript
- NestJS is preferred for clean modular organization as the product grows
- Socket.IO for rooms, presence, chat, private events, and state synchronization
- REST endpoints only where a request/response workflow makes more sense (room creation, join validation, health checks)
- Schema validation, rate limiting, audit logging, secure session handling

### Data

**PostgreSQL (durable)**
- `users` or `guest_identities`
- `rooms`
- `room_members`
- `games`
- `game_players`
- `game_events`
- `reports` (implemented later, schema allowed now)

**Redis (ephemeral)**
- active game state by game ID
- room presence by room ID
- phase scheduler metadata
- Socket.IO pub/sub when more than one server instance exists

### Security requirements from day one

- No client-trusted game decisions
- Signed/revocable session tokens
- Rate limits on room creation, joining, chat, and game actions
- Strict input validation and output projection
- Server-side permission checks for every socket event
- Escape/sanitize all user-generated display names and messages
- Transport encryption in deployment
- Minimal collection of personal data
- Secrets only in environment configuration, never committed

### Testing strategy

1. **Unit tests:** role assignment, voting, tie handling, action resolution, win checks.
2. **State-machine tests:** every valid and invalid phase/action transition.
3. **Authorization tests:** prove one player cannot access another player’s secrets.
4. **Integration tests:** multiple simulated players joining and completing a game.
5. **End-to-end tests:** create → join → start → vote → night actions → results.
6. **Manual party tests:** observe confusion, silence, pacing, frustration, and replay intent.

The game engine will be tested more deeply than the UI because a single hidden-role leak or invalid resolution destroys player trust.

---

## 8. Delivery roadmap

Timing is expressed in focused build weeks and will be adjusted after the design review.

### Milestone 0 — Product lock (Week 1)

**Goal:** convert vision into decisions that can be built.

Deliverables:
- approved MVP scope,
- original brand direction or shortlist,
- final rules contract,
- information-privacy map,
- wireframes and key visual direction,
- technical project setup plan.

**Exit condition:** no unresolved question can block the game engine.

### Milestone 1 — Design prototype (Weeks 2–3)

**Goal:** make the product tangible before backend work expands.

Deliverables:
- high-fidelity responsive screens for the MVP journey,
- interaction prototype for create/join/lobby/day/night/results,
- design tokens and component inventory,
- written content and system-message tone guide.

**Exit condition:** 3–5 target players can navigate a mock game without explanation.

### Milestone 2 — Multiplayer foundation (Weeks 3–5)

**Goal:** establish trusted live rooms.

Deliverables:
- project setup and environments,
- guest identity and reconnect handling,
- create/join room flow,
- lobby presence and host controls,
- real-time event layer,
- database migrations and initial test harness.

**Exit condition:** 4–10 browser clients reliably join the same live lobby.

### Milestone 3 — Complete playable match (Weeks 5–8)

**Goal:** finish the standard game loop.

Deliverables:
- secure role assignment and private role reveal,
- Day timer, chat, voting, tie rules,
- Night actions for Mafia, Doctor, Investigator,
- deterministic server resolution,
- elimination/spectator behavior,
- win conditions, role reveal, replay.

**Exit condition:** a complete 6-player match can be played reliably in a test environment.

### Milestone 4 — Quality and closed beta (Weeks 8–10)

**Goal:** make it enjoyable, understandable, and resilient.

Deliverables:
- cinematic UX polish,
- onboarding/tutorial/rules,
- accessibility settings,
- reconnect and disconnect resilience,
- game/audit logs,
- error monitoring,
- load and security testing,
- closed private beta with 20–50 players.

**Exit condition:** testers successfully finish games, understand the rules, and show meaningful replay interest.

### Milestone 5 — Launch decision (Weeks 11–12)

**Goal:** choose whether the evidence supports public release.

Deliverables:
- beta learnings,
- prioritized bug/feature list,
- privacy/community policy drafts,
- original brand decision,
- deployment runbook,
- launch quality checklist.

**Exit condition:** founder approves public private-room beta or chooses another iteration cycle.

---

## 9. Metrics that matter

We will not measure vanity installs first. We will measure whether groups get value.

### Activation
- Percentage of room creators who start a match
- Median time from room creation to game start
- Percentage of joined players who reach role reveal

### Quality
- Match completion rate
- Disconnect/reconnect success rate
- Server-resolution errors per match
- Reported rule confusion / support incidents

### Fun and retention
- Percentage of completed games followed by Play Again
- Average completed matches per group session
- 7-day return rate for room hosts
- Post-match one-question score: “Would you play this again with this group?”

### Initial directional targets

| Metric | Early healthy target |
|---|---:|
| Room creation to match start | 70%+ |
| Started matches completed | 85%+ |
| Completed match → replay | 35%+ |
| Critical hidden-information leaks | 0 |
| P1 game-resolution defects | 0 at beta launch |

---

## 10. Risks and founder responses

| Risk | Response |
|---|---|
| Brand confusion / IP concerns | Treat the current title as internal; launch only with original branding and assets. |
| The game is not fun without voice | Test text-first early; support external voice naturally; add native voice only if evidence demands it. |
| Players are confused by roles | Keep four-role MVP, use role cards, contextual action prompts, and a short tutorial. |
| Cheating / secret leakage | Server authority, per-player data projections, authorization tests, audit logs. |
| Players disconnect | Rejoin tokens, canonical server timers, auto-abstain policy, host transfer. |
| Toxicity | Start private invite-only; add report/mute/moderation before public lobbies. |
| Scope expands too early | A feature only enters MVP if it helps a private group complete and replay a standard match. |
| Mature presentation hurts app distribution | Keep content fictional, non-graphic, consent-based, and controllable. |

---

## 11. Post-MVP sequence

After the standard private-room game has strong completion and replay rates:

### Release 1.1
- Optional account linking
- Basic game history and personal stats
- More host settings
- Better invitations/share links
- Report/mute tools
- Additional visual themes

### Release 1.2
- Advanced roles: Traitor, Jester/Joker-style role, more investigators
- Curated rule packs: Standard, High Stakes, Chaos
- Private group profiles / friends
- More languages

### Release 2
- Native Expo application if usage data validates it
- Push notifications
- Public rooms / matchmaking only with a complete moderation and anti-abuse plan
- Voice integration only if it materially improves completion/replay
- Cosmetic-only monetization

---

## 12. Decisions requested from the founder

This document makes the default calls so implementation can begin quickly. Please review and approve or change these decisions:

1. **Platform:** approve responsive web/PWA as the first product.
2. **MVP game type:** approve private invite-code rooms only.
3. **Public name:** approve keeping “Night Has Come” as an internal codename until an original name is selected.
4. **Scope boundary:** approve no public matchmaking, voice, payments, advanced roles, or accounts in MVP.
5. **Mood:** approve “elegant psychological thriller” rather than graphic horror.
6. **Rules:** approve the standard role set and default rule table in section 4.
7. **First implementation step:** approve design prototype and rules-state-machine specification before coding the full app.

---

## 13. Immediate next action after approval

After the plan is approved, I will create the implementation foundation in this repository:

1. Set up the monorepo and developer tooling.
2. Build the responsive application shell and original visual system.
3. Implement the guest → create/join → lobby user flow.
4. Define and test the server-authoritative game state machine.
5. Build the complete standard playable match in vertical slices.

No feature outside the approved MVP will be allowed to delay the first real game session.
