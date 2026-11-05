# my-agent: state at the end of Part 4

A working copy of the agent as it stands after Part 4 ("Providers Behind One Interface"): the same five tools and y/n confirmation as Part 3, one loop, and a route for each of Ollama, llama.cpp and Claude.

| File | What it is |
| --- | --- |
| `index.ts` | The whole agent. Matches the final "Stuck? The finished index.ts" block in Part 4. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

## Run

```sh
bun install
bun run start                                   # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
bun run start:llamacpp                          # llama.cpp server on http://127.0.0.1:9931/v1
ANTHROPIC_API_KEY=... bun run start:claude      # Claude
bun run typecheck                               # Bun runs files without type checking; this does
```

`PROVIDER` picks the route (`ollama`, `llamacpp` or `claude`). `BASE_URL` and `MODEL` override the route's defaults. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-5` and apply that part's changes.
