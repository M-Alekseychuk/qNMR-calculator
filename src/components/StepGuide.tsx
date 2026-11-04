import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, AlertCircle, Edit2, Save, Plus, Trash2, Info, FileText, Download, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { saveAs } from 'file-saver';

interface Note {
  type: 'warning' | 'tip' | 'info';
  content: string;
}

interface Step {
  id: string;
  title: string;
  content: string;
  notes: Note[];
}

const DEFAULT_STEPS: Step[] = [
  {
    id: "3kih9bs",
    title: "Weighing in your internal standard",
    content: "Weigh roughly 10-20 mg of your internal standard (IC) of choice into an HPLC vial at the analytical balance. It’s not important to hit a specific number but it is very important to note down the exact weight you measured.",
    notes: [
      {
        type: "tip",
        content: "For IC selection, check the “qNMR standards” tab and pick one which has a peak that is isolated from the rest of your compound signals."
      },
      {
        type: "info",
        content: "To get the best acuracy, prepare 3 samples and measure 3 qNMRs of your compound, then take the mean purity."
      }
    ]
  },
  {
    id: "llmj38t",
    title: "Weighing in your compound",
    content: "Weigh roughly 10-20 mg of your sample into the same HPLC vial at the analytical balance, and note down the exact weight again.",
    notes: []
  },
  {
    id: "itllj7f",
    title: "Measure your sample",
    content: "Dissolve the sample/IC mixture in roughly 0.6 mL of the deuterated solvent of your choice and make sure that you have a perfect solution. Transfer the solution into a NMR tube and measure the qNMR-experiment (12 min) at the NMR.",
    notes: [
      {
        type: "tip",
        content: "If your sample doesn’t dissolve well, try using the sonicator or add more solvent. If it still doesn’t dissolve, change your deuterated solvent to something else (e.g. DMSO-D6)."
      }
    ]
  },
  {
    id: "6zqgdp3",
    title: "Analysis",
    content: "Open the NMR sample in your analysis software, set apodization to 0.125 (optionally remove Trapozoids in expert mode) and perform a baseline correction (Polynomal = 3).\nIntegrate an isolated peak of your sample and an isolated peak of your IC. Put the values into the software (also chose the correct internal standard from the drop down menu and put in the molecular weight of your sample), click analyse (which gives you your purity), go to the report tab and attach a PDF of your qNMR spectrum, and click generate repott for a full report.",
    notes: [
      {
        type: "tip",
        content: "IC peak and sample peak should be close to each other (e.g. if you're looking at an aromatic peak, use an IC with an aromatic proton; if you're looking at a methoxy group, try using an IC with an methoxy group.)"
      }
    ]
  }
];

export default function StepGuide() {
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qnmr_guide_steps_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSteps(parsed);
        } else {
          setSteps(DEFAULT_STEPS);
        }
      } catch (e) {
        setSteps(DEFAULT_STEPS);
      }
    } else {
      setSteps(DEFAULT_STEPS);
    }
  }, []);

  const saveSteps = (newSteps: Step[]) => {
    const validSteps = Array.isArray(newSteps) ? newSteps : DEFAULT_STEPS;
    setSteps(validSteps);
    localStorage.setItem('qnmr_guide_steps_v4', JSON.stringify(validSteps));
  };

  const addStep = () => {
    const newSteps = [...steps, { id: Date.now().toString(), title: 'New Step', content: 'Description here...', notes: [] }];
    saveSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    saveSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    saveSteps(newSteps);
  };

  const addNote = (stepIndex: number) => {
    const newSteps = [...(steps || [])];
    if (!newSteps[stepIndex]) return;
    const notes = Array.isArray(newSteps[stepIndex].notes) ? [...newSteps[stepIndex].notes] : [];
    notes.push({ type: 'info', content: 'New note...' });
    newSteps[stepIndex] = { ...newSteps[stepIndex], notes };
    saveSteps(newSteps);
  };

  const updateNote = (stepIndex: number, noteIndex: number, field: keyof Note, value: string) => {
    const newSteps = [...(steps || [])];
    if (!newSteps[stepIndex]) return;
    const notes = Array.isArray(newSteps[stepIndex].notes) ? [...newSteps[stepIndex].notes] : [];
    if (!notes[noteIndex]) return;
    notes[noteIndex] = { ...notes[noteIndex], [field]: value };
    newSteps[stepIndex] = { ...newSteps[stepIndex], notes };
    saveSteps(newSteps);
  };

  const removeNote = (stepIndex: number, noteIndex: number) => {
    const newSteps = [...(steps || [])];
    if (!newSteps[stepIndex]) return;
    const notes = Array.isArray(newSteps[stepIndex].notes)
      ? newSteps[stepIndex].notes.filter((_, i) => i !== noteIndex)
      : [];
    newSteps[stepIndex] = { ...newSteps[stepIndex], notes };
    saveSteps(newSteps);
  };

  const exportToWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Step-by-Step Guide</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; }
          h1 { color: #2563eb; }
          h2 { font-size: 14pt; margin-top: 20pt; }
          .step-content { margin-left: 20pt; }
          .note { margin-left: 20pt; padding: 10pt; background: #f8fafc; border-left: 4pt solid #cbd5e1; margin-top: 10pt; }
          .note-warning { border-color: #fbbf24; background: #fffbeb; }
          .note-tip { border-color: #34d399; background: #ecfdf5; }
          .note-info { border-color: #60a5fa; background: #eff6ff; }
          .note-type { font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h1>qNMR Step-by-Step Guide</h1>
        ${(steps || []).map((step, index) => `
          <h2>${index + 1}. ${step.title}</h2>
          <div class="step-content">
            <p>${step.content}</p>
            ${(step.notes || []).map(note => `
              <div class="note note-${note.type}">
                <span class="note-type">${note.type}:</span> ${note.content}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    saveAs(blob, 'qNMR_Step_by_Step_Guide.doc');
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(steps, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    saveAs(blob, 'qNMR_Step_by_Step_Guide.json');
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (Array.isArray(parsed)) {
            saveSteps(parsed);
            alert("Guide imported successfully!");
          } else {
            alert("Invalid JSON format for guide.");
          }
        } catch (err) {
          alert("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const exportToPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 print:mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Step-by-Step Guide
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Follow these guidelines to ensure metrological traceability and measurement uncertainty &lt; 1%.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <label 
            className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Import from JSON"
          >
            <Download className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} /> Load
            <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
          </label>
          <button
            onClick={exportToJson}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Export to JSON"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={exportToWord}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Export to Word"
          >
            <FileText className="w-4 h-4" /> Word
          </button>
          <button
            onClick={exportToPdf}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Export to PDF"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          {isEditing && (
            <button
              onClick={() => saveSteps(DEFAULT_STEPS)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm cursor-pointer"
              title="Reset guide to software standard"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border shadow-sm",
              isEditing 
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {isEditing ? <><Save className="w-4 h-4" /> Done</> : <><Edit2 className="w-4 h-4" /> Edit</>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(steps || []).map((step, index) => (
          <div key={step.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm relative transition-colors">
            {isEditing && (
              <button 
                onClick={() => removeStep(index)}
                className="absolute top-4 right-4 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                title="Delete Step"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-semibold text-xs shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    className="font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{step.title}</h3>
                )}
              </div>
            </div>
            
            <div className="ml-9 mb-4">
              {isEditing ? (
                <textarea
                  value={step.content}
                  onChange={(e) => updateStep(index, 'content', e.target.value)}
                  className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 w-full min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {step.content}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {(step.notes || []).map((note, noteIndex) => (
                <div key={noteIndex} className={cn(
                  "ml-9 border rounded-lg p-3 flex gap-2 relative",
                  note.type === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400" :
                  note.type === 'tip' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400" :
                  "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-400"
                )}>
                  {note.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {note.type === 'tip' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  {note.type === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                  
                  <div className="flex-1 flex flex-col gap-2">
                    {isEditing ? (
                      <>
                        <div className="flex gap-2 items-center">
                          <select 
                            value={note.type}
                            onChange={(e) => updateNote(index, noteIndex, 'type', e.target.value)}
                            className="text-xs font-medium bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded px-1.5 py-0.5 outline-none"
                          >
                            <option value="warning">Warning</option>
                            <option value="tip">Tip</option>
                            <option value="info">Info</option>
                          </select>
                        </div>
                        <textarea
                          value={note.content}
                          onChange={(e) => updateNote(index, noteIndex, 'content', e.target.value)}
                          className="text-xs leading-relaxed bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded px-2 py-1 w-full outline-none"
                        />
                      </>
                    ) : (
                      <p className="text-xs leading-relaxed">{note.content}</p>
                    )}
                  </div>
                  
                  {isEditing && (
                    <button 
                      onClick={() => removeNote(index, noteIndex)}
                      className="absolute top-2 right-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                    >
                      <Trash2 className="w-3 h-3 opacity-50" />
                    </button>
                  )}
                </div>
              ))}
              
              {isEditing && (
                <button 
                  onClick={() => addNote(index)}
                  className="ml-9 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
                >
                  <Plus className="w-3 h-3" /> Add Note
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {isEditing && (
        <button 
          onClick={addStep}
          className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add New Step
        </button>
      )}
    </div>
  );
}
