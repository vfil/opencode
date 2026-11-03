# Two protocols for three providers

The clone talks to Ollama and llama.cpp through the OpenAI Chat Completions protocol and to Claude through Anthropic Messages, so the two local providers share one protocol and differ only by route. Two protocols are the smallest set that forces a real provider interface, and this matches how OpenCode reaches local servers (its Ollama plugin only discovers models; inference goes through the generic OpenAI-compatible path).

## Considered Options

- **Each provider's native protocol** (Ollama `/api/chat`, OpenAI for llama.cpp, Anthropic for Claude): rejected as a maintained path. Three protocols triple the translation work, and Ollama's native format matches tool results by `tool_name` with no call id, which is ambiguous for parallel calls. It still appears once in Lesson 1 as a look under the hood.
- **Anthropic Messages everywhere** (all three accept it): rejected. Both local servers implement only a subset with no compatibility promise, and a single protocol hides the differences the lessons exist to teach.

## Consequences

- On the OpenAI protocol there is no `is_error` flag; a failed tool result is signalled only by its text, so local tool errors must be self-explanatory.
- Adding a provider that speaks an existing protocol means adding a route; a new protocol is needed only for a new wire format.
