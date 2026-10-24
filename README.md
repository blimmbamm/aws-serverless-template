# AWS Serverless Template

Fullstack starter: **Angular** + **Express on Lambda** (`serverless-http`), **CloudFront**, **API Gateway HTTP API**, **Cognito**, all wired with **AWS CDK**.

Deploy from day one via CLI. Local dev still works; production is the default path.

## Architecture

```text
Browser → CloudFront
            ├─ /*      → S3 (Angular SPA)
            └─ /api/*  → API Gateway → Lambda (Express)
                           + x-origin-verify header (origin lock)
Auth: Cognito (SRP) → JWT on /api/me
DB: optional (Neon / Postgres via DATABASE_URL) — default is in-memory dummy data
```

## Prerequisites

- Node.js 20+
- AWS CLI configured (`aws configure` or env credentials)
- Sufficient IAM rights for CloudFormation / Lambda / S3 / CloudFront / Cognito / API Gateway

Region defaults to your AWS CLI region (`CDK_DEFAULT_REGION` / `AWS_REGION`), otherwise `eu-central-1`.

## Quick start (CLI deploy)

```bash
npm install
npm run bootstrap   # once per account/region (CDK bootstrap)
npm run deploy      # builds Angular, then cdk deploy
```

First deploy can take several minutes (CloudFront). CDK prints `CloudFrontUrl` when done — open that URL.

Create a user via **Sign in → Create an account** (Cognito email verification).

### Useful commands

| Command | Purpose |
|---|---|
| `npm run deploy` | Build web + deploy stack |
| `npm run diff` | Show infra changes |
| `npm run destroy` | Tear down the stack |
| `npm run dev:api` | Local Express on `:3000` |
| `npm run dev:web` | Local Angular on `:4200` (proxies `/api`) |

### Local development

1. `npm run dev:api` — origin secret `dev-origin-secret`, `Authorization: Bearer dev` for `/api/me`
2. `npm run dev:web` — uses `public/config.json` with `devAuth: true`

After a cloud deploy, you can copy Cognito IDs from stack outputs into `apps/web/public/config.json` and into a root `.env` (see `.env.example`) to exercise real JWT locally.

## Security model

1. **Origin secret** — CloudFront sends `x-origin-verify`; Lambda rejects requests without it. Protects direct API Gateway/Lambda access.
2. **User JWT** — Cognito ID tokens for protected routes (`/app`, `/api/me`).
3. Public `/api/*` via your CloudFront domain remains callable (same as any public website API).

## Optional database (Neon)

See [packages/db/README.md](packages/db/README.md). Leave `DATABASE_URL` empty to keep in-memory dummy items.

## Repo layout

```text
apps/api      Express + serverless-http
apps/web      Angular SPA
infra         AWS CDK stack
packages/db   Optional Prisma/Neon stub
```

## CI later

Deploy is CLI-first (`npm run deploy`). A GitHub Actions workflow can call the same command later (OIDC → IAM role recommended).
