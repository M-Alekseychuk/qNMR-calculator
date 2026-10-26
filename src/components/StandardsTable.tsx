import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Edit2, Check, X, Download, Upload } from 'lucide-react';

interface StandardItem {
  id: string;
  name: string;
  mw: number;
  shiftCDCl3: string;
  shiftDMSO: string;
}

const DEFAULT_STANDARDS: StandardItem[] = [
  { id: '1', name: '1,3,5-Trimethoxybenzene', mw: 168.19, shiftCDCl3: '6.1 (s), 3.8 (s)', shiftDMSO: '6.1 (s), 3.7 (s)' },
  { id: '2', name: 'Dimethyl malonic acid', mw: 132.12, shiftCDCl3: '---', shiftDMSO: '1.3 (s)' },
  { id: '3', name: 'Dimethyl sulfone', mw: 94.13, shiftCDCl3: '3.0 (s)', shiftDMSO: '3.0 (s)' },
  { id: '4', name: 'Dimethyl terephthalate', mw: 194.19, shiftCDCl3: '8.1 (s), 4.0 (s)', shiftDMSO: '8.1 (s), 3.9 (s)' },
  { id: '5', name: 'Duroquinone', mw: 164.20, shiftCDCl3: '2.0 (s)', shiftDMSO: '2.0 (s)' },
  { id: '6', name: 'Tecnazen', mw: 260.89, shiftCDCl3: '7.8 (s)', shiftDMSO: '8.5 (s)' },
  { id: '7', name: 'Benzyl benzoate', mw: 212.24, shiftCDCl3: '5.4 (s), 8.1 (m)', shiftDMSO: '5.4 (s), 8.0 (m)' },
  { id: '8', name: 'Ethylene carbonate', mw: 88.06, shiftCDCl3: '4.5 (s)', shiftDMSO: '4.5 (s)' },
  { id: '9', name: '1,2,4,5-Tetramethylbenzene', mw: 134.22, shiftCDCl3: '7.0 (s), 2.2 (s)', shiftDMSO: '6.9 (s), 2.1 (s)' },
  { id: '10', name: 'Mesitylen', mw: 120.19, shiftCDCl3: '2.26 (s), 6.78 (s)', shiftDMSO: '---' },
  { id: '11', name: 'Diphenylmethane', mw: 168.24, shiftCDCl3: '3.93 (s), 7.1-7.3 (m)', shiftDMSO: '---' },
  { id: '12', name: '1-chloro-4-nitro-2-(trifluoromethyl)benzene', mw: 225.55, shiftCDCl3: '---', shiftDMSO: '---' },
];

export default function StandardsTable() {
  const [standards, setStandards] = useState<StandardItem[]>(DEFAULT_STANDARDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StandardItem>>({});

  useEffect(() => {
    const saved = localStorage.getItem('qnmr_standards_table_v3');
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
  }, []);

  const saveToStorage = (newData: StandardItem[]) => {
    const validData = Array.isArray(newData) ? newData : DEFAULT_STANDARDS;
    setStandards(validData);
    localStorage.setItem('qnmr_standards_table_v3', JSON.stringify(validData));
  };

  const handleEdit = (std: StandardItem) => {
    setEditingId(std.id);
    setEditForm(std);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingId) {
      const updated = standards.map(s => 
        s.id === editingId ? { ...s, ...editForm } as StandardItem : s
      );
      saveToStorage(updated);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this standard?')) {
      const updated = standards.filter(s => s.id !== id);
      saveToStorage(updated);
    }
  };

  const handleAddNew = () => {
    const newId = Date.now().toString();
    const newStd: StandardItem = {
      id: newId,
      name: 'New Standard',
      mw: 0,
      shiftCDCl3: '-',
      shiftDMSO: '-'
    };
    const updated = [...standards, newStd];
    saveToStorage(updated);
    handleEdit(newStd);
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(standards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qNMR_Standards_Table.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (Array.isArray(parsed)) {
            saveToStorage(parsed);
            alert("Standards table imported successfully!");
          } else {
            alert("Invalid JSON format for standards table.");
          }
        } catch (err) {
          alert("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const renderCell = (std: StandardItem, field: keyof StandardItem, isNumber = false) => {
    const isEditing = editingId === std.id;
    if (isEditing) {
      return (
        <input 
          type={isNumber ? "number" : "text"}
          step={isNumber ? "0.01" : undefined}
          className="w-full px-2 py-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-blue-500"
          value={editForm[field] || ''}
          onChange={(e) => setEditForm({ ...editForm, [field]: isNumber ? parseFloat(e.target.value) || 0 : e.target.value })}
        />
      );
    }
    return <span className={isNumber || field.startsWith('shift') ? 'font-mono' : ''}>{isNumber ? Number(std[field]).toFixed(2) : std[field]}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Common qNMR Standards</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Reference values for molar weight and chemical shifts</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label 
            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700"
            title="Import from JSON"
          >
            <Upload className="w-4 h-4" /> Load
            <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
          </label>
          <button
            onClick={exportToJson}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700"
            title="Export to JSON"
          >
            <Download className="w-4 h-4" /> Save
          </button>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Standard
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Standard Name</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right whitespace-nowrap">Molar Weight (g/mol)</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right whitespace-nowrap">Shift in CDCl3 (ppm)</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right whitespace-nowrap">Shift in DMSO-d6 (ppm)</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {(standards || []).map((std) => {
              const isEditing = editingId === std.id;
              return (
                <tr key={std.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100 align-middle whitespace-nowrap">
                    {renderCell(std, 'name')}
                  </td>
                  <td className="px-4 py-2 text-right align-middle whitespace-nowrap">
                    {renderCell(std, 'mw', true)}
                  </td>
                  <td className="px-4 py-2 text-right align-middle whitespace-nowrap">
                    {renderCell(std, 'shiftCDCl3')}
                  </td>
                  <td className="px-4 py-2 text-right align-middle whitespace-nowrap">
                    {renderCell(std, 'shiftDMSO')}
                  </td>
                  <td className="px-4 py-2 text-right align-middle whitespace-nowrap w-[100px]">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded" title="Save">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancelEdit} className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(std)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(std.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {standards.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No standards defined. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> Chemical shifts can vary slightly depending on temperature, concentration, and water content. 
          Values provided here serve as a general reference. You can edit this table to match your preferred values.
        </p>
      </div>
    </div>
  );
}
