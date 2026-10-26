# PR: Establish Core Documentation Architecture (`feat/core-doc-establishment`)

## 📋 Summary

This PR establishes the standardized core documentation architecture for the **Remix qNMR Calculator** (`v1.2`). Inspired by standard production repository structures, it provides a comprehensive, domain-grounded documentation suite spanning system context, architectural decisions, technical specifications, agent guidelines, and project roadmaps.

---

## 📁 Changes Introduced

### 1. Root Operational & Agent Guides
- **`README.md`**: Project overview, key features, mathematical foundation, directory tree, installation, and usage instructions.
- **`AGENTS.md`**: Operational constitution for AI agents and automated tools, defining domain invariants, division-by-zero guards, scientific units, state keys, and verification checklists.
- **`CLAUDE.md`**: Rapid developer cheat sheet containing essential CLI commands, mathematical formulas, and critical invariants (e.g. mandatory jsPDF compression).

### 2. Comprehensive `/docs` Hierarchy
- **`docs/context/`**:
  - `system-overview.md`: High-level architecture, component hierarchy, data flow, and local storage state persistence.
  - `domain-qnmr.md`: Analytical chemistry foundations of quantitative $^1\text{H}$-NMR, relaxation delays ($d_1 \ge 5 T_1$), signal-to-noise ratios, and internal standard criteria.
  - `tech-stack.md`: Detailed breakdown of React 19, TypeScript, Vite, Tailwind v4, Lucide icons, and jsPDF.
- **`docs/memory/`**:
  - `decisions-log.md`: Architectural Decision Records (ADRs) covering client-side privacy, jsPDF Flate compression, multi-analyte residual solvent handling, and `v3` versioned storage keys.
  - `lessons-learned.md`: Historical technical retrospectives on PDF file size explosion, zero-division guards, and print stylesheet handling.
- **`docs/spec/`**:
  - `calculation-engine.md`: Rigorous mathematical equations, variable definitions, and Eurachem/GUM Gaussian error propagation derivations.
  - `standards-database.md`: Reference standards schema, default curated standard compounds, chemical shifts in $\text{CDCl}_3$ and $\text{DMSO-}d_6$, and JSON backup specifications.
  - `reporting-export.md`: Audit-ready report specifications, styling, autotable layouts, and PDF vector formulas.
- **`docs/task/`**:
  - `roadmap.md`: Three-phase project evolution roadmap (multi-nuclear qNMR, FID parsers, GxP audit trail).
  - `active-tasks.md`: Sprint checklist and active backlog items.

---

## 🔍 Verification & Integrity Checks

- [x] Ran `npm run lint` (`tsc --noEmit`): **Passed with 0 errors**.
- [x] Ran `npm run build` (`vite build`): **Build succeeded**.
- [x] Verified zero breakage of runtime code, mathematics, or UI components.
- [x] Git branch created: `feat/core-doc-establishment` with committed changes.
