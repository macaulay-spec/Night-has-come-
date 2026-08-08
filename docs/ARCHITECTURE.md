# NIGHT HAS COME — Architecture

## Principle: Server-Authoritative

**The client is untrusted.** The server owns all authoritative game truth.

| Server Owns | Client Owns |
|---|---|
| Player membership | Displaying authorized information |
| Role assignment | Collecting player input |
| Faction assignment | Sending commands |
| Hidden information | Rendering timers |
| Phase transitions | Rendering animations |
| Timers | Rendering chat |
| Legal actions | Presenting state |
| Target legality | |
| Action resolution | |
| Votes | |
| Eliminations | |
| Win conditions | |
| Match state | |
| Event ordering | |
| Persistence | |
| Recovery | |

## Data Flow

```
Client (React) → Command → Socket.IO → Server Validation
                                           ↓
                                     Game Engine
                                           ↓
                                    State Mutation
                                           ↓
                               Event Sourcing + Persistence
                                           ↓
                              Projection → Socket.IO → Client
```

## Information Projections

- **PUBLIC_PROJECTION** — Visible to all players
- **PLAYER_PRIVATE_PROJECTION** — Per-player private info
- **FACTION_PRIVATE_PROJECTION** — Per-faction channels
- **SPECTATOR_PROJECTION** — Delayed, hidden-info-safe
- **ADMIN_SENSITIVE_PROJECTION** — Full state for moderators

**Never send complete GameState to any client.**

## Modular Monolith

The system is built as a modular monolith, not microservices.
Services are extracted only when scale requires it.

## Game Engine Independence

The game engine (`packages/game-engine`) has zero dependencies on:
- React / browser APIs
- HTTP / Express / Fastify
- PostgreSQL / Supabase
- Redis
- Socket.IO
- UI components

It is a pure TypeScript package that takes `(GameState + Command)` and produces `(GameStateDelta + Events)`.
