import React, { useState, useEffect } from 'react';
import { Compound, QNMRResult, SavedCalculationSession } from '../types';
import { calculateQNMR } from '../lib/qnmrMath';
import { Calculator as CalcIcon, Percent, Scale, Activity, ArrowRight, Save, Download, Trash2, Upload, Bookmark, Check, History, X, Plus, Calculator as CalculatorIcon, Droplet } from 'lucide-react';
import { saveAs } from 'file-saver';
import CalculationHistory from './CalculationHistory';

const DEFAULT_STANDARDS: Compound[] = [
  { name: '1,2,4,5-Tetramethylbenzene', supplier: 'TCI', batchCode: 'H3AFF-GY', internalCode: 'INV-001321', protons: 2, molarMass: '134.21816', purity: '98.0', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: '1,3,5-Trimethoxybenzene', supplier: 'BLDpharm', batchCode: 'EQW053', internalCode: 'INV-000673', protons: 3, molarMass: 168.19, purity: '99.68', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: 'Dimethyl malonate', supplier: 'BLDpharm', batchCode: 'ERP218', internalCode: 'INV-000842', protons: 2, molarMass: '132.115', purity: '99.47', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: 'Dimethyl terephthalate', supplier: 'BLDpharm', batchCode: 'FMX386', internalCode: 'INV-001341', protons: 2, molarMass: '194.186', purity: '98.75', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: '2,3,5,6-Tetramethylcyclohexa-2,5-diene-1,4-dione', supplier: 'BLDpharm', batchCode: 'GSZ177', internalCode: 'INV-001318', protons: '3', molarMass: '164.20408', purity: '98.0', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: '1,2,4,5-Tetrachloro-3-nitrobenzene', supplier: 'TCI', batchCode: 'B7C7C-RN', internalCode: 'INV-001324', protons: '1', molarMass: '260.88', purity: '98.0', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: 'Benzyl benzoate', supplier: 'BLD', batchCode: 'EGA431', internalCode: 'INV-001319', protons: '2', molarMass: '212.248', purity: '99.50', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: 'Ethylene carbonate', supplier: 'BLD', batchCode: 'ETV771', internalCode: 'INV-001317', protons: '4', molarMass: '88.062', purity: '99.77', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: '1,3,5-Trimethylbenzene', supplier: 'TCI', batchCode: 'BZSUK-SQ', internalCode: 'INV-000846', protons: '3', molarMass: '120.195', purity: '97.0', integral: '', integralError: '', mass: '', massError: '0.01' },
  { name: '1-Chloro-4-nitro-2-(trifluoromethyl)benzene', supplier: 'BLDpharm', batchCode: 'ASX631', internalCode: 'INV-000879', protons: '1', molarMass: '225.55', purity: '98.0', integral: '', integralError: '', mass: '', massError: '0.01' }
];

const DEFAULT_RESIDUAL_SOLVENTS: Compound[] = [
  { name: 'Acetone', protons: '6', molarMass: '58.08', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Ethyl Acetate', protons: '3', molarMass: '88.11', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Heptane', protons: '3', molarMass: '100.21', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Water', protons: '2', molarMass: '18.015', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Acetonitrile', protons: '3', molarMass: '41.05', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Toluene', protons: '3', molarMass: '92.14', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Methanol', protons: '3', molarMass: '32.04', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Dimethyl Sulfoxide', protons: '6', molarMass: '78.13', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Dichloromethane', protons: '2', molarMass: '84.93', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Dimethylformamide', protons: '1', molarMass: '73.09', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true },
  { name: 'Tetrahydrofuran', protons: '4', molarMass: '72.11', integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true }
];

const DEFAULT_DEUTERATED_SOLVENTS = [
  "Acetonitrile-d₃",
  "Acetone-d₆",
  "Chloroform-d",
  "Deuterium oxide",
  "Dimethylsulfoxide-d₆",
  "Dimethylformamide-d₇",
  "Methanol-d₄",
  "Tetrahydrofuran-d₈"
];

const Fraction = ({ num, den, borderColor }: { num: React.ReactNode, den: React.ReactNode, borderColor?: string }) => (
  <span className={`inline-flex flex-col items-center justify-center align-middle mx-1 px-1.5 py-0.5 ${borderColor ? `border ${borderColor}` : ''}`} style={{ lineHeight: 1.2 }}>
    <span className="border-b border-slate-400 dark:border-slate-500 pb-0.5 mb-0.5 w-full text-center min-w-[1rem]">{num}</span>
    <span className="w-full text-center">{den}</span>
  </span>
);

const InputField = ({ label, value, onChange, unit = "", step = "0.01" }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">{label}</label>
    <div className="relative">
      <input 
        type="text" 
        inputMode="decimal"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200 font-mono text-sm transition-all"
      />
      {unit && <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">{unit}</span>}
    </div>
  </div>
);

interface CalculatorProps {
  analytes: Compound[];
  setAnalytes: React.Dispatch<React.SetStateAction<Compound[]>>;
  reference: Compound;
  setReference: React.Dispatch<React.SetStateAction<Compound>>;
  results: (QNMRResult | null)[];
  setResults: React.Dispatch<React.SetStateAction<(QNMRResult | null)[]>>;
  globalDeuteratedSolvent: string;
  setGlobalDeuteratedSolvent: React.Dispatch<React.SetStateAction<string>>;
  measurements: SavedCalculationSession[];
  setMeasurements: React.Dispatch<React.SetStateAction<SavedCalculationSession[]>>;
}

export default function Calculator({ 
  analytes, setAnalytes, 
  reference, setReference, 
  results, setResults,
  globalDeuteratedSolvent, setGlobalDeuteratedSolvent,
  measurements, setMeasurements
}: CalculatorProps) {
  const [standards, setStandards] = useState<Compound[]>(DEFAULT_STANDARDS);
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  
  const [residualSolventsList, setResidualSolventsList] = useState<Compound[]>(DEFAULT_RESIDUAL_SOLVENTS);
  const [deuteratedSolventsList, setDeuteratedSolventsList] = useState<string[]>(DEFAULT_DEUTERATED_SOLVENTS);
  const [customDeuteratedSolvent, setCustomDeuteratedSolvent] = useState<string>("");
  

  // Saved calculation sessions in local storage
  const [savedSessions, setSavedSessions] = useState<SavedCalculationSession[]>(() => {
    const saved = localStorage.getItem('qnmr_saved_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved sessions from localStorage', e);
      }
    }
    return [];
  });

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [sessionTitleInput, setSessionTitleInput] = useState('');
  const [sessionNotesInput, setSessionNotesInput] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const persistSessions = (newSessions: SavedCalculationSession[]) => {
    setSavedSessions(newSessions);
    localStorage.setItem('qnmr_saved_sessions', JSON.stringify(newSessions));
  };

  useEffect(() => {
    const saved = localStorage.getItem('qnmr_standards_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStandards(parsed);
        } else {
          setStandards(DEFAULT_STANDARDS);
        }
      } catch (e) {
        setStandards(DEFAULT_STANDARDS);
      }
    } else {
      setStandards(DEFAULT_STANDARDS);
    }
    
    const savedSolvents = localStorage.getItem('qnmr_residual_solvents_v1');
    if (savedSolvents) {
      try {
        const parsed = JSON.parse(savedSolvents);
        if (Array.isArray(parsed) && parsed.length > 0) setResidualSolventsList(parsed);
      } catch (e) { }
    }
    
    const savedDeutSolvents = localStorage.getItem('qnmr_deuterated_solvents_v1');
    if (savedDeutSolvents) {
      try {
        const parsed = JSON.parse(savedDeutSolvents);
        if (Array.isArray(parsed) && parsed.length > 0) setDeuteratedSolventsList(parsed);
      } catch (e) { }
    }
  }, []);

  const saveStandards = (newStandards: Compound[]) => {
    const validStandards = Array.isArray(newStandards) ? newStandards : DEFAULT_STANDARDS;
    setStandards(validStandards);
    localStorage.setItem('qnmr_standards_v4', JSON.stringify(validStandards));
  };

  const saveResidualSolvents = (newSolvents: Compound[]) => {
    setResidualSolventsList(newSolvents);
    localStorage.setItem('qnmr_residual_solvents_v1', JSON.stringify(newSolvents));
  };

  const saveDeuteratedSolvents = (newSolvents: string[]) => {
    setDeuteratedSolventsList(newSolvents);
    localStorage.setItem('qnmr_deuterated_solvents_v1', JSON.stringify(newSolvents));
  };

  const handleCalculate = () => {
    const res = analytes.map(analyte => calculateQNMR(analyte, reference));
    setResults(res);
  };

  const openSaveSessionModal = () => {
    const defaultTitle = `${analytes.map(a => a.name.trim()).filter(Boolean).join(', ') || 'Unknown Sample'} vs ${reference.name || 'Standard'}`;
    setSessionTitleInput(defaultTitle);
    setSessionNotesInput('');
    setIsSaveModalOpen(true);
  };

  const handleSaveCurrentSession = () => {
    const calculatedRes = results.some(r => r !== null) 
      ? results 
      : analytes.map(analyte => calculateQNMR(analyte, reference));
    
    // Auto-calculate if not yet calculated
    if (!results.some(r => r !== null)) {
      setResults(calculatedRes);
    }

    const now = new Date();
    const newSession: SavedCalculationSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      title: sessionTitleInput.trim() || `${analytes[0]?.name || 'Sample'} vs ${reference.name}`,
      analytes: JSON.parse(JSON.stringify(analytes)),
      reference: JSON.parse(JSON.stringify(reference)),
      results: JSON.parse(JSON.stringify(calculatedRes)),
      notes: sessionNotesInput.trim() || undefined,
      measurements: JSON.parse(JSON.stringify(measurements))
    };

    const updated = [newSession, ...savedSessions];
    persistSessions(updated);
    setIsSaveModalOpen(false);
    showNotification(`Calculation session "${newSession.title}" saved successfully!`);
  };

  const handleRestoreSession = (session: SavedCalculationSession) => {
    setAnalytes(JSON.parse(JSON.stringify(session.analytes)));
    setReference(JSON.parse(JSON.stringify(session.reference)));
    setResults(JSON.parse(JSON.stringify(session.results)));
    if (session.measurements) {
      setMeasurements(JSON.parse(JSON.stringify(session.measurements)));
    } else {
      setMeasurements([]);
    }
    showNotification(`Restored session "${session.title}" (${new Date(session.timestamp).toLocaleTimeString()})`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    persistSessions(updated);
    showNotification('Session removed from history.');
  };

  const handleClearAllSessions = () => {
    persistSessions([]);
    showNotification('All saved calculation history has been cleared.');
  };

  const handleUpdateSession = (id: string, updates: Partial<SavedCalculationSession>) => {
    const updated = savedSessions.map(s => s.id === id ? { ...s, ...updates } : s);
    persistSessions(updated);
    showNotification('Session details updated.');
  };

  const handleImportSessions = (imported: SavedCalculationSession[]) => {
    // Avoid duplicate IDs
    const existingIds = new Set(savedSessions.map(s => s.id));
    const newItems = imported.filter(s => !existingIds.has(s.id));
    const merged = [...newItems, ...savedSessions];
    persistSessions(merged);
    showNotification(`Imported ${newItems.length} session(s) successfully!`);
  };

  const handleAddAnalyte = (isSolvent: boolean = false) => {
    const defaultMass = analytes.length > 0 ? analytes[0].mass : '';
    setAnalytes([...analytes, {
      name: isSolvent ? 'Unknown Solvent' : `Unknown API ${analytes.filter(a => !a.isSolvent).length + 1}`,
      integral: '',
      integralError: '',
      protons: 1,
      molarMass: '',
      mass: defaultMass,
      massError: '0.01',
      isSolvent,
      chemicalShift: ''
    }]);
  };

  const handleRemoveAnalyte = (index: number) => {
    const newAnalytes = analytes.filter((_, i) => i !== index);
    setAnalytes(newAnalytes);
    if (results.length > index) {
      setResults(results.filter((_, i) => i !== index));
    }
  };

  const handleStandardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setSelectedStandard(selectedName);
    const selected = (standards || []).find(s => s.name === selectedName);
    if (selected) {
      setReference({
        name: selected.name || '',
        integral: selected.integral || '',
        integralError: selected.integralError || '',
        protons: selected.protons || '',
        molarMass: selected.molarMass || '',
        mass: selected.mass || '',
        massError: selected.massError || '0.01',
        purity: selected.purity || '',
        purityError: selected.purityError || '',
        supplier: selected.supplier || '',
        batchCode: selected.batchCode || '',
        internalCode: selected.internalCode || ''
      });
    }
  };
  
  const handleSolventSelect = (index: number, selectedName: string) => {
    const selected = (residualSolventsList || []).find(s => s.name === selectedName);
    if (selected) {
      const newAnalytes = [...analytes];
      newAnalytes[index] = {
        ...newAnalytes[index],
        name: selected.name || '',
        protons: selected.protons || '',
        molarMass: selected.molarMass || ''
      };
      setAnalytes(newAnalytes);
    }
  };

  const handleSaveStandard = () => {
    const currentList = Array.isArray(standards) ? standards : DEFAULT_STANDARDS;
    const existingIndex = currentList.findIndex(s => s.name === reference.name);
    let newStandards = [...currentList];
    const stdToSave = { ...reference, integral: '', mass: '', integralError: '', massError: '0.01' };
    if (existingIndex >= 0) {
      newStandards[existingIndex] = stdToSave;
    } else {
      newStandards.push(stdToSave);
    }
    saveStandards(newStandards);
    setSelectedStandard(reference.name);
    alert('Standard saved successfully!');
  };

  const handleDeleteStandard = () => {
    if (!selectedStandard) {
      alert("Please select a standard to delete.");
      return;
    }
    const currentList = Array.isArray(standards) ? standards : DEFAULT_STANDARDS;
    const newStandards = currentList.filter(s => s.name !== selectedStandard);
    saveStandards(newStandards);
    setSelectedStandard("");
    alert('Standard deleted successfully!');
  };
  
  const handleSaveResidualSolvent = (index: number) => {
    const currentAnalyte = analytes[index];
    if (!currentAnalyte.name) return alert("Please specify a solvent name.");
    const existingIndex = residualSolventsList.findIndex(s => s.name === currentAnalyte.name);
    let newList = [...residualSolventsList];
    const itemToSave = { ...currentAnalyte, integral: '', mass: '', integralError: '', massError: '0.01', isSolvent: true };
    if (existingIndex >= 0) {
      newList[existingIndex] = itemToSave;
    } else {
      newList.push(itemToSave);
    }
    saveResidualSolvents(newList);
    alert('Residual solvent saved successfully!');
  };

  const handleDeleteResidualSolvent = (name: string) => {
    if (!name) return;
    const newList = residualSolventsList.filter(s => s.name !== name);
    saveResidualSolvents(newList);
    alert('Residual solvent deleted successfully!');
  };
  
  const handleAddDeuteratedSolvent = () => {
    if (!customDeuteratedSolvent.trim()) return;
    if (deuteratedSolventsList.includes(customDeuteratedSolvent.trim())) return;
    
    const newList = [...deuteratedSolventsList, customDeuteratedSolvent.trim()];
    saveDeuteratedSolvents(newList);
    setGlobalDeuteratedSolvent(customDeuteratedSolvent.trim());
    setCustomDeuteratedSolvent("");
  };
  
  const handleDeleteDeuteratedSolvent = () => {
    if (!globalDeuteratedSolvent) return;
    const newList = deuteratedSolventsList.filter(s => s !== globalDeuteratedSolvent);
    saveDeuteratedSolvents(newList);
    setGlobalDeuteratedSolvent("");
  };

  const exportAllStandards = () => {
    const data = (standards || []).map(s => ({
        name: s.name,
        supplier: s.supplier,
        batchCode: s.batchCode,
        internalCode: s.internalCode,
        protons: s.protons,
        molarMass: s.molarMass,
        purity: s.purity
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, `Internal_Standards_All.json`);
  };

  const importStandard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target?.result as string);
          if (Array.isArray(data)) {
            let newStandards = Array.isArray(standards) ? [...standards] : [...DEFAULT_STANDARDS];
            data.forEach((item: any) => {
              if (item.name) {
                const existingIndex = newStandards.findIndex(s => s.name === item.name);
                const std = {
                  name: item.name || '',
                  supplier: item.supplier || '',
                  batchCode: item.batchCode || '',
                  internalCode: item.internalCode || '',
                  protons: item.protons || '',
                  molarMass: item.molarMass || '',
                  purity: item.purity || '',
                  integral: '', mass: '', integralError: '', massError: '0.01'
                };
                if (existingIndex >= 0) newStandards[existingIndex] = std;
                else newStandards.push(std);
              }
            });
            saveStandards(newStandards);
            alert("Batch standards imported successfully!");
          } else {
            setReference({
              ...reference,
              name: data.name || '',
              supplier: data.supplier || '',
              batchCode: data.batchCode || '',
              internalCode: data.internalCode || '',
              protons: data.protons || '',
              molarMass: data.molarMass || '',
              purity: data.purity || ''
            });
            alert("Standard imported successfully!");
          }
        } catch (err) {
          alert("Failed to parse standard file");
        }
      };
      reader.readAsText(file);
    }
    // reset input
    e.target.value = '';
  };

  const exportCalculation = () => {
    if (!results || results.every(r => !r)) return;
    
    let content = `qNMR Calculation Export\n=======================\n\nFormula Used:\nPx = (Ix / Iref) * (Nref / Nx) * (MWx / MWref) * (mref / mx) * Pref\n\n`;
    
    if (globalDeuteratedSolvent) {
      content += `Measured in: ${globalDeuteratedSolvent}\n\n`;
    }

    content += `Reference Standard:\nIref (Reference Integral): ${reference.integral}\nNref (Reference Protons): ${reference.protons}\nMWref (Reference Molar Mass): ${reference.molarMass} g/mol\nmref (Reference Mass): ${reference.mass} mg\nPref (Reference Purity): ${reference.purity}%\n`;
    if (reference.chemicalShift) content += `Chemical Shift: ${reference.chemicalShift} ppm\n`;
    content += `\n`;

    analytes.forEach((analyte, idx) => {
      const result = results[idx];
      if (!result) return;
      content += `${analyte.isSolvent ? 'Residual Solvent' : 'Analyte'} ${idx + 1}: ${analyte.name}\n-----------------------\n`;
      if (analyte.chemicalShift) content += `Chemical Shift: ${analyte.chemicalShift} ppm\n`;
      content += `Ix (Integral): ${analyte.integral}\nNx (Protons): ${analyte.protons}\nMWx (Molar Mass): ${analyte.molarMass} g/mol\nmx (Sample Mass): ${analyte.mass} mg\n\n`;
      content += `Result:\nCalculated Purity (Px): ${result.purity.toFixed(4)}%\nAbsolute Error: ±${result.absoluteError.toFixed(4)}%\nRelative Error: ${result.relativeError.toFixed(4)}%\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `qNMR_Calculation_${new Date().toISOString().split('T')[0]}.txt`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* Global Deuterated Solvent Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 min-w-[200px]">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Deuterated Solvent</h2>
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <select 
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={globalDeuteratedSolvent}
            onChange={(e) => setGlobalDeuteratedSolvent(e.target.value)}
          >
            <option value="">None Selected</option>
            {deuteratedSolventsList.map((solv, i) => (
              <option key={i} value={solv}>{solv}</option>
            ))}
          </select>
          <button 
            onClick={handleDeleteDeuteratedSolvent}
            disabled={!globalDeuteratedSolvent}
            className="p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50"
            title="Remove selected solvent from list"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
          
          <div className="flex items-center gap-2">
            <input 
              type="text"
              placeholder="Add custom..."
              className="px-3 py-2 w-32 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={customDeuteratedSolvent}
              onChange={(e) => setCustomDeuteratedSolvent(e.target.value)}
            />
            <button 
              onClick={handleAddDeuteratedSolvent}
              className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Analyte Section */}
        <div className="flex flex-col gap-4">
          {analytes.map((analyte, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${analyte.isSolvent ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'} flex items-center justify-center`}>
                    {analyte.isSolvent ? <Droplet className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {(() => {
                      let count = 0;
                      for (let i = 0; i <= idx; i++) {
                        if (analyte.isSolvent && analytes[i].isSolvent) count++;
                        if (!analyte.isSolvent && !analytes[i].isSolvent) count++;
                      }
                      return analyte.isSolvent ? `Residual Solvent ${count}` : `Analyte ${count}`;
                    })()}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {analyte.isSolvent && (
                    <>
                      <select 
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => handleSolventSelect(idx, e.target.value)}
                        value={residualSolventsList.some(s => s.name === analyte.name) ? analyte.name : ""}
                      >
                        <option value="" disabled>Load Preset...</option>
                        {residualSolventsList.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                      </select>
                      <button 
                        onClick={() => handleSaveResidualSolvent(idx)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md text-sm font-medium transition-colors"
                        title="Save as preset"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteResidualSolvent(analyte.name)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md text-sm font-medium transition-colors"
                        title="Delete preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    </>
                  )}
                  {analytes.length > 1 && (
                    <button 
                      onClick={() => handleRemoveAnalyte(idx)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                      title={analyte.isSolvent ? "Delete window" : "Remove Analyte"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="col-span-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Name / ID</label>
                    <input 
                      type="text" 
                      value={analyte.name} 
                      onChange={(e) => {
                        const newAnalytes = [...analytes];
                        newAnalytes[idx] = {...analyte, name: e.target.value};
                        setAnalytes(newAnalytes);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                      placeholder={analyte.isSolvent ? "e.g., Acetone" : "e.g., Unknown API"}
                    />
                  </div>
                </div>
                <InputField label="Integral Area" value={analyte.integral} onChange={(v: string) => { const n = [...analytes]; n[idx] = {...analyte, integral: v}; setAnalytes(n); }} />
                <InputField label="Num Protons" value={analyte.protons} onChange={(v: string) => { const n = [...analytes]; n[idx] = {...analyte, protons: v}; setAnalytes(n); }} step="1" />
                <InputField label="Molar Mass" value={analyte.molarMass} onChange={(v: string) => { const n = [...analytes]; n[idx] = {...analyte, molarMass: v}; setAnalytes(n); }} unit="g/mol" />
                <InputField label="Sample Mass" value={analyte.mass} onChange={(v: string) => { const n = [...analytes]; n[idx] = {...analyte, mass: v}; setAnalytes(n); }} unit="mg" />
                <InputField label="Chem Shift" value={analyte.chemicalShift || ''} onChange={(v: string) => { const n = [...analytes]; n[idx] = {...analyte, chemicalShift: v}; setAnalytes(n); }} unit="ppm" />
                <InputField label="Mass Error (±)" value={analyte.massError} onChange={(v: string) => { const n = [...analytes]; n[idx] = {...analyte, massError: v}; setAnalytes(n); }} unit="mg" />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={() => handleAddAnalyte(false)}
              className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Analyte
            </button>
            <button
              onClick={() => handleAddAnalyte(true)}
              className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Solvent
            </button>
          </div>
        </div>

        {/* Reference Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors flex flex-col h-fit">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Scale className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Internal Standard</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select 
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 max-w-[120px]"
                onChange={handleStandardSelect}
                value={selectedStandard}
              >
                <option value="" disabled>Load...</option>
                {standards.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
              </select>
              <button 
                onClick={handleSaveStandard}
                className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md text-sm font-medium transition-colors"
                title="Save preset"
              >
                <Save className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDeleteStandard}
                disabled={!selectedStandard}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete preset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button 
                onClick={exportAllStandards}
                className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md text-sm font-medium transition-colors"
                title="Export All Standards"
              >
                <Download className="w-4 h-4" /> All
              </button>
              <label 
                className="cursor-pointer flex items-center gap-1 px-2 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md text-sm font-medium transition-colors"
                title="Import Standard(s)"
              >
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={importStandard} className="hidden" />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="col-span-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Name / ID</label>
                <input 
                  type="text" 
                  value={reference.name} 
                  onChange={(e) => setReference({...reference, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                  placeholder="e.g., Maleic Acid"
                />
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Supplier</label>
                <input 
                  type="text" 
                  value={reference.supplier || ''} 
                  onChange={(e) => setReference({...reference, supplier: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                  placeholder="Supplier"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Batch Code</label>
                <input 
                  type="text" 
                  value={reference.batchCode || ''} 
                  onChange={(e) => setReference({...reference, batchCode: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                  placeholder="Batch Code"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">Int. Code</label>
                <input 
                  type="text" 
                  value={reference.internalCode || ''} 
                  onChange={(e) => setReference({...reference, internalCode: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                  placeholder="Int. Code"
                />
              </div>
            </div>
            <InputField label="Integral Area" value={reference.integral} onChange={(v: string) => setReference({...reference, integral: v})} />
            <InputField label="Num Protons" value={reference.protons} onChange={(v: string) => setReference({...reference, protons: v})} step="1" />
            <InputField label="Molar Mass" value={reference.molarMass} onChange={(v: string) => setReference({...reference, molarMass: v})} unit="g/mol" />
            <InputField label="Sample Mass" value={reference.mass} onChange={(v: string) => setReference({...reference, mass: v})} unit="mg" />
            <InputField label="Standard Purity" value={reference.purity} onChange={(v: string) => setReference({...reference, purity: v})} unit="%" />
            <InputField label="Mass Error (±)" value={reference.massError} onChange={(v: string) => setReference({...reference, massError: v})} unit="mg" />
            <InputField label="Chem Shift" value={reference.chemicalShift || ''} onChange={(v: string) => setReference({...reference, chemicalShift: v})} unit="ppm" />
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Save Session Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Save Calculation Session
                </h3>
              </div>
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save current analyte inputs, reference standard parameters, and calculated results with an exact timestamp to local application storage.
            </p>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Session Title / Sample ID
                </label>
                <input
                  type="text"
                  value={sessionTitleInput}
                  onChange={(e) => setSessionTitleInput(e.target.value)}
                  placeholder="e.g., Lot 4492-B Purity Test"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Notes / Experiment Comments (Optional)
                </label>
                <textarea
                  value={sessionNotesInput}
                  onChange={(e) => setSessionNotesInput(e.target.value)}
                  placeholder="e.g., Run at 500 MHz, CDCl3, relaxation delay 30s..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentSession}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="bg-[#84dcd5] dark:bg-[#0f2c29] border border-teal-300/40 dark:border-teal-700/60 rounded-2xl p-5 shadow-xl text-black dark:text-slate-100 flex flex-col min-h-[400px] transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-teal-200/90 mb-4">
            <div className="flex items-center gap-2">
              <CalcIcon className="w-5 h-5 text-black dark:text-teal-200" />
              <h3 className="font-semibold text-sm tracking-wide uppercase text-black dark:text-teal-100">Results Panel</h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button 
              onClick={handleCalculate}
              className="flex-1 py-3 px-6 bg-black dark:bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-950 text-white border border-black dark:border-teal-600/50 rounded-xl font-semibold shadow-lg shadow-teal-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Calculate <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (results.some(r => r !== null)) {
                  const newMeasurement: SavedCalculationSession = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    title: `Measurement ${measurements.length + 1}`,
                    analytes: [...analytes],
                    reference: { ...reference },
                    results: [...results],
                  };
                  setMeasurements([...measurements, newMeasurement]);
                }
              }}
              disabled={!results.some(r => r !== null)}
              className="py-3 px-5 bg-white/40 hover:bg-white/60 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-black dark:text-teal-100 border border-black/20 dark:border-teal-600/50 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Add current calculation as a measurement"
            >
              <Plus className="w-4 h-4" />
              Add Measurement
            </button>
            <button
              onClick={openSaveSessionModal}
              className="py-3 px-5 bg-white/40 hover:bg-white/60 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-black dark:text-teal-100 border border-black/20 dark:border-teal-600/50 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Save current calculation results with a timestamp"
            >
              <Bookmark className="w-4 h-4" />
              Save Session
            </button>
          </div>

          {results.some(r => r !== null) ? (
            <div className="flex-1 flex flex-col justify-start space-y-6 animate-in fade-in zoom-in-95">
              {results.map((result, idx) => result && (
                <div key={idx} className="bg-black/5 dark:bg-black/30 p-4 rounded-xl border border-black/10 dark:border-teal-600/40">
                  <h4 className="text-black dark:text-teal-200 font-semibold mb-3 border-b border-black/10 dark:border-teal-600/40 pb-2">
                    {analytes[idx]?.isSolvent ? 'Residual Solvent' : 'Analyte'} {idx + 1}: {analytes[idx]?.name || 'Unknown'}
                  </h4>
                  <div>
                    <p className="text-black dark:text-teal-100 text-sm mb-2 font-medium">{analytes[idx]?.isSolvent ? 'Calculated Content' : 'Determined Purity'}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-mono tracking-tighter text-[#ff0000] dark:text-red-400">
                        {result.purity.toFixed(2)}
                      </span>
                      <Percent className="w-5 h-5 text-[#ff0000] dark:text-red-400" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 mt-4 border-t border-black/10 dark:border-teal-600/40">
                    <div className="flex justify-between items-center max-w-sm">
                      <span className="text-black dark:text-teal-100 text-sm">Absolute Error</span>
                      <span className="font-mono text-[#ff0000] dark:text-red-400 font-medium">± {result.absoluteError.toFixed(4)} %</span>
                    </div>
                    <div className="flex justify-between items-center max-w-sm">
                      <span className="text-black dark:text-teal-100 text-sm">Relative Error</span>
                      <span className="font-mono text-[#ff0000] dark:text-red-400 font-medium">{result.relativeError.toFixed(2)} %</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-black dark:text-teal-100 space-y-3">
              <Activity className="w-12 h-12 text-black dark:text-teal-300" />
              <p className="text-sm px-4 text-black dark:text-teal-100 font-medium">Enter values and click calculate to view quantitative results.</p>
            </div>
          )}
        </div>
      </div>

      {/* Average Purity Calculation Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <CalculatorIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Average Purity Calculation</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Calculate average, standard deviation, and relative standard deviation from multiple measurements.</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-3">
            {measurements.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No measurements added yet. Use "Add Measurement" from the Results Panel.</p>
            ) : (
              measurements.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">Measurement {i + 1}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {m.analytes.map((a, aIdx) => `${a.name || 'Unknown'}: ${m.results[aIdx]?.purity?.toFixed(2) || 'N/A'}%`).join(' | ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAnalytes([...m.analytes]);
                        setReference({...m.reference});
                        setResults([...m.results]);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-md transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => setMeasurements(measurements.filter(ms => ms.id !== m.id))}
                      className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Remove measurement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {measurements.length > 0 && (
              <button
                onClick={() => setMeasurements([])}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 hover:underline mt-2 inline-block"
              >
                Clear all measurements
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center min-h-[160px] gap-6">
            {measurements.length > 0 ? (
              measurements[0].analytes.map((analyte, aIdx) => {
                const validPurities = measurements.map(m => m.results[aIdx]?.purity).filter(p => typeof p === 'number') as number[];
                if (validPurities.length === 0) return null;
                
                const sum = validPurities.reduce((a, b) => a + b, 0);
                const mean = sum / validPurities.length;
                const variance = validPurities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (validPurities.length > 1 ? validPurities.length - 1 : 1);
                const stdDev = Math.sqrt(variance);
                const rsd = (stdDev / mean) * 100;

                return (
                  <div key={aIdx} className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{analyte.name || 'Unknown Analyte'}</h3>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Mean Purity</p>
                      <p className="text-3xl font-bold font-mono text-slate-800 dark:text-slate-100">{mean.toFixed(2)} %</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Std Deviation (σ)</p>
                        <p className="text-lg font-mono text-slate-700 dark:text-slate-300">± {stdDev.toFixed(4)} %</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">RSD</p>
                        <p className="text-lg font-mono text-slate-700 dark:text-slate-300">{rsd.toFixed(2)} %</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-center text-slate-400 italic">Add measurements to view statistics.</p>
            )}
          </div>
        </div>
      </div>

      {/* Saved Calculation Sessions Component */}
      <CalculationHistory 
        sessions={savedSessions}
        onRestoreSession={handleRestoreSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
        onUpdateSession={handleUpdateSession}
        onImportSessions={handleImportSessions}
      />
    </div>
  );
}
