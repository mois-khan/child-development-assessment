import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sqlScript = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/0001_core.sql'), 'utf-8');

const sql = postgres('postgresql://postgres.xragqqjmctpwgvyqxjet:KGKP-Genius2026@aws-0-ap-south-1.pooler.supabase.com:6543/postgres', {
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Running migration...');
    // postgres.js doesn't natively support running a large multi-statement file in one simple call easily 
    // unless you use the sql.unsafe method.
    await sql.unsafe(sqlScript);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}
main();
