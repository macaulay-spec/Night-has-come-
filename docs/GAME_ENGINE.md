# NIGHT HAS COME — Game Engine

## Core Contract

```
GameState + Command + Ruleset + Seed → GameStateDelta + Events
```

The same `seed + ruleset + initial state + commands` must produce the same result.

## Properties

- **Deterministic** — Same inputs → same outputs
- **Serializable** — Can be persisted and restored
- **Replayable** — Full game replay from event log
- **Testable** — No infrastructure dependencies
- **Versioned** — Schema evolution support
- **Snapshot-compatible** — Can restore from snapshots
- **Infrastructure-independent** — Pure TypeScript

## State Machine

Phases: LOBBY_OPEN → LOBBY_READY_CHECK → ASSIGNMENT → ORIENTATION → BLACKOUT_OPEN → BLACKOUT_LOCKED → BLACKOUT_RESOLUTION → DAWN_REVEAL → DISCUSSION → NOMINATION → DEFENSE → VOTE_OPEN → VOTE_LOCKED → JUDGMENT_RESOLUTION → PROTOCOL_LOCK_PRESENTATION → WIN_CHECK → RESULTS

Recovery: RECOVERY_PAUSE, VOIDED_MATCH

## Factions

- **CIVIC** — Wins when all Veil eliminated, no Independent met condition
- **VEIL** — Wins when Veil reaches parity/control or Civic can't prevent
- **INDEPENDENT** — Per-role explicit victory conditions

## Roles

Data-driven role registry. See `packages/game-engine/src/roles/index.ts`.

22 roles across 4 categories:
- 8 Civic
- 6 Veil
- 4 Independent
- 4 Special

## Blackout Resolution Order

1. Global rule modifiers
2. Role-altering effects
3. Information distortion
4. Protection/prevention
5. Investigation
6. Manipulation
7. Attacks/eliminations
8. Private results
9. Public dawn events
10. Win-condition evaluation

## Command Validation

Every command requires:
- gameId, actorId, actionType, targetId, clientCommandId, clientStateVersion, idempotencyKey

Server rejects: wrong phase, dead player, unauthorized, invalid target, expired timer, duplicate, stale state.
