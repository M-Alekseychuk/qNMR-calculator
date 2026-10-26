# Reporting & Export Specification

## 1. Overview

The reporting engine provides compliant, audit-ready documentation for experimental records, QC release, and peer-reviewed publication.

It supports dual output modes:
1. **Interactive Print Layout**: High-resolution vector DOM layout printable via browser print (`window.print()`).
2. **Native Compressed PDF**: Client-side document rendered via `jsPDF` and `jspdf-autotable`.

---

## 2. Report Sections & Content Structure

1. **Header Block**:
   - Laboratory logo (`LOGO_BASE64` PNG asset).
   - Document Title: `qNMR Analytical Report`.
   - Creation Date & Time (ISO localized string).
2. **Analytical Metadata**:
   - Sample Name / Batch Code / Internal Code.
   - Deuterated Solvent (e.g., $\text{CDCl}_3$, $\text{DMSO-}d_6$).
   - Acquisition pulse experiment ($12\text{ min}$, $30^\circ\text{ or }90^\circ$ pulse).
   - Reference standard supplier, catalog ID, and CoA certified purity $\pm u(P_{\text{ref}})$.
3. **Compound Data Table**:
   - Columns: `Component`, `Role`, `Integral (I)`, `Protons (N)`, `Molar Mass (g/mol)`, `Weighed Mass (mg)`, `Purity / Assay (%)`, `Uncertainty (±%)`.
   - Distinct row highlights for Primary Analyte, Residual Solvents, and Reference Standard.
4. **Calculated Purity Summary**:
   - Prominently styled callout box displaying:
     $$\text{Final Analyte Assay: } P_x \pm u(P_x)\% \text{ w/w}$$
   - Confidence bounds ($k=1$ coverage factor, $68\%$ Gaussian confidence interval).
5. **Mathematical Derivation & Formula Box**:
   - Explicit qNMR formula rendering with variable definitions.
6. **Sign-Off & Approval Block**:
   - Analyst Signature & Date line.
   - Reviewer / QA Approval line.

---

## 3. jsPDF Implementation Details

### 3.1 Compression Requirement
To ensure reasonable file sizes for laboratory document management systems (EDMS) and email attachments:
```typescript
const doc = new jsPDF({ 
  orientation: 'portrait', 
  unit: 'mm', 
  format: 'a4',
  compress: true 
});
```

### 3.2 Typography & Fonts
- Base Font: Helvetica (`doc.setFont("helvetica", "normal")`)
- Sizes:
  - Title: 14 pt, Bold
  - Section Headings: 11–12 pt, Bold
  - Body Text & Table Cells: 9–10 pt, Normal
  - Subscripts / Superscripts: 8 pt, Italic

### 3.3 Autotable Configuration
```typescript
autoTable(doc, {
  startY: currentY,
  head: [['Component', 'Role', 'Integral', 'Protons', 'MW (g/mol)', 'Mass (mg)', 'Result']],
  body: tableRows,
  theme: 'grid',
  headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, fontStyle: 'bold' },
  styles: { fontSize: 8.5, cellPadding: 2 },
  margin: { left: 14, right: 14 }
});
```
