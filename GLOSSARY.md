# Coding an AI Agent Glossary

The vocabulary for building a coding agent that runs against several model sources. Terms follow OpenCode's own usage so its source reads without translation.

## Models and providers

**Provider**:
A service that serves models over HTTP, such as Ollama, a llama.cpp server, or Anthropic.
_Avoid_: Backend, API, runtime, vendor

**Protocol**:
The wire format of one request and its response, such as Ollama's native format, OpenAI Chat Completions, or Anthropic Messages. One provider can speak several protocols, and several providers can share one.
_Avoid_: API, SDK, format

**Route**:
A protocol bound to one provider's endpoint and authentication. Ollama and a llama.cpp server share a protocol but have different routes.
_Avoid_: Adapter, connector, driver

**Model**:
A specific set of weights a provider serves, such as `qwen3.5:9b` or a Claude model.
_Avoid_: Provider, engine

## The loop

**Step**:
Exactly one model call, from request to response.
_Avoid_: Turn, iteration, provider turn

**Turn**:
All the steps from a user prompt until the agent goes idle.
_Avoid_: Step, round
