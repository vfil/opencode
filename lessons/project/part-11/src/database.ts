import { SqliteClient } from "@effect/sql-sqlite-bun"
import * as SQLiteBunDrizzle from "drizzle-orm/effect-sqlite-bun"
import { migrate } from "drizzle-orm/effect-sqlite-bun/migrator"
import { Context, Effect, Layer } from "effect"

const migrationsFolder = new URL("../drizzle", import.meta.url).pathname

// Opens the database and brings its tables up to date.
const open = Effect.gen(function* () {
  const db = yield* SQLiteBunDrizzle.makeWithDefaults()
  yield* migrate(db, { migrationsFolder })
  return db
})

// The SQLite file, as a service, so the session and the saved approvals can share one connection.
export class Database extends Context.Service<Database, Effect.Success<typeof open>>()("@agent/Database") {}

// Building the layer opens the file and applies the migrations; the end of the program closes it.
// A disk failure is a defect, not something the agent can handle.
export const DatabaseLive = (path: string) =>
  Layer.effect(Database, open.pipe(Effect.orDie)).pipe(Layer.provide(SqliteClient.layer({ filename: path }).pipe(Layer.orDie)))
