# qNMR Calculator

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1.0.0-blue.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)

> **Precision quantitative Nuclear Magnetic Resonance (qNMR) concentration and purity determination with automated Gaussian error propagation, standard reference library, and PDF reporting.**

---

## 🔬 Overview

The **qNMR Calculator** is an analytical chemistry application engineered for both synthetic chemists and analytical research scientists in pharmaceutical and chemical laboratories. 

It implements the internationally recognized internal standard 1H-qNMR method (Eurachem / ISO / USP / Ph. Eur. principles) to determine sample purity (mass fraction % w/w) and residual solvent/impurity content with comprehensive uncertainty propagation.

### Core Capabilities

- **Primary & Multi-Analyte Purity Assay**: Calculate the purity of the primary target analyte alongside multiple secondary analytes or residual solvent impurities (e.g., residual EtOH, EtOAc, DCM, DMSO).
- **Automated Error Propagation**: Full Gaussian uncertainty propagation calculating absolute error (e.g., $\pm 0.45\%$) and relative percentage error based on balance uncertainties, internal standard purity, and signal integration tolerances.
- **qNMR Standards Library**: Curated database of primary and secondary reference standards (e.g., 1,3,5-Trimethoxybenzene, Dimethyl sulfone, Duroquinone, Maleic acid) with chemical shifts ($\delta$ ppm in $\text{CDCl}_3$ and $\text{DMSO-}d_6$), molecular weights, and signal multiplicities. Includes custom user standard addition, editing, and JSON backup/restore.
- **Standard Operating Procedure (SOP) / Step-by-Step Guide**: Interactive, editable protocol outlining weighing, dissolution, NMR acquisition parameters (12 min, $d_1 \ge 5 T_1$, 90°/30° flip angle), and spectral processing.
- **PDF Report**: Generates PDF reports with company logo branding, sample metadata, batch numbers, analytical parameters, vector formulas, and results tables with uncertainty intervals.
- **Session History & Benchmarking**: Save, recall, annotate, and compare multiple weighing runs or replicates with local persistence.

---

## 🗂️ Documentation Architecture

Following our core documentation establishment, documentation is organized into clear domains under `/docs` and root agent guidelines:

```text
├── docs/
│   ├── context/
│   │   ├── domain-qnmr.md         # Chemistry principles & internal standard method
│   │   ├── system-overview.md     # Architectural blueprint, component tree & state flow
│   │   └── tech-stack.md          # Runtime, frameworks, libraries & styling guidelines
│   ├── memory/
│   │   ├── decisions-log.md       # Architectural Decision Records (ADRs)
│   │   └── lessons-learned.md     # Engineering insights & PDF compression optimization
│   ├── spec/
│   │   ├── calculation-engine.md  # Mathematical equations & error propagation derivations
│   │   ├── standards-database.md  # Standard compounds schema & chemical shift database
│   │   └── reporting-export.md    # Report formatting, PDF generation & styling rules
│   ├── task/
│   │   ├── roadmap.md             # Multi-nuclear (19F/31P/13C), FID parser & cloud roadmap
│   │   └── active-tasks.md        # Current backlog & pending enhancements
│   └── PR_CORE_DOCS.md            # Pull request summary for core-doc establishment
├── public/
│   ├── assets/aistudio/           # Default logos, reference guides & attachments
│   └── default_logo.png           # Fallback application branding
├── src/
│   ├── components/
│   │   ├── Calculator.tsx         # Main qNMR calculation engine & analyte table
│   │   ├── CalculationHistory.tsx # Saved measurements, sessions & replicate statistics
│   │   ├── StandardsTable.tsx     # Reference standards database & custom standard editor
│   │   ├── StepGuide.tsx          # Step-by-step SOP guide with standard reset & export
│   │   ├── ReportTemplate.tsx     # Monospace raw text report & PDF exporter
│   │   ├── LogoModal.tsx          # Custom logo uploader, scaler & persistent storage
│   │   └── ConfirmModal.tsx       # Confirmation dialogs for non-destructive workflows
│   ├── lib/
│   │   ├── logoBase64.ts          # Default OPCP organization logo base64 asset
│   │   ├── qnmrMath.ts            # Purity calculations & Gaussian uncertainty formulas
│   │   └── utils.ts               # Class merging utilities (tailwind-merge / clsx)
│   ├── types.ts                   # Core TypeScript domain models (Compound, QNMRResult, etc.)
│   ├── App.tsx                    # Main navigation shell, header, and tab router
│   ├── index.css                  # Global Tailwind CSS imports & base styles
│   └── main.tsx                   # Application bootstrap & React 19 root
├── index.html                     # HTML5 entry point & metadata
├── metadata.json                  # AI Studio applet capabilities & permissions
├── package.json                   # Dependencies, scripts, and build configuration
├── tsconfig.json                  # TypeScript compiler configuration
└── vite.config.ts                 # Vite bundler, Tailwind plugin & server configuration
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation & Run

Either install latest version release (.exe)

or

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (Port 3000)
npm run dev

# 3. Type-check & lint
npm run lint

# 4. Production build
npm run build
```

---

## 🧮 Mathematical Foundation

The mass fraction purity $P_x$ (% w/w) of an unknown compound $X$ relative to a certified reference standard $\text{Ref}$ is computed by:

$$P_x = \frac{I_x}{I_{\text{ref}}} \cdot \frac{N_{\text{ref}}}{N_x} \cdot \frac{M_x}{M_{\text{ref}}} \cdot \frac{m_{\text{ref}}}{m_x} \cdot P_{\text{ref}}$$

Where:
- $I_x, I_{\text{ref}}$: Integrals of the chosen resonance signals
- $N_x, N_{\text{ref}}$: Number of resonating nuclei (protons) generating the signals
- $M_x, M_{\text{ref}}$: Molar masses ($\text{g/mol}$)
- $m_x, m_{\text{ref}}$: Weighed sample and reference masses ($\text{mg}$)
- $P_{\text{ref}}$: Certified purity of the reference standard (% w/w)

Uncertainty is propagated according to GUM / Eurachem guidelines:

$$\frac{u(P_x)}{P_x} = \sqrt{\left(\frac{u(I_x)}{I_x}\right)^2 + \left(\frac{u(I_{\text{ref}})}{I_{\text{ref}}}\right)^2 + \left(\frac{u(m_x)}{m_x}\right)^2 + \left(\frac{u(m_{\text{ref}})}{m_{\text{ref}}}\right)^2 + \left(\frac{u(P_{\text{ref}})}{P_{\text{ref}}}\right)^2}$$

For detailed derivations and error contribution breakdowns, see [`docs/spec/calculation-engine.md`](docs/spec/calculation-engine.md).

---

## 🔒 Offline & Data Privacy

This application runs **100% locally**. No compound names, analytical batches, masses, or spectral integrals are ever sent to external servers or third-party cloud services. Local calculations and saved sessions reside solely on youe device.

---

## 📄 License

GNU General Public License (GPL-3.0; https://www.gnu.org/licenses/gpl-3.0.html)
