# Calculation Engine Specification

## 1. Mathematical Purity Formulation

The calculation engine located at `src/lib/qnmrMath.ts` determines the mass fraction purity $P_x$ (expressed as a percentage weight-by-weight, $\%$ w/w) of an analyte $X$ relative to a reference standard $\text{Ref}$:

$$P_x = \frac{I_x}{I_{\text{ref}}} \times \frac{N_{\text{ref}}}{N_x} \times \frac{M_x}{M_{\text{ref}}} \times \frac{m_{\text{ref}}}{m_x} \times P_{\text{ref}}$$

### Variable Definitions

| Symbol | Parameter | Units | Input Type | Validation Constraints |
|---|---|---|---|---|
| $I_x$ | Analyte peak integral | Arbitrary units | `number \| string` | $> 0$ |
| $I_{\text{ref}}$ | Reference peak integral | Arbitrary units | `number \| string` | $> 0$ |
| $N_x$ | Number of protons generating analyte peak | Dimensionless | `number \| string` | Integer $\ge 1$ |
| $N_{\text{ref}}$ | Number of protons generating reference peak | Dimensionless | `number \| string` | Integer $\ge 1$ |
| $M_x$ | Analyte molecular weight | $\text{g/mol}$ | `number \| string` | $> 0$ |
| $M_{\text{ref}}$ | Reference standard molecular weight | $\text{g/mol}$ | `number \| string` | $> 0$ |
| $m_x$ | Weighed mass of sample | $\text{mg}$ | `number \| string` | $> 0$ |
| $m_{\text{ref}}$ | Weighed mass of reference standard | $\text{mg}$ | `number \| string` | $> 0$ |
| $P_{\text{ref}}$ | Certified purity of reference standard | $\%\text{ w/w}$ | `number \| string` | $0 < P_{\text{ref}} \le 100$ |

---

## 2. Gaussian Error Propagation (GUM / Eurachem)

Assuming all input variables are mutually independent and uncorrelated, the combined standard uncertainty $u_c(P_x)$ is derived via first-order Taylor series expansion:

$$u_c^2(P_x) = \sum_{i} \left(\frac{\partial P_x}{\partial y_i}\right)^2 u^2(y_i)$$

For a purely multiplicative/divisive model function:

$$P_x = f(I_x, I_{\text{ref}}, N_{\text{ref}}, N_x, M_x, M_{\text{ref}}, m_{\text{ref}}, m_x, P_{\text{ref}})$$

The relative combined variance simplifies to the quadrature sum of individual relative standard uncertainties:

$$\left(\frac{u(P_x)}{P_x}\right)^2 = \left(\frac{u(I_x)}{I_x}\right)^2 + \left(\frac{u(I_{\text{ref}})}{I_{\text{ref}}}\right)^2 + \left(\frac{u(m_x)}{m_x}\right)^2 + \left(\frac{u(m_{\text{ref}})}{m_{\text{ref}}}\right)^2 + \left(\frac{u(P_{\text{ref}})}{P_{\text{ref}}}\right)^2$$

*(Note: Molecular weights $M_x, M_{\text{ref}}$ and proton numbers $N_x, N_{\text{ref}}$ possess negligible isotopic uncertainties in standard analytical protocols and are treated as constants with $u = 0$.)*

### Component Uncertainty Defaults

1. **Analyte Integral Relative Uncertainty ($\frac{u(I_x)}{I_x}$)**:
   - Evaluated as $0.0$ when normalized as the comparative baseline.
2. **Reference Integral Relative Uncertainty ($\frac{u(I_{\text{ref}})}{I_{\text{ref}}}$)**:
   - If user provides $u(I_{\text{ref}})$: $\frac{u(I_{\text{ref}})}{I_{\text{ref}}}$
   - Default fallback: $0.01$ ($1.0\%$ relative integration error).
3. **Sample Mass Relative Uncertainty ($\frac{u(m_x)}{m_x}$)**:
   - If user provides balance tolerance $u(m_x)$ (e.g. $0.01\text{ mg}$ on analytical balance): $\frac{u(m_x)}{m_x}$
   - Default fallback: $0.005$ ($0.5\%$ relative weighing uncertainty).
4. **Reference Mass Relative Uncertainty ($\frac{u(m_{\text{ref}})}{m_{\text{ref}}}$)**:
   - Calculated as $\frac{u(m_{\text{ref}})}{m_{\text{ref}}}$ (e.g., $0.01\text{ mg} / 15.20\text{ mg}$).
   - Default fallback: $0.005$ ($0.5\%$).
5. **Reference Standard Certified Purity Uncertainty ($\frac{u(P_{\text{ref}})}{P_{\text{ref}}}$)**:
   - Calculated from manufacturer Certificate of Analysis (CoA): $\frac{u(P_{\text{ref}})}{P_{\text{ref}}}$.
   - Default fallback: $0.001$ ($0.1\%$).

### Final Output Metrics

$$\text{Relative Uncertainty (\%)} = \left(\frac{u(P_x)}{P_x}\right) \times 100\%$$

$$\text{Absolute Uncertainty (\% w/w)} = P_x \times \left(\frac{u(P_x)}{P_x}\right)$$

Reported Result Format: **$P_x \pm u(P_x)\%$** (e.g., $98.42 \pm 0.65\%$).
