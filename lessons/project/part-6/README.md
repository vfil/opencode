# my-agent: state at the end of Part 6

A working copy of the agent as it stands after Part 6 ("Services and Layers"): the same five tools, y/n confirmation, protocols and routes as Part 5, with the model client, the terminal and the tools as services, and a test that runs the whole loop against a scripted model.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types, `isToolCall` and `textOf`, unchanged from Part 5. |
| `src/errors.ts` | The four tool failures, `ProviderError`, `ConfigError` and `InputClosed`. |
| `src/terminal.ts` | The `Terminal` service and `TerminalLive`, which opens and closes readline. |
| `src/tool.ts` | `Tool`, `defineTool`, the `Tools` service and `runTool`. |
| `src/tools.ts` | The five tools, the `tools` array and `ToolsLive`. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`, unchanged from Part 5. |
| `src/provider.ts` | The routes, `selectRoute` and `chat`. |
| `src/model-client.ts` | The `ModelClient` service and `ModelClientLive`. |
| `src/agent.ts` | `turn` and `repl`: the loop, which asks for services and imports none of the real ones. |
| `src/index.ts` | Builds the live layers and runs `repl`. |
| `test/fakes.ts` | `scriptedModel` and `scriptedTerminal`. |
| `test/agent.test.ts` | Three tests that run `repl` against the fakes. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 6.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
bun run test                                    # the loop against a scripted model, no server needed
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL` and `MODEL` override the route's defaults. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-7` and apply that part's changes.
