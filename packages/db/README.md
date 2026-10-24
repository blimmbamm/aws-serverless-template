# Optional database (`@app/db`)

The template runs **without** a database. Dummy API data lives in `apps/api/src/data`.

## Enable Neon (or any Postgres)

1. Create a Neon project and copy the connection string.
2. From the repo root:

```bash
npm install prisma @prisma/client -w @app/db
cd packages/db
npx prisma init
```

3. Set `DATABASE_URL` in Lambda (CDK env) and locally in `.env`.
4. Define models in `schema.prisma`, migrate, then use Prisma from `apps/api` instead of in-memory data.

Swap providers later by changing only `DATABASE_URL`.
