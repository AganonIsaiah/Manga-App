# FastAPI + Supabase Auth

Supabase Auth owns users, password hashing, JWT issuance, refresh rotation, email confirmation and password recovery. Angular keeps the custom login/signup UI. FastAPI is a cookie-based API layer: it calls the Supabase Auth REST API and never sends access/refresh tokens to Angular JSON or browser storage. There is no custom password table, JWT signing secret, SMTP client or replacement authentication system.

## Setup

Use Python 3.12+ (CI uses 3.13). From the repository root:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install --no-deps -e .
cp .env.example .env
```

Fill `.env`:

- `SUPABASE_URL`: your project origin, e.g. `https://PROJECT_REF.supabase.co`, without a trailing slash.
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (or legacy anon key). The Auth API adapter does not need an admin/service-role key.
- `DATABASE_URL`: the trusted backend-only Postgres URI from Supabase **Connect**, prefixed with `postgresql+psycopg://` and using `sslmode=require`. A session-pooler connection is suitable; the engine also disables prepared statements and application pooling for transaction-pooler compatibility. URL-encode special characters in the password.
- `FRONTEND_URL`, `ALLOWED_ORIGINS`, and cookie settings: localhost defaults are in `.env.example`.

Run **[migrations/001_auth.sql](migrations/001_auth.sql)** once in the Supabase SQL editor. Supabase already creates `auth.users` and its auth/session tables; do not create those yourself. Our script creates:

1. `public.profiles`: ID referencing `auth.users`, unique lowercase username, display name, creation time. A hardened trigger creates the profile during signup, and existing auth users are backfilled with unique generated usernames. Deleting an auth user cascades to the profile.
2. `manga_private.rate_limits`: private API abuse counters, not user credentials or sessions.

Profiles have RLS with public SELECT access to those non-sensitive fields only; no browser write policies are added. The `manga_private` schema has no anon/authenticated grants and must stay out of the Data API's exposed schemas. The backend connects with a trusted database role (the Supabase `postgres` connection works). Username login performs a backend-only join to `auth.users.email`; emails are never copied into the public profile table. A restricted role must have explicit server-only read permissions on those tables and access to rate-limit counters. Never expose the database connection string to Angular.

Start the API from `backend/`:

```sh
uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000
```

In another terminal, run `npm run dev` from `dashboard-ui/`. Its proxy forwards `/api/**` to port 8000 and preserves the Origin. Both `http://localhost:4200` and `http://127.0.0.1:4200` are allowed by the example config.

The normal application creates no demo account. Auth defaults to the backend independently of `USE_MOCKS`, which remains enabled for other frontend services. New accounts get an empty mock library using their real name/username. Explicit mock auth is still available for isolated unit/UI tests, with memory-only sessions.

## Supabase dashboard configuration

Enable the Email provider and email/password signup. Set the password minimum to **12 characters** in Supabase as well as the application, so direct Auth API calls enforce the same policy. Keep email confirmation enabled for the normal deployment.

Set **Authentication → URL Configuration → Site URL** to your Angular origin (`http://localhost:4200` locally). Allow these redirect URLs for the corresponding development/production origin:

```text
http://localhost:4200/confirm-email
http://localhost:4200/reset-password
```

Configure email delivery/SMTP **in Supabase**, not FastAPI. The default Supabase mail service is restricted; use your own sender for real users. Configure token expiry and session policies in Supabase Auth; the API does not invent its own signing keys or override those policies.

Update these two Supabase email templates to use our custom pages with `TokenHash`. This is required: the default confirmation URL redirects with a token flow this application intentionally does not store in browser JavaScript.

**Confirm signup:**

```html
<h2>Welcome to Manga</h2>
<p><a href="{{ .SiteURL }}/confirm-email#token_hash={{ .TokenHash }}">Confirm your email</a></p>
```

**Reset password:**

```html
<h2>Reset your Manga password</h2>
<p><a href="{{ .SiteURL }}/reset-password#token_hash={{ .TokenHash }}">Choose a new password</a></p>
```

The fragment keeps the hash out of HTTP URL logs/referrers. Angular captures it only in component memory and replaces the URL immediately. Confirmation requires an explicit button click, avoiding consumption by scanners that merely open a link. FastAPI verifies the hash with Supabase (`type=email` for signup, `type=recovery` for recovery). Reset verifies the recovery link, updates the password through Supabase and requests global sign-out. No admin credentials are used.

## API contract

All endpoints are under `/api/auth`. Angular uses `withCredentials: true`, JSON bodies and `X-Manga-Client: web`. Mutations also require an exact allowlisted `Origin`; CORS allows credentials only from explicit origins. Scripts/tests must supply these headers too. These checks prevent cookie/login CSRF without giving JavaScript access to auth cookies.

| Method | Path | Behavior |
|---|---|---|
| POST | `/signup` | `{name, username, email, password}`; sends Supabase signup/confirmation |
| POST | `/login` | `{identifier, password, remember}`; email or username login |
| GET | `/session` | Validates the cookie JWT through Supabase `GET /user`, reads the profile |
| POST | `/refresh` | Passes the refresh cookie to Supabase; replaces JWT/refresh cookies |
| POST | `/logout` | Requests Supabase local sign-out; clears this browser's cookies |
| POST | `/password-reset` | `{email}`; asks Supabase to send recovery email, generic normal response |
| POST | `/reset-password` | `{token, password}`; verifies recovery TokenHash, changes password |
| POST | `/confirm-email` | `{token}`; verifies email TokenHash and creates the cookie session |

Session JSON contains `{user: {id, name, username, created_at, country_code, city, avatar_url}, expiresAt}` after migration 002. `expiresAt` is Unix milliseconds read from the JWT **after Supabase validates the exact token**; unverified local claims never authorize a request. The REST client shares only an HTTP connection pool and immutable API-key config; user Bearer headers are supplied per request, so one user's session cannot leak through global SDK state. Upstream internal error details are not exposed.

Access and refresh cookies are HttpOnly, host-only, SameSite=Lax by default and Secure in production. The access-cookie path is `/api`; refresh and persistence-choice cookies use `/api/auth`. Without Remember me, cookies are browser-session scoped (browsers may restore them when restoring a session). With Remember me, refresh/persistence cookies have a rolling 30-day browser expiry. Actual refresh lifetime, reuse detection, inactivity and time-box limits remain controlled by Supabase. Angular restores on startup, checks on focus, deduplicates refresh requests and refreshes before the access JWT expires. Auth never falls back to mocks on network/auth failure.

Supabase sign-out revokes refresh tokens. A previously issued JWT can remain valid until its configured expiry in systems validating it statelessly; do not assume instant JWT invalidation across other Supabase services. Choose the Supabase JWT/session settings accordingly. FastAPI validates each protected request through the Auth user endpoint; add `Depends(get_current_user)` to future protected routes. Browser cookies are cleared after successful logout/reset, and failed logout remains visible/retryable.

Responses are `Cache-Control: no-store`; validation errors omit submitted passwords/tokens. Rate limits are database-backed across API workers and complement Supabase's own Auth/email limits. Forwarded IP headers must only be trusted from your actual proxy (`uvicorn --forwarded-allow-ips=...`). Run the cleanup statement at the end of the SQL file periodically for old counters. Extend allowed CORS methods when implementing future PUT/PATCH/DELETE features.

## Deployment

Set `ENVIRONMENT=production`, `COOKIE_SECURE=true`, exact HTTPS `ALLOWED_ORIGINS`, HTTPS `FRONTEND_URL` and the real Supabase origin/key. Keep database credentials on the API server. The schema is not created automatically.

Prefer a same-origin HTTPS `/api/**` reverse proxy or same-site custom frontend/API domains. For Vercel, add this rewrite **before** the SPA catch-all in `dashboard-ui/vercel.json`, replacing the host:

```json
{"source": "/api/:path*", "destination": "https://YOUR-API-HOST/api/:path*"}
```

Angular's dev proxy does not configure production. Alternatively set build-time `environment.apiBaseUrl` to `https://YOUR-API-HOST/api` and allow the frontend origin in FastAPI. Truly cross-site deployments require `COOKIE_SAMESITE=none`, HTTPS and browser third-party-cookie support; the same-origin proxy avoids that dependency. Update the Supabase Site URL/redirects/email templates for production too.

## Verification

```sh
pytest -q
ruff check .
# DISPOSABLE Postgres only: drops/recreates app profile/counter tables and a fake auth.users fixture.
TEST_DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/manga_auth_test pytest -q
```

Never point `TEST_DATABASE_URL` at a real Supabase/application database. The schema test creates a minimal **test-only** auth.users table and browser roles, checks the actual trigger/backfill/RLS SQL, then checks username email resolution. Production relies entirely on Supabase's managed auth schema.

`npm run test:e2e` in `dashboard-ui/` starts Angular (3100) and the real FastAPI application with a **test-only Supabase provider fixture** (8101). It exercises the cookie/HTTP integration without contacting a real project. Adapter tests check outbound Supabase REST contracts using an HTTP mock transport. Real Supabase signup/email delivery needs your project credentials, schema and dashboard configuration; those are not available in this workspace. Both frontend and backend GitHub Actions workflows run their checks.

## Empty feature clues

`users/router.py`, `library/router.py`, `search/router.py`, `recommendations/router.py` and `integrations/mangadex/client.py` are intentionally empty and unregistered. No ML/AI directory was created.

References: [Supabase Auth REST](https://supabase.github.io/auth/), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [session behavior](https://supabase.com/docs/guides/auth/sessions), [server-side auth](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

## Profile location and photos

After applying `001_auth.sql`, run `migrations/002_profile_details.sql` in the Supabase SQL Editor. It adds optional country/city fields and avatar paths, updates the signup trigger, and creates the public `avatars` bucket with owner-only upload/delete policies. Location is not granted to public database readers. Avatars are public images; location is returned only in the authenticated account session.

`POST /api/users/me/avatar` accepts a raw JPEG, PNG or WebP request body (not JSON or multipart), with the existing auth cookie, allowed Origin, and `X-Manga-Client: web`. The backend limits input to 5 MB / 16 megapixels, applies EXIF orientation, center-crops to 512×512, and re-encodes to WebP without source metadata. It uploads to a unique `<user-id>/<uuid>.webp` path, updates the profile, and then removes the previous object. Failed database updates trigger cleanup of the new object; failed cleanup is logged for maintenance. Storage calls use each user's verified access token and the existing publishable key; no service-role key is required. Install updated requirements before starting the backend.

Email confirmation accepts the configured `#token_hash=...` template (and query token hashes), removes the token from browser history, and verifies only after the confirmation button is clicked. A visit without a token shows inbox guidance instead of an invalid-link error. Keep the custom Supabase email templates above configured; default implicit-flow access tokens are not used by this app.
