# Task Board Frontend — Project State

## Current Status

**Phase 4: Scaffold & Authenticate** — IN PROGRESS (scaffold complete 2026-10-01; auth next)

Scoping phases complete: API contract consumed (all 15 endpoints verified against the regenerated OpenAPI spec), stack evaluated against 2026 market data, framework and accessibility decisions logged.

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
| OpenAPI spec sync          | `./openapi.yaml` vendored from task-api; weekly GitHub Action opens a sync PR on upstream change        |
| Phase 4 scaffold           | Completed 2026-10-01; Vite + TS strict, Router v7, TanStack Query v5, Tailwind/shadcn, lint, test stack |

## What's Next

| Step                                  | Owner                      | Completion Signal                                                          |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| Build auth login/register forms       | AI executor                | Token persists; login redirects to projects; logout clears token           |
| Protect routes                        | AI executor                | Unauthenticated users redirected from `/projects` and `/projects/:id`      |
| Identity rehydration (/users/me)      | AI executor                | Called on app start; user displayed in header                              |
| Verify all tests pass                 | Nick (manual verification) | Repo green; planted-bug checks pass                                        |

## Execution Guidance

- **Ratio**: Start at moderate (AI implements examples, Nick diffs strategically); loosen as TanStack Query/shadcn patterns establish
- **Verification**: Nick runs verification passes on each session; planted-bug checks asserted before commit
- **Docs**: Same-session updates to BUILD_PLAN.md, CLAUDE.md, README when decisions change
- **Accessibility**: jsx-a11y lint from scaffold; vitest-axe with test setup; manual keyboard/screen reader pass is a Phase 6 ship gate
- **Storybook**: Logged as stretch goal in polish phase only; ranks below refresh-token cookie hardening
- **API types**: `npm run generate:api` regenerates `src/api/schema.d.ts` from `./openapi.yaml` (openapi-typescript). Rerun and commit after merging each OpenAPI sync PR; never hand-edit the generated file

## Open Questions

| Question                      | Answer                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Forms handling                | Controlled components initially; add react-hook-form + zod if complexity warrants          |
| Drag-and-drop task reordering | Optional nice-to-have; defer until after CRUD works                                        |
| Storybook                     | Defer to polish phase; optional                                                            |
| Token storage                 | Access token in memory, refresh token in localStorage (2026-10-02 decision record); httpOnly cookie upgrade post-ship, ahead of Storybook |
| ESLint version                | Pinned to 9 on 2026-10-01 (deviation logged in DECISIONS.md); ESLint 9 is EOL, so revisit when jsx-a11y supports 10 |

## Dependencies

- task-api running locally (docker compose up -d db && npm run dev)
- Port 3000 free for backend
- Port 5173 free for frontend (Vite default; matches CORS_ORIGIN)

## Session Discipline

1. **Start of session** — Confirm what artifact we're building (one tangible thing)
2. **During session** — AI implements, Nick diffs strategically
3. **End of session** — Verify tests pass, planted-bug checks run, repo green
