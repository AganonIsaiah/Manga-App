This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Frontend demo

The home screens use mock manga and readers; no backend is required. Search a title, author, genre, or description, or enter `@manga_mira` to find a reader. The Readers result tab also searches names and bios. Reader profiles link from search and follower/following lists.

Bookmarks, follows, chapter progress, and review edits are shared across the app and saved in browser local storage (`manga-library-v2:<username>`). Clear that account’s key to reset the demo. Guest visits never load a personal library. Reading opens a preview with chapter controls; actual manga pages await the backend. Favourite panels use local illustrative SVG fixtures, with a larger preview on selection.

Validation: `npm run lint` and `npm run build`. The layout supports narrow phone screens, with responsive shelves and safe viewport sizing. Keyboard users can close preview dialogs with Escape.

### Login demo

`/` opens `/login`. Sign in using **Use demo account**, or enter `reader@manga.demo` (username `aganon33`) and password `manga-demo`. The form includes password visibility, loading/error states, remember me, and mock password recovery. Password recovery explicitly reports that no email was sent. Guest browsing remains available; this frontend session is a demo, not a backend authorization boundary.

Without Remember me, the session is stored for the browser tab; enabling it uses local storage. Sessions expire after seven days. Passwords are never stored. Library includes sign-in/sign-out controls, and a successful sign-in returns to the requested home screen.

Auth fixtures and simulated responses live in `src/features/auth/auth-mocks.ts`, behind `auth.service.ts`. Home fixtures, reader profiles, panels, and initial library state live in `src/features/home/home.api-mocks.ts`; only service files import these fixtures. Components receive data through `HomeProvider` or typed service methods, with loading, error, and retry states. Types and state handling are separate from fixtures.

`NEXT_PUBLIC_AUTH_MODE` defaults to mock mode. Setting it to `backend` disables demo login and fails with an unavailable message until a real adapter is connected in `auth.service.ts`. Restart the development server after changing this build-time flag.

### Tests and continuous integration

- `npm test` runs all unit and component tests once; `npm run test:watch` reruns them as you edit.
- `npm run test:coverage` generates coverage and enforces minimum line/statement (80%), function (75%), and branch (70%) coverage.
- `npm run build && npm run test:e2e` runs real Chromium checks against the production build. Install Chromium once with `npx playwright install chromium`. The browser suite starts an isolated server on port 3100 automatically.

Tests cover authentication and guest access, navigation, recommendation controls, search and filters, reader discovery, library tabs, chapter progress, bookmarks, review editing, follows, panel dialogs, persistence, malformed saved data, and scroll/touch behavior. Responsive browser tests check 320, 390, 600, 768, and 1440 pixel widths, including horizontal overflow and the number of manga columns.

`.github/workflows/frontend-tests.yml` runs lint, unit/component tests with coverage, a production build, and browser tests on every push and pull request, and can also be started manually in GitHub Actions. Coverage and browser reports are uploaded as artifacts. No credentials or backend services are required.

Guests see a Sign in navigation entry and an empty library prompt. Only an authenticated demo session loads the sample personal profile. Reading, bookmarks, follows, and review changes require sign-in; browsing manga and public reader profiles remains available to guests. Mock authentication remains a frontend preview, not a production authorization mechanism.


### Data services and API handoff

`src/config/api.config.ts` defines **`USE_MOCKS = true`**. Leave it enabled while the backend is unavailable. All home data reads and library saves go through `src/features/home/home.service.ts`; mock responses are cloned so UI changes cannot mutate shared fixtures. Browser storage is used only by the mock service adapter, with separate keys per account.

| Service method | Supplies |
| --- | --- |
| `getHomeData()` | The shared catalog, recommendations, reader directory, and suggestion pills |
| `getForYouFeed()` / `getMangaCatalog()` | Recommendation and manga data |
| `getSearchFeed({ query, genre, status, sort })` | Filtered and sorted manga results |
| `getReaders({ query, usernames })` | Reader search and follower/following lists |
| `getSearchSuggestions()` | Search suggestion pills |
| `getUserProfile(username)` | Profile details, library state, favourite panels, reading mood, and avatar colour |
| `saveUserLibrary(username, state)` | Reading progress, bookmarks, follows, and review updates |

When the API is ready, align the endpoint paths and response mappings in `home.service.ts`, set `NEXT_PUBLIC_API_BASE_URL` (default `/api`), and switch `USE_MOCKS` off. The HTTP branches use credentials, encoded route/query parameters, and HTTP error handling. The current endpoint paths are integration placeholders, not a claim that those backend routes already exist. Keep the service return types in `home.api-types.ts` stable so the components need no endpoint-specific changes. Connect the real authentication adapter in `auth.service.ts` at the same time; mock login is disabled when the shared flag is off.

Library changes save in order through the service. A failed save keeps the visible changes and offers **Retry save**. Pending requests cannot replace results for a newer search. Tests cover mock and HTTP branches, retries, stale responses, and persistence.
