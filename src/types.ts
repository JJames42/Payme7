export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data URL
  duration?: number; // for voice recordings
}

export interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system' | 'bot';
  text: string;
  timestamp: string;
  attachment?: Attachment;
  agentName?: string;
  status?: 'sent' | 'delivered' | 'seen' | 'failed';
  isPinned?: boolean;
  translationEn?: string;
  translationHk?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number; // HKD
  type: 'payment_received' | 'refund_sent' | 'disputed' | 'chargeback' | 'settlement';
  status: 'completed' | 'pending_dispute' | 'refunded' | 'held' | 'authorized';
  notes: string;
}

export interface CaseInstruction {
  id: string;
  title: string;
  category: 'Identity Verification' | 'Refund Required' | 'Bank Review' | 'Document Required' | 'Additional Information';
  status: 'pending' | 'completed';
  description: string;
}

export interface CasePaymentConfig {
  enabled: boolean;
  amount: number;
  currency: string;
  status: 'Awaiting Sender' | 'Awaiting Transfer' | 'Pending Confirmation' | 'Funds Pending' | 'Payment Pending' | 'Transfer Received' | 'Under Review' | 'Verification Complete';
  reference: string;
  deadline: string;
  notes: string;
}

export interface CollectedInfo {
  name?: string;
  email?: string;
  phone?: string;
  transactionId?: string;
  referenceNumber?: string;
  referenceId?: string;
  description?: string;
  fileAttached?: boolean;
  voiceAttached?: boolean;
}

export interface VisitorInfo {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  phone?: string;
  timezone?: string;
  isp?: string;
  browser?: string;
  os?: string;
  deviceType?: 'Mobile' | 'Tablet' | 'Desktop' | string;
  platform?: string;
  language?: string;
  screenResolution?: string;
  localTime?: string;
  firstVisit?: string;
  lastVisit?: string;
  totalVisits?: number | string;
  currentPage?: string;
  referrer?: string;

  // Network Intelligence
  vpnDetected?: boolean | string;
  proxyDetected?: boolean | string;
  torExitNode?: boolean | string;
  hostingProvider?: boolean | string;
  asn?: string;
  riskScore?: string | number;
}

export interface CaseProgressStep {
  id: number;
  name: string;
  status: 'Success' | 'Reviewing' | 'Pending' | string;
  timestamp?: string;
  date?: string;
  visible?: boolean;
}

export interface CaseStatusConfig {
  visible?: boolean;
  title?: string;
  subtitle?: string;
  requiredActionsTitle?: string;
  requiredActionsHeading?: string;
  requiredActionsContent?: string;
  progressSteps?: CaseProgressStep[];
}

export interface ChatSession {
  id: string;
  caseId: string; // PM-HK-20260718-000001
  userName: string;
  userEmail?: string;
  phone?: string;
  status: 'bot' | 'pending' | 'active' | 'resolved';
  language: 'en' | 'hk';
  createdAt: string;
  agentId?: string;
  attachmentsAllowed: boolean;
  voiceNotesAllowed: boolean;
  messages: Message[];
  transactions: Transaction[];
  selectedTopic?: string;
  caseStatusConfig?: CaseStatusConfig;
  
  // Advanced fields
  collectedInfo?: CollectedInfo;
  aiState?: 'welcome' | 'collect_name' | 'collect_email' | 'collect_topic' | 'collect_details' | 'collect_finished' | 'transferred';
  timelineProgress: number; // 1 to 6 (Received, Under Review, On Hold, Refund Verification, Pending Approval, Completed)
  paymentConfig?: CasePaymentConfig;
  instructions: CaseInstruction[];
  actionsRequiredEnabled?: boolean;
  isLocked?: boolean;
  uploadsMuted?: boolean;
  agentTyping?: boolean;
  customerTyping?: boolean;
  internalNotes?: string;
  privateNotes?: string;
  rating?: number; // 1 to 5 customer satisfaction rating
  ratingComment?: string;
  topicSelectedAt?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
  isClosed?: boolean;
  closedAt?: string;
  resolvedAt?: string;
  lastCustomerActivityAt?: number | string;

  // Real-time Customer Presence & Visitor Intelligence
  lastSeenAt?: string;
  customerOnline?: boolean;
  connectionStatus?: 'Connected' | 'Disconnected' | 'Reconnecting' | string;
  visitorInfo?: VisitorInfo;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  region: string;
  activeTime: string;
  description: string;
  status: 'online' | 'offline' | 'idle' | 'busy' | 'away';
  avatar: string;
  department: string;
  currentChatCount: number;
  title?: string;
  rating?: number;
}

// --- Enterprise AI Workspace Types ---
export interface MemoryHistoryEvent {
  id: string;
  timestamp: string;
  adminName: string;
  memoryId: string;
  memoryTitle: string;
  version: string;
  action: 'Created' | 'Edited' | 'Renamed' | 'Archived' | 'Restored' | 'Deleted' | 'Version updated' | 'Rolled back' | string;
  previousContent?: string;
  currentContent?: string;
  previousTitle?: string;
  currentTitle?: string;
  details?: string;
}

export interface MemoryVersionSnapshot {
  version: string;
  timestamp: string;
  adminName: string;
  title: string;
  category: string;
  content: string;
  changeSummary?: string;
}

export interface AIWorkspaceMemory {
  id: string;
  title?: string;
  category: string;
  content: string;
  createdAt: string;
  lastUpdated?: string;
  version?: string; // e.g. "v1.0"
  createdBy?: string; // e.g. "Administrator"
  isArchived?: boolean;
  applicableWorkflowStages?: string[];
  priority?: 'High' | 'Medium' | 'Low' | string;
  structuredKnowledge?: {
    verificationSteps?: string[];
    requiredActions?: string[];
    companyPolicies?: string[];
    paymentWorkflow?: string[];
    merchantProcedures?: string[];
    customerInstructions?: string[];
  };
  history?: MemoryHistoryEvent[];
  versions?: MemoryVersionSnapshot[];
}

export interface AIWorkspaceChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  toolsUsed?: string[];
  sourcesUsed?: string[];
  attachments?: { name: string; type?: string }[];
  structuredKnowledge?: {
    verificationSteps?: string[];
    requiredActions?: string[];
    companyPolicies?: string[];
    paymentWorkflow?: string[];
    merchantProcedures?: string[];
    customerInstructions?: string[];
  };
  suggestedMemory?: {
    title?: string;
    category: string;
    content: string;
    version?: string;
    createdBy?: string;
    applicableWorkflowStages?: string[];
    priority?: string;
  };
  autoSavedMemoryId?: string;
}

export interface AICopilotReplySuggestion {
  text: string;
  reasoning?: string;
  confidence?: 'High Confidence' | 'Medium Confidence' | string;
  supportingProcedureUsed?: string;
  workflowStageUsed?: string;
  transactionDataUsed?: string;
  memorySyncDebug?: string;
  memorySyncReport?: {
    status: string;
    memorySource: string;
    activeMemoriesLoaded: number;
    archivedMemoriesIgnored: number;
    newestMemoryVersion: string;
    latestMemoryUpdate: string;
    promptBuiltUsing: string;
    cacheUsed: string;
    synchronizationResult: string;
  };
}



