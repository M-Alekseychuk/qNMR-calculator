# Quantitative NMR (qNMR) Domain Context

## 1. Principles of 1H-qNMR

Nuclear Magnetic Resonance (NMR) is inherently a primary ratio method of measurement. Unlike chromatographic techniques (HPLC, GC) or UV-Vis spectroscopy, the response factor in NMR spectroscopy is identical for all non-exchangeable protons within a sample under fully relaxed conditions.

The resonance area (integral $I$) of a specific nucleus signal is directly proportional to the number of resonating spins $N$ and the molar concentration $c$ of the substance in the active coil volume:

$$I = k_s \cdot N \cdot c$$

Where $k_s$ is a spectrometer constant dependent on receiver gain, probe tuning, and temperature.

By introducing a certified internal reference standard ($\text{Ref}$) into the same NMR tube containing the target analyte ($X$), the spectrometer constant $k_s$ cancels out completely:

$$\frac{I_x}{I_{\text{ref}}} = \frac{N_x \cdot n_x}{N_{\text{ref}} \cdot n_{\text{ref}}}$$

Where $n$ is the amount of substance in moles ($n = \frac{m \cdot P}{M}$).

---

## 2. Experimental Requirements for Quantitative Precision

To achieve analytical accuracy suitable for pharmaceutical release or certified reference material (CRM) characterization ($u_{\text{rel}} < 1.0\%$), the experiment must adhere to standard qNMR criteria:

### 2.1 Relaxation Delay ($d_1$)
- Protons must undergo complete longitudinal relaxation between RF excitation pulses.
- For a **90° flip angle**, the recycle delay must be at least **$5 \times T_1$** (recovers $>99.3\%$ of equilibrium magnetization) or **$7 \times T_1$** (recovers $>99.9\%$).
- For a **30° flip angle** or **ergonomic 12-minute screening runs**, $d_1$ of 15–25 seconds is typically employed when $T_1$ values are moderate ($\sim 1\text{--}3\text{ s}$).

### 2.2 Signal-to-Noise Ratio (SNR)
- The analytical peak of interest should achieve $\text{SNR} \ge 250:1$ for $1.0\%$ uncertainty, and $\text{SNR} \ge 1000:1$ for high-precision assays ($0.1\%$).

### 2.3 Internal Standard Selection Criteria
1. **Solubility**: Standard and analyte must be completely soluble in the chosen deuterated solvent.
2. **Signal Isolation**: The chosen standard peak must be baseline-separated ($\Delta \delta > 0.2\text{ ppm}$) from all analyte signals, impurities, and residual solvent satellites.
3. **Non-Reactivity**: Standard must not undergo chemical exchange, precipitation, or acid-base reaction with the sample.
4. **Non-Volatility & Non-Hygroscopicity**: High boiling/sublimation point to avoid mass loss during weighing on microbalances.

---

## 3. Common Internal Standards in qNMR

| Standard | Molar Mass (g/mol) | $\delta$ in $\text{CDCl}_3$ (ppm) | $\delta$ in $\text{DMSO-}d_6$ (ppm) | Protons / Signal | Notes |
|---|---|---|---|---|---|
| **1,3,5-Trimethoxybenzene** | 168.19 | 6.1 (s), 3.8 (s) | 6.1 (s), 3.7 (s) | 3H (aromatic), 9H (methoxy) | Widely used, baseline separation in mid-field |
| **Dimethyl sulfone** | 94.13 | 3.0 (s) | 3.0 (s) | 6H (singlet) | Sharp singlet, high proton density |
| **Dimethyl terephthalate** | 194.19 | 8.1 (s), 4.0 (s) | 8.1 (s), 3.9 (s) | 4H (aromatic), 6H (ester) | Excellent for non-polar samples |
| **Duroquinone** | 164.20 | 2.0 (s) | 2.0 (s) | 12H (methyl singlet) | High signal intensity, clean singlet |
| **Tecnazen** | 260.89 | 7.8 (s) | 8.5 (s) | 1H (singlet) | Downfield aromatic resonance |
| **Benzyl benzoate** | 212.24 | 5.4 (s), 8.1 (m) | 5.4 (s), 8.0 (m) | 2H (benzylic) | Liquid standard |
| **Ethylene carbonate** | 88.06 | 4.5 (s) | 4.5 (s) | 4H (singlet) | Mid-field singlet |
| **Dimethyl malonic acid** | 132.12 | --- (insoluble) | 1.3 (s) | 6H (singlet) | Ideal for polar solvents ($\text{DMSO-}d_6$, $\text{D}_2\text{O}$) |
