# Coding an AI Agent — Resources

## Knowledge

- [Anthropic: "Building effective agents"](https://www.anthropic.com/research/building-effective-agents)
  Anthropic's own field guide from working with dozens of teams building LLM agents in production. Core claim: successful implementations use simple, composable patterns, not complex frameworks — start simple, add complexity (and autonomy) only when the task needs it. Use for: deciding workflow vs. agent, the five workflow patterns (prompt chaining, routing, parallelization, orchestrator-worker, evaluator-optimizer), and when an agent's open-ended loop is actually justified over a fixed pipeline. **Note:** the page now carries a banner saying its tooling guidance is dated to Dec 2024 and points to the Managed Agents post below for the current approach — the loop/workflow concepts are still valid; the tooling-landscape specifics are not.
- [Anthropic Engineering: "Scaling Managed Agents: Decoupling the brain from the hands"](https://www.anthropic.com/research/managed-agents) (Apr 2026)
  Anthropic's current architecture for hosted long-horizon agents: session (append-only event log, outside the context window), harness (the loop calling Claude + routing tools — i.e. Lesson 1's loop), and sandbox (isolated tool execution, no credentials) as three decoupled, independently-replaceable components. Use for: why session durability and harness/sandbox separation matter at production scale — directly relevant to the clone's persistence milestone, and a useful external check against OpenCode's own Session Core design (`AGENTS.md`'s durable-inbox-before-execution rule is the same decoupling, self-hosted).
- [Ollama docs: Tool calling](https://docs.ollama.com/capabilities/tool-calling), [OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility), [Context length](https://docs.ollama.com/context-length), [Anthropic compatibility](https://docs.ollama.com/api/anthropic-compatibility)
  Official. Native `/api/chat` tool calling (arguments as object, no call id, results matched by `tool_name`); `/v1` OpenAI endpoint (tools + streaming, no `tool_choice`); 4k default context under 24 GiB VRAM, 64k+ recommended for agents (`OLLAMA_CONTEXT_LENGTH`); a subset of Anthropic Messages at `/v1/messages`. Use for: every Ollama section. Tested with Ollama 0.40.13.
- [llama.cpp: server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) and [function-calling.md](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md)
  Official. `llama-server` flags (`-hf`, `-c`, `--port`, default port 9931, `--jinja` on by default), OpenAI and Anthropic-compatible endpoints, which chat templates get native tool-call parsing vs the generic fallback, `parallel_tool_calls` off by default. Use for: every llama.cpp section. Tested with brew llama.cpp 0.7.0 (build b11669).
- [Hugging Face: unsloth/Qwen3.5-9B-GGUF](https://hf.co/unsloth/Qwen3.5-9B-GGUF)
  The GGUF build of the course's baseline local model (`Q4_K_M`), so llama.cpp runs the same model as Ollama's `qwen3.5:9b`. Use for: llama.cpp setup.
- [Thorsten Ball: "How to Build an Agent"](https://ampcode.com/how-to-build-an-agent)
  A real coding agent in ~400 lines: one model, one loop, three tools (read_file, list_files, edit_file). Use for: the minimal mental model of the loop itself, before OpenCode's production concerns (persistence, permissions, multiple step types) are layered on.
- [Claude (Anthropic) docs: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview.md)
  Official docs for how Claude requests a tool call (structured `tool_use` block) and how you return results. Use for: exact request/response shape, client vs. server tools, parallel tool calls, strict schema mode — the contract `packages/ai`'s `LLM.stream`/`LLM.generate` ultimately sits on top of.
- [Effect docs: Guides](https://effect.website/docs/v3/guides)
  Official Effect-TS documentation. Use for: generators (`Effect.gen`), services/layers (how Core wires domains like `SessionStore`, `LocationServiceMap`), `Stream`, and error handling with `Effect.fail`/tagged errors — the primitives this repo's style guide requires (e.g. "bind services to named variables," "`return yield* new MyError(...)`").
- [Claude docs: Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls) and [Define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)
  Official. `is_error` results, instructive error messages, 2–3 retries on invalid input, tool_result ordering (results first, immediately after tool_use), and description best practices ("by far the most important factor", 3–4+ sentences). Use for: Lesson 3 and any tool-protocol question.
- [Anthropic Engineering: "Writing effective tools for agents — with agents"](https://www.anthropic.com/engineering/writing-tools-for-agents) (Sep 2025)
  Tool design: fewer high-impact tools, namespacing, high-signal returns, pagination/truncation, actionable errors, describe "as to a new hire", evaluate with transcripts. Use for: tool quality, and later for evaluating the clone.
- [Effect docs: "Why Effect?"](https://effect.website/docs/getting-started/why-effect/)
  Effect's own case for itself: errors as values tracked in types, dependencies tracked in types, one toolkit for retries/streams/concurrency. Use for: motivating the Effect rewrite of the loop. Caveat: the docs site is largely v3.
- [Effect v3 → v4 migration guide](https://github.com/Effect-TS/effect/blob/main/MIGRATION.md)
  Official. This repo uses Effect **4.0.1**; many APIs were renamed (e.g. `Effect.fork` → `Effect.forkChild`, `Context.Tag` → `ServiceMap.Service` per secondary sources — verify in the guide). Use for: whenever a v3 example doesn't match repo code.
- This repo's `.opencode/skills/effect/SKILL.md`
  House rules for Effect v4 here; says to verify APIs against a local clone of `Effect-TS/effect` rather than memory. Use for: idiomatic patterns (`Effect.gen`, `Effect.fn`, `Schema.TaggedErrorClass`).
- [Bun docs: SQLite](https://bun.com/docs/runtime/sqlite)
  Built-in `bun:sqlite` driver. Use for: the clone's session event log in Stage B.
- This repo's own `AGENTS.md` (root) and `packages/core`, `packages/ai`, `packages/server` source
  Not a tutorial — the primary artifact being studied. Use for: how a production agent handles session durability, permissions, multi-provider models, and the step/turn vocabulary. Read in the order the lessons point to; don't try to read it cover to cover.

## Wisdom (Communities)

- No community joined yet — revisit once you've built the first working version of the clone and have concrete questions worth bringing somewhere (e.g. r/LocalLLaMA for local-model tool-calling and agent-architecture discussion, now central given the local-first mission; llama.cpp's GitHub Discussions for server behavior; or the Effect Discord for Effect-specific questions). Not proposed yet per the "wait until there's a real question" default.

## Gaps

- No resource yet specifically on *testing* agent loops (mocking LLM calls, cassette-style replay). `packages/ai/AGENTS.md` describes this repo's own cassette approach — may be worth treating as a primary source once lessons reach testing.
- No resource yet on session/event-sourcing patterns specifically for agents (the "durable inbox, advisory wake" design). May need to look at general event-sourcing material if the repo's own code isn't self-explanatory enough.
