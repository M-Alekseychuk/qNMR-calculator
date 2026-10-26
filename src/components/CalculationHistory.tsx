import React, { useState } from 'react';
import { SavedCalculationSession, Compound, QNMRResult } from '../types';
import { 
  Clock, 
  RotateCcw, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Upload, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { saveAs } from 'file-saver';
import ConfirmModal from './ConfirmModal';

interface CalculationHistoryProps {
  sessions: SavedCalculationSession[];
  onRestoreSession: (session: SavedCalculationSession) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onUpdateSession: (id: string, updates: Partial<SavedCalculationSession>) => void;
  onImportSessions: (sessions: SavedCalculationSession[]) => void;
}

export default function CalculationHistory({
  sessions,
  onRestoreSession,
  onDeleteSession,
  onClearAll,
  onUpdateSession,
  onImportSessions
}: CalculationHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleStartEdit = (session: SavedCalculationSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
    setEditNotes(session.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateSession(id, {
      title: editTitle.trim() || 'Untitled Calculation',
      notes: editNotes.trim()
    });
    setEditingId(null);
  };

  const handleRestore = (session: SavedCalculationSession) => {
    onRestoreSession(session);
    setRestoredId(session.id);
    setTimeout(() => {
      setRestoredId(null);
    }, 3000);
  };

  const exportAllHistory = () => {
    if (sessions.length === 0) return;
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    saveAs(blob, `qNMR_Calculation_History_${new Date().toISOString().split('T')[0]}.json`);
  };

  const exportSingleSession = (session: SavedCalculationSession) => {
    const blob = new Blob([JSON.stringify([session], null, 2)], { type: 'application/json' });
    const safeTitle = session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(blob, `qNMR_Session_${safeTitle}_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target?.result as string);
          if (Array.isArray(data)) {
            // Basic validation
            const valid = data.filter((item: any) => item.id && item.analytes && item.reference);
            if (valid.length > 0) {
              onImportSessions(valid);
              showFeedback(`Successfully imported ${valid.length} calculation session(s)!`);
            } else {
              showFeedback('No valid calculation sessions found in JSON file.');
            }
          } else {
            showFeedback('Invalid file format. Expected a JSON array of sessions.');
          }
        } catch {
          showFeedback('Failed to parse the JSON file.');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = session.title?.toLowerCase().includes(q);
    const refMatch = session.reference?.name?.toLowerCase().includes(q);
    const analyteMatch = session.analytes?.some(a => a.name?.toLowerCase().includes(q));
    const notesMatch = session.notes?.toLowerCase().includes(q);
    return titleMatch || refMatch || analyteMatch || notesMatch;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors space-y-4">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || 'Delete'}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Saved Calculation Sessions
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                {sessions.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Restore past analytical setups and results from local application storage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {sessions.length > 0 && (
            <>
              <button
                onClick={exportAllHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Export all sessions as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Backup JSON
              </button>
              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Clear All Calculation History',
                    message: 'Are you sure you want to delete all saved calculation sessions from local storage? This cannot be undone.',
                    confirmText: 'Clear All',
                    onConfirm: onClearAll
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
                title="Clear all saved history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </>
          )}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {sessions.length > 3 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search by analyte, standard name, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700/80">
          <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2.5" />
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">No Saved Sessions Yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;Save Calculation&quot; in the Results panel above after running a calculation to store and restore your analytical parameters at any time.
          </p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          No sessions matching &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredSessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const isEditing = editingId === session.id;
            const isRestored = restoredId === session.id;

            return (
              <div
                key={session.id}
                className={`rounded-xl border transition-all ${
                  isRestored
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                    : isExpanded
                    ? 'border-blue-300 dark:border-blue-700/60 bg-blue-50/20 dark:bg-blue-950/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30'
                }`}
              >
                {/* Main Card Row */}
                <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-md">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-blue-500 rounded outline-none w-full"
                            placeholder="Session title"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(session.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {session.title}
                          </h4>
                          <button
                            onClick={() => handleStartEdit(session)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded transition-colors"
                            title="Rename session"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDate(session.timestamp)}
                      </span>
                      <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>
                        Standard: <strong className="font-medium text-slate-700 dark:text-slate-300">{session.reference?.name || 'N/A'}</strong>
                      </span>
                      <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>
                        {session.analytes?.length || 0} Analyte{(session.analytes?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Results chips */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {session.results?.map((res, i) => res && (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
                        >
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {session.analytes?.[i]?.name || `Analyte ${i + 1}`}:
                          </span>
                          <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                            {res.purity.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ±{res.absoluteError.toFixed(4)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {session.notes && !isEditing && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-0.5 line-clamp-1">
                        Note: {session.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleRestore(session)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                        isRestored
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                      }`}
                      title="Load this session into the calculator"
                    >
                      {isRestored ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Restored!
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => exportSingleSession(session)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Export session as JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title={isExpanded ? 'Hide details' : 'View session details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Calculation Session',
                          message: `Are you sure you want to delete session "${session.title}"?`,
                          confirmText: 'Delete',
                          onConfirm: () => onDeleteSession(session.id)
                        });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700/80 p-4 bg-white/80 dark:bg-slate-800/80 rounded-b-xl space-y-4 text-xs animate-in fade-in duration-200">
                    {/* Notes editing if needed */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Session Notes / Experiment ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={session.notes || ''}
                          placeholder="Add experiment notes, analyst name, or batch details..."
                          onBlur={(e) => {
                            if (e.target.value !== (session.notes || '')) {
                              onUpdateSession(session.id, { notes: e.target.value });
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reference Standard Snapshot */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex justify-between items-center">
                          <span>Internal Standard</span>
                          <span className="text-[11px] font-normal text-slate-500">{session.reference?.supplier || 'No supplier'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
                          <div><span className="text-slate-400">Name:</span> {session.reference?.name}</div>
                          <div><span className="text-slate-400">Purity:</span> {session.reference?.purity}%</div>
                          <div><span className="text-slate-400">Integral Area:</span> {session.reference?.integral || '-'}</div>
                          <div><span className="text-slate-400">Protons:</span> {session.reference?.protons || '-'}</div>
                          <div><span className="text-slate-400">Molar Mass:</span> {session.reference?.molarMass} g/mol</div>
                          <div><span className="text-slate-400">Sample Mass:</span> {session.reference?.mass} mg</div>
                          {session.reference?.batchCode && (
                            <div><span className="text-slate-400">Batch Code:</span> {session.reference.batchCode}</div>
                          )}
                          {session.reference?.internalCode && (
                            <div><span className="text-slate-400">Internal Code:</span> {session.reference.internalCode}</div>
                          )}
                        </div>
                      </div>

                      {/* Analytes Snapshot */}
                      <div className="space-y-2">
                        {session.analytes?.map((ana, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                          >
                            <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex justify-between items-center">
                              <span>Analyte {idx + 1}: {ana.name}</span>
                              {session.results?.[idx] && (
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {session.results[idx]?.purity.toFixed(2)}%
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
                              <div><span className="text-slate-400">Integral Area:</span> {ana.integral || '-'}</div>
                              <div><span className="text-slate-400">Protons:</span> {ana.protons || '-'}</div>
                              <div><span className="text-slate-400">Molar Mass:</span> {ana.molarMass} g/mol</div>
                              <div><span className="text-slate-400">Sample Mass:</span> {ana.mass} mg</div>
                              {session.results?.[idx] && (
                                <>
                                  <div><span className="text-slate-400">Abs. Error:</span> ±{session.results[idx]?.absoluteError.toFixed(4)}%</div>
                                  <div><span className="text-slate-400">Rel. Error:</span> {session.results[idx]?.relativeError.toFixed(2)}%</div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleRestore(session)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore This Setup to Active Calculator
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
