# seanw.me

A personal URL shortener: Next.js 15 on AWS Amplify, with Supabase (free tier) for the database and auth.

- `seanw.me/` is a "nothing to see here" page
- `seanw.me/<slug>` redirects to the destination
- `seanw.me/<slug>+` shows a public preview of the link (Bitly-style)
- `seanw.me/tycho` is the admin portal, and `seanw.me/tycho/sign-in` is the sign-in page. There's no sign-up.

## Features

| Bitly feature | Here |
| --- | --- |
| Short links with random or custom back-halves | ✅ Case-sensitive, 1–64 characters |
| Edit the destination after sharing | ✅ |
| Titles (fetched from the page automatically), tags and notes | ✅ |
| Search, filter by tag, sort, archive | ✅ |
| Click analytics: over time, referrers, countries, cities, devices, browsers, operating systems | ✅ Bots and link previews are filtered out |
| QR codes with custom colors, as PNG or SVG | ✅ Scans are tracked separately from clicks |
| UTM builder | ✅ |
| Link preview by adding `+` | ✅ |
| Bulk shortening | ✅ Up to 200 links at a time |
| CSV export of links and clicks | ✅ |
| Password-protected links | ✅ |
| Expiry by date or click count, with an optional fallback URL | ✅ |
| Query parameters passed through to the destination | ✅ Can be turned off per link |
| 301/302/307/308 redirect choice | ✅ The default is 302, so every click is counted |

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/migrations/20261119000000_init.sql`](supabase/migrations/20261119000000_init.sql).
3. Go to **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up".
4. Go to **Authentication → Users → Add user → Create new user**, enter your email address and a password, and check "Auto Confirm User".
5. Go to **Authentication → URL Configuration** and set the Site URL to `https://seanw.me`.
6. Copy the project URL, the anon or publishable key, and the service_role or secret key from **Project Settings → API**.

### 2. Local development

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

### 3. AWS Amplify

1. In Amplify Hosting, choose **Deploy an app**, connect this GitHub repo, and pick the `main` branch. Amplify reads `amplify.yml` and detects Next.js SSR.
2. Under **Environment variables**, add every variable from `.env.example`. The build writes the server-only ones into `.env.production`, because Amplify's SSR runtime doesn't receive console environment variables directly.
3. Under **Custom domains**, add `seanw.me` and follow the DNS steps.

> Amplify Hosting officially supports Next.js up to version 15. That's why this project uses Next 15 and `middleware.ts`.

### 4. Daily keep-alive

Supabase pauses free projects after 7 days without activity. `.github/workflows/keepalive.yml` calls `https://seanw.me/api/keepalive` once a day. That endpoint writes a row to the `heartbeat` table and deletes rows older than 90 days.

In the GitHub repo, go to **Settings → Secrets and variables → Actions** and add a `CRON_SECRET` secret with the same value as in Amplify. You can run it on demand from the **Actions** tab ("Run workflow").

> GitHub disables scheduled workflows in **public** repos after 60 days with no commits. If this repo is public, re-enable the workflow when GitHub emails you, or move the ping to AWS (EventBridge Scheduler with an API destination).

## Analytics notes

- **Location**: country, region and city come from CloudFront viewer headers on Amplify. Vercel and Cloudflare headers also work. If a host doesn't send them, location shows as "Unknown".
- **Bots**: crawlers and link unfurlers (Slack, iMessage, X and others) are logged but excluded from counts and from click limits.
- **301 links**: browsers cache permanent redirects, so repeat visits from the same browser aren't counted.

## Project layout

```
src/app/[slug]/route.ts        redirect hot path (one Supabase RPC: resolve_link)
src/app/info/[slug]            "+" preview page
src/app/unlock/[slug]          password prompt
src/app/gone                   missing/expired page
src/app/api/keepalive          daily heartbeat
src/app/tycho/sign-in          sign-in
src/app/tycho/(admin)          dashboard, links, link detail, bulk create
src/middleware.ts              Supabase session refresh and auth gate for /tycho
supabase/migrations            schema, RLS, and the resolve_link and link_stats functions
```
