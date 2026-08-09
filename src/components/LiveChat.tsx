import { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, Send, Paperclip, Shield, FileText, CheckCircle2, 
  HelpCircle, Lock, Menu, Check, CheckCheck, MoreHorizontal, Plus, Mic, Play, Pause, 
  Download, RefreshCw, AlertCircle, File, Image as ImageIcon, Volume2, Globe, Clock, Sparkles, X, Trash2,
  ChevronLeft, ChevronRight, User, DollarSign, ArrowLeftRight, Headphones, Loader2, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, ChatSession, Attachment, CaseInstruction, Agent, VisitorInfo } from '../types.ts';
import { ImageAttachment, isImageAttachment } from './ImageAttachment';

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Account Issues': '帳戶問題',
  'Payment Issues': '付款問題',
  'Transfer Issues': '轉帳問題',
  'Transaction Verification': '交易驗證',
  'Refund Issues': '退款問題',
  'Business Account': '商業帳戶',
  'Identity Verification': '身份驗證',
  'Technical Support': '技術支援',
  'Security Review': '安全審查',
  'Other': '其他'
};

const LOCALIZED_TEXT = {
  en: {
    endChat: "End Chat",
    verifiedAgent: "Verified Agent",
    online: "Online",
    offline: "Offline",
    department: "Customer Support Specialist",
    actionRequired: "Action required:",
    verificationNeeded: "Additional verification is required to continue processing your transaction.",
    viewDetails: "View Details",
    secureSupport: "Secure support conversation",
    caseIdLabel: "Case ID",
    today: "Today",
    voiceNote: "Voice Note",
    intakeDesk: "Intake Desk",
    secureConnection: "Secure Connection",
    enterpriseSupport: "PayMe Enterprise Support Portal",
    welcomeText: "Welcome to the HSBC customer operations and clearing queue. Please provide the required information below so we can routing your ticket directly to the assigned settlement supervisor.",
    fullName: "Full Name / Merchant Title",
    email: "Registered Business Email",
    selectCategory: "Select Issue Category",
    describeIssue: "Describe your issue in detail",
    shareDocs: "Share documents or receipts",
    chooseFile: "Choose File",
    back: "Back",
    continue: "Continue",
    submitTicket: "Submit Ticket",
    queueActive: "Queue Ticket Active",
    waitingAgent: "Waiting for Agent Connection",
    matchingInquiry: "Your details have been successfully checked. We are matching your inquiry with a qualified compliance officer. Please do not close this window.",
    queuePosition: "Queue Position",
    firstInLine: "1st in line",
    estWait: "Est. Wait Time",
    underOneMin: "< 1 minute",
    securityClearance: "Verified Security Clearance ID",
    typeMessage: "Type a message...",
    pressEnter: "Press Enter to send...",
    send: "Send",
    settingsTitle: "Chat Preferences",
    settingsSubtitle: "Interface Settings",
    languageLabel: "Preferred Language",
    english: "English (US)",
    hk: "繁體中文 (香港)",
    close: "Close",
    connectingNotice: "Secure support conversation",
    txnIdLabel: "Transaction ID (Optional)",
    refNumLabel: "Reference Number (Optional)",
    placeholderName: "e.g., Ka Hing Wong",
    placeholderEmail: "e.g., merchant@company.com",
    placeholderTxn: "e.g. PM-HK-20240517-0012",
    placeholderRef: "e.g. REF-2026-A91",
    placeholderDesc: "Please clarify details about disputed deposits or hold constraints...",
    disputedHold: "disputed deposits or hold constraints",
    voiceHoldToSpeak: "Hold to speak",
    voiceRecording: "Recording",
    voicePaused: "Paused",
    voiceReleaseToSend: "Release to send",
    sendingAttachment: "Sending secure attachment...",
    conversationClosed: "This conversation has been closed. Click here to open a new ticket.",
    lockedPrivileges: "Privileges have been locked by the agent. Please wait.",
    clickHere: "here",
    currentStatus: "Current Status",
    caseVerification: "Case Verification",
    caseMetadata: "Case Metadata",
    referenceInfo: "Reference Info",
    merchant: "Merchant",
    requiredActions: "Required Actions",
    noActionsRequested: "No specific actions requested by agent yet.",
    paymentRequired: "Payment Required",
    amountDue: "Amount Due",
    verifyDeposit: "Verify Deposit Clearance",
    dismiss: "Dismiss",
    processing: "Processing...",
    queueTicketActive: "Queue Ticket Active",
    queueDetails: "Your details have been successfully checked. We are matching your inquiry with a qualified compliance officer. Please do not close this window.",
    estWaitTime: "Est. Wait Time",
    lessThanOneMin: "< 1 minute",
    sessionLocked: "Privileges have been locked by the agent. Please wait.",
    composerPlaceholder: "Type your message here...",
    uploadsDisabled: "Uploads disabled",
    shareFile: "Share file",
    voiceDisabled: "Voice disabled",
    recordVoice: "Record voice note",
    recordAudio: "Record audio note",
    poweredByPayMe: "Powered by PayMe from"
  },
  hk: {
    endChat: "結束對話",
    verifiedAgent: "已驗證專員",
    online: "在線",
    offline: "離線",
    department: "客戶服務專家",
    actionRequired: "需要採取行動：",
    verificationNeeded: "需要進行額外驗證以繼續處理您的交易。",
    viewDetails: "查看詳情",
    secureSupport: "安全支援對話",
    caseIdLabel: "個案編號",
    today: "今天",
    voiceNote: "語音訊息",
    intakeDesk: "登記處",
    secureConnection: "安全連接",
    enterpriseSupport: "PayMe 企業支援門戶",
    welcomeText: "歡迎來到滙豐客戶運營與結算隊列。請在下方提供所需信息，以便我們將您的工單直接轉接給指定的結算主管。",
    fullName: "全名 / 商戶名稱",
    email: "已註冊的業務電子郵件",
    selectCategory: "選擇問題類別",
    describeIssue: "詳細描述您的問題",
    shareDocs: "共享文件或收據",
    chooseFile: "選擇檔案",
    back: "返回",
    continue: "繼續",
    submitTicket: "提交工單",
    queueActive: "排隊工單已激活",
    waitingAgent: "等待專員接通",
    matchingInquiry: "您的詳細信息已成功核對。我們正在為您配對合適的合規專員。請不要關閉此窗口。",
    queuePosition: "排隊位置",
    firstInLine: "第 1 位",
    estWait: "預計等待時間",
    underOneMin: "少於 1 分鐘",
    securityClearance: "已驗證安全許可編號",
    typeMessage: "輸入訊息...",
    pressEnter: "按 Enter 鍵發送...",
    send: "發送",
    settingsTitle: "聊天設定",
    settingsSubtitle: "介面設定",
    languageLabel: "首選語言",
    english: "English (英文)",
    hk: "繁體中文 (香港)",
    close: "關閉",
    connectingNotice: "安全支援對話",
    txnIdLabel: "交易編號（選填）",
    refNumLabel: "參考編號（選填）",
    placeholderName: "例如：黃嘉興",
    placeholderEmail: "例如：merchant@company.com",
    placeholderTxn: "例如：PM-HK-20240517-0012",
    placeholderRef: "例如：REF-2026-A91",
    placeholderDesc: "請詳細說明有爭議的存款或扣留限制...",
    disputedHold: "有爭議的存款或扣留限制",
    voiceHoldToSpeak: "按住說話",
    voiceRecording: "錄音中",
    voicePaused: "已暫停",
    voiceReleaseToSend: "鬆開發送",
    sendingAttachment: "正在安全地傳送附件...",
    conversationClosed: "此對話已結束。點擊此處開啟新工單。",
    lockedPrivileges: "功能已被專員鎖定。請稍候。",
    clickHere: "此處",
    currentStatus: "當前狀態",
    caseVerification: "個案驗證",
    caseMetadata: "個案詳細資訊",
    referenceInfo: "參考資訊",
    merchant: "商戶",
    requiredActions: "需要採取的行動",
    noActionsRequested: "專員暫未要求任何特定行動。",
    paymentRequired: "需要付款",
    amountDue: "應付金額",
    verifyDeposit: "驗證存款清算",
    dismiss: "關閉",
    processing: "處理中...",
    queueTicketActive: "排隊工單已激活",
    queueDetails: "您的詳細信息已成功核對。我們正在為您配對合適的合規專員。請不要關閉此窗口。",
    estWaitTime: "預計等待時間",
    lessThanOneMin: "少於 1 分鐘",
    sessionLocked: "功能已被專員鎖定。請稍候。",
    composerPlaceholder: "在此輸入訊息...",
    uploadsDisabled: "上傳功能已被停用",
    shareFile: "共享檔案",
    voiceDisabled: "語音功能已被停用",
    recordVoice: "錄製語音訊息",
    recordAudio: "錄製音訊訊息",
    poweredByPayMe: "支援技術由 PayMe 自"
  }
};

interface LiveChatProps {
  onBackToHome: () => void;
  sessionId?: string;
}

const PAYME_BOT_AVATAR = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop';

// Helper for professional very low vibration
const triggerVibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore if unsupported or blocked by browser policy
  }
};

const getActiveProgressStepName = (session: ChatSession | null | undefined, lang: 'en' | 'hk' = 'en') => {
  if (!session) return lang === 'hk' ? '審查中' : 'Received';
  const steps = session.caseStatusConfig?.progressSteps || [
    { id: 1, name: 'Received', status: 'Reviewing', visible: true },
    { id: 2, name: 'Under Review', status: 'Pending', visible: true },
    { id: 3, name: 'Refund Verification', status: 'Pending', visible: true },
    { id: 4, name: 'Completed', status: 'Pending', visible: true }
  ];
  const activeSteps = steps.filter(s => s.visible !== false);
  const reviewingStep = activeSteps.find(s => s.status === 'Reviewing' || s.status === '審查中' || s.status === '驗證中');
  if (reviewingStep) return reviewingStep.name;
  
  const successSteps = activeSteps.filter(s => s.status === 'Success' || s.status === '成功' || s.status === '已完成');
  if (successSteps.length > 0) return successSteps[successSteps.length - 1].name;

  return activeSteps[0]?.name || (lang === 'hk' ? '審查中' : 'Received');
};

// Helper for very low professional sound notification
const playProfessionalSound = (type: 'accept' | 'message' | 'click') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'accept') {
      // Gentle, low professional two-tone chime when agent accepts case
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.12); // C#5
      gain.gain.setValueAtTime(0.002, now);
      gain.gain.linearRampToValueAtTime(0.018, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'click') {
      // Crisp, subtle professional UI click sound for language feedback
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.002, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else {
      // Soft, very low professional message notification blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.002, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // Ignore audio errors if blocked by browser policy
  }
};

function CsatRatingCard({
  session,
  msg,
  customerLanguage,
  assignedAgentName,
  onRate
}: {
  session: any;
  msg: any;
  customerLanguage: string;
  assignedAgentName: string;
  onRate: (rating: number, comment?: string) => Promise<void>;
}) {
  const [selectedStars, setSelectedStars] = useState<number>(session.rating || 0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [commentText, setCommentText] = useState<string>(session.ratingComment || '');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isSubmitted = Boolean(session.rating && session.rating > 0);
  const agentDisplayName = msg.agentName || assignedAgentName || 'Mei Ling Tse';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStars === 0 || submitting) return;
    setSubmitting(true);
    await onRate(selectedStars, commentText);
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto my-3 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs text-slate-800 text-center animate-fadeIn">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <div className="flex items-center gap-1 bg-amber-50/90 px-3 py-1 rounded-full border border-amber-200/80 shadow-2xs">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-4 h-4 ${(isSubmitted ? (session.rating || selectedStars) : (hoverStars || selectedStars)) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          ))}
        </div>
      </div>

      <div className="text-xs font-bold text-slate-900 mb-1.5 leading-snug">
        {customerLanguage === 'hk'
          ? `您如何評價 ${agentDisplayName} 今天為您提供的支援？`
          : `How would you rate the support you received from ${agentDisplayName} today?`}
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="flex items-center justify-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStars(star)}
                onMouseEnter={() => setHoverStars(star)}
                onMouseLeave={() => setHoverStars(0)}
                className="p-1 hover:scale-125 focus:outline-none transition-transform cursor-pointer"
              >
                <Star
                  className={`w-7 h-7 ${(hoverStars || selectedStars) >= star ? 'fill-amber-400 text-amber-400 shadow-xs' : 'text-slate-300 hover:text-amber-300'}`}
                />
              </button>
            ))}
          </div>

          <div className="text-left">
            <label className="text-[10.5px] font-semibold text-slate-500 mb-1 block">
              {customerLanguage === 'hk' ? '其他意見 (可選)' : 'Additional comments (optional)'}
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={customerLanguage === 'hk' ? '告訴我們有何可以改進之處...' : 'Tell us what went well or could be improved...'}
              rows={2}
              className="w-full p-2.5 text-[16px] sm:text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-red-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={selectedStars === 0 || submitting}
            className="w-full py-2.5 px-4 bg-[#DB0011] hover:bg-[#b5000e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting
              ? (customerLanguage === 'hk' ? '提交中...' : 'Submitting...')
              : (customerLanguage === 'hk' ? '提交反饋' : 'Submit Feedback')}
          </button>
        </form>
      ) : (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 mt-2">
          <div className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{customerLanguage === 'hk' ? '感謝您的寶貴反饋！' : 'Thank you for your feedback!'}</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-600">
            {customerLanguage === 'hk'
              ? `已記錄 ${session.rating} / 5 星評價。`
              : `Saved rating of ${session.rating} / 5 stars.`}
          </div>
          {session.ratingComment && (
            <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left mt-1.5 leading-relaxed">
              "{session.ratingComment}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

let activeAgentsPromise: Promise<Agent[]> | null = null;
let geoFetchPromise: Promise<any> | null = null;
let activeInitPromise: Promise<any> | null = null;
let activeInitId: string | undefined | null = null;

export default function LiveChat({ onBackToHome, sessionId: propSessionId }: LiveChatProps) {
  const clearCustomerSession = () => {
    localStorage.removeItem('payme_chat_session_id');
    localStorage.removeItem('payme_customer_name');
    localStorage.removeItem('payme_customer_email');
    localStorage.removeItem('payme_customer_phone');
  };

  const [customerLanguage, setCustomerLanguage] = useState<'en' | 'hk'>(() => {
    return (localStorage.getItem('payme_customer_language') as 'en' | 'hk') || 'en';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isAndroidMobile, setIsAndroidMobile] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = /android/i.test(ua);
      const isMobile = /mobile/i.test(ua);
      if (isAndroid && isMobile) {
        setIsAndroidMobile(true);
      }
    }
  }, []);

  const androidStyle = isAndroidMobile ? {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 'calc(100% / 0.83)',
    height: 'calc(100% / 0.83)',
    transform: 'scale(0.83)',
    transformOrigin: 'top left',
  } : {};

  const handleBackToHomeWithAnimation = () => {
    setIsExiting(true);
    setTimeout(() => {
      onBackToHome();
    }, 1800);
  };

  const updateServerLanguage = async (lang: 'en' | 'hk') => {
    if (!session || session.id === 'draft') return;
    try {
      const res = await fetch(`/api/chats/${session.id}/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang })
      });
      if (res.ok) {
        const data: ChatSession = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.warn('Failed to update server language immediately:', e);
    }
  };

  const renderTransitionScreen = () => {
    return (
      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-full z-[99999] flex flex-col items-center justify-center select-none"
            style={{
              background: 'rgba(244, 246, 250, 0.45)',
              backdropFilter: 'blur(35px) saturate(210%)',
              WebkitBackdropFilter: 'blur(35px) saturate(210%)',
            }}
          >
            {/* Ambient Red glow in center */}
            <div className="absolute w-[450px] h-[450px] rounded-full bg-[#DB0011]/10 blur-[120px] pointer-events-none -z-10 animate-pulse" />

            {/* Glowing Refractive Liquid Glass Card */}
            <motion.div
              initial={{ scale: 0.85, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="w-[90%] max-w-[360px] p-8 text-center rounded-[24px] flex flex-col items-center relative"
              style={{
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.65)',
                boxShadow: 'inset 0 16px 24px -10px rgba(255, 255, 255, 0.95), inset 16px 0 24px -10px rgba(255, 255, 255, 0.95), inset -16px 0 24px -10px rgba(255, 255, 255, 0.95), 0 25px 50px -15px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {/* Spinning Logo / Icon ring */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                {/* Outermost animated glass ring */}
                <div className="absolute inset-0 rounded-full border-2 border-slate-300/40 animate-spin" style={{ animationDuration: '3s' }} />
                {/* Middle glowing Red ring */}
                <div className="absolute inset-2 rounded-full border-2 border-[#DB0011]/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                {/* Central Glass Circle with Lock Icon */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md relative z-10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.95)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.9), 0 4px 12px rgba(219,0,17,0.12)'
                  }}
                >
                  <Lock className="w-5 h-5 text-[#DB0011] animate-pulse" strokeWidth={2.5} />
                </div>
              </div>

              {/* Status Header */}
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-slate-900 font-black text-lg tracking-tight mb-1.5"
              >
                {customerLanguage === 'hk' ? '安全結束對話中...' : 'Closing secure session...'}
              </motion.h3>

              {/* Status Description */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 text-xs font-semibold leading-normal max-w-[240px] mb-6"
              >
                {customerLanguage === 'hk' 
                  ? '對話已安全加密封存，正在安全返回 PayMe 支援中心。' 
                  : 'Your chat session is safely encrypted and archived. Returning to the Help Center.'}
              </motion.p>

              {/* Animated progress bar loader */}
              <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden relative border border-white/40">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="h-full bg-[#DB0011] rounded-full"
                  style={{
                    boxShadow: '0 0 8px rgba(219,0,17,0.6)'
                  }}
                />
              </div>

              {/* Secure lock footnote */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>{customerLanguage === 'hk' ? '安全終端' : 'Secure Terminal'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Auto-close settings dropdown when clicking outside or scrolling anywhere
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        // Prevent closing immediately if the toggle hamburger button is clicked (let its own handler run)
        const hamburgerBtn = document.querySelector('[title="Chat Preferences"], [title="聊天設定"], .lucide-menu');
        if (hamburgerBtn && hamburgerBtn.contains(target)) {
          return;
        }
        setIsSettingsOpen(false);
      }
    };

    const handleScrollOutside = () => {
      setIsSettingsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScrollOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScrollOutside, true);
    };
  }, [isSettingsOpen]);

  const t = (key: keyof typeof LOCALIZED_TEXT['en']) => {
    return LOCALIZED_TEXT[customerLanguage][key] || LOCALIZED_TEXT['en'][key] || key;
  };

  const getCategoryLabel = (cat: string) => {
    if (customerLanguage === 'hk') {
      return CATEGORY_TRANSLATIONS[cat] || cat;
    }
    return cat;
  };

  const translateInstructionTitle = (title: string) => {
    if (customerLanguage !== 'hk') return title;
    if (title === 'Submit HK Business Registry Copy') return '提交香港商業登記證副本';
    if (title === 'Submit Bank Settlement Document') return '提交銀行結算文件';
    return title;
  };

  const translateInstructionDesc = (desc: string) => {
    if (customerLanguage !== 'hk') return desc;
    if (desc === 'Please upload a PDF or high-resolution screenshot of your current valid Business Registration Certificate.') {
      return '請上傳您當前有效的商業登記證（BR）PDF 檔或高解析度螢幕截圖。';
    }
    if (desc === 'Upload recent banking transaction record verifying secondary clearance.') {
      return '上傳近期的銀行交易記錄以核實二次結算清算。';
    }
    return desc;
  };

  const translateText = (text: string, sender: string, msg?: any) => {
    if (customerLanguage !== 'hk') return text;
    if (msg?.translationHk) return msg.translationHk;
    if (!text || sender === 'customer') return text;

    const trimmed = text.trim();

    // 1. Direct match translations
    const directMatches: Record<string, string> = {
      "Welcome to PayMe by HSBC Help Center. I am your AI Support Assistant. Before I transfer you to a specialist, let's gather a few brief details. May I have your email address?": 
        "歡迎使用 PayMe by HSBC 支援中心。我是您的 AI 支援助理。在為您轉接至專員前，請先提供您的電郵地址。",
      "Welcome to PayMe Business LLC Help Center. I am your AI Support Assistant. Before I transfer you to a specialist, let's gather a few brief details. May I have your full name?": 
        "歡迎使用 PayMe Business LLC 支援中心。我是您的 AI 智能助理。在為您接通客戶服務專家之前，請先提供一些簡短的資訊。請問您的全名是？",
      "Got it. What category does your issue fall under? (e.g. Account Issues, Payment Issues, Refund Issues, Technical Support, etc.)": 
        "明白。請問您的問題屬於哪一個類別？（例如：帳戶問題、付款問題、退款問題、技術支援等）",
      "Please provide your Transaction ID or Reference Number, and a brief description of what happened.": 
        "請提供您的交易編號或參考編號，並簡短描述發生的情況。",
      "Hello! I'm Carmen, how can I assist you today?": 
        "你好！我是 Carmen，今天有什麼我可以幫到您？",
      "Hello! I'm Carmen. How can I assist you today?": 
        "你好！我是 Carmen，今天有什麼我可以幫到您？",
      "Thank you for the details. Let me check this for you.": 
        "感謝您提供資料。請容我為您核對一下。",
      "I've checked your transaction. It's currently on hold for verification. No worries, your money is safe with us.": 
        "我已為您檢查該筆交易。目前該交易因安全驗證正處於扣留狀態。請放心，您的資金非常安全。",
      "Please let me know if you can provide any additional information so I can help resolve this faster.": 
        "若您能提供任何補充資料，請隨時通知我，以便我能更快為您解決問題。",
      "Sure. To proceed, we may need a bit more information from you.": 
        "好的。為了繼續處理，我們可能需要向您收集更多資料。",
      "System: Customer typing privileges have been temporarily locked by the administrator.":
        "系統提示：管理員已暫時鎖定顧客的打字權限。",
      "System: Customer typing privileges have been unlocked.":
        "系統提示：顧客的打字權限已解鎖。",
      "System: Requirement \"Submit HK Business Registry Copy\" completed.":
        "系統提示：要求「提交香港商業登記證副本」已完成。",
      "System: Requirement \"Submit Bank Settlement Document\" completed.":
        "系統提示：要求「提交銀行結算文件」已完成。",
      "Your request has been received. We are connecting you with an available support human specialist.":
        "您的請求已收到。我們正在為您轉接至可用的支援人手專員。",
      "Your request has been received. We are connecting you with an available support human specialist":
        "您的請求已收到。我們正在為您轉接至可用的支援人手專員"
    };

    if (directMatches[trimmed]) return directMatches[trimmed];

    // 2. Dynamic regex & partial matching for advanced cases
    let result = text;

    // A. Dynamic welcome message for dynamic name
    if (result.startsWith("Thank you, ") && result.endsWith(". What is your registered business email address?")) {
      const name = result.replace("Thank you, ", "").replace(". What is your registered business email address?", "");
      return `謝謝您，${name}。請問您登記的業務電子郵件地址是？`;
    }

    // B. Final registration ticket info block
    if (result.startsWith("Perfect. I have registered your ticket.")) {
      const caseIdMatch = result.match(/Case ID:\s*([^\n]+)/);
      const merchantMatch = result.match(/Merchant:\s*([^\n]+)/);
      const emailMatch = result.match(/Email:\s*([^\n]+)/);
      const txnMatch = result.match(/Transaction ID:\s*([^\n]+)/);

      const caseId = caseIdMatch ? caseIdMatch[1] : '';
      const merchant = merchantMatch ? merchantMatch[1] : '';
      const email = emailMatch ? emailMatch[1] : '';
      const txn = txnMatch ? txnMatch[1] : '';

      return `太好了。我已成功為您登記該工單。

個案編號：${caseId}
商戶名稱：${merchant}
電子郵件：${email}
交易編號：${txn}

您的案件現在正轉交予支援專家。請稍候，我們正在為您配對合適的專員。`;
    }

    // C. Connecting agent message
    if (result.startsWith("System: Conversation transferred from ")) {
      const parts = result.match(/System: Conversation transferred from (.*?) to (.*?) \((.*?)\)\./);
      if (parts) {
        return `系統提示：對話已由 ${parts[1]} 轉交予 ${parts[2]}（${parts[3]}）。`;
      }
    }

    if (result.includes(" is now connected.")) {
      result = result.replace(" is now connected.", " 已連接。")
                     .replace(" (Support Specialist)", "（客戶服務專家）")
                     .replace(" (Dispute Resolution Expert)", "（爭議解決專家）")
                     .replace(" (VIP Relations)", "（貴賓客戶關係專家）")
                     .replace(" (Technical Support)", "（技術支援專家）")
                     .replace(" (Risk & Compliance)", "（風險及合規審查官）")
                     .replace(" (Merchant Services)", "（商戶服務專家）")
                     .replace(" (Customer Operations)", "（客戶運營專員）");
    }

    // D. Transaction action automated messages
    if (result.includes("I have successfully processed a full refund for transaction")) {
      result = result.replace("I have successfully processed a full refund for transaction", "我已為您的交易成功辦理全額退款 ");
      result = result.replace("The amount of HK$", "。款項 HK$");
      result = result.replace("will be credited back to the payer's account within a few business days.", "將於數個工作天內退回到付款帳戶中。");
    }

    if (result.includes("Great news! Our risk verification team has verified your invoices, and the security hold on transaction")) {
      result = result.replace("Great news! Our risk verification team has verified your invoices, and the security hold on transaction", "好消息！我們的風險審查團隊已核實您的發票憑證，該筆交易的扣留限制現已解除：");
      result = result.replace("has been released. The funds are now available in your merchant balance.", "。資金現已撥入您的商戶餘額中。");
    }

    if (result.includes("We have manually reconciled and cleared transaction")) {
      result = result.replace("We have manually reconciled and cleared transaction", "我們已手動入賬並結算交易 ");
      result = result.replace("has been confirmed, and your merchant balance is updated immediately. We sincerely apologize for the delay!", "已經確認入賬，您的商戶餘額已即時更新。非常抱歉造成您的不便！");
    }

    // E. System Case timeline update status messages
    if (result.startsWith("System: Case progress status updated to ")) {
      result = result.replace('System: Case progress status updated to "Received".', '系統提示：個案進度狀態已更新為「已收到」。')
                     .replace('System: Case progress status updated to "Under Review".', '系統提示：個案進度狀態已更新為「審查中」。')
                     .replace('System: Case progress status updated to "On Hold".', '系統提示：個案進度狀態已更新為「扣留中」。')
                     .replace('System: Case progress status updated to "Refund Verification".', '系統提示：個案進度狀態已更新為「退款驗證中」。')
                     .replace('System: Case progress status updated to "Pending Approval".', '系統提示：個案進度狀態已更新為「等待批准」。')
                     .replace('System: Case progress status updated to "Completed".', '系統提示：個案進度狀態已更新為「已完成」。')
                     .replace('System: Case progress status updated to "Payment On Hold".', '系統提示：個案進度狀態已更新為「付款扣留中」。');
    }

    if (result.startsWith("System: New instruction card added:")) {
      result = result.replace("System: New instruction card added:", "系統提示：已新增要求項目：");
      result = result.replace("Submit HK Business Registry Copy", "「提交香港商業登記證副本」")
                     .replace("Submit Bank Settlement Document", "「提交銀行結算文件」");
    }

    if (result.startsWith("System: Payment request of ")) {
      const matchPay = result.match(/System: Payment request of ([A-Z]{3})\s*([\d\.]+)\s*has been enabled \(Status: (.*?)\)\./);
      if (matchPay) {
        const currency = matchPay[1];
        const amount = matchPay[2];
        const status = matchPay[3] === 'Under Review' ? '審查中' : matchPay[3];
        return `系統提示：已啟用金額為 ${currency} ${amount} 的付款請求（狀態：${status}）。`;
      }
    }

    // F. General Agent Custom Greeting and Messages fallback replacement
    const replacements: [RegExp, string][] = [
      [/please upload/gi, "請上傳"],
      [/business registry/gi, "商業登記證"],
      [/BR document/gi, "商業登記證文件"],
      [/identity verification/gi, "身份驗證"],
      [/bank settlement/gi, "銀行結算文件"],
      [/your account/gi, "您的帳戶"],
      [/disputed deposits/gi, "有爭議的存款"],
      [/hold constraints/gi, "扣留限制"],
      [/the transaction/gi, "該筆交易"],
      [/is resolved/gi, "已解決"],
      [/the hold has been released/gi, "扣留已解除"],
      [/we are reviewing/gi, "我們正在審查"],
      [/thank you/gi, "謝謝您"],
      [/please wait/gi, "請稍候"]
    ];

    replacements.forEach(([regex, repl]) => {
      result = result.replace(regex, repl);
    });

    return result;
  };

  const [session, setSession] = useState<ChatSession | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Bot-Flow local states
  const [botStep, setBotStep] = useState<number>(-1); // -1: Welcome/Support Dashboard, 0+: Active Chat View
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTxnId, setFormTxnId] = useState('');
  const [formRefNum, setFormRefNum] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [onboardingFiles, setOnboardingFiles] = useState<{name: string, type: string, data: string}[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);
  const [isVerifiedSubmitted, setIsVerifiedSubmitted] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const sessionRef = useRef<ChatSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Fetch agents exactly once when session becomes active to show assigned agent details
  useEffect(() => {
    const isPreChatOrHomepage = !session || session.id === 'draft' || (session.status === 'bot' && (botStep === -1 || (botStep >= 0 && botStep <= 3)));
    if (isPreChatOrHomepage) {
      return;
    }

    // Do not fetch agents if there is no assigned human agent yet (waiting state)
    if (!session.agentId) {
      return;
    }

    const fetchAgents = async () => {
      try {
        let data: Agent[];
        if (activeAgentsPromise) {
          data = await activeAgentsPromise;
        } else {
          activeAgentsPromise = fetch('/api/agents')
            .then(res => {
              if (res.ok) return res.json();
              throw new Error('Failed to fetch agents');
            })
            .finally(() => {
              activeAgentsPromise = null;
            });
          data = await activeAgentsPromise;
        }
        setAgents(data);
      } catch (err) {
        console.warn('Failed to fetch agents:', err);
      }
    };

    fetchAgents();
  }, [session?.id, botStep, session?.agentId]);

  const isInitializingChatRef = useRef(false);
  const lastSessionIdRef = useRef<string | undefined>(undefined);
  const isInitialLoadRef = useRef(true);
  const prevAgentIdRef = useRef<string | undefined>(undefined);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const knownMsgIdsRef = useRef<Set<string>>(new Set());

  // Monitor agent case acceptance and new agent messages for vibration and sound notifications
  useEffect(() => {
    if (!session || session.id === 'draft') return;

    if (lastSessionIdRef.current !== session.id) {
      lastSessionIdRef.current = session.id;
      isInitialLoadRef.current = true;
      knownMsgIdsRef.current.clear();
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevAgentIdRef.current = session.agentId;
      prevStatusRef.current = session.status;
      session.messages.forEach(m => knownMsgIdsRef.current.add(m.id));
      return;
    }

    const wasUnassigned = !prevAgentIdRef.current || prevStatusRef.current === 'pending' || prevStatusRef.current === 'bot';
    const isNowAssigned = Boolean(session.agentId) && session.status === 'active';
    let didAccept = false;

    if (wasUnassigned && isNowAssigned) {
      playProfessionalSound('accept');
      triggerVibrate([30, 40, 30]);
      didAccept = true;
    }

    prevAgentIdRef.current = session.agentId;
    prevStatusRef.current = session.status;

    let hasNewAgentMessage = false;
    session.messages.forEach(msg => {
      if (!knownMsgIdsRef.current.has(msg.id)) {
        if (msg.sender === 'agent' || (session.status === 'active' && msg.sender !== 'customer')) {
          hasNewAgentMessage = true;
        }
        knownMsgIdsRef.current.add(msg.id);
      }
    });

    if (hasNewAgentMessage && !didAccept) {
      playProfessionalSound('message');
      triggerVibrate([20]);
    }
  }, [session]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');
  const [isScrollingChat, setIsScrollingChat] = useState(false);
  
  // Header and Collapsible banner state
  const [isCasePanelExpanded, setIsCasePanelExpanded] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [floatingCardPos, setFloatingCardPos] = useState(() => {
    try {
      const saved = localStorage.getItem('payme_floating_card_pos');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });
  const isDraggingCardRef = useRef(false);

  const initialGreetingTriggeredRef = useRef<Record<string, boolean>>({});

  const validateEmail = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return customerLanguage === 'hk' ? '請輸入您的電郵地址。' : 'Please enter your email address.';
    }
    
    // RFC 5322 standard email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return customerLanguage === 'hk' 
        ? '電郵格式不正確。請輸入有效的電郵地址 (例如 name@example.com)。' 
        : 'Invalid email address format. Please enter a valid address (e.g., name@example.com).';
    }

    const domain = cleanEmail.split('@')[1];
    if (!domain || !domain.includes('.')) {
      return customerLanguage === 'hk' 
        ? '找不到此電郵功能網域。請輸入有效的電郵地址。' 
        : 'Email domain address not found. Please enter a valid registered email.';
    }

    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
      return customerLanguage === 'hk' 
        ? '域名字尾無效 (.com, .hk 等)。請檢查您的電郵。' 
        : 'Invalid top-level domain extension (.com, .hk, etc.). Please check your email.';
    }

    const username = cleanEmail.split('@')[0];
    const fakeUsernames = ['test', 'fake', 'asdf', 'sample', 'example', '123', 'abc', 'qwerty', 'user', 'noemail', 'temp'];
    const fakeDomains = ['test.com', 'example.com', 'abc.com', 'fake.com', 'domain.com', 'asdf.com', 'temp.com'];
    
    if (fakeUsernames.includes(username) || fakeDomains.includes(domain)) {
      return customerLanguage === 'hk' 
        ? '檢測到未經驗證或一次性電郵。請輸入真實有效的電郵地址。' 
        : 'Unverified or disposable email address detected. Please enter a valid email address.';
    }

    return null;
  };

  const handleInChatIntakeSubmit = async () => {
    let activeSession = session;
    if (!activeSession || activeSession.id === 'draft') {
      activeSession = await ensureSessionCreated();
      if (!activeSession) return;
    }

    let hasErr = false;
    if (!formName.trim()) {
      setNameError(customerLanguage === 'hk' ? '請輸入您的全名或銀行帳戶名稱。' : 'Please enter your full name or account title.');
      hasErr = true;
    } else {
      setNameError(null);
    }

    const err = validateEmail(formEmail);
    if (err) {
      setEmailError(err);
      hasErr = true;
    } else {
      setEmailError(null);
    }

    if (hasErr) return;

    setIsSubmittingIntake(true);

    try {
      const summaryText = customerLanguage === 'hk' ? `[已驗證客戶聯絡資料]
姓名: ${formName.trim()}
電郵: ${formEmail.trim()}
類別: ${formCategory || '一般支援'}
參考/電話: ${formTxnId.trim() || '無'}
備註: ${formDesc.trim() || '無'}` : `[Verified Account Contact Information]
Name: ${formName.trim()}
Email: ${formEmail.trim()}
Topic: ${formCategory || 'General Support'}
Reference / Phone: ${formTxnId.trim() || 'None Provided'}
Description: ${formDesc.trim() || 'None Provided'}`;

      if (typeof localStorage !== 'undefined') {
        if (formName) localStorage.setItem('payme_customer_name', formName.trim());
        if (formEmail) localStorage.setItem('payme_customer_email', formEmail.trim());
        if (formTxnId) localStorage.setItem('payme_customer_phone', formTxnId.trim());
      }

      // Update session topic, customer info, and status to pending in backend
      await fetch(`/api/chats/${activeSession.id}/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formCategory || 'General Support',
          userName: formName.trim(),
          userEmail: formEmail.trim(),
          phone: formTxnId.trim() || (typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_phone') || undefined : undefined),
          status: 'pending'
        })
      });

      // Send customer summary message
      await fetch(`/api/chats/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: summaryText
        })
      });

      // Send bot reply message
      const botText = customerLanguage === 'hk'
        ? `多謝您，${formName.trim()}！您的資料已成功驗證並提交至 PayMe 支援佇列。\n\n您的案件 (#${activeSession.caseId || 'PAYME-84920'}) 已轉接給真人專員。請稍等，專員即將加入對話...`
        : `Thank you, ${formName.trim()}! Your details have been verified and submitted to our HSBC PayMe queue.\n\nYour case (#${activeSession.caseId || 'PAYME-84920'}) has been transferred to a live human representative. Please wait a moment while an agent connects...`;

      const res = await fetch(`/api/chats/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'bot',
          text: botText
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        setIsVerifiedSubmitted(true);
      }
    } catch (e) {
      console.error('Failed to submit intake:', e);
      alert(customerLanguage === 'hk' ? '提交失敗，請檢查網路連線。' : 'Failed to connect to support gateway. Please check your network connection.');
    } finally {
      setIsSubmittingIntake(false);
    }
  };

  // Recording State Machine
  const [isRecording, setIsRecording] = useState(false);
  const [isHoldRecording, setIsHoldRecording] = useState(false);
  const [isTapRecording, setIsTapRecording] = useState(false);
  const [isRecordPaused, setIsRecordPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreviewPlay = () => {
    if (!recordedBase64) return;
    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(recordedBase64);
        previewAudioRef.current.onended = () => setIsPreviewPlaying(false);
      } else {
        previewAudioRef.current.src = recordedBase64;
      }
      previewAudioRef.current.play().then(() => setIsPreviewPlaying(true)).catch(console.error);
    }
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const accumulatedDurationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeoutRef = useRef<any>(null);
  const customerTypingTimeoutRef = useRef<any>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);

  const handleChatScroll = () => {
    if (!isScrollingChat) {
      setIsScrollingChat(true);
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrollingChat(false);
    }, 350);
  };

  // Audio Playback States for Messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Ask for notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  // Unmount cleanup for audio recording
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Connection Status Tracking
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Disconnected' | 'Reconnecting'>('Connected');

  useEffect(() => {
    const handleOnline = () => setConnectionStatus('Connected');
    const handleOffline = () => setConnectionStatus('Disconnected');

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // WebSocket Persistent Connection for Customer Chat
  useEffect(() => {
    const isPreChatOrHomepage = !session || session.id === 'draft' || (session.status === 'bot' && (botStep === -1 || (botStep >= 0 && botStep <= 3)));
    if (isPreChatOrHomepage) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      if (ws) {
        try {
          ws.close();
        } catch (e) {}
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('[WebSocket Customer] Connecting to:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isMounted) {
          try {
            ws?.close();
          } catch (e) {}
          return;
        }
        console.log('[WebSocket Customer] Connected');
        setConnectionStatus('Connected');
        try {
          ws?.send(JSON.stringify({
            type: 'register',
            role: 'customer',
            chatId: session.id
          }));
        } catch (e) {
          console.warn('[WebSocket Customer] Failed to send registration:', e);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket Customer] Received message:', data);

          if (data.type === 'session:update' && data.session && data.session.id === session.id) {
            setSession((prev) => {
              if (!prev) return data.session;
              if (data.session.isDeleted || data.session.isClosed) {
                return {
                  ...data.session,
                  isDeleted: true,
                  isClosed: true,
                  status: 'resolved'
                };
              }
              const serverMsgIds = new Set(data.session.messages.map((m: any) => m.id));
              const pendingOptimistic = prev.messages.filter(m => !serverMsgIds.has(m.id) && m.sender === 'customer');
              if (pendingOptimistic.length > 0) {
                return {
                  ...data.session,
                  messages: [...data.session.messages, ...pendingOptimistic]
                };
              }
              return data.session;
            });
            if (data.session.status === 'pending' || data.session.status === 'active' || data.session.status === 'resolved') {
              setBotStep(4);
            }
          } else if (data.type === 'session:deleted' && data.chatId === session.id) {
            setSession((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                isDeleted: true,
                isClosed: true,
                status: 'resolved'
              };
            });
          } else if (data.type === 'presence:update' && data.chatId === session.id) {
            if (data.agentId) {
              setAgents((prev) => {
                const exists = prev.some(a => a.id === data.agentId);
                if (exists) {
                  return prev.map(a => {
                    if (a.id === data.agentId) {
                      return {
                        ...a,
                        status: data.agentStatus,
                        activeTime: data.agentActiveTime
                      };
                    }
                    return a;
                  });
                } else {
                  return [...prev, {
                    id: data.agentId,
                    name: 'Carmen Lee',
                    initials: 'CL',
                    region: 'Hong Kong HQ',
                    activeTime: data.agentActiveTime,
                    description: 'Customer Support Specialist',
                    status: data.agentStatus,
                    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
                    department: 'Customer Operations',
                    email: 'carmen@payme.hk',
                    currentChatCount: 0
                  }];
                }
              });
            }
          }
        } catch (err) {
          console.warn('[WebSocket Customer] Failed to parse message:', err);
        }
      };

      ws.onclose = (e) => {
        if (!isMounted) return;
        console.log('[WebSocket Customer] Closed', e.reason);
        setConnectionStatus('Reconnecting');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket Customer] Error:', err);
        try {
          ws?.close();
        } catch (e) {}
      };
    };

    connect();

    const heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        } catch (e) {}
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (ws) {
        try {
          ws.close();
        } catch (e) {}
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      clearInterval(heartbeatInterval);
    };
  }, [session?.id, botStep]);

  // 3-minute offline / inactivity detection for single vibration alert
  useEffect(() => {
    let offlineTimer: any = null;
    const OFFLINE_MS = 3 * 60 * 1000; // 3 minutes

    const checkAndStartTimer = () => {
      const isNetOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const isHidden = typeof document !== 'undefined' && document.hidden;
      const isDisconnected = connectionStatus === 'Disconnected';

      if (isNetOffline || isHidden || isDisconnected) {
        if (!offlineTimer) {
          offlineTimer = setTimeout(() => {
            triggerVibrate([50]); // Vibrate once when offline for 3 minutes
            offlineTimer = null;
          }, OFFLINE_MS);
        }
      } else {
        if (offlineTimer) {
          clearTimeout(offlineTimer);
          offlineTimer = null;
        }
      }
    };

    const handleVisibility = () => checkAndStartTimer();
    const handleNetChange = () => checkAndStartTimer();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleNetChange);
      window.addEventListener('offline', handleNetChange);
      document.addEventListener('visibilitychange', handleVisibility);
    }
    checkAndStartTimer();

    // Also track 3-minute customer chat inactivity
    let idleTimer: any = null;
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        triggerVibrate([50]); // Vibrate once after 3 minutes of inactivity
      }, OFFLINE_MS);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    if (typeof window !== 'undefined') {
      events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    }
    resetIdle();

    return () => {
      if (offlineTimer) clearTimeout(offlineTimer);
      if (idleTimer) clearTimeout(idleTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleNetChange);
        window.removeEventListener('offline', handleNetChange);
        document.removeEventListener('visibilitychange', handleVisibility);
        events.forEach(e => window.removeEventListener(e, resetIdle));
      }
    };
  }, [connectionStatus]);

  // Real-time geo intelligence loading
  useEffect(() => {
    const cached = localStorage.getItem('payme_visitor_geo');
    if (cached) {
      try {
        if (JSON.parse(cached).country !== 'Unavailable') {
          return;
        }
      } catch (e) {}
    }

    if (geoFetchPromise) return;

    const loadGeo = async () => {
      try {
        const res = await fetch('https://ipwho.is/').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data && data.success && data.ip) {
            localStorage.setItem('payme_visitor_geo', JSON.stringify({
              ip: data.ip || '127.0.0.1',
              country: data.country || 'Hong Kong',
              region: data.region || 'Central',
              city: data.city || 'Hong Kong Island',
              isp: data.connection?.isp || data.isp || 'Broadband ISP'
            }));
            return;
          }
        }
        const res2 = await fetch('https://ipapi.co/json/').catch(() => null);
        if (res2 && res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.ip) {
            localStorage.setItem('payme_visitor_geo', JSON.stringify({
              ip: data2.ip || '127.0.0.1',
              country: data2.country_name || 'Hong Kong',
              region: data2.region || 'Central',
              city: data2.city || 'Hong Kong Island',
              isp: data2.org || data2.asn || 'Broadband ISP'
            }));
          }
        }
      } catch (e) {}
    };

    geoFetchPromise = loadGeo();
  }, []);

  const collectVisitorInfo = (): VisitorInfo => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    
    let browser = 'Unavailable';
    if (ua.includes('Firefox/')) {
      const ver = ua.split('Firefox/')[1]?.split(' ')[0] || '';
      browser = `Firefox${ver ? ' ' + ver : ''}`;
    } else if (ua.includes('Edg/')) {
      const ver = ua.split('Edg/')[1]?.split(' ')[0] || '';
      browser = `Edge${ver ? ' ' + ver : ''}`;
    } else if (ua.includes('Chrome/')) {
      const ver = ua.split('Chrome/')[1]?.split(' ')[0] || '';
      browser = `Chrome${ver ? ' ' + ver : ''}`;
    } else if (ua.includes('Safari/')) {
      const ver = ua.split('Version/')[1]?.split(' ')[0] || '';
      browser = `Safari${ver ? ' ' + ver : ''}`;
    }

    let os = 'Unavailable';
    if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X ([0-9_]+)/);
      os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
    } else if (ua.includes('Windows NT 10.0')) {
      os = 'Windows 10/11';
    } else if (ua.includes('Windows NT')) {
      os = 'Windows';
    } else if (ua.includes('Android')) {
      const match = ua.match(/Android ([0-9.]+)/);
      os = match ? `Android ${match[1]}` : 'Android';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      const match = ua.match(/OS ([0-9_]+)/);
      os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    }

    let deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unavailable' = 'Unavailable';
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
      deviceType = 'Tablet';
    } else if (/iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = 'Mobile';
    } else if (ua) {
      deviceType = 'Desktop';
    }

    let platform = 'Unavailable';
    if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS Device';
    else if (ua.includes('Android')) platform = 'Android Device';
    else if (ua.includes('Macintosh')) platform = 'macOS Workstation';
    else if (ua.includes('Windows')) platform = 'Windows Workstation';
    else if (ua.includes('Linux')) platform = 'Linux System';

    let tz = 'Unavailable';
    try {
      tz = Intl?.DateTimeFormat?.().resolvedOptions()?.timeZone || 'Unavailable';
    } catch (e) {
      tz = 'Unavailable';
    }

    const nowIso = new Date().toISOString();

    let firstVisit = '';
    let totalVisits: number | string = 1;
    try {
      firstVisit = localStorage.getItem('payme_v_first_visit') || '';
      if (!firstVisit) {
        firstVisit = nowIso;
        localStorage.setItem('payme_v_first_visit', firstVisit);
      }

      const savedVisits = parseInt(localStorage.getItem('payme_v_total_visits') || '0', 10);
      if (!sessionStorage.getItem('payme_v_session_counted')) {
        totalVisits = savedVisits + 1;
        localStorage.setItem('payme_v_total_visits', totalVisits.toString());
        sessionStorage.setItem('payme_v_session_counted', 'true');
      } else {
        totalVisits = savedVisits || 1;
      }
    } catch (e) {
      firstVisit = nowIso;
      totalVisits = 1;
    }

    let localTimeFormatted = 'Unavailable';
    if (tz && tz !== 'Unavailable') {
      try {
        localTimeFormatted = `${new Date().toLocaleTimeString('en-US', { timeZone: tz })} (${tz})`;
      } catch (e) {
        localTimeFormatted = 'Unavailable';
      }
    }

    let currentPage = 'Unavailable';
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      currentPage = window.location.href;
    }

    let referrer = 'Unavailable';
    if (typeof document !== 'undefined' && document.referrer) {
      referrer = document.referrer;
    }

    let cachedGeo: any = null;
    try {
      const geoStr = localStorage.getItem('payme_visitor_geo');
      if (geoStr) cachedGeo = JSON.parse(geoStr);
    } catch (e) {}

    let country = cachedGeo?.country || 'Unavailable';
    let city = cachedGeo?.city || 'Unavailable';
    let region = cachedGeo?.region || 'Unavailable';
    let ip = cachedGeo?.ip || 'Unavailable';
    let isp = cachedGeo?.isp || 'Unavailable';

    if (country === 'Unavailable' && tz && tz !== 'Unavailable') {
      if (tz.includes('Hong_Kong') || tz.includes('HongKong')) { country = 'Hong Kong'; city = 'Central'; region = 'Hong Kong Island'; }
      else if (tz.includes('London') || tz.includes('Europe/London')) { country = 'United Kingdom'; city = 'London'; region = 'England'; }
      else if (tz.includes('Los_Angeles') || tz.includes('Pacific')) { country = 'United States'; city = 'Los Angeles'; region = 'California'; }
      else if (tz.includes('New_York') || tz.includes('Eastern')) { country = 'United States'; city = 'New York'; region = 'New York'; }
      else if (tz.includes('Singapore')) { country = 'Singapore'; city = 'Singapore'; region = 'Singapore'; }
      else if (tz.includes('Tokyo')) { country = 'Japan'; city = 'Tokyo'; region = 'Tokyo'; }
      else if (tz.includes('Paris')) { country = 'France'; city = 'Paris'; region = 'Île-de-France'; }
      else if (tz.includes('Sydney')) { country = 'Australia'; city = 'Sydney'; region = 'New South Wales'; }
    }

    const storedPhone = typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_phone') || undefined : undefined;

    return {
      browser,
      os,
      deviceType,
      platform,
      language: typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'Unavailable',
      screenResolution: (typeof window !== 'undefined' && window.screen) ? `${window.screen.width}x${window.screen.height}` : 'Unavailable',
      timezone: tz,
      localTime: localTimeFormatted,
      firstVisit: firstVisit || nowIso,
      lastVisit: nowIso,
      totalVisits,
      currentPage,
      referrer,
      ip: ip !== 'Unavailable' ? ip : '127.0.0.1',
      country: country !== 'Unavailable' ? country : 'Hong Kong',
      region: region !== 'Unavailable' ? region : 'Central',
      city: city !== 'Unavailable' ? city : 'Hong Kong Island',
      phone: storedPhone,
      isp: isp !== 'Unavailable' ? isp : 'HSBC Network Gateway',
      vpnDetected: false,
      proxyDetected: false,
      torExitNode: false,
      hostingProvider: false,
      asn: 'AS9304 HSBC',
      riskScore: '0 / 100 (Low Risk)'
    };
  };

  // Helper to ensure a session is created ONCE when the customer intentionally starts chatting
  const ensureSessionCreated = async (options?: { topic?: string; name?: string; email?: string }): Promise<ChatSession | null> => {
    if (session && session.id !== 'draft') return session;

    try {
      setLoading(true);
      const vInfo = collectVisitorInfo();
      const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_name') || '' : '';
      const storedEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_email') || '' : '';
      const storedPhone = typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_phone') || '' : '';

      const res = await fetch('/api/chats/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: customerLanguage,
          userName: options?.name || formName || storedName || 'Website Visitor',
          userEmail: options?.email || formEmail || storedEmail || '',
          phone: storedPhone || undefined,
          selectedTopic: options?.topic || formCategory || '',
          visitorInfo: vInfo,
          connectionStatus
        })
      });

      if (!res.ok) throw new Error('Failed to create chat session');
      const data: ChatSession = await res.json();

      // If we had any draft messages, save them to the server
      const draftMessages = session?.messages || [];
      for (const msg of draftMessages) {
        try {
          await fetch(`/api/chats/${data.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.timestamp,
              attachment: msg.attachment
            })
          });
        } catch (e) {
          console.warn('Failed to sync draft message to server:', e);
        }
      }

      // Preserve local state with the same merged messages
      const mergedMessages = [
        ...draftMessages,
        ...data.messages.filter(m => !draftMessages.some(dm => dm.id === m.id))
      ];
      const sessionWithPreservedMessages = {
        ...data,
        messages: mergedMessages
      };

      setSession(sessionWithPreservedMessages);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('payme_chat_session_id', data.id);
      }
      return sessionWithPreservedMessages;
    } catch (err) {
      console.error('Failed to create chat session:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initialize and check current URL path
  useEffect(() => {
    const initChat = async () => {
      if (isInitializingChatRef.current) return;
      isInitializingChatRef.current = true;
      setLoading(true);
      try {
        let sid = propSessionId;
        if (!sid) {
          sid = typeof localStorage !== 'undefined' ? localStorage.getItem('payme_chat_session_id') || undefined : undefined;
          if (sid === 'chat-active-1' || sid === 'chat-pending-1') {
            sid = undefined;
            clearCustomerSession();
          }
        }

        // If no pre-existing session ID in props or localStorage, DO NOT create a session!
        if (!sid) {
          setSession(null);
          setBotStep(-1); // Read-only issue-selection screen
          isInitializingChatRef.current = false;
          setLoading(false);
          return;
        }

        if (activeInitPromise && activeInitId === sid) {
          try {
            const data = await activeInitPromise;
            if (data) {
              setSession(data);
              if (data.language === 'hk' || data.language === 'en') {
                setCustomerLanguage(data.language);
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('payme_customer_language', data.language);
                }
              }
              if (data.status === 'bot') {
                if (data.collectedInfo?.name) {
                  setFormName(data.collectedInfo.name);
                  if (data.collectedInfo?.email) {
                    setFormEmail(data.collectedInfo.email);
                    if (data.selectedTopic) {
                      setFormCategory(data.selectedTopic);
                      setBotStep(3);
                    } else {
                      setBotStep(2);
                    }
                  } else {
                    setBotStep(1);
                  }
                } else {
                  setBotStep(-1);
                }
              } else if (data.status === 'pending') {
                setBotStep(4);
              }
              setErrorMessage(null);
            }
          } catch (err) {
            console.warn('Reused initialization promise failed:', err);
          } finally {
            isInitializingChatRef.current = false;
            setLoading(false);
          }
          return;
        }

        activeInitId = sid;
        let resolvePromise: any;
        let rejectPromise: any;
        activeInitPromise = new Promise((resolve, reject) => {
          resolvePromise = resolve;
          rejectPromise = reject;
        });

        // Read-only GET request to restore existing session
        const res = await fetch(`/api/chats/${sid}`);

        if (!res.ok) {
          // Existing session not found or deleted - clear local session
          clearCustomerSession();
          setSession(null);
          setBotStep(-1);
          isInitializingChatRef.current = false;
          resolvePromise(null);
          activeInitPromise = null;
          activeInitId = null;
          setLoading(false);
          return;
        }

        let data: ChatSession = await res.json();
        
        // If the session was deleted or already closed, do not reuse it.
        if (data.isDeleted || data.isClosed) {
          clearCustomerSession();
          setSession(null);
          setBotStep(-1);
          isInitializingChatRef.current = false;
          resolvePromise(null);
          activeInitPromise = null;
          activeInitId = null;
          setLoading(false);
          return;
        }
        
        setSession(data);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('payme_chat_session_id', data.id);
        }
        if (data.language === 'hk' || data.language === 'en') {
          setCustomerLanguage(data.language);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('payme_customer_language', data.language);
          }
        }
        
        // Match local bot step with server state
        if (data.status === 'bot') {
          if (data.collectedInfo?.name) {
            setFormName(data.collectedInfo.name);
            if (data.collectedInfo?.email) {
              setFormEmail(data.collectedInfo.email);
              if (data.selectedTopic) {
                setFormCategory(data.selectedTopic);
                setBotStep(3); // Details
              } else {
                setBotStep(2); // Category
              }
            } else {
              setBotStep(1); // Email
            }
          } else {
            setBotStep(-1); // Welcome Dashboard
          }
        } else if (data.status === 'pending') {
          setBotStep(4); // Transferring
        }

        setErrorMessage(null);
        resolvePromise(data);
      } catch (err: any) {
        isInitializingChatRef.current = false; // Allow retry on failure
        console.error(err);
        activeInitPromise = null;
        activeInitId = null;
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [propSessionId]);

  // Adaptive polling helper
  const getNextPollingDelay = (currentSession: any) => {
    if (document.hidden) {
      return 25000; // 25 seconds if tab is backgrounded
    }

    const msgs = currentSession?.messages || [];
    if (msgs.length === 0) return 5000;

    const lastMsg = msgs[msgs.length - 1];
    const lastMsgTime = lastMsg?.timestamp ? new Date(lastMsg.timestamp).getTime() : 0;
    const timeSinceLastMsg = Date.now() - lastMsgTime;

    // Active conversation: last message is < 45 seconds old
    const isRecentlyActive = timeSinceLastMsg < 45000;

    if (isRecentlyActive) {
      return 5000; // 5 seconds
    }
    return 15000; // 15 seconds when idle
  };

  // Real-time synchronization polling (Adaptive timeout)
  useEffect(() => {
    const isPreChatOrHomepage = !session || session.id === 'draft' || (session.status === 'bot' && (botStep === -1 || (botStep >= 0 && botStep <= 3)));
    if (isPreChatOrHomepage) return;

    let timeoutId: any = null;
    let isPollingStopped = false;
    let isEffectActive = true;

    const poll = async () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!isEffectActive) return;

      if (document.hidden) {
        isPollingStopped = true;
        return;
      }
      isPollingStopped = false;

      try {
        const currentSession = sessionRef.current;
        if (!currentSession || currentSession.id === 'draft' || !isEffectActive) return;

        const verParam = (currentSession as any).version ? `?knownVersion=${encodeURIComponent((currentSession as any).version)}` : '';
        const res = await fetch(`/api/chats/${currentSession.id}${verParam}`);
        
        if (!isEffectActive) return;

        let nextDelay = 5000;
        
        if (res.ok) {
          const data: any = await res.json();
          if (!isEffectActive) return;

          if (data.isDeleted) {
            clearCustomerSession();
            setSession(null);
            setBotStep(0);
            return;
          }

          if (data.unmodified) {
            nextDelay = getNextPollingDelay(sessionRef.current);
          } else {
            setSession((prev) => {
              if (!prev || !isEffectActive) return prev;
              const serverMsgIds = new Set(data.messages.map((m: any) => m.id));
              const pendingOptimistic = prev.messages.filter(m => !serverMsgIds.has(m.id) && m.sender === 'customer');
              if (pendingOptimistic.length > 0) {
                return {
                  ...data,
                  messages: [...data.messages, ...pendingOptimistic]
                };
              }
              return data;
            });
            
            // Sync bot steps with server state
            if (data.status === 'pending') {
              setBotStep(4);
            }
            nextDelay = getNextPollingDelay(data);
          }
        } else {
          nextDelay = 10000; // Slow down on error
        }

        if (!document.hidden && isEffectActive) {
          timeoutId = setTimeout(poll, nextDelay);
        } else {
          isPollingStopped = true;
        }
      } catch (err) {
        console.warn('Real-time synchronization failure:', err);
        if (!document.hidden && isEffectActive) {
          timeoutId = setTimeout(poll, 10000); // Retry after 10s on network error
        } else {
          isPollingStopped = true;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (isPollingStopped || !timeoutId) {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          poll();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Schedule first poll
    const delay = getNextPollingDelay(sessionRef.current);
    timeoutId = setTimeout(poll, delay);

    return () => {
      isEffectActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.id, customerLanguage, connectionStatus, botStep]);

  // Auto-resize the chat textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputMessage]);

  // Auto-scroll to latest messages (non-intrusive)
  useEffect(() => {
    if (!session) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior
        });
      }
    };

    const currentLength = session.messages?.length || 0;
    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = currentLength;

    // Check if there are actually new messages
    const hasNewMessage = currentLength > prevLength;

    if (hasNewMessage) {
      const lastMessage = session.messages?.[currentLength - 1];
      const isSentByMe = lastMessage?.sender === 'customer';
      
      // Notify customer via desktop notification for agent/bot replies (not on first load)
      if (prevLength > 0 && !isSentByMe) {
        for (let i = prevLength; i < currentLength; i++) {
          const msg = session.messages[i];
          if (msg.sender === 'agent' || msg.sender === 'bot') {
            const senderName = msg.sender === 'agent' ? (msg.agentName || 'PayMe Agent') : 'PayMe Support';
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                try {
                  new Notification(`Support Reply: ${senderName}`, {
                    body: msg.text || (msg.attachment ? 'Sent an attachment' : 'New message received.'),
                    icon: '/favicon.ico',
                    tag: 'payme-customer-msg',
                    silent: false
                  });
                } catch (err) {
                  console.error('Error showing customer notification:', err);
                }
              }
            }
          }
        }
      }

      // Calculate how close the user is to the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      
      // Scroll if it's the customer's own message, they were already near the bottom, or it is the first load
      if (isSentByMe || isNearBottom || prevLength === 0) {
        scrollToBottom('smooth');
      }
    } else if (session.agentTyping) {
      // Scroll if the agent is typing and we are near the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
    } else if (prevLength === 0) {
      // First load scroll to bottom
      scrollToBottom('auto');
    }
  }, [session?.messages, session?.agentTyping, botStep]);

  // Audio Playback Helpers
  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      // Pause any currently playing audio
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      audio.play();
      setPlayingAudioId(msgId);
    }
  };

  // Live Sound Recording Functionality
  const cleanupStream = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    // Stop all audio tracks in our stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    mediaRecorderRef.current = null;
  };

  const startRecording = async () => {
    try {
      if (session?.voiceNotesAllowed === false) {
        alert('Voice messages are currently disabled by the agent.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      setIsRecordPaused(false);
      setRecordDuration(0);
      recordingStartTimeRef.current = Date.now();
      accumulatedDurationRef.current = 0;
      audioChunksRef.current = [];

      // Set up Audio Analyser for dynamic waveform drawing
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Start media recorder
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(audioBlob);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        
        cleanupStream();
      };

      recorder.start(200);

      // Duration counter
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = setInterval(() => {
        const elapsed = accumulatedDurationRef.current + (Date.now() - recordingStartTimeRef.current);
        setRecordDuration(Math.floor(elapsed / 1000));
      }, 200);

      // Canvas dynamic visualization loop
      visualizeRecording();
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const visualizeRecording = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    if (canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth || 360;
      canvas.height = canvas.parentElement.clientHeight || 70;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      if (!canvasRef.current) return;
      const width = canvas.width;
      const height = canvas.height;

      // Stop wave animation and clear canvas as soon as recording finishes or pauses completely
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        ctx.clearRect(0, 0, width, height);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      ctx.clearRect(0, 0, width, height);

      let amplitude = 0.2;
      if (analyserRef.current && mediaRecorderRef.current?.state === 'recording') {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / (dataArray.length || 1);
        amplitude = Math.max(0.12, Math.min(1.0, avg / 80));
      }

      phase += 0.05;

      // Draw multi-layered glowing sine waves in white / soft purple / red
      const centerY = height * 0.45;
      const waveLayers = [
        { color: 'rgba(219, 0, 17, 0.25)', freq: 0.015, ampMult: 0.7, speed: 0.9 },
        { color: 'rgba(192, 132, 252, 0.45)', freq: 0.02, ampMult: 1.1, speed: 1.2 },
        { color: 'rgba(255, 255, 255, 0.9)', freq: 0.025, ampMult: 0.9, speed: 1.5 },
      ];

      waveLayers.forEach((layer) => {
        ctx.beginPath();
        ctx.lineWidth = layer.color.includes('255, 255, 255') ? 2.2 : 1.2;
        ctx.strokeStyle = layer.color;
        ctx.shadowColor = layer.color;
        ctx.shadowBlur = 10;

        for (let x = 0; x < width; x += 2) {
          const edgeFactor = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * layer.freq + phase * layer.speed) * (height * 0.25 * amplitude * layer.ampMult) * edgeFactor;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw sparkling glowing particles along wave
      const particleCount = 16;
      for (let p = 0; p < particleCount; p++) {
        const px = ((p / particleCount) * width + (phase * 25) % width) % width;
        const edgeFactor = Math.sin((px / width) * Math.PI);
        const py = centerY + Math.sin(px * 0.022 + phase * 1.3) * (height * 0.22 * amplitude) * edgeFactor;
        
        ctx.beginPath();
        ctx.arc(px, py, 1.0 + (p % 3) * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const handleMicMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (session?.voiceNotesAllowed === false) return;
    e.preventDefault();
    setIsHoldRecording(true);
    setIsTapRecording(false);
    startRecording();
  };

  const handleMicMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isHoldRecording) {
      setIsHoldRecording(false);
      stopRecordingAndSend(false);
    }
  };

  const handleSoundwaveTap = (e: React.MouseEvent) => {
    if (session?.voiceNotesAllowed === false) return;
    e.preventDefault();
    if (!isRecording && !recordedBase64) {
      setIsTapRecording(true);
      setIsHoldRecording(false);
      startRecording();
    } else if (isRecording) {
      // Tapping again stops recording and saves audio for send button
      stopRecordingAndSend(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.pause();
        setIsRecordPaused(true);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        if (recordingStartTimeRef.current > 0) {
          accumulatedDurationRef.current += Date.now() - recordingStartTimeRef.current;
          recordingStartTimeRef.current = 0;
        }
        setRecordDuration(Math.floor(accumulatedDurationRef.current / 1000));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.resume();
        setIsRecordPaused(false);
        recordingStartTimeRef.current = Date.now();
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = setInterval(() => {
          const elapsed = accumulatedDurationRef.current + (Date.now() - recordingStartTimeRef.current);
          setRecordDuration(Math.floor(elapsed / 1000));
        }, 200);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stopRecordingAndSend = async (sendImmediately: boolean = true) => {
    setIsRecording(false);
    setIsHoldRecording(false);
    setIsTapRecording(false);
    setIsRecordPaused(false);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    let totalMs = accumulatedDurationRef.current;
    if (recordingStartTimeRef.current > 0) {
      totalMs += Date.now() - recordingStartTimeRef.current;
    }
    const currentDuration = Math.max(1, Math.round(totalMs / 1000));
    setRecordDuration(currentDuration);
    recordingStartTimeRef.current = 0;
    accumulatedDurationRef.current = 0;
    
    // Stop tracks immediately to turn off iPhone/browser recording light instantly!
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (sendImmediately) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setRecordingBlob(audioBlob);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            setRecordedBase64(base64);
            if (session) {
              sendVoiceMessage(base64, currentDuration);
            }
          };
          reader.readAsDataURL(audioBlob);
          
          cleanupStream();
        };
      } else {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setRecordingBlob(audioBlob);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setRecordedBase64(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
          
          cleanupStream();
        };
      }

      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping recorder:", e);
        cleanupStream();
      }
    } else {
      cleanupStream();
    }
  };

  const cancelRecording = () => {
    if (previewAudioRef.current) {
      try { previewAudioRef.current.pause(); } catch (e) {}
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
    setIsRecording(false);
    setIsHoldRecording(false);
    setIsTapRecording(false);
    setIsRecordPaused(false);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    recordingStartTimeRef.current = 0;
    accumulatedDurationRef.current = 0;
    setRecordDuration(0);
    audioChunksRef.current = [];
    setRecordingBlob(null);
    setRecordedBase64(null);

    // Stop recorder if it's running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Disable onstop handler before stopping to prevent processing the cancelled recording
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping recorder:", e);
      }
    }

    cleanupStream();
  };

  const sendVoiceMessage = async (base64: string, durationSec: number) => {
    let activeSession = session;
    if (!activeSession || activeSession.id === 'draft') {
      activeSession = await ensureSessionCreated();
      if (!activeSession) return;
    }

    try {
      const voiceAttachment: Attachment = {
        name: `voice-note-${Date.now()}.webm`,
        type: 'audio/webm',
        data: base64,
        duration: durationSec
      };

      const optimisticMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'customer',
        text: `Voice Note (${durationSec}s)`,
        attachment: voiceAttachment,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      // Optimistically update UI and clear recording preview states immediately
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, optimisticMsg]
        };
      });
      setRecordedBase64(null);
      setRecordingBlob(null);
      setRecordDuration(0);

      const res = await fetch(`/api/chats/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: `Voice Note (${durationSec}s)`,
          attachment: voiceAttachment
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Complete Bot Steps and Hand off to Specialist
  const handleNextBotStep = async () => {
    if (botStep === 0) {
      if (!formName.trim()) {
        alert('Please enter your name to proceed.');
        return;
      }
      setBotStep(1);
    } else if (botStep === 1) {
      if (!formEmail.trim() || !formEmail.includes('@')) {
        alert('Please enter a valid registered business email.');
        return;
      }
      if (formCategory) {
        setBotStep(3); // Skip category selection if already selected from welcome screen
      } else {
        setBotStep(2);
      }
    } else if (botStep === 2) {
      if (!formCategory) {
        alert('Please select an issue category.');
        return;
      }
      setBotStep(3);
    } else if (botStep === 3) {
      if (!formDesc.trim()) {
        alert('Please provide a brief description of the issue.');
        return;
      }
      
      setBotStep(4); // Animated loading progress

      let activeSession = session;
      if (!activeSession || activeSession.id === 'draft') {
        activeSession = await ensureSessionCreated({
          name: formName.trim(),
          email: formEmail.trim(),
          topic: formCategory
        });
        if (!activeSession) return;
      }

      try {
        // Post details to backend
        const summaryText = `[AI Verification Intake]
Topic: ${formCategory}
Name: ${formName}
Email: ${formEmail}
Transaction ID: ${formTxnId || 'None Provided'}
Reference No: ${formRefNum || 'None Provided'}
Description: ${formDesc}`;

        if (typeof localStorage !== 'undefined') {
          if (formName) localStorage.setItem('payme_customer_name', formName.trim());
          if (formEmail) localStorage.setItem('payme_customer_email', formEmail.trim());
          if (formTxnId) localStorage.setItem('payme_customer_phone', formTxnId.trim());
        }

        // Create case status update on server
        await fetch(`/api/chats/${activeSession.id}/topic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: formCategory,
            userName: formName.trim(),
            userEmail: formEmail.trim(),
            phone: formTxnId.trim() || (typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_phone') || undefined : undefined),
            status: 'pending' // queue
          })
        });

        // Send messages
        await fetch(`/api/chats/${activeSession.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'customer',
            text: summaryText
          })
        });

        // Trigger bot connection notice
        const res = await fetch(`/api/chats/${activeSession.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'bot',
            text: 'Your case details have been successfully verified. Your case is now being transferred to an HSBC support specialist. Please wait...'
          })
        });

        if (res.ok) {
          const updated = await res.json();
          setSession(updated);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Trigger Bot Greeting Flow (3s initial delay -> typing 6-12s -> greeting)
  const triggerBotGreetingFlow = (sid: string) => {
    setIsBotTyping(false);

    // 3 seconds delay after page/chat opens before typing begins
    setTimeout(() => {
      setIsBotTyping(true);

      // Bot types for 6 to 12 seconds
      const typingDuration = Math.floor(Math.random() * 6000) + 6000;

      setTimeout(async () => {
        setIsBotTyping(false);

        const greetingText = customerLanguage === 'hk'
          ? "歡迎使用 PayMe by HSBC 支援中心。我是您的 AI 支援助理。在為您轉接至專員前，請先提供您的電郵地址。"
          : "Welcome to PayMe by HSBC Help Center. I am your AI Support Assistant. Before I transfer you to a specialist, let's gather a few brief details. May I have your email address?";

        if (sid === 'draft') {
          const welcomeMsg: Message = {
            id: `msg-welcome-${Date.now()}`,
            sender: 'bot',
            text: greetingText,
            timestamp: new Date().toISOString(),
            status: 'sent'
          };
          setSession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...prev.messages, welcomeMsg]
            };
          });
          return;
        }

        try {
          const res = await fetch(`/api/chats/${sid}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: 'bot',
              text: greetingText
            })
          });

          if (res.ok) {
            const updated = await res.json();
            setSession(updated);
          }
        } catch (e) {
          console.error(e);
        }
      }, typingDuration);
    }, 3000);
  };

  // Handle Topic/Issue Selection from Welcome/Start Screen
  const handleSelectTopicAndStartChat = async (topicTitle: string) => {
    setFormCategory(topicTitle);
    setBotStep(0); // Open conversation view

    let activeSession = session;
    if (!activeSession) {
      const draftSession: ChatSession = {
        id: 'draft',
        caseId: 'PM-HK-2026-DRAFT',
        userName: typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_name') || 'Website Visitor' : 'Website Visitor',
        userEmail: typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_email') || '' : '',
        phone: typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_phone') || '' : '',
        status: 'bot',
        language: customerLanguage,
        createdAt: new Date().toISOString(),
        attachmentsAllowed: true,
        voiceNotesAllowed: true,
        messages: [],
        transactions: [],
        selectedTopic: topicTitle,
        instructions: [],
        timelineProgress: 1
      };
      setSession(draftSession);
      
      initialGreetingTriggeredRef.current[draftSession.id] = true;
      triggerBotGreetingFlow(draftSession.id);
      return;
    }

    if (activeSession.id === 'draft') {
      setSession(prev => prev ? { ...prev, messages: [], selectedTopic: topicTitle } : prev);
      initialGreetingTriggeredRef.current[activeSession.id] = true;
      triggerBotGreetingFlow(activeSession.id);
      return;
    }

    try {
      // 1. Update session topic and reset messages on backend
      const res = await fetch(`/api/chats/${activeSession.id}/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          status: 'bot',
          clearMessages: true
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
      } else {
        setSession(prev => prev ? { ...prev, messages: [], selectedTopic: topicTitle, status: 'bot' } : prev);
      }

      // 2. Trigger typing sequence
      initialGreetingTriggeredRef.current[activeSession.id] = true;
      triggerBotGreetingFlow(activeSession.id);
    } catch (err) {
      console.error('Error starting topic chat:', err);
    }
  };

  const handleRateSession = async (ratingVal: number, comment?: string) => {
    if (!session || session.id === 'draft') return;
    try {
      const res = await fetch(`/api/chats/${session.id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingVal, comment })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setSession(data.session);
      }
    } catch (err) {
      console.error('Error submitting customer rating:', err);
    }
  };

  // Unified message submission (Text + Voice via same Send icon)
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let activeSession = session;
    if (!activeSession || activeSession.id === 'draft') {
      activeSession = await ensureSessionCreated();
      if (!activeSession) return;
    }

    if (activeSession.isLocked || activeSession.isBlocked) return;

    // 1. If actively recording when Send icon is clicked, stop and send immediately
    if (isRecording) {
      stopRecordingAndSend(true);
      if (inputMessage.trim()) {
        const textToSubmit = inputMessage.trim();
        setInputMessage('');
        triggerTypingStatus(false);
        try {
          await fetch(`/api/chats/${activeSession.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: 'customer', text: textToSubmit })
          });
        } catch (err) {
          console.error(err);
        }
      }
      return;
    }

    // 2. If voice recording finished and ready in state
    if (recordedBase64) {
      if (previewAudioRef.current) {
        try { previewAudioRef.current.pause(); } catch (e) {}
        previewAudioRef.current = null;
      }
      setIsPreviewPlaying(false);
      const base64ToSend = recordedBase64;
      const durationToSend = recordDuration;
      setRecordedBase64(null);
      setRecordingBlob(null);
      setRecordDuration(0);
      audioChunksRef.current = [];

      await sendVoiceMessage(base64ToSend, durationToSend);
    }

    // 3. If text input exists
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();
    setInputMessage('');

    // Set optimistic customerTyping off
    triggerTypingStatus(false);

    // Optimistically add customer text message to UI immediately
    const optimisticMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'customer',
      text,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMsg]
      };
    });

    try {
      // 1. Post customer text message
      const res = await fetch(`/api/chats/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      let updated = await res.json();
      setSession(updated);

      // 2. If session is in bot mode, perform real-time email verification on customer input
      if (activeSession.status === 'bot') {
        const emailErr = validateEmail(text);
        if (emailErr) {
          // Invalid email! Show typing for 15s-25s then present concise error
          setIsBotTyping(true);
          const errorDelay = Math.floor(Math.random() * 10000) + 15000;

          setTimeout(async () => {
            setIsBotTyping(false);

            const rejectionText = customerLanguage === 'hk'
              ? "請輸入有效已登記的電郵地址 (例如 name@example.com)，以便我們尋找您的帳戶。"
              : "Please enter a valid registered email address (e.g., name@example.com) so we can locate your account.";

            try {
              const botRes = await fetch(`/api/chats/${activeSession.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sender: 'bot',
                  text: rejectionText
                })
              });

              if (botRes.ok) {
                const updated = await botRes.json();
                setSession(updated);
              }
            } catch (e) {
              console.error(e);
            }
          }, errorDelay);
        } else {
          // Valid email address verified! Show typing for 5s-10s then transfer case
          const verifiedEmail = text.toLowerCase().trim();
          setFormEmail(verifiedEmail);
          if (typeof localStorage !== 'undefined') localStorage.setItem('payme_customer_email', verifiedEmail);
          const currentStoredName = typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_name') || '' : '';
          const newName = formName || currentStoredName || (activeSession.userName && !activeSession.userName.includes('Shopify') && !activeSession.userName.includes('Anonymous') && activeSession.userName !== 'Website Visitor' ? activeSession.userName : verifiedEmail);
          setFormName(newName);
          if (typeof localStorage !== 'undefined') localStorage.setItem('payme_customer_name', newName);
          setIsBotTyping(true);

          const transferDelay = Math.floor(Math.random() * 5000) + 5000;

          setTimeout(async () => {
            setIsBotTyping(false);

            // Update backend session user email and transfer case to human agent queue
            await fetch(`/api/chats/${activeSession.id}/topic`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: formCategory || activeSession.selectedTopic || 'General Support',
                userName: newName,
                userEmail: verifiedEmail,
                phone: typeof localStorage !== 'undefined' ? localStorage.getItem('payme_customer_phone') || undefined : undefined,
                status: 'pending' // Transfer case to pending human queue
              })
            });

            const transferNoticeText = customerLanguage === 'hk'
              ? "您的請求已收到。我們正在為您轉接至可用的支援人手專員。"
              : "Your request has been received. We are connecting you with an available support human specialist.";

            try {
              const botRes = await fetch(`/api/chats/${activeSession.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sender: 'bot',
                  text: transferNoticeText
                })
              });

              if (botRes.ok) {
                const updated = await botRes.json();
                setSession(updated);
              }
            } catch (e) {
              console.error(e);
            }
          }, transferDelay);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    }
  };

  // Trigger Typing Statuses
  const triggerTypingStatus = async (isTyping: boolean) => {
    if (!session || session.id === 'draft' || session.isLocked || session.isBlocked) return;
    if (!isTyping && customerTypingTimeoutRef.current) {
      clearTimeout(customerTypingTimeoutRef.current);
      customerTypingTimeoutRef.current = null;
    }
    if (isCurrentlyTypingRef.current === isTyping) return;
    isCurrentlyTypingRef.current = isTyping;
    try {
      await fetch(`/api/chats/${session.id}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerTyping: isTyping })
      });
    } catch (e) {
      // non-blocking
    }
  };

  // Handle Payment "I Have Paid" Submission
  const handleIHavePaid = async () => {
    if (!session || session.id === 'draft' || isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      // 1. Update payment status on the server
      const payRes = await fetch(`/api/chats/${session.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Paid',
          notes: 'Customer submitted payment confirmation via Case Center.'
        })
      });
      
      if (!payRes.ok) throw new Error('Payment confirmation failed');

      // 2. Post a chat message from the customer
      const msgRes = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: `I have completed the requested payment of ${session.paymentConfig?.currency || 'HKD'} ${(session.paymentConfig?.amount || 500).toLocaleString('en-US', { minimumFractionDigits: 2 })}. Please verify.`
        })
      });

      if (msgRes.ok) {
        const updated = await msgRes.json();
        setSession(updated);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting payment confirmation.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // File Upload base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let activeSession = session;
    if (!activeSession || activeSession.id === 'draft') {
      activeSession = await ensureSessionCreated();
      if (!activeSession) return;
    }

    if (activeSession.uploadsMuted) {
      alert('File uploads are currently muted by the administrator.');
      return;
    }

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const attachment: Attachment = {
          name: file.name,
          type: file.type,
          data: base64Data
        };

        const res = await fetch(`/api/chats/${activeSession.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'customer',
            text: `Attachment Shared: ${file.name}`,
            attachment
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload restricted');
        }

        const updated = await res.json();
        setSession(updated);
      } catch (err: any) {
        alert(err.message || 'Failed to send attachment.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // Setup dynamic agent info matching the session, fallback to AI bot or queue states
  const isCompletedCase = session?.isClosed || session?.status === 'resolved' || session?.timelineProgress === 6 || session?.caseStatusConfig?.subtitle === 'Completed' || session?.caseStatusConfig?.subtitle === '已完成';
  const isClosedCase = Boolean(session?.isClosed);
  const isResolvedCase = session?.status === 'resolved' && !isClosedCase;
  const isBotActive = !session || session.status === 'bot' || isClosedCase || !session.agentId;
  const isPendingActive = session?.status === 'pending';
  
  const assignedAgentId = session?.agentId;
  const matchedAgent = assignedAgentId ? agents.find(a => a.id === assignedAgentId) : null;
  
  let assignedAgent;
  if (isBotActive || isPendingActive) {
    assignedAgent = {
      id: 'ai-bot',
      name: 'Ai Bot',
      avatar: PAYME_BOT_AVATAR, // Custom HSBC + PayMe P Bot Avatar
      status: isPendingActive ? ('busy' as const) : ('online' as const),
      activeTime: '',
      department: customerLanguage === 'hk' ? 'PayMe AI 支援服務' : 'PayMe AI Assist',
      verified: false
    };
  } else {
    // Active or Resolved human agent
    const realAgent = matchedAgent || agents.find(a => a.id === 'carmen-lee') || agents[0];
    assignedAgent = {
      id: realAgent?.id || 'carmen-lee',
      name: realAgent?.name || 'Carmen Lee',
      avatar: realAgent?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      status: (realAgent?.status || 'online') as 'online' | 'offline' | 'idle' | 'busy' | 'away',
      activeTime: realAgent?.activeTime || 'Active now',
      department: realAgent?.department || 'Customer Support Specialist',
      verified: true
    };
  }

  if (!session || (session.status === 'bot' && botStep === -1)) {
    return (
      <div 
        className="h-full w-full bg-[#f4f5f7] flex items-start sm:items-center justify-center p-0 sm:py-6 overflow-y-auto"
        style={androidStyle}
      >
        {/* Clean, authentic mobile or full-size desktop portal container */}
        <div 
          className="w-full sm:w-[1170px] sm:max-w-[1170px] min-h-full sm:min-h-0 sm:max-h-[calc(100vh-3rem)] bg-[#f9fafc] text-slate-800 font-sans flex flex-col justify-start overflow-y-auto relative sm:rounded-[2.5rem] sm:shadow-[0_30px_70px_rgba(0,0,0,0.18)] antialiased scroll-smooth my-auto"
        >
          {/* Elegant red gradient header, with proportional compact padding to match the screenshot precisely */}
          <div 
            style={{ background: 'radial-gradient(circle at 80% 20%, #e30a1c 0%, #a80010 45%, #6a0006 80%, #3a0003 100%)' }}
            className="pt-5 pb-12 sm:pt-8 sm:pb-16 px-5 sm:px-12 text-center text-white relative overflow-hidden sm:rounded-t-[2.4rem] shadow-sm shrink-0 w-full sm:min-h-[460px] flex flex-col justify-between"
          >
            {/* Professional embedded keyframe animations for high-fidelity 3D/5D dynamic background */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes slowDrift {
                0% { transform: translate3d(0, 0, 0) scale(1); }
                50% { transform: translate3d(8px, -5px, 0) scale(1.03); }
                100% { transform: translate3d(0, 0, 0) scale(1); }
              }
              @keyframes pulseGlow {
                0%, 100% { opacity: 0.15; transform: scale(1); }
                50% { opacity: 0.35; transform: scale(1.08); }
              }
              @keyframes meshDrift {
                0% { transform: translate3d(0, 0, 0) rotate(0deg); }
                50% { transform: translate3d(15px, -8px, 0) rotate(0.5deg); }
                100% { transform: translate3d(0, 0, 0) rotate(0deg); }
              }
              @keyframes slowSweep {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(1.5deg) scale(1.02); }
                100% { transform: rotate(0deg) scale(1); }
              }
              
              /* 3D Wave layers animations */
              @keyframes waveFlow3D-1 {
                0% { transform: rotateX(55deg) rotateY(-10deg) rotateZ(0deg) translate3d(0, 0, -30px); }
                50% { transform: rotateX(45deg) rotateY(-6deg) rotateZ(3deg) translate3d(-30px, 15px, 10px); }
                100% { transform: rotateX(55deg) rotateY(-10deg) rotateZ(0deg) translate3d(0, 0, -30px); }
              }
              @keyframes waveFlow3D-2 {
                0% { transform: rotateX(42deg) rotateY(15deg) rotateZ(-8deg) translate3d(-40px, 0, 20px); }
                50% { transform: rotateX(50deg) rotateY(10deg) rotateZ(-5deg) translate3d(20px, -20px, 50px); }
                100% { transform: rotateX(42deg) rotateY(15deg) rotateZ(-8deg) translate3d(-40px, 0, 20px); }
              }
              @keyframes waveFlow3D-3 {
                0% { transform: rotateX(62deg) rotateY(0deg) rotateZ(6deg) translate3d(10px, -15px, 80px); }
                50% { transform: rotateX(56deg) rotateY(-5deg) rotateZ(10deg) translate3d(-15px, 10px, 120px); }
                100% { transform: rotateX(62deg) rotateY(0deg) rotateZ(6deg) translate3d(10px, -15px, 80px); }
              }
              
              /* SVG stroke-dash movement for floating energy flow */
              @keyframes dashMove {
                0% { stroke-dashoffset: 1200; }
                100% { stroke-dashoffset: 0; }
              }

              /* 100% Seamless Infinite Horizontal Fluid Water Scroll Animations */
              @keyframes waveFlowLeft {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
              }
              @keyframes waveFlowRight {
                0% { transform: translate3d(-50%, 0, 0); }
                100% { transform: translate3d(0, 0, 0); }
              }
              
              .animate-slow-drift {
                animation: slowDrift 20s ease-in-out infinite;
              }
              .animate-pulse-glow {
                animation: pulseGlow 9s ease-in-out infinite;
              }
              .animate-mesh-drift {
                animation: meshDrift 16s ease-in-out infinite;
              }
              .animate-slow-sweep {
                animation: slowSweep 24s ease-in-out infinite;
              }
              
              /* Liquid Water Wave Selectors */
              .animate-wave-left-slow {
                animation: waveFlowLeft 26s linear infinite;
              }
              .animate-wave-right-medium {
                animation: waveFlowRight 18s linear infinite;
              }
              .animate-wave-left-fast {
                animation: waveFlowLeft 13s linear infinite;
              }
              .animate-wave-right-fastest {
                animation: waveFlowRight 9s linear infinite;
              }
              
              /* 3D Wave selectors */
              .animate-wave-3d-1 {
                animation: waveFlow3D-1 16s ease-in-out infinite, dashMove 40s linear infinite;
                transform-style: preserve-3d;
              }
              .animate-wave-3d-2 {
                animation: waveFlow3D-2 22s ease-in-out infinite, dashMove 55s linear infinite;
                transform-style: preserve-3d;
              }
              .animate-wave-3d-3 {
                animation: waveFlow3D-3 12s ease-in-out infinite, dashMove 30s linear infinite;
                transform-style: preserve-3d;
              }
            ` }} />

            {/* HIGH-FIDELITY LIVE "BIG WATER" LIQUID WAVE SYSTEM (Seamless overlapping flowing waves) */}
            <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none overflow-hidden select-none z-0">
              
              {/* Layer 1: Back-most deep dark crimson wave (Slow, majestically large) */}
              <div className="absolute inset-x-0 bottom-0 h-[280px] overflow-hidden opacity-60">
                <div className="flex w-[200%] h-full animate-wave-left-slow">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 60 C 300 20, 300 100, 600 60 C 900 20, 900 100, 1200 60 L 1200 120 L 0 120 Z" fill="rgba(110, 0, 6, 0.5)" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 60 C 300 20, 300 100, 600 60 C 900 20, 900 100, 1200 60 L 1200 120 L 0 120 Z" fill="rgba(110, 0, 6, 0.5)" />
                  </svg>
                </div>
              </div>

              {/* Layer 2: Middle-back vibrant red wave (Medium speed, opposite direction) */}
              <div className="absolute inset-x-0 bottom-0 h-[230px] overflow-hidden opacity-75">
                <div className="flex w-[200%] h-full animate-wave-right-medium">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 70 C 300 110, 300 30, 600 70 C 900 110, 900 30, 1200 70 L 1200 120 L 0 120 Z" fill="rgba(168, 0, 16, 0.4)" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 70 C 300 110, 300 30, 600 70 C 900 110, 900 30, 1200 70 L 1200 120 L 0 120 Z" fill="rgba(168, 0, 16, 0.4)" />
                  </svg>
                </div>
              </div>

              {/* Layer 3: Middle-front lighter glowing red wave (Medium-fast, forward direction) */}
              <div className="absolute inset-x-0 bottom-0 h-[170px] overflow-hidden opacity-85">
                <div className="flex w-[200%] h-full animate-wave-left-fast">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 50 C 300 10, 300 90, 600 50 C 900 10, 900 90, 1200 50 L 1200 120 L 0 120 Z" fill="rgba(227, 10, 28, 0.3)" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 50 C 300 10, 300 90, 600 50 C 900 10, 900 90, 1200 50 L 1200 120 L 0 120 Z" fill="rgba(227, 10, 28, 0.3)" />
                  </svg>
                </div>
              </div>

              {/* Layer 4: Front-most translucent sparkling white crest wave (Fastest, opposite direction) */}
              <div className="absolute inset-x-0 bottom-0 h-[120px] overflow-hidden opacity-90">
                <div className="flex w-[200%] h-full animate-wave-right-fastest">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40 L 1200 120 L 0 120 Z" fill="rgba(255, 255, 255, 0.12)" />
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40 L 1200 120 L 0 120 Z" fill="rgba(255, 255, 255, 0.12)" />
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
              </div>

              {/* High-Fidelity 3D Glowing Wireframe Outline Overlays to preserve digital aesthetic */}
              <div 
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                className="absolute inset-0 opacity-40 mix-blend-screen"
              >
                <svg className="w-full h-full" viewBox="0 0 1170 740" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glow-grad-new-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                      <stop offset="30%" stopColor="rgba(255, 120, 140, 0.3)" />
                      <stop offset="50%" stopColor="rgba(255, 255, 255, 0.85)" />
                      <stop offset="70%" stopColor="rgba(255, 140, 160, 0.3)" />
                      <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                    <linearGradient id="glow-grad-new-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                      <stop offset="50%" stopColor="rgba(255, 255, 255, 0.6)" />
                      <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                  </defs>

                  <g className="animate-wave-3d-1" style={{ transformOrigin: 'center center' }}>
                    <path 
                      d="M -200 420 Q 200 240 600 420 T 1400 420 T 2200 420" 
                      stroke="url(#glow-grad-new-1)" 
                      strokeWidth="1.6" 
                      strokeDasharray="400 300"
                      fill="none"
                    />
                  </g>

                  <g className="animate-wave-3d-2" style={{ transformOrigin: 'center center' }}>
                    <path 
                      d="M -200 480 Q 300 290 800 480 T 1800 480 T 2800 480" 
                      stroke="url(#glow-grad-new-2)" 
                      strokeWidth="1.2" 
                      strokeDasharray="500 400"
                      fill="none"
                    />
                  </g>
                </svg>
              </div>

            </div>

            {/* Top Row with Back and Secure Badge (Clean, without capsule box as screenshotted) */}
            <div className="w-full flex justify-between items-center relative z-10 mb-2">
              <button 
                onClick={handleBackToHomeWithAnimation}
                className="flex items-center gap-1 text-white/95 hover:text-white font-normal text-sm transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5 text-white/90 text-[11px] sm:text-xs font-normal">
                <Lock className="w-3.5 h-3.5 text-white/90" strokeWidth={1.8} />
                <span>Secure & Confidential</span>
                <span className="w-2 h-2 bg-[#22c55e] rounded-full inline-block shadow-[0_0_6px_rgba(34,197,148,0.8)] animate-pulse" />
              </div>
            </div>

            {/* Logo & Headline with pristine typography matching the original screenshot precisely */}
            <div className="w-full relative z-10 flex flex-col items-center flex-1 justify-center sm:my-auto gap-4 sm:gap-8">
              {/* Large, high-fidelity brand logo as requested */}
              <div className="flex justify-center w-full px-4 overflow-hidden">
                <img 
                  src="https://assets.paymebusinessllc.online/london-site/header.png" 
                  className="w-[82%] max-w-[310px] sm:max-w-[480px] h-auto -my-9 sm:-my-14 object-contain transition-transform duration-500 hover:scale-[1.02]" 
                  alt="PayMe from HSBC"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex flex-col items-center gap-1 sm:gap-3">
                <div className="text-[12px] sm:text-[18px] font-light tracking-[0.08em] text-white/95 leading-none mt-1 sm:mt-0 uppercase">
                  Welcome to PayMe Support
                </div>
                <h1 className="text-[23px] sm:text-[42px] font-bold tracking-tight leading-tight mt-2.5 sm:mt-0 text-white">
                  How can we help you today?
                </h1>
                <p className="text-[11.5px] sm:text-[17px] text-white/85 leading-relaxed mt-2.5 sm:mt-0 max-w-[280px] sm:max-w-[620px] mx-auto font-light">
                  Our support team is here to assist you with<br className="sm:hidden" /> any issues or questions.
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Container with Overlapping Cards */}
          <div className="flex-1 px-4 sm:px-16 relative z-20 -mt-[28px] sm:-mt-[70px] pb-3 sm:pb-6 space-y-3 sm:space-y-5 sm:max-w-[780px] sm:mx-auto w-full">
            
            {loading && propSessionId ? (
              /* Loading Spinner inside a Card */
              <div className="bg-white border border-slate-100 p-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-[#bd162c] animate-spin" />
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Initializing Secure Gateway...
                </div>
              </div>
            ) : (
              <>
                {/* 1. Chat with a real person Floating Card */}
                <div 
                  onClick={() => setBotStep(0)}
                  className="bg-white border border-slate-200/70 p-4 sm:p-5 rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center gap-4 w-full"
                >
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0 border border-[#fee2e2]/80">
                    <Headphones className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-[#bd162c]" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-[15.5px] font-bold text-slate-900 leading-tight">
                      Chat with a real person
                    </h3>
                    <p className="text-slate-500 text-[11px] sm:text-[13px] leading-snug mt-1 font-normal">
                      We’ll connect you with the next available support specialist.
                    </p>
                  </div>
                </div>

                {/* 2. What can we help you with Section */}
                <div className="space-y-2.5 sm:space-y-3.5 pt-0.5">
                  <div>
                    <h2 className="text-[14.5px] sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
                      What can we help you with?
                    </h2>
                    <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed mt-0.5 font-normal">
                      Please select the issue you need help with.
                    </p>
                  </div>

                  {/* Help Categories Grid (2 Columns as screenshotted) */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {[
                      {
                        id: 'account',
                        title: 'Account Issues',
                        desc: 'Login, profile, verification',
                        icon: (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                            <User className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={1.8} />
                          </div>
                        )
                      },
                      {
                        id: 'payment',
                        title: 'Payment Issues',
                        desc: 'Payments, holds, refunds',
                        icon: (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                            <DollarSign className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={1.8} />
                          </div>
                        )
                      },
                      {
                        id: 'transfer',
                        title: 'Transfer Issues',
                        desc: 'Sending, receiving money',
                        icon: (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={1.8} />
                          </div>
                        )
                      },
                      {
                        id: 'transaction',
                        title: 'Transaction Issues',
                        desc: 'Failed, pending, disputes',
                        icon: (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={1.8} />
                          </div>
                        )
                      },
                      {
                        id: 'security',
                        title: 'Security Issues',
                        desc: 'Fraud, security, privacy',
                        icon: (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                            <Shield className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={1.8} />
                          </div>
                        )
                      },
                      {
                        id: 'verification',
                        title: 'Verification Issues',
                        desc: 'Identity, documents, KYC',
                        icon: (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={1.8} />
                          </div>
                        )
                      }
                    ].map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          handleSelectTopicAndStartChat(cat.title);
                        }}
                        className="bg-white border border-slate-200/60 p-2 sm:p-3 rounded-2xl flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all duration-200 min-w-0"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          {cat.icon}
                          <div className="min-w-0">
                            <div className="text-[12px] sm:text-[12.5px] font-bold text-slate-900 leading-snug whitespace-nowrap">
                              {cat.title}
                            </div>
                            <div className="text-[10px] sm:text-[10.5px] text-slate-500 font-normal leading-tight mt-0.5">
                              {cat.desc}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                      </div>
                    ))}
                  </div>

                  {/* Other Issues row */}
                  <div 
                    onClick={() => {
                      handleSelectTopicAndStartChat('Other Issues');
                    }}
                    className="bg-white border border-slate-200/60 p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2]/80 shrink-0">
                        <MoreHorizontal className="w-3.5 h-3.5 text-[#bd162c]" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[12px] sm:text-[12.5px] font-bold text-slate-900 leading-none">
                          Other Issues
                        </div>
                        <div className="text-[9.5px] sm:text-[10px] text-slate-500 font-normal mt-0.5">
                          Something else
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
                  </div>

                </div>

                {/* Bottom Security Info Widget */}
                <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200/70 shrink-0 shadow-2xs">
                    <Lock className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight">Your conversation is secure and encrypted</div>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-500 font-normal mt-0.5 leading-normal">We protect your privacy and data at all times.</p>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="text-center text-[10.5px] text-slate-400 pt-1 pb-3 sm:pb-4 font-semibold shrink-0">
              Powered by PayMe from HSBC
            </div>

          </div>
        </div>
        {renderTransitionScreen()}
      </div>
    );
  }

  return (
    <div 
      className="relative h-full w-full bg-[#F4F6FA] text-slate-800 font-sans flex flex-col overflow-hidden antialiased"
      style={androidStyle}
    >
      
      {/* 2. Top Navigation Bar (HSBC Brand Header) */}
      <header 
        style={{ background: 'radial-gradient(circle at 80% 20%, #e30a1c 0%, #a80010 45%, #6a0006 80%, #3a0003 100%)' }}
        className="relative z-0 pt-2 pb-6 px-4 sm:pt-6 sm:pb-20 sm:px-6 shrink-0 select-none overflow-hidden"
      >
        {/* Style block to guarantee wave animations inside active chat */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes waveFlowLeftChat {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes waveFlowRightChat {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          @keyframes msgPopRight {
            0% {
              opacity: 0;
              transform: translate3d(14px, 10px, 0) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
          @keyframes msgPopLeft {
            0% {
              opacity: 0;
              transform: translate3d(-14px, 10px, 0) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
          .animate-chat-wave-l-slow { animation: waveFlowLeftChat 26s linear infinite; }
          .animate-chat-wave-r-medium { animation: waveFlowRightChat 18s linear infinite; }
          .animate-chat-wave-l-fast { animation: waveFlowLeftChat 13s linear infinite; }
          .animate-chat-wave-r-fastest { animation: waveFlowRightChat 9s linear infinite; }
          .animate-msg-customer { animation: msgPopRight 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-msg-agent { animation: msgPopLeft 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ` }} />

        {/* HIGH-FIDELITY LIVE "BIG WATER" LIQUID WAVE SYSTEM (Seamless overlapping flowing waves) */}
        <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none overflow-hidden select-none z-0 opacity-45">
          
          {/* Layer 1: Back-most deep dark crimson wave (Slow, majestically large) */}
          <div className="absolute inset-x-0 bottom-[-12px] sm:bottom-[-16px] h-28 overflow-hidden opacity-60">
            <div className="flex w-[200%] h-full animate-chat-wave-l-slow">
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 60 C 300 20, 300 100, 600 60 C 900 20, 900 100, 1200 60 L 1200 120 L 0 120 Z" fill="rgba(110, 0, 6, 0.5)" />
              </svg>
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 60 C 300 20, 300 100, 600 60 C 900 20, 900 100, 1200 60 L 1200 120 L 0 120 Z" fill="rgba(110, 0, 6, 0.5)" />
              </svg>
            </div>
          </div>

          {/* Layer 2: Middle-back vibrant red wave (Medium speed, opposite direction) */}
          <div className="absolute inset-x-0 bottom-[-12px] sm:bottom-[-16px] h-24 overflow-hidden opacity-75">
            <div className="flex w-[200%] h-full animate-chat-wave-r-medium">
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 70 C 300 110, 300 30, 600 70 C 900 110, 900 30, 1200 70 L 1200 120 L 0 120 Z" fill="rgba(168, 0, 16, 0.4)" />
              </svg>
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 70 C 300 110, 300 30, 600 70 C 900 110, 900 30, 1200 70 L 1200 120 L 0 120 Z" fill="rgba(168, 0, 16, 0.4)" />
              </svg>
            </div>
          </div>

          {/* Layer 3: Middle-front lighter glowing red wave (Medium-fast, forward direction) */}
          <div className="absolute inset-x-0 bottom-[-12px] sm:bottom-[-16px] h-20 overflow-hidden opacity-85">
            <div className="flex w-[200%] h-full animate-chat-wave-l-fast">
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 50 C 300 10, 300 90, 600 50 C 900 10, 900 90, 1200 50 L 1200 120 L 0 120 Z" fill="rgba(227, 10, 28, 0.3)" />
              </svg>
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 50 C 300 10, 300 90, 600 50 C 900 10, 900 90, 1200 50 L 1200 120 L 0 120 Z" fill="rgba(227, 10, 28, 0.3)" />
              </svg>
            </div>
          </div>

          {/* Layer 4: Front-most translucent sparkling white crest wave (Fastest, opposite direction) */}
          <div className="absolute inset-x-0 bottom-[-12px] sm:bottom-[-16px] h-16 overflow-hidden opacity-90">
            <div className="flex w-[200%] h-full animate-chat-wave-r-fastest">
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40 L 1200 120 L 0 120 Z" fill="rgba(255, 255, 255, 0.12)" />
                <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none" />
              </svg>
              <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40 L 1200 120 L 0 120 Z" fill="rgba(255, 255, 255, 0.12)" />
                <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>

        </div>

        <div className="relative z-10 w-full max-w-[850px] mx-auto flex justify-between items-center pl-1.5 pr-4 sm:px-3">
          <div className="flex items-center">
            {/* Header Real Logo Container with decoupled height */}
            <div className="relative h-12 sm:h-16 w-36 sm:w-64 flex items-center">
              <img 
                src="https://assets.paymebusinessllc.online/london-site/header.png" 
                alt="PayMe from HSBC" 
                className="absolute left-[-16px] sm:left-[-24px] top-1/2 -translate-y-1/2 h-[90px] sm:h-[120px] w-auto max-w-none object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Connection Security Status & Hamburger menu */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-white/85 text-[9px] sm:text-[11px] font-medium whitespace-nowrap shrink-0">
              <Lock className="w-3 h-3 text-white/85 shrink-0" strokeWidth={1.8} />
              <span>Secure & Confidential</span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full ml-0.5 animate-pulse shrink-0" />
            </div>

            <button 
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="text-white hover:text-white/80 transition-colors p-1 cursor-pointer relative z-50"
              title={t('settingsTitle')}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Workspace Area */}
      <main className="relative z-10 -mt-5 sm:-mt-16 flex-1 min-h-0 w-full max-w-[850px] mx-auto flex flex-col overflow-hidden bg-white shadow-2xl rounded-t-[28px] sm:rounded-[36px] sm:border sm:border-slate-100/70 sm:mb-2">
        
        {/* LEFT COLUMN is hidden to match the simplified mockup centered view */}
        <div className="hidden">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="15" fill="#DB0011" />
                    <path d="M16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 12.5 7.8 9.5 10.5 7.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16C10 14 11.2 12.2 12.8 11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16C13 15 13.8 14.2 14.5 13.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-extrabold text-sm tracking-wide">PayMe from HSBC</span>
              </div>
              <h4 className="text-[11px] font-bold text-red-300 tracking-widest uppercase mt-4 mb-1">Live Chat Support</h4>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">We're here to help</h2>
              <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse mt-2" />
            </div>

            {/* Conversation Secure details box */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-3 text-xs leading-relaxed">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-4 h-4 text-white" />
                <span>Secure & Encrypted</span>
              </div>
              <p className="text-white/80 text-[11px]">
                Your conversation is secured end-to-end. All data is protected with enterprise-grade security protocols.
              </p>
            </div>

            {/* Chat Topic box */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-white/55 uppercase tracking-wider">Chat Topic</div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/60">Selected Category</div>
                  <div className="text-xs font-bold text-white truncate max-w-[160px]">
                    {session?.selectedTopic || formCategory || 'Payment Issue'}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { clearCustomerSession(); window.location.reload(); }}
                  className="px-2.5 py-1 bg-red-800 hover:bg-red-900 border border-red-700 rounded-lg text-[10px] font-bold text-white transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Agent Support Specialist Panel */}
            <div className="pt-2">
              <div className="text-[10px] font-bold text-white/55 uppercase tracking-wider mb-3">Agent Group</div>
              
              <div className="flex items-center gap-3">
                {/* Stacked avatars */}
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#9c001a] object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" referrerPolicy="no-referrer" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#9c001a] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" referrerPolicy="no-referrer" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#9c001a] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" referrerPolicy="no-referrer" />
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-800 ring-2 ring-[#9c001a] text-[10px] font-bold text-white">
                    +12
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-bold text-white">Support team is available</div>
                  <div className="text-[10px] text-red-200 mt-0.5">Average wait: <span className="font-bold text-emerald-300">Under 1 minute</span></div>
                </div>
              </div>

              <div className="text-[10.5px] text-white/70 mt-4 leading-relaxed">
                Real humans. Real support. <br />
                <span className="font-semibold text-white">7:00 AM – 11:00 PM (HKT)</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-white/10 text-center text-[10px] text-white/50">
            Powered by PayMe from HSBC
          </div>
        </div>

        {/* MIDDLE COLUMN: Customer Chat Screen */}
        <div className="flex-1 flex flex-col bg-[#F9FAF9] overflow-hidden relative">
          
          <style dangerouslySetInnerHTML={{ __html: `
            .liquid-glass-bar {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 10;
              background: rgba(255, 255, 255, 0.01) !important;
              backdrop-filter: blur(0.5px) saturate(220%) !important;
              -webkit-backdrop-filter: blur(0.5px) saturate(220%) !important;
              border-top: 1px solid rgba(255, 255, 255, 0.4) !important;
              box-shadow: 0 -10px 30px -10px rgba(0, 0, 0, 0.01), inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
              overflow: hidden;
            }
            .liquid-glass-composer {
              position: relative;
              overflow: hidden;
              background: rgba(255, 255, 255, 0.06) !important;
              backdrop-filter: blur(6px) saturate(170%) !important;
              -webkit-backdrop-filter: blur(6px) saturate(170%) !important;
              border: 1px solid rgba(255, 255, 255, 0.4) !important;
              box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 15px rgba(0, 0, 0, 0.005) !important;
              transition: all 0.3s ease !important;
            }
            .liquid-glass-composer:focus-within {
              background: rgba(255, 255, 255, 0.15) !important;
              border-color: rgba(255, 255, 255, 0.6) !important;
              box-shadow: inset 0 1px 1.5px rgba(255, 255, 255, 0.3), 0 6px 20px rgba(0, 0, 0, 0.015) !important;
            }
            .liquid-content-on-top {
              position: relative;
              z-index: 10;
            }
            .liquid-glass-header {
              position: relative;
              overflow: hidden;
              background: rgba(255, 255, 255, 0.01) !important;
              backdrop-filter: blur(0.5px) saturate(260%) !important;
              -webkit-backdrop-filter: blur(0.5px) saturate(260%) !important;
              border: 1.5px solid rgba(255, 255, 255, 0.95) !important;
              box-shadow: 
                inset 0 18px 24px -10px rgba(255, 255, 255, 0.95),
                inset 18px 0 24px -10px rgba(255, 255, 255, 0.85),
                inset -18px 0 24px -10px rgba(255, 255, 255, 0.85),
                inset 0 2px 4px 0 rgba(255, 255, 255, 0.85),
                0 12px 32px -4px rgba(0, 0, 0, 0.08) !important;
            }
            .liquid-glass-settings-menu {
              position: absolute;
              top: 58px;
              right: 16px;
              z-index: 50;
              width: 280px;
              border-radius: 20px;
              background: rgba(255, 255, 255, 0.45) !important;
              backdrop-filter: blur(24px) saturate(210%) !important;
              -webkit-backdrop-filter: blur(24px) saturate(210%) !important;
              border: 1px solid rgba(255, 255, 255, 0.65) !important;
              box-shadow: 
                inset 0 18px 24px -10px rgba(255, 255, 255, 0.95),
                inset 18px 0 24px -10px rgba(255, 255, 255, 0.95),
                inset -18px 0 24px -10px rgba(255, 255, 255, 0.95),
                0 20px 40px -15px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
              overflow: hidden;
            }
            .liquid-glass-alert {
              position: relative;
              overflow: hidden;
              background: rgba(255, 243, 205, 0.08) !important;
              backdrop-filter: blur(12px) saturate(190%) !important;
              -webkit-backdrop-filter: blur(12px) saturate(190%) !important;
              border-bottom: 1px solid rgba(251, 191, 36, 0.2) !important;
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 8px 24px rgba(0, 0, 0, 0.008) !important;
            }
            .liquid-glass-agent-info {
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.15) 60%, rgba(255, 255, 255, 0.35) 100%) !important;
              backdrop-filter: blur(3.5px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(3.5px) saturate(160%) !important;
              border: 1px solid rgba(255, 255, 255, 0.75) !important;
              border-top: 1.5px solid rgba(255, 255, 255, 0.9) !important;
              border-left: 1.5px solid rgba(255, 255, 255, 0.85) !important;
              box-shadow: 
                inset 0 1px 2px rgba(255, 255, 255, 0.8),
                inset 0 -1px 2px rgba(255, 255, 255, 0.4),
                0 8px 20px -6px rgba(0, 0, 0, 0.1),
                0 3px 8px -2px rgba(0, 0, 0, 0.05),
                0 0 0 1px rgba(255, 255, 255, 0.3) !important;
            }
            .liquid-glass-modal {
              background: rgba(255, 255, 255, 0.08) !important;
              backdrop-filter: blur(8px) saturate(200%) !important;
              -webkit-backdrop-filter: blur(8px) saturate(200%) !important;
              border: 1px solid rgba(255, 255, 255, 0.4) !important;
              box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
            }
            .liquid-glass-modal-header {
              background: rgba(128, 0, 16, 0.12) !important;
              backdrop-filter: blur(6px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(6px) saturate(160%) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
            }
            .liquid-glass-modal-subcard {
              background: rgba(255, 255, 255, 0.03) !important;
              backdrop-filter: blur(4px) saturate(140%) !important;
              -webkit-backdrop-filter: blur(4px) saturate(140%) !important;
              border: 1px solid rgba(255, 255, 255, 0.25) !important;
              box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.005) !important;
            }
            .liquid-glass-modal-alert {
              background: rgba(254, 242, 242, 0.04) !important;
              backdrop-filter: blur(4px) saturate(140%) !important;
              -webkit-backdrop-filter: blur(4px) saturate(140%) !important;
              border: 1px solid rgba(239, 68, 68, 0.15) !important;
              box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(239, 68, 68, 0.005) !important;
            }
            .liquid-glass-modal-footer {
              background: rgba(255, 255, 255, 0.05) !important;
              backdrop-filter: blur(6px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(6px) saturate(160%) !important;
              border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
            }
          `}} />
          
          {/* Persistent Sticky Top Header Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
            {/* A. Persistent Agent Header bar without box */}
            <div className="rounded-t-[28px] sm:rounded-t-[36px] px-4 py-2 sm:px-5 sm:py-3.5 flex justify-between items-center shrink-0 relative z-20 select-none pointer-events-auto bg-transparent border-0 shadow-none">
              <div className="relative z-10 w-full flex justify-between items-center">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img 
                      src={assignedAgent?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"} 
                      className={`w-11 h-11 rounded-full object-cover border border-white/40 shadow-xs ${(isBotActive || isPendingActive) ? 'brightness-75 contrast-110' : ''}`} 
                      referrerPolicy="no-referrer" 
                    />
                    {!isBotActive && !isPendingActive && !isResolvedCase && !isClosedCase && (
                      <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                        assignedAgent.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`} />
                    )}
                  </div>
                  <div className="text-left min-w-0 relative">
                    <div className="absolute -left-2 -right-3 -top-1.5 -bottom-1.5 rounded-2xl liquid-glass-agent-info pointer-events-none overflow-hidden">
                      <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-white/50 via-white/15 to-transparent rotate-45 pointer-events-none blur-[2px]" />
                      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-tl from-white/40 via-white/10 to-transparent rotate-12 pointer-events-none blur-[2px]" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-[14.5px] tracking-tight truncate">{assignedAgent?.name || 'Ai bot.'}</span>
                        {assignedAgent.verified && !isBotActive && !isPendingActive && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#DB0011] text-white text-[8px] font-black leading-none shrink-0" title={t('verifiedAgent')}>
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 mt-0.5 font-medium leading-none">
                        <span className="truncate">{assignedAgent?.department || t('department')}</span>
                        {!isResolvedCase && !isClosedCase && (session?.agentTyping || isBotTyping) ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-600 font-bold animate-pulse flex items-center gap-1 shrink-0">
                              typing...
                            </span>
                          </>
                        ) : (
                          !isBotActive && !isPendingActive && !isResolvedCase && !isClosedCase && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className={`font-bold flex items-center gap-1 whitespace-nowrap shrink-0 ${
                                assignedAgent.status === 'online' ? 'text-emerald-500' : 'text-slate-450 font-medium text-[10.5px]'
                              }`}>
                                {assignedAgent.status === 'online' ? t('online') : (assignedAgent.activeTime || t('offline'))}
                              </span>
                            </>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleBackToHomeWithAnimation}
                    className="px-2.5 py-1.5 border border-red-200/60 hover:bg-red-50/80 text-[#DB0011]/90 rounded-lg text-[11px] font-bold transition-all cursor-pointer bg-white/40 backdrop-blur-md"
                  >
                    {t('endChat')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* B. Conversation Log Box */}
          <div 
            ref={scrollContainerRef} 
            onScroll={handleChatScroll}
            className="absolute inset-0 overflow-y-auto px-2.5 py-2 sm:px-6 space-y-2.5 sm:space-y-3.5 z-0 scroll-smooth pt-[76px] pb-[104px]"
          >
            {/* CHAT MESSAGES & IN-CHAT FLOW (Active for all session states) */}
            {session && (
              <div className="space-y-4">
                
                {/* Connecting Notice */}
                <div className="flex justify-center my-1">
                  <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full text-[10px] text-slate-500 font-medium select-none">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    <span>{customerLanguage === 'hk' ? `安全支援對話 (案件 ID: ${session.caseId})` : `Secure support conversation (Case ID: ${session.caseId})`}</span>
                  </div>
                </div>

                {/* Date Separator "Today" */}
                <div className="flex justify-center my-2">
                  <span className="bg-[#F2F4F7] text-[#556575] text-[11px] font-bold px-4 py-1 rounded-full select-none shadow-xs">
                    {t('today')}
                  </span>
                </div>

                {/* Message items loop */}
                {session.messages.map((msg, index) => {
                  const isCustomer = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isSystem = msg.sender === 'system';

                  // Consecutive grouping: if previous message sender matches current sender
                  const isConsecutive = index > 0 && session.messages[index - 1].sender === msg.sender && session.messages[index - 1].sender !== 'system';

                  // Render CSAT Rating Card inside conversation stream
                  if (msg.text === 'CSAT_RATING_PROMPT' || msg.id?.startsWith('csat-prompt')) {
                    return (
                      <div key={msg.id} className="w-full my-2">
                        <CsatRatingCard
                          session={session}
                          msg={msg}
                          customerLanguage={customerLanguage}
                          assignedAgentName={assignedAgent?.name || 'Mei Ling Tse'}
                          onRate={handleRateSession}
                        />
                      </div>
                    );
                  }

                  if (isSystem) {
                    if (msg.text?.includes("switched language to")) return null;
                    return (
                      <div key={msg.id} className="flex justify-center my-2.5">
                        <span className="bg-slate-100 text-[10px] text-[#556575] px-3.5 py-1.5 rounded-full border border-slate-200">
                          {translateText(msg.text, msg.sender, msg)}
                        </span>
                      </div>
                    );
                  }

                  // High-fidelity timestamp formatting matching mockup
                  const formatMsgTime = (isoStr: string, textStr: string) => {
                    if (textStr) {
                      if (textStr.includes("failed payment")) return "10:32 AM";
                      if (textStr.includes("assist you today")) return "10:32 AM";
                      if (textStr.includes("T123456789")) return "10:33 AM";
                      if (textStr.includes("check this for you")) return "10:33 AM";
                      if (textStr.includes("on hold for verification")) return "10:35 AM";
                      if (textStr.includes("additional information so I can help")) return "10:36 AM";
                      if (textStr.includes("To proceed, we may need a bit")) return "10:37 AM";
                    }
                    if (!isoStr) return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(isoStr.trim())) {
                      return isoStr.trim();
                    }
                    try {
                      const date = new Date(isoStr);
                      if (isNaN(date.getTime())) {
                        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                      }
                      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    } catch (e) {
                      return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    }
                  };

                  const formattedTime = formatMsgTime(msg.timestamp, msg.text);

                  if (isCustomer) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end gap-1 w-full pl-12 animate-msg-customer">
                        <div className="bg-[#FFE5E8] text-[#222222] px-4 py-2 sm:py-2.5 rounded-[16px] rounded-tr-none max-w-[85%] sm:max-w-md min-w-[95px] shadow-xs relative pb-6 sm:pb-6.5 text-right">
                          <p className="text-[14px] leading-relaxed font-normal whitespace-pre-line text-[#222222] text-left break-words">{msg.text}</p>
                          
                          {/* Audio note */}
                          {msg.attachment && msg.attachment.type.startsWith('audio/') && (() => {
                            const duration = msg.attachment.duration && msg.attachment.duration > 0
                              ? msg.attachment.duration
                              : (audioDurations[msg.id] && isFinite(audioDurations[msg.id]) && audioDurations[msg.id] > 0
                                  ? Math.floor(audioDurations[msg.id])
                                  : 10);
                            const currentTime = audioCurrentTimes[msg.id] || 0;
                            return (
                              <div className="mt-3 rounded-2xl p-3 border border-red-100 bg-white/95 text-slate-800 flex items-center gap-3 w-64 shadow-xs select-none">
                                <button
                                  type="button"
                                  onClick={() => msg.attachment && handleAudioPlayPause(msg.id, msg.attachment.data)}
                                  className="w-8 h-8 rounded-full bg-[#DB0011] text-white flex items-center justify-center hover:bg-[#b8000e] active:scale-95 shrink-0 shadow-xs transition-all duration-150"
                                >
                                  {playingAudioId === msg.id ? (
                                    <Pause className="w-4 h-4 fill-current" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[11px] font-bold text-slate-800 tracking-wide">Voice Note</span>
                                    <span className="text-[9.5px] font-semibold text-slate-500 font-mono">
                                      {playingAudioId === msg.id 
                                        ? `${formatAudioTime(currentTime)}/${formatAudioTime(duration)}`
                                        : formatAudioTime(duration)}
                                    </span>
                                  </div>
                                  <div className="relative flex items-center h-4">
                                    <input
                                      type="range"
                                      min="0"
                                      max={duration}
                                      step="0.05"
                                      value={currentTime}
                                      onChange={(e) => {
                                        const time = parseFloat(e.target.value);
                                        setAudioCurrentTimes(prev => ({ ...prev, [msg.id]: time }));
                                        const audio = audioElementsRef.current[msg.id];
                                        if (audio) {
                                          audio.currentTime = time;
                                        }
                                      }}
                                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#DB0011] focus:outline-none transition-all"
                                      style={{
                                        background: `linear-gradient(to right, #DB0011 0%, #DB0011 ${(currentTime / duration) * 100}%, #E2E8F0 ${(currentTime / duration) * 100}%, #E2E8F0 100%)`
                                      }}
                                    />
                                  </div>
                                </div>
                                <a 
                                  href={msg.attachment.data} 
                                  download={msg.attachment.name} 
                                  className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 shrink-0 transition-colors" 
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            );
                          })()}

                          {/* Image attachment */}
                          {msg.attachment && !msg.attachment.type.startsWith('audio/') && isImageAttachment(msg.attachment.type) && (
                            <ImageAttachment attachment={msg.attachment} sessionId={session?.id} isAdmin={false} />
                          )}

                          {/* Doc attachment */}
                          {msg.attachment && !msg.attachment.type.startsWith('audio/') && !isImageAttachment(msg.attachment.type) && (
                            <div className="mt-3 border border-red-200 rounded-xl p-3 bg-white/50 text-slate-800 flex items-center justify-between gap-3 max-w-sm shadow-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                                  <FileText className="w-4 h-4 text-[#bd162c]" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="text-[11px] font-bold truncate">{msg.attachment.name}</div>
                                  <div className="text-[9px] uppercase mt-0.5 text-slate-500">
                                    {msg.attachment.type.split('/')[1] || 'file'}
                                  </div>
                                </div>
                              </div>
                              <a href={msg.attachment.data} download={msg.attachment.name} className="text-slate-400 hover:text-slate-600">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          <div className="absolute bottom-1 right-3 flex items-center gap-0.5 select-none whitespace-nowrap">
                            <span className={`text-[10px] font-semibold font-sans ${msg.status === 'seen' ? 'text-[#DB0011]' : 'text-slate-400'}`}>
                              {formattedTime}
                            </span>
                            {msg.status === 'seen' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#DB0011] shrink-0" strokeWidth={2.2} />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const isCaseAcceptedByAgent = Boolean(session?.agentId) || session?.status === 'active' || session?.status === 'resolved' || session?.messages.some(m => m.sender === 'agent');
                    const hideBotAvatar = isBot && isCaseAcceptedByAgent;
                    return (
                      <div key={msg.id} className="flex flex-col items-start gap-1 w-full pr-12 animate-msg-agent">
                        <div className="flex gap-2.5 items-start w-full">
                          {!hideBotAvatar && (
                            !isConsecutive ? (
                              <img 
                                src={isBot ? PAYME_BOT_AVATAR : (assignedAgent?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face")} 
                                className={`w-9 h-9 rounded-full object-cover border border-slate-100 shrink-0 shadow-xs animate-fadeIn ${isBot ? 'brightness-75 contrast-110' : ''}`} 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <div className="w-9 shrink-0" />
                            )
                          )}
                          <div className={`bg-white border border-gray-100 text-[#222222] px-4 py-2 sm:py-2.5 rounded-[16px] ${!hideBotAvatar && !isConsecutive ? 'rounded-tl-none' : ''} max-w-[85%] sm:max-w-md min-w-[95px] shadow-xs relative pb-6 sm:pb-6.5 text-left`}>
                            <p className="text-[14px] leading-relaxed font-normal whitespace-pre-line text-[#222222] break-words">
                              {(() => {
                                const rawText = translateText(msg.text, msg.sender, msg);
                                const isTransferNotice = msg.text?.includes("connecting you with an available support human specialist") ||
                                  msg.text?.includes("轉接至可用的支援人手專員") ||
                                  msg.text?.includes("support human specialist") ||
                                  msg.text?.includes("支援人手專員") ||
                                  msg.text?.includes("transferred to an HSBC support specialist");

                                if (isTransferNotice) {
                                  const cleanText = rawText.replace(/[\.\s]+$/, '');
                                  const isPending = session?.status === 'pending';

                                  return (
                                    <>
                                      <span>{cleanText}</span>
                                      {isPending ? (
                                        <span className="inline-flex items-baseline font-bold text-[#222222] ml-0.5 select-none tracking-tight">
                                          <span className="animate-pulse" style={{ animationDuration: '0.9s', animationDelay: '0ms' }}>.</span>
                                          <span className="animate-pulse" style={{ animationDuration: '0.9s', animationDelay: '300ms' }}>.</span>
                                          <span className="animate-pulse" style={{ animationDuration: '0.9s', animationDelay: '600ms' }}>.</span>
                                        </span>
                                      ) : (
                                        <span className="inline font-bold text-[#222222] ml-0.5">...</span>
                                      )}
                                    </>
                                  );
                                }

                                return rawText;
                              })()}
                            </p>

                            {/* Audio note */}
                            {msg.attachment && msg.attachment.type.startsWith('audio/') && (() => {
                              const duration = msg.attachment.duration && msg.attachment.duration > 0
                                ? msg.attachment.duration
                                : (audioDurations[msg.id] && isFinite(audioDurations[msg.id]) && audioDurations[msg.id] > 0
                                    ? Math.floor(audioDurations[msg.id])
                                    : 10);
                              const currentTime = audioCurrentTimes[msg.id] || 0;
                              return (
                                <div className="mt-3 rounded-2xl p-3 border border-slate-200 bg-slate-50 text-slate-800 flex items-center gap-3 w-64 shadow-xs select-none">
                                  <button
                                    type="button"
                                    onClick={() => msg.attachment && handleAudioPlayPause(msg.id, msg.attachment.data)}
                                    className="w-8 h-8 rounded-full bg-[#DB0011] text-white flex items-center justify-center hover:bg-[#b8000e] active:scale-95 shrink-0 shadow-xs transition-all duration-150"
                                  >
                                    {playingAudioId === msg.id ? (
                                      <Pause className="w-4 h-4 fill-current" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[11px] font-bold text-slate-800 tracking-wide">Voice Note</span>
                                      <span className="text-[9.5px] font-semibold text-slate-500 font-mono">
                                        {playingAudioId === msg.id 
                                          ? `${formatAudioTime(currentTime)}/${formatAudioTime(duration)}`
                                          : formatAudioTime(duration)}
                                      </span>
                                    </div>
                                    <div className="relative flex items-center h-4">
                                      <input
                                        type="range"
                                        min="0"
                                        max={duration}
                                        step="0.05"
                                        value={currentTime}
                                        onChange={(e) => {
                                          const time = parseFloat(e.target.value);
                                          setAudioCurrentTimes(prev => ({ ...prev, [msg.id]: time }));
                                          const audio = audioElementsRef.current[msg.id];
                                          if (audio) {
                                            audio.currentTime = time;
                                          }
                                        }}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#DB0011] focus:outline-none transition-all"
                                        style={{
                                          background: `linear-gradient(to right, #DB0011 0%, #DB0011 ${(currentTime / duration) * 100}%, #E2E8F0 ${(currentTime / duration) * 100}%, #E2E8F0 100%)`
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <a 
                                    href={msg.attachment.data} 
                                    download={msg.attachment.name} 
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 shrink-0 transition-colors" 
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              );
                            })()}

                            {/* Image attachment */}
                            {msg.attachment && !msg.attachment.type.startsWith('audio/') && isImageAttachment(msg.attachment.type) && (
                              <ImageAttachment attachment={msg.attachment} sessionId={session?.id} isAdmin={false} />
                            )}

                            {/* Doc attachment */}
                            {msg.attachment && !msg.attachment.type.startsWith("audio/") && !isImageAttachment(msg.attachment.type) && (
                              <div className="mt-3 border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-800 flex items-center justify-between gap-3 max-w-sm shadow-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                                    <FileText className="w-4.5 h-4.5 text-[#bd162c]" />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <div className="text-[11px] font-bold truncate">{msg.attachment.name}</div>
                                    <div className="text-[9px] uppercase mt-0.5 text-slate-500">
                                      {msg.attachment.type.split("/")[1] || "file"}
                                    </div>
                                  </div>
                                </div>
                                <a href={msg.attachment.data} download={msg.attachment.name} className="text-slate-400 hover:text-slate-600">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            <div className="absolute bottom-1 right-3 select-none whitespace-nowrap">
                              <span className="text-[10px] text-gray-400 font-semibold font-sans">
                                {formattedTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {/* Typing Indicator */}
                {!isResolvedCase && !isClosedCase && (session.agentTyping || isBotTyping) && (
                  <div className="flex flex-col items-start gap-1 w-full pr-12 my-2 animate-fadeIn">
                    <div className="flex gap-2.5 items-start">
                      <img 
                        src={session.status === 'bot' || isBotTyping ? PAYME_BOT_AVATAR : (assignedAgent?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face")} 
                        className={`w-9 h-9 rounded-full object-cover border border-slate-100 shrink-0 shadow-xs ${(session.status === 'bot' || isBotTyping) ? 'brightness-75 contrast-110' : ''}`} 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="bg-white border border-gray-100 text-[#222222] px-4 py-3 rounded-[16px] rounded-tl-none shadow-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Draggable Case Status Card */}
          {session && session.status === 'active' && (session.caseStatusConfig?.visible === true) && (
            <div className="absolute right-4 bottom-[90px] sm:bottom-[100px] z-30 pointer-events-none flex justify-end">
              <motion.div
                drag
                dragMomentum={false}
                onDragStart={() => { isDraggingCardRef.current = false; }}
                onDrag={(e, info) => {
                  if (Math.abs(info.offset.x) > 3 || Math.abs(info.offset.y) > 3) {
                    isDraggingCardRef.current = true;
                  }
                }}
                onDragEnd={(e, info) => {
                  const newPos = { x: floatingCardPos.x + info.offset.x, y: floatingCardPos.y + info.offset.y };
                  setFloatingCardPos(newPos);
                  try { localStorage.setItem('payme_floating_card_pos', JSON.stringify(newPos)); } catch {}
                  setTimeout(() => { isDraggingCardRef.current = false; }, 50);
                }}
                animate={{ x: floatingCardPos.x, y: floatingCardPos.y }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={() => {
                  if (!isDraggingCardRef.current) {
                    setIsCasePanelExpanded(true);
                  }
                }}
                className="pointer-events-auto bg-[#1a202c]/95 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl shadow-xl border border-white/10 flex items-center gap-2 cursor-move select-none transition-shadow hover:shadow-2xl group active:scale-[0.98] w-max max-w-[200px] sm:max-w-[220px]"
              >
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white leading-tight">
                    <span className="truncate">{session.caseStatusConfig?.title || 'Case Status'}</span>
                    <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${isCompletedCase ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5 leading-tight">
                    {session.caseStatusConfig?.subtitle || getActiveProgressStepName(session, customerLanguage)}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5 transition-transform group-hover:translate-y-0.5" />
              </motion.div>
            </div>
          )}

          {/* C. Input Control Panel (Text, Voice, Attachment) */}
          {session && (
            <div className="liquid-glass-bar px-3 pb-3 pt-1 select-none w-full">
              {session.isClosed ? (
                <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-600 shadow-xs space-y-2">
                  <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{customerLanguage === 'hk' ? '此對話已結束。' : 'This conversation has been closed.'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {customerLanguage === 'hk' ? (
                      <>點擊 <button onClick={() => { clearCustomerSession(); window.location.reload(); }} className="text-[#DB0011] underline font-bold cursor-pointer">這裡</button> 開啟新對話。</>
                    ) : (
                      <>Click <button onClick={() => { clearCustomerSession(); window.location.reload(); }} className="text-[#DB0011] underline font-bold cursor-pointer">here</button> to start a new support conversation.</>
                    )}
                  </div>
                </div>
              ) : session.isBlocked ? (
                <div className="bg-red-500/10 backdrop-blur-md p-3 rounded-2xl border border-red-500/30 text-center text-xs font-medium text-red-700 flex items-center justify-center gap-2.5 shadow-xs">
                  <Lock className="w-4 h-4 text-red-600 shrink-0" />
                  <span>This conversation has been temporarily restricted by an administrator. Message sending is currently disabled.</span>
                </div>
              ) : session.isLocked ? (
                <div className="bg-white/40 backdrop-blur-md p-2.5 rounded-2xl border border-white/35 text-center text-xs text-slate-500 flex items-center justify-center gap-2 shadow-xs">
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('sessionLocked')}</span>
                </div>
              ) : (
                <form onSubmit={handleSendText} className="relative w-full">
                  {/* Single rounded glass pill container with crystal-clear Liquid Glass optical refraction */}
                  <div className="relative w-full rounded-[28px] bg-white/[0.01] backdrop-blur-[0.5px] backdrop-saturate-[260%] border-[1.5px] border-white/95 shadow-[inset_0_2px_4px_0_rgba(255,255,255,0.85),inset_0_-1px_2px_0_rgba(255,255,255,0.4),0_12px_32px_-4px_rgba(0,0,0,0.08)] px-3.5 py-2.5 overflow-hidden text-slate-900 transition-all">
                    
                    {/* Ultra-clear Liquid Glass specular lens flares & rim highlights */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 pointer-events-none z-0" />
                    <div className="absolute -top-14 -left-10 w-[120%] h-14 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-[0.5px] transform -rotate-12 pointer-events-none z-0" />
                    <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none z-0" />

                    {/* Background dynamic wave canvas layer - stays behind everything without shifting layout */}
                    <canvas 
                      ref={canvasRef} 
                      className={`absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Content Layer over wave */}
                    <div className="relative z-10 flex flex-col justify-between space-y-1.5">
                      
                      {/* Top Row: Textarea OR Active / Ready Recording Status / Timer */}
                      <div className="flex items-center justify-between min-h-[26px]">
                        {isRecording || recordedBase64 ? (
                          <div className="flex items-center justify-between w-full animate-fadeIn transition-all duration-300">
                            {/* Left: Red recording dot + duration counter */}
                            <div className="flex items-center gap-2 transition-all duration-300">
                              <span className={`w-2.5 h-2.5 rounded-full bg-[#DB0011] ${isRecording ? 'animate-pulse shadow-[0_0_8px_rgba(219,0,17,0.8)]' : ''}`} />
                              <span className="text-xs font-sans font-semibold text-slate-900">
                                {Math.floor(recordDuration / 60).toString().padStart(2, '0')}:{(recordDuration % 60).toString().padStart(2, '0')}
                              </span>
                              {recordedBase64 && !isRecording && (
                                <span className="text-[11px] text-slate-600 font-sans font-medium animate-fadeIn">
                                  (Voice note ready)
                                </span>
                              )}
                            </div>

                            {/* Center: Tap recording pause/resume indicator */}
                            {isRecording && isTapRecording && (
                              <button
                                type="button"
                                onClick={isRecordPaused ? resumeRecording : pauseRecording}
                                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-200 transition-all cursor-pointer hover:scale-105 active:scale-95 animate-fadeIn"
                              >
                                {isRecordPaused ? (
                                  <>
                                    <Play className="w-3 h-3 fill-current text-amber-500" />
                                    <span>Resume</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-3 h-3 fill-current text-slate-700" />
                                    <span>Pause</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Right: X Cancel / Discard button */}
                            <button
                              type="button"
                              onClick={cancelRecording}
                              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all duration-200 cursor-pointer border border-slate-200 hover:scale-105 active:scale-95"
                              title="Cancel recording"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Text Input Field */
                          <textarea 
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={(e) => {
                              setInputMessage(e.target.value);
                              
                              if (customerTypingTimeoutRef.current) {
                                clearTimeout(customerTypingTimeoutRef.current);
                              }

                              const hasText = e.target.value.length > 0;
                              if (hasText) {
                                triggerTypingStatus(true);
                                customerTypingTimeoutRef.current = setTimeout(() => {
                                  triggerTypingStatus(false);
                                }, 3000);
                              } else {
                                triggerTypingStatus(false);
                              }
                            }}
                            onFocus={() => {
                              setTimeout(() => {
                                if (scrollContainerRef.current) {
                                  scrollContainerRef.current.scrollTo({
                                    top: scrollContainerRef.current.scrollHeight,
                                    behavior: 'smooth'
                                  });
                                }
                              }, 150);
                            }}
                            onBlur={() => {
                              if (customerTypingTimeoutRef.current) {
                                clearTimeout(customerTypingTimeoutRef.current);
                                customerTypingTimeoutRef.current = null;
                              }
                              triggerTypingStatus(false);
                            }}
                            placeholder={isScrollingChat ? '' : t('composerPlaceholder')}
                            rows={1}
                            className={`w-full bg-transparent border-0 p-0 text-[16px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 leading-snug resize-none overflow-y-auto max-h-20 animate-fadeIn transition-all duration-300 relative z-10 ${isScrollingChat ? 'placeholder-transparent' : 'placeholder-slate-400'}`}
                            style={{ minHeight: '22px' }}
                          />
                        )}
                      </div>

                      {/* Bottom Control Tools Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 relative z-10">
                        {/* Left action icons */}
                        <div className="flex items-center gap-1.5">
                          {/* Plus circle OR Play button when voice note is ready */}
                          {recordedBase64 && !isRecording ? (
                            <button
                              type="button"
                              onClick={togglePreviewPlay}
                              className="w-7 h-7 rounded-full bg-[#DB0011] hover:bg-[#b8000e] text-white flex items-center justify-center shrink-0 border border-red-400/40 transition-all duration-300 animate-fadeIn cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                              title={isPreviewPlaying ? "Pause preview" : "Play recorded voice note"}
                            >
                              {isPreviewPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={session.uploadsMuted}
                              onClick={() => fileInputRef.current?.click()}
                              className="w-7 h-7 rounded-full bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 transition-all duration-200 disabled:opacity-40 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                              title={session.uploadsMuted ? t('uploadsDisabled') : t('shareFile')}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Voice Icon 1 (Mic): Hold down to record, release to stop & send */}
                          <button
                            type="button"
                            disabled={session.voiceNotesAllowed === false}
                            onMouseDown={handleMicMouseDown}
                            onMouseUp={handleMicMouseUp}
                            onMouseLeave={handleMicMouseUp}
                            onTouchStart={handleMicMouseDown}
                            onTouchEnd={handleMicMouseUp}
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40 cursor-pointer hover:scale-105 active:scale-95 ${
                              isHoldRecording
                                ? 'bg-[#DB0011] text-white ring-2 ring-red-400 animate-pulse'
                                : 'bg-slate-900 text-white hover:bg-black shadow-xs'
                            }`}
                            title="Hold to speak, release to send"
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </button>

                          {/* Voice Icon 2 (Soundwaves): Tap to record with pause/play */}
                          <button
                            type="button"
                            disabled={session.voiceNotesAllowed === false}
                            onClick={handleSoundwaveTap}
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40 cursor-pointer hover:scale-105 active:scale-95 ${
                              isTapRecording
                                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                                : 'bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 border border-slate-200/80 shadow-xs'
                            }`}
                            title="Tap to record voice note"
                          >
                            <div className="flex items-center gap-0.5 justify-center h-3 w-3">
                              <span className="w-0.5 h-1.5 bg-current rounded-full transition-all duration-300" />
                              <span className="w-0.5 h-2.5 bg-current rounded-full transition-all duration-300" />
                              <span className="w-0.5 h-3 bg-current rounded-full transition-all duration-300" />
                              <span className="w-0.5 h-2 bg-current rounded-full transition-all duration-300" />
                              <span className="w-0.5 h-1 bg-current rounded-full transition-all duration-300" />
                            </div>
                          </button>
                        </div>

                        {/* Center Branding - Powered by PayMe from HSBC */}
                        <div className="flex items-center gap-1 select-none opacity-80 hover:opacity-100 transition-opacity">
                          <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-sans font-semibold text-slate-500 tracking-tight whitespace-nowrap">
                            {t('poweredByPayMe')}
                          </span>
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg" 
                            alt="HSBC Logo" 
                            className="h-2.5 w-auto object-contain shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Right Round Send circle button */}
                        <button
                          type="submit"
                          disabled={!isRecording && !recordedBase64 && !inputMessage.trim()}
                          className="w-7 h-7 rounded-full bg-[#DB0011] hover:bg-[#b8000e] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 shrink-0 border border-red-500/20 shadow-xs cursor-pointer"
                          title="Send"
                        >
                          <Send className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*,application/pdf,application/msword,text/*"
                  />
                  
                  {isUploading && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold animate-pulse mt-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Sending secure attachment...</span>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Case Status Overlay Modal (Popup) */}
      <AnimatePresence>
        {isCasePanelExpanded && session && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="liquid-glass-modal rounded-[28px] max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col text-slate-900"
            >
              {/* Modal Header */}
              <div className="p-5 flex justify-between items-center liquid-glass-modal-header text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#DB0011]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-[15px] font-black tracking-tight leading-none text-white">Case Verification</h3>
                    <p className="text-[10px] text-white/70 font-mono mt-1">ID: {session.caseId}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCasePanelExpanded(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-left">
                
                {/* Status indicator block */}
                <div className="p-3.5 liquid-glass-modal-alert rounded-[20px] flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCompletedCase ? 'bg-emerald-500' : 'bg-red-600 animate-ping'}`} />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('currentStatus')}</div>
                    <div className={`text-sm font-black mt-0.5 ${isCompletedCase ? 'text-emerald-700' : 'text-[#DB0011]'}`}>
                      {getActiveProgressStepName(session, customerLanguage)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-xs">
                  {/* Metadata & Reference Info */}
                  <div className="space-y-4">
                    <div className="p-3.5 liquid-glass-modal-subcard rounded-2xl text-slate-800">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('caseMetadata')}</h5>
                      <div className="space-y-1.5 text-slate-700 leading-normal">
                        <p>{customerLanguage === 'hk' ? '個案編號' : 'ID'}: <span className="font-mono text-slate-900 font-semibold">{session.caseId}</span></p>
                        <p>{customerLanguage === 'hk' ? '經辦專員' : 'Agent'}: <span className="text-slate-900 font-semibold">{assignedAgent ? (customerLanguage === 'hk' ? (assignedAgent.name === 'Carmen Lee' ? '李嘉敏' : assignedAgent.name) : assignedAgent.name) : (customerLanguage === 'hk' ? '李嘉敏' : 'Carmen Lee')}</span></p>
                        <p>{customerLanguage === 'hk' ? '部門' : 'Department'}: <span className="text-slate-900 font-semibold">
                          {assignedAgent ? (
                            customerLanguage === 'hk' ? (
                              assignedAgent.department === 'Customer Operations' ? '客戶運營部' :
                              assignedAgent.department === 'Merchant Services' ? '商戶服務部' :
                              assignedAgent.department === 'Risk & Compliance' ? '風險及合規部' :
                              assignedAgent.department === 'Technical Support' ? '技術支援部' :
                              assignedAgent.department === 'VIP Relations' ? '貴賓客戶關係部' :
                              assignedAgent.department
                            ) : assignedAgent.department
                          ) : (customerLanguage === 'hk' ? '客戶運營部' : 'Customer Operations')}
                        </span></p>
                      </div>
                    </div>
                    
                    <div className="p-3.5 liquid-glass-modal-subcard rounded-2xl text-slate-800">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('referenceInfo')}</h5>
                      <div className="space-y-1.5 text-slate-700 leading-normal">
                        <p>{customerLanguage === 'hk' ? '商戶名稱' : 'Merchant'}: <span className="text-slate-900 font-semibold">{session.userName}</span></p>
                        <p>{customerLanguage === 'hk' ? '電子郵件' : 'Email'}: <span className="text-slate-900 font-semibold">{session.userEmail}</span></p>
                      </div>
                    </div>

                    {/* CASE PROGRESS */}
                    <div className="p-3.5 liquid-glass-modal-subcard rounded-2xl text-slate-800">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {customerLanguage === 'hk' ? '個案進度' : 'CASE PROGRESS'}
                      </h5>
                      <div className="relative pl-3 space-y-4 my-1">
                        {/* Single vertical line connecting steps */}
                        <div className="absolute top-3 bottom-3 left-[19px] w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-slate-200" />

                        {(session.caseStatusConfig?.progressSteps || [
                          { id: 1, name: 'Received', status: 'Reviewing', visible: true },
                          { id: 2, name: 'Under Review', status: 'Pending', visible: true },
                          { id: 3, name: 'Refund Verification', status: 'Pending', visible: true },
                          { id: 4, name: 'Completed', status: 'Pending', visible: true }
                        ]).filter(step => step.visible !== false).map((step, idx) => {
                          const isSuccess = step.status === 'Success' || step.status === '成功' || step.status === '已完成';
                          const isReviewing = step.status === 'Reviewing' || step.status === '審查中' || step.status === '驗證中';
                          
                          return (
                            <div key={step.id || idx} className="relative flex items-start gap-3.5 z-10">
                              {/* Step circle */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs transition-colors ${
                                isSuccess ? 'bg-emerald-600' : isReviewing ? 'bg-amber-500' : 'bg-slate-400'
                              }`}>
                                {idx + 1}
                              </div>
                              {/* Step details */}
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-900 leading-tight">
                                  {step.name}
                                </span>
                                <span className={`text-[11px] font-semibold mt-0.5 ${
                                  isSuccess ? 'text-emerald-600' : isReviewing ? 'text-amber-600' : 'text-slate-400'
                                }`}>
                                  {step.status}
                                </span>
                                {step.timestamp && (
                                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {step.timestamp}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Required Actions & Interactive Payment */}
                  <div className="space-y-4">
                    <div className="p-3.5 liquid-glass-modal-subcard rounded-2xl text-slate-800">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{session.caseStatusConfig?.requiredActionsTitle || t('requiredActions')}</h5>
                      {session.caseStatusConfig?.requiredActionsHeading && (
                        <div className="font-bold text-xs text-slate-900 mb-1.5">
                          {session.caseStatusConfig.requiredActionsHeading}
                        </div>
                      )}
                      {session.caseStatusConfig?.requiredActionsContent && (
                        <div className="p-2.5 rounded-xl bg-white/50 border border-white/60 text-[11px] text-slate-800 font-medium leading-relaxed mb-2 shadow-xs whitespace-pre-wrap">
                          {session.caseStatusConfig.requiredActionsContent}
                        </div>
                      )}
                      {session.instructions.length === 0 && !session.caseStatusConfig?.requiredActionsContent ? (
                        <div className="text-[11px] text-slate-400 italic">{t('noActionsRequested')}</div>
                      ) : (
                        <div className="space-y-2">
                          {session.instructions.map((inst) => (
                            <div key={inst.id} className="p-2.5 rounded-xl bg-white/30 border border-white/45 flex items-start gap-2.5 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                              <div>
                                <div className="text-[11px] font-bold text-slate-900">{translateInstructionTitle(inst.title)}</div>
                                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{translateInstructionDesc(inst.description)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Payment Config */}
                    {session.paymentConfig?.enabled && (
                      <div className="p-4 rounded-2xl liquid-glass-modal-alert space-y-3 shadow-xs text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                          <h5 className="text-[10px] font-black text-[#bd162c] uppercase tracking-wider">Payment Required</h5>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Amount Due</span>
                          <span className="text-[15px] font-black text-red-600 font-mono">
                            {session.paymentConfig.currency} {session.paymentConfig.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleIHavePaid();
                            setIsCasePanelExpanded(false);
                          }}
                          disabled={isSubmittingPayment}
                          className="w-full py-2.5 bg-[#DB0011] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          {isSubmittingPayment ? 'Processing...' : 'Verify Deposit Clearance'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 text-right liquid-glass-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCasePanelExpanded(false)}
                  className="px-5 py-2.5 bg-slate-800/15 hover:bg-slate-800/25 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer backdrop-blur-md border border-white/20"
                >
                  Dismiss
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Outer Settings Dropdown Portal-like fixed overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] pointer-events-none">
            <div className="w-full max-w-[850px] mx-auto h-full relative">
              {/* Liquid Glass Settings Dropdown */}
              <motion.div 
                ref={settingsRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-[58px] sm:top-[92px] right-3 sm:right-6 w-[210px] p-3 select-none pointer-events-auto z-50 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.42)',
                  backdropFilter: 'blur(24px) saturate(220%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(220%)',
                  border: '1px solid rgba(255, 255, 255, 0.65)',
                  boxShadow: 'inset 0 16px 24px -8px rgba(255, 255, 255, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 20px 45px -10px rgba(0, 0, 0, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.35)'
                }}
              >
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-900 tracking-tight">{t('settingsTitle')}</h4>
                      <p className="text-[8.5px] text-slate-500 font-medium leading-none mt-0.5">{t('settingsSubtitle')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 hover:bg-slate-200/40 rounded-full text-slate-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                      {t('languageLabel')}
                    </label>
                    <div className="grid grid-cols-1 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerVibrate([25, 40, 25]);
                          playProfessionalSound('click');
                          setCustomerLanguage('en');
                          localStorage.setItem('payme_customer_language', 'en');
                          updateServerLanguage('en');
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                          customerLanguage === 'en'
                            ? 'bg-[#DB0011] border-[#DB0011] text-white shadow-md'
                            : 'bg-white/30 border-white/40 text-slate-800 hover:bg-white/60 hover:border-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Globe className={`w-3 h-3 ${customerLanguage === 'en' ? 'text-white' : 'text-slate-500'}`} />
                          <span>{t('english')}</span>
                        </div>
                        {customerLanguage === 'en' && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerVibrate([25, 40, 25]);
                          playProfessionalSound('click');
                          setCustomerLanguage('hk');
                          localStorage.setItem('payme_customer_language', 'hk');
                          updateServerLanguage('hk');
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                          customerLanguage === 'hk'
                            ? 'bg-[#DB0011] border-[#DB0011] text-white shadow-md'
                            : 'bg-white/30 border-white/40 text-slate-800 hover:bg-white/60 hover:border-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Globe className={`w-3 h-3 ${customerLanguage === 'hk' ? 'text-white' : 'text-slate-500'}`} />
                          <span>{t('hk')}</span>
                        </div>
                        {customerLanguage === 'hk' && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/40 pt-1.5 text-[8.5px] text-slate-500 flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{customerLanguage === 'hk' ? '安全連線' : 'Secure'}</span>
                    </span>
                    <span className="font-mono text-slate-400">v1.4</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {renderTransitionScreen()}
    </div>
  );
}
