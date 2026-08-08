# NIGHT HAS COME

**A psychological survival social-deduction multiplayer game.**

Built with a server-authoritative architecture. Hidden identities, deception, faction conflict, and timed decisions in a dark, cinematic experience.

---

## Status

🟢 **Phase 1 — Foundation** — IN PROGRESS

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (monorepo, tooling, architecture) | 🔵 In Progress |
| 2 | Authentication | ⬜ Pending |
| 3 | Database | ⬜ Pending |
| 4 | Game Engine | ⬜ Pending |
| 5 | Realtime | ⬜ Pending |
| 6 | Lobby/Matchmaking | ⬜ Pending |
| 7 | Roles | ⬜ Pending |
| 8 | Voting | ⬜ Pending |
| 9 | UI | ⬜ Pending |
| 10 | Audio + Animation | ⬜ Pending |
| 11 | AI | ⬜ Pending |
| 12 | Moderation + Security | ⬜ Pending |
| 13 | Progression | ⬜ Pending |
| 14 | Admin | ⬜ Pending |
| 15 | Full Testing | ⬜ Pending |
| 16 | Optimization | ⬜ Pending |
| 17 | Deployment | ⬜ Pending |

---

## Architecture

```
apps/
  web/          React + Vite + Tailwind (frontend)
  api/          Fastify REST API
  realtime/     Socket.IO WebSocket server

packages/
  game-engine/  Pure TypeScript game engine (server-authoritative)
  contracts/    Shared Zod schemas + TypeScript types
  database/     Drizzle ORM + PostgreSQL schema
  ui/           Design tokens + shared UI components
  config/       Centralized configuration
  moderation/   Content filtering + sanctions + audit

infra/
  docker/       Dockerfiles + compose
  deployment/   Deployment configs
  monitoring/   Observability setup
```

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Socket.IO Client
- **Backend:** Node.js, TypeScript, Fastify, Socket.IO
- **Database:** PostgreSQL (Supabase), Redis, Drizzle ORM
- **Infrastructure:** Docker, GitHub Actions, Cloudflare

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [GAME_ENGINE.md](docs/GAME_ENGINE.md)
- [DATABASE.md](docs/DATABASE.md)

## License

Proprietary. All rights reserved.
