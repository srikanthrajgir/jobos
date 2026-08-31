# JobOS production runbook: Coolify

JobOS ships as a standalone Next.js container running as an unprivileged user. Database migrations are deliberately separate from container startup so a web deployment cannot mutate production data unexpectedly.

## 1. Pre-deployment gate

Run locally or rely on the `CI` workflow on `main`:

```text
npm ci
npm run verify
npm run build
```

Do not deploy a revision with a failed check.

## 2. Supabase

Create a dedicated production project, then apply every file in `supabase/migrations` in filename order (`00000000000000` through `00000000000004`). Migration 4 safely reconciles installations where earlier `CREATE TABLE IF NOT EXISTS` statements left profile or résumé columns absent.

Create a private Storage bucket named `resumes`. Do not make this bucket public. The application writes objects under each authenticated user's ID and stores only the private object path.

In Authentication → URL Configuration, set:

- Site URL: `https://jobos.com.au`
- Allowed redirect URLs: `https://jobos.com.au/auth/callback` and the local callback used for development
- Add `https://www.jobos.com.au/auth/callback` only during DNS migration; production application links are canonicalised to the bare domain

Enable Google OAuth only after its client secret and exact callback URI are configured. Keep email confirmation enabled for public sign-up.

## 3. Email identity

Verify `jobos.com.au` or a dedicated sending subdomain in Resend. Publish its SPF and DKIM records and add a DMARC policy before enabling application delivery. Use a stable sender such as `JobOS Applications <applications@jobos.com.au>`; the candidate's address is set as Reply-To, never forged as From.

## 4. Coolify environment

Set these as runtime secrets. Variables beginning with `NEXT_PUBLIC_` are intentionally browser-visible; all others must remain server-only.

```text
NEXT_PUBLIC_APP_URL=https://jobos.com.au
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-terra
OPENAI_BASE_URL=https://api.openai.com/v1
RESEND_API_KEY=...
APPLICATION_FROM_EMAIL=JobOS Applications <applications@jobos.com.au>
CRON_SECRET=<at least 32 cryptographically random characters>
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<one stable 32-byte base64 value shared by all replicas>
```

Do not set `AI_PROVIDER=mock` in production; the application rejects it. Rotate the service-role, OpenAI, Resend and cron secrets if any value reaches logs or source control.

## 5. Application resource

- Source: this Git repository, branch `main`
- Build pack: Dockerfile
- Internal port: `3000`
- Health check: `GET /api/health`
- Domain: `https://jobos.com.au`
- Optional alias: `https://www.jobos.com.au` (the app returns a permanent redirect)
- TLS: Coolify-managed Let's Encrypt certificate

Point the apex and `www` DNS records to the proxy, then wait for TLS to be valid before enabling the production hostname. The image includes its own health check and does not run as root.

## 6. Opportunity sources

Create enabled rows in `job_sources` only for official public APIs:

- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/<board-token>/jobs`
- Lever: `https://api.lever.co/v0/postings/<site>` (or the official EU host)

The ingestion worker rejects non-HTTPS URLs, credentials, redirects and hosts outside this allowlist. It caps response size and execution time.

## 7. Scheduled jobs

Configure Coolify scheduled HTTP jobs with `Authorization: Bearer <CRON_SECRET>`:

- `POST https://jobos.com.au/api/cron/ingest` every 4–6 hours
- `POST https://jobos.com.au/api/cron/match` once daily after ingestion

Both endpoints fail closed when the secret is missing, short or incorrect. Watch the first runs and confirm source counts, per-user match counts and `ai_runs` audit records.

## 8. Release and rollback

Before promoting a release:

- Confirm all five migrations are present in production.
- Upload and edit a résumé with a test account.
- Run one approved source ingestion and verify the opportunity URL opens on the official employer site.
- Generate a fit analysis and application draft.
- Send one application to a controlled mailbox; verify attachment, Reply-To, delivery event and pipeline task.
- Confirm an ordinary account receives `403`/redirect protection for `/admin`.
- Confirm `/api/health` is healthy and cron requests without the bearer secret receive `401`.

For rollback, redeploy the last known-good Git revision. Database changes in migration 4 are additive; do not automatically reverse them. Restore data through the Supabase backup/PITR facility configured for the production plan, and test restoration periodically.
