# JobOS

JobOS is a secure career command centre for Australian job seekers. It combines verified opportunity ingestion, evidence-based AI matching, résumé management, tailored application documents, user-authorised email delivery, a Kanban application pipeline and follow-up tasks.

## Local development

1. Copy `.env.example` to `.env.local` and provide a development Supabase project. `AI_PROVIDER=mock` is supported only outside production.
2. Install dependencies with `npm ci`.
3. Apply all SQL files in `supabase/migrations` in filename order.
4. Start the app with `npm run dev`.

Before opening a pull request, run `npm run verify` and `npm run build`.

## Production

The repository includes a standalone, non-root Docker image and GitHub Actions verification for every pull request and push to `main`. Follow `docs/DEPLOYMENT_COOLIFY.md` for Supabase, Resend, OpenAI, cron, health-check and rollback configuration.

Sensitive résumé files are kept in a private Supabase bucket. Server actions and route handlers re-authenticate users, privileged clients remain server-only, and cron endpoints fail closed unless a strong bearer secret is supplied.
