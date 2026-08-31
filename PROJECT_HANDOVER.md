# JobOS Project Handover & Status Report

**Date:** August 2026
**Project:** JobOS - AI-powered career command centre

This document serves as a technical handover for the next AI product engineer working on the JobOS codebase. 

---

## 1. Architecture & Tech Stack
- **Framework:** Next.js (App Router, Turbopack)
- **Styling:** Tailwind CSS, Lucide Icons, Framer Motion
- **Database & Auth:** Supabase (PostgreSQL, SSR Auth, Storage Buckets, Row Level Security)
- **Deployment:** Coolify (Dockerized Node.js environment)
- **Routing Pattern:** Public marketing pages are isolated in the `src/app/(public)` route group. Authenticated pages are in `src/app/app` wrapped by the `DashboardShell` server component.

---

## 2. What Has Been Completed (The "Done")

### Phase 1: Authentication & Onboarding
- **Secure Auth:** Migrated login/signup forms to Next.js Server Actions to prevent credential leakage. Fixed Google OAuth callback resolution for reverse proxies (Coolify/Cloudflare) using `X-Forwarded-Host` headers in `src/app/auth/callback/route.ts`.
- **Dashboard Shell:** Implemented a responsive sidebar layout (`DashboardShell.tsx`). Fixed sign-out logic and injected the user's email into the top right header.
- **Onboarding State Machine:** Built a secure middleware (`src/utils/supabase/middleware.ts`) that intercepts new users and forces them through an interactive onboarding flow (`/app/onboarding`) to upload a résumé, parse skills, and set career preferences.
- **Today Dashboard:** The `/app` landing page queries real Supabase data to show a time-sensitive greeting, live Momentum action counters, Pipeline stats, and upcoming Action Plan tasks.
- **Map View:** Built a split-screen Google Maps integration placeholder at `/app/companies`.

### Phase 2: AI Opportunity Discovery
- **Inbox-Style UI:** Built `/app/opportunities` with a two-column desktop split view and mobile bottom-sheet design. Includes tabs for "For You", "Saved", "Applied", and "Dismissed".
- **AI Ranking & Context:** Opportunities display match categories (e.g., "Strong Match") with verified AI reasoning ("Why JobOS Selected This") and skill gap analysis.
- **Background Matching Engine:** Created a cron-compatible endpoint (`/api/cron/match`) protected by `CRON_SECRET`. It bypasses RLS using the Service Role to match the daily batch of up to 10 jobs per user.
- **Apply with JobOS Flow:** A fully integrated application state machine that drafts a contextual cover email, requires a user authorisation checkbox, and upon submission, automatically syncs the job to the user's Pipeline, increments Momentum, and creates a 5-day follow-up task.
- **AI Abstraction:** Abstracted AI generation into `src/utils/ai/provider.ts`. Currently uses a robust `MockAIProvider` with simulated delays to build out the UI without burning API credits.

### Database Schema & Migrations
The following migrations exist in `supabase/migrations/`:
1. `00000000000001_job_journeys.sql`: Node-based roadmap schemas.
2. `00000000000002_onboarding.sql`: `profiles`, `resumes` (with private Storage Buckets), `career_preferences`, `user_tasks`, `job_applications`.
3. `00000000000003_opportunities.sql`: `job_sources`, `job_opportunities`, `user_opportunity_matches`, `application_delivery_events`.
*All tables have strict Row Level Security (RLS) policies binding data to `auth.uid()`.*

---

## 3. What Is The Balance (Remaining Work)

### Phase 3: Real AI & Email Integration
1. **Swap Mock AI:** Replace `MockAIProvider` in `src/utils/ai/provider.ts` with a real LLM integration (e.g., OpenAI, Anthropic, or Gemini API) to parse real PDFs and generate actual matching logic.
2. **Transactional Email:** The `confirmApplication` server action in `src/app/actions/opportunities.ts` currently mocks email sending. Integrate a real provider (Resend, SendGrid, Amazon SES) to dispatch the outbound `Apply with JobOS` emails.
3. **DNS Setup:** Configure SPF, DKIM, and DMARC on the JobOS sending domain to ensure application emails don't bounce.

### Phase 4: Job Ingestion Engine
- **Webhooks / API Fetching:** The `cron/match` endpoint currently creates a dummy job if the DB is empty. The next agent needs to build the actual ingestion workers that safely fetch JSON-LD or API feeds from Greenhouse, Lever, or official career pages to populate the global `job_opportunities` table.

### Phase 5: Pipeline & Application Studio UIs
- **Kanban Board:** The `/app/pipeline` route needs to be built into a functional drag-and-drop Kanban board reading from the `job_applications` table.
- **Document Editors:** `/app/application-studio` and `/app/resume` need rich text editors allowing users to tailor their cover letters and résumés before applying.

### Operations / Deployment Checklist
- [ ] Run `00000000000002_onboarding.sql` in the production Supabase SQL editor.
- [ ] Run `00000000000003_opportunities.sql` in the production Supabase SQL editor.
- [ ] Add `CRON_SECRET` to Coolify environment variables.
- [ ] Configure a daily Coolify Scheduled Task to hit `https://jobos.com.au/api/cron/match` with the `Authorization: Bearer <CRON_SECRET>` header.

---

## 4. Instructions for the Next AI Agent
When you read this file, you are ready to begin Phase 3. 
1. **Do not** change the Next.js App Router layout grouping (`(public)` vs `app`) as it intentionally isolates marketing from the dashboard.
2. **Do not** bypass RLS policies; always use `auth.getUser()` server-side to fetch data.
3. Prioritise building the real Kanban Pipeline or swapping the `MockAIProvider` for a real LLM next.
