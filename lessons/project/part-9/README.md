# my-agent: state at the end of Part 9

A working copy of the agent as it stands after Part 9 ("Inbox vs. Execution"): the same five tools, y/n confirmation, protocols, routes, streaming and event log as Part 8, with a prompt saved in an inbox the moment it is typed, delivered into the log one at a time when the agent is idle, and still waiting after a restart if the process died before it ran.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types as Schemas, with the TypeScript types derived from them. `isToolCall` and `textOf` are unchanged. |
| `src/events.ts` | `ModelEvent` and `FinishReason`: what a step's stream carries, unchanged from Part 7. |
| `src/errors.ts` | The four tool failures, `ProviderError`, `ConfigError`, `InputClosed` and `SessionCorrupt`, unchanged from Part 8. |
| `src/db/schema.ts` | The Drizzle `event` table (one row per session event) and the new `inbox` table (one row per prompt that waits). |
| `src/lines.ts` | `makeLines`: hands each typed line to the newest open question, keeps lines nobody asked for yet, and fails the open questions when input ends. |
| `src/session-event.ts` | The four session events (`prompt`, `step-finished`, `tool-result`, `turn-failed`) as a Schema. |
| `src/history.ts` | `toHistory` (events to messages) and `unansweredCalls` (where the last turn stopped). |
| `src/session.ts` | The `Session` service (`admit`, `deliver`, `pending`, `append`, `events`, `history`) and `SessionLive`, which opens the SQLite file and applies the migrations. |
| `src/sse.ts` | `Frame` and `frames`: cuts the bytes of a response into server-sent events, unchanged from Part 7. |
| `src/terminal.ts` | The `Terminal` service (`ask`, `say`, `write`) and `TerminalLive`, which now reads lines through `makeLines`. |
| `src/tool.ts` | `Tool`, `defineTool`, the `Tools` service and `runTool`, unchanged from Part 7. |
| `src/tools.ts` | The five tools, the `tools` array and `ToolsLive`, unchanged from Part 7. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`, unchanged from Part 7. |
| `src/provider.ts` | The routes, `selectRoute`, `requireFinish` and `chat`, unchanged from Part 7. |
| `src/model-client.ts` | The `ModelClient` service and `ModelClientLive`, unchanged from Part 7. |
| `src/agent.ts` | `step`, `run`, `resume` and `repl`, which is now a reader that admits prompts and a worker that delivers and runs them. `turn` is gone. |
| `src/index.ts` | Builds the live layers, including `SessionLive`, and runs `repl`. |
| `drizzle.config.ts`, `drizzle/` | Drizzle Kit's settings and the two generated migrations: the `event` table and the `inbox` table. |
| `test/fakes.ts` | `scriptedModel` and `scriptedTerminal`. The terminal can hold back an answer, and answers confirmations from their own list. |
| `test/agent.test.ts` | Eight tests that run `repl` against the fakes on a session kept in memory, including prompts that queue up. |
| `test/resume.test.ts` | Nine tests that write the log and inbox a dead process leaves and start a new agent on them. |
| `test/history.test.ts` | The fold and `unansweredCalls` on lists of events. |
| `test/inbox.test.ts` | The inbox on a file: order, a move from inbox to log, survival across a close, and a delivery that fails. |
| `test/lines.test.ts` | The line router on its own. |
| `test/session.test.ts` | The file itself: order, separate sessions, a row that does not match the Schema. |
| `test/protocols.test.ts`, `test/provider.test.ts`, `test/fixtures/` | The recorded streams and the tests that use them, unchanged from Part 7. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 9.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
bun run test                                    # the loop, the inbox, the fold, the restart and the file, plus the recorded streams
bun run db:generate                             # Drizzle Kit: write a migration after the table in src/db/schema.ts changes
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL` and `MODEL` override the route's defaults.

The session is stored in `my-agent.db` next to this folder (`DB_PATH` overrides the path). `SESSION` names the session and defaults to `default`: starting the agent again with the same name continues that conversation, and a different name starts a separate one in the same file. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-10` and apply that part's changes.
