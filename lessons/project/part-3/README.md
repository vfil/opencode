# my-agent: state at the end of Part 3

A working copy of the agent as it stands after Part 3 ("Tools as Data"): five tools, one `runTool`, a y/n confirmation before anything that changes a file, and the same code for Ollama, llama.cpp and Claude.

| File | What it is |
| --- | --- |
| `index.ts` | The local agent (OpenAI protocol: Ollama or llama.cpp). Matches the "Stuck? The finished index.ts" block in Part 3. |
| `claude.ts` | The same agent on Claude (Anthropic protocol). Matches the "Stuck? The finished claude.ts" block. |
| `playground/` | The scratch folder the agent works in. `sh reset-playground.sh` restores it to the Part 1 state. |

## Run

```sh
bun install
bun run start          # Ollama on http://127.0.0.1:11434/v1 with qwen3.5:9b
BASE_URL=http://127.0.0.1:9931/v1 bun run start   # llama.cpp server
ANTHROPIC_API_KEY=... bun run claude              # Claude
bun run typecheck      # Bun runs files without type checking; this does
```

`MODEL` overrides the model name. The agent starts in `playground/`, but its file tools are not restricted to that folder.

Each part gets its own folder under `lessons/project/`. To start the next part, copy this folder to `part-4` and apply that part's changes.
