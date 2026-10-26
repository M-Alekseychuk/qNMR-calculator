# Standards Database Specification

## 1. Schema Definition

The reference standards library represents internal reference compounds characterized by certified purities, high boiling points, and well-resolved singlet or multiplet resonances.

```typescript
export interface StandardItem {
  id: string;          // Unique identifier (UUID or numeric string)
  name: string;        // Full chemical IUPAC or common name
  mw: number;          // Molecular weight in g/mol
  shiftCDCl3: string;  // 1H chemical shifts and multiplicities in CDCl3 (ppm)
  shiftDMSO: string;   // 1H chemical shifts and multiplicities in DMSO-d6 (ppm)
}
```

---

## 2. Default Curated Standards Library

| ID | Compound Name | MW (g/mol) | $\delta$ in $\text{CDCl}_3$ (ppm) | $\delta$ in $\text{DMSO-}d_6$ (ppm) | Optimal Application |
|---|---|---|---|---|---|
| `1` | **1,3,5-Trimethoxybenzene** | 168.19 | 6.1 (s), 3.8 (s) | 6.1 (s), 3.7 (s) | Universal mid-field standard |
| `2` | **Dimethyl malonic acid** | 132.12 | --- *(insoluble)* | 1.3 (s) | High-field singlet for polar solvents |
| `3` | **Dimethyl sulfone** | 94.13 | 3.0 (s) | 3.0 (s) | High proton density (6H) at 3.0 ppm |
| `4` | **Dimethyl terephthalate** | 194.19 | 8.1 (s), 4.0 (s) | 8.1 (s), 3.9 (s) | Low-field aromatic & ester resonance |
| `5` | **Duroquinone** | 164.20 | 2.0 (s) | 2.0 (s) | 12H singlet, ideal for small sample masses |
| `6` | **Tecnazen** | 260.89 | 7.8 (s) | 8.5 (s) | Non-interfering downfield aromatic |
| `7` | **Benzyl benzoate** | 212.24 | 5.4 (s), 8.1 (m) | 5.4 (s), 8.0 (m) | Non-volatile liquid standard |
| `8` | **Ethylene carbonate** | 88.06 | 4.5 (s) | 4.5 (s) | Clean 4H singlet at 4.5 ppm |
| `9` | **1,2,4,5-Tetramethylbenzene** | 134.22 | 7.0 (s), 2.2 (s) | 6.9 (s), 2.1 (s) | Hydrocarbon / hydrophobic standard |
| `10` | **Mesitylene** | 120.19 | 2.26 (s), 6.78 (s) | --- | Volatile liquid; requires rapid weighing |
| `11` | **Diphenylmethane** | 168.24 | 3.93 (s), 7.1-7.3 (m) | --- | Aromatic + aliphatic singlet (2H) |
| `12` | **1-chloro-4-nitro-2-(CF3)benzene** | 225.55 | --- | --- | Standard for 19F & 1H cross-calibration |

---

## 3. Data Integrity & Storage Rules

- **LocalStorage Key**: `qnmr_standards_table_v3`
- **Fallback Rule**: If the stored value in `localStorage` is `null`, empty, or corrupt, the application automatically re-seeds from `DEFAULT_STANDARDS`.
- **JSON Import / Export**:
  - Export format: Plain JSON file containing an array of `StandardItem` objects.
  - Import validation: Validates presence of `id`, `name`, `mw`, `shiftCDCl3`, and `shiftDMSO`.
