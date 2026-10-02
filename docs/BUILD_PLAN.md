# Task Board Frontend — Build Plan

## Project Overview

Consumer-facing React/TypeScript frontend consuming the existing task-api backend. Completes the full-stack portfolio thesis: REST task management API (shipped 2026-09-22) + dashboard frontend.

## Ship Criteria

| Criterion                   | Definition                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Functional CRUD             | Create, read, update, delete tasks and projects; operations sync with backend         |
| Authentication integrated   | Login/logout flow works; protected routes only accessible with valid token            |
| Visually coherent interface | Consistent spacing, typography, color scheme; responsive layout; loading/error states |
| Passing tests               | Component tests pass; integration tests pass; test coverage acceptable for portfolio  |
| Accessibility               | WCAG 2.2 Level AA: automated checks clean, manual verification pass completed         |

## Completed: Scoping Phases

| Phase                         | Status   | Deliverable                                                                           |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Phase 1: Consume API Contract | COMPLETE | OpenAPI spec fully typed; all 15 endpoints cataloged; auth flow mapped; CORS resolved |
| Phase 2: Stack Evaluation     | COMPLETE | Vite + React selected after 2026 market-data verification; alternatives documented    |
| Phase 3: Framework Decision   | COMPLETE | Decision records logged (see docs/DECISIONS.md); plan documents drafted               |

## Technology Stack

### Core

| Layer        | Choice          | Version/Notes                      |
| ------------ | --------------- | ---------------------------------- |
| Build        | Vite            | Latest stable                      |
| Language     | TypeScript      | Strict mode                        |
| UI           | React           | 18+                                |
| Router       | React Router v7 | Library mode                       |
| Server state | TanStack Query  | v5 (latest major; no v6 exists)    |
| Styling      | Tailwind CSS    | v4                                 |
| Components   | shadcn/ui       | Copy-paste into repo; own all code |

### Supporting

| Layer           | Choice                                                                 | Notes                                                                                                    |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Forms           | Controlled components (or react-hook-form + zod if forms grow complex) | Start minimal, add only if forms hurt                                                                    |
| Formatting      | Prettier 3 + eslint-config-prettier                                    | `.prettierrc.json` mirrors task-api; `openapi.yaml` and generated `schema.d.ts` excluded                 |
| A11y lint       | eslint-plugin-jsx-a11y                                                 | 43 rules, author-time feedback; run from scaffold onward                                                 |
| Testing         | Vitest + Testing Library + MSW + vitest-axe                            | Matches backend tooling; MSW mocks API at network layer; axe-core against rendered DOM                   |
| Type generation | openapi-typescript                                                     | Generate from vendored `./openapi.yaml` (synced weekly from task-api via PR); zero hand-typed interfaces |

### Post-Ship Upgrades (Priority Order)

| Priority | Layer                   | Choice                                              | When to add                                          |
| -------- | ----------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| 1        | Refresh token hardening | httpOnly cookie for refresh token (task-api change) | After core ship; before Storybook (see DECISIONS.md) |
| 2        | Component gallery       | Storybook (with @storybook/addon-a11y)              | After core ship; polish phase only; optional         |

## Architecture Principles

1. **Types from contract** — All data types generated from openapi.yaml; drift impossible by construction
2. **Minimal client state** — No global state library; tokens live in a plain module (`token-store.ts`) so the non-React fetch client can read them, with a small context provider on top so components re-render on login/logout
3. **Ownership over convenience** — shadcn/ui components copied into repo, not installed as dependency
4. **Verification-first** — Planted-bug checks on any test suite; every session ends green
5. **Document decisions same-session** — When a choice changes, update BUILD_PLAN.md, CLAUDE.md, README together

## Accessibility

Target: WCAG 2.2 Level AA, enforced in three layers. eslint-plugin-jsx-a11y lints JSX at author time (from scaffold); vitest-axe asserts no axe-core violations on rendered component DOM (from test setup); manual verification (keyboard-only navigation pass plus screen reader spot check) is a Phase 6 ship gate. Automated tools catch roughly 30-50% of WCAG issues, so they supplement rather than replace the manual pass, mirroring the project's verification doctrine. Build practices: semantic HTML first, focus management on route and modal changes, labeled form controls, prefers-reduced-motion on animations, accessible Testing Library queries (getByRole, getByLabelText). See decision record dated 2026-09-30 in docs/DECISIONS.md.

## Phases

### Phase 4: Scaffold & Authenticate

| Milestone                        | Success Criteria                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Vite + React project initialized | TypeScript strict mode enabled; Tailwind configured                                             |
| React Router wired up            | Routes exist: `/login`, `/register`, `/projects`, `/projects/:id`                               |
| Auth flow functional             | Login redirects to projects; logout clears token; protected routes reject unauthenticated users |
| Identity rehydration             | `GET /users/me` called on app start; user displayed in header                                   |

### Phase 5: Projects & Tasks CRUD

| Milestone                  | Success Criteria                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Project list renders       | Bare array from `GET /projects` displayed; empty state handled                                 |
| Project create/edit/delete | Forms work; optimistic updates or reload after mutation; validation errors shown               |
| Task list renders          | Tasks from `GET /projects/:id/tasks` displayed in project detail                               |
| Task create/edit/delete    | Forms work; status/priority/dueDate fields functional; drag-to-reorder optional (nice-to-have) |
| Accessibility tests online | vitest-axe asserting no violations on key components                                           |

### Phase 6: Polish & Ship

| Milestone              | Success Criteria                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loading states         | Skeletons or spinners during fetch                                                                                              |
| Error states           | Network failures handled gracefully; retry logic in place                                                                       |
| Responsive design      | Works on mobile and desktop; breakpoints defined                                                                                |
| Tests written          | Component tests for key flows; integration tests with MSW                                                                       |
| Accessibility verified | jsx-a11y clean in CI; vitest-axe no violations on key components; manual keyboard-only and screen reader pass completed by Nick |
| Documentation complete | README describes how to run; architecture decisions logged                                                                      |

## Execution Ratio

**Mode: Familiar Work (High Ratio)**
React + TypeScript is proven competence. TanStack Query and shadcn/ui are new-but-not-foreign territory (small APIs, similar mental models to known tools). Start at moderate ratio, loosen quickly as patterns establish.

**Constants across modes:**

- Verification passes by Nick's own hands
- Planted-bug checks on any test suite
- Every session ends with repo green

## Timeline (Estimated, Buffered)

| Phase     | Duration (Raw) | Duration (Buffered 1.3x) |
| --------- | -------------- | ------------------------ |
| Phase 4   | 3 days         | 4 days                   |
| Phase 5   | 5 days         | 6-7 days                 |
| Phase 6   | 2 days         | 3 days                   |
| **Total** | **10 days**    | **13-14 days**           |

Buffers are standing practice, not exceptions.
