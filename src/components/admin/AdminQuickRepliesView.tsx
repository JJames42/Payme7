import React, { useState, useEffect } from 'react';
import { Zap, Sliders, Tag, Plus, Edit2, Trash2, CheckCircle2, MessageSquare, Copy, Check, X } from 'lucide-react';

interface AdminQuickRepliesViewProps {
  activeNav: string;
  onRunMacro?: (macro: any) => void;
}

const DEFAULT_REPLIES = [
  { id: 'qr-1', title: 'Identity Verification Request', shortcut: '/id', content: 'To process your release, we require a clear copy of your identity proof. Please use the document upload feature below.' },
  { id: 'qr-2', title: 'Security Audit Hold Notice', shortcut: '/hold', content: 'This transaction is currently on hold for routine security audits. It has been routed to our clearance department.' },
  { id: 'qr-3', title: 'Funds Clearance Resolved', shortcut: '/release', content: 'Good news! The security hold on your funds has been successfully released. The funds will settle in your merchant balance within 2 hours.' },
  { id: 'qr-4', title: 'Secondary Bank Validation', shortcut: '/bank', content: 'Our risk compliance team requested a business invoice or bank transaction record for secondary validation. Please upload it.' },
];

const DEFAULT_MACROS = [
  { id: 'mac-1', name: 'Standard Risk Release Flow', action: 'Unlock Customer + Enable Uploads + Send Identity Request', trigger: 'Auto on Risk Review' },
  { id: 'mac-2', name: 'Immediate Escalation to L2', action: 'Transfer Case to Supervisor + Set Priority High', trigger: 'Manual Trigger' },
  { id: 'mac-3', name: 'Close & Request Feedback', action: 'Send Resolved Note + Resolve Case + Trigger CSAT Survey', trigger: 'End of Case' },
];

const DEFAULT_TAGS = [
  { id: 'tag-1', label: 'Risk Clearance', count: 18, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'tag-2', label: 'Identity Verification', count: 24, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'tag-3', label: 'Refund Processing', count: 12, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'tag-4', label: 'Account Security', count: 9, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'tag-5', label: 'General Inquiry', count: 31, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const AdminQuickRepliesView: React.FC<AdminQuickRepliesViewProps> = ({ activeNav, onRunMacro }) => {
  const isMacros = activeNav === 'Macros';
  const isTags = activeNav === 'Tags';

  const [replies, setReplies] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_replies');
      return saved ? JSON.parse(saved) : DEFAULT_REPLIES;
    } catch { return DEFAULT_REPLIES; }
  });

  const [macros, setMacros] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_macros');
      return saved ? JSON.parse(saved) : DEFAULT_MACROS;
    } catch { return DEFAULT_MACROS; }
  });

  const [tags, setTags] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('payme_admin_tags');
      return saved ? JSON.parse(saved) : DEFAULT_TAGS;
    } catch { return DEFAULT_TAGS; }
  });

  useEffect(() => {
    try { localStorage.setItem('payme_admin_replies', JSON.stringify(replies)); } catch {}
  }, [replies]);

  useEffect(() => {
    try { localStorage.setItem('payme_admin_macros', JSON.stringify(macros)); } catch {}
  }, [macros]);

  useEffect(() => {
    try { localStorage.setItem('payme_admin_tags', JSON.stringify(tags)); } catch {}
  }, [tags]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [modalType, setModalType] = useState<'qr' | 'macro' | 'tag' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formShortcut, setFormShortcut] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTrigger, setFormTrigger] = useState('');
  const [formColor, setFormColor] = useState('bg-rose-50 text-rose-700 border-rose-200');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openAddModal = () => {
    setEditingId(null);
    if (isMacros) {
      setFormTitle('');
      setFormContent('');
      setFormTrigger('Manual Trigger');
      setModalType('macro');
    } else if (isTags) {
      setFormTitle('');
      setFormColor('bg-rose-50 text-rose-700 border-rose-200');
      setModalType('tag');
    } else {
      setFormTitle('');
      setFormShortcut('/');
      setFormContent('');
      setModalType('qr');
    }
  };

  const openEditModal = (type: 'qr' | 'macro' | 'tag', item: any) => {
    setEditingId(item.id);
    setModalType(type);
    if (type === 'qr') {
      setFormTitle(item.title);
      setFormShortcut(item.shortcut);
      setFormContent(item.content);
    } else if (type === 'macro') {
      setFormTitle(item.name);
      setFormContent(item.action);
      setFormTrigger(item.trigger);
    } else if (type === 'tag') {
      setFormTitle(item.label);
      setFormColor(item.color);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (modalType === 'qr') {
      if (editingId) {
        setReplies((prev: any[]) => prev.map((item: any) => item.id === editingId ? { ...item, title: formTitle, shortcut: formShortcut.startsWith('/') ? formShortcut : `/${formShortcut}`, content: formContent } : item));
      } else {
        const newQr = { id: `qr-${Date.now()}`, title: formTitle, shortcut: formShortcut.startsWith('/') ? formShortcut : `/${formShortcut}`, content: formContent };
        setReplies((prev: any[]) => [newQr, ...prev]);
      }
    } else if (modalType === 'macro') {
      if (editingId) {
        setMacros((prev: any[]) => prev.map((item: any) => item.id === editingId ? { ...item, name: formTitle, action: formContent, trigger: formTrigger || 'Manual Trigger' } : item));
      } else {
        const newMac = { id: `mac-${Date.now()}`, name: formTitle, action: formContent, trigger: formTrigger || 'Manual Trigger' };
        setMacros((prev: any[]) => [newMac, ...prev]);
      }
    } else if (modalType === 'tag') {
      if (editingId) {
        setTags((prev: any[]) => prev.map((item: any) => item.id === editingId ? { ...item, label: formTitle, color: formColor } : item));
      } else {
        const newTag = { id: `tag-${Date.now()}`, label: formTitle, count: 0, color: formColor };
        setTags((prev: any[]) => [newTag, ...prev]);
      }
    }
    setModalType(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              {isMacros ? <Sliders className="w-4 h-4" /> : isTags ? <Tag className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isMacros ? 'Automated Action Macros & Workflows' : isTags ? 'Conversation Topic Tags & Categorization' : 'Quick Replies & Canned Response Library'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isMacros
              ? 'Execute multi-step automation sequences to streamline standard compliance routines.'
              : isTags
              ? 'Organize conversations with semantic topic tags and monitor volume distributions.'
              : 'Empower agents with instant, standardized response snippets triggered by slash commands.'}
          </p>
        </div>

        <button onClick={openAddModal} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>{isMacros ? 'Create New Macro' : isTags ? 'Add New Tag' : 'Add Quick Reply'}</span>
        </button>
      </div>

      {/* Content Section */}
      {isTags ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((t: any) => (
            <div key={t.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${t.color}`}>
                  <Tag className="w-3 h-3" />
                  <span>{t.label}</span>
                </span>
                <div className="text-[11px] text-slate-400 font-semibold pt-1">{t.count} associated conversations</div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => openEditModal('tag', t)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" title="Edit Tag">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTags((prev: any[]) => prev.filter((item: any) => item.id !== t.id))}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Tag"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : isMacros ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs divide-y divide-slate-100">
          {macros.map((mac: any) => (
            <div key={mac.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-slate-900">{mac.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{mac.trigger}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{mac.action}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onRunMacro ? onRunMacro(mac) : alert('Macro "' + mac.name + '" selected. Switch to an active conversation to apply its actions.')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                  Run Macro
                </button>
                <button onClick={() => openEditModal('macro', mac)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" title="Edit Macro">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMacros((prev: any[]) => prev.filter((item: any) => item.id !== mac.id))}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Macro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {replies.map((qr: any) => (
            <div key={qr.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{qr.title}</h4>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[11px] font-bold">{qr.shortcut}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  "{qr.content}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCopy(qr.id, qr.content)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === qr.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === qr.id ? 'Copied to Clipboard' : 'Copy Snippet'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal('qr', qr)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer" title="Edit Quick Reply">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReplies((prev: any[]) => prev.filter((item: any) => item.id !== qr.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete Quick Reply"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DIALOG */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? `Edit ${modalType === 'qr' ? 'Quick Reply' : modalType === 'macro' ? 'Macro' : 'Tag'}` : `Create New ${modalType === 'qr' ? 'Quick Reply' : modalType === 'macro' ? 'Macro' : 'Tag'}`}
              </h3>
              <button type="button" onClick={() => setModalType(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {modalType === 'qr' ? 'Reply Title' : modalType === 'macro' ? 'Macro Name' : 'Tag Label'}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={modalType === 'qr' ? 'e.g., Identity Verification Request' : modalType === 'macro' ? 'e.g., Standard Risk Release Flow' : 'e.g., VIP Dispute'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              {modalType === 'qr' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Slash Command Shortcut</label>
                    <input
                      type="text"
                      required
                      value={formShortcut}
                      onChange={(e) => setFormShortcut(e.target.value)}
                      placeholder="/id"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                    <textarea
                      required
                      rows={4}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Enter the standardized response message..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </>
              )}

              {modalType === 'macro' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Action Description</label>
                    <textarea
                      required
                      rows={3}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="e.g., Unlock Customer + Enable Uploads + Send Identity Request"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Trigger Condition</label>
                    <input
                      type="text"
                      value={formTrigger}
                      onChange={(e) => setFormTrigger(e.target.value)}
                      placeholder="e.g., Auto on Risk Review or Manual Trigger"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'tag' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color Scheme</label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 bg-white"
                  >
                    <option value="bg-rose-50 text-rose-700 border-rose-200">Rose / Red Alert</option>
                    <option value="bg-amber-50 text-amber-700 border-amber-200">Amber / Warning</option>
                    <option value="bg-blue-50 text-blue-700 border-blue-200">Blue / Info</option>
                    <option value="bg-purple-50 text-purple-700 border-purple-200">Purple / Special</option>
                    <option value="bg-emerald-50 text-emerald-700 border-emerald-200">Emerald / Success</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
                  {editingId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
