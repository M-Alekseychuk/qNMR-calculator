import React, { useState, useEffect } from 'react';
import Calculator from './components/Calculator';
import StepGuide from './components/StepGuide';
import ReportTemplate from './components/ReportTemplate';
import StandardsTable from './components/StandardsTable';
import LogoModal from './components/LogoModal';
import { Compound, QNMRResult, SavedCalculationSession } from './types';
import { Calculator as CalcIcon, FileText, BookOpen, Sun, Moon, Database, Pencil } from 'lucide-react';
import { cn } from './lib/utils';
import { DEFAULT_LOGO_BASE64, LOGO_BASE64 } from './lib/logoBase64';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'report' | 'guide' | 'standards'>('calculator');
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const [analytes, setAnalytes] = useState<Compound[]>(() => {
    const saved = localStorage.getItem('qnmr_analytes_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
      }
    }
    const oldSaved = localStorage.getItem('qnmr_analyte_state');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        if (parsed && !Array.isArray(parsed)) return [parsed];
      } catch (e) {
      }
    }
    return [{
      name: 'Unknown API',
      integral: '',
      integralError: '',
      protons: 1,
      molarMass: '',
      mass: '',
      massError: '0.01'
    }];
  });

  const [reference, setReference] = useState<Compound>(() => {
    const saved = localStorage.getItem('qnmr_reference_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch (e) {
        // Fallback to default
      }
    }
    return {
      name: '1,3,5-Trimethoxybenzene',
      integral: '',
      integralError: '',
      protons: 3,
      molarMass: 168.19,
      mass: '',
      massError: '0.01',
      purity: 99.9,
      purityError: 0.1
    };
  });

  useEffect(() => {
    localStorage.setItem('qnmr_analytes_state', JSON.stringify(analytes));
  }, [analytes]);

  useEffect(() => {
    localStorage.setItem('qnmr_reference_state', JSON.stringify(reference));
  }, [reference]);

  const [results, setResults] = useState<(QNMRResult | null)[]>([null]);
  const [globalDeuteratedSolvent, setGlobalDeuteratedSolvent] = useState<string>(() => {
    const saved = localStorage.getItem('qnmr_last_deuterated_solvent');
    return saved !== null ? saved : "Chloroform-d";
  });

  useEffect(() => {
    localStorage.setItem('qnmr_last_deuterated_solvent', globalDeuteratedSolvent);
  }, [globalDeuteratedSolvent]);
  const [measurements, setMeasurements] = useState<SavedCalculationSession[]>(() => {
    const saved = localStorage.getItem('qnmr_measurements_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('qnmr_measurements_state', JSON.stringify(measurements));
  }, [measurements]);

  const [logo, setLogo] = useState<string>(() => {
    const saved = localStorage.getItem('qnmr_custom_logo');
    return saved || DEFAULT_LOGO_BASE64;
  });
  const [logoScale, setLogoScale] = useState<number>(() => {
    const saved = localStorage.getItem('qnmr_logo_scale');
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 50 && num <= 200) return num;
    }
    return 100; // 100% is standard
  });
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  useEffect(() => {
    if (logo) {
      localStorage.setItem('qnmr_custom_logo', logo);
    }
  }, [logo]);

  useEffect(() => {
    localStorage.setItem('qnmr_logo_scale', logoScale.toString());
  }, [logoScale]);

  const handleSaveLogo = (newLogo: string) => {
    setLogo(newLogo);
  };

  const handleResetLogo = () => {
    setLogo(DEFAULT_LOGO_BASE64);
    setLogoScale(100);
    localStorage.removeItem('qnmr_custom_logo');
    localStorage.removeItem('qnmr_logo_scale');
  };

  const navItems = [
    { id: 'calculator', label: 'Calculator', icon: CalcIcon },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'standards', label: 'qNMR standards', icon: Database },
    { id: 'guide', label: 'Step-by-Step guide', icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-200 transition-colors">
      
      {/* Header */}
      <header className="print:hidden bg-gradient-to-r from-sky-200 to-green-200 dark:from-[#182c64] dark:to-[#123b2c] border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                <button
                  id="header-logo-container"
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Click to customize software logo"
                >
                  <img 
                    src={logo} 
                    alt="Organization Logo" 
                    style={{ height: `${Math.round(36 * (logoScale / 100))}px`, maxHeight: '46px' }}
                    className="w-auto object-contain transition-all" 
                  />
                  <div className="absolute inset-0 bg-blue-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1 backdrop-blur-[1px]">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </div>
                </button>
              </div>
              <div className="flex items-center gap-2.5">
                <h1 id="app-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  qNMR Calculator
                </h1>
                <span 
                  id="app-version-badge" 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/70 text-blue-700 border border-blue-200/90 shadow-2xs dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80"
                >
                  v.1.0
                </span>
              </div>
            </div>
            
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === item.id 
                      ? "bg-slate-100 dark:bg-slate-700 text-blue-700 dark:text-blue-400" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => setIsDark(!isDark)}
                className="ml-2 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Dark Mode"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'calculator' && (
            <Calculator 
              analytes={analytes} setAnalytes={setAnalytes}
              reference={reference} setReference={setReference}
              results={results} setResults={setResults}
              globalDeuteratedSolvent={globalDeuteratedSolvent} setGlobalDeuteratedSolvent={setGlobalDeuteratedSolvent}
              measurements={measurements} setMeasurements={setMeasurements}
            />
          )}

          {activeTab === 'report' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[calc(100vh-10rem)] flex flex-col transition-colors" style={{fontFamily: "'Aptos', sans-serif"}}>
              <ReportTemplate 
                analytes={analytes}
                reference={reference}
                results={results}
                globalDeuteratedSolvent={globalDeuteratedSolvent}
                measurements={measurements}
                logo={logo}
                logoScale={logoScale}
                onOpenLogoModal={() => setIsLogoModalOpen(true)}
              />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="max-w-3xl mx-auto">
              <StepGuide />
            </div>
          )}

          {activeTab === 'standards' && (
            <div className="max-w-5xl mx-auto">
              <StandardsTable />
            </div>
          )}
        </div>
      </main>

      {/* Logo Customization Modal */}
      <LogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogo={logo}
        logoScale={logoScale}
        onSaveLogo={handleSaveLogo}
        onChangeLogoScale={setLogoScale}
        onResetDefault={handleResetLogo}
      />
    </div>
  );
}
