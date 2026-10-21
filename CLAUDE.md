# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

OpenCode is an open source AI coding agent with a terminal UI, web app, and desktop app, built on Bun + TypeScript + Effect.

## Commands

Requires Bun 1.3+. Tests and typechecks must run from the affected package directory, never the repo root (`bun test` at root is blocked by design).

```bash
bun install
bun dev [directory]                # run the V2 CLI + TUI (pass `.` to open this repo itself)
bun run dev:live [directory]       # run a dev TUI against the installed background service + live sessions (see AGENTS.md)
bun dev serve --port 4096          # backend only, for packages/app development
bun run dev:web                    # packages/app dev server
bun run dev:desktop                # Electron app
bun run dev:storybook              # Storybook

bun run check                      # canonical full lint + typecheck, run from repo root
bun run lint                       # oxlint + ast-grep rule scans + sdk-docs check
bun run lint:changed               # lint only files changed vs dev
bun typecheck                      # from a package dir only (wraps turbo); never invoke tsc directly

cd packages/core && bun run test   # package tests; most packages define `test` the same way
cd packages/core && bun typecheck
```

Run a single test file/case with Bun's normal test filters (`bun test path/to/file.test.ts`, `-t "name"`) from inside the package directory. Before writing or touching tests, read the matching skill under `.opencode/skills`: `unit-tests`, `tui-tests`, `app-e2e-tests`, or `component-tests` — they document per-package timeouts, Effect `TestClock` usage, and Windows CI spawn-cost traps that are easy to reintroduce.

After changing the public Protocol or Server `HttpApi`, run `bun run generate` from `packages/client`. Never hand-edit generated client files.

## Architecture

### Package dependency direction

```
Schema  ->  Core, Protocol  ->  Server
```

`packages/schema` holds browser-safe wire/storage contracts shared by protocol, server, core, and generated SDKs. `packages/protocol` defines the public HTTP API (`api.ts`, `groups/`) on top of Schema. `packages/server` composes the HTTP server and runtime (`packages/server/src/handlers`, `routes.ts`) on top of Core and Protocol. `packages/client` is the generated TypeScript client (regenerate, don't hand-edit). Client runtime code may depend on Schema and Protocol but never Core or Server. `packages/sdk` composes Client, Core, and Server for embedding. Respect this direction when adding imports — it's enforced by convention, not just lint.

Current contracts are unversioned (`Session`, `Permission`, `Question`). Legacy contracts kept for compatibility/migration live under `src/v1/` and are explicitly suffixed `V1` (`SessionV1`, `PermissionV1`); new code must not depend on that subtree, and a current type must never be named `V2`.

### Core domains

`packages/core/src` is organized by domain (`session/`, `permission/`, `plugin/`, `mcp/`, `config/`, `project/`, `location*.ts`, `workspace.ts`, `worktree.ts`, `instance.ts`, etc.), each typically exposing a `.ts` facade plus a same-named directory for implementation. Domain behavior, persistence, and side effects belong here, not in Schema.

Session execution model (see the Session Core rules in `AGENTS.md` for full detail — these are easy to violate accidentally):

- Prompt admission (`Session.prompt`) is durable and separate from model execution: it publishes `session.inbox.enqueued` (inserts a `session_inbox` row) before scheduling advisory `SessionExecution.wake(sessionID)`. Delivery consumes the inbox row and inserts the visible message transactionally via `session.inbox.delivered`.
- `SessionExecution` is process-global and Session-ID keyed; it discovers placement via `SessionStore` + `LocationServiceMap` only when a drain starts. A write-ahead execution claim is a process-local recovery marker, not clustered ownership or an exactly-once guarantee.
- One step = one `llm.stream` call continuing from reloaded history. There is no in-memory tool loop.
- Durable events should record only irreducible new facts — don't re-derive state already foldable from the ordered event history.

### Apps and interfaces

- `packages/cli`: entrypoint and service lifecycle (the `opencode` binary).
- `packages/tui`: terminal UI (OpenTUI/Solid). Experiments (opt-in, gated by `config.experimental`) go through the registry in `src/component/dialog-experiments.tsx` — keep that infrastructure even when empty.
- `packages/app`: shared web interface (SolidJS). Prioritizes stability > simplicity > performance for session/timeline code; benchmark before changing that code.
- `packages/desktop`: Electron desktop app.
- `packages/plugin`: plugin API, with parallel Effect and Promise versions.
- `packages/ai`: provider/model abstraction. `LLM.stream`/`LLM.generate` each make exactly one model call; auth/permissions/orchestration stay in Core. Provider tests replay HTTP cassettes in `test/fixtures/recordings/`.

### Theming (TUI)

Theme tokens are chosen by semantic role, not current color (e.g. `text.feedback`/`background.feedback` only for outcome/status feedback; `formfield` states for form-control text/ordinals/selection; `action` states for actions). If a semantic role has no token, extend the theme schema/defaults/resolution/types rather than repurposing an existing one, and verify light/dark defaults plus the custom-theme fallback path when changing the public token surface.

## Conventions

- Branch names: ≤3 words, hyphen-separated, no slashes or `feat/`/`fix/` prefixes (e.g. `session-recovery`, `fix-scroll-state`).
- Commits and PR titles: `type(scope): summary` with `feat`, `fix`, `docs`, `chore`, `refactor`, or `test`; scope is optional (package/area name, e.g. `core`, `tui`, `sdk`).
- No Changesets — `.changeset` files are not used; follow the existing release workflow instead.
- Default branch is `dev`: base branches/worktrees on `origin/dev`, target PRs at `dev`.
- Full repository style guide (imports, control flow, Effect generator patterns, Drizzle snake_case columns, etc.) lives in `AGENTS.md` at the repo root — read it before writing non-trivial code.
- Many packages carry their own `AGENTS.md` (`ai`, `app`, `cli`, `tui`, `plugin`, `schema`, `desktop`, `codemode`, `session-ui`, `stats`, `gui-extensions`, `ui`) with package-specific rules (e.g. i18n requirements in `app`, Schema module-shape rules in `schema`, plugin Effect/Promise split). Check for one in the package you're editing.
- PRs should be small and focused; bug/chore/test PRs must reference an issue (`Fixes #123`).
