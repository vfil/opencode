# my-agent: state at the end of Part 10

A working copy of the agent as it stands after Part 10 ("Context Limits and Compaction"): the same five tools, y/n confirmation, protocols, routes, streaming, event log and inbox as Part 9, with a size check before every step. When the next request would come close to the model's context window, the model writes a summary of the history so far, the summary is appended to the log as a `compacted` event, and the next step starts from it. The log keeps every original event.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types as Schemas, with the TypeScript types derived from them. `isToolCall` and `textOf` are unchanged. |
| `src/events.ts` | `ModelEvent` and `FinishReason`: what a step's stream carries, unchanged from Part 7. |
| `src/errors.ts` | The four tool failures, `ProviderError`, `ConfigError`, `InputClosed` and `SessionCorrupt`, unchanged from Part 8. |
| `src/db/schema.ts` | The Drizzle `event` table (one row per session event) and the new `inbox` table (one row per prompt that waits). |
| `src/lines.ts` | `makeLines`: hands each typed line to the newest open question, keeps lines nobody asked for yet, and fails the open questions when input ends. |
| `src/session-event.ts` | The five session events (`prompt`, `step-finished`, `tool-result`, `turn-failed`, `compacted`) as a Schema. |
| `src/history.ts` | `summaryMessage` (how a summary reaches the model), `toHistory` (events to messages, starting from the latest summary) and `unansweredCalls` (where the last turn stopped). |
| `src/session.ts` | The `Session` service (`admit`, `deliver`, `pending`, `append`, `events`, `history`) and `SessionLive`, which opens the SQLite file and applies the migrations. |
| `src/compaction.ts` | `estimateTokens`, `isDue`, `transcript`, `SUMMARY_PROMPT` and `compactIfDue`, which writes the summary and appends it. |
| `src/sse.ts` | `Frame` and `frames`: cuts the bytes of a response into server-sent events, unchanged from Part 7. |
| `src/terminal.ts` | The `Terminal` service (`ask`, `say`, `write`) and `TerminalLive`, which now reads lines through `makeLines`. |
| `src/tool.ts` | `Tool`, `defineTool`, the `Tools` service and `runTool`, unchanged from Part 7. |
| `src/tools.ts` | The five tools, the `tools` array and `ToolsLive`, unchanged from Part 7. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`, unchanged from Part 7. |
| `src/provider.ts` | The routes, each with a `contextWindow`, `selectRoute` (now also reads `CONTEXT_WINDOW`), `requireFinish` and `chat`. |
| `src/model-client.ts` | The `ModelClient` service, which now also tells the agent its `contextWindow`, and `ModelClientLive`. |
| `src/agent.ts` | `step`, `run` (compacts before each step when it is due), `resume` (leaves a failed turn alone) and `repl`, which is unchanged from Part 9. |
| `src/index.ts` | Builds the live layers, including `SessionLive`, and runs `repl`. |
| `drizzle.config.ts`, `drizzle/` | Drizzle Kit's settings and the two generated migrations: the `event` table and the `inbox` table. |
| `test/fakes.ts` | `scriptedModel`, which now takes a context window, and `scriptedTerminal`. |
| `test/agent.test.ts` | Eight tests that run `repl` against the fakes on a session kept in memory, including prompts that queue up. |
| `test/resume.test.ts` | Twelve tests that write the log and inbox a dead process leaves and start a new agent on them, three of them after a compaction. |
| `test/history.test.ts` | The fold and `unansweredCalls` on lists of events, including the fold after a summary. |
| `test/compaction.test.ts` | The estimate, the clipped transcript, and the loop compacting on a small window, including a summary that fails. |
| `test/inbox.test.ts` | The inbox on a file: order, a move from inbox to log, survival across a close, and a delivery that fails. |
| `test/lines.test.ts` | The line router on its own. |
| `test/session.test.ts` | The file itself: order, separate sessions, a row that does not match the Schema. |
| `test/protocols.test.ts`, `test/provider.test.ts`, `test/fixtures/` | The recorded streams and the tests that use them, plus two tests for the context window of a route. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 10.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
bun run test                                    # the loop, the inbox, compaction, the fold, the restart and the file, plus the recorded streams
bun run db:generate                             # Drizzle Kit: write a migration after the table in src/db/schema.ts changes
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL`, `MODEL` and `CONTEXT_WINDOW` override the route's defaults. A small `CONTEXT_WINDOW`, such as 2000, makes compaction happen after a few prompts.

The session is stored in `my-agent.db` next to this folder (`DB_PATH` overrides the path). `SESSION` names the session and defaults to `default`: starting the agent again with the same name continues that conversation, and a different name starts a separate one in the same file. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-11` and apply that part's changes.
