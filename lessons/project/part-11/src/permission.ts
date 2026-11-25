import { and, eq } from "drizzle-orm"
import { Context, Effect, Layer, Schema } from "effect"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { relative, resolve } from "node:path"
import { Database } from "./database"
import { ApprovalTable } from "./db/schema"
import { Blocked, ConfigError, Corrected, Declined } from "./errors"
import { Terminal } from "./terminal"

// What a rule says about a matching request. OpenCode uses the same name.
export const PermissionEffect = Schema.Literals(["allow", "ask", "deny"])

// `action` and `resource` are patterns: `*` matches any text, `?` matches one character.
export const Rule = Schema.Struct({ action: Schema.String, resource: Schema.String, effect: PermissionEffect })
export type Rule = typeof Rule.Type
export const Ruleset = Schema.Array(Rule)

// What a tool call asks for: the kind of access and what it is applied to.
export type Request = { action: string; resource: string }

const special = /[.+^${}()|[\]\\]/g

// True when the whole value fits the pattern. `*` also matches `/`, so `notes/*` covers every file below notes.
export const matches = (value: string, pattern: string) => {
  const source = pattern
    .split("*")
    .map((part) => part.split("?").map((text) => text.replace(special, "\\$&")).join("."))
    .join(".*")
  return new RegExp(`^${source}$`, "s").test(value)
}

// The last rule that matches wins. When no rule matches, the user is asked.
export const evaluate = (rules: ReadonlyArray<Rule>, request: Request): Rule =>
  rules.findLast((rule) => matches(request.action, rule.action) && matches(request.resource, rule.resource)) ?? {
    ...request,
    effect: "ask",
  }

// Ask about everything, read inside the working directory freely, ask before going outside it, and never read .env files.
// The order matters: a later rule wins, so the .env rule also covers ../.env.
export const defaults: Rule[] = [
  { action: "*", resource: "*", effect: "ask" },
  { action: "read", resource: "*", effect: "allow" },
  { action: "*", resource: "../*", effect: "ask" },
  { action: "read", resource: "*.env", effect: "deny" },
]

// A path as rules see it: relative to the working directory, so `./a.txt`, `notes/../a.txt` and an absolute path
// to the same file all become `a.txt`. A path outside the working directory starts with `../`.
export const relativePath = (path: string) => relative(process.cwd(), resolve(path)) || "."

const decodeRules = Schema.decodeUnknownEffect(Schema.fromJsonString(Ruleset))

// The defaults, followed by the rules in the file if it exists. A file that is not a list of rules stops the agent.
export const loadRules = (file: string) =>
  Effect.gen(function* () {
    if (!existsSync(file)) return defaults
    const text = yield* Effect.promise(() => readFile(file, "utf8"))
    const rules = yield* decodeRules(text).pipe(
      Effect.mapError((error) => new ConfigError({ reason: `${file} is not a list of permission rules: ${error.message}` })),
    )
    return [...defaults, ...rules]
  })

export class Permission extends Context.Service<
  Permission,
  {
    // Succeeds when the request may go ahead. Fails when a rule denies it, or when the user says no.
    readonly check: (request: Request) => Effect.Effect<void, Blocked | Corrected | Declined>
  }
>()("@agent/Permission") {}

export const PermissionLive = (rules: ReadonlyArray<Rule>) =>
  Layer.effect(
    Permission,
    Effect.gen(function* () {
      const db = yield* Database
      const terminal = yield* Terminal

      const saved = (request: Request) =>
        db
          .select()
          .from(ApprovalTable)
          .where(and(eq(ApprovalTable.action, request.action), eq(ApprovalTable.resource, request.resource)))
          .pipe(
            Effect.map((rows) => rows.length > 0),
            Effect.orDie,
          )

      const save = (request: Request) => db.insert(ApprovalTable).values(request).pipe(Effect.asVoid, Effect.orDie)

      const check = (request: Request) =>
        Effect.gen(function* () {
          const rule = evaluate(rules, request)
          if (rule.effect === "deny") return yield* new Blocked({ action: rule.action, resource: rule.resource })
          if (rule.effect === "allow") return
          // A saved approval settles a request that would ask. It is matched exactly, never as a pattern.
          if (yield* saved(request)) return

          // No answer, because input has ended, counts as no.
          const answer = yield* terminal
            .ask(`Allow ${request.action} ${request.resource}? [y]es, [a]lways, [n]o, or type what to do instead: `)
            .pipe(Effect.orElseSucceed(() => ""))
          const reply = answer.trim()
          const word = reply.toLowerCase()
          if (word === "y" || word === "yes") return
          if (word === "a" || word === "always") {
            yield* save(request)
            yield* terminal.say(`[always allowed] ${request.action} ${request.resource}`)
            return
          }
          if (word === "" || word === "n" || word === "no") return yield* new Declined()
          return yield* new Corrected({ feedback: reply })
        })

      return Permission.of({ check })
    }),
  )

// The rules from a file, read once when the layer is built.
export const PermissionFromFile = (file: string) => Layer.unwrap(Effect.map(loadRules(file), PermissionLive))
