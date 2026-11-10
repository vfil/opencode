# my-agent: state at the end of Part 8

A working copy of the agent as it stands after Part 8 ("The Session as an Event Log"): the same five tools, y/n confirmation, protocols, routes and streaming as Part 7, with every prompt, step and tool result appended to a SQLite file, the history rebuilt from that file before every step, and a restart that finishes the turn the last run left unfinished.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types as Schemas, with the TypeScript types derived from them. `isToolCall` and `textOf` are unchanged. |
| `src/events.ts` | `ModelEvent` and `FinishReason`: what a step's stream carries, unchanged from Part 7. |
| `src/errors.ts` | The four tool failures, `ProviderError`, `ConfigError`, `InputClosed` and the new `SessionCorrupt`. |
| `src/session-table.ts` | The Drizzle `event` table: one row per session event. |
| `src/session-event.ts` | The four session events (`prompt`, `step-finished`, `tool-result`, `turn-failed`) as a Schema. |
| `src/history.ts` | `toHistory` (events to messages) and `unansweredCalls` (where the last turn stopped). |
| `src/session.ts` | The `Session` service (`append`, `events`, `history`) and `SessionLive`, which opens the SQLite file and applies the migrations. |
| `src/sse.ts` | `Frame` and `frames`: cuts the bytes of a response into server-sent events, unchanged from Part 7. |
| `src/terminal.ts` | The `Terminal` service (`ask`, `say`, `write`) and `TerminalLive`, unchanged from Part 7. |
| `src/tool.ts` | `Tool`, `defineTool`, the `Tools` service and `runTool`, unchanged from Part 7. |
| `src/tools.ts` | The five tools, the `tools` array and `ToolsLive`, unchanged from Part 7. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`, unchanged from Part 7. |
| `src/provider.ts` | The routes, `selectRoute`, `requireFinish` and `chat`, unchanged from Part 7. |
| `src/model-client.ts` | The `ModelClient` service and `ModelClientLive`, unchanged from Part 7. |
| `src/agent.ts` | `step` (reloads the history, folds the events into a message, appends it), `run`, `turn`, `resume` and `repl`. |
| `src/index.ts` | Builds the live layers, including `SessionLive`, and runs `repl`. |
| `drizzle.config.ts`, `drizzle/` | Drizzle Kit's settings and the generated migration that creates the `event` table. |
| `test/fakes.ts` | `scriptedModel` (streams events) and `scriptedTerminal` (records lines and writes), unchanged from Part 7. |
| `test/agent.test.ts` | Six tests that run `repl` against the fakes on a session kept in memory. |
| `test/resume.test.ts` | Six tests that write the log a dead process leaves and start a new agent on it. |
| `test/history.test.ts` | The fold and `unansweredCalls` on lists of events. |
| `test/session.test.ts` | The file itself: order, separate sessions, a row that does not match the Schema. |
| `test/protocols.test.ts`, `test/provider.test.ts`, `test/fixtures/` | The recorded streams and the tests that use them, unchanged from Part 7. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 8.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
bun run test                                    # the loop, the fold, the restart and the file, plus the recorded streams
bun run db:generate                             # Drizzle Kit: write a migration after the table in src/session-table.ts changes
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL` and `MODEL` override the route's defaults.

The session is stored in `my-agent.db` next to this folder (`DB_PATH` overrides the path). `SESSION` names the session and defaults to `default`: starting the agent again with the same name continues that conversation, and a different name starts a separate one in the same file. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-9` and apply that part's changes.
