import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Cpu, Send, Search, Trash2, Edit3, Plus, Check, RefreshCw,
  AlertCircle, ShieldCheck, BookOpen, Layers, CheckCircle2, X, Bookmark,
  HelpCircle, ChevronRight, FileText, Lock, MessageSquare, Database, CornerDownLeft,
  Paperclip, Wrench, RotateCcw, Archive, History
} from 'lucide-react';
import { AIWorkspaceMemory, AIWorkspaceChatMessage } from '../../types';
import { MemoryHistoryModal } from './MemoryHistoryModal';

interface AdminAIWorkspaceViewProps {
  getAuthHeaders?: (additionalHeaders?: Record<string, string>) => Record<string, string>;
  onSessionExpired?: () => void;
}

export const AdminAIWorkspaceView: React.FC<AdminAIWorkspaceViewProps> = ({
  getAuthHeaders,
  onSessionExpired
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'memories'>('assistant');
  const [memories, setMemories] = useState<AIWorkspaceMemory[]>([]);
  const [chatHistory, setChatHistory] = useState<AIWorkspaceChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; type: string; content: string; isBase64: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memory Manager states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [currentEditingMemory, setCurrentEditingMemory] = useState<Partial<AIWorkspaceMemory> | null>(null);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [historyModalMemory, setHistoryModalMemory] = useState<AIWorkspaceMemory | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [copilotToast, setCopilotToast] = useState<string | null>(null);

  const triggerCopilotToast = (msg: string) => {
    setCopilotToast(msg);
    setTimeout(() => {
      setCopilotToast(null);
    }, 5000);
  };

  // Usability states
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [expandedSourceMsgs, setExpandedSourceMsgs] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);

  const THINKING_STEPS = [
    { icon: '🔍', text: 'Reading AI Workspace memories…' },
    { icon: '📚', text: 'Loading saved procedures…' },
    { icon: '💬', text: 'Reading conversation…' },
    { icon: '🧠', text: 'Building prompt…' },
    { icon: '🔎', text: 'Checking workflow stage…' },
    { icon: '📄', text: 'Reading transaction data…' },
    { icon: '✨', text: 'Generating response…' },
    { icon: '✅', text: 'Finalizing answer…' }
  ];

  useEffect(() => {
    let interval: any;
    if (isSending) {
      setThinkingStepIndex(0);
      interval = setInterval(() => {
        setThinkingStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
      }, 700);
    } else {
      setThinkingStepIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSending]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    isUserScrolledUpRef.current = isScrolledUp;
    setShowJumpToBottom(isScrolledUp);
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear this conversation? Your saved AI Workspace memories will remain unchanged.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/ai-workspace/clear-chat', {
        method: 'POST',
        headers: getHeaders()
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        setChatHistory([]);
      }
    } catch (err) {
      console.error('Clear chat error:', err);
      setChatHistory([]);
    }
  };

  const toggleMessageSources = (msgId: string) => {
    setExpandedSourceMsgs(prev =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const categories = [
    'All',
    'Verification Procedures',
    'Payment Workflows',
    'Payment Under Review',
    'Additional Payment Procedures',
    'Compliance & AML/KYC',
    'Pending Approval & Payment Release',
    'Completed Transactions Guidance',
    'Company Policies',
    'Agent Conduct & Tone',
    'Customer Instructions',
    'General Knowledge'
  ];

  const getHeaders = (additional: Record<string, string> = {}) => {
    if (getAuthHeaders) {
      return getAuthHeaders(additional);
    }
    const token = sessionStorage.getItem('payme_admin_token') || localStorage.getItem('payme_admin_token') || '';
    return {
      ...additional,
      'X-Admin-Token': token,
      'Authorization': `Bearer ${token}`
    };
  };

  const handleAuthError = (res: Response) => {
    if (res.status === 401) {
      if (onSessionExpired) {
        onSessionExpired();
      } else {
        sessionStorage.removeItem('payme_admin_token');
        localStorage.removeItem('payme_admin_token');
        window.location.reload();
      }
      return true;
    }
    return false;
  };

  const fetchWorkspaceState = async () => {
    try {
      const res = await fetch('/api/admin/ai-workspace', {
        headers: getHeaders()
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMemories(data.memories || []);
          setChatHistory(data.chatHistory || []);
        }
      }
    } catch (err) {
      console.error('Error fetching AI workspace state:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaceState();
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'assistant') {
      if (!isUserScrolledUpRef.current || isSending) {
        scrollToBottom(true);
      }
    }
  }, [chatHistory, activeTab, isSending, scrollToBottom]);

  useEffect(() => {
    if (!window.visualViewport || activeTab !== 'assistant') return;
    
    const handleViewportChange = () => {
      if (!window.visualViewport || !chatContainerRef.current) return;
      if (!isUserScrolledUpRef.current) {
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        });
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAtts: { name: string; type: string; content: string; isBase64: boolean }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImgOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (isImgOrPdf) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64Data = res.split(',')[1] || res;
            resolve(base64Data);
          };
          reader.readAsDataURL(file);
        });
        newAtts.push({ name: file.name, type: file.type, content: base64, isBase64: true });
      } else {
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || '');
          reader.readAsText(file);
        });
        newAtts.push({ name: file.name, type: file.type || 'text/plain', content: text, isBase64: false });
      }
    }
    setAttachments(prev => [...prev, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && attachments.length === 0) || isSending) return;
    isUserScrolledUpRef.current = false;

    const userText = inputMessage.trim();
    const currentAtts = [...attachments];
    setInputMessage('');
    setAttachments([]);
    setErrorMsg(null);
    setIsSending(true);

    const displayMsgText = userText ? userText : `[Uploaded ${currentAtts.length} file(s): ${currentAtts.map(a => a.name).join(', ')}]`;
    // Optimistically push user message
    const tempUserMsg: AIWorkspaceChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: displayMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAtts.map(a => ({ name: a.name, type: a.type }))
    };
    setChatHistory(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/admin/ai-workspace/chat', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ message: userText, attachments: currentAtts })
      });

      if (handleAuthError(res)) return;

      const data = await res.json();
      if (res.ok && data.success) {
        // Update with verified server response
        if (data.reply) {
          setChatHistory(prev => {
            const filtered = prev.filter(m => !m.id.startsWith('temp-'));
            return [...filtered, tempUserMsg, data.reply];
          });
        }
        if (data.memories) {
          setMemories(data.memories);
        }
      } else {
        setChatHistory(prev => prev.filter(m => !m.id.startsWith('temp-')));
        setErrorMsg(data.error || 'AI is currently unavailable');
      }
    } catch (err) {
      console.error('Send chat error:', err);
      setChatHistory(prev => prev.filter(m => !m.id.startsWith('temp-')));
      setErrorMsg('AI is currently unavailable');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveMemoryFromChat = async (
    category: string,
    content: string,
    title?: string,
    version?: string,
    createdBy?: string,
    structuredKnowledge?: any
  ) => {
    setIsSavingMemory(true);
    try {
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'add',
          title: title || (category ? `${category} Procedure` : 'Support Procedure'),
          category: category || 'General Knowledge',
          content: content,
          version: version || 'v1.0',
          createdBy: createdBy || 'Administrator',
          structuredKnowledge
        })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories(data.memories || []);
      } else {
        setErrorMsg(data.error || 'Failed to save memory.');
      }
    } catch (err) {
      console.error('Save memory error:', err);
      setErrorMsg('Failed to save memory.');
    } finally {
      setIsSavingMemory(false);
    }
  };

  const handleRollbackMemory = async (memoryId: string, targetVersion: string) => {
    try {
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'rollback',
          id: memoryId,
          targetVersion
        })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories(data.memories || []);
        if (data.notificationToast) {
          triggerCopilotToast(data.notificationToast);
        } else {
          triggerCopilotToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
        }
      }
    } catch (err) {
      console.error('Rollback memory error:', err);
    }
  };

  const handleArchiveMemory = async (id: string) => {
    try {
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'archive', id })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories(data.memories || []);
        triggerCopilotToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error('Archive memory error:', err);
    }
  };

  const handleRestoreMemory = async (id: string) => {
    try {
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'restore', id })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories(data.memories || []);
        triggerCopilotToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error('Restore memory error:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this procedure revision?')) return;
    try {
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'delete', id })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories(data.memories || []);
        triggerCopilotToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  };

  const handleClearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all stored AI rules and understanding? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'clear' })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories([]);
        triggerCopilotToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error('Clear memories error:', err);
    }
  };

  const handleSaveModalMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditingMemory?.content?.trim()) return;

    setIsSavingMemory(true);
    try {
      const action = currentEditingMemory.id ? 'edit' : 'add';
      const res = await fetch('/api/admin/ai-workspace/memories', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action,
          id: currentEditingMemory.id,
          title: currentEditingMemory.title || (currentEditingMemory.category ? `${currentEditingMemory.category} Procedure` : 'Support Procedure'),
          category: currentEditingMemory.category || 'General Knowledge',
          content: currentEditingMemory.content.trim(),
          version: currentEditingMemory.version || 'v1.0',
          createdBy: currentEditingMemory.createdBy || 'Administrator',
          isArchived: currentEditingMemory.isArchived || false,
          structuredKnowledge: currentEditingMemory.structuredKnowledge
        })
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories(data.memories || []);
        setIsEditingModalOpen(false);
        setCurrentEditingMemory(null);
        triggerCopilotToast("AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error('Save modal memory error:', err);
    } finally {
      setIsSavingMemory(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    const isArchived = Boolean(m.isArchived);
    const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'archived' ? isArchived : !isArchived);
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (m.title || '').toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.version || '').toLowerCase().includes(q) ||
      (m.createdBy || '').toLowerCase().includes(q) ||
      JSON.stringify(m.structuredKnowledge || {}).toLowerCase().includes(q);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Top Banner / Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm flex items-center justify-center">
            <Cpu className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Enterprise AI Workspace</span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Live Gemini Intelligence
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Real-time enterprise knowledge comprehension, procedure training, and copilot memory governance
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assistant'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
            <span>AI Assistant Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memories')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'memories'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Memory Manager</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {memories.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error Alert Bar */}
      {errorMsg && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs font-medium text-rose-800 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: AI ASSISTANT CHAT */}
      {activeTab === 'assistant' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
          {/* Sub-bar with Clear Chat button & Chat info */}
          <div className="bg-slate-100/90 border-b border-slate-200/80 px-6 py-2 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
              <span>Interactive AI Consultation ({chatHistory.length} messages)</span>
            </div>
            {chatHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 font-bold transition-all shadow-2xs cursor-pointer"
                title="Clear conversation history without deleting saved memories"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>

          {/* Conversation Area */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 scroll-smooth relative"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="max-w-4xl mx-auto space-y-5">
              {chatHistory.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Begin Your Enterprise AI Consultation</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                    Ask questions, teach procedures, or paste long documents. The AI will extract structured knowledge and save understanding only when instructed.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {msg.sender === 'user' ? 'Administrator' : 'Gemini Intelligence'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-3xl rounded-2xl p-4 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white font-medium rounded-br-none border border-slate-800'
                          : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {msg.attachments.map((att, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 shadow-2xs">
                              <FileText className="w-3.5 h-3.5 text-rose-400" />
                              <span className="truncate max-w-[180px]">{att.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Structured Knowledge Display */}
                      {msg.structuredKnowledge && (
                        <div className="mt-4 pt-3 border-t border-slate-200/80 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-2xl space-y-2.5 font-sans">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Extracted Structured Knowledge</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {msg.structuredKnowledge.verificationSteps && msg.structuredKnowledge.verificationSteps.length > 0 && (
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide block mb-1">Verification Steps</span>
                                <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                                  {msg.structuredKnowledge.verificationSteps.map((s, idx) => (
                                    <li key={idx} className="truncate" title={s}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {msg.structuredKnowledge.requiredActions && msg.structuredKnowledge.requiredActions.length > 0 && (
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide block mb-1">Required Actions</span>
                                <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                                  {msg.structuredKnowledge.requiredActions.map((s, idx) => (
                                    <li key={idx} className="truncate" title={s}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {msg.structuredKnowledge.companyPolicies && msg.structuredKnowledge.companyPolicies.length > 0 && (
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block mb-1">Company Policies</span>
                                <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                                  {msg.structuredKnowledge.companyPolicies.map((s, idx) => (
                                    <li key={idx} className="truncate" title={s}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {msg.structuredKnowledge.paymentWorkflow && msg.structuredKnowledge.paymentWorkflow.length > 0 && (
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block mb-1">Payment Workflow</span>
                                <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                                  {msg.structuredKnowledge.paymentWorkflow.map((s, idx) => (
                                    <li key={idx} className="truncate" title={s}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Administrator Confirmation Request Card */}
                      {msg.sender === 'ai' && msg.suggestedMemory && !msg.autoSavedMemoryId && (
                        <div className="mt-4 pt-3 border-t border-slate-200 bg-indigo-50/90 -mx-4 -mb-4 p-4 rounded-b-2xl space-y-3">
                          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Administrator Approval Requested</span>
                          </div>
                          
                          <p className="text-xs text-indigo-900 font-semibold leading-relaxed">
                            "This appears to be a new permanent customer support procedure. Would you like me to save it to the Persistent Support Knowledge Base for future use?"
                          </p>

                          <div className="bg-white p-3 rounded-xl border border-indigo-200/80 shadow-2xs space-y-1.5 font-sans">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {msg.suggestedMemory.title || `${msg.suggestedMemory.category} Procedure`}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                                {msg.suggestedMemory.version || 'v1.0'}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                              <span>Category: <strong className="text-slate-800">{msg.suggestedMemory.category}</strong></span>
                              <span>Created By: <strong className="text-slate-800">{msg.suggestedMemory.createdBy || 'Administrator'}</strong></span>
                            </div>

                            <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono leading-relaxed whitespace-pre-wrap">
                              {msg.suggestedMemory.content}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                const newId = `mem-${Date.now()}`;
                                await handleSaveMemoryFromChat(
                                  msg.suggestedMemory!.category,
                                  msg.suggestedMemory!.content,
                                  msg.suggestedMemory!.title,
                                  msg.suggestedMemory!.version,
                                  msg.suggestedMemory!.createdBy,
                                  msg.structuredKnowledge
                                );
                                setChatHistory(prev => prev.map(m => m.id === msg.id ? { ...m, autoSavedMemoryId: newId } : m));
                              }}
                              disabled={isSavingMemory}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm & Save to Knowledge Base</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChatHistory(prev => prev.map(m => m.id === msg.id ? { ...m, suggestedMemory: undefined } : m));
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Notice if Confirmed & Saved */}
                      {msg.autoSavedMemoryId && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50/70 -mx-4 -mb-4 p-3 rounded-b-2xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Approved & Saved to Persistent Support Knowledge Base (Version v1.0)</span>
                        </div>
                      )}

                      {/* Collapsible Source Summary */}
                      {msg.sender === 'ai' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 -mx-4 -mb-4 p-3 bg-slate-50/80 rounded-b-2xl">
                          <button
                            type="button"
                            onClick={() => toggleMessageSources(msg.id)}
                            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Sources Used</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium">
                                {(msg.sourcesUsed || ['AI Workspace Memories', 'Customer Conversation', 'Current Workflow Stage', 'Company Procedures']).length} Verified
                              </span>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expandedSourceMsgs.includes(msg.id) ? 'rotate-90' : ''}`} />
                          </button>

                          {expandedSourceMsgs.includes(msg.id) && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-fadeIn">
                              {(msg.sourcesUsed || [
                                'AI Workspace Memories',
                                'Customer Conversation',
                                'Current Workflow Stage',
                                'Company Procedures'
                              ]).map((src, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{src}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tools Used Badge */}
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-mono -mx-4 -mb-4 p-3 bg-slate-50 rounded-b-2xl">
                          <Wrench className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="font-bold text-slate-800">Executed Live Tools:</span>
                          {msg.toolsUsed.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-bold shadow-2xs text-[11px]">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* AI Thinking / Reasoning Progress Panel */}
              {isSending && (
                <div className="flex flex-col items-start animate-fadeIn">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 animate-spin text-rose-500" />
                      Gemini Reasoning Engine
                    </span>
                  </div>
                  <div className="bg-white border border-rose-200/90 rounded-2xl rounded-bl-none p-4 shadow-sm max-w-sm w-full space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                      <span className="text-base animate-pulse">{THINKING_STEPS[thinkingStepIndex].icon}</span>
                      <span className="truncate">{THINKING_STEPS[thinkingStepIndex].text}</span>
                    </div>
                    {/* Animated Step Dots / Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(15, ((thinkingStepIndex + 1) / THINKING_STEPS.length) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Step {thinkingStepIndex + 1} of {THINKING_STEPS.length}</span>
                      <span className="animate-pulse font-semibold text-rose-500">Processing Live...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Jump to Latest Floating Button */}
            {showJumpToBottom && (
              <button
                type="button"
                onClick={() => {
                  isUserScrolledUpRef.current = false;
                  scrollToBottom(true);
                  setShowJumpToBottom(false);
                }}
                className="sticky bottom-2 ml-auto mr-2 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer animate-bounce"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-rose-400 rotate-90" />
                <span>Jump to Latest</span>
              </button>
            )}
          </div>

          {/* Input Bar */}
          <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-sm" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            {attachments.length > 0 && (
              <div className="max-w-4xl mx-auto mb-2.5 flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 px-1">Attached ({attachments.length}):</span>
                {attachments.map((att, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-medium shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate max-w-[150px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 border border-slate-200 shadow-2xs"
                title="Attach PDF, document, screenshot, or text file"
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a question, upload PDFs/screenshots, or teach compliance procedures..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={(!inputMessage.trim() && attachments.length === 0) || isSending}
                className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 ${
                  (!inputMessage.trim() && attachments.length === 0) || isSending
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                ) : (
                  <Send className="w-4 h-4 text-rose-400" />
                )}
                <span>Send</span>
              </button>
            </form>
            <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
              <span>Tip: Press Shift + Enter for new lines. Upload PDFs or screenshots to analyze instructions.</span>
              <span>Gemini Pro Enterprise Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMORY & KNOWLEDGE BANK */}
      {activeTab === 'memories' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Status Filter Tabs & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search procedure title, content, version, creator..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  Active ({memories.filter(m => !m.isArchived).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('archived')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'archived'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  Archived ({memories.filter(m => m.isArchived).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  All ({memories.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentEditingMemory({
                      title: 'New Support Procedure',
                      category: 'Verification Procedures',
                      content: '',
                      version: 'v1.0',
                      createdBy: 'Administrator',
                      isArchived: false
                    });
                    setIsEditingModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Add Support Procedure</span>
                </button>
                {memories.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllMemories}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    title="Clear all stored understanding"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Memory Grid */}
            {filteredMemories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Support Procedures Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  {searchQuery || selectedCategory !== 'All' || statusFilter !== 'all'
                    ? 'No support procedures match your filter criteria. Try clearing search filters or changing the status view.'
                    : 'The Persistent Support Knowledge Base is empty. Teach new procedures in AI Chat or click "Add Support Procedure" above.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative animate-fadeIn ${
                      mem.isArchived ? 'border-amber-200 bg-amber-50/20 opacity-85' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header Title & Version Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {mem.title || `${mem.category} Procedure`}
                          </h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200/80">
                            {mem.category}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-200/80">
                            {mem.version || 'v1.0'}
                          </span>
                          {mem.isArchived ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Archived
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Box */}
                      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono whitespace-pre-wrap line-clamp-6 group-hover:line-clamp-none transition-all">
                        {mem.content}
                      </p>

                      {/* Versioning Metadata */}
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center justify-between">
                          <span>Created: <strong>{mem.createdAt}</strong></span>
                          <span>By: <strong>{mem.createdBy || 'Administrator'}</strong></span>
                        </div>
                        <div className="text-slate-400">
                          Last Updated: <strong>{mem.lastUpdated || mem.createdAt}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentEditingMemory(mem);
                            setIsEditingModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryModalMemory(mem);
                            setIsHistoryModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200/80 transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-rose-600" />
                          <span>History & Rollback</span>
                        </button>
                        {mem.isArchived ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreMemory(mem.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchiveMemory(mem.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                            <span>Archive</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Procedure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SUPPORT PROCEDURE */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm sm:text-base font-bold">
                  {currentEditingMemory?.id ? 'Edit Support Procedure Revision' : 'Add Permanent Support Procedure'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingModalOpen(false);
                  setCurrentEditingMemory(null);
                }}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModalMemory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Procedure Title
                </label>
                <input
                  type="text"
                  value={currentEditingMemory?.title || ''}
                  onChange={(e) => setCurrentEditingMemory(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="E.g., BRN Verification for Payment Under Review"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Knowledge Category
                  </label>
                  <select
                    value={currentEditingMemory?.category || 'Verification Procedures'}
                    onChange={(e) => setCurrentEditingMemory(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Version Number
                  </label>
                  <input
                    type="text"
                    value={currentEditingMemory?.version || 'v1.0'}
                    onChange={(e) => setCurrentEditingMemory(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="E.g., v1.0, v1.1, v2.0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Created / Authorized By
                </label>
                <input
                  type="text"
                  value={currentEditingMemory?.createdBy || 'Administrator'}
                  onChange={(e) => setCurrentEditingMemory(prev => ({ ...prev, createdBy: e.target.value }))}
                  placeholder="E.g., Administrator, Compliance Lead"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Permanent Support Procedure Content
                </label>
                <textarea
                  value={currentEditingMemory?.content || ''}
                  onChange={(e) => setCurrentEditingMemory(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  placeholder="State the explicit permanent support policy or procedure..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(currentEditingMemory?.isArchived)}
                    onChange={(e) => setCurrentEditingMemory(prev => ({ ...prev, isArchived: e.target.checked }))}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Archive this procedure revision</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingModalOpen(false);
                      setCurrentEditingMemory(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMemory || !currentEditingMemory?.content?.trim()}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingMemory && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Procedure</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Memory History Change Log & Version Comparison Modal */}
      <MemoryHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryModalMemory(null);
        }}
        memory={historyModalMemory}
        onRollback={handleRollbackMemory}
        showToast={triggerCopilotToast}
      />

      {/* Floating Copilot Notification Toast */}
      {copilotToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slideUp">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">AI Copilot Live Memory Synchronized</p>
            <p className="text-[11px] text-slate-300 font-medium">{copilotToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setCopilotToast(null)}
            className="text-slate-400 hover:text-white p-1 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
