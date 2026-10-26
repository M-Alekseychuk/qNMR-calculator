# System Overview & Architecture

## 1. High-Level Architecture

The **Remix qNMR Calculator** is an enterprise-grade, single-page application (SPA) built with React 19, TypeScript, and Vite. The system is designed to provide immediate feedback, scientific precision, and strict client-side data security.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 Browser Window                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    App.tsx (Global State & Header)                    │  │
│  │   • Active Navigation Tabs (Calculator | Report | Standards | Guide)  │  │
│  │   • Dark / Light Theme Controller                                     │  │
│  │   • Central LocalStorage Sync for Analytes, References, & Sessions     │  │
│  └───────┬─────────────────┬───────────────────┬──────────────────┬──────┘  │
│          │                 │                   │                  │         │
│          ▼                 ▼                   ▼                  ▼         │
│  ┌──────────────┐  ┌──────────────┐   ┌─────────────────┐  ┌─────────────┐  │
│  │  Calculator  │  │    Report    │   │ qNMR Standards  │  │  Step Guide │  │
│  │  Component   │  │   Template   │   │     Table       │  │  Component  │  │
│  └───────┬──────┘  └───────┬──────┘   └────────┬────────┘  └──────┬──────┘  │
│          │                 │                   │                  │         │
│          │                 │                   │                  │         │
│          ▼                 ▼                   ▼                  ▼         │
│  ┌──────────────┐  ┌──────────────┐   ┌─────────────────┐  ┌─────────────┐  │
│  │  qnmrMath.ts │  │ jsPDF Engine │   │ LocalStorage v3 │  │ Custom SOPs │  │
│  │ (Math Engine)│  │ (Compressed) │   │ (JSON Exp/Imp)  │  │ (Notes/SOP) │  │
│  └──────────────┘  └──────────────┘   └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy & Data Flow

### 2.1 Root Component (`App.tsx`)
- Manages navigation state across four tabs:
  1. `calculator`: Main measurement workspace.
  2. `report`: Formal printable and PDF report generator.
  3. `standards`: Reference standard chemical shifts and properties database.
  4. `guide`: Step-by-step SOP guide with editable notes.
- Holds and syncs core state:
  - `analytes`: Array of analyte objects (target compound plus any residual solvents/impurities).
  - `reference`: Internal standard reference compound specifications.
  - `results`: Pre-calculated purity results with propagated uncertainty.
  - `measurements`: Stored calculation sessions / replicates.
  - `globalDeuteratedSolvent`: Selected NMR solvent (`Chloroform-d`, `DMSO-d6`, etc.).

### 2.2 Calculator Module (`Calculator.tsx`)
- **Analyte Form Card**: Allows configuring name, molecular weight, signal integral, proton count, sample mass, and balance tare uncertainty. Supports multiple analytes (e.g. compound + residual solvent signals).
- **Reference Standard Form Card**: Selects an internal standard from the library or user input, specifying reference purity, mass, proton count, integral, and associated uncertainties.
- **Results Display**: Instant dynamic recalculation whenever any field changes. Renders target purity (% w/w) and uncertainty with visual confidence badges.
- **Session Manager (`CalculationHistory.tsx`)**: Allows saving current calculation state with timestamps and notes, comparing replicates, and restoring past sessions.

### 2.3 Report Module (`ReportTemplate.tsx`)
- Generates an analytical report including:
  - Header branding and laboratory logo.
  - Sample identification, analyst, project ID, and date.
  - Instrument parameters & deuterated solvent.
  - Summary table with analyte name, integral, protons, molar mass, weighed mass, and purity.
  - Mathematical equations and uncertainty breakdown.
  - Sign-off fields for Analyst and Reviewer.
- Supports both browser **Native Print** (`window.print()`) and **Direct PDF Export** (`jsPDF` with Flate compression and `jspdf-autotable`).

### 2.4 Standards Library (`StandardsTable.tsx`)
- Pre-populated library of common qNMR standards with verified $^1\text{H}$ chemical shifts in $\text{CDCl}_3$ and $\text{DMSO-}d_6$.
- Full CRUD interface for editing molecular weights, chemical shifts, or adding internal laboratory standards.
- Export/Import standards to/from JSON for cross-bench sharing.

### 2.5 SOP Step Guide (`StepGuide.tsx`)
- Four-stage interactive workflow:
  1. Internal standard weighing.
  2. Sample weighing.
  3. Sample dissolution and NMR tube preparation.
  4. Spectral acquisition (pulse program, relaxation delay, processing) and integration.
- Supports adding custom tips, warnings, and laboratory-specific instructions.

---

## 3. State Management & Persistence

All states persist seamlessly in `localStorage` to guard against accidental page refreshes:
- Initial state hydrates from `localStorage` using lazy initializer functions (`useState(() => ...)`).
- Synchronous effect hooks write mutations back immediately.
- Corrupted or legacy data structures are handled through defensive `try/catch` fallbacks to default values.
