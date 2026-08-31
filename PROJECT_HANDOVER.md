# JobOS project handover

**Updated:** September 2026
**Product:** Secure career command centre for Australian job seekers

## Architecture

- Next.js App Router with TypeScript, Tailwind CSS and Server Actions
- Supabase Auth, PostgreSQL, Row Level Security and private résumé storage
- OpenAI Responses API for résumé extraction, matching and application content
- Resend for explicitly authorised application email delivery
- Official Greenhouse and Lever feeds for opportunity ingestion
- Docker standalone deployment on Coolify

Public pages live under `src/app/(public)`. Authenticated product routes live under `src/app/app`; privileged pages live under `src/app/admin`. Keep these boundaries intact.

## Production-ready capabilities

- Email/password and Google authentication with a canonical, relative-only OAuth return path
- Server-side authentication and ownership checks on every product mutation
- Admin gate enforced in middleware and the admin layout
- Real PDF/DOCX résumé upload, private storage, faithful AI extraction and canonical résumé editing
- Career-preference onboarding and AI-generated job journeys
- Allowlisted, timeout- and size-limited Greenhouse/Lever ingestion
- Daily per-user opportunity ranking with audited and rate-limited AI runs
- Opportunity review, save/dismiss state and explicit user-authorised application delivery
- Resend idempotency, delivery-event recording, canonical résumé attachment and Reply-To handling
- Application Studio with saved résumé variants and cover letters
- Functional drag-and-drop application pipeline plus accessible stage controls
- Dashboard pipeline totals, momentum and completable follow-up tasks
- Real company directory derived from active opportunities
- Security headers, private API caching, canonical host redirect, health check, robots and sitemap
- Non-root multi-stage Docker image, lockfile and GitHub Actions release gate

## Database

Apply all migrations in filename order:

1. `00000000000000_initial_schema.sql`
2. `00000000000001_job_journeys.sql`
3. `00000000000002_onboarding.sql`
4. `00000000000003_opportunities.sql`
5. `00000000000004_production_hardening.sql`

The hardening migration reconciles profile/resume columns, formalises application and source state, adds indexes and ownership constraints, and creates RLS-protected `ai_runs` and `application_documents` tables.

## Security and privacy invariants

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY` or `CRON_SECRET` to client components.
- Never replace `auth.getUser()` with unverified session metadata for an authorisation decision.
- Treat every Server Action and Route Handler as a public endpoint: parse input, authenticate, check ownership and return only safe DTOs.
- Keep the `resumes` bucket private. Do not store résumé base64, full text, API payloads or service responses in logs.
- `AI_PROVIDER=mock` is a local-development option only and intentionally throws in production.
- Application email must remain a two-step review/authorisation flow. Do not infer consent from opening an opportunity.
- Cron endpoints require a bearer secret of at least 32 characters and the service-role client never falls back to the anon key.
- Opportunity ingestion accepts only official Greenhouse and Lever API hosts; do not weaken the SSRF allowlist to accept arbitrary career-page URLs.

## Quality gate

`npm run verify` runs ESLint with zero warnings, TypeScript and Vitest. `npm run build` must also pass before deployment. Tests cover security helpers, request validation, AI response parsing and source ingestion normalisation/allowlisting. CI runs the same gate on pull requests and `main`.

## Operational setup still required per environment

Code is complete, but production credentials and external configuration are deliberately not committed. An operator must:

- Apply migrations and create the private `resumes` bucket.
- Configure Supabase redirect URLs and Google OAuth.
- Verify the Resend sending domain with SPF, DKIM and DMARC.
- Add OpenAI, Resend, Supabase, cron and Server Action encryption secrets in Coolify.
- Insert approved Greenhouse/Lever `job_sources` rows.
- Schedule ingestion before matching and complete the smoke test in `docs/DEPLOYMENT_COOLIFY.md`.

Do not consider a deployment live until the controlled-mailbox application test and backup/restore check have passed.
