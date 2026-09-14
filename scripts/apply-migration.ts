/**
 * Applies one migration file to the database.
 *
 *   npx tsx scripts/apply-migration.ts 0016_analytics_engine.sql
 *
 * Needs SUPABASE_DB_URL in .env.local — the Postgres connection string from
 * Supabase (Project Settings → Database → Connection string → URI). That is
 * a superuser credential, so it lives in .env.local, which is gitignored,
 * and never in this file. It used to be hardcoded here; see git history, and
 * assume that old password is public.
 */
import postgres from "postgres";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase/migrations");

function fail(message: string): never {
  console.error("\n" + message + "\n");
  process.exit(1);
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  fail(
    "SUPABASE_DB_URL is not set.\n\n" +
      "Add it to .env.local:\n" +
      "  SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:6543/postgres\n\n" +
      "Find it in Supabase under Project Settings → Database → Connection string → URI."
  );
}

const fileArg = process.argv[2];
if (!fileArg) {
  const available = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()
    : [];
  fail(
    "Which migration?\n\n" +
      "  npx tsx scripts/apply-migration.ts <file.sql>\n\n" +
      (available.length ? "Available:\n" + available.map((f) => "  " + f).join("\n") : "")
  );
}

// Resolve and then confirm the result is still inside the migrations
// directory, so a path like ../../secrets.sql can't be read through this.
const filePath = path.resolve(MIGRATIONS_DIR, fileArg);
if (path.dirname(filePath) !== MIGRATIONS_DIR) {
  fail(`Refusing to read outside supabase/migrations: ${fileArg}`);
}
if (!fs.existsSync(filePath)) {
  fail(`No such migration: ${path.basename(filePath)}`);
}

const sqlScript = fs.readFileSync(filePath, "utf-8");
const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

async function main() {
  const name = path.basename(filePath);
  try {
    console.log(`Applying ${name}…`);
    // postgres.js runs a multi-statement file only through unsafe(); the file
    // is read off disk from a fixed directory, never from user input.
    await sql.unsafe(sqlScript);
    console.log(`Applied ${name}.`);
  } catch (error) {
    // Exit non-zero: this used to log and return 0, so a failed migration
    // was indistinguishable from a successful one to anything downstream.
    console.error(`Failed to apply ${name}:`, error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
