# Manga frontend

Angular **22.2.3** with standalone components, signals, Angular Router, reactive login forms, and Tailwind CSS 4. The existing design, phone layouts, permanent navigation bar, and mock service contracts are preserved.

Use Node **22.22.3+** on the 22.x line, **24.15+** on 24.x, or 26+.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. `/` opens `/login`; `/home` allows guest browsing. `npm run build` creates the deployable SPA in `dist/dashboard-ui/browser`. Configure your static host to serve `index.html` for application routes such as `/home` and `/login`. `npm start` runs Angular's preview server; use a static host for deployment.

## Vercel deployment

Keep the Vercel project Root Directory set to `dashboard-ui` and Framework Preset set to Angular. `vercel.json` pins the build command to `npm run build`, installation to `npm ci`, and Output Directory to `dist/dashboard-ui/browser`. It also rewrites client-side routes to `index.html` so direct visits and refreshes of `/login` and `/home` load Angular. Node 24.x is supported; the build must use at least 24.15. After committing these changes, deploy the updated commit to apply the configuration. The development command does not control production hosting.

## Project structure

Each component has a named folder containing its TypeScript, external HTML template, and unit test. Application data files are grouped centrally:

```text
src/
  main.ts
  styles.css
  environments/environment.ts
  app/
    app.ts, app.html, app.spec.ts
    app.config.ts, app.routes.ts, app-flows.spec.ts
    config/                 # API flags and configuration
    services/               # Each package contains its service and unit test
      api-client/           # api-client.services.ts, api-client.services.spec.ts
      auth/
      browser-storage/
      home/
      home-store/
      library-state/
    models/                 # Shared typed contracts; .model.ts
    mocks/                  # Runtime fixtures; *-mocks.ts
    features/
      login/           # login.ts, login.html, login.spec.ts
      signup/          # signup.ts, signup.html, signup.spec.ts
      confirm-email/   # custom Supabase email confirmation
      reset-password/  # custom Supabase recovery completion
      home/                 # home.ts, home.html, home.spec.ts
        for-you/
          feed-card/
        search/
        library/profile/
        manga-card/
        manga-actions/
        people/
    shared/
      modal/
      service-notice/
      icons.ts
```

Components use suffix-free filenames (`search.ts` / `search.html`), services and their tests are grouped in `services/<name>/` using `.services.ts` / `.services.spec.ts`, models use `.model.ts`, and unit tests use `.spec.ts`. Angular CLI component defaults create a named folder, external template, and colocated test. Service generator defaults also create a named folder and colocated unit test. Test-only fixtures live in `tests/mock`. The application uses Angular throughout.

## Demo and data services

Authentication defaults to the FastAPI/Supabase Auth backend. See [setup, Supabase SQL and email templates](../backend/README.md). Supabase manages users, passwords, JWTs, refresh rotation and emails; Angular keeps our custom signup/login/confirmation/reset pages. FastAPI uses HttpOnly JWT/refresh cookies, and no auth data is stored in local/session storage. Remember me sets persistent cookies; actual session lifetime is managed by Supabase. Angular restores on startup and refreshes before access expiry. `/confirm-email` and `/reset-password` use emailed TokenHash links configured in Supabase. Login/signup preserve safe return destinations.

Explicit `authMode: 'mock'` remains available for isolated UI tests and uses a memory-only demo session. The normal app does not seed a demo account or show demo login. Other data services still use mocks.

Guests can discover manga, search titles/authors/genres/descriptions or `@username`, and view public reader profiles. Personal libraries and mutations require sign-in. The reading preview tracks chapter progress; actual manga pages await a reader API. Bookmarks, following, progress, and reviews are shared across screens and persisted per account at `manga-library-v2:<username>`. Remove that key to reset a library.

The Library profile has a four-cover favourite shelf, three recent reads, and a featured panel gallery. Ratings, bio and reading mood sit beside the favourite shelf directly below the profile header; on phones, these details appear first in the stacked layout. Owners can add multiple panels from a searchable mock picker, remove panels from the gallery or preview, and keep changes across reloads. Public profiles remain read-only. The optional `LibraryState.favouritePanels` field preserves older saved libraries; an empty array is treated as an intentionally empty collection. Panel suggestions come from `HomeApi.getPanelSuggestions()` and `mockPanelSuggestions` in `home-mocks.ts`.

For You recommendations open on the front cover; selecting it flips to a back-cover jacket with the story details. Clicking anywhere on the back returns to the cover; the View cover control also supports keyboard activation. The reading and bookmark buttons remain in a fixed footer on both faces. Keyboard controls, reduced motion, and phone scrolling are supported. `MangaDetails.cover_url` supplies the default front image. An optional `back_cover: { image, description }` supplies separate back-cover art. When images are unavailable, the existing `panel` art acts as a fallback; the back ultimately falls back to the front cover. Separate mock back-cover art is supplied in the fixtures, without assuming the future API will always provide a back cover. Demo panel data stays in `home-mocks.ts`. The front header keeps title · authors on one line with a fixed community rating on the right. Title and author text truncate independently with ellipses; full credits remain in the hover title and back face. The first feed mock has a long title and three authors to exercise narrow layouts. Ratings use the MangaDex-compatible `statistics.rating.bayesian` field with an `average` fallback, populated only by mock fixtures for now. Back-face content uses native scroll chaining: long details scroll within the card, then scrolling continues through recommendations at either edge. The API handoff can map these from `GET /statistics/manga/{uuid}`; see [MangaDex statistics](https://api.mangadex.org/docs/03-manga/statistics/).

All fixtures remain in `src/app/mocks/auth-mocks.ts` and `src/app/mocks/home-mocks.ts`. Components never import them. `AuthService`, `LibraryState`, and `HomeStore` are root-provided Angular services. `LibraryState` owns private writable signals and exposes read-only shelves and a computed profile; library changes go through its commands. `HomeStore` coordinates account loading, sign-in checks, and ordered saves. `AuthService` owns session and username signals, cookie-session restoration and expiry, plus revalidation when a window gains focus, with subscriptions cleaned up through Angular's lifecycle.

`HomeApi` implements the typed data methods in `home.services.ts` directly, returning cold RxJS `Observable<T>` streams for both mocks and HTTP. It injects `ApiClient`, `BrowserStorage`, and `LibraryState`; there is no free-function API wrapper or module-global session. `ApiClient` uses Angular `HttpClient`, configured in `app.config.ts`, and maps HTTP failures to the shared `ApiError` model. `API_CONFIG` and `AUTH_CONFIG` are injection tokens with separate flags: auth defaults to backend, other data to mocks. Reads are unsubscribed when superseded or destroyed; loading flags use `finalize`, home reads combine with `forkJoin`, and library writes are serialized with `concatMap` so errors do not stop later saves. Sign-in, signup, recovery and reset use cookie-authenticated HTTP Observables; explicit mock auth uses mock timers. Components handle results through RxJS pipelines. Tests use `TestBed` and `HttpTestingController` to replace the HTTP backend. Browser storage uses the injected document and platform rather than assuming a browser is always available.

`src/app/config/api.config.ts` retains **`USE_MOCKS = true`**. Mock services return independent copies of fixtures. The API integration points remain:

| Method | Data |
| --- | --- |
| `getHomeData()` | Catalog, recommendations, readers, suggestions |
| `getForYouFeed()` / `getMangaCatalog()` | Manga feeds |
| `getSearchFeed({ query, genre, status, sort })` | Filtered and sorted search results |
| `getReaders({ query, usernames })` | Reader search and connections |
| `getSearchSuggestions()` | Search pills |
| `getUserProfile(username)` | Profile, library, favourite panels, mood, avatar |
| `getPanelSuggestions()` | Available panels for the collection picker (`/manga/panels` API integration placeholder) |
| `saveUserLibrary(username, state)` | Progress, bookmarks, following, reviews, favourite panels |

When the backend is ready, update endpoint paths and DTO mappings in `.services.ts` files, set `apiBaseUrl` in `src/environments/environment.ts`, disable `USE_MOCKS` for the remaining data services. `authMode: 'backend'` is already the default and operates independently of the data mock flag. These are build-time settings. HTTP failures propagate to retry states rather than returning demo data. Library saves run in order, failed saves retain visible edits and offer Retry save, and stale search/profile responses cannot replace newer results.

## Checks

```bash
npm run lint
npm test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run test:watch` watches Angular unit/component tests. Coverage enforces 80% statements/lines, 75% functions, and 70% branches; fixtures are excluded. Angular's native Vitest runner tests services, state, login, home, search, public profiles, library tabs, dialogs, and mutations. Playwright starts an isolated Angular server on port 3100 and checks browser flows, scroll snapping, touch/arrow navigation, fixed navigation, and responsive layouts at 320–1440px, including short screens.

`.github/workflows/frontend-tests.yml` runs lint, coverage, production build, and Chromium checks automatically on pushes and pull requests, and supports manual dispatch. Coverage and browser reports are uploaded as artifacts. No backend or credentials are required.
