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

**Tool failure**:
A typed error raised while running a tool call. The agent turns it into a tool result of type error, so the model can read it and correct itself.
_Avoid_: Tool error, exception

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

## Wiring

**Service**:
A capability the agent asks for by name instead of importing it, such as the model client, the terminal or the tools. Its type shows up in the `R` of every Effect that uses it.
_Avoid_: Dependency, singleton, provider

**Layer**:
The recipe that builds a service, possibly opening and closing resources. The live layer talks to the real world; a test layer replaces it with a scripted fake.
_Avoid_: Module, factory, container

**Model client**:
The service that makes one step: it takes the history and the tools and returns the model's next message as a stream of model events.
_Avoid_: Provider, LLM, chat function

**Model event**:
One item in the stream a step produces: a piece of text, a complete tool call, or the end of the step with its reason. The agent builds the step's message from these events.
_Avoid_: Chunk, token, delta (a text piece is one kind of model event)

## The session

**Session**:
The durable record of one conversation, kept outside the process so that it survives a restart.
_Avoid_: Chat, thread, conversation

**Session event**:
One fact appended to the session: a prompt, a finished step, a tool result, or a failed turn. Model events are a different thing and are never stored.
_Avoid_: Event (bare), record, entry

**Event log**:
The ordered session events of one session. It only grows; nothing in it is edited or deleted.
_Avoid_: Journal, transcript, message table

**History**:
The messages the next step sends to the model, rebuilt from the event log before every step. It is derived and never stored on its own.
_Avoid_: Context, conversation, projection
