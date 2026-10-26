export type Compound = {
  name: string;
  integral: number | string;
  integralError: number | string;
  protons: number | string;
  molarMass: number | string;
  mass: number | string;
  massError: number | string;
  purity?: number | string;
  purityError?: number | string;
  supplier?: string;
  batchCode?: string;
  internalCode?: string;
  chemicalShift?: string;
  isSolvent?: boolean;
};

export type SavedSolvent = {
  id: string;
  name: string;
  protons: number | string;
  molarMass: number | string;
};

export type SavedDeuteratedSolvent = {
  id: string;
  name: string;
};

export type QNMRResult = {
  purity: number;
  absoluteError: number;
  relativeError: number;
};

export type ReportData = {
  analyte_name: string;
  ref_name: string;
  analyte_integral: number | string;
  ref_integral: number | string;
  analyte_protons: number | string;
  ref_protons: number | string;
  analyte_mass: number | string;
  ref_mass: number | string;
  analyte_molar_mass: number | string;
  ref_molar_mass: number | string;
  ref_purity: number | string;
  ref_supplier?: string;
  ref_batch_code?: string;
  ref_internal_code?: string;
  calculated_purity: number;
  calculated_error: number;
  date: string;
};

export type SavedCalculationSession = {
  id: string;
  timestamp: string; // ISO string
  title: string;
  analytes: Compound[];
  reference: Compound;
  results: (QNMRResult | null)[];
  notes?: string;
  measurements?: SavedCalculationSession[];
};
