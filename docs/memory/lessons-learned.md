# Lessons Learned & Technical Retrospectives

## 1. PDF File Size Optimization in jsPDF
- **Symptom**: Exported PDF documents reached 13 MB for a single-page document.
- **Root Cause**: `jsPDF` creates uncompressed raw PDF streams by default. High-resolution embedded images (like base64 PNGs) are encoded uncompressed into ASCII hex/binary streams.
- **Resolution**: Initializing `new jsPDF({ compress: true })` applies zlib/Flate compression to all embedded binary objects, slashing file sizes to <400 KB.
- **Rule**: Never construct a `new jsPDF()` instance without `{ compress: true }`.

---

## 2. Division by Zero Protection in Analytical Math
- **Symptom**: Entering an incomplete formula or clearing an input caused `NaN%` or `Infinity%` purity outputs that cascaded into report templates and broke table rendering.
- **Root Cause**: Unchecked division in $P_x$ calculation where $I_{\text{ref}}$, $N_x$, $M_{\text{ref}}$, or $m_x$ equal zero or `""`.
- **Resolution**: Strict guard in `src/lib/qnmrMath.ts`:
  ```typescript
  if (!ax || !aref || !px || !pref_num || !mx || !mref || !massx || !massref) {
    return { purity: 0, absoluteError: 0, relativeError: 0 };
  }
  ```
- **Rule**: Mathematical calculation functions must return structured default zeros rather than throw or return `NaN`.

---

## 3. Integral Error Attribution
- **Observation**: Users frequently asked whether signal integration uncertainty should be split equally between analyte and reference.
- **Domain Practice**: In calibrated 1H-qNMR integration, the analyte integral $I_x$ is conventionally normalized or set as the reference baseline ($u(I_x) = 0$), while the relative integration variance between peaks is attributed to the reference standard or measured through signal-to-noise ratio:
  ```typescript
  const relErrorIref = irefErr ? (irefErr / aref) : 0.01; // default 1.0%
  ```

---

## 4. Dark Mode & High-Contrast Typography in Reports
- **Observation**: Printing directly while in Dark Mode previously produced black backgrounds with unreadable dark text on paper.
- **Resolution**: `ReportTemplate.tsx` enforces `bg-white` and explicit dark-to-light print overrides with `@media print`, while user actions (`print:hidden`) are omitted from print spoolers.
