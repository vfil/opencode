# Mission: Coding an AI Agent (via a mini-OpenCode clone)

## Why
You want to be able to build an AI coding agent from scratch, confidently, in any stack — not just follow a tutorial once. The vehicle is studying this repo (OpenCode: Bun + TypeScript + Effect) and building your own smaller clone alongside it, so the concepts transfer beyond this one codebase. The clone runs on local models first (Ollama, llama.cpp): they cost nothing per call, and their weaker tool calling shows which parts of an agent are the harness's responsibility rather than the model's. Claude is supported as the reference provider.

## Success looks like
- You can explain, from memory, the core agent loop (prompt → model call → tool call → result → repeat) and why it's structured that way.
- You've built your own agent with: persisted sessions (survive a restart), multiple real tools (e.g. read/write file, run shell, list files), and a basic permission/approval step before a dangerous tool runs.
- You can read an unfamiliar chunk of `packages/core/src/session` and `packages/ai` and explain what it's doing and why, including the Effect patterns used.
- The clone runs the same agent against Ollama, llama.cpp, and Claude, and adding a fourth provider means adding a route, plus a protocol only if its wire format is new, without touching the loop.
- When a local model misbehaves, you can tell "my harness is wrong" from "the model is weak" by replaying the task against Claude.
- You can justify, in your own words, the tradeoffs OpenCode made (e.g. durable inbox before execution, one step = one LLM call, no in-memory tool loop) — not just recite them.

## Constraints
- Comfortable with TypeScript already; agent concepts and Effect are both new.
- Chose to use the same stack as this repo (Bun + Effect) rather than a simplified one — Effect is an explicit part of what's being learned, not a side quest to avoid.
- Hardware: two Macs. An Apple M1 with 16 GB (roughly 4–9B models at a 32k context) and an Apple M4 with 36 GB (room for a 64k context or a larger local model). Lessons target the 16 GB baseline so results compare across machines; larger-machine options are optional notes.
- Claude costs money per call, so Claude sections are optional per lesson; local providers are the main path.
- Scope is ambitious on purpose: sessions, persistence, and several tools — closer to "mini-OpenCode" than a toy loop. Expect more sessions than a minimal clone would need; pace accordingly.

## Out of scope (for now)
- The TUI/rendering layer (OpenTUI/Solid), desktop app, web app — focus is the agent core, not the interfaces around it.
- Providers beyond the three (Ollama, llama.cpp, Claude), and `packages/ai`'s full provider matrix. Three providers are enough to learn the abstraction; more would be plumbing.
- Clustering / multi-process session ownership — explicitly deferred even in OpenCode itself.
- Effect mastery for its own sake — only as much Effect as the agent loop and session/persistence code actually needs.
