import { Context, Effect, Schema, SchemaIssue } from "effect"
import { Blocked, Corrected, type Declined, InvalidInput, messageOf, ToolCrashed, UnknownTool } from "./errors"
import type { ToolCallPart, ToolResultPart, ToolResultValue } from "./messages"
import { Permission, type Request } from "./permission"

// Each of these becomes a tool result the model can read. A plain no (Declined) is not among them: it stops the turn.
export type ToolFailure = UnknownTool | InvalidInput | Blocked | Corrected | ToolCrashed

export type Tool = {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema, derived from the input Schema
  run: (input: unknown) => Effect.Effect<string, ToolFailure | Declined, Permission>
}

// The tools the agent knows, as a service. Which tools exist is decided where the layer is built.
export class Tools extends Context.Service<Tools, Tool[]>()("@agent/Tools") {}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1()

// Builds a Tool from one Schema: it validates the input and produces the JSON Schema the model receives.
// `DecodingServices: never` limits S to Schemas that need nothing else to decode, so `run` keeps R = never.
export const defineTool = <S extends Schema.Struct<Schema.Struct.Fields> & { readonly DecodingServices: never }>(config: {
  name: string
  description: string
  input: S
  execute: (input: S["Type"]) => Promise<string>
  permission?: (input: S["Type"]) => Request // what the call needs; a tool without it touches nothing and is never checked
}): Tool => {
  const takes = Object.keys(config.input.fields).join(", ")
  const decode = Schema.decodeUnknownEffect(config.input)

  return {
    name: config.name,
    description: config.description,
    parameters: Schema.toJsonSchemaDocument(config.input).schema,
    run: (raw) =>
      Effect.gen(function* () {
        // A string is arguments that were not valid JSON; the protocol keeps the raw text.
        if (typeof raw === "string") {
          return yield* new InvalidInput({ tool: config.name, problems: [`the arguments are not valid JSON: ${raw}`], takes })
        }

        const input = yield* decode(raw, { errors: "all" }).pipe(
          Effect.mapError(
            (error) =>
              new InvalidInput({
                tool: config.name,
                problems: formatIssues(error.issue).issues.map((issue) => `${issue.path?.join(".") || "input"}: ${issue.message}`),
                takes,
              }),
          ),
        )

        if (config.permission) {
          const permission = yield* Permission
          yield* permission.check(config.permission(input))
        }

        return yield* Effect.tryPromise({
          try: () => config.execute(input),
          catch: (error) => new ToolCrashed({ tool: config.name, reason: messageOf(error) }),
        })
      }),
  }
}

// Every tool failure becomes a tool result the model can read. Only a plain no from the user gets through, so the loop can stop the turn.
export const runTool = (call: ToolCallPart): Effect.Effect<ToolResultPart, Declined, Tools | Permission> =>
  Effect.gen(function* () {
    const tools = yield* Tools
    const done = (result: ToolResultValue): ToolResultPart => ({ type: "tool-result", id: call.id, name: call.name, result })
    const tool = tools.find((tool) => tool.name === call.name)
    const run = tool ? tool.run(call.input) : Effect.fail(new UnknownTool({ name: call.name, available: tools.map((tool) => tool.name) }))

    return yield* run.pipe(
      Effect.map((value) => done({ type: "text", value })),
      Effect.catch((failure) =>
        failure._tag === "Declined" ? Effect.fail(failure) : Effect.succeed(done({ type: "error", value: failure.message })),
      ),
    )
  })
