# Decisions Log (Architectural Decision Records)

## ADR-001: Client-Side Only Architecture
- **Date**: 2026-08-15
- **Status**: Accepted
- **Context**: Analytical laboratories handle proprietary active pharmaceutical ingredients (APIs), undisclosed structures, and sensitive batch numbers. Cloud-based calculation APIs could violate confidentiality.
- **Decision**: All calculations, state persistence, PDF generation, and standard libraries operate entirely in-browser without sending telemetry or sample parameters to external servers.
- **Consequences**: Zero cloud operating costs, zero compliance risk for confidential formulas, 100% offline capability.

---

## ADR-002: jsPDF Flate Stream Compression
- **Date**: 2026-09-14
- **Status**: Accepted
- **Context**: Reports exported via default `new jsPDF()` produced unreasonably large PDF files (~13 MB) because uncompressed raster logo bitmaps and vector drawing commands were dumped as raw text streams into the PDF structure.
- **Decision**: Pass `{ compress: true }` when initializing jsPDF in `ReportTemplate.tsx`:
  ```typescript
  const doc = new jsPDF({ compress: true });
  ```
- **Consequences**: Exported PDF file sizes dropped by over 95% (down to ~300–400 KB) without any reduction in resolution, visual fidelity, or vector sharpness.

---

## ADR-003: Multi-Analyte & Residual Solvent Integration
- **Date**: 2026-08-28
- **Status**: Accepted
- **Context**: In synthetic chemistry, reaction products frequently contain residual organic solvents (e.g., ethyl acetate, ethanol, dichloromethane) or isomer mixtures alongside the main target API.
- **Decision**: Evolve state from single `analyte: Compound` to `analytes: Compound[]`. The user can add secondary analytes, label them as solvents, and calculate simultaneous mass fractions against the same internal standard.
- **Consequences**: The report and calculator accurately account for residual mass and total sample assay.

---

## ADR-004: Versioned LocalStorage Keys (`v3`)
- **Date**: 2026-09-01
- **Status**: Accepted
- **Context**: Schema modifications to the standards database and guide steps previously caused crashes when users loaded stale JSON objects saved by older versions.
- **Decision**: Adopt explicit versioning keys (`qnmr_standards_table_v3`, `qnmr_guide_steps_v3`) with graceful JSON parsing and automatic fallback to `DEFAULT_STANDARDS` on syntax or schema errors.
- **Consequences**: Bulletproof state hydration with no white-screen errors for returning users.

---

## ADR-005: Header Logo Framing & Version Badge
- **Date**: 2026-09-21
- **Status**: Accepted
- **Context**: Reference enterprise design featured an elevated white rounded rectangular card for the institution/company logo and an explicit version indicator (`v1.2`).
- **Decision**: Wrap `LOGO_BASE64` inside an elevated card (`rounded-xl bg-white border border-slate-200/90 shadow-xs`) and introduce an inline pill badge (`v1.2`) next to the bold title.
- **Consequences**: Consistent pharmaceutical branding across both light and dark backgrounds.
