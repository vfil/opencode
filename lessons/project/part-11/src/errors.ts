import { Schema } from "effect"

// Tool failures: each one becomes a tool result the model can read and react to.
export class UnknownTool extends Schema.TaggedError<UnknownTool>()("UnknownTool", {
  name: Schema.String,
  available: Schema.Array(Schema.String),
}) {
  override get message() {
    return `Unknown tool: ${this.name}. Available tools: ${this.available.join(", ")}`
  }
}

export class InvalidInput extends Schema.TaggedError<InvalidInput>()("InvalidInput", {
  tool: Schema.String,
  problems: Schema.Array(Schema.String),
  takes: Schema.String,
}) {
  override get message() {
    return [`Invalid input for ${this.tool}:`, ...this.problems.map((problem) => `- ${problem}`), `${this.tool} takes an object with the fields: ${this.takes}`].join("\n")
  }
}

// A rule denies the request. The user is not asked.
export class Blocked extends Schema.TaggedError<Blocked>()("Blocked", {
  action: Schema.String,
  resource: Schema.String,
}) {
  override get message() {
    return `Blocked by rule: ${this.action} ${this.resource}`
  }
}

// The user said no and wrote what to do instead. The turn continues with this as the result.
export class Corrected extends Schema.TaggedError<Corrected>()("Corrected", {
  feedback: Schema.String,
}) {
  override get message() {
    return `The user did not allow this and said: ${this.feedback}`
  }
}

export class ToolCrashed extends Schema.TaggedError<ToolCrashed>()("ToolCrashed", {
  tool: Schema.String,
  reason: Schema.String,
}) {
  override get message() {
    return this.reason
  }
}

// The user said a plain no.
export class Declined extends Schema.TaggedError<Declined>()("Declined", {}) {
  override get message() {
    return "The user declined this action."
  }
}

// Failures of the model request. The user reads these; the model never sees them.
export class ProviderError extends Schema.TaggedError<ProviderError>()("ProviderError", {
  reason: Schema.String,
}) {
  override get message() {
    return this.reason
  }
}

// The environment asks for a provider the agent cannot reach, such as an unknown PROVIDER or a missing API key.
export class ConfigError extends Schema.TaggedError<ConfigError>()("ConfigError", {
  reason: Schema.String,
}) {
  override get message() {
    return this.reason
  }
}

// A stored session event that no longer matches the schema, such as a file edited by hand or written by an older version.
export class SessionCorrupt extends Schema.TaggedError<SessionCorrupt>()("SessionCorrupt", {
  session: Schema.String,
  seq: Schema.Number,
  problem: Schema.String,
}) {
  override get message() {
    return `Session ${this.session} cannot be read: event ${this.seq} ${this.problem}`
  }
}

// Standard input ended, so there is nobody left to ask.
export class InputClosed extends Schema.TaggedError<InputClosed>()("InputClosed", {}) {}

export const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))
