# Manga frontend

This is an Angular 22 application using standalone components, signals, Angular Router, and Tailwind CSS 4.

- Preserve the current design, spacing, responsive breakpoints, and permanently visible navbar.
- Use typed service methods for data access. Keep runtime fixtures in `src/app/mocks/*-mocks.ts`; `USE_MOCKS` in `src/app/config/api.config.ts` selects the adapter.
- Group UI by feature under `src/app/features`; shared UI belongs in `src/app/shared`. Each component has a named folder with a `.ts` implementation, external `.html` template, and a colocated `.spec.ts` unit test. Do not embed templates in TypeScript.
- Keep all services in `src/app/services`, models in `src/app/models`, runtime mocks in `src/app/mocks`, and test-only mocks in `tests/mock`. Configuration belongs in `src/app/config` or `src/environments`.
- Component filenames have no type suffix (`login.ts`, `login.html`); use `.services.ts` for services and `.model.ts` for models. Keep generated files consistent with these conventions.
- Implement data access and shared state as Angular classes decorated with `@Injectable({ providedIn: "root" })`, not free-function wrappers. Use private writable signals with read-only public signals, computed projections, and explicit mutation methods. Inject `HttpClient` through `ApiClient` for HTTP and use `HttpTestingController` in service tests. Keep browser APIs behind the platform-aware storage service.
- API and auth methods return RxJS Observables for both mock and HTTP adapters. Use RxJS operators for composition, errors, cancellation and ordered saves; use `takeUntilDestroyed` for subscriptions. Do not convert production API streams to Promises or use async/await for API calls.
- Use `inject()`, signal inputs/state and `@if`/`@for` in new components. Keep templates strictly typed.
- Run `npm run lint`, `npm run test:coverage`, `npm run build`, and `npm run test:e2e` when relevant.
- `npm run dev` serves the app on port 3000. Playwright uses an isolated Angular server on port 3100.
