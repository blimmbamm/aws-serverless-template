/**
 * Optional database access.
 *
 * Default: no DB — handlers use in-memory dummy data.
 * To enable Neon (or any Postgres):
 *   1. Set DATABASE_URL in the Lambda env / local .env
 *   2. npm install prisma @prisma/client -w @app/db (see packages/db)
 *   3. Replace getDb() with a PrismaClient singleton
 */
export type DbClient = {
  enabled: boolean;
};

export function getDb(): DbClient {
  const url = process.env.DATABASE_URL?.trim();
  return { enabled: Boolean(url) };
}
