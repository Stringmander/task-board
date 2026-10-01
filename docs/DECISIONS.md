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
