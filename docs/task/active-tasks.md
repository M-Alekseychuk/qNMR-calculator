# Active Tasks & Backlog

## Current Sprint: Core-Doc Establishment (v1.2)

- [x] Establish root `README.md` with system overview, architecture tree, math foundation, and quick start.
- [x] Establish `AGENTS.md` containing strict domain boundaries, coding guidelines, and verification rules.
- [x] Establish `CLAUDE.md` rapid reference cheat sheet with math formulas, commands, and key invariants.
- [x] Create `/docs/context/` documentation:
  - [x] `system-overview.md` (Architecture, components, state sync)
  - [x] `domain-qnmr.md` (qNMR principles, relaxation, standards)
  - [x] `tech-stack.md` (React 19, TypeScript, Vite, Tailwind v4)
- [x] Create `/docs/memory/` documentation:
  - [x] `decisions-log.md` (ADRs on client-only architecture, PDF compression, multi-analyte, v3 keys)
  - [x] `lessons-learned.md` (PDF 13MB bug fix, zero-division guards, integral errors)
- [x] Create `/docs/spec/` documentation:
  - [x] `calculation-engine.md` (Detailed math, GUM uncertainty propagation)
  - [x] `standards-database.md` (Standard schemas, compound values, JSON I/O)
  - [x] `reporting-export.md` (PDF structure, layout, typography, autotable)
- [x] Create `/docs/task/` documentation:
  - [x] `roadmap.md` (Phase 1, 2, 3 milestones)
  - [x] `active-tasks.md` (This task checklist)

---

## Next Backlog Items

- [ ] Add unit test suite for `src/lib/qnmrMath.ts` covering edge cases (zero values, negative numbers, extreme ratios).
- [ ] Add replicate averaging utility in `CalculationHistory.tsx`.
- [ ] Add CSV export for session history.
