# FastAPI backend

- Authentication is delegated to Supabase Auth. Keep the Angular UI custom; FastAPI transports Supabase tokens through HttpOnly cookies only. Never introduce a custom password table, JWT signer, browser token storage, or a shared mutable SDK auth session.
- API handlers live in feature packages. Keep provider HTTP calls in `features/auth/provider.py`, application logic in `service.py`, payloads in `schemas.py`, and application ORM mappings in `models.py`.
- Supabase owns `auth.users` and auth sessions. Application SQL lives in `migrations/`; use the trusted backend database connection for username resolution and private counters. Keep credentials out of source and the browser.
- Other feature and MangaDex files are intentionally empty clues until the user requests their implementation. Do not populate them proactively. No ML/AI work is authorized by the current scaffold.
- Auth mutations require allowlisted Origin and `X-Manga-Client: web`; preserve secure-cookie defaults, no-store responses and sanitized errors.
- Provider fixtures belong under `tests/`, never the production adapter. Tests must not contact or modify a real Supabase project. `TEST_DATABASE_URL` must be a disposable database; schema tests drop application tables and provision a fake auth.users fixture there.
- Run `ruff check .`, `pytest -q`, and the PostgreSQL tests when SQL changes. Run the Angular checks/browser suite when auth contracts change.
