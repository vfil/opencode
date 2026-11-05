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

## Tools

**Tool**:
A named capability the model may request, defined by a name, a description, an input JSON Schema and an executor.
_Avoid_: Function, plugin, skill

**Tool registry**:
The collection of tools an agent knows, from which each tool call is matched to a tool by name.
_Avoid_: Tool list, tool map, toolbox

**Tool call**:
The model's structured request to run one tool with given arguments.
_Avoid_: Function call, tool use

**Tool result**:
What your code sends back for one tool call: its output as text, or an error.
_Avoid_: Tool output, response

## Messages

**Message**:
One entry in the conversation history: a role and its content parts.
_Avoid_: Chat message, turn

**Content part**:
One item inside a message: text, a tool call, or a tool result.
_Avoid_: Block, chunk, item

## The loop

**Step**:
Exactly one model call, from request to response.
_Avoid_: Turn, iteration, provider turn

**Turn**:
All the steps from a user prompt until the agent goes idle.
_Avoid_: Step, round
