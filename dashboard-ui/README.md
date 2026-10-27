# Manga frontend

Angular **22.2.3** with standalone components, signals, Angular Router, reactive login forms, and Tailwind CSS 4. The existing design, phone layouts, permanent navigation bar, and mock service contracts are preserved.

Use Node **22.22.3+** on the 22.x line, **24.15+** on 24.x, or 26+.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. `/` opens `/login`; `/home` allows guest browsing. `npm run build` creates the deployable SPA in `dist/dashboard-ui/browser`. Configure your static host to serve `index.html` for application routes such as `/home` and `/login`. `npm start` runs Angular's preview server; use a static host for deployment.

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
    services/               # Auth, home, persistence, HTTP; .services.ts
    models/                 # Shared typed contracts; .model.ts
    mocks/                  # Runtime fixtures; *-mocks.ts
    features/
      auth/login/           # login.ts, login.html, login.spec.ts
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

Components use suffix-free filenames (`search.ts` / `search.html`), services use `.services.ts`, models use `.model.ts`, and unit tests use `.spec.ts`. Angular CLI component defaults create a named folder, external template, and colocated test. Test-only fixtures live in `tests/mock`. The application uses Angular throughout.

## Demo and data services

Choose **Use demo account**, or sign in with `reader@manga.demo` (username `aganon33`) and password `manga-demo`. Remember me uses local storage; otherwise the session is tab-scoped. Sessions expire after seven days, and passwords are never persisted. Password recovery clearly reports that no email was sent.

Guests can discover manga, search titles/authors/genres/descriptions or `@username`, and view public reader profiles. Personal libraries and mutations require demo sign-in. The reading preview tracks chapter progress; actual manga pages await a reader API. Bookmarks, following, progress, and reviews are shared across screens and persisted per account at `manga-library-v2:<username>`. Remove that key to reset a library.

All fixtures remain in `src/app/mocks/auth-mocks.ts` and `src/app/mocks/home-mocks.ts`. Components never import them. `AuthService`, `LibraryState`, and `HomeStore` are root-provided Angular services. `LibraryState` owns private writable signals and exposes read-only shelves and a computed profile; library changes go through its commands. `HomeStore` coordinates account loading, sign-in checks, and ordered saves. `AuthService` owns session and username signals, session expiry, and native cross-tab storage synchronization, with subscriptions cleaned up through Angular's lifecycle.

`HomeApi` implements the typed data methods in `home.services.ts` directly, returning cold RxJS `Observable<T>` streams for both mocks and HTTP. It injects `ApiClient`, `BrowserStorage`, and `LibraryState`; there is no free-function API wrapper or module-global session. `ApiClient` uses Angular `HttpClient`, configured in `app.config.ts`, and maps HTTP failures to the shared `ApiError` model. `API_CONFIG` and `AUTH_CONFIG` are injection tokens whose defaults retain the current mock flags. Reads are unsubscribed when superseded or destroyed; loading flags use `finalize`, home reads combine with `forkJoin`, and library writes are serialized with `concatMap` so errors do not stop later saves. Sign-in and recovery use Observable mock timers, and the login component handles results through RxJS pipelines. Tests use `TestBed` and `HttpTestingController` to replace the HTTP backend. Browser storage uses the injected document and platform rather than assuming a browser is always available.

`src/app/config/api.config.ts` retains **`USE_MOCKS = true`**. Mock services return independent copies of fixtures. The API integration points remain:

| Method | Data |
| --- | --- |
| `getHomeData()` | Catalog, recommendations, readers, suggestions |
| `getForYouFeed()` / `getMangaCatalog()` | Manga feeds |
| `getSearchFeed({ query, genre, status, sort })` | Filtered and sorted search results |
| `getReaders({ query, usernames })` | Reader search and connections |
| `getSearchSuggestions()` | Search pills |
| `getUserProfile(username)` | Profile, library, favourite panels, mood, avatar |
| `saveUserLibrary(username, state)` | Progress, bookmarks, following, reviews |

When the backend is ready, update endpoint paths and DTO mappings in `.services.ts` files, set `apiBaseUrl` in `src/environments/environment.ts`, implement the authentication adapter in `auth.services.ts`, and disable `USE_MOCKS`. `authMode: 'backend'` also disables mock authentication. These are build-time settings. HTTP failures propagate to retry states rather than returning demo data. Library saves run in order, failed saves retain visible edits and offer Retry save, and stale search/profile responses cannot replace newer results.

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
