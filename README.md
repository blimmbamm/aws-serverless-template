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

- Node.js 22+
- AWS CLI configured (`aws configure` or env credentials)
- Sufficient IAM rights for CloudFormation / Lambda / S3 / CloudFront / Cognito / API Gateway / IAM (for first-time setup)
- A GitHub repository (for CI)

## New project from this template

Greenfield checklist. The **first** AWS deploy and the GitHub↔AWS trust setup are always done with your own credentials (CLI/Console). CI cannot create its own OIDC role.

### 1. Create the Git repo

1. Use this repo as a GitHub template / fork / copy.
2. Push to a **new** empty GitHub repository (note `OWNER/REPO` — you need it for the IAM trust policy).

### 2. Align region (important)

This template’s CI deploy is pinned to **`us-east-1`** in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Pick one region and keep it consistent:

- AWS CLI default region **or** `AWS_REGION` / `CDK_DEFAULT_REGION`
- Both workflow files
- Later: account/region ARNs in [`infra/iam/github-actions-deploy-policy.json`](infra/iam/github-actions-deploy-policy.json)

If you skip this, you can accidentally create a second stack in another region.

Optional renames: stack id in [`infra/bin/app.ts`](infra/bin/app.ts) (`ServerlessTemplateStack`), IAM role/policy names — then update the deploy policy resources to match.

### 3. Install and bootstrap CDK (once per account/region)

```bash
npm install
npm run bootstrap   # creates CDKToolkit (staging bucket, CDK roles, …)
```

### 4. First app deploy (local CLI)

```bash
npm run deploy
```

Takes a few minutes (CloudFront). Note the `CloudFrontUrl` output. Create a user via **Sign in → Create an account** (Cognito email verification).

### 5. GitHub Actions → AWS (OIDC), once per AWS account + repo

These are **not** part of the app stack (on purpose). Documented artifacts live under [`infra/iam/`](infra/iam/).

1. **OIDC identity provider** (skip if it already exists in this account)  
   IAM → Identity providers → Add provider → OpenID Connect  
   - URL: `https://token.actions.githubusercontent.com`  
   - Audience: `sts.amazonaws.com`

2. **IAM role** for Actions (e.g. `github-actions-serverless-template`)  
   - Trusted entity: Web identity → that provider  
   - GitHub “organization” = your **user or org** (`OWNER`), repository = `REPO`, branch = `main`  
   - After create, edit **Trust relationships** so `sub` allows GitHub’s ID-suffixed claims, e.g.  
     `repo:OWNER*/REPO*:ref:refs/heads/main`  
     (exact `repo:OWNER/REPO:ref:refs/heads/main` often fails because GitHub sends `OWNER@id/REPO@id`)

3. **Permissions** on that role  
   - Fast path: attach `AdministratorAccess`, confirm CI works, then tighten.  
   - Recommended: create customer policy from [`infra/iam/github-actions-deploy-policy.json`](infra/iam/github-actions-deploy-policy.json) (replace account id `228686241906` and region/`cdk-hnb659fds-…` ARNs with yours — see [`infra/iam/README.md`](infra/iam/README.md)).

4. **GitHub secret**  
   Repo → Settings → Secrets and variables → Actions:  
   - Name: `AWS_DEPLOY_ROLE_ARN`  
   - Value: the role ARN

5. Push to `main` (or **Actions → Deploy → Run workflow**). CI should assume the role and deploy.

Local `npm run deploy` keeps working alongside CI.

### 6. Local development (optional)

1. `npm run dev:api` — origin secret `dev-origin-secret`, `Authorization: Bearer dev` for `/api/me` when Cognito env is unset  
2. `npm run dev:web` — `public/config.json` with `devAuth: true`  
3. After a cloud deploy, copy Cognito IDs from stack outputs into `apps/web/public/config.json` and a root `.env` (see [`.env.example`](.env.example)) for real JWTs locally

### Useful commands

| Command | Purpose |
|---|---|
| `npm run deploy` | Build web + deploy stack |
| `npm run diff` | Show infra changes vs AWS |
| `npm run destroy` | Tear down the app stack |
| `npm run bootstrap` | CDK bootstrap (`CDKToolkit`) |
| `npm run dev:api` | Local Express on `:3000` |
| `npm run dev:web` | Local Angular on `:4200` (proxies `/api`) |

## Architecture recap

### Security model

1. **Origin secret** — CloudFront sends `x-origin-verify`; Lambda rejects requests without it. Protects direct API Gateway/Lambda access.
2. **User JWT** — Cognito ID tokens for protected routes (`/app`, `/api/me`).
3. Public `/api/*` via your CloudFront domain remains callable (same as any public website API).

### Optional database (Neon)

See [packages/db/README.md](packages/db/README.md). Leave `DATABASE_URL` empty to keep in-memory dummy items.

### Repo layout

```text
apps/api      Express + serverless-http
apps/web      Angular SPA
infra         AWS CDK app stack + iam/ docs for GHA role
packages/db   Optional Prisma/Neon stub
```

## CI / CD (GitHub Actions)

| Workflow | When | What |
|---|---|---|
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | PRs + pushes (except `main`) | `npm ci`, build, `cdk synth` (no AWS creds) |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Push to `main` + manual dispatch | OIDC → `npm run deploy` |

`synth` only builds the CloudFormation template locally; it does not compare against the live stack (`diff` / `deploy` do).

Chicken-and-egg: bootstrap + OIDC role must exist **before** the first CI deploy. Details: [New project from this template](#new-project-from-this-template) and [`infra/iam/README.md`](infra/iam/README.md).
