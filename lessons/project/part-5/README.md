# my-agent: state at the end of Part 5

A working copy of the agent as it stands after Part 5 ("Why Effect"): the same five tools, y/n confirmation, protocols and routes as Part 4, rewritten in Effect and split into eight files in `src/`.

| File | What it is |
| --- | --- |
| `src/messages.ts` | The message and part types, `isToolCall` and `textOf`. |
| `src/errors.ts` | The four tool failures, `ProviderError` and `InputClosed`. |
| `src/terminal.ts` | The readline interface and `ask`. |
| `src/tool.ts` | `Tool`, `defineTool` and `runTool`. |
| `src/tools.ts` | The five tools and the `tools` array. |
| `src/protocols.ts` | `Protocol`, `openaiChat` and `anthropicMessages`, unchanged from Part 4. |
| `src/provider.ts` | The routes, route selection from `PROVIDER`, and `chat`. |
| `src/index.ts` | The prompt loop. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

The files match the "finished files" listing at the end of Part 5.

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL` and `MODEL` override the route's defaults. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-6` and apply that part's changes.
