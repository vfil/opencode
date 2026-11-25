import { describe, expect, test } from "bun:test"
import { Effect, Schema } from "effect"
import { repl } from "../src/agent"
import { ProviderError } from "../src/errors"
import type { Rule } from "../src/permission"
import { Session } from "../src/session"
import { defineTool } from "../src/tool"
import { agentLayers, callTool, fail, reply, scriptedModel, scriptedTerminal, type Step } from "./fakes"

// Two small tools, so the tests never touch the disk.
const echo = defineTool({
  name: "echo",
  description: "Returns its text.",
  input: Schema.Struct({ text: Schema.String }),
  execute: async ({ text }) => text,
})

const deleteEverything = defineTool({
  name: "delete_everything",
  description: "Pretends to delete everything.",
  input: Schema.Struct({}),
  execute: async () => "deleted",
  permission: () => ({ action: "bash", resource: "delete everything" }),
})

// Runs the loop against a script, on a session kept in memory, and returns what the loop and the fakes saw.
const run = async (script: {
  model: Step[]
  answers: Array<string | Promise<string>>
  confirmations?: string[]
  rules?: Rule[]
  beforeStep?: (request: number) => Promise<void>
}) => {
  const model = scriptedModel(script.model, script.beforeStep)
  const terminal = scriptedTerminal(script.answers, script.confirmations)
  const layers = agentLayers({ model: model.layer, terminal: terminal.layer, tools: [echo, deleteEverything] }, { rules: script.rules })

  const { history, events } = await Effect.runPromise(
    Effect.gen(function* () {
      yield* repl
      const session = yield* Session
      return { history: yield* session.history, events: yield* session.events }
    }).pipe(Effect.provide(layers)),
  )
  return { history, events, requests: model.requests, output: terminal.output, writes: terminal.writes }
}

describe("the agent loop", () => {
  test("runs a tool call and then answers", async () => {
    const { history, output } = await run({
      model: [callTool("call_1", "echo", { text: "hi" }), reply("The tool said hi.")],
      answers: ["say hi"],
    })

    expect(history.map((message) => message.role)).toEqual(["user", "assistant", "tool", "assistant"])
    expect(history[2]?.content).toEqual([{ type: "tool-result", id: "call_1", name: "echo", result: { type: "text", value: "hi" } }])
    expect(output).toContain("Agent: The tool said hi.")
  })

  test("appends each fact to the log as it happens", async () => {
    const { events } = await run({
      model: [callTool("call_1", "echo", { text: "hi" }), reply("The tool said hi.")],
      answers: ["say hi"],
    })

    expect(events.map((event) => event.type)).toEqual(["prompt", "step-finished", "tool-result", "step-finished"])
  })

  test("shows the reply piece by piece", async () => {
    const { writes } = await run({ model: [reply("Hello there, friend.")], answers: ["hi"] })

    expect(writes).toEqual(["Agent: ", "Hello ", "there, ", "friend."])
  })

  test("a plain no stops the turn without asking the model again", async () => {
    const { requests, events, output } = await run({
      model: [callTool("call_1", "delete_everything", {}), reply("This reply is never asked for.")],
      answers: ["clean up"],
      confirmations: ["n"],
    })

    expect(requests).toHaveLength(1)
    expect(events.map((event) => event.type)).toEqual(["prompt", "step-finished", "tool-result", "turn-stopped"])
    expect(output).toContain("[stopped] declined")
  })

  test("the next prompt sees the declined call and its result", async () => {
    const { requests } = await run({
      model: [callTool("call_1", "delete_everything", {}), reply("All right, nothing deleted.")],
      answers: ["clean up", "what happened?"],
      confirmations: ["n"],
    })

    expect(requests[1]?.map((message) => message.role)).toEqual(["user", "assistant", "tool", "user"])
    expect(JSON.stringify(requests[1]?.[2])).toContain("The user declined this action.")
  })

  test("calls after a declined one are not run and not asked about", async () => {
    const twoCalls: Step = [
      { type: "tool-call", id: "call_1", name: "delete_everything", input: {} },
      { type: "tool-call", id: "call_2", name: "delete_everything", input: {} },
      { type: "finish", reason: "tool-calls" },
    ]
    const { events, output } = await run({ model: [twoCalls], answers: ["clean up twice"], confirmations: ["n", "y"] })

    expect(output.filter((line) => line.startsWith("Allow"))).toHaveLength(1)
    const results = events.flatMap((event) => (event.type === "tool-result" ? [event.part.result] : []))
    expect(results).toEqual([
      { type: "error", value: "The user declined this action." },
      { type: "error", value: "Not run: the user stopped this turn." },
    ])
  })

  test("a no with a note goes to the model, and the turn continues", async () => {
    const { requests, events } = await run({
      model: [callTool("call_1", "delete_everything", {}), reply("I will only delete the logs.")],
      answers: ["clean up"],
      confirmations: ["only delete the logs"],
    })

    expect(requests).toHaveLength(2)
    expect(JSON.stringify(requests[1]?.at(-1))).toContain("The user did not allow this and said: only delete the logs")
    expect(events.at(-1)?.type).toBe("step-finished")
  })

  test("a deny rule answers without asking, and the turn continues", async () => {
    const { requests, output } = await run({
      model: [callTool("call_1", "delete_everything", {}), reply("That is not allowed here.")],
      answers: ["clean up"],
      rules: [{ action: "bash", resource: "delete *", effect: "deny" }],
    })

    expect(output.some((line) => line.startsWith("Allow"))).toBe(false)
    expect(JSON.stringify(requests[1]?.at(-1))).toContain("Blocked by rule: bash delete *")
  })

  test("ends the line of a reply that breaks off, then drops the turn", async () => {
    const { history, events, output } = await run({
      model: [[{ type: "text-delta", text: "The answer is" }, new ProviderError({ reason: "connection reset" })]],
      answers: ["hello"],
    })

    expect(history).toEqual([])
    expect(events.map((event) => event.type)).toEqual(["prompt", "turn-failed"])
    expect(output).toContain("Agent: The answer is")
    expect(output).toContain("[provider error] connection reset")
  })

  test("drops a turn whose model call fails", async () => {
    const { history, output } = await run({
      model: [fail("connection refused")],
      answers: ["hello"],
    })

    expect(history).toEqual([])
    expect(output).toContain("[provider error] connection refused")
  })

  test("saves every prompt first, then runs them one at a time in the order they came", async () => {
    const { events, requests, output } = await run({
      model: [reply("First."), reply("Second."), reply("Third.")],
      answers: ["one", "two", "three"],
    })

    expect(output.filter((line) => line === "[queued]")).toHaveLength(3)
    expect(events.map((event) => (event.type === "prompt" ? event.text : event.type))).toEqual([
      "one", "step-finished", "two", "step-finished", "three", "step-finished",
    ])
    expect(requests[2]?.map((message) => message.role)).toEqual(["user", "assistant", "user", "assistant", "user"])
  })

  test("a prompt typed while a turn runs is saved at once and runs after the turn", async () => {
    let typeSecond!: (line: string) => void
    const second = new Promise<string>((resolve) => (typeSecond = resolve))

    const { events, output } = await run({
      model: [callTool("call_1", "echo", { text: "hi" }), reply("First done."), reply("Second done.")],
      answers: ["first", second],
      // The user types while the model is working on the second step of the first turn.
      beforeStep: async (request) => {
        if (request !== 2) return
        typeSecond("second")
        await new Promise((resolve) => setTimeout(resolve, 5))
      },
    })

    expect(output.indexOf("[queued]", output.indexOf("[queued]") + 1)).toBeLessThan(output.indexOf("Agent: First done."))
    expect(events.map((event) => (event.type === "prompt" ? event.text : event.type))).toEqual([
      "first", "step-finished", "tool-result", "step-finished", "second", "step-finished",
    ])
    expect(output).toContain("Agent: Second done.")
  })
})
