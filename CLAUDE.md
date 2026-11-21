# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm + Turborepo monorepo (Node >=24, pnpm 11) for an "agent builder": a NestJS backend that streams LLM sessions over WebSockets, plus two clients (a terminal UI and a Next.js web app). The root `README.md` is the unmodified Turborepo starter README and does not describe this project.

- `apps/api` — NestJS 12 backend (Socket.IO gateway, OpenAI Responses API via OpenRouter, Drizzle + Postgres, Docker sandbox, tool system)
- `apps/tui` — Ink (React for terminals) client, connects to the API at `http://localhost:3000` via socket.io-client
- `apps/web` — Next.js 16 / React 19 / Tailwind 4 app (currently a near-empty scaffold)
- `packages/logger` (`@repo/logger`, pino-based `createLogger`) — used by the API
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — leftover Turborepo starter packages

## Commands

Run from the repo root unless noted.

```bash
pnpm install
pnpm start:dev:api        # nest start --watch (port $PORT or 3000)
pnpm start:dev:tui        # tsx watch src/cli.tsx (needs API running)
pnpm start:dev:web        # next dev
pnpm build | lint | check-types   # turbo across workspaces
pnpm format               # prettier on ts/tsx/md
```

API (`apps/api`):

```bash
docker compose -f dev.compose.yml up -d   # Postgres 16 (db agentbuilder) + pgAdmin
pnpm test                                 # vitest run (**/*.spec.ts, colocated in src/)
pnpm vitest run src/session/session.service.spec.ts   # single test file
pnpm vitest run -t "name"                 # single test by name
pnpm test:e2e                             # vitest with vitest.config.e2e.ts (test/)
pnpm lint                                 # oxlint --type-aware (not eslint)
pnpm drizzle-kit generate | migrate       # migrations in apps/api/drizzle/ (config: drizzle.config.ts)
```

The API reads `apps/api/.env.local` (gitignored; loaded both by Nest `ConfigModule` and by `loadEnvFile` in `src/database/index.ts`). Required: `DATABASE_URL`, `API_KEY` (OpenRouter/OpenAI key), `SANDBOX_NAME`; optional `BASE_URL` (defaults to `https://openrouter.ai/api/v1`). Env is validated with zod schemas in `src/config.ts` and exposed through `registerAs` namespaces (`"OpenaiConfig.ENV"`, `"SandboxConfig.ENV"`) read with the typed `getEnvConfig` helper. Note `ignoreEnvVars: true` — only `.env.local` is used, not the process environment, for Nest config.

Web (`apps/web`): `apps/web/AGENTS.md` warns that this Next.js version has breaking changes — read the relevant guide in `apps/web/node_modules/next/dist/docs/` before writing Next code. `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and wires Tailwind through `@tailwindcss/turbopack`. Web lint is `eslint`.

## API architecture

Request flow: client → `SessionGateway` (Socket.IO, CORS `*`) → `OpenaiService.streamText` → OpenAI Responses stream → events forwarded back to the socket.

Socket protocol (`src/session/session.gateway.ts`): client emits `session:create-session {query}` → `session:created {sessionId,title,description}`; `session:run {sessionId,query}` → streams raw OpenAI `ResponseStreamEvent`s as `session:event`; `session:close` → `session:closed`; `session:delete` → `session:deleted`. Errors are thrown as `WebSocketError` (`session.error.ts`).

Modules (`app.module.ts`):
- `OpenaiModule` is a dynamic module (`forRootAsync`) that provides the injected `'openai_config'` token; it imports `ToolsModule`. `SessionModule` and `SandBoxModule` are static.
- `OpenaiService` drives a multi-turn loop (`MAX_TURNS`): loads history from a `ContextManager`, streams a response, executes any function calls via `ToolsService`, appends results, repeats. `ContextManager` (`src/openai/contextManager/index.ts`) is an interface; `DbContextManager` persists `OpenAI.Responses.ResponseInputItem`s per session in Postgres.
- Tools (`src/tools`): `ToolDefinition`/`CreateTool` types in `tools.types.ts` (zod `inputSchema` + `execute`). Tool providers (`docker/docker.tools.ts`, `web/web.tools.ts`) register into `ToolRegistry`; `ToolsService.toolResolver({agentId, tools})` picks tools by id and `toLLMTool` converts them to OpenAI tool schema. `OpenaiService` currently hardcodes `tools: ['tool-websearch']`. `AgentSpecSchema` in `tools.types.ts` sketches the planned agent definition (model, tools, memory, triggers, execution limits).
- Sandbox (`src/sandbox`): `SandboxService` wraps `DockerService` (dockerode) to run commands in a container; `ToolsModule` depends on `SandBoxModule` (avoid reintroducing circular imports between these).
- Database (`src/database`): Drizzle (`drizzle-orm` 1.0 RC, relational queries v2 style `db.query.x.findFirst({ where: { ... } })`) on `node-postgres`; schema and `relations` in `schema/index.ts`; `db` is a module-level singleton, not a Nest provider.

Gotchas: ESM-ish import style is mixed (`./app.service.js` vs extensionless); formatting is mixed too (`apps/api/.prettierrc` uses single quotes, some files use double quotes). `test-socket*.ts` in `apps/api` are manual socket scripts, not part of the test suite.
