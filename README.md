# Nouris

**AI-powered nutrition from a single photo.**

Nouris turns a picture of your food into clear calories, macros, and scannable health insights ΓÇö then keeps everything in a personal journal that syncs across devices. It grows with you through a visual health garden, weekly patterns, symptom tracking, personalized nutrition plans, and diet-aware AI recommendations (vegetarian or non-vegetarian).

> Live app: [health-ai-wellness-app.vercel.app](https://health-ai-wellness-app.vercel.app/)

---

## Table of contents

- [What the app does](#what-the-app-does)
- [Core features](#core-features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [User flows](#user-flows)
- [Repository structure](#repository-structure)
- [API reference](#api-reference)
- [Database & storage](#database--storage)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Disclaimer](#disclaimer)

---

## What the app does

Most nutrition apps ask you to type every ingredient. Nouris starts from the plate itself:

1. **Snap or upload** a meal photo  
2. **Gemini vision** identifies foods and estimates nutrition  
3. You get a **health score**, macros, short mechanistic insights, and improvement swaps  
4. The meal is **saved to your journal**, updates your **health garden**, and can count toward an active **nutrition plan**

Profiles capture goals, body metrics (age, height, weight), activity, conditions, and **veg / non-veg** preference so calorie targets and AI meal suggestions stay aligned with how you actually eat.

---

## Core features

| Area | What you get |
|------|----------------|
| **Photo meal analysis** | Calories, protein/carbs/fat/fiber, sodium and more; health score; cardiovascular / metabolic / inflammatory bullets; swap suggestions |
| **Meal journal** | Timestamped history with meal type and optional location; used by Dashboard, Week, and Insights |
| **Today view** | Progress rings against your daily calorie and macro targets |
| **Health garden** | Motivational organ scores (heart, brain, gut, muscle, immune, bones) that update as you log meals |
| **Weekly insights** | Patterns across the week; optional AI weekly summary |
| **Symptom & energy log** | Energy, mood, digestion ΓÇö explore correlations with meals |
| **Nutrition plans** | Browse curated plans, enroll, track daily progress, unlock badges; AI can generate a custom plan |
| **AI meal suggestions** | Plan-aware suggestions that respect remaining macros **and** diet preference |
| **Profile** | Edit goals, conditions, age, sex, activity, height, weight, diet preference; targets recalculate automatically |
| **Auth** | Google sign-in via Supabase Auth; meals and profile sync to your account |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 5, Tailwind CSS 3, Framer Motion, Lucide, Recharts, react-dropzone |
| **Backend** | Vercel Serverless Functions (`api/`) + shared Node modules (`server-lib/`) |
| **Local API** | Lightweight Node HTTP server (`scripts/dev-api.mjs`) with Vite `/api` proxy |
| **AI** | Google Gemini (`gemini-2.5-flash`) for meal analysis, plan generation, and meal suggestions; optional Anthropic for weekly/symptom reports |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage bucket `meal-images` |
| **Auth** | Supabase Auth ΓÇö Google OAuth |
| **Hosting** | Vercel (static SPA + serverless API) |

---

## Architecture

Nouris is a **SPA + BFF (backend-for-frontend)** design: the browser never holds the service-role key or Gemini key. Authenticated calls go to `/api/*` with the userΓÇÖs Supabase JWT; the server validates the token and talks to Gemini and Supabase as an admin client.

```
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé  Browser (React SPA ΓÇö Vite)                                 Γöé
Γöé  ΓÇó Marketing landing / Google OAuth                         Γöé
Γöé  ΓÇó Tabs: Garden ┬╖ Insights ┬╖ Analyze ┬╖ Week ┬╖ Plans ┬╖ ΓÇª     Γöé
Γöé  ΓÇó supabase-js (anon key) ΓåÆ session                         Γöé
Γöé  ΓÇó fetch("/api/ΓÇª", { Authorization: Bearer <access_token> })Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                              Γöé
              Dev: Vite proxy Γöé  Prod: Vercel routing
                              Γû╝
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé  API layer                                                  Γöé
Γöé  ΓÇó api/**/*.js     ΓåÆ thin Vercel entrypoints                Γöé
Γöé  ΓÇó server-lib/     ΓåÆ handlers, Gemini, garden, plans        Γöé
Γöé  ΓÇó authUser.js     ΓåÆ Bearer token ΓåÆ Supabase user id        Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé                             Γöé
                Γû╝                             Γû╝
     ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ          ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
     Γöé  Google Gemini   Γöé          Γöé  Supabase          Γöé
     Γöé  Vision + text   Γöé          Γöé  Auth ┬╖ Postgres   Γöé
     Γöé  meal / plans    Γöé          Γöé  Storage (images)  Γöé
     ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ          ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

### Request path (meal analysis)

```
Dashboard dropzone
  ΓåÆ mealsApi.createMeal()          // compress image client-side
  ΓåÆ POST /api/meals + Bearer JWT
  ΓåÆ handleMeals()
       Γö£ΓöÇ getAuthedUserId()
       Γö£ΓöÇ upload to Storage (meal-images)
       Γö£ΓöÇ analyzeFoodImage()        // Gemini + diet_preference from profile
       Γö£ΓöÇ insert public.meals
       Γö£ΓöÇ applyScoringToGarden()
       ΓööΓöÇ 201 { analysis, image_url, garden_update, ΓÇª }
  ΓåÆ AnalysisView + remote meals list
```

If Supabase storage is not configured, the client falls back to `POST /api/gemini/analyze` (analysis only, no journal persistence).

### Auth path

```
MarketingLanding ΓÇ£Sign up with GoogleΓÇ¥
  ΓåÆ supabase.auth.signInWithOAuth({ provider: "google", redirectTo })
  ΓåÆ Supabase Auth Γåö Google
  ΓåÆ redirect to VITE_PUBLIC_APP_URL / origin
  ΓåÆ App restores session ΓåÆ load profile / meals / garden / plans
  ΓåÆ no profile ΓåÆ Onboarding ΓåÆ PUT /api/profile
```

### Why `server-lib` exists

Vercel Hobby plans limit the number of serverless functions. Shared logic lives in `server-lib/` so each `api/*.js` file stays a thin wrapper and the same handlers run under the local `dispatchApi` router during `npm run dev:full`.

---

## User flows

### 1. Sign in & onboarding
- Land on marketing page ΓåÆ Google OAuth  
- Complete goals, conditions, body metrics, **diet preference** (veg / non-veg), activity  
- Calorie and macro targets are computed (MifflinΓÇôSt Jeor using height, weight, age, sex, activity, goal)

### 2. Analyze a meal
- **Analyze** tab ΓåÆ choose breakfast/lunch/dinner/snack ΓåÆ upload photo  
- Loading overlay while Gemini runs  
- Results: health score, macros, insights, swaps (diet-aware)  
- Meal is stored; garden updates; optional ΓÇ£log to planΓÇ¥

### 3. Journal & weekly view
- Recent meals on Dashboard  
- **Week** tab for weekly journal and optional AI weekly report

### 4. Health garden
- **Garden** visualizes organ scores driven by logged meals  
- **Insights** summarizes garden environment and trends

### 5. Plans
- Browse / generate plans ΓåÆ enroll  
- Active plan dashboard: progress, AI meal suggestions (diet-aware), complete meals, badges

### 6. Profile
- View and edit demographics, height/weight, diet preference  
- Saving recalculates daily targets and persists via `PUT /api/profile`

---

## Repository structure

```
Health-AI/
Γö£ΓöÇΓöÇ api/                      # Vercel serverless entrypoints
Γöé   Γö£ΓöÇΓöÇ meals/                # GET/POST /api/meals, GET/DELETE /api/meals/:id
Γöé   Γö£ΓöÇΓöÇ plans/                # /api/plans and /api/plans/:action
Γöé   Γö£ΓöÇΓöÇ profile/              # GET/PUT /api/profile
Γöé   Γö£ΓöÇΓöÇ garden/               # GET /api/garden
Γöé   Γö£ΓöÇΓöÇ symptoms/             # GET/POST /api/symptoms
Γöé   Γö£ΓöÇΓöÇ gemini/analyze.js     # POST /api/gemini/analyze (no persistence)
Γöé   ΓööΓöÇΓöÇ debug/supabase.js     # Health check for DB + storage
Γö£ΓöÇΓöÇ server-lib/
Γöé   Γö£ΓöÇΓöÇ handlers/             # meals, profile, plans, garden, symptoms, geminiΓÇª
Γöé   Γö£ΓöÇΓöÇ geminiFoodAnalysis.js # Shared vision analysis + Nouris UI shape
Γöé   Γö£ΓöÇΓöÇ planGenerator.js      # AI custom nutrition plans
Γöé   Γö£ΓöÇΓöÇ planMealSuggestion.js # Diet-aware meal suggestions
Γöé   Γö£ΓöÇΓöÇ gardenScoring.js      # Meal ΓåÆ organ score deltas
Γöé   Γö£ΓöÇΓöÇ gardenState.js        # Persist garden updates
Γöé   Γö£ΓöÇΓöÇ authUser.js           # JWT ΓåÆ user id
Γöé   Γö£ΓöÇΓöÇ supabaseServer.js     # Service-role client
Γöé   ΓööΓöÇΓöÇ dispatchApi.js        # Local / catch-all API router
Γö£ΓöÇΓöÇ src/
Γöé   Γö£ΓöÇΓöÇ App.jsx               # Auth shell, tabs, meal orchestration
Γöé   Γö£ΓöÇΓöÇ views/                # Screens (Marketing, Dashboard, Profile, ΓÇª)
Γöé   Γö£ΓöÇΓöÇ components/           # Garden canvas, landing demo, week journal
Γöé   ΓööΓöÇΓöÇ lib/                  # Client API wrappers, profile targets, Supabase
Γö£ΓöÇΓöÇ supabase/migrations/      # Schema, RLS, storage policies
Γö£ΓöÇΓöÇ scripts/                  # dev.mjs, dev-api.mjs, loadEnv.mjs
Γö£ΓöÇΓöÇ public/images/landing/    # Marketing assets
Γö£ΓöÇΓöÇ docs/SUPABASE_SETUP.md
Γö£ΓöÇΓöÇ vercel.json
ΓööΓöÇΓöÇ package.json
```

---

## API reference

Most authenticated routes expect:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/meals` | Analyze image, store meal, update garden |
| `GET` | `/api/meals` | List current userΓÇÖs meals |
| `GET` | `/api/meals/:mealId` | Fetch one meal |
| `DELETE` | `/api/meals/:mealId` | Delete meal (+ storage object) |
| `POST` | `/api/gemini/analyze` | Analyze only (no auth required for fallback) |
| `GET` / `PUT` | `/api/profile` | Load / upsert profile (incl. height, weight, diet) |
| `GET` | `/api/garden` | Current garden state |
| `GET` / `POST` | `/api/symptoms` | List / create symptom logs |
| `GET` | `/api/plans` | Plan library |
| `GET` | `/api/plans/:slug` | Plan detail |
| `POST` | `/api/plans/generate` | AI-generate a custom plan |
| `POST` | `/api/plans/enroll` | Enroll in a plan |
| `GET` | `/api/plans/active` | Active enrollment |
| `GET` | `/api/plans/progress` | Progress report data |
| `POST` | `/api/plans/complete-meal` | Attribute a meal to the plan |
| `GET` | `/api/plans/suggest-meal?meal_slot=` | AI meal ideas for a slot |
| `GET` | `/api/plans/achievements` | Badges |
| `POST` | `/api/plans/quit` | Leave active plan |
| `GET` | `/api/debug/supabase` | Connectivity check (DB + bucket) |

Local-only via `dispatchApi` (when using `dev:full`): optional `/api/logmeal/analyze`, `/api/packaged/analyze`.

---

## Database & storage

Migrations live in `supabase/migrations/` (run in order `001` ΓåÆ `008`).

| Table | Purpose |
|-------|---------|
| `meals` | Image URL/path, meal type, location, `analysis_result` JSON |
| `user_profiles` | Goals, conditions, age, sex, activity, height/weight, diet preference, macro targets |
| `symptoms` | Energy, mood, digestion, notes |
| `user_garden` | Organ scores, streaks / bio-age style fields |
| `nutrition_plans` | Plan definitions (library + AI-generated) |
| `user_plan_enrollments` | Active/past enrollments |
| `plan_daily_progress` | Daily adherence and macros |
| `plan_achievements` | Unlocked badges |

**Storage:** public (or policy-backed) bucket `meal-images` (override with `SUPABASE_MEAL_BUCKET`).

RLS policies restrict row access to the owning `auth.users` id; the API uses the **service role** after verifying the callerΓÇÖs JWT.

---

## Getting started

### Prerequisites

- Node.js 18+  
- A [Supabase](https://supabase.com) project  
- A [Google AI](https://aistudio.google.com/) Gemini API key  
- Google OAuth credentials configured in Supabase Auth  

### Install

```bash
git clone https://github.com/harshilgor/Health-AI.git
cd Health-AI
npm install
```

### Configure environment

Create `.env.local` in the project root (see [Environment variables](#environment-variables)).

Run SQL migrations from `supabase/migrations/` in the Supabase SQL editor (or CLI), create the `meal-images` bucket, and enable the Google provider under **Authentication ΓåÆ Providers**.

### Run locally

```bash
# Frontend (Vite) + API (port 3001) with /api proxy ΓÇö recommended
npm run dev:full
```

Then open `http://localhost:5173`.

Other scripts:

| Command | Use |
|---------|-----|
| `npm run dev` | Vite only |
| `npm run dev:api` | API server only |
| `npm run build` | Production SPA build ΓåÆ `dist/` |
| `npm run preview` | Preview production build |
| `npm run test:gemini` | Smoke-test Gemini with `.env.local` |
| `npm run check:api-fn-budget` | Check serverless function budget |

---

## Environment variables

### Browser (Vite)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes (for auth) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (for auth) | Anon / publishable key |
| `VITE_PUBLIC_APP_URL` | Recommended in prod | OAuth redirect, e.g. `https://health-ai-wellness-app.vercel.app` |
| `VITE_ANTHROPIC_API_KEY` | Optional | Client-side weekly / symptom AI |
| `VITE_API_KEY` | Optional | Legacy alias for Anthropic key |

### Server (Vercel + local `dev-api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes (journal) | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (journal) | **Secret** ΓÇö never expose to the client |
| `GEMINI_API_KEY` | Yes (analysis) | Google Gemini API key |
| `SUPABASE_MEAL_BUCKET` | Optional | Default `meal-images` |
| `API_PORT` | Optional | Local API port (default `3001`) |

`scripts/loadEnv.mjs` loads `.env.local` then `.env` for the local API process.

---

## Deployment

1. Push to `main` (GitHub ΓåÆ Vercel project **health-ai-wellness-app**).  
2. Set the server and `VITE_*` env vars in the Vercel project.  
3. Redeploy after changing any `VITE_*` variable (they are baked in at build time).  
4. In Supabase Auth URL config, allow:
   - Site URL: your production origin  
   - Redirect URLs: same origin  

`vercel.json` configures the SPA rewrite (non-API routes ΓåÆ `index.html`) and a 60s max duration for API functions (needed for Gemini + image uploads).

---

## Disclaimer

Nouris provides **educational nutrition insights**, not medical advice. It does not diagnose or treat disease. Always consult a qualified clinician for medical decisions.

---

## License

Private / unpublished unless otherwise specified by the repository owner.

---

Built with React, Vite, Supabase, Gemini, and Vercel.
