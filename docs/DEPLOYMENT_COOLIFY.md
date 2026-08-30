# Hostinger Coolify Deployment Guide

This document outlines the repeatable deployment process for JobOS on a Hostinger VPS using Coolify, targeting a production-ready Next.js Docker standalone build.

## 1. Supabase Project Setup
- Create a new Supabase project for production.
- Under **SQL Editor**, run the contents of `supabase/migrations/00000000000000_initial_schema.sql` to establish the schema. Note: **Do not** run destructive migrations automatically on container startup.

## 2. Auth Redirect URLs
In the Supabase Dashboard (Authentication -> URL Configuration):
- **Site URL**: `https://jobos.com.au`
- **Redirect URIs**: 
  - `http://localhost:3000/**` (Local)
  - `https://jobos.com.au/**` (Production)
  - `https://www.jobos.com.au/**` (Production WWW)

## 3. Storage Buckets & Policies
In the Supabase Dashboard (Storage):
- Create a **private** bucket named `resumes`.
- Create a **public** bucket named `public_assets` for CMS imagery.
- Ensure Row Level Security (RLS) restricts `resumes` access so users can only read/write their own UID folder.

## 4. Environment Variables
In Coolify, navigate to your resource's **Environment Variables** tab and add:
- `NEXT_PUBLIC_APP_URL` = `https://jobos.com.au`
- `NEXT_PUBLIC_SUPABASE_URL` = (From Supabase API settings)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (From Supabase API settings)
- `SUPABASE_SERVICE_ROLE_KEY` = (Server-only secret for admin actions)
- `CRON_SECRET` = (Generate a secure random string)

## 5. Docker Deployment Settings
In Coolify:
- Source: GitHub Repository (`srikanthrajgir/jobos`)
- Build Pack: `Docker` (Coolify will automatically detect the multi-stage `Dockerfile`)
- Port: `3000` (Matches `EXPOSE 3000` in the Dockerfile)
- Install Command / Build Command: Handled inside the Dockerfile.

## 6. Health-Check Path
- In the Coolify deployment health checks, point the HTTP health check to `/api/health`.
- This endpoint safely verifies both the Node.js web process and the Supabase database connectivity without leaking credentials.

## 7. Domain Configuration
In your Hostinger DNS panel (or Cloudflare):
- Point `@` (A Record) to your Hostinger VPS IP address.
- Point `www` (A Record or CNAME) to your Hostinger VPS IP address.
- In Coolify, add `https://jobos.com.au` and `https://www.jobos.com.au` to the application's Domains section.

## 8. HTTPS / SSL
- Enable **Auto SSL / Let's Encrypt** toggle inside the Coolify Domain settings. Coolify will automatically provision and renew the certificates.

## 9. Canonical Host Redirect
- Pick `https://jobos.com.au` as the canonical URL. 
- In Coolify or Next.js `next.config.ts`, ensure `www` requests are redirected via a 308 permanent redirect to the bare domain to avoid SEO duplicate content penalties.

## 10. Database Migrations
- **Safe Execution:** Do *not* run migrations automatically via Docker `CMD`.
- Execute them manually via the Supabase SQL editor or through a secure CI/CD pipeline using the Supabase CLI (`supabase db push`) after verifying non-destructive changes.

## 11. Scheduled Jobs (Cron)
- In Coolify, under the "Scheduled Tasks" or "Cron Jobs" section, you can hit internal API endpoints (e.g., `/api/cron/publish`) passing your `CRON_SECRET` as an Authorization header to trigger automated tasks.

## 12. Logs & Diagnostics
- If the deployment fails, go to the Coolify **Deployments** tab and click the specific commit to view the Docker build stream.
- For runtime errors, navigate to the **Logs** tab in Coolify to view structured stdout/stderr logs from the Node.js process.

## 13. Backups & Restores
- **Database:** Supabase automatically handles daily backups. Go to Database -> Backups in Supabase to restore.
- **Application:** Since the app is completely stateless Docker containers, simply pressing "Deploy" in Coolify on an older commit instantly rolls back the frontend/backend process.

## 14. Zero-Downtime Updates
- Coolify supports rolling updates by default. It will spin up the new container, wait for the `/api/health` check to pass, modify the proxy (Traefik/Caddy) to route traffic to the new container, and then safely tear down the old one.
