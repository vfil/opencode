import { Effect, Layer } from "effect"
import { repl } from "./agent"
import { DatabaseLive } from "./database"
import { ModelClientLive } from "./model-client"
import { PermissionFromFile } from "./permission"
import { SessionLive } from "./session"
import { TerminalLive } from "./terminal"
import { ToolsLive } from "./tools"

// The session and the permission check share one database; the permission check also asks through the terminal.
// The agent starts in playground/, so the default puts the database next to the project, outside the folder it works in.
const shared = Layer.mergeAll(TerminalLive, DatabaseLive(process.env.DB_PATH ?? "../my-agent.db"))

const live = Layer.mergeAll(
  ModelClientLive,
  ToolsLive,
  SessionLive(process.env.SESSION ?? "default"),
  PermissionFromFile("permissions.json"),
).pipe(Layer.provideMerge(shared))

const fail = (error: { message: string }) =>
  Effect.sync(() => {
    console.error(error.message)
    process.exitCode = 1
  })

await Effect.runPromise(
  repl.pipe(
    Effect.provide(live),
    Effect.catchTags({ ConfigError: fail, SessionCorrupt: fail }),
  ),
)
