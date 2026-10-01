# Task Board Frontend — Project State

## Current Status

**Phase 4: Scaffold & Authenticate** — READY TO START

Scoping phases complete: API contract consumed (all 16 endpoints verified against the regenerated OpenAPI spec), stack evaluated against 2026 market data, framework and accessibility decisions logged.

## Repository Documents

- `docs/BUILD_PLAN.md` — Phases, ship criteria, tech stack, timeline
- `docs/DECISIONS.md` — Dated decision records with rationale (append new entries here)
- `CLAUDE.md` — This file; current state, next steps, execution guidance

## What's Done

| Item                       | Notes                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Backend API (task-api)     | Shipped 2026-09-22; REST API with JWT auth, 57 tests, Docker, CI                                        |
| API contract documentation | OpenAPI spec regenerated with response shapes; required arrays, status/priority enums added             |
| CORS configuration         | @fastify/cors configured with env-driven origin allowlist                                               |
| User identity route        | GET /users/me added to retrieve logged-in user's info                                                   |
| Stack decisions            | Vite + React selected after 2026 market-data verification; decision records logged in docs/DECISIONS.md |
| Accessibility commitment   | WCAG 2.2 AA target; layered tooling plus manual verification; decision record logged                    |
| Plan documents             | BUILD_PLAN.md and CLAUDE.md drafted and approved                                                        |

## What's Next

| Step                                                        | Owner                      | Completion Signal                                                  |
| ----------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------ |
| Initialize Vite + React project                             | AI executor                | npm run dev runs successfully                                      |
| Wire React Router (4 routes)                                | AI executor                | Navigation works between views                                     |
| Set up TanStack Query client                                | AI executor                | Data fetching example works                                        |
| Integrate shadcn/ui primitives                              | AI executor                | Button, input, modal components available                          |
| Configure a11y tooling (eslint-plugin-jsx-a11y, vitest-axe) | AI executor                | Lint passes with plugin enabled; axe test on sample component runs |
| Build auth login/register forms                             | AI executor                | Token persists; redirects work                                     |
| Verify all tests pass                                       | Nick (manual verification) | Repo green; planted-bug checks pass                                |

## Execution Guidance

- **Ratio**: Start at moderate (AI implements examples, Nick diffs strategically); loosen as TanStack Query/shadcn patterns establish
- **Verification**: Nick runs verification passes on each session; planted-bug checks asserted before commit
- **Docs**: Same-session updates to BUILD_PLAN.md, CLAUDE.md, README when decisions change
- **Accessibility**: jsx-a11y lint from scaffold; vitest-axe with test setup; manual keyboard/screen reader pass is a Phase 6 ship gate
- **Storybook**: Logged as stretch goal in polish phase only

## Open Questions

| Question                      | Answer                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Forms handling                | Controlled components initially; add react-hook-form + zod if complexity warrants          |
| Drag-and-drop task reordering | Optional nice-to-have; defer until after CRUD works                                        |
| Storybook                     | Defer to polish phase; optional                                                            |
| ESLint version                | Pin to 9 if jsx-a11y lacks ESLint 10 support at scaffold time; track compatibility release |

## Dependencies

- task-api running locally (docker compose up -d db && npm run dev)
- Port 3000 free for backend
- Port 5173 free for frontend (Vite default; matches CORS_ORIGIN)

## Session Discipline

1. **Start of session** — Confirm what artifact we're building (one tangible thing)
2. **During session** — AI implements, Nick diffs strategically
3. **End of session** — Verify tests pass, planted-bug checks run, repo green
