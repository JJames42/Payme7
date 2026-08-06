import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Trash2, Plus, RefreshCw, MessageSquare, 
  Brain, Clock, ShieldCheck, CheckCircle2, AlertCircle, 
  HelpCircle, Lightbulb, Bookmark, ArrowRight, Zap
} from 'lucide-react';

interface AIMemory {
  id: string;
  content: string;
  createdAt: string;
  category?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

let activeCopilotSettingsPromise: Promise<any> | null = null;

export const AdminAICopilotSettingsView: React.FC = () => {
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      let data;
      if (activeCopilotSettingsPromise) {
        data = await activeCopilotSettingsPromise;
      } else {
        const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
        activeCopilotSettingsPromise = fetch('/api/admin/ai-copilot-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch AI Copilot settings');
        }).finally(() => {
          activeCopilotSettingsPromise = null;
        });
        data = await activeCopilotSettingsPromise;
      }
      if (data) {
        if (data.memories) setMemories(data.memories);
        if (data.chatHistory) setChatHistory(data.chatHistory);
      }
    } catch (err) {
      console.error("Failed to fetch AI Copilot settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || inputMessage;
    if (!msgToSend.trim() || isSending) return;

    const userText = msgToSend.trim();
    if (!customMsg) setInputMessage('');
    setIsSending(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, tempUserMsg]);

    try {
      const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
      const res = await fetch('/api/admin/ai-copilot-chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chatHistory) setChatHistory(data.chatHistory);
        if (data.memories) setMemories(data.memories);
        if (data.newMemory) {
          showToast(`🧠 New rule saved to memory: "${data.newMemory.content.slice(0, 40)}..."`);
        }
      } else {
        showToast("❌ Failed to get response from AI Copilot.");
      }
    } catch (err) {
      console.error("Chat send error:", err);
      showToast("❌ Network error connecting to AI Copilot.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClearOldSettingsAndMemory = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete all old AI settings, sliders, instructions, and reset memory?\n\nThis will clear old configurations and switch your workspace strictly to Gemini conversational memory mode.")) {
      return;
    }

    try {
      const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
      const res = await fetch('/api/admin/ai-copilot-clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        localStorage.removeItem('payme_ai_custom_instructions');
        localStorage.removeItem('payme_ai_memories');
        await fetchSettings();
        showToast("✅ All old AI settings & memories cleared! Replaced with clean conversational memory.");
      }
    } catch (err) {
      console.error("Clear settings error:", err);
      showToast("❌ Failed to clear old AI settings.");
    }
  };

  const handleAddManualMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;

    try {
      const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
      const res = await fetch('/api/admin/ai-copilot-memories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'add', content: newMemoryInput.trim(), category: 'Manual Rule' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.memories) setMemories(data.memories);
        setNewMemoryInput('');
        showToast(data.notificationToast || "AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error("Add memory error:", err);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
      const res = await fetch('/api/admin/ai-copilot-memories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'delete', memoryId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.memories) setMemories(data.memories);
        showToast(data.notificationToast || "AI Workspace updated. AI Copilot is now using the newest memory version.");
      }
    } catch (err) {
      console.error("Delete memory error:", err);
    }
  };

  const handleClearAllMemories = async () => {
    if (!window.confirm("Are you sure you want to clear all saved AI memories?")) return;
    try {
      const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
      const res = await fetch('/api/admin/ai-copilot-memories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'clear' })
      });
      if (res.ok) {
        setMemories([]);
        showToast("🧹 Cleared all saved memories.");
      }
    } catch (err) {
      console.error("Clear all memories error:", err);
    }
  };

  const handleSaveMessageAsMemory = async (text: string) => {
    try {
      const token = localStorage.getItem('payme_admin_token') || 'demo-admin-token';
      const res = await fetch('/api/admin/ai-copilot-memories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'add', content: text, category: 'Saved Insight' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.memories) setMemories(data.memories);
        showToast("✨ Saved this AI reply to your Infinite Memory Bank!");
      }
    } catch (err) {
      console.error("Save msg as memory error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans overflow-y-auto pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/50 flex items-center gap-3 animate-fade-in font-medium text-sm">
          <Sparkles className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white px-6 py-8 border-b border-rose-900/50 shadow-xl relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Gemini AI Copilot & Unlimited Memory Studio</span>
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Infinite Memory Enabled</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              AI Copilot Conversational Workspace
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Old complex form settings have been replaced by this clean Gemini-style conversational interface. Chat with your AI Copilot naturally to ask anything (even real-time world clocks across different countries!) or instruct the AI to remember rules. Everything saved to your <strong className="text-white">Infinite Memory Bank</strong> is dynamically applied when generating agent reply suggestions for customer chats.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={handleClearOldSettingsAndMemory}
              className="px-4 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2 border border-rose-400/30"
            >
              <Trash2 className="w-4 h-4 text-rose-200" />
              <span>Clear Old AI Settings & Reset Memory</span>
            </button>
            <button
              onClick={fetchSettings}
              className="px-3.5 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: GEMINI CHAT STUDIO (SPAN 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col h-[680px] overflow-hidden relative">
          {/* Chat Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Gemini AI Copilot Chat</h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Ask questions, check world times, or say "Save memory: [your rule]"</p>
              </div>
            </div>
            <div className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-rose-400" />
              <span>{memories.length} Memories Active</span>
            </div>
          </div>

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No messages yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Start conversing with your AI Copilot! You can ask for advice on customer cases, check real-time world clocks across different countries, or instruct the AI what to memorize.
                </p>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-400 px-1">
                    {msg.sender === 'user' ? (
                      <span>You (Admin) • {msg.timestamp}</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Copilot • {msg.timestamp}
                      </span>
                    )}
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm relative group ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-br-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none font-normal whitespace-pre-wrap'
                  }`}>
                    {msg.text}

                    {/* Quick Save as Memory button for AI replies */}
                    {msg.sender === 'ai' && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-slate-400 font-medium">Was this insight helpful?</span>
                        <button
                          onClick={() => handleSaveMessageAsMemory(msg.text)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-rose-200/60 shadow-2xs"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span>Save as Memory</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex items-start animate-pulse">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600 animate-spin">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">AI Copilot is thinking and checking live context...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Try Asking:</span>
            <button
              onClick={() => handleSendMessage(undefined, "Save memory: Always offer a 5% discount or billing credit when a merchant complains about delayed FPS fund settlement")}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-[11px] font-medium rounded-full border border-slate-200 hover:border-rose-300 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <Bookmark className="w-3 h-3 text-rose-500" />
              <span>📌 Save rule: 5% discount for FPS delays</span>
            </button>
            <button
              onClick={() => handleSendMessage(undefined, "What is the current time in Tokyo, London, New York, and Hong Kong right now?")}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-[11px] font-medium rounded-full border border-slate-200 hover:border-rose-300 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <Clock className="w-3 h-3 text-blue-500" />
              <span>🕒 Check current world times across countries</span>
            </button>
            <button
              onClick={() => handleSendMessage(undefined, "What are our standard company rules for handling high-value merchant disputes exceeding HK$50,000?")}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-[11px] font-medium rounded-full border border-slate-200 hover:border-rose-300 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>💡 Ask support best practices</span>
            </button>
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder='Ask anything (e.g. "What time is it in Tokyo?") or say "Save memory: [your rule]"...'
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all placeholder:text-slate-400"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* COLUMN 2: INFINITE MEMORY BANK (SPAN 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col h-[680px] overflow-hidden">
          {/* Memory Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Infinite Memory Bank</h2>
                <p className="text-[10px] text-slate-400 font-medium">No storage limit • Active in agent live chat</p>
              </div>
            </div>
            {memories.length > 0 && (
              <button
                onClick={handleClearAllMemories}
                className="p-1.5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 border border-transparent hover:border-rose-500/30"
                title="Clear all saved memories"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Manual Add Form */}
          <form onSubmit={handleAddManualMemory} className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Add Rule Manually</span>
              <span className="text-[10px] text-rose-600 font-semibold">Instant Enforce</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMemoryInput}
                onChange={(e) => setNewMemoryInput(e.target.value)}
                placeholder="E.g. Always verify BRN before settlement checks..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={!newMemoryInput.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Memory List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No memories stored yet</p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
                  When you tell the AI Copilot in chat to save a memory, or click "Save as Memory", it will appear here without limit!
                </p>
              </div>
            ) : (
              memories.map((mem, idx) => (
                <div
                  key={mem.id}
                  className="bg-white border border-slate-200/80 hover:border-rose-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all space-y-2 group relative animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      #{memories.length - idx}: {mem.category || "Rule"}
                    </span>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Delete this memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {mem.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                    <span>Saved: {mem.createdAt.split(',')[0]}</span>
                    <span className="text-emerald-600 font-sans font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active in Chat
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Memory Footer Info */}
          <div className="p-3 bg-slate-100/80 border-t border-slate-200 text-center shrink-0">
            <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unlimited persistent memory enabled</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
