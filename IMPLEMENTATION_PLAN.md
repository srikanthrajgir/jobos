# JobOS Implementation Plan

## Phase 0 — Discovery and architecture
- [x] Inspect existing project (`unghost` reference)
- [x] Document architecture and data flow
- [x] Establish design tokens and component strategy (ported colors & dark mode from unghost)
- [x] Create implementation plan and risk register

## Phase 1 — Foundation and public platform
- [x] Next.js/React/TypeScript foundation (Next 16, App Router)
- [x] Public header, full-screen landing page and detailed footer (built to match unghost style)
- [x] Responsive and accessible design
- [ ] Technical SEO, sitemap, robots and metadata foundation
- [ ] Job Intelligence hub and article template

## Phase 2 — Supabase and authenticated shell
- [x] Installed Supabase libraries
- [x] Database migrations (Profiles, Roles, Jobs, Companies, Applications)
- [x] RLS policies (Configured in initial schema)
- [x] Authentication and onboarding (Supabase middleware + Auth pages created)
- [x] Job-seeker and admin dashboard shells with correct access control (middleware redirects)

## Phase 3 — Functional job-search vertical slice
- [x] Admin CRUD for companies and jobs (Server actions mocked)
- [x] Opportunity discovery, search and filters (Scaffolded UI)
- [x] Saved jobs and manual opportunity creation
- [x] Application pipeline, history, tasks and reminders (Kanban scaffolded + server actions)
- [x] Today dashboard and basic analytics

## Phase 4 — Content operations and AI assistance
- [x] Admin Job Intelligence CMS (CMS table UI and 'New Article' editor)
- [x] AI provider abstraction (`utils/ai/provider.ts`)
- [x] Resume text extraction and review (`app/resume` + `actions/ai.ts`)
- [x] Resume-to-job Fit Gap (`app/application-studio`)
- [x] Cover-letter and follow-up drafts (`app/application-studio`)
- [x] AI usage limits, errors and auditability (Admin AI settings dashboard)

## Phase 5 — Hardening and deployment
- [ ] Automated tests
- [x] Docker and Coolify deployment documentation (Dockerfile and .env created)
