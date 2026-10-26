# CLAUDE.md — Developer Cheat Sheet & Quick Reference

## 🛠️ Essential Commands

```bash
# Development
npm run dev           # Start Vite dev server on http://localhost:3000

# Type-Checking & Linting
npm run lint          # Run tsc --noEmit to validate all TypeScript types

# Production Build
npm run build         # Bundle application into /dist via Vite
npm run preview       # Preview production build locally
```

---

## 📐 Mathematical Reference

### Primary Purity Equation:
$$P_x = \left(\frac{I_x}{I_{\text{ref}}}\right) \cdot \left(\frac{N_{\text{ref}}}{N_x}\right) \cdot \left(\frac{M_x}{M_{\text{ref}}}\right) \cdot \left(\frac{m_{\text{ref}}}{m_x}\right) \cdot P_{\text{ref}}$$

### Gaussian Uncertainty Propagation:
$$\left(\frac{u(P_x)}{P_x}\right)^2 = \left(\frac{u(I_x)}{I_x}\right)^2 + \left(\frac{u(I_{\text{ref}})}{I_{\text{ref}}}\right)^2 + \left(\frac{u(m_x)}{m_x}\right)^2 + \left(\frac{u(m_{\text{ref}})}{m_{\text{ref}}}\right)^2 + \left(\frac{u(P_{\text{ref}})}{P_{\text{ref}}}\right)^2$$
- $u(P_x) = P_x \times \frac{u(P_x)}{P_x}$
- Relative error percent $= \left(\frac{u(P_x)}{P_x}\right) \times 100\%$

---

## 🔑 Key Invariants & Rules

1. **jsPDF Instantiation**:
   - MUST always include `{ compress: true }`. Never omit this flag to prevent 13MB+ bloated PDF files.
2. **Numeric Inputs**:
   - Parse input fields safely via `Number(val)`.
   - Never allow division by zero or NaN propagation in `src/lib/qnmrMath.ts`.
3. **Tab Ordering**:
   - `Calculator` -> `Report` -> `qNMR standards` -> `Step-by-Step guide`.
4. **Header Style**:
   - White rounded rectangle card (`rounded-xl bg-white border border-slate-200/90 shadow-xs`) enclosing the logo.
   - Version badge `v1.2` rendered as a soft blue pill alongside bold `qNMR Calculator` title.
5. **No External Server Calls**:
   - Pure client-side calculations and local storage caching.
