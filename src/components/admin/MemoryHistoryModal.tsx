import React, { useState } from 'react';
import {
  Clock, RotateCcw, GitCompare, ShieldCheck, CheckCircle2,
  FileText, History, X, AlertCircle, Sparkles, ChevronRight,
  ArrowRight, Check, CornerDownLeft
} from 'lucide-react';
import { AIWorkspaceMemory, MemoryHistoryEvent, MemoryVersionSnapshot } from '../../types';

interface MemoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: AIWorkspaceMemory | null;
  onRollback: (memoryId: string, targetVersion: string) => Promise<void>;
  showToast?: (msg: string) => void;
}

export const MemoryHistoryModal: React.FC<MemoryHistoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onRollback,
  showToast
}) => {
  if (!isOpen || !memory) return null;

  const [activeTab, setActiveTab] = useState<'compare' | 'audit'>('compare');
  const [selectedPastVersion, setSelectedPastVersion] = useState<string>(() => {
    if (memory.versions && memory.versions.length > 1) {
      return memory.versions[1].version;
    }
    return memory.versions?.[0]?.version || memory.version || 'v1.0';
  });
  const [isRollingBack, setIsRollingBack] = useState(false);

  const versions: MemoryVersionSnapshot[] = memory.versions || [
    {
      version: memory.version || 'v1.0',
      timestamp: memory.createdAt || new Date().toISOString(),
      adminName: memory.createdBy || 'Administrator',
      title: memory.title || 'Support Procedure',
      category: memory.category || 'General Knowledge',
      content: memory.content
    }
  ];

  const historyEvents: MemoryHistoryEvent[] = memory.history || [
    {
      id: `init-${memory.id}`,
      timestamp: memory.createdAt || new Date().toISOString(),
      adminName: memory.createdBy || 'Administrator',
      memoryId: memory.id,
      memoryTitle: memory.title || 'Support Procedure',
      version: memory.version || 'v1.0',
      action: 'Created',
      currentContent: memory.content,
      currentTitle: memory.title,
      details: 'Initial memory creation'
    }
  ];

  const currentSnapshot = versions.find(v => v.version === memory.version) || versions[0] || {
    version: memory.version || 'v1.0',
    timestamp: memory.lastUpdated || memory.createdAt,
    adminName: memory.createdBy || 'Administrator',
    title: memory.title || '',
    category: memory.category || '',
    content: memory.content
  };

  const selectedSnapshot = versions.find(v => v.version === selectedPastVersion) || versions[versions.length - 1] || currentSnapshot;

  const handleRollbackClick = async () => {
    if (!selectedSnapshot) return;
    const confirmMsg = `Are you sure you want to restore Version ${selectedSnapshot.version}?\n\nThis will create a new version and set it as active for AI Copilot immediately.`;
    if (!window.confirm(confirmMsg)) return;

    setIsRollingBack(true);
    try {
      await onRollback(memory.id, selectedSnapshot.version);
      if (showToast) {
        showToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
      onClose();
    } catch (err) {
      console.error("Rollback error:", err);
    } finally {
      setIsRollingBack(false);
    }
  };

  // Basic diff generator
  const renderDiffContent = (oldStr: string, newStr: string) => {
    const oldLines = (oldStr || '').split('\n');
    const newLines = (newStr || '').split('\n');

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Old / Previous Version Box */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 flex flex-col font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] font-sans">
            <span className="flex items-center gap-1.5 font-bold text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Previous ({selectedSnapshot.version})</span>
            </span>
            <span className="text-slate-500 text-[10px]">{selectedSnapshot.timestamp}</span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[280px] leading-relaxed">
            {oldLines.map((line, idx) => {
              const isRemoved = !newLines.includes(line);
              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded text-[11px] ${
                    isRemoved
                      ? 'bg-rose-950/80 text-rose-300 border-l-2 border-rose-500 font-semibold'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="select-none text-slate-600 mr-2 text-[10px]">{idx + 1}</span>
                  {line || <span className="italic text-slate-600">(empty line)</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* New / Active Version Box */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 flex flex-col font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] font-sans">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Current Active ({currentSnapshot.version})</span>
            </span>
            <span className="text-slate-500 text-[10px]">{currentSnapshot.timestamp}</span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[280px] leading-relaxed">
            {newLines.map((line, idx) => {
              const isAdded = !oldLines.includes(line);
              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded text-[11px] ${
                    isAdded
                      ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-500 font-semibold'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="select-none text-slate-600 mr-2 text-[10px]">{idx + 1}</span>
                  {line || <span className="italic text-slate-600">(empty line)</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'Created':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Edited':
      case 'Version updated':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Renamed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Archived':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Restored':
      case 'Rolled back':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Deleted':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Memory Change History & Version Comparison</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-400/30">
                  {memory.version || 'v1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {memory.title || `${memory.category} Procedure`} • ID: <code className="text-rose-300 font-mono text-[11px]">{memory.id}</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-rose-600" />
              <span>Version Comparison & Roll Back</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Audit Log & Change Events ({historyEvents.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Administrator Authorized</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {activeTab === 'compare' && (
            <div className="space-y-6">
              {/* Version Selector Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>Select Past Version to Compare:</span>
                  </label>
                  <select
                    value={selectedPastVersion}
                    onChange={(e) => setSelectedPastVersion(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        {v.version} {v.version === currentSnapshot.version ? '(Current Active)' : ''} - {v.timestamp} ({v.adminName})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPastVersion !== currentSnapshot.version && (
                  <button
                    type="button"
                    onClick={handleRollbackClick}
                    disabled={isRollingBack}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 ${isRollingBack ? 'animate-spin' : ''}`} />
                    <span>Restore Version {selectedSnapshot.version} (Roll Back)</span>
                  </button>
                )}
              </div>

              {/* Version Metadata Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Selected Past Version ({selectedSnapshot.version})</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{selectedSnapshot.title}</div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>Admin: <strong>{selectedSnapshot.adminName}</strong></span>
                    <span>Date: <strong>{selectedSnapshot.timestamp}</strong></span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Current Active Copilot Version ({currentSnapshot.version})</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{currentSnapshot.title}</div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>Admin: <strong>{currentSnapshot.adminName}</strong></span>
                    <span>Date: <strong>{currentSnapshot.timestamp}</strong></span>
                  </div>
                </div>
              </div>

              {/* Diff Content Box */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-rose-600" />
                  <span>Line-by-Line Content Difference</span>
                </h4>
                {renderDiffContent(selectedSnapshot.content, currentSnapshot.content)}
              </div>

              {/* Notice Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Zero-Loss Rollback Guarantee</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Restoring a previous version creates a new version entry and immediately updates the active memory used by the AI Copilot. Previous history entries and versions are preserved permanently.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Complete Event History Log
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  {historyEvents.length} Events Logged
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {historyEvents.map((evt) => (
                    <div key={evt.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getActionBadgeClass(evt.action)}`}>
                            {evt.action}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Version {evt.version}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600 font-medium">
                            {evt.memoryTitle}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400">
                          {evt.timestamp}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Admin: <strong className="text-slate-800">{evt.adminName}</strong></span>
                        <span className="font-mono text-[10px] text-slate-400">Memory ID: {evt.memoryId}</span>
                      </div>

                      {evt.details && (
                        <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                          {evt.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>AI Copilot Live Memory Synchronized</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
