# Product & Technical Roadmap

## Phase 1: Core Mathematical Stability & Client Precision (Completed)
- [x] Implement robust 1H-qNMR internal standard calculation engine.
- [x] Gaussian uncertainty propagation ($u_c(P_x)$ absolute and relative error).
- [x] Curated library of 12 primary reference standards with CDCl3 & DMSO-d6 shifts.
- [x] Interactive SOP step guide for laboratory analysts.
- [x] Compressed GxP-ready PDF reporting with jsPDF and autotable.
- [x] Multi-analyte and residual solvent impurity calculations.
- [x] Header redesign with elevated white rounded logo card and version pill (`v1.2`).

---

## Phase 2: Enhanced Spectral Utilities & Data Interoperability (Near-Term)
- [ ] **JCAMP-DX / CSV Spectral Peak Importer**:
  - Drag-and-drop parser for Bruker TopSpin, Mestrelab Mnova, or JEOL ASCII peak tables.
  - Automatic extraction of peak chemical shifts and raw integrals.
- [ ] **Expanded Multi-Nuclear Support**:
  - Native presets for $^{19}\text{F}$ qNMR (fluorinated standards like trifluoroacetic acid, BTF).
  - Native presets for $^{31}\text{P}$ qNMR (phosphorus assays via triphenyl phosphate).
  - Native presets for $^{13}\text{C}$ quantitative NMR using inverse-gated decoupling.
- [ ] **Replicate Batch Statistics**:
  - Mean, Standard Deviation ($s$), Relative Standard Deviation ($\text{RSD}\%$), and Student's $t$ confidence interval ($95\%$) across multiple weighings.

---

## Phase 3: GxP Compliance & Laboratory Integrations (Mid-Term)
- [ ] **Audit Trail & Event Log**:
  - Immutable local change log tracking parameter edits with timestamps and user initials.
- [ ] **ELN / LIMS Webhook Exporter**:
  - Direct JSON payload export to Electronic Lab Notebooks (LabArchives, Benchling, Dotmatics).
- [ ] **QR Code Verification**:
  - Embed cryptographic verification QR code on PDF reports linking to raw parameter hash.
