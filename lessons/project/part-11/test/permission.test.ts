import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { Effect, Exit, Layer } from "effect"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseLive } from "../src/database"
import { defaults, evaluate, loadRules, matches, Permission, PermissionLive, type Request, type Rule } from "../src/permission"
import { tools } from "../src/tools"
import { scriptedTerminal } from "./fakes"

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "agent-permission-"))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

describe("matching", () => {
  test("* matches any text, / included", () => {
    expect(matches("notes/a/b.txt", "notes/*")).toBe(true)
    expect(matches("git status", "git *")).toBe(true)
    expect(matches("anything", "*")).toBe(true)
  })

  test("? matches exactly one character", () => {
    expect(matches("a1.txt", "a?.txt")).toBe(true)
    expect(matches("a12.txt", "a?.txt")).toBe(false)
  })

  test("the whole value has to fit, and other characters mean themselves", () => {
    expect(matches("secret-file.txt.bak", "secret-file.txt")).toBe(false)
    expect(matches("secret-filextxt", "secret-file.txt")).toBe(false)
    expect(matches("(a)+[b]", "(a)+[b]")).toBe(true)
  })
})

describe("evaluating rules", () => {
  const request = (action: string, resource: string): Request => ({ action, resource })

  test("the last matching rule wins", () => {
    const rules: Rule[] = [
      { action: "edit", resource: "*", effect: "deny" },
      { action: "edit", resource: "notes/*", effect: "allow" },
    ]
    expect(evaluate(rules, request("edit", "notes/todo.txt")).effect).toBe("allow")
    expect(evaluate(rules, request("edit", "README.md")).effect).toBe("deny")
  })

  test("with no matching rule, the answer is ask", () => {
    expect(evaluate([], request("bash", "ls")).effect).toBe("ask")
  })

  test("the defaults read freely, ask outside the working directory, and never read .env files", () => {
    const effectOf = (action: string, resource: string) => evaluate(defaults, request(action, resource)).effect
    expect(effectOf("read", "notes/todo.txt")).toBe("allow")
    expect(effectOf("read", "../my-agent.db")).toBe("ask")
    expect(effectOf("read", ".env")).toBe("deny")
    expect(effectOf("read", "../.env")).toBe("deny")
    expect(effectOf("edit", "notes/todo.txt")).toBe("ask")
    expect(effectOf("bash", "ls")).toBe("ask")
  })
})

describe("the rules file", () => {
  test("a missing file leaves the defaults", async () => {
    expect(await Effect.runPromise(loadRules(join(dir, "permissions.json")))).toEqual(defaults)
  })

  test("rules in the file come after the defaults, so they win", async () => {
    const file = join(dir, "permissions.json")
    const deny: Rule = { action: "read", resource: "secret-file.txt", effect: "deny" }
    await writeFile(file, JSON.stringify([deny]))
    expect(await Effect.runPromise(loadRules(file))).toEqual([...defaults, deny])
  })

  test("a file that is not a list of rules is a ConfigError", async () => {
    const file = join(dir, "permissions.json")
    await writeFile(file, JSON.stringify([{ action: "read", resource: "*", effect: "maybe" }]))
    const exit = await Effect.runPromiseExit(loadRules(file))
    expect(Exit.isFailure(exit) && JSON.stringify(exit.cause)).toContain("ConfigError")
  })
})

// Checks requests one after another, like one run of the agent, with the user typing `confirmations`.
const checking = async (requests: Request[], confirmations: string[], rules: ReadonlyArray<Rule> = defaults) => {
  const terminal = scriptedTerminal([], confirmations)
  const layer = PermissionLive(rules).pipe(Layer.provide(Layer.mergeAll(terminal.layer, DatabaseLive(join(dir, "agent.db")))))
  const outcomes = await Effect.runPromise(
    Effect.gen(function* () {
      const permission = yield* Permission
      return yield* Effect.forEach(requests, (request) =>
        permission.check(request).pipe(
          Effect.as("allowed"),
          Effect.catch((error) => Effect.succeed(error.message)),
        ),
      )
    }).pipe(Effect.provide(layer)),
  )
  return { outcomes, asked: terminal.output.filter((line) => line.startsWith("Allow")).length }
}

describe("asking the user", () => {
  const edit: Request = { action: "edit", resource: "notes/todo.txt" }

  test("yes allows this call only", async () => {
    expect(await checking([edit, edit], ["y", "n"])).toEqual({ outcomes: ["allowed", "The user declined this action."], asked: 2 })
  })

  test("always is saved, and a new run on the same file does not ask again", async () => {
    expect(await checking([edit, edit], ["a"])).toEqual({ outcomes: ["allowed", "allowed"], asked: 1 })
    expect(await checking([edit], [])).toEqual({ outcomes: ["allowed"], asked: 0 })
  })

  test("a saved approval is exact: it does not cover other resources", async () => {
    await checking([edit], ["a"])
    expect(await checking([{ action: "edit", resource: "notes/other.txt" }], ["n"])).toMatchObject({ asked: 1 })
  })

  test("a saved approval never overrides a deny", async () => {
    await checking([edit], ["a"])
    const rules: Rule[] = [...defaults, { action: "edit", resource: "notes/*", effect: "deny" }]
    expect(await checking([edit], [], rules)).toEqual({ outcomes: ["Blocked by rule: edit notes/*"], asked: 0 })
  })

  test("anything else is a note for the model", async () => {
    expect((await checking([edit], ["add it to the end instead"])).outcomes).toEqual([
      "The user did not allow this and said: add it to the end instead",
    ])
  })

  test("no answer, because input has ended, counts as no", async () => {
    expect((await checking([edit], [])).outcomes).toEqual(["The user declined this action."])
  })
})

describe("paths in requests", () => {
  const readFile = tools.find((tool) => tool.name === "read_file")!
  const rules: Rule[] = [...defaults, { action: "read", resource: "secret-file.txt", effect: "deny" }]

  test.each([
    ["as written", "secret-file.txt"],
    ["starting with ./", "./secret-file.txt"],
    ["through notes/..", "notes/../secret-file.txt"],
    ["as an absolute path", join(process.cwd(), "secret-file.txt")],
  ])("the path %s is the same file to the rules", async (_label, path) => {
      const terminal = scriptedTerminal([])
      const layer = PermissionLive(rules).pipe(Layer.provide(Layer.mergeAll(terminal.layer, DatabaseLive(":memory:"))))
      const exit = await Effect.runPromiseExit(readFile.run({ path }).pipe(Effect.provide(layer)))
    expect(Exit.isFailure(exit) && JSON.stringify(exit.cause)).toContain("Blocked")
  })
})
