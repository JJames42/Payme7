import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, Shield, Users, MessageSquare, AlertCircle, RefreshCw, 
  CheckCircle2, Lock, Unlock, FileText, Ban, Trash2, ArrowUpRight, Search,
  TrendingUp, Settings, File, Phone, User, Mail, DollarSign, Clock, Send,
  Play, Pause, Download, Volume2, Plus, Sparkles, Filter, CheckCircle, Check, CheckCheck,
  Keyboard, Globe, Wifi, Monitor, Smartphone, Cpu, ShieldCheck, Activity, Eye, Radio, Server, MapPin,
  Ticket, Zap, UserCheck, Layers, Sliders, Tag, BarChart2, Smile, Bell, ChevronDown, ChevronUp,
  MoreVertical, FilePlus, Edit, Edit3, X, Menu, Star, Paperclip, Image as ImageIcon, CornerUpRight,
  LayoutDashboard, ChevronRight, Loader2, Mic, Briefcase, AlertTriangle, ThumbsUp, ThumbsDown, HelpCircle, Lightbulb, Bot
} from 'lucide-react';
import { ChatSession, Agent, Transaction, Message, CaseInstruction, AICopilotReplySuggestion } from '../types.ts';
import { PayMeLogo } from './MerchantLogos';
import { AdminTicketsView } from './admin/AdminTicketsView';
import { AdminAnalyticsView } from './admin/AdminAnalyticsView';
import { AdminQuickRepliesView } from './admin/AdminQuickRepliesView';
import { AdminAgentsView } from './admin/AdminAgentsView';
import { AdminIntegrationsView } from './admin/AdminIntegrationsView';
import { AdminGeneralSettingsView } from './admin/AdminGeneralSettingsView';
import { AdminAIWorkspaceView } from './admin/AdminAIWorkspaceView';

const getTopicMetadata = (topic?: string) => {
  const t = topic || 'General Inquiry';
  if (t.includes('Account')) return { category: 'Merchant Accounts', subcategory: 'Login, Profile & KYC Verification' };
  if (t.includes('Payment')) return { category: 'Financial Transactions', subcategory: 'Payments, Holds & Refunds' };
  if (t.includes('Transfer')) return { category: 'Fund Transfers', subcategory: 'Sending & Receiving Money' };
  if (t.includes('Transaction')) return { category: 'Dispute & Clearance', subcategory: 'Failed, Pending & Disputes' };
  if (t.includes('Security')) return { category: 'Risk & Compliance', subcategory: 'Fraud, Security & Privacy' };
  if (t.includes('Verification')) return { category: 'Risk & Compliance', subcategory: 'Identity, Documents & KYC' };
  return { category: 'General Assistance', subcategory: 'Miscellaneous Inquiries' };
};

interface AdminDashboardProps {
  onBackToHome: () => void;
}

export default function AdminDashboard({ onBackToHome }: AdminDashboardProps) {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem('payme_admin_token'));
  const [employeeId, setEmployeeId] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(''); 

  const getAuthHeaders = useCallback((additionalHeaders: Record<string, string> = {}) => {
    const token = adminToken || sessionStorage.getItem('payme_admin_token') || '';
    return {
      ...additionalHeaders,
      'X-Admin-Token': token,
      'Authorization': `Bearer ${token}`,
      'X-Supervisor-Id': selectedSupervisorId || ''
    };
  }, [adminToken, selectedSupervisorId]);

  // Dashboard Data State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [supervisorDropdownOpen, setSupervisorDropdownOpen] = useState(false);
  const hasInitialLoggedInRef = useRef(false);
  const [agentReply, setAgentReply] = useState('');
  const [replyTab, setReplyTab] = useState<'reply' | 'internal'>('reply');
  const [loading, setLoading] = useState(false);
  const [acceptingCaseId, setAcceptingCaseId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(true);
  const lastChatsEtagRef = useRef<string | null>(null);
  
  // --- Enterprise AI Copilot & Polish State ---
  const [isPolishingText, setIsPolishingText] = useState(false);
  const [isGeneratingCopilot, setIsGeneratingCopilot] = useState(false);
  const [activeCopilotSuggestion, setActiveCopilotSuggestion] = useState<AICopilotReplySuggestion | null>(null);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  
  // Navigation & Search State
  const [activeNav, setActiveNav] = useState<string>('Live Chat');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'chats' | 'chat' | 'details'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [topSearchQuery, setTopSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'resolved'>('all');

  // Real Notification System State
  const [readChatIds, setReadChatIds] = useState<Set<string>>(new Set());
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const [notifDropdownStyle, setNotifDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (showNotificationsDropdown && bellBtnRef.current) {
      const rect = bellBtnRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = Math.min(380, windowWidth - 24);
      let left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
      if (left < 12) left = 12;
      if (left + dropdownWidth > windowWidth - 12) left = windowWidth - dropdownWidth - 12;
      setNotifDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        maxHeight: 'calc(100vh - 80px)'
      });
    }
  }, [showNotificationsDropdown]);

  // Admin Composer File & Voice Input Refs
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const adminImageInputRef = useRef<HTMLInputElement>(null);
  const adminDocInputRef = useRef<HTMLInputElement>(null);
  const [isAdminRecording, setIsAdminRecording] = useState(false);

  const [showQuickRepliesDropdown, setShowQuickRepliesDropdown] = useState(false);
  const adminMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const adminAudioChunksRef = useRef<Blob[]>([]);

  // Accordion Expand/Collapse States for Right Sidebar
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [presenceExpanded, setPresenceExpanded] = useState(false);
  const [restrictionsExpanded, setRestrictionsExpanded] = useState(false);
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [transferExpanded, setTransferExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [caseStatusExpanded, setCaseStatusExpanded] = useState(true);
  const [caseProgressExpanded, setCaseProgressExpanded] = useState(true);
  const [requiredActionsExpanded, setRequiredActionsExpanded] = useState(false);
  const [macrosPanelExpanded, setMacrosPanelExpanded] = useState(false);
  const [tagsPanelExpanded, setTagsPanelExpanded] = useState(false);
  const [activeCaseTags, setActiveCaseTags] = useState<string[]>([]);

  // Case Status & Required Actions editing state
  const [csTitle, setCsTitle] = useState('Case Status');
  const [csSubtitle, setCsSubtitle] = useState('Received');
  const [raTitle, setRaTitle] = useState('REQUIRED ACTIONS');
  const [raHeading, setRaHeading] = useState('');
  const [raContent, setRaContent] = useState('');

  // Interactive Builders State
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);
  const [instTitle, setInstTitle] = useState('');
  const [instCategory, setInstCategory] = useState<'Identity Verification' | 'Refund Required' | 'Bank Review' | 'Document Required' | 'Additional Information'>('Identity Verification');
  const [instDesc, setInstDesc] = useState('');

  // Payment Builder State
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [payEnabled, setPayEnabled] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payCurrency, setPayCurrency] = useState('HKD');
  const [payStatus, setPayStatus] = useState<'Awaiting Sender' | 'Awaiting Transfer' | 'Pending Confirmation' | 'Funds Pending' | 'Payment Pending' | 'Transfer Received' | 'Under Review' | 'Verification Complete'>('Awaiting Transfer');
  const [payRef, setPayRef] = useState('');
  const [payDeadline, setPayDeadline] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Internal & Private notes
  const [internalNotesText, setInternalNotesText] = useState('');
  
  // Quick reply templates
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Transfer Chat state
  const [transferTargetAgent, setTransferTargetAgent] = useState('');
  const [transferDropdownOpen, setTransferDropdownOpen] = useState(false);

  const supervisorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supervisorDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (supervisorRef.current && !supervisorRef.current.contains(event.target as Node)) {
        setSupervisorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [supervisorDropdownOpen]);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef<boolean>(true);
  const [hasUnreadNewMessages, setHasUnreadNewMessages] = useState<boolean>(false);
  const prevSelectedChatIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior
      });
    } else {
      chatMessagesEndRef.current?.scrollIntoView({ behavior });
    }
    isUserAtBottomRef.current = true;
    setHasUnreadNewMessages(false);
  }, []);

  const handleChatScroll = () => {
    const container = chatScrollContainerRef.current;
    if (!container) return;

    const threshold = 80;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAtBottom = distanceFromBottom <= threshold;

    isUserAtBottomRef.current = isAtBottom;

    if (isAtBottom && hasUnreadNewMessages) {
      setHasUnreadNewMessages(false);
    }
  };

  // Audio Playback States for Messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Admin notifications tracking
  const prevChatsMessagesCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (chats.length === 0) return;

    const prevCounts = prevChatsMessagesCountRef.current;
    let hasNewCustomerMsg = false;
    let notificationTitle = '';
    let notificationBody = '';

    chats.forEach((chat) => {
      const prevCount = prevCounts[chat.id];
      const currentCount = chat.messages?.length || 0;

      if (prevCount !== undefined) {
        if (currentCount > prevCount) {
          for (let i = prevCount; i < currentCount; i++) {
            const msg = chat.messages[i];
            if (msg.sender === 'customer') {
              hasNewCustomerMsg = true;
              notificationTitle = `New Message from ${chat.userName || 'Customer'}`;
              notificationBody = msg.translationEn || msg.text || (msg.attachment ? 'Sent an attachment' : 'New message received.');
            }
          }
        }
      }
      prevCounts[chat.id] = currentCount;
    });

    if (hasNewCustomerMsg && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(notificationTitle, {
            body: notificationBody,
            icon: '/favicon.ico',
            tag: 'payme-admin-msg',
            silent: false
          });
        } catch (err) {
          console.error('Error showing admin notification:', err);
        }
      }
    }
  }, [chats]);

  useEffect(() => {
    const checkSession = () => {
      const storedToken = sessionStorage.getItem('payme_admin_token') || localStorage.getItem('payme_admin_token');
      if (storedToken) {
        fetch('/api/admin/verify-session', {
          headers: {
            'X-Admin-Token': storedToken,
            'Authorization': `Bearer ${storedToken}`,
            'Cache-Control': 'no-cache'
          }
        })
          .then(r => r.json())
          .then(d => {
            if (d.valid) {
              setAdminToken(storedToken);
              setIsAuthenticated(true);
            } else {
              sessionStorage.removeItem('payme_admin_token');
              localStorage.removeItem('payme_admin_token');
              setAdminToken(null);
              setIsAuthenticated(false);
              setChats([]);
            }
          })
          .catch(() => {
            sessionStorage.removeItem('payme_admin_token');
            localStorage.removeItem('payme_admin_token');
            setAdminToken(null);
            setIsAuthenticated(false);
            setChats([]);
          });
      } else {
        setAdminToken(null);
        setIsAuthenticated(false);
        setChats([]);
      }
    };

    checkSession();

    const handleFocus = () => checkSession();
    const handlePopState = () => checkSession();
    const handlePageShow = () => checkSession();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleLogout = async () => {
    const tokenToInvalidate = adminToken || sessionStorage.getItem('payme_admin_token') || localStorage.getItem('payme_admin_token');
    
    // Clear storage immediately
    sessionStorage.removeItem('payme_admin_token');
    localStorage.removeItem('payme_admin_token');

    if (tokenToInvalidate) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': tokenToInvalidate,
            'Authorization': `Bearer ${tokenToInvalidate}`
          }
        });
      } catch (err) {
        console.warn('Server logout call failed or offline:', err);
      }
    }

    setAdminToken(null);
    setIsAuthenticated(false);
    setChats([]);
    setAgents([]);
    setEmployeeId('');
    setSecurityPin('');
    setSelectedSupervisorId('');
    setSelectedChatId(null);
    hasInitialLoggedInRef.current = false;
    setLoginError(null);

    // Keep URL on /london-site/admin and replace history entry so pressing Back does not navigate to authenticated state
    try {
      const url = new URL(window.location.href);
      url.pathname = '/london-site/admin';
      url.searchParams.delete('admin');
      window.history.replaceState({ loggedOut: true }, '', url.toString());
    } catch (e) {
      // ignore URL parsing fallback
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, securityPin })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setAdminToken(data.token);
        sessionStorage.setItem('payme_admin_token', data.token);
        setIsAuthenticated(true);
        setLoginError(null);
      } else {
        setLoginError(data.error || 'Invalid Employee Security Credentials. Access Denied.');
      }
    } catch (err) {
      setLoginError('Security Gateway Connection Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionExpired = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('payme_admin_token');
    localStorage.removeItem('payme_admin_token');
    setErrorText('Session expired. Please log in again.');
    setIsInitialDataLoading(false);
  }, []);

  // Fetch chats and agents
  const fetchDashboardData = useCallback(async () => {
    const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
    try {
      if (isAuthenticated) {
        const isFirst = !hasInitialLoggedInRef.current;
        if (isFirst) {
          hasInitialLoggedInRef.current = true;
        }
        await fetch('/api/admin/heartbeat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            supervisorId: selectedSupervisorId,
            activeChatId: selectedChatId,
            isInitialLogin: isFirst
          })
        });
      }

      const reqHeaders: Record<string, string> = { ...headers };
      if (lastChatsEtagRef.current) {
        reqHeaders['If-None-Match'] = lastChatsEtagRef.current;
      }

      const chatsRes = await fetch('/api/chats', { headers: reqHeaders });
      const agentsRes = await fetch('/api/agents');

      if (chatsRes.status === 401) {
        handleSessionExpired();
        return;
      }

      if (chatsRes.status === 304 && agentsRes.ok) {
        const agentsData: Agent[] = await agentsRes.json();
        setAgents(agentsData);
        setErrorText(null);
        setIsInitialDataLoading(false);
        return;
      }

      if (chatsRes.ok && agentsRes.ok) {
        const etag = chatsRes.headers.get('ETag');
        if (etag) lastChatsEtagRef.current = etag;
        const chatsData: ChatSession[] = await chatsRes.json();
        const agentsData: Agent[] = await agentsRes.json();
        setChats(chatsData);
        setAgents(agentsData);
        
        if (!selectedChatId && chatsData.length > 0) {
          setSelectedChatId(chatsData[0].id);
        }
        setErrorText(null);
      } else {
        throw new Error('Failed to load dashboard statistics.');
      }
    } catch (err) {
      console.error(err);
      setErrorText('Re-routing secure gateway sync...');
    } finally {
      setIsInitialDataLoading(false);
    }
  }, [getAuthHeaders, isAuthenticated, selectedSupervisorId, selectedChatId, handleSessionExpired]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchDashboardData]);

  const getFormattedTimeAgo = (dateStr?: string, isOnline?: boolean): string => {
    if (isOnline) return 'Active now';
    if (!dateStr) return 'Unavailable';
    if (
      dateStr.toLowerCase().includes('ago') || 
      dateStr.toLowerCase().includes('active') || 
      dateStr.toLowerCase().includes('idle') || 
      dateStr.toLowerCase().includes('offline') || 
      dateStr.toLowerCase().includes('away')
    ) {
      return dateStr;
    }

    const now = Date.now();
    const past = new Date(dateStr).getTime();
    if (isNaN(past) || past <= 0) return dateStr;

    const diffSeconds = Math.max(0, Math.floor((now - past) / 1000));
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getCustomerPresenceState = (chat?: ChatSession | null) => {
    if (!chat) {
      return {
        status: 'Offline' as const,
        colorClass: 'text-slate-500',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-200',
        dotClass: 'bg-slate-400',
        textClass: 'text-slate-500',
        timeAgoStr: 'Offline'
      };
    }

    const connStatus = chat.connectionStatus;
    const isOnlineFlag = chat.customerOnline !== false;
    const now = Date.now();
    const lastSeenMs = chat.lastSeenAt ? new Date(chat.lastSeenAt).getTime() : 0;
    const diffMs = lastSeenMs > 0 ? now - lastSeenMs : 999999;

    // Explicitly disconnected, marked offline, or inactive for > 30s
    if (connStatus === 'Disconnected' || chat.customerOnline === false || diffMs >= 30000) {
      return {
        status: 'Offline' as const,
        colorClass: 'text-slate-600',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-200',
        dotClass: 'bg-slate-400',
        textClass: 'text-slate-500',
        timeAgoStr: chat.lastSeenAt ? getFormattedTimeAgo(chat.lastSeenAt, false) : 'Offline'
      };
    }

    // Reconnecting state: explicit reconnecting status or poll delay between 12s and 30s
    if (connStatus === 'Reconnecting' || diffMs >= 12000) {
      return {
        status: 'Reconnecting…' as const,
        colorClass: 'text-amber-700',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        dotClass: 'bg-amber-500 animate-pulse',
        textClass: 'text-amber-700',
        timeAgoStr: 'Reconnecting…'
      };
    }

    // Actively connected with recent poll (< 12s)
    return {
      status: 'Online' as const,
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      dotClass: 'bg-emerald-500 animate-pulse',
      textClass: 'text-emerald-700',
      timeAgoStr: 'Active now'
    };
  };

  // Memoized current chat and supervisor calculations
  const selectedChat = useMemo(() => chats.find(c => c.id === selectedChatId) || null, [chats, selectedChatId]);
  const activeChatAgent = useMemo(() => agents.find(a => a.id === selectedChat?.agentId) || agents.find(a => a.id === 'carmen-lee') || agents[0] || null, [agents, selectedChat]);
  const activeSupervisor = useMemo(() => agents.find(a => a.id === selectedSupervisorId) || null, [agents, selectedSupervisorId]);
  const activeTransferAgent = useMemo(() => agents.find(a => a.id === transferTargetAgent) || null, [agents, transferTargetAgent]);

  // Determine conversation permissions
  const isSupervisorSelected = Boolean(selectedSupervisorId);
  const isChatAssignedToCurrentSupervisor = Boolean(
    selectedChat && selectedSupervisorId && selectedChat.agentId === selectedSupervisorId
  );

  const hasFullControl = isSupervisorSelected && isChatAssignedToCurrentSupervisor;

  let restrictionReason: string | null = null;
  if (selectedChat?.isClosed) {
    restrictionReason = "This conversation has been closed and is read-only.";
  } else if (!hasFullControl) {
    if (isSupervisorSelected) {
      if (selectedChat && selectedChat.agentId && selectedChat.agentId !== selectedSupervisorId) {
        const ownerAgent = agents.find(a => a.id === selectedChat.agentId);
        const ownerName = ownerAgent ? ownerAgent.name : 'another agent';
        restrictionReason = `This case is owned by ${ownerName}. You have read-only access. Only the Conversation Owner can respond or manage this case. You may transfer the case if needed.`;
      } else {
        restrictionReason = "No customer conversation is currently assigned to you. Please accept this case from the queue to start the conversation.";
      }
    } else {
      restrictionReason = "This conversation is currently in read-only mode. Please select an Assigned Supervisor from the top menu to manage this conversation.";
    }
  }

  const canAgentReply = hasFullControl && !selectedChat?.isClosed;
  const canManageSettings = hasFullControl;
  const canTransferCase = isSupervisorSelected;
  const isUnassignedQueueCase = Boolean((selectedChat?.status === 'pending' || selectedChat?.status === 'bot') && !selectedChat?.agentId && isSupervisorSelected);

  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (selectedChat) {
      setPayEnabled(selectedChat.paymentConfig?.enabled || false);
      setPayAmount(selectedChat.paymentConfig?.amount || 0);
      setPayCurrency(selectedChat.paymentConfig?.currency || 'HKD');
      setPayStatus(selectedChat.paymentConfig?.status || 'Awaiting Transfer');
      setPayRef(selectedChat.paymentConfig?.reference || selectedChat.caseId);
      setPayDeadline(selectedChat.paymentConfig?.deadline || '');
      setPayNotes(selectedChat.paymentConfig?.notes || '');
      setInternalNotesText(selectedChat.internalNotes || '');

      setCsTitle(selectedChat.caseStatusConfig?.title || 'Case Status');
      setCsSubtitle(selectedChat.caseStatusConfig?.subtitle || 'Received');
      setRaTitle(selectedChat.caseStatusConfig?.requiredActionsTitle || 'REQUIRED ACTIONS');
      setRaHeading(selectedChat.caseStatusConfig?.requiredActionsHeading || '');
      setRaContent(selectedChat.caseStatusConfig?.requiredActionsContent || '');
      try {
        const savedTags = localStorage.getItem(`payme_case_tags_${selectedChat.id}`);
        setActiveCaseTags(savedTags ? JSON.parse(savedTags) : ['tag-1', 'tag-5']);
      } catch {
        setActiveCaseTags(['tag-1', 'tag-5']);
      }
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    const textarea = agentTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [agentReply]);

  useEffect(() => {
    if (!selectedChat) {
      prevSelectedChatIdRef.current = null;
      prevMessagesLengthRef.current = 0;
      setHasUnreadNewMessages(false);
      return;
    }

    const isChatSwitched = prevSelectedChatIdRef.current !== selectedChat.id;
    const currentMsgCount = selectedChat.messages?.length || 0;
    const prevMsgCount = prevMessagesLengthRef.current;

    if (isChatSwitched) {
      prevSelectedChatIdRef.current = selectedChat.id;
      prevMessagesLengthRef.current = currentMsgCount;
      setHasUnreadNewMessages(false);
      setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
      return;
    }

    if (currentMsgCount > prevMsgCount) {
      const newMessages = selectedChat.messages.slice(prevMsgCount);
      const lastMsg = newMessages[newMessages.length - 1];
      const isFromAgent = lastMsg && lastMsg.sender === 'agent';

      if (isFromAgent || isUserAtBottomRef.current) {
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 50);
      } else {
        setHasUnreadNewMessages(true);
      }
    }

    prevMessagesLengthRef.current = currentMsgCount;
  }, [selectedChat?.id, selectedChat?.messages?.length, scrollToBottom]);

  const handleSelectChat = (chatOrId: ChatSession | string) => {
    const id = typeof chatOrId === 'string' ? chatOrId : chatOrId.id;
    setSelectedChatId(id);
    setMobileActiveTab('chat');
    setActiveNav('Conversations');
  };

  const handleAcceptChat = async (chatId: string) => {
    if (!selectedSupervisorId) {
      alert("Only the currently Assigned Supervisor can accept new customer requests. Please select an Assigned Supervisor from the top menu first.");
      return;
    }
    try {
      setLoading(true);
      setAcceptingCaseId(chatId);
      const res = await fetch(`/api/chats/${chatId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ agentId: selectedSupervisorId })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to assign agent');
        return;
      }
      await fetchDashboardData();
    } catch (err) {
      alert('Failed to assign agent. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setAcceptingCaseId(null);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/lock`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ isLocked: !selectedChat.isLocked })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUploads = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/toggle-uploads`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ 
          uploadsMuted: !selectedChat.uploadsMuted,
          attachmentsAllowed: selectedChat.uploadsMuted ? true : false,
          voiceNotesAllowed: selectedChat.uploadsMuted ? true : false
        })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVoice = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/toggle-uploads`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ voiceNotesAllowed: !selectedChat.voiceNotesAllowed })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/toggle-block`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ isBlocked: !selectedChat.isBlocked })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete conversation #${selectedChat.id}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setSelectedChatId(null);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopenCase = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/reopen`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnterpriseAiPolish = async () => {
    if (!agentReply.trim() || isPolishingText) return;
    setIsPolishingText(true);
    setCopilotError(null);
    try {
      const res = await fetch('/api/admin/ai-copilot/polish', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: agentReply })
      });
      const data = await res.json();
      if (res.ok && data.success && data.polishedText) {
        setAgentReply(data.polishedText);
      } else {
        setCopilotError(data.error || 'AI is currently unavailable');
      }
    } catch (err) {
      console.error("AI Polish error:", err);
      setCopilotError('AI is currently unavailable');
    } finally {
      setIsPolishingText(false);
    }
  };

  const handleEnterpriseAiCopilot = async (refresh = false) => {
    if (!selectedChat || isGeneratingCopilot) return;
    setIsGeneratingCopilot(true);
    setCopilotError(null);
    try {
      const payload = {
        chatId: selectedChat.id,
        messages: selectedChat.messages,
        selectedIssue: selectedChat.selectedTopic,
        category: selectedChat.selectedTopic,
        customerLanguage: selectedChat.language || 'en',
        caseStatus: selectedChat.status,
        caseProgress: selectedChat.timelineProgress,
        requiredActions: selectedChat.instructions ? selectedChat.instructions.map(i => `${i.title}: ${i.description}`) : [],
        collectedInfo: selectedChat.collectedInfo,
        referenceNumber: selectedChat.collectedInfo?.referenceNumber || selectedChat.collectedInfo?.referenceId || selectedChat.collectedInfo?.transactionId,
        transactions: selectedChat.transactions,
        internalNotes: selectedChat.internalNotes,
        customerInfo: {
          name: selectedChat.userName || 'Valued Merchant',
          email: selectedChat.userEmail,
          phone: selectedChat.phone
        },
        agentInfo: {
          name: activeSupervisor?.name || activeChatAgent?.name || 'Support Specialist'
        },
        refresh,
        previousSuggestion: activeCopilotSuggestion?.text || agentReply
      };

      const res = await fetch('/api/admin/ai-copilot/suggest', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success && data.suggestion) {
        setAgentReply(data.suggestion.text);
        setActiveCopilotSuggestion({
          text: data.suggestion.text,
          reasoning: data.suggestion.reasoning,
          confidence: data.suggestion.confidence,
          supportingProcedureUsed: data.suggestion.supportingProcedureUsed,
          workflowStageUsed: data.suggestion.workflowStageUsed,
          transactionDataUsed: data.suggestion.transactionDataUsed,
          memorySyncDebug: data.suggestion.memorySyncDebug || data.memorySyncDebug || data.memorySyncReport?.debugSummaryFormatted,
          memorySyncReport: data.suggestion.memorySyncReport || data.memorySyncReport
        });
      } else {
        setCopilotError(data.error || 'AI is currently unavailable');
      }
    } catch (err) {
      console.error("AI Copilot error:", err);
      setCopilotError('AI is currently unavailable');
    } finally {
      setIsGeneratingCopilot(false);
    }
  };


  const handleToggleActionsRequired = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/toggle-actions-required`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ actionsRequiredEnabled: !selectedChat.actionsRequiredEnabled })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCaseStatus = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const currentVisible = selectedChat.caseStatusConfig?.visible === true;
      const res = await fetch(`/api/chats/${selectedChat.id}/case-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          caseStatusConfig: {
            ...selectedChat.caseStatusConfig,
            visible: !currentVisible
          }
        })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCaseStatus = async (customSubtitle?: string) => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    const targetSub = customSubtitle !== undefined ? customSubtitle : csSubtitle;
    if (customSubtitle !== undefined) setCsSubtitle(customSubtitle);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/case-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          caseStatusConfig: {
            ...selectedChat.caseStatusConfig,
            title: csTitle,
            subtitle: targetSub
          }
        })
      });
      if (res.ok) {
        await fetchDashboardData();
        if (customSubtitle === undefined) alert('Case Status updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRequiredActions = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/case-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          caseStatusConfig: {
            ...selectedChat.caseStatusConfig,
            requiredActionsTitle: raTitle,
            requiredActionsHeading: raHeading,
            requiredActionsContent: raContent
          }
        })
      });
      if (res.ok) {
        await fetchDashboardData();
        alert('Required Actions updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProgressStep = async (stepId: number, field: string, value: any) => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    const currentSteps = selectedChat.caseStatusConfig?.progressSteps || [
      { id: 1, name: 'Received', status: 'Reviewing', visible: true },
      { id: 2, name: 'Under Review', status: 'Pending', visible: true },
      { id: 3, name: 'Refund Verification', status: 'Pending', visible: true },
      { id: 4, name: 'Completed', status: 'Pending', visible: true }
    ];
    const updatedSteps = currentSteps.map(s => {
      if (s.id === stepId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/case-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          caseStatusConfig: {
            ...selectedChat.caseStatusConfig,
            progressSteps: updatedSteps
          }
        })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmProgressStep = async (stepId: number) => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    const step = (selectedChat.caseStatusConfig?.progressSteps || []).find(s => s.id === stepId);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/confirm-step`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ stepId, timestamp: step?.timestamp, date: step?.date })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.caseStatusConfig?.subtitle) {
          setCsSubtitle(data.caseStatusConfig.subtitle);
        }
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearInstructions = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    if (!window.confirm('Are you sure you want to clear all custom instructions and action required cards from this case?')) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/instructions/clear`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunMacro = async (macro: any) => {
    if (!selectedChat) {
      alert(`Macro "${macro.name}" selected. Open an active conversation to apply its actions.`);
      return;
    }
    let actionSummary = `Running Macro: ${macro.name}...\n`;
    if (macro.action.toLowerCase().includes('unlock') || macro.action.toLowerCase().includes('enable uploads')) {
      try {
        await fetch(`/api/chats/${selectedChat.id}/toggle-uploads`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ uploadsMuted: false })
        });
      } catch {}
      actionSummary += '✓ Unlocked customer file uploads\n';
    }
    if (macro.action.toLowerCase().includes('resolve') || macro.action.toLowerCase().includes('close')) {
      try {
        await fetch(`/api/chats/${selectedChat.id}/resolve`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
      } catch {}
      actionSummary += '✓ Marked case as Resolved\n';
    }
    if (macro.action.toLowerCase().includes('transfer') || macro.action.toLowerCase().includes('escalate')) {
      actionSummary += '✓ Case flagged for supervisor review\n';
    }
    await fetchDashboardData();
    alert(`Macro "${macro.name}" applied to case #${selectedChat.caseId}:\n\n${actionSummary}`);
  };

  const handleUpdateTimeline = async (step: number) => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/timeline`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ progress: step })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !instTitle.trim()) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }

    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/instructions`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: instTitle,
          category: instCategory,
          description: instDesc
        })
      });
      if (res.ok) {
        setIsAddingInstruction(false);
        setInstTitle('');
        setInstDesc('');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInstruction = async (instId: string) => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/instructions/${instId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePaymentConfig = async () => {
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/payment`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          enabled: payEnabled,
          amount: payAmount,
          currency: payCurrency,
          status: payStatus,
          reference: payRef,
          deadline: payDeadline,
          notes: payNotes
        })
      });
      if (res.ok) {
        setIsEditingPayment(false);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferAssignment = async () => {
    if (!selectedChat || !transferTargetAgent) return;
    if (!canTransferCase) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/transfer`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ agentId: transferTargetAgent })
      });
      if (res.ok) {
        setTransferTargetAgent('');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveInternalNotes = async (silent?: boolean | React.MouseEvent) => {
    const isSilent = typeof silent === 'boolean' ? silent : false;
    if (!selectedChat) return;
    if (!canManageSettings) {
      if (!isSilent && restrictionReason) setErrorText(restrictionReason);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/notes`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ internalNotes: internalNotesText })
      });
      if (res.ok && !isSilent) {
        alert('Internal Notes Saved.');
      }
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveChat = async (chatId: string) => {
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    if (!window.confirm('Mark this case as RESOLVED? The conversation will remain temporarily open for customer feedback.')) {
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}/resolve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizeCloseChat = async (chatId: string) => {
    if (!canManageSettings) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    if (!window.confirm('Send final closing message and permanently close this conversation?')) {
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}/finalize-close`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAgentMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedChat) return;

    if (!canAgentReply && restrictionReason) {
      setErrorText(restrictionReason);
      return;
    }

    if (!agentReply.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const messageText = agentReply;
    setAgentReply('');

    handleTypingToggle(false);

    if (replyTab === 'internal') {
      // Save as internal note
      try {
        const updatedNotes = selectedChat.internalNotes 
          ? `${selectedChat.internalNotes}\n\n[Internal Note by Admin]: ${messageText}`
          : `[Internal Note by Admin]: ${messageText}`;
        setInternalNotesText(updatedNotes);
        await fetch(`/api/chats/${selectedChat.id}/notes`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ internalNotes: updatedNotes })
        });
        // Also post as system message for timeline rendering
        await fetch(`/api/chats/${selectedChat.id}/messages`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            sender: 'system',
            text: `Internal Note by Admin: ${messageText}`,
            agentName: activeChatAgent?.name || 'Admin User'
          })
        });
        await fetchDashboardData();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          sender: 'agent',
          text: messageText,
          agentName: activeChatAgent?.name || 'Carmen Lee'
        })
      });
      if (res.ok) {
        await fetchDashboardData();
      } else {
        const errData = await res.json();
        if (errData.error) {
          setErrorText(errData.error);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    if (!canAgentReply && restrictionReason) {
      setErrorText(restrictionReason);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await fetch(`/api/chats/${selectedChat.id}/messages`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            sender: 'agent',
            text: `[Attached ${file.name}]`,
            agentName: activeChatAgent?.name || 'Carmen Lee',
            attachment: {
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: type === 'image' || file.type.startsWith('image/') ? 'image' : file.name.endsWith('.pdf') ? 'pdf' : 'doc',
              url: reader.result as string
            }
          })
        });
        await fetchDashboardData();
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleAdminRecording = () => {
    if (!selectedChat) return;
    if (!canAgentReply && restrictionReason) {
      setErrorText(restrictionReason);
      return;
    }
    if (isAdminRecording) {
      if (adminMediaRecorderRef.current && adminMediaRecorderRef.current.state !== 'inactive') {
        adminMediaRecorderRef.current.stop();
      }
      setIsAdminRecording(false);
    } else {
      navigator.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
        const recorder = new MediaRecorder(stream);
        adminMediaRecorderRef.current = recorder;
        adminAudioChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) adminAudioChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const audioBlob = new Blob(adminAudioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              await fetch(`/api/chats/${selectedChat.id}/messages`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                  sender: 'agent',
                  text: '[Voice Note Recording]',
                  agentName: activeChatAgent?.name || 'Carmen Lee',
                  attachment: {
                    name: `voice-note-${Date.now()}.webm`,
                    size: `${Math.max(1, Math.round(audioBlob.size / 1024))} KB`,
                    type: 'audio',
                    url: reader.result as string
                  }
                })
              });
              await fetchDashboardData();
            } catch (err) {
              console.error(err);
            }
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        recorder.start();
        setIsAdminRecording(true);
      }).catch(err => {
        alert('Could not access microphone: ' + err.message);
      });
    }
  };

  const handleTypingToggle = async (isTyping: boolean) => {
    if (!selectedChat) return;
    if (!canAgentReply) return;
    setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, agentTyping: isTyping } : c));
    try {
      await fetch(`/api/chats/${selectedChat.id}/typing`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ agentTyping: isTyping })
      });
    } catch (e) {
      // non blocking
    }
  };

  const handleAgentReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setAgentReply(val);

    if (!selectedChat || !canAgentReply) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (val.trim().length > 0) {
      if (!selectedChat.agentTyping) {
        handleTypingToggle(true);
      }
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingToggle(false);
        typingTimeoutRef.current = null;
      }, 2500);
    } else {
      if (selectedChat.agentTyping) {
        handleTypingToggle(false);
      }
    }
  };

  const handleTemplateSelect = (val: string) => {
    if (!canAgentReply) {
      if (restrictionReason) setErrorText(restrictionReason);
      return;
    }
    setSelectedTemplate(val);
    let tText = '';
    if (val === 'identity') {
      tText = 'To process your release, we require a clear copy of your identity proof. Please use the document upload feature below.';
    } else if (val === 'hold') {
      tText = 'This transaction is currently on hold for routine security audits. It has been routed to our clearance department.';
    } else if (val === 'resolved') {
      tText = 'Good news! The security hold on your funds has been successfully released. The funds will settle in your merchant balance within 2 hours.';
    } else if (val === 'bank') {
      tText = 'Our risks compliance team requested a business invoice or bank transaction record for secondary validation. Please upload it.';
    }
    setAgentReply(tText);

    if (tText && selectedChat && canAgentReply) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      handleTypingToggle(true);
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingToggle(false);
        typingTimeoutRef.current = null;
      }, 2500);
    }
  };

  const handleAudioPlayPause = (msgId: string, audioUrl: string) => {
    let audio = audioElementsRef.current[msgId];
    
    if (!audio) {
      audio = new Audio(audioUrl);
      audioElementsRef.current[msgId] = audio;

      audio.addEventListener('timeupdate', () => {
        setAudioCurrentTimes(prev => ({ ...prev, [msgId]: audio.currentTime }));
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDurations(prev => ({ ...prev, [msgId]: audio.duration }));
      });
      audio.addEventListener('ended', () => {
        setPlayingAudioId(null);
        setAudioCurrentTimes(prev => ({ ...prev, [msgId]: 0 }));
      });
    }

    if (playingAudioId === msgId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      audio.play();
      setPlayingAudioId(msgId);
    }
  };

  // Filtered Chats Memoization
  const filteredChats = useMemo(() => {
    return chats.filter(c => {
      const q = (searchQuery || topSearchQuery).toLowerCase();
      const matchesSearch = 
        !q ||
        c.userName.toLowerCase().includes(q) ||
        c.caseId.toLowerCase().includes(q) ||
        (c.userEmail && c.userEmail.toLowerCase().includes(q)) ||
        (c.collectedInfo?.transactionId && c.collectedInfo.transactionId.toLowerCase().includes(q)) ||
        (c.collectedInfo?.referenceNumber && c.collectedInfo.referenceNumber.toLowerCase().includes(q)) ||
        (c.collectedInfo?.referenceId && c.collectedInfo.referenceId.toLowerCase().includes(q)) ||
        (c.transactions && c.transactions.some((t: any) =>
          (t.id && t.id.toLowerCase().includes(q)) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
          (t.referenceId && t.referenceId.toLowerCase().includes(q))
        ));

      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'pending' && (c.status === 'pending' || c.status === 'bot')) ||
        (activeTab === 'active' && c.status === 'active') ||
        (activeTab === 'resolved' && c.status === 'resolved');

      return matchesSearch && matchesTab;
    });
  }, [chats, searchQuery, topSearchQuery, activeTab, isSupervisorSelected]);

  // Counts for KPI Cards & Badges
  const openCount = useMemo(() => chats.filter(c => c.status === 'active').length, [chats]);
  const pendingCount = useMemo(() => chats.filter(c => c.status === 'pending' || c.status === 'bot').length, [chats]);
  const resolvedCount = useMemo(() => chats.filter(c => c.status === 'resolved').length, [chats]);
  const totalCount = useMemo(() => chats.length, [chats]);

  const unreadNotifications = useMemo(() => {
    return chats.filter(c => {
      if (readChatIds.has(c.id)) return false;
      const lastMsg = c.messages[c.messages.length - 1];
      const hasNewCustomerMsg = lastMsg && lastMsg.sender === 'customer';
      const isPendingQueue = c.status === 'pending' || c.status === 'bot';
      return hasNewCustomerMsg || isPendingQueue;
    });
  }, [chats, readChatIds]);

  const avgResponseTimeData = useMemo(() => {
    let totalTimeMs = 0;
    let count = 0;
    chats.forEach(c => {
      if (c.messages && c.messages.length > 0) {
        const firstCustIndex = c.messages.findIndex(m => m.sender === 'customer');
        if (firstCustIndex !== -1) {
          const custTime = new Date(c.messages[firstCustIndex].timestamp).getTime();
          if (!isNaN(custTime)) {
            const firstAgent = c.messages.slice(firstCustIndex + 1).find(m => m.sender === 'agent');
            if (firstAgent) {
              const agentTime = new Date(firstAgent.timestamp).getTime();
              if (!isNaN(agentTime) && agentTime > custTime) {
                totalTimeMs += (agentTime - custTime);
                count++;
              }
            }
          }
        }
      }
    });
    if (count === 0) return { formatted: 'No data yet', ms: 0, count: 0 };
    const avgMs = Math.round(totalTimeMs / count);
    const totalSec = Math.round(avgMs / 1000);
    if (totalSec < 60) return { formatted: `${totalSec}s`, ms: avgMs, count };
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return { formatted: `${m}m ${s}s`, ms: avgMs, count };
  }, [chats]);

  const customerSatData = useMemo(() => {
    let totalStars = 0;
    let count = 0;
    chats.forEach(c => {
      if (typeof c.rating === 'number' && c.rating >= 1 && c.rating <= 5) {
        totalStars += c.rating;
        count++;
      }
    });
    if (count === 0) return { formatted: 'No ratings yet', avg: 0, count: 0 };
    const avg = totalStars / count;
    return { formatted: `${avg.toFixed(1)} / 5`, avg, count };
  }, [chats]);

  const analyticsOverview = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const currStart = now - sevenDaysMs;
    const prevStart = now - 2 * sevenDaysMs;

    // Buckets for 7 daily sparkline points
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const dayStart = currStart + i * (24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      return { dayStart, dayEnd };
    });

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return { available: false, text: 'No comparison available', isUp: true };
      const diff = curr - prev;
      const pct = Math.round((diff / prev) * 100);
      if (pct > 0) return { available: true, text: `↑ ${pct}% vs prior period`, isUp: true, pct };
      if (pct < 0) return { available: true, text: `↓ ${Math.abs(pct)}% vs prior period`, isUp: false, pct };
      return { available: true, text: '0% vs prior period', isUp: true, pct: 0 };
    };

    let currTotal = 0, prevTotal = 0;
    let currOpen = 0, prevOpen = 0;
    let currResolved = 0, prevResolved = 0;
    let currRespTimeSum = 0, currRespCount = 0, prevRespTimeSum = 0, prevRespCount = 0;
    let currSatSum = 0, currSatCount = 0, prevSatSum = 0, prevSatCount = 0;

    const dailyTotal = [0,0,0,0,0,0,0];
    const dailyOpen = [0,0,0,0,0,0,0];
    const dailyResolved = [0,0,0,0,0,0,0];
    const dailyRespSum = [0,0,0,0,0,0,0];
    const dailyRespCount = [0,0,0,0,0,0,0];
    const dailySatSum = [0,0,0,0,0,0,0];
    const dailySatCount = [0,0,0,0,0,0,0];

    chats.forEach(c => {
      const t = new Date(c.createdAt || Date.now()).getTime();
      const isCurr = t >= currStart && t <= now;
      const isPrev = t >= prevStart && t < currStart;

      let respMs = 0;
      let hasResp = false;
      if (c.messages && c.messages.length > 0) {
        const firstCust = c.messages.find(m => m.sender === 'customer');
        if (firstCust) {
          const ct = new Date(firstCust.timestamp).getTime();
          const firstAg = c.messages.find(m => m.sender === 'agent' && new Date(m.timestamp).getTime() > ct);
          if (firstAg) {
            respMs = new Date(firstAg.timestamp).getTime() - ct;
            hasResp = true;
          }
        }
      }

      const hasSat = typeof c.rating === 'number' && c.rating >= 1 && c.rating <= 5;
      const ratingVal = hasSat ? c.rating! : 0;
      const isOpen = c.status !== 'resolved';
      const isRes = c.status === 'resolved';

      if (isCurr) {
        currTotal++;
        if (isOpen) currOpen++;
        if (isRes) currResolved++;
        if (hasResp) { currRespTimeSum += respMs; currRespCount++; }
        if (hasSat) { currSatSum += ratingVal; currSatCount++; }

        days.forEach((d, idx) => {
          if (t >= d.dayStart && t < d.dayEnd) {
            dailyTotal[idx]++;
            if (isOpen) dailyOpen[idx]++;
            if (isRes) dailyResolved[idx]++;
            if (hasResp) { dailyRespSum[idx] += respMs; dailyRespCount[idx]++; }
            if (hasSat) { dailySatSum[idx] += ratingVal; dailySatCount[idx]++; }
          }
        });
      } else if (isPrev) {
        prevTotal++;
        if (isOpen) prevOpen++;
        if (isRes) prevResolved++;
        if (hasResp) { prevRespTimeSum += respMs; prevRespCount++; }
        if (hasSat) { prevSatSum += ratingVal; prevSatCount++; }
      }
    });

    const trendTotal = calcTrend(currTotal, prevTotal);
    const trendOpen = calcTrend(currOpen, prevOpen);
    const trendResolved = calcTrend(currResolved, prevResolved);
    const currAvgResp = currRespCount > 0 ? currRespTimeSum / currRespCount : 0;
    const prevAvgResp = prevRespCount > 0 ? prevRespTimeSum / prevRespCount : 0;
    const trendResp = calcTrend(currAvgResp, prevAvgResp);
    const currAvgSat = currSatCount > 0 ? currSatSum / currSatCount : 0;
    const prevAvgSat = prevSatCount > 0 ? prevSatSum / prevSatCount : 0;
    const trendSat = calcTrend(currAvgSat, prevAvgSat);

    const genPath = (arr: number[]) => {
      const max = Math.max(...arr, 1);
      const min = Math.min(...arr, 0);
      const range = max - min || 1;
      const pts = arr.map((val, idx) => {
        const x = Math.round((idx / 6) * 100);
        const y = Math.round(18 - ((val - min) / range) * 16);
        return `${x},${y}`;
      });
      if (pts.length < 2) return { path: 'M0,10 L100,10', lastX: 100, lastY: 10 };
      let d = `M${pts[0]}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L${pts[i]}`;
      }
      const last = pts[pts.length - 1].split(',');
      return { path: d, lastX: Number(last[0]), lastY: Number(last[1]) };
    };

    return {
      trendTotal,
      trendOpen,
      trendResolved,
      trendResp,
      trendSat,
      sparkTotal: genPath(dailyTotal),
      sparkOpen: genPath(dailyOpen),
      sparkResolved: genPath(dailyResolved),
      sparkResp: genPath(dailyRespSum.map((s, i) => dailyRespCount[i] > 0 ? s / dailyRespCount[i] : 0)),
      sparkSat: genPath(dailySatSum.map((s, i) => dailySatCount[i] > 0 ? s / dailySatCount[i] : 0)),
    };
  }, [chats]);

  // Helper avatar color assignment based on name
  const getAvatarBg = (name: string) => {
    const colors = ['bg-red-600', 'bg-[#800a1d]', 'bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-purple-600', 'bg-teal-600', 'bg-blue-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100 antialiased">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-radial-gradient from-rose-950/40 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-1">
              <PayMeLogo className="h-9 brightness-0 invert" />
            </div>
            <div className="inline-flex items-center gap-2 bg-rose-950/40 text-rose-400 border border-rose-900/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> HSBC Operations Console
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight pt-1">Admin Operations Gateway</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Authorized personnel only. Sessions are logged under the Hong Kong SVF-B002 banking protocol.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Employee Identification
              </label>
              <input 
                type="text" 
                name="emp_id_no_autofill"
                autoComplete="off"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-rose-500 transition-colors"
                placeholder="Enter Employee ID"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Pin Code / Security Token
              </label>
              <input 
                type="password" 
                name="sec_pin_no_autofill"
                autoComplete="new-password"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-rose-500 transition-colors"
                placeholder="Enter Security PIN"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 font-medium text-center animate-pulse">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-950/30"
            >
              Verify Credentials & Unlock
            </button>
          </form>

          <div className="border-t border-slate-800/60 pt-4.5 text-center text-[10px] text-slate-500 space-y-1">
            <p>© 2026 The Hongkong and Shanghai Banking Corporation Limited.</p>
            <p>Direct Connection Path: /london-site/admin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${activeNav === 'AI Workspace' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-[#f8fafc] text-slate-900 font-sans flex flex-col antialiased overflow-x-clip selection:bg-rose-500 selection:text-white`}>
      
      {/* TOP RED HEADER (MATCHES REFERENCE SCREENSHOT EXACTLY) */}
      <header className="bg-[#800a1d] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-rose-900/60 shadow-md shrink-0">
        
        {/* Left: Hamburger menu toggle & PayMe Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5.5 h-5.5 text-white" />
          </button>

          <div className="flex items-center gap-2">
            <PayMeLogo className="h-6 sm:h-7 brightness-0 invert" />
          </div>
        </div>

        {/* Right: Notification Bell, Supervisor Avatar Dropdown & Log Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Real Notification Bell & Dropdown */}
          <div className="relative">
            <button 
              ref={bellBtnRef}
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative cursor-pointer p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center border border-[#800a1d] shadow-2xs animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div style={notifDropdownStyle} className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 text-slate-800 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Live Support Alerts</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadNotifications.length} Unread
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setReadChatIds(prev => {
                        const next = new Set(prev);
                        unreadNotifications.forEach(c => next.add(c.id));
                        return next;
                      });
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-2">
                  {unreadNotifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 space-y-1">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500" />
                      <div className="font-bold text-xs text-slate-700">All caught up!</div>
                      <div className="text-[11px]">No unread messages or pending approval queues.</div>
                    </div>
                  ) : (
                    unreadNotifications.map(chat => {
                      const lastMsg = chat.messages[chat.messages.length - 1];
                      return (
                        <div 
                          key={chat.id}
                          onClick={() => {
                            handleSelectChat(chat);
                            setShowNotificationsDropdown(false);
                          }}
                          className="py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {chat.userName ? chat.userName.substring(0, 2).toUpperCase() : 'CU'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 truncate">{chat.userName || 'Customer'}</span>
                              <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-50 px-1.5 py-0.5 rounded">
                                {chat.status === 'bot' ? 'pending' : chat.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                              {lastMsg ? lastMsg.text : 'New chat inquiry started'}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Case: {chat.caseId || `#C-${chat.id.substring(0, 6)}`} • Click to review
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => {
                      setShowNotificationsDropdown(false);
                      setActiveNav('Live Chat');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    View All Active Inquiries
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Supervisor Profile Control */}
          <div ref={supervisorRef} className="relative">
            <button
              type="button"
              onClick={() => setSupervisorDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-white/10 transition-all cursor-pointer focus:outline-none group"
            >
              {/* Avatar with Status Badge */}
              <div className="relative shrink-0">
                {activeSupervisor?.avatar?.startsWith('http') ? (
                  <img
                    src={activeSupervisor.avatar}
                    alt={activeSupervisor.name}
                    className="w-8 h-8 rounded-full object-cover shadow-2xs border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold border border-white/20 shadow-2xs">
                    {activeSupervisor?.initials || (activeSupervisor?.name ? activeSupervisor.name.substring(0, 2).toUpperCase() : 'AS')}
                  </div>
                )}
                {/* Status Indicator Dot */}
                <span 
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#800a1d] ${
                    activeSupervisor
                      ? activeSupervisor.status === 'online'
                        ? 'bg-emerald-400'
                        : activeSupervisor.status === 'busy' || activeSupervisor.status === 'away' || activeSupervisor.status === 'idle'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                      : 'bg-slate-400'
                  }`} 
                />
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-white/80 group-hover:text-white transition-transform ${supervisorDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {supervisorDropdownOpen && (
              <div className="absolute right-0 translate-x-14 sm:translate-x-28 mt-2 w-84 max-w-[calc(100vw-1.5rem)] bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Assigned Supervisor</div>
                    <div className="text-[10.5px] text-slate-500 leading-snug mt-0.5">Select active agent for live support management</div>
                  </div>
                  {selectedSupervisorId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupervisorId('');
                        setSupervisorDropdownOpen(false);
                      }}
                      className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-lg px-2 py-1 transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/80 py-1">
                  {agents.map((ag) => {
                    const isSelected = ag.id === selectedSupervisorId;
                    const isOnline = ag.status === 'online';
                    return (
                      <button
                        type="button"
                        key={ag.id}
                        onClick={() => {
                          setSelectedSupervisorId(ag.id);
                          setSupervisorDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/90 transition-colors text-left cursor-pointer group ${
                          isSelected ? 'bg-rose-50/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
                            {ag.avatar?.startsWith('http') ? (
                              <img
                                src={ag.avatar}
                                alt={ag.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200/80 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#800a1d] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                                {ag.initials || ag.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                isOnline
                                  ? 'bg-emerald-500'
                                  : ag.status === 'busy' || ag.status === 'away' || ag.status === 'idle'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`} 
                            />
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5 leading-tight group-hover:text-rose-700 transition-colors">
                              <span className="truncate">{ag.name}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-1">
                              {ag.department} • {ag.region}
                            </div>
                            <div className="text-[10px] font-medium mt-0.5 leading-tight">
                              {isOnline ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                  Online
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Offline • {getFormattedTimeAgo(ag.activeTime, false)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="shrink-0 ml-3 flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="bg-[#9c1328] hover:bg-[#b0162e] text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-800/60 shadow-2xs transition-colors cursor-pointer active:scale-95"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* BODY CONTENT AREA WITH SIDEBAR AND MAIN WORKSPACE */}
      <div className={`flex-1 flex min-w-0 ${activeNav === 'AI Workspace' ? 'min-h-0 overflow-hidden' : ''}`}>

        {/* LEFT SIDEBAR */}
        <aside 
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#800a1d] text-white flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full overflow-y-auto scrollbar-none p-4">
            
            {/* Logo Header */}
            <div className="flex items-center justify-between pb-6 pt-2 px-2 border-b border-rose-900/40">
              <PayMeLogo className="h-8 brightness-0 invert" />
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1 text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Navigation List */}
            <div className="mt-4 space-y-6 flex-1">
              
              {/* Top Primary Item: Overview */}
              <div>
                <button 
                  onClick={() => { setActiveNav('Overview'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    activeNav === 'Overview'
                      ? 'bg-[#a0102a] text-white shadow-sm'
                      : 'text-rose-100/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-white" />
                  <span>Overview</span>
                </button>
              </div>

              {/* Section 1: COMMUNICATION */}
              <div className="space-y-1">
                <p className="px-3 text.5 font-bold tracking-wider text-rose-200/50 uppercase text-[10.5px]">
                  Communication
                </p>

                <button 
                  onClick={() => { setActiveNav('Conversations'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Conversations' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Conversations</span>
                  </div>
                  <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {openCount}
                  </span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Tickets'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Tickets' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="w-4 h-4 shrink-0" />
                    <span>Tickets</span>
                  </div>
                  <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Customers'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Customers' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Customers</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Live Chat'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Live Chat' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 shrink-0" />
                    <span>Live Chat</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Email Support'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Email Support' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Email Support</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Quick Replies'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Quick Replies' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Quick Replies</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Internal Notes'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Internal Notes' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span>Internal Notes</span>
                </button>
              </div>

              {/* Section 2: MANAGEMENT */}
              <div className="space-y-1 pt-2">
                <p className="px-3 text.5 font-bold tracking-wider text-rose-200/50 uppercase text-[10.5px]">
                  Management
                </p>

                <button 
                  onClick={() => { setActiveNav('AI Workspace'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'AI Workspace' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4 shrink-0 text-rose-300" />
                  <span>AI Workspace</span>
                  <span className="ml-auto bg-rose-500/40 text-rose-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-rose-400/40">NEW</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Agents'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Agents' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Agents</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Teams'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Teams' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Teams</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Macros'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Macros' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>Macros</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Tags'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Tags' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>Tags</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Ban List'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Ban List' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>Ban List</span>
                </button>
              </div>

              {/* Section 3: ANALYTICS */}
              <div className="space-y-1 pt-2">
                <p className="px-3 text.5 font-bold tracking-wider text-rose-200/50 uppercase text-[10.5px]">
                  Analytics
                </p>

                <button 
                  onClick={() => { setActiveNav('Reports'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Reports' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-4 h-4 shrink-0" />
                  <span>Reports</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Performance'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Performance' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>Performance</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Satisfaction'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Satisfaction' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Smile className="w-4 h-4 shrink-0" />
                  <span>Satisfaction</span>
                </button>
              </div>

              {/* Section 4: SETTINGS */}
              <div className="space-y-1 pt-2 pb-6">
                <p className="px-3 text.5 font-bold tracking-wider text-rose-200/50 uppercase text-[10.5px]">
                  Settings
                </p>



                <button 
                  onClick={() => { setActiveNav('Integrations'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Integrations' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>Integrations</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('Channel Settings'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'Channel Settings' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Channel Settings</span>
                </button>

                <button 
                  onClick={() => { setActiveNav('General Settings'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeNav === 'General Settings' ? 'bg-[#a0102a] text-white font-bold' : 'text-rose-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>General Settings</span>
                </button>


              </div>

            </div>

            {/* Bottom Presence Dropdown Container */}
            <div className="pt-4 border-t border-rose-900/40">
              {/* User Presence Pill */}
              <div className="bg-[#181d27] rounded-xl p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-200">You are online</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-[11px] text-slate-400 hover:text-white font-medium hover:underline cursor-pointer"
                >
                  Go offline
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* MAIN WORKSPACE CONTENT AREA */}
        <main className={`flex-1 flex flex-col min-w-0 ${activeNav === 'AI Workspace' ? 'min-h-0 overflow-hidden' : 'overflow-y-auto'}`}>
          
          {/* WORKSPACE BODY */}
          <div className={`${activeNav === 'AI Workspace' ? 'flex-1 flex flex-col min-h-0 overflow-hidden p-0 sm:p-0' : 'p-4 sm:p-6 space-y-6'}`}>
            
            {/* ERROR BANNER IF ANY */}
            {errorText && (
              <div className={`bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium shadow-2xs animate-in fade-in slide-in-from-top-1 shrink-0 ${activeNav === 'AI Workspace' ? 'm-4' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorText}</span>
                </div>
                <button 
                  onClick={() => { setErrorText(null); fetchDashboardData(); }}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors cursor-pointer shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* DASHBOARD OVERVIEW TITLE & SEARCH BAR */}
            {activeNav !== 'AI Workspace' && (
            <div className="space-y-4 shrink-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Real-time overview of your support operations</p>
              </div>

              {/* Full-width Search Input */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={topSearchQuery}
                  onChange={(e) => setTopSearchQuery(e.target.value)}
                  placeholder="Search anything..."
                  className="w-full h-10 bg-white border border-slate-200/90 rounded-2xl pl-10 pr-14 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 shadow-2xs transition-all"
                />
                <span className="absolute right-3 top-2.5 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
                  ⌘ K
                </span>
              </div>
            </div>
            )}
          
          {/* TOP KPI OVERVIEW CARDS ROW (EXACT 5 COLUMNS FROM SCREENSHOT) */}
          {(activeNav === 'Overview' || activeNav === 'Conversations' || activeNav === 'Live Chat' || activeNav === 'Unassigned' || activeNav === 'My Tickets' || activeNav === 'Mentions' || activeNav === 'Starred') && (
            <>
              {isInitialDataLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                  </div>
                  <div className="h-7 w-16 bg-slate-200 rounded"></div>
                  <div className="h-3 w-32 bg-slate-100 rounded mt-1"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Card 1: Total Conversations */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Conversations</span>
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {analyticsOverview.trendTotal.available ? (
                      <span className={`${analyticsOverview.trendTotal.isUp ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                        {analyticsOverview.trendTotal.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">No comparison available</span>
                    )}
                  </div>
                </div>
                {/* Mini Sparkline */}
                <div className="pt-1">
                  <svg viewBox="0 0 100 20" className={`w-full h-5 ${analyticsOverview.trendTotal.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'} fill-none`} strokeWidth="2">
                    <path d={analyticsOverview.sparkTotal.path} />
                    <circle cx={analyticsOverview.sparkTotal.lastX} cy={analyticsOverview.sparkTotal.lastY} r="2.5" className={analyticsOverview.trendTotal.isUp ? 'fill-emerald-500' : 'fill-rose-500'} />
                  </svg>
                </div>
              </div>

              {/* Card 2: Open Conversations */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Open Conversations</span>
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{openCount}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {analyticsOverview.trendOpen.available ? (
                      <span className={`${analyticsOverview.trendOpen.isUp ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                        {analyticsOverview.trendOpen.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">No comparison available</span>
                    )}
                  </div>
                </div>
                {/* Mini Sparkline */}
                <div className="pt-1">
                  <svg viewBox="0 0 100 20" className={`w-full h-5 ${analyticsOverview.trendOpen.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'} fill-none`} strokeWidth="2">
                    <path d={analyticsOverview.sparkOpen.path} />
                    <circle cx={analyticsOverview.sparkOpen.lastX} cy={analyticsOverview.sparkOpen.lastY} r="2.5" className={analyticsOverview.trendOpen.isUp ? 'fill-emerald-500' : 'fill-rose-500'} />
                  </svg>
                </div>
              </div>

              {/* Card 3: Resolved Conversations */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Resolved Conversations</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{resolvedCount}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {analyticsOverview.trendResolved.available ? (
                      <span className={`${analyticsOverview.trendResolved.isUp ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                        {analyticsOverview.trendResolved.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">No comparison available</span>
                    )}
                  </div>
                </div>
                {/* Mini Sparkline */}
                <div className="pt-1">
                  <svg viewBox="0 0 100 20" className={`w-full h-5 ${analyticsOverview.trendResolved.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'} fill-none`} strokeWidth="2">
                    <path d={analyticsOverview.sparkResolved.path} />
                    <circle cx={analyticsOverview.sparkResolved.lastX} cy={analyticsOverview.sparkResolved.lastY} r="2.5" className={analyticsOverview.trendResolved.isUp ? 'fill-emerald-500' : 'fill-rose-500'} />
                  </svg>
                </div>
              </div>

              {/* Card 4: Average Response Time */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Average Response Time</span>
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{avgResponseTimeData.formatted}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {analyticsOverview.trendResp.available ? (
                      <span className={`${!analyticsOverview.trendResp.isUp ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                        {analyticsOverview.trendResp.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">No comparison available</span>
                    )}
                  </div>
                </div>
                {/* Mini Sparkline */}
                <div className="pt-1">
                  <svg viewBox="0 0 100 20" className={`w-full h-5 ${!analyticsOverview.trendResp.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'} fill-none`} strokeWidth="2">
                    <path d={analyticsOverview.sparkResp.path} />
                    <circle cx={analyticsOverview.sparkResp.lastX} cy={analyticsOverview.sparkResp.lastY} r="2.5" className={!analyticsOverview.trendResp.isUp ? 'fill-emerald-500' : 'fill-rose-500'} />
                  </svg>
                </div>
              </div>

              {/* Card 5: Customer Satisfaction */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Customer Satisfaction</span>
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{customerSatData.formatted}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {analyticsOverview.trendSat.available ? (
                      <span className={`${analyticsOverview.trendSat.isUp ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                        {analyticsOverview.trendSat.text}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">No comparison available</span>
                    )}
                  </div>
                </div>
                {/* Mini Sparkline */}
                <div className="pt-1">
                  <svg viewBox="0 0 100 20" className={`w-full h-5 ${analyticsOverview.trendSat.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'} fill-none`} strokeWidth="2">
                    <path d={analyticsOverview.sparkSat.path} />
                    <circle cx={analyticsOverview.sparkSat.lastX} cy={analyticsOverview.sparkSat.lastY} r="2.5" className={analyticsOverview.trendSat.isUp ? 'fill-emerald-500' : 'fill-rose-500'} />
                  </svg>
                </div>
              </div>

            </div>
          )}

          {/* MOBILE NAVIGATION TABS (CHATS / CHAT / DETAILS) FOR TABLET/MOBILE RESPONSIVENESS */}
          <div className="lg:hidden flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button 
              onClick={() => setMobileActiveTab('chats')}
              className={`flex-1 py-2 rounded-lg transition-all ${mobileActiveTab === 'chats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Conversations ({filteredChats.length})
            </button>
            <button 
              onClick={() => setMobileActiveTab('chat')}
              className={`flex-1 py-2 rounded-lg transition-all ${mobileActiveTab === 'chat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Active Chat
            </button>
            <button 
              onClick={() => setMobileActiveTab('details')}
              className={`flex-1 py-2 rounded-lg transition-all ${mobileActiveTab === 'details' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Customer Details
            </button>
          </div>
          </>
          )}

          {activeNav === 'Tickets' || activeNav === 'Email Support' ? (
            <AdminTicketsView activeNav={activeNav} chats={chats} onSelectChat={handleSelectChat} />
          ) : activeNav === 'Reports' || activeNav === 'Performance' || activeNav === 'Satisfaction' || activeNav === 'Analytics' ? (
            <AdminAnalyticsView activeNav={activeNav} chats={chats} agents={agents} />
          ) : activeNav === 'Quick Replies' || activeNav === 'Macros' || activeNav === 'Tags' ? (
            <AdminQuickRepliesView activeNav={activeNav} onRunMacro={handleRunMacro} />
          ) : activeNav === 'Agents' || activeNav === 'Teams' || activeNav === 'Ban List' || activeNav === 'Internal Notes' ? (
            <AdminAgentsView activeNav={activeNav} agents={agents} chats={chats} onSelectChat={handleSelectChat} onRefresh={fetchDashboardData} />
          ) : activeNav === 'Integrations' || activeNav === 'Channel Settings' ? (
            <AdminIntegrationsView activeNav={activeNav} />
          ) : activeNav === 'General Settings' ? (
            <AdminGeneralSettingsView />
          ) : activeNav === 'AI Workspace' ? (
            <AdminAIWorkspaceView getAuthHeaders={getAuthHeaders} onSessionExpired={handleSessionExpired} />
          ) : (
            <>
              {/* 3-COLUMN CORE WORKSPACE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* COLUMN 1: CONVERSATIONS LIST (SPAN 3 OF 12) */}
            <div className={`lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 flex flex-col h-[700px] ${
              mobileActiveTab !== 'chats' ? 'hidden lg:flex' : 'flex'
            }`}>
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Conversations</h2>
                <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-100 pt-2 pb-1 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`pb-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'all' ? 'text-rose-600 font-bold border-b-2 border-rose-600' : 'hover:text-slate-800'
                  }`}
                >
                  All ({filteredChats.length})
                </button>
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`pb-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'active' ? 'text-rose-600 font-bold border-b-2 border-rose-600' : 'hover:text-slate-800'
                  }`}
                >
                  Open ({openCount})
                </button>
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={`pb-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'pending' ? 'text-rose-600 font-bold border-b-2 border-rose-600' : 'hover:text-slate-800'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button 
                  onClick={() => setActiveTab('resolved')}
                  className={`pb-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'resolved' ? 'text-rose-600 font-bold border-b-2 border-rose-600' : 'hover:text-slate-800'
                  }`}
                >
                  Resolved
                </button>
              </div>

              {/* Search & Filter bar */}
              <div className="py-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Conversation items list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                {activeTab === 'pending' && !isSupervisorSelected ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-bold text-slate-700">Waiting Queue Restricted</p>
                    <p className="mt-1">Only the currently Assigned Supervisor can view the waiting queue and accept new customer requests. Please select an Assigned Supervisor from the top menu.</p>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                    <div className="font-semibold text-slate-600 text-sm">No data yet</div>
                    <div className="text-xs">No conversations found or matching the current filter.</div>
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const isSelected = chat.id === selectedChatId;
                    const initials = getInitials(chat.userName);
                    const bgClass = getAvatarBg(chat.userName);
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    const timeStr = lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(chat.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const presence = getCustomerPresenceState(chat);

                    return (
                      <div 
                        key={chat.id}
                        onClick={() => {
                          setSelectedChatId(chat.id);
                          setMobileActiveTab('chat');
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 border-l-4 ${
                          isSelected 
                            ? 'bg-rose-50/70 border-rose-600 shadow-2xs' 
                            : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-full ${bgClass} text-white flex items-center justify-center text-xs font-bold shadow-2xs`}>
                            {initials}
                          </div>
                          <span 
                            title={`Customer: ${presence.status}`}
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${presence.dotClass}`} 
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{chat.userName}</h4>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeStr}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                            {lastMsg ? lastMsg.text : chat.selectedTopic || 'I need help with a transaction.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                          {(chat.status === 'pending' || chat.status === 'bot') && !chat.agentId && isSupervisorSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptChat(chat.id);
                              }}
                              disabled={loading || acceptingCaseId === chat.id}
                              title="Accept Case"
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              {loading && acceptingCaseId === chat.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              <span className="hidden sm:inline">{loading && acceptingCaseId === chat.id ? 'Assigning...' : 'Accept Case'}</span>
                            </button>
                          )}
                          {chat.status === 'pending' || (lastMsg && lastMsg.sender === 'customer') ? (
                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                              1
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Showing {filteredChats.length > 0 ? 1 : 0} – {Math.min(7, filteredChats.length)} of {filteredChats.length}</span>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                  <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

            </div>

            {/* COLUMN 2: ACTIVE CHAT INTERFACE (SPAN 5 OF 12) */}
            <div className={`lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col h-[700px] overflow-hidden relative ${
              mobileActiveTab !== 'chat' ? 'hidden lg:flex' : 'flex'
            }`}>
              
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200/80 bg-white z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Customer Info Column */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl ${getAvatarBg(selectedChat.userName)} text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-2xs`}>
                        {getInitials(selectedChat.userName)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">{selectedChat.userName || 'Customer'}</h3>
                          {(() => {
                            const presence = getCustomerPresenceState(selectedChat);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${presence.bgClass} ${presence.textClass} ${presence.borderClass} border`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${presence.dotClass}`} />
                                {presence.status}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[180px]">{selectedChat.userEmail || 'Not Provided'}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{selectedChat.phone || 'Not Provided'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Case Metadata Column */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-right flex flex-col items-start sm:items-end">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                          <Ticket className="w-3.5 h-3.5 text-rose-600" />
                          <span>{selectedChat.caseId || `#C-${selectedChat.id.substring(0, 8)}`}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <span>Agent: </span>
                          <strong className="text-slate-800">{selectedChat.agentId ? (agents.find(a => a.id === selectedChat.agentId)?.name || 'Assigned Agent') : 'Unassigned'}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border ${
                          selectedChat.status === 'resolved'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : selectedChat.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {selectedChat.status === 'bot' ? 'pending' : selectedChat.status}
                        </span>

                        <button
                          onClick={handleToggleBlock}
                          title={selectedChat.isBlocked ? "Unblock Customer" : "Block Customer"}
                          className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            selectedChat.isBlocked
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-xs'
                              : 'bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-200'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden xl:inline">{selectedChat.isBlocked ? 'Blocked' : 'Block'}</span>
                        </button>

                        <button
                          onClick={handleDeleteConversation}
                          title="Delete Conversation"
                          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>

                        <button 
                          onClick={() => setMobileActiveTab('details')}
                          className="sm:hidden text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* REQUIREMENT 1: Selected Case Issue Banner */}
                  <div className="bg-gradient-to-r from-rose-50/95 via-slate-50 to-rose-50/95 border-b border-rose-200/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shadow-3xs shrink-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="flex items-center gap-1.5 font-bold text-rose-950 bg-rose-100/90 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                        <Ticket className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Issue: {selectedChat.selectedTopic || 'General Support'}</span>
                      </span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="text-slate-600 font-medium">
                        Category: <strong className="text-slate-900">{getTopicMetadata(selectedChat.selectedTopic).category}</strong>
                      </span>
                      <span className="text-slate-300 hidden md:inline">•</span>
                      <span className="text-slate-600 font-medium">
                        Subcategory: <strong className="text-slate-900">{getTopicMetadata(selectedChat.selectedTopic).subcategory}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Selected: {new Date(selectedChat.topicSelectedAt || selectedChat.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div 
                    ref={chatScrollContainerRef}
                    onScroll={handleChatScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
                  >
                    
                    {/* Centered Date Separator */}
                    <div className="flex justify-center my-2">
                      <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                        Today
                      </span>
                    </div>

                    {/* Chat Messages */}
                    {selectedChat.messages.map((msg) => {
                      const isAgent = msg.sender === 'agent';
                      const isBot = msg.sender === 'bot';
                      const isSystem = msg.sender === 'system';

                      if (msg.text.startsWith('Internal Note') || (isSystem && msg.text.includes('Internal Note'))) {
                        return (
                          <div key={msg.id} className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 space-y-1 text-xs text-amber-900 shadow-2xs my-2">
                            <div className="flex items-center justify-between font-bold text-amber-800">
                              <span>Internal Note by Admin</span>
                              <span className="text-[10px] font-mono opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="leading-relaxed font-medium">{msg.text.replace('Internal Note by Admin: ', '')}</p>
                          </div>
                        );
                      }

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2.5">
                            <div className="bg-slate-100 border border-slate-200/80 rounded-full px-3.5 py-1 text-[11px] text-slate-600 font-medium shadow-2xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>{msg.text.replace('System: ', '')}</span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAgent 
                              ? 'bg-rose-50 text-slate-900 border border-rose-200/80 rounded-tr-xs shadow-2xs' 
                              : 'bg-slate-100 text-slate-900 rounded-tl-xs'
                          }`}>
                            <p className="whitespace-pre-line font-medium">{msg.text}</p>
                            
                            {/* Audio attachment if present */}
                            {msg.attachment && msg.attachment.type.startsWith('audio/') && (
                              <div className="mt-2 bg-white/80 p-2 rounded-xl border border-rose-200 flex items-center gap-2 text-slate-800">
                                <button
                                  onClick={() => msg.attachment && handleAudioPlayPause(msg.id, msg.attachment.data)}
                                  className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0"
                                >
                                  {playingAudioId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
                                </button>
                                <span className="text-[10px] font-bold">Voice Note ({msg.attachment.duration || '5s'})</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-mono">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isAgent && <CheckCheck className="w-3.5 h-3.5 text-rose-500" />}
                          </div>
                        </div>
                      );
                    })}

                    {/* Customer Typing Indicator */}
                    {selectedChat.customerTyping && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pl-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        Customer is typing...
                      </div>
                    )}

                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Floating New Messages Indicator */}
                  {hasUnreadNewMessages && (
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
                      <button
                        onClick={() => scrollToBottom('smooth')}
                        className="bg-[#a0102a] text-white hover:bg-[#800a1d] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 hover:scale-105 active:scale-95"
                      >
                        <ChevronDown className="w-4 h-4 animate-bounce" />
                        <span>New Messages</span>
                      </button>
                    </div>
                  )}

                  {/* Reply Input Box */}
                  <div className="p-4 border-t border-slate-200/80 bg-white space-y-3">
                    
                    {/* Reply Tabs */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
                      <button 
                        onClick={() => setReplyTab('reply')}
                        className={`pb-1 cursor-pointer transition-colors ${replyTab === 'reply' ? 'text-rose-600 border-b-2 border-rose-600' : 'hover:text-slate-800'}`}
                      >
                        Reply
                      </button>
                      <button 
                        onClick={() => setReplyTab('internal')}
                        className={`pb-1 cursor-pointer transition-colors ${replyTab === 'internal' ? 'text-rose-600 border-b-2 border-rose-600' : 'hover:text-slate-800'}`}
                      >
                        Internal Note
                      </button>
                    </div>

                    {/* Textarea Input Container */}
                    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 focus-within:bg-white focus-within:border-rose-500 transition-all flex flex-col justify-between min-h-[128px]">
                      {/* AI Copilot Suggestion & Error Alert Bar */}
                      {copilotError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 mb-2 flex items-center justify-between text-xs text-rose-800 animate-fadeIn">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="font-medium whitespace-pre-wrap">{copilotError}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEnterpriseAiCopilot(false)}
                              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                            >
                              Retry
                            </button>
                            <button
                              type="button"
                              onClick={() => setCopilotError(null)}
                              className="text-rose-600 font-bold ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                      {activeCopilotSuggestion && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-2.5 mb-2.5 text-xs text-emerald-900 shadow-2xs animate-fadeIn space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span className="font-bold text-slate-900">AI Copilot Suggestion Loaded</span>
                              {activeCopilotSuggestion.confidence && (
                                <span className="bg-emerald-200/60 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300/60">
                                  {activeCopilotSuggestion.confidence}
                                </span>
                              )}
                              {activeCopilotSuggestion.workflowStageUsed && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                  Stage: {activeCopilotSuggestion.workflowStageUsed}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEnterpriseAiCopilot(true)}
                                disabled={isGeneratingCopilot}
                                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-300 shadow-2xs transition-all cursor-pointer text-xs"
                                title="Generate a completely new response from Gemini without recycling previous wording"
                              >
                                <RefreshCw className={`w-3 h-3 ${isGeneratingCopilot ? 'animate-spin' : ''}`} />
                                <span>Refresh Suggestion</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveCopilotSuggestion(null)}
                                className="text-emerald-600 hover:text-emerald-900 font-bold px-1.5 py-0.5 cursor-pointer"
                                title="Dismiss suggestion bar"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          {activeCopilotSuggestion.reasoning && (
                            <div className="text-[11px] text-emerald-800/80 leading-relaxed font-medium bg-white/60 p-1.5 rounded-lg border border-emerald-200/40">
                              💡 <span className="font-bold">Context Reasoning:</span> {activeCopilotSuggestion.reasoning}
                            </div>
                          )}
                          {(activeCopilotSuggestion.supportingProcedureUsed || activeCopilotSuggestion.transactionDataUsed) && (
                            <div className="flex flex-wrap gap-2 text-[10px] pt-0.5 text-slate-600 font-medium">
                              {activeCopilotSuggestion.supportingProcedureUsed && (
                                <span className="bg-emerald-100/80 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200">
                                  📚 <strong>Procedure:</strong> {activeCopilotSuggestion.supportingProcedureUsed}
                                </span>
                              )}
                              {activeCopilotSuggestion.transactionDataUsed && (
                                <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                  💳 <strong>Data:</strong> {activeCopilotSuggestion.transactionDataUsed}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Live Memory Synchronization Verification Summary (Admin Only) */}
                          {activeCopilotSuggestion.memorySyncDebug && (
                            <div className="mt-2 border-t border-emerald-200/60 pt-2">
                              <details className="group" open>
                                <summary className="flex items-center justify-between cursor-pointer text-[11px] font-bold text-emerald-950 hover:text-black select-none">
                                  <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>AI Workspace Memory Sync (Admin Verification)</span>
                                  </span>
                                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                                    ✅ Verified Live Sync
                                  </span>
                                </summary>
                                <div className="mt-2 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] leading-relaxed rounded-lg border border-slate-800 whitespace-pre-wrap select-text shadow-inner">
                                  {activeCopilotSuggestion.memorySyncDebug}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      )}

                      <textarea
                        ref={agentTextareaRef}
                        value={agentReply}
                        disabled={!canAgentReply}
                        onChange={handleAgentReplyChange}
                        placeholder={
                          !canAgentReply
                            ? (isUnassignedQueueCase
                              ? "Accept this case to start the conversation and reply to the customer..."
                              : (restrictionReason || "Read-only conversation..."))
                            : (replyTab === 'reply' ? "Type your reply..." : "Write internal note for operations team...")
                        }
                        rows={2}
                        className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none resize-none disabled:cursor-not-allowed disabled:text-slate-500"
                      />

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 min-h-[36px]">
                        {isUnassignedQueueCase ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium min-w-0 mr-2">
                              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="truncate">Unassigned case in queue waiting for human support</span>
                            </div>
                            <button
                              onClick={() => handleAcceptChat(selectedChat.id)}
                              disabled={loading || acceptingCaseId === selectedChat.id}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/70 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              {loading && acceptingCaseId === selectedChat.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                  <span>Assigning...</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 shrink-0" />
                                  <span>Accept Case</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : !canAgentReply && restrictionReason ? (
                          <div className="flex items-center gap-2 text-amber-800 text-xs font-medium w-full">
                            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="truncate">{restrictionReason}</span>
                          </div>
                        ) : (
                          <>
                            {/* Left Icons & Functional Attachments */}
                            <div className="flex items-center gap-1.5 text-slate-400 relative flex-wrap">
                              <input type="file" ref={adminFileInputRef} onChange={(e) => handleAdminFileUpload(e, 'file')} className="hidden" />
                              <input type="file" ref={adminImageInputRef} onChange={(e) => handleAdminFileUpload(e, 'image')} accept="image/*" className="hidden" />
                              <input type="file" ref={adminDocInputRef} onChange={(e) => handleAdminFileUpload(e, 'doc')} accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" />

                              <button 
                                type="button"
                                onClick={() => adminFileInputRef.current?.click()}
                                title="Attach generic file"
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                              >
                                <Paperclip className="w-4 h-4" />
                              </button>

                              {/* Replace duplicate Emoji button with AI Polish & Grammar */}
                              <button 
                                type="button"
                                onClick={handleEnterpriseAiPolish}
                                disabled={isPolishingText || !agentReply.trim() || !canAgentReply}
                                title="AI Polish & Grammar: Instantly correct grammar, spelling, and improve professionalism & readability while preserving original meaning"
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                  isPolishingText 
                                    ? 'bg-purple-100 text-purple-700 animate-pulse font-bold' 
                                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 border border-purple-200/70 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                              >
                                {isPolishingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>AI Polish & Grammar</span>
                              </button>

                              {/* Add completely new button: AI Copilot */}
                              <button 
                                type="button"
                                onClick={() => handleEnterpriseAiCopilot(false)}
                                disabled={isGeneratingCopilot || !canAgentReply}
                                title="AI Copilot: Analyze full customer conversation, case status, required actions & saved memories to generate suggested reply"
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                  isGeneratingCopilot 
                                    ? 'bg-emerald-100 text-emerald-800 animate-pulse font-bold' 
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                              >
                                {isGeneratingCopilot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                                <span>AI Copilot</span>
                              </button>

                              <button 
                                type="button"
                                onClick={() => adminImageInputRef.current?.click()}
                                title="Upload image"
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => adminDocInputRef.current?.click()}
                                title="Upload document"
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                              >
                                <File className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={handleToggleAdminRecording}
                                title={isAdminRecording ? 'Stop voice note recording' : 'Record voice note'}
                                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                  isAdminRecording 
                                    ? 'bg-rose-100 text-rose-600 animate-pulse font-bold' 
                                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                <Mic className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  setShowQuickRepliesDropdown(!showQuickRepliesDropdown);
                                }}
                                title="Insert Quick Reply"
                                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                  showQuickRepliesDropdown 
                                    ? 'bg-rose-100 text-rose-600 font-bold' 
                                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                <Zap className="w-4 h-4" />
                              </button>

                              {showQuickRepliesDropdown && (
                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 z-50 animate-fadeIn max-h-60 overflow-y-auto">
                                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>Quick Replies</span>
                                    <span>Shortcut</span>
                                  </div>
                                  {(() => {
                                    let qrList = [];
                                    try {
                                      const saved = localStorage.getItem('payme_admin_replies');
                                      if (saved) qrList = JSON.parse(saved);
                                    } catch {}
                                    if (!qrList || qrList.length === 0) {
                                      qrList = [
                                        { id: 'qr-1', title: 'Identity Verification Request', shortcut: '/id', content: 'To process your release, we require a clear copy of your identity proof. Please use the document upload feature below.' },
                                        { id: 'qr-2', title: 'Security Audit Hold Notice', shortcut: '/hold', content: 'This transaction is currently on hold for routine security audits. It has been routed to our clearance department.' },
                                        { id: 'qr-3', title: 'Funds Clearance Resolved', shortcut: '/release', content: 'Good news! The security hold on your funds has been successfully released. The funds will settle in your merchant balance within 2 hours.' },
                                        { id: 'qr-4', title: 'Standard Greeting', shortcut: '/hi', content: 'Hello! Welcome to HSBC + PayMe Merchant Support. I am looking into your case right now. How can I assist you today?' }
                                      ];
                                    }
                                    return qrList.map((qr: any) => (
                                      <button
                                        key={qr.id}
                                        type="button"
                                        onClick={() => {
                                          setAgentReply(prev => (prev.trim() ? prev + '\n\n' : '') + qr.content);
                                          setShowQuickRepliesDropdown(false);
                                          agentTextareaRef.current?.focus();
                                        }}
                                        className="w-full text-left p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer block group"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600 truncate">{qr.title}</span>
                                          {qr.shortcut && <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{qr.shortcut}</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">{qr.content}</p>
                                      </button>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Right Send Button */}
                            <div className="flex items-center">
                              <button
                                onClick={() => handleSendAgentMessage()}
                                disabled={!canAgentReply || !agentReply.trim()}
                                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                                  canAgentReply && agentReply.trim()
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <span>Send</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-medium">Select a conversation thread to view chat log.</p>
                </div>
              )}

            </div>

            {/* COLUMN 3: RIGHT SIDE PANELS (SPAN 4 OF 12 - ACCORDION PANELS MATCHING SCREENSHOT) */}
            <div className={`lg:col-span-4 space-y-4 h-[700px] overflow-y-auto pr-1 ${
              mobileActiveTab !== 'details' ? 'hidden lg:block' : 'block'
            }`}>
              
              {selectedChat ? (
                <>
                  {/* PANEL 1: CUSTOMER DETAILS (ACCORDION) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-4">
                    <div 
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-sm font-bold text-slate-900">Customer Details</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {detailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {detailsExpanded && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${getAvatarBg(selectedChat.userName)} text-white flex items-center justify-center text-base font-bold shadow-2xs`}>
                            {getInitials(selectedChat.userName)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{selectedChat.userName || 'Customer'}</h4>
                            <p className="text-xs text-slate-500 font-medium">{selectedChat.userEmail || 'Not Provided'}</p>
                            <p className="text-xs text-slate-500 font-medium">{selectedChat.phone || 'Not Provided'}</p>
                            <p className="text-xs text-slate-500 font-medium">{selectedChat.visitorInfo?.country && selectedChat.visitorInfo.country !== 'Unavailable' ? selectedChat.visitorInfo.country : 'Not Provided'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PANEL 2: CUSTOMER ACTIONS & MODERATION CONTROLS (ACCORDION) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setActionsExpanded(!actionsExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-sm font-bold text-slate-900">Customer Actions</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {actionsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {actionsExpanded && (
                      <div className="space-y-2 text-xs font-semibold text-slate-700 pt-1">
                        {/* Lock / Unlock Customer Input */}
                        <button 
                          onClick={handleToggleLock}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                            selectedChat.isLocked 
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {selectedChat.isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                            <span>{selectedChat.isLocked ? 'Unlock Customer Input' : 'Lock Customer Input'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedChat.isLocked ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                            {selectedChat.isLocked ? 'Locked' : 'Active'}
                          </span>
                        </button>

                        {/* Mute / Unmute Customer File Uploads */}
                        <button 
                          onClick={handleToggleUploads}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                            selectedChat.uploadsMuted 
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Paperclip className={`w-4 h-4 ${selectedChat.uploadsMuted ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span>{selectedChat.uploadsMuted ? 'Unmute File Uploads' : 'Mute File Uploads'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedChat.uploadsMuted ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                            {selectedChat.uploadsMuted ? 'Muted' : 'Allowed'}
                          </span>
                        </button>

                        {/* Enable / Disable Customer Voice Recording */}
                        <button 
                          onClick={handleToggleVoice}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                            !selectedChat.voiceNotesAllowed 
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Mic className={`w-4 h-4 ${!selectedChat.voiceNotesAllowed ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span>{!selectedChat.voiceNotesAllowed ? 'Enable Voice Recording' : 'Disable Voice Recording'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${!selectedChat.voiceNotesAllowed ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                            {!selectedChat.voiceNotesAllowed ? 'Disabled' : 'Enabled'}
                          </span>
                        </button>

                        {/* Requirement 2: Block / Unblock Customer */}
                        <button 
                          onClick={handleToggleBlock}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                            selectedChat.isBlocked 
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 font-bold shadow-md' 
                              : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Ban className={`w-4 h-4 ${selectedChat.isBlocked ? 'text-white' : 'text-red-600'}`} />
                            <span>{selectedChat.isBlocked ? 'Unblock Customer' : 'Block Customer'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedChat.isBlocked ? 'bg-white text-red-700' : 'bg-red-200 text-red-900'}`}>
                            {selectedChat.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </button>

                        {/* Requirement 3: Delete Customer Conversation */}
                        <button 
                          onClick={handleDeleteConversation}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border bg-slate-100 hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-700"
                        >
                          <div className="flex items-center gap-2.5">
                            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                            <span>Delete Conversation</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            Delete
                          </span>
                        </button>

                        {/* Enable / Disable Case Status Card */}
                        <button 
                          onClick={handleToggleCaseStatus}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                            selectedChat.caseStatusConfig?.visible === true
                              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Briefcase className={`w-4 h-4 ${selectedChat.caseStatusConfig?.visible === true ? 'text-rose-600' : 'text-slate-400'}`} />
                            <span>{selectedChat.caseStatusConfig?.visible === true ? 'Disable Case Status' : 'Enable Case Status'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedChat.caseStatusConfig?.visible === true ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-700'}`}>
                            {selectedChat.caseStatusConfig?.visible === true ? 'Visible' : 'Hidden'}
                          </span>
                        </button>

                        {/* Clear All Case Instructions */}
                        {selectedChat.instructions && selectedChat.instructions.length > 0 && (
                          <button 
                            onClick={handleClearInstructions}
                            className="w-full flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                            <span>Clear All Case Instructions ({selectedChat.instructions.length})</span>
                          </button>
                        )}

                        <div className="border-t border-slate-100 my-2 pt-2 space-y-2">
                          {/* Resolve, Finalize Close, or Reopen Case */}
                          {selectedChat.isClosed ? (
                            <button 
                              onClick={handleReopenCase}
                              className="w-full flex items-center justify-center gap-2 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer text-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Reopen Closed Case</span>
                            </button>
                          ) : selectedChat.status === 'resolved' ? (
                            <div className="space-y-2">
                              <button 
                                onClick={() => handleFinalizeCloseChat(selectedChat.id)}
                                className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer text-xs"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-300" />
                                <span>Finalize & Close Conversation</span>
                              </button>
                              <button 
                                onClick={handleReopenCase}
                                className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-all border border-emerald-200 text-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Reopen Case</span>
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleResolveChat(selectedChat.id)}
                              className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer text-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Resolve Case</span>
                            </button>
                          )}
                        </div>

                        {/* Existing View Profile & Ticket buttons */}
                        <div className="pt-1 flex items-center gap-2">
                          <button className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 font-semibold border border-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Profile</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 font-semibold border border-slate-200">
                            <FilePlus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ticket</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PANEL 3: CONVERSATION INFO (ACCORDION) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setInfoExpanded(!infoExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-sm font-bold text-slate-900">Conversation Info</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {infoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {infoExpanded && (
                      <div className="space-y-2.5 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Conversation ID</span>
                          <span className="font-mono text-slate-900 font-bold">{selectedChat.caseId || '#C-20240517-0012'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Channel</span>
                          <span className="font-semibold text-slate-800">Website Live Chat</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Started At</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(selectedChat.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Status</span>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full inline-block">
                            {selectedChat.status === 'active' ? 'Open' : selectedChat.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned To</span>
                            <span className="font-bold text-slate-900">{activeChatAgent?.name || 'Admin User'}</span>
                          </div>
                          <button className="p-1 text-slate-400 hover:text-slate-600"><Edit className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ADDITIONAL OPERATIONAL PANELS (PRESERVING ALL EXISTING LOGIC) */}
                  
                  {/* PANEL 4: VISITOR & NETWORK INTELLIGENCE */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setPresenceExpanded(!presenceExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Visitor & Intelligence</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {presenceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {presenceExpanded && (
                      <div className="space-y-2 text-xs text-slate-600 pt-1">
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>Customer Status</span>
                          {(() => {
                            const presence = getCustomerPresenceState(selectedChat);
                            return (
                              <span className={`font-bold flex items-center gap-1.5 ${presence.textClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${presence.dotClass}`} />
                                {presence.status} {presence.status === 'Offline' && presence.timeAgoStr && presence.timeAgoStr !== 'Offline' ? `(${presence.timeAgoStr})` : ''}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>IP Address</span>
                          <span className="font-mono text-slate-900 font-bold">{selectedChat.visitorInfo?.ip || 'Not Provided'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>Location</span>
                          <span className="font-semibold text-slate-800">
                            {selectedChat.visitorInfo?.city && selectedChat.visitorInfo?.country && selectedChat.visitorInfo.country !== 'Unavailable'
                              ? `${selectedChat.visitorInfo.city}, ${selectedChat.visitorInfo.country}`
                              : selectedChat.visitorInfo?.country && selectedChat.visitorInfo.country !== 'Unavailable'
                              ? selectedChat.visitorInfo.country
                              : 'Not Provided'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>Browser / OS</span>
                          <span className="text-slate-700">
                            {selectedChat.visitorInfo?.browser && selectedChat.visitorInfo?.os
                              ? `${selectedChat.visitorInfo.browser} / ${selectedChat.visitorInfo.os}`
                              : 'Not Provided'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>VPN / Proxy</span>
                          <span className="font-bold text-slate-700">{selectedChat.visitorInfo?.ip ? 'Clean (No VPN)' : 'Not Provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk Score</span>
                          <span className="font-bold text-slate-700">{selectedChat.visitorInfo?.ip ? 'Low Risk' : 'Not Provided'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PANEL 5: CASE MILESTONE STEPPER */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setMilestonesExpanded(!milestonesExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Milestone Stepper</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {milestonesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {milestonesExpanded && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {[
                          { step: 1, label: 'Received' },
                          { step: 2, label: 'Under Review' },
                          { step: 3, label: 'On Hold' },
                          { step: 4, label: 'Refund Verify' },
                          { step: 5, label: 'Pending Approval' },
                          { step: 6, label: 'Completed' }
                        ].map((st) => (
                          <button
                            key={st.step}
                            onClick={() => handleUpdateTimeline(st.step)}
                            className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-left flex justify-between items-center transition-all cursor-pointer ${
                              selectedChat.timelineProgress === st.step
                                ? 'bg-rose-50 border-rose-500 text-rose-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{st.label}</span>
                            {selectedChat.timelineProgress >= st.step && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PANEL 6: CASE TRANSFER & OPERATIONS NOTEPAD */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setTransferExpanded(!transferExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transfer & Operations Notes</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {transferExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {transferExpanded && (
                      <div className="space-y-3 pt-1">
                        {/* Transfer Assignment */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Transfer Case</label>
                          <div className="flex gap-2 items-start">
                            {/* Custom Transfer Agent Selector */}
                            <div className="relative flex-1">
                              <button
                                type="button"
                                onClick={() => setTransferDropdownOpen(!transferDropdownOpen)}
                                className="w-full min-h-[42px] bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer flex items-center justify-between gap-2 text-left focus:outline-none focus:border-rose-500 group"
                              >
                                {activeTransferAgent ? (
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative shrink-0">
                                      {activeTransferAgent.avatar?.startsWith('http') ? (
                                        <img
                                          src={activeTransferAgent.avatar}
                                          alt={activeTransferAgent.name}
                                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-[#800a1d] text-white flex items-center justify-center text-[10px] font-bold">
                                          {activeTransferAgent.initials || activeTransferAgent.name.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                      <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                          activeTransferAgent.status === 'online'
                                            ? 'bg-emerald-500'
                                            : activeTransferAgent.status === 'busy' || activeTransferAgent.status === 'away' || activeTransferAgent.status === 'idle'
                                            ? 'bg-amber-500'
                                            : 'bg-slate-400'
                                        }`}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors truncate">
                                        {activeTransferAgent.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                        <span>{activeTransferAgent.department}</span>
                                        <span>•</span>
                                        {activeTransferAgent.status === 'online' ? (
                                          <span className="text-emerald-600 font-semibold">Online</span>
                                        ) : (
                                          <span className="text-slate-400 truncate">
                                            {getFormattedTimeAgo(activeTransferAgent.activeTime, false)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium py-1">
                                    <span>-- Select Transfer Agent --</span>
                                  </div>
                                )}
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${transferDropdownOpen ? 'rotate-180 text-rose-600' : ''}`} />
                              </button>

                              {/* Dropdown Popover */}
                              {transferDropdownOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setTransferDropdownOpen(false)}
                                  />
                                  
                                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto divide-y divide-slate-100/80 py-1">
                                    <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                      <span>Available Agents ({agents.filter(a => a.id !== selectedChat.agentId).length})</span>
                                      {transferTargetAgent && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTransferTargetAgent('');
                                            setTransferDropdownOpen(false);
                                          }}
                                          className="text-rose-600 hover:underline cursor-pointer lowercase font-semibold text-[10px]"
                                        >
                                          clear
                                        </button>
                                      )}
                                    </div>

                                    {agents.filter(a => a.id !== selectedChat.agentId).length === 0 ? (
                                      <div className="p-3 text-center text-xs text-slate-400">
                                        No other agents available
                                      </div>
                                    ) : (
                                      agents.filter(a => a.id !== selectedChat.agentId).map((ag) => {
                                        const isSelected = ag.id === transferTargetAgent;
                                        const isOnline = ag.status === 'online';
                                        return (
                                          <button
                                            type="button"
                                            key={ag.id}
                                            onClick={() => {
                                              setTransferTargetAgent(ag.id);
                                              setTransferDropdownOpen(false);
                                            }}
                                            className={`w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50/90 transition-colors text-left cursor-pointer group ${
                                              isSelected ? 'bg-rose-50/70' : ''
                                            }`}
                                          >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                              {/* Centered Profile photo (avatar) with Online/Offline indicator */}
                                              <div className="relative shrink-0 w-9 h-9 flex items-center justify-center">
                                                {ag.avatar?.startsWith('http') ? (
                                                  <img
                                                    src={ag.avatar}
                                                    alt={ag.name}
                                                    className="w-9 h-9 rounded-full object-cover border border-slate-200/80 shadow-2xs"
                                                  />
                                                ) : (
                                                  <div className="w-9 h-9 rounded-full bg-[#800a1d] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                                                    {ag.initials || ag.name.substring(0, 2).toUpperCase()}
                                                  </div>
                                                )}
                                                <span
                                                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                                    isOnline
                                                      ? 'bg-emerald-500'
                                                      : ag.status === 'busy' || ag.status === 'away' || ag.status === 'idle'
                                                      ? 'bg-amber-500'
                                                      : 'bg-slate-400'
                                                  }`}
                                                />
                                              </div>

                                              {/* Vertically Aligned Agent Details */}
                                              <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5 leading-tight group-hover:text-rose-700 transition-colors">
                                                  <span className="truncate">{ag.name}</span>
                                                  {isSelected && (
                                                    <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                                      Selected
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5">
                                                  {ag.department} • {ag.region}
                                                </div>
                                                <div className="text-[10px] font-medium mt-0.5 leading-tight">
                                                  {isOnline ? (
                                                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                                      Online
                                                    </span>
                                                  ) : (
                                                    <span className="text-slate-400">
                                                      Offline • {getFormattedTimeAgo(ag.activeTime, false)}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {isSelected && (
                                              <div className="shrink-0 ml-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600">
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                handleTransferAssignment();
                                setTransferDropdownOpen(false);
                              }}
                              disabled={!transferTargetAgent}
                              className="h-[42px] px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 transition-colors shrink-0 flex items-center justify-center"
                            >
                              Transfer
                            </button>
                          </div>
                        </div>

                        {/* Internal Notes Pad */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Internal Case Notepad</label>
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Auto-saved
                            </span>
                          </div>
                          <textarea 
                            rows={3}
                            value={internalNotesText}
                            onChange={(e) => setInternalNotesText(e.target.value)}
                            onBlur={() => handleSaveInternalNotes(true)}
                            placeholder="Type internal tracking notes..."
                            disabled={!canManageSettings}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-rose-500 resize-none disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PANEL 7: CASE STATUS & VISIBILITY EDITOR */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setCaseStatusExpanded(!caseStatusExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Case Status & Visibility</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {caseStatusExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    {caseStatusExpanded && (
                      <div className="space-y-3 pt-1 text-xs">
                        {/* Enable / Disable Case Status Card */}
                        <button 
                          onClick={handleToggleCaseStatus}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                            selectedChat.caseStatusConfig?.visible === true
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase className={`w-3.5 h-3.5 ${selectedChat.caseStatusConfig?.visible === true ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="font-bold">{selectedChat.caseStatusConfig?.visible === true ? 'Disable Case Status Card' : 'Enable Case Status Card'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedChat.caseStatusConfig?.visible === true ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                            {selectedChat.caseStatusConfig?.visible === true ? 'Visible' : 'Hidden'}
                          </span>
                        </button>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Card Title</label>
                          <input
                            type="text"
                            value={csTitle}
                            onChange={(e) => setCsTitle(e.target.value)}
                            onBlur={() => handleSaveCaseStatus()}
                            placeholder="Case Status"
                            disabled={!canManageSettings}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-900 outline-none focus:border-rose-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Card Subtitle (Preset or Custom)</label>
                          <select
                            value={csSubtitle}
                            onChange={(e) => handleSaveCaseStatus(e.target.value)}
                            disabled={!canManageSettings}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-900 outline-none focus:border-rose-500 cursor-pointer mb-1.5"
                          >
                            <option value="Received">Received</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Business Verification">Business Verification</option>
                            <option value="Business Upgrade Required">Business Upgrade Required</option>
                            <option value="Payment On Hold">Payment On Hold</option>
                            <option value="Refund Verification">Refund Verification</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                            <option value={csSubtitle}>{csSubtitle} (Current)</option>
                          </select>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={csSubtitle}
                              onChange={(e) => setCsSubtitle(e.target.value)}
                              placeholder="Type custom subtitle..."
                              disabled={!canManageSettings}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-900 outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCaseStatus()}
                              disabled={!canManageSettings}
                              className="px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:bg-slate-200"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PANEL 8: CASE PROGRESS TIMELINE MANAGEMENT */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setCaseProgressExpanded(!caseProgressExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Case Progress Timeline Management</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {caseProgressExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    {caseProgressExpanded && (
                      <div className="space-y-3 pt-1">
                        {(selectedChat.caseStatusConfig?.progressSteps || [
                          { id: 1, name: 'Received', status: 'Reviewing', visible: true },
                          { id: 2, name: 'Under Review', status: 'Pending', visible: true },
                          { id: 3, name: 'Refund Verification', status: 'Pending', visible: true },
                          { id: 4, name: 'Completed', status: 'Pending', visible: true }
                        ]).map((step, idx) => {
                          const isSuccess = step.status === 'Success' || step.status === '成功' || step.status === '已完成';
                          const isReviewing = step.status === 'Reviewing' || step.status === '審查中' || step.status === '驗證中';
                          const isVisible = step.visible !== false;

                          return (
                            <div key={`${step.id || idx}-${step.name}-${step.timestamp||''}-${step.date||''}`} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${isSuccess ? 'bg-emerald-600' : isReviewing ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                    {idx + 1}
                                  </span>
                                  <span>Step {idx + 1}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateProgressStep(step.id, 'visible', !isVisible)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                                    isVisible ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'
                                  }`}
                                >
                                  {isVisible ? 'Visible' : 'Hidden'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Step Title</label>
                                  <input
                                    type="text"
                                    defaultValue={step.name}
                                    onBlur={(e) => handleUpdateProgressStep(step.id, 'name', e.target.value)}
                                    disabled={!canManageSettings}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-900 text-xs outline-none focus:border-rose-500"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Status</label>
                                  <select
                                    value={step.status}
                                    onChange={(e) => handleUpdateProgressStep(step.id, 'status', e.target.value)}
                                    disabled={!canManageSettings}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-900 text-xs outline-none focus:border-rose-500 cursor-pointer"
                                  >
                                    <option value="Reviewing">Reviewing</option>
                                    <option value="Success">Success</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Hidden">Hidden</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Timestamp</label>
                                  <input
                                    type="text"
                                    defaultValue={step.timestamp || ''}
                                    placeholder="No timestamp yet"
                                    onBlur={(e) => handleUpdateProgressStep(step.id, 'timestamp', e.target.value)}
                                    disabled={!canManageSettings}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-[11px] outline-none focus:border-rose-500"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Date</label>
                                  <input
                                    type="text"
                                    defaultValue={step.date || ''}
                                    placeholder="e.g. 26 Jul"
                                    onBlur={(e) => handleUpdateProgressStep(step.id, 'date', e.target.value)}
                                    disabled={!canManageSettings}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-[11px] outline-none focus:border-rose-500"
                                  />
                                </div>
                              </div>

                              <div className="pt-1">
                                {!isSuccess ? (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmProgressStep(step.id)}
                                    disabled={!canManageSettings}
                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Confirm {step.name}</span>
                                  </button>
                                ) : (
                                  <div className="w-full py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Confirmed ({step.timestamp || 'Success'})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* PANEL 9: REQUIRED ACTIONS EDITOR */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 space-y-3">
                    <div 
                      onClick={() => setRequiredActionsExpanded(!requiredActionsExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Actions Editor</h3>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {requiredActionsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    {requiredActionsExpanded && (
                      <div className="space-y-3 pt-1 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Title</label>
                          <input
                            type="text"
                            value={raTitle}
                            onChange={(e) => setRaTitle(e.target.value)}
                            placeholder="REQUIRED ACTIONS"
                            disabled={!canManageSettings}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-900 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Heading</label>
                          <input
                            type="text"
                            value={raHeading}
                            onChange={(e) => setRaHeading(e.target.value)}
                            placeholder="e.g. Identity Verification Needed"
                            disabled={!canManageSettings}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-900 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Instructions</label>
                          <textarea
                            rows={3}
                            value={raContent}
                            onChange={(e) => setRaContent(e.target.value)}
                            placeholder="Type required action instructions..."
                            disabled={!canManageSettings}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 outline-none focus:border-rose-500 resize-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveRequiredActions()}
                          disabled={!canManageSettings}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:bg-slate-200"
                        >
                          Save Required Actions
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PANEL 10: CONVERSATION TOPIC TAGS */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                    <button
                      type="button"
                      onClick={() => setTagsPanelExpanded(!tagsPanelExpanded)}
                      className="w-full flex items-center justify-between text-left font-bold text-slate-800 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">Topic Tags</span>
                      </div>
                      {tagsPanelExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {tagsPanelExpanded && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                        <p className="text-[11px] text-slate-500 font-medium">Assign tags to categorize this conversation and improve routing.</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'tag-1', label: 'Priority Escalation', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                            { id: 'tag-2', label: 'Identity Verification', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                            { id: 'tag-3', label: 'Refund Processing', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                            { id: 'tag-4', label: 'Account Security', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                            { id: 'tag-5', label: 'General Inquiry', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                          ].map(tag => {
                            const isSelected = activeCaseTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  const next = isSelected ? activeCaseTags.filter(t => t !== tag.id) : [...activeCaseTags, tag.id];
                                  setActiveCaseTags(next);
                                  try {
                                    if (selectedChat) localStorage.setItem(`payme_case_tags_${selectedChat.id}`, JSON.stringify(next));
                                  } catch {}
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isSelected ? tag.color + ' shadow-xs ring-2 ring-offset-1 ring-rose-500/30' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                <span>{tag.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PANEL 11: AUTOMATED ACTION MACROS */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                    <button
                      type="button"
                      onClick={() => setMacrosPanelExpanded(!macrosPanelExpanded)}
                      className="w-full flex items-center justify-between text-left font-bold text-slate-800 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">Action Macros</span>
                      </div>
                      {macrosPanelExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {macrosPanelExpanded && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        <p className="text-[11px] text-slate-500 font-medium">Execute instant automated workflows on this case.</p>
                        {[
                          { id: 'mac-1', name: 'Escalate & Notify Supervisor', action: 'Flags case for Priority Escalate and sends SMS alert to Duty Supervisor.' },
                          { id: 'mac-2', name: 'Request ID Verification', action: 'Unlocks customer file uploads and sends standard KYC upload instructions.' },
                          { id: 'mac-3', name: 'Release Hold & Resolve', action: 'Removes security hold tag, marks case Resolved, and sends closing survey.' },
                        ].map(mac => (
                          <div key={mac.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-800 text-xs">{mac.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium line-clamp-1">{mac.action}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRunMacro(mac)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer shadow-xs"
                            >
                              Run
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Select a chat to view customer details.
                </div>
              )}

            </div>

          </div>
        </>
      )}

        </div>

      </main>

      </div>

    </div>
  );
}
