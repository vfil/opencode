# my-agent: state at the end of Part 7

A working copy of the agent as it stands after Part 7 ("Streaming"): the same five tools, y/n confirmation, protocols, routes and services as Part 6, with the reply streamed from the server and shown while the model writes it.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types, `isToolCall` and `textOf`, unchanged from Part 6. |
| `src/events.ts` | `ModelEvent` and `FinishReason`: what a step's stream carries. |
| `src/errors.ts` | The four tool failures, `ProviderError`, `ConfigError` and `InputClosed`. |
| `src/sse.ts` | `Frame` and `frames`: cuts the bytes of a response into server-sent events. |
| `src/terminal.ts` | The `Terminal` service (`ask`, `say`, `write`) and `TerminalLive`. |
| `src/tool.ts` | `Tool`, `defineTool`, the `Tools` service and `runTool`, unchanged from Part 6. |
| `src/tools.ts` | The five tools, the `tools` array and `ToolsLive`, unchanged from Part 6. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`: the request encoders and, for each protocol, the step function from frames to model events. |
| `src/provider.ts` | The routes, `selectRoute`, `requireFinish` and `chat`, which streams the response. |
| `src/model-client.ts` | The `ModelClient` service, whose `chat` returns a `Stream` of model events, and `ModelClientLive`. |
| `src/agent.ts` | `step` (folds the events into a message while printing the text), `turn` and `repl`. |
| `src/index.ts` | Builds the live layers and runs `repl`, unchanged from Part 6. |
| `test/fakes.ts` | `scriptedModel` (streams events) and `scriptedTerminal` (records lines and writes). |
| `test/agent.test.ts` | Five tests that run `repl` against the fakes. |
| `test/protocols.test.ts` | The recorded streams run through the framing and both protocols, and cut at every byte position. |
| `test/provider.test.ts` | `chat` against a small local server: a good stream, a cut-off stream, bad JSON and error statuses. |
| `test/fixtures/` | The streams recorded from Ollama and llama.cpp, and one that follows Anthropic's documentation. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 7.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
bun run test                                    # the loop against a scripted model, the protocols against recorded streams
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL` and `MODEL` override the route's defaults. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-8` and apply that part's changes.
