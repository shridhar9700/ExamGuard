/**
 * Locks down the `public` schema for Supabase.
 *
 *   npm run db:secure
 *
 * Supabase exposes the `public` schema through its Data API (PostgREST) to the
 * `anon` and `authenticated` roles. Prisma creates tables as `postgres` without
 * RLS, which means the publishable key can read/write all app data. This app
 * talks to Postgres directly through Prisma (as the table owner), so the Data
 * API is not needed.
 *
 * This script is idempotent and:
 *   1. Enables Row Level Security on every table in `public`.
 *   2. Revokes table/sequence privileges from `anon` and `authenticated`.
 *   3. Revokes default privileges so future Prisma tables are not exposed.
 *
 * `postgres` and `service_role` keep full access (both bypass RLS).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROTECTED_ROLES = ['anon', 'authenticated'];

async function main() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  if (tables.length === 0) {
    throw new Error('No tables found in the public schema. Run `npm run db:push` first.');
  }

  console.log(`\nSecuring ${tables.length} table(s) in the public schema...\n`);

  for (const { table_name } of tables) {
    const table = `"public"."${table_name.replace(/"/g, '""')}"`;

    await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);

    for (const role of PROTECTED_ROLES) {
      await prisma.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON TABLE ${table} FROM "${role}"`);
    }

    console.log(`  locked ${table_name}`);
  }

  for (const role of PROTECTED_ROLES) {
    await prisma.$executeRawUnsafe(
      `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM "${role}"`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM "${role}"`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM "${role}"`,
    );
  }

  const rls = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  console.log('\nRLS status:');
  for (const row of rls) {
    console.log(`  ${row.tablename.padEnd(20)} ${row.rowsecurity ? 'enabled' : 'DISABLED'}`);
  }

  if (rls.some((row) => !row.rowsecurity)) {
    throw new Error('Some tables still have RLS disabled.');
  }

  console.log('\nDone. The public Data API can no longer read app tables.\n');
}

main()
  .catch((error) => {
    console.error('\nSecurity lockdown failed:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
