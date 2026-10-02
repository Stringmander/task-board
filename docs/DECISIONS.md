# Decision Records

Dated records of architectural and tooling decisions, each with rationale. Append new entries at the bottom; never edit closed records except to log deviations (see Deviations section per record).

---

## 2026-09-30: Framework Selection — Vite + React

### Decision

Use **Vite + React** for the Task Board Frontend.

### Alternatives Considered

| Framework                | Reason Rejected                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 14+ (App Router) | Overkill for SPA consuming external API; Server Components add complexity without architectural payoff when backend is separate process |
| SolidStart               | Smaller ecosystem; hiring signal weaker than React despite technical merits                                                             |
| Astro                    | Wrong tool for interactive app; islands architecture solves problems we don't have                                                      |

### Rationale

1. **Architectural fit** — The task-api is a pure REST backend. The frontend is a single dashboard. Vite + React is the minimal, obvious choice. The backend's CORS config defaulting to `localhost:5173` telegraphs this was always the intended consumer.

2. **Verified against 2026 market data** — React remains the most in-demand frontend framework globally (~40% usage per Statista). For SPAs/dashboards/auth-gated tools, sources converge on Vite + React as the right tool.

3. **Hiring answer exists** — "Why Vite over Next.js?" has a strong answer: "Server Components shine when view and data layers share a runtime. Mine are separated by a REST contract on purpose, so client-rendered SPA is the architecturally honest choice."

4. **Skill coverage** — React + TypeScript demonstrates hireable competence without requiring Next.js keyword stuffing.

### Implications

- Routing: React Router v7
- Server state: TanStack Query v6
- Styling: Tailwind CSS v4 + shadcn/ui
- No SSR story needed; all rendering client-side

### Review

Approved by: Nick
Review date: 2026-09-30

### Deviations

- **2026-10-01: TanStack Query v5, not v6.** The Implications above name TanStack Query v6, but no v6 exists on npm (no stable, prerelease, or dist-tag); the latest major is v5 (5.104.0 at scaffold time). Installed `@tanstack/react-query@^5`. The choice of TanStack Query is unaffected; only the version label was wrong. BUILD_PLAN.md corrected the same day.

---

## 2026-09-30: Accessibility Commitment — WCAG 2.2 Level AA

### Decision

Target WCAG 2.2 Level AA, enforced through layered tooling plus manual verification.

### Rationale

1. **Career relevance** — Accessibility compliance is now a legal requirement in several markets. "WCAG 2.2 AA, verified with automated + manual passes" on the README is a differentiator.

2. **Stack synergy** — shadcn/ui's Radix primitives provide keyboard/focus/ARIA handling; incremental effort is modest.

3. **Honest constraint documented** — Automated tools catch roughly 30-50% of WCAG issues. Automated checks supplement, never replace, manual verification. (Aligned with project verification doctrine.)

### Tooling Layers

| Layer               | Tool                                          | Phase               |
| ------------------- | --------------------------------------------- | ------------------- |
| Lint                | eslint-plugin-jsx-a11y (43 rules)             | 4 (scaffold)        |
| Component tests     | vitest-axe                                    | 5 (with test setup) |
| Manual verification | Keyboard-only pass + screen reader spot check | 6 (ship gate)       |

### Compatibility Note

As of August 2026 there is no ESLint 10-compatible release of eslint-plugin-jsx-a11y. If the scaffold resolves ESLint 10, pin to ESLint 9 for linting or track the plugin's compatibility release. Log deviation here if pinning becomes necessary.

### Build Practice Focus Points

Semantic HTML first (~80% of a11y), focus management on route changes and modal open/close, labeled form controls, prefers-reduced-motion on animations, accessible Testing Library queries (getByRole, getByLabelText).

### Review

Approved by: Nick
Review date: 2026-09-30

### Deviations

- **2026-10-01: ESLint pinned to 9.** At scaffold time the latest ESLint was 10.11.0, while eslint-plugin-jsx-a11y 6.10.2 (latest, last published 2024-10) declares peer `eslint: ^3 … ^9`. Per the compatibility note above, ESLint is pinned to `^9` (resolved 9.39.5) with `@eslint/js@^9`. Caveat: npm marks ESLint 9.39.5 as deprecated ("no longer supported"), so this pin is a holding position, not a resting one. Revisit when jsx-a11y ships ESLint 10 support.
- **2026-10-01: Clarification, vitest-axe timing (no change of plan).** "5 (with test setup)" in the Tooling Layers table refers to when component axe tests are written, not when the tool is installed. The tooling was installed and wired during the Phase 4 scaffold (matcher registration in `src/test/setup.ts`, one pipeline-proving test on `ApiStatus`). Axe assertions for app components are written alongside those components in Phase 5, as planned.

---

## 2026-10-01: OpenAPI Spec Sync Policy

### Decision

Vendor task-api's `openapi.yaml` into this repo and keep it current with a scheduled GitHub Action that opens a pull request when upstream changes.

### Policy

| Aspect           | Choice                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Location         | Repo root, `./openapi.yaml` (mirrors task-api's convention)                                     |
| Source           | `Stringmander/task-api@main` (public; fetched anonymously, no secrets)                          |
| Cadence          | Weekly, Monday 06:00 UTC, plus `workflow_dispatch` for manual runs after backend changes        |
| Commit policy    | Pull request on branch `chore/sync-openapi`, never a direct commit to main                      |
| Change signal    | The PR is the alert; the workflow stays green when upstream changes                             |
| Change detection | Spec body compared with the provenance header stripped; unchanged upstream is a no-op          |
| Provenance       | Header at top of `openapi.yaml` records source commit SHA and last-sync date                    |

### Rationale

1. **Review before merge** — Contract changes can break generated types. A PR gives a checkpoint to read the diff for breaking changes before they reach main.
2. **One signal, not two** — Failing the run on change would duplicate the PR as an alert and paint every legitimate update red.
3. **Weekly balances noise and drift** — Daily is mostly no-op runs while the backend is stable; manual dispatch covers urgent syncs.
4. **Header excluded from comparison** — Otherwise the date stamp alone would register as a change every run.

### Implementation

- Workflow: `.github/workflows/sync-openapi.yml`
- Logic: `scripts/sync-openapi.sh` (same script runs locally; run from repo root to sync on demand)
- Never hand-edit `openapi.yaml`; change the spec in task-api.

### Review

Approved by: Nick
Review date: 2026-10-01

---

## 2026-10-02: Auth Token Storage — Access in Memory, Refresh in localStorage

### Decision

Hold the access token in memory only and persist the refresh token in localStorage. On app start, exchange the refresh token for a fresh pair, then call `GET /users/me`. Upgrade path: move the refresh token to an httpOnly cookie after core ship.

### Constraints (from task-api, verified 2026-10-02)

- Access token: 15-minute JWT (`src/lib/tokens.ts`)
- Refresh token: 7-day JWT, single-use; `/auth/refresh` deletes the presented token and issues a new pair in one atomic statement, so concurrent refreshes with the same token mean one gets a 401
- Both tokens travel in JSON bodies; task-api sets no cookies, so any client-side storage is script-readable

### Alternatives Considered

| Option                                      | Reason Rejected (for now)                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Both tokens in localStorage                 | Same XSS exposure as the chosen option, plus a possibly-expired access token in storage on boot                              |
| Refresh token in httpOnly cookie            | Strongest option, but requires a task-api change (cookie handling, CORS credentials, contract change, tests); out of Phase 4 scope |
| Both tokens in memory only                  | Logs the user out on every reload                                                                                            |

### Rationale

1. **Deterministic boot** — Every load runs refresh → `/users/me`, which is exactly the identity-rehydration milestone; no stale access token to trip over.
2. **Upgrade-shaped** — `token-store.ts` exposes get/set/clear, so moving the refresh token to a cookie touches only the store and the refresh call.
3. **Honest threat model** — Security gain over all-localStorage is marginal: a stolen refresh token still mints access tokens for up to 7 days. No storage choice stops XSS from acting within an open tab; httpOnly only stops exfiltration of a durable session. Primary XSS defence remains not having XSS (React escaping, no `dangerouslySetInnerHTML`, lean dependencies).

### Implementation Notes

- `src/auth/token-store.ts` — plain module (not React state) so `apiFetch` can read tokens; `AuthProvider` context wraps it for re-renders. Clarifies BUILD_PLAN.md Architecture Principle 2.
- `src/api/client.ts` — attaches `Authorization: Bearer`; on 401, refresh once and retry.
- **Single-flight refresh, in-tab and cross-tab.** Rotation makes concurrent refreshes destructive. Dedupe in-tab with a shared promise; serialize across tabs with `navigator.locks.request('token-refresh', …)` and re-read localStorage after acquiring the lock in case another tab already rotated.
- Logout is client-only (no endpoint): clear the store and the TanStack Query cache.

### Upgrade Path

Refresh token to httpOnly, Secure, SameSite cookie set by task-api. **Priority: first post-ship upgrade, ahead of Storybook** (Nick, 2026-10-02). Requires a task-api change and contract update, which will arrive here through the OpenAPI sync PR.

### Review

Approved by: Nick
Review date: 2026-10-02
