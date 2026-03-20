# Supabase: meal images + database (Priority 1)

## 1. Create project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Copy **Project URL** and **service_role** key (Settings → API).  
   ⚠️ Use **service_role** only in Vercel/server env — never in the browser.

## 2. Environment variables (local + Vercel)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role secret |
| `GEMINI_API_KEY` | Already required for analysis |
| `SUPABASE_MEAL_BUCKET` | Optional; default `meal-images` |

## 3. Run migration

In Supabase → **SQL Editor**, run migrations in order:

- `supabase/migrations/001_meals.sql`
- `supabase/migrations/002_auth_tables.sql` (if using Google auth + profiles)
- `supabase/migrations/003_user_garden.sql` — **Health Garden** scores + biological age model

## 4. Storage bucket

1. **Storage** → **New bucket** → name: `meal-images` (or match `SUPABASE_MEAL_BUCKET`).
2. For public image URLs in the app: bucket **Public** = ON.  
   Or keep private and switch the app to signed URLs later.
3. If using policies instead of public bucket, add a policy allowing the service role to insert/read/delete (service role often bypasses RLS on storage depending on setup — verify uploads work).

## 5. Test APIs locally

```bash
npm run dev:full
```

Use a stable `user_id` (the app stores `nouris_user_id` in localStorage).

- `POST /api/meals` — body: `{ "user_id", "image" (data URL or base64), "mediaType", "meal_type", "location" }`
- `GET /api/meals?user_id=...`
- `GET /api/meals/<id>?user_id=...`
- `DELETE /api/meals/<id>?user_id=...`

## 6. Without Supabase

If `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing:

- `POST /api/meals` returns **503** — the app falls back to `POST /api/gemini/analyze` (no persistence).
- `GET /api/meals` returns `{ meals: [], configured: false }`.
