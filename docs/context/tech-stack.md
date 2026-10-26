# Technology Stack & Environment

## 1. Core Framework & Build Tooling

- **Runtime Environment**: Browser-native Single Page Application (SPA).
- **Language**: TypeScript 5.8 (Strict typing, `noEmit: true`, bundler module resolution).
- **Core Framework**: React 19 (`react` 19.0.1, `react-dom` 19.0.1) using modern functional components, standard hooks (`useState`, `useEffect`, `useMemo`), and lazy initializers.
- **Bundler & Dev Server**: Vite 6.2 with `@vitejs/plugin-react` and `@tailwindcss/vite`.
  - Development port: `3000`.
  - Path alias: `@/*` mapped to workspace root.

---

## 2. Dependencies & Purpose

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | `^19.0.1` | UI declarative rendering engine |
| `lucide-react` | `^0.546.0` | Comprehensive SVG icons (Calculator, FileText, Database, BookOpen, Sun, Moon) |
| `jspdf` | `^4.2.1` | Client-side PDF generation engine (configured with Flate stream compression) |
| `jspdf-autotable` | `^5.0.8` | Formatted table plugin for jsPDF reports |
| `file-saver` | `^2.0.5` | Browser file downloads for JSON standard backups and guide exports |
| `papaparse` | `^5.5.4` | CSV data parsing for tabular data workflows |
| `clsx` / `tailwind-merge` | `^2.1.1` / `^3.6.0` | Conditional and conflict-free Tailwind CSS class concatenation |
| `motion` | `^12.23.24` | Smooth transitions and layout animations |

---

## 3. Styling & Theming

- **Tailwind CSS v4**: Installed through modern `@tailwindcss/vite` plugin.
  - Configuration in `src/index.css` via `@import "tailwindcss";` and `@theme`.
  - Fonts: Inter (sans-serif), JetBrains Mono (monospace), Aptos (report typography).
- **Dark Mode**:
  - Controlled via class `.dark` applied to `document.documentElement`.
  - Persistent state in memory with smooth transition colors (`transition-colors duration-200`).
- **Print Optimization**:
  - Media queries configured via Tailwind `print:` classes.
  - Navigation header, action buttons, and edit controls hidden via `print:hidden`.
  - Report container styled for standard A4 / US-Letter paper formatting.
