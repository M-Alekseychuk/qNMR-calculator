# AGENTS.md — Agent Constitution & Operational Guidelines

This document outlines the architectural boundaries, chemistry domain rules, code conventions, and workflows for automated agents and AI contributors working on the **Remix qNMR Calculator**.

---

## 1. Domain Principles & Non-Negotiables

1. **Analytical Accuracy**:
   - The qNMR formula must remain mathematically exact:
     $$P_x = \frac{I_x}{I_{\text{ref}}} \cdot \frac{N_{\text{ref}}}{N_x} \cdot \frac{M_x}{M_{\text{ref}}} \cdot \frac{m_{\text{ref}}}{m_x} \cdot P_{\text{ref}}$$
   - Never remove or alter error propagation algorithms without formal review against GUM / Eurachem guidelines.
   - All divisions must be protected against zero/NaN/negative values. If any input ($I_x, I_{\text{ref}}, N_x, N_{\text{ref}}, M_x, M_{\text{ref}}, m_x, m_{\text{ref}}$) is zero or empty, the calculation must fail safely returning `{ purity: 0, absoluteError: 0, relativeError: 0 }`.

2. **Scientific Units**:
   - Sample Mass: Milligrams ($\text{mg}$)
   - Standard Mass: Milligrams ($\text{mg}$)
   - Molar Mass: Grams per mole ($\text{g/mol}$)
   - Chemical Shifts: Parts per million ($\delta\text{ ppm}$)
   - Purity / Assay: Weight percent ($\%\text{ w/w}$)
   - Errors: Absolute uncertainty in $\%$ ($u(P_x)$) and relative uncertainty in $\%$ ($\frac{u(P_x)}{P_x} \times 100$).

3. **Client-Side Data Privacy**:
   - Do NOT send chemical data, sample IDs, or analytical results to external analytics, telemetries, or external LLMs.
   - Calculations and session state must run strictly in the browser runtime.

---

## 2. Codebase Architecture & File Responsibilities

```text
/
├── index.html                     # HTML5 entry with synced metadata & Aptos font
├── metadata.json                  # AI Studio capability & descriptor file
├── src/
│   ├── main.tsx                   # React 19 root bootstrap
│   ├── App.tsx                    # Shell layout: header, nav tabs, global dark mode
│   ├── types.ts                   # Core domain TypeScript models & schemas
│   ├── index.css                  # Global Tailwind v4 theme & font declarations
│   ├── components/
│   │   ├── Calculator.tsx         # Analyte(s) & reference forms, results card, session saver
│   │   ├── CalculationHistory.tsx # Saved measurements list, batch comparison & restore
│   │   ├── ReportTemplate.tsx     # GxP report preview, compressed PDF exporter & print layout
│   │   ├── StandardsTable.tsx     # Reference standards CRUD table, JSON import/export
│   │   ├── StepGuide.tsx          # Interactive SOP step guide with editable tips/warnings
│   │   └── ConfirmModal.tsx       # Accessible modal dialog for destructive actions
│   └── lib/
│       ├── qnmrMath.ts            # Mathematical purity & Gaussian error propagation engine
│       ├── logoBase64.ts          # Embedded vector/raster base64 logo for zero-network PDF export
│       └── utils.ts               # clsx + twMerge utility function
└── docs/                          # Comprehensive domain & engineering specifications
```

---

## 3. UI & Styling Guidelines

- **Tailwind CSS v4**: Imported via `@import "tailwindcss";` in `src/index.css`.
- **Zero-Pill Discipline**:
  - Do NOT overuse generic rounded-full badges across tables or forms.
  - Pills are reserved exclusively for targeted status chips or version tags (e.g. `v1.2` in the header).
  - Form inputs, cards, and buttons use standard clean geometry (`rounded-md`, `rounded-xl`, `rounded-2xl`).
- **Typography**:
  - Primary sans-serif: Inter / Aptos.
  - Monospace: JetBrains Mono for numeric values, formulas, and integration readings.
- **Accessibility**:
  - All interactive elements must maintain clear focus rings and descriptive `id` attributes.
  - High contrast must be maintained across both light and dark themes (`dark:` classes).

---

## 4. PDF Generation & Performance Rules

- **jsPDF Compression**:
  - **CRITICAL**: Whenever instantiating `jsPDF`, ALWAYS pass `{ compress: true }`:
    ```typescript
    const doc = new jsPDF({ compress: true });
    ```
  - Without compression, embedded logos and vectors result in bloated 13MB+ PDFs. With compression, PDFs stay under 500KB.
- **Dynamic Imports**:
  - Heavy export libraries like `jspdf-autotable` should be dynamically imported inside the click handler to preserve initial load speed.

---

## 5. State Persistence & LocalStorage Keys

When modifying or adding persistent state, use the established key namespace:

| Key | Purpose | Default / Fallback |
|---|---|---|
| `qnmr_analytes_state` | Active array of analytes & residual solvents | `[{ name: 'Unknown API', protons: 1, ... }]` |
| `qnmr_reference_state` | Active reference standard configuration | `1,3,5-Trimethoxybenzene` (99.9%) |
| `qnmr_last_deuterated_solvent` | Selected NMR deuterated solvent | `"Chloroform-d"` |
| `qnmr_measurements_state` | Saved session history array | `[]` |
| `qnmr_standards_table_v3` | Standards reference database | `DEFAULT_STANDARDS` list |
| `qnmr_guide_steps_v3` | Editable SOP steps and notes | `DEFAULT_STEPS` array |
| `qnmr_custom_logo` | User-uploaded organization logo dataURL | `DEFAULT_LOGO_BASE64` (OPCP Logo) |
| `qnmr_logo_scale` | Active logo scale percentage | `100` (Standard baseline) |

---

## 6. Verification Checklist for Agents

Before completing any task, execute:
1. `npm run lint` (`tsc --noEmit`) to verify zero type regressions.
2. `npm run build` (`vite build`) to confirm clean bundle compilation.
3. Verify that no changes broke the qNMR formula or introduced division by zero.
