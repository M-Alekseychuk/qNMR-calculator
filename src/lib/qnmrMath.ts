import { Compound, QNMRResult } from '../types';

export function calculateQNMR(analyte: Compound, reference: Compound): QNMRResult {
  const ax = Number(analyte.integral);
  const aref = Number(reference.integral);
  const px = Number(analyte.protons);
  const pref_num = Number(reference.protons);
  const mx = Number(analyte.molarMass);
  const mref = Number(reference.molarMass);
  const massx = Number(analyte.mass);
  const massref = Number(reference.mass);

  // Check for zeros to avoid division by zero
  if (!ax || !aref || !px || !pref_num || !mx || !mref || !massx || !massref) {
    return { purity: 0, absoluteError: 0, relativeError: 0 };
  }

  const refPurity = Number(reference.purity || 100);

  // Formula: P_x = (I_x / I_ref) * (N_ref / N_x) * (MW_x / MW_ref) * (m_ref / m_x) * P_ref
  const purity = (ax / aref) * 
                 (pref_num / px) * 
                 (mx / mref) * 
                 (massref / massx) * 
                 refPurity;

  // Error Propagation
  const ixErr = 0; // Assume analyte integral error is 0 as requested
  const irefErr = Number(reference.integralError) || 0;
  const mxErr = Number(analyte.massError) || 0;
  const mrefErr = Number(reference.massError) || 0;
  const prefErr = Number(reference.purityError) || 0;

  const relErrorIx = 0;
  const relErrorIref = irefErr ? (irefErr / aref) : 0.01;
  const relErrorMx = mxErr ? (mxErr / massx) : 0.005; // Default 0.5% mass error
  const relErrorMref = mrefErr ? (mrefErr / massref) : 0.005;
  const relErrorPref = prefErr ? (prefErr / refPurity) : 0.001; // Default 0.1% ref purity error

  const relativeErrorSquared = 
    Math.pow(relErrorIx, 2) + 
    Math.pow(relErrorIref, 2) + 
    Math.pow(relErrorMx, 2) + 
    Math.pow(relErrorMref, 2) + 
    Math.pow(relErrorPref, 2);

  const relativeError = Math.sqrt(relativeErrorSquared);
  const absoluteError = purity * relativeError;

  return {
    purity,
    absoluteError,
    relativeError: relativeError * 100 // as percentage
  };
}
