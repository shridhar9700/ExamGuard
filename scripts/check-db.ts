/**
 * Verifies the Supabase connection used by the app.
 *
 *   npm run db:check
 *
 * Checks:
 *   1. Prisma can reach the Supabase Postgres pooler.
 *   2. Which public tables exist (run `npm run db:push` if this is empty).
 *   3. The Supabase Auth service answers with the configured project URL + key.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function line(label: string, value: string) {
  console.log(`  ${label.padEnd(18)} ${value}`);
}

async function checkDatabase() {
  console.log('\n[1/2] PostgreSQL (Prisma -> Supabase pooler)');

  const versionRows = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
  line('Connection', 'OK');
  line('Server', versionRows[0]?.version?.split(',')[0] ?? 'unknown');

  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  if (tables.length === 0) {
    line('Public tables', 'none - run `npm run db:push` then `npm run db:seed`');
  } else {
    line('Public tables', tables.map((t) => t.table_name).join(', '));
  }
}

async function checkSupabaseApi() {
  console.log('\n[2/2] Supabase Auth API');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    line('Configuration', 'skipped (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set)');
    return;
  }

  const response = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: key },
  });

  line('Endpoint', `${url}/auth/v1/health`);
  line('Status', `${response.status} ${response.statusText}`);
  if (!response.ok) {
    throw new Error(`Supabase Auth health check failed with HTTP ${response.status}`);
  }
}

async function main() {
  await checkDatabase();
  await checkSupabaseApi();
  console.log('\nAll checks passed.\n');
}

main()
  .catch((error) => {
    console.error('\nConnection check failed:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
