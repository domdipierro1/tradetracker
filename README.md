# TradeTracker '26 — Setup Guide

A full-featured trading journal that syncs across all your devices via Supabase.

## What you'll have when done

- A live URL like `tradetracker.vercel.app` you can open on **any device**
- Phone and laptop **always in sync** — log a trade on one, it instantly appears on the other
- Free forever (uses free tiers of Supabase + Vercel)
- Works offline once loaded
- Installable as an app on your phone home screen

---

## Setup steps

You'll need three free accounts: **GitHub**, **Supabase**, **Vercel**. Total time: ~15 minutes.

### Step 1 — Create your Supabase database (5 min)

1. Go to **[supabase.com](https://supabase.com)** and create a free account
2. Click **"New project"**
   - Name: `tradetracker`
   - Database password: pick a strong one and save it
   - Region: pick whichever is closest to you
3. Wait ~2 minutes for it to provision
4. In the left sidebar click **SQL Editor** → **New query**
5. Open the `supabase_schema.sql` file from this project
6. Copy the entire contents and paste into the SQL editor
7. Click **Run** (bottom right). You should see "Success"
8. Now go to **Settings → API** in the sidebar
9. Copy these two values somewhere — you'll need them:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

### Step 2 — Put the code on GitHub (3 min)

1. Go to **[github.com](https://github.com)** and create a free account
2. Click **"New repository"**
   - Name: `tradetracker`
   - **Public** (it has to be public for Vercel free tier)
   - Click "Create repository"
3. On your computer, unzip this project folder
4. Upload everything to the GitHub repo. Easiest way:
   - Click **"uploading an existing file"** on the empty repo page
   - Drag in everything from the unzipped folder
   - Commit

### Step 3 — Deploy with Vercel (3 min)

1. Go to **[vercel.com](https://vercel.com)** and sign in **with your GitHub account**
2. Click **"Add New… → Project"**
3. Find your `tradetracker` repo and click **"Import"**
4. Before clicking Deploy, expand **"Environment Variables"**, add **two** variables:
   - Name: `REACT_APP_SUPABASE_URL`  Value: *(your Supabase Project URL from step 1.9)*
   - Name: `REACT_APP_SUPABASE_ANON_KEY`  Value: *(your Supabase anon key)*
5. Click **Deploy**
6. Wait ~2 minutes. You'll get a URL like `tradetracker-xyz.vercel.app`

### Step 4 — Sign up and start logging trades

1. Open your new URL on your laptop
2. Click **"Sign up free"** and create your account using your email
3. Confirm via email link (Supabase sends one)
4. Log back in — you're done!
5. On your phone: open the same URL, sign in with the same email/password
6. Optional: tap the share/menu icon → **"Add to Home Screen"** to install it as an app

---

## Setting up "Add to Home Screen"

**iPhone (Safari):**
- Open the URL → tap the share button → "Add to Home Screen"

**Android (Chrome):**
- Open the URL → menu → "Install app" or "Add to Home Screen"

It will now open like a native app, fullscreen, no browser bar.

---

## Importing your existing trades

If you've been using the HTML version of TradeTracker:

1. In the HTML version, click **Export** → it downloads a JSON file
2. In this version, click **Import** in the sidebar/topbar → select that file
3. All your trades will be uploaded to your account

---

## How updates work

Whenever I (or you) push code changes to GitHub, Vercel automatically rebuilds and redeploys. No manual steps needed.

---

## Costs

- **Supabase free tier**: 500MB database, 50,000 monthly active users — vastly more than you'll ever use
- **Vercel free tier**: unlimited personal projects, 100GB bandwidth/month
- **Total: $0/month forever** for personal use

---

## Troubleshooting

**"Invalid API key" on login** → Double-check your env variables in Vercel. They must start with `REACT_APP_` exactly.

**Build fails on Vercel** → Check the build logs. Usually a missing env variable.

**Email confirmation not received** → Check spam. Or in Supabase: Authentication → Providers → Email → toggle off "Confirm email" if you don't want this step.

**Data not syncing** → Open the browser console (F12). Errors will tell you what's wrong. Most often it's the SQL schema not being run, or env vars not set on Vercel.

---

## What's inside

- `📊 Dashboard` — 14 KPIs, 6 charts, equity curve, rolling win rate, streak tracker, grade & mistake analysis
- `📝 Trade Log` — full edit/delete/filter/sort/search with a card view on mobile and table on desktop
- `📅 Calendar` — Tradezella-style calendar, click any day for a detail modal showing all trades
- `🔬 Analysis` — best setup combinations, breakdown tables with data bars, time-of-day heatmap
- `📖 Playbook` — your full ICT/SMC rules permanently embedded

Plus dark mode, JSON export/import, real-time sync across devices, and PWA install support.

Enjoy.
