# my-agent: state at the end of Part 11

A working copy of the agent as it stands after Part 11 ("Permissions"): the same five tools, protocols, routes, streaming, event log, inbox and compaction as Part 10, with a permission check in front of every tool. Each tool describes what it needs as an action (`read`, `edit` or `bash`) and a resource (a path relative to the working directory, or the command). Rules decide whether the call is allowed, asked about or denied; the last matching rule wins, and with no match the agent asks. An "always" answer is saved in the database. A plain "no" stops the turn with a `turn-stopped` event, and any other text goes to the model as a correction.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types as Schemas, unchanged from Part 8. |
| `src/events.ts` | `ModelEvent` and `FinishReason`: what a step's stream carries, unchanged from Part 7. |
| `src/errors.ts` | The tool failures (now with `Blocked` and `Corrected`), `Declined` with a new message, `ProviderError`, `ConfigError`, `InputClosed` and `SessionCorrupt`. |
| `src/database.ts` | The `Database` service and `DatabaseLive`, which opens the SQLite file and applies the migrations for every service that uses it. |
| `src/db/schema.ts` | The Drizzle tables: `event`, `inbox`, and the new `approval` (one row per "always" answer). |
| `src/permission.ts` | Rules, `matches`, `evaluate`, the default rules, `relativePath`, `loadRules` (reads `permissions.json`), the `Permission` service, `PermissionLive` and `PermissionFromFile`. |
| `src/lines.ts` | `makeLines`: hands each typed line to the newest open question, unchanged from Part 9. |
| `src/session-event.ts` | The six session events (`prompt`, `step-finished`, `tool-result`, `turn-failed`, `turn-stopped`, `compacted`) as a Schema. |
| `src/history.ts` | `summaryMessage`, `toHistory` (a stopped turn stays in the history, a failed one is cut) and `unansweredCalls`. |
| `src/session.ts` | The `Session` service and `SessionLive(id)`, which now uses `Database`. |
| `src/compaction.ts` | The estimate, the transcript, the summary prompt and `compactIfDue`, unchanged from Part 10. |
| `src/sse.ts` | `Frame` and `frames`, unchanged from Part 7. |
| `src/terminal.ts` | The `Terminal` service and `TerminalLive`, unchanged from Part 9. |
| `src/tool.ts` | `Tool`, `defineTool` (tools declare a `permission` request), the `Tools` service and `runTool`, which lets only a decline through. |
| `src/tools.ts` | The five tools, each with its permission request, the `tools` array and `ToolsLive`. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`, unchanged from Part 7. |
| `src/provider.ts` | The routes, `selectRoute`, `requireFinish` and `chat`, unchanged from Part 10. |
| `src/model-client.ts` | The `ModelClient` service and `ModelClientLive`, unchanged from Part 10. |
| `src/agent.ts` | `step`, `run` (stops the turn after a decline), `resume` (leaves a failed or stopped turn alone) and `repl`. |
| `src/index.ts` | Builds the database and terminal once, and the model client, tools, session and permission check on top. |
| `drizzle.config.ts`, `drizzle/` | Drizzle Kit's settings and the three generated migrations: `event`, `inbox` and `approval`. |
| `test/fakes.ts` | `scriptedModel`, `scriptedTerminal`, and `agentLayers`, which wires the fakes like `index.ts`. |
| `test/permission.test.ts` | Matching, rule order, the defaults, the rules file, the answers at the prompt, saved approvals across runs, and paths written in different ways. |
| `test/agent.test.ts` | `repl` against the fakes, including a decline that stops the turn, a correction and a deny rule. |
| `test/resume.test.ts` | A new agent on the log a dead process left, including a stopped turn. |
| `test/history.test.ts` | The fold and `unansweredCalls`, including a stopped turn. |
| `test/compaction.test.ts`, `test/inbox.test.ts`, `test/lines.test.ts`, `test/session.test.ts` | Compaction, the inbox, the line router and the session file. |
| `test/protocols.test.ts`, `test/provider.test.ts`, `test/fixtures/` | The recorded streams and the tests that use them. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 11.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
bun run test                                    # the loop, permissions, the inbox, compaction, the fold, the restart and the file, plus the recorded streams
bun run db:generate                             # Drizzle Kit: write a migration after the table in src/db/schema.ts changes
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL`, `MODEL` and `CONTEXT_WINDOW` override the route's defaults. A small `CONTEXT_WINDOW`, such as 2000, makes compaction happen after a few prompts.

The session is stored in `my-agent.db` next to this folder (`DB_PATH` overrides the path). `SESSION` names the session and defaults to `default`: starting the agent again with the same name continues that conversation, and a different name starts a separate one in the same file. The agent starts in `playground/` and reads `permissions.json` there if it exists: a JSON list of rules such as `[{ "action": "read", "resource": "secret-file.txt", "effect": "deny" }]`, applied after the defaults. Reading outside `playground/` asks first. Saved approvals are in the `approval` table of the same database.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-12` and apply that part's changes.
