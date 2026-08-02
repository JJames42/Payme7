import path from 'path';
import fs from 'fs';

export interface AIWorkspaceMemory {
  id: string;
  title?: string;
  category: string;
  content: string;
  createdAt: string;
  lastUpdated?: string;
  version?: string;
  createdBy?: string;
  isArchived?: boolean;
  applicableWorkflowStages?: string[];
  priority?: string;
  history?: any[];
  versions?: any[];
  structuredKnowledge?: {
    verificationSteps?: string[];
    requiredActions?: string[];
    companyPolicies?: string[];
    paymentWorkflow?: string[];
    merchantProcedures?: string[];
    customerInstructions?: string[];
  };
}

export interface AIWorkspaceStore {
  memories: AIWorkspaceMemory[];
  chatHistory: Array<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
    structuredKnowledge?: any;
    suggestedMemory?: any;
    autoSavedMemoryId?: string;
  }>;
  memoryHistoryLogs?: any[];
}

export interface AdminSessionRecord {
  token: string;
  createdAt: number;
  lastActiveAt: number;
  ip: string;
}

export interface AdminSettingsRecord {
  hkAgents?: any[];
  lastAdminHeartbeatTime?: number;
  activeAdminSupervisorId?: string | null;
  activeAdminChatId?: string | null;
  agentLastActiveMap?: Record<string, number>;
  customSettings?: Record<string, any>;
}

export interface LiveChatSettingsRecord {
  chatSessions?: any[];
  deletedChatIds?: string[];
  globalSettings?: Record<string, any>;
}

export interface ExportRecord {
  id: string;
  transactionId?: string;
  referenceNumber?: string;
  exportedAt: string;
  exportType: string;
  snapshotId?: string;
  version?: string;
  format?: string;
  exportedBy?: string;
  details?: Record<string, any>;
}

export interface EmailRecord {
  id: string;
  transactionId?: string;
  referenceNumber?: string;
  type: 'CREDIT_ALERT' | 'DEBIT_ALERT' | 'NOTIFICATION' | string;
  subject: string;
  senderEmail: string;
  recipientEmail: string;
  messageId: string;
  deliveryStatus: string;
  sentAt: string;
  dateSentStr?: string;
  timeSentStr?: string;
  amount?: string | number;
  plainTextBody?: string;
  htmlBody?: string;
  rawMimeEmail?: string;
  attachments?: any[];
  images?: any[];
  buttons?: any[];
  links?: any[];
  paymentInstructions?: string[];
  additionalPaymentInstructions?: string[];
  complianceNotices?: string[];
  paymentUnderReviewInstructions?: string[];
  verificationRequirements?: string[];
  footer?: string;
  contactSupportInfo?: string;
}

export interface SendHistoryRecord {
  id: string;
  emailRecordId?: string;
  transactionId?: string;
  recipient: string;
  subject: string;
  sentAt: string;
  status: 'DELIVERED' | 'SENT' | 'PENDING' | 'FAILED' | string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP' | string;
  attempts?: number;
  error?: string;
}

export interface TransactionIndexRecord {
  key: string;
  transactionId: string;
  referenceNumber: string;
  updatedAt: string;
}

export interface WorkflowTimelineEvent {
  id: string;
  transactionId?: string;
  chatId?: string;
  referenceNumber?: string;
  stage: string;
  stageIndex: number;
  title: string;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ExportSnapshotRecord {
  snapshotId: string;
  transactionId?: string;
  referenceNumber?: string;
  exportedAt: string;
  version: string;
  format: string;
  dataHash?: string;
  contentSummary?: string;
}

export interface EmailEventRecord {
  id: string;
  transactionId?: string;
  referenceNumber?: string;
  type: string;
  sentAt: string;
  recipient: string;
  status: string;
  details?: string;
}

export interface TransactionStore {
  masterTransactions: any[];
  exportRecords: ExportRecord[];
  emailRecords: EmailRecord[];
  sendHistory: SendHistoryRecord[];
  transactionIndexes: Record<string, TransactionIndexRecord | string>;
  workflowTimelines: WorkflowTimelineEvent[];
  exportSnapshots: ExportSnapshotRecord[];
  emailEvents: EmailEventRecord[];
}

export interface DatabaseFullState {
  aiWorkspace: AIWorkspaceStore;
  adminSessions: Record<string, AdminSessionRecord>;
  adminSettings: AdminSettingsRecord;
  liveChatSettings: LiveChatSettingsRecord;
  transactionStore: TransactionStore;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_DIR = path.resolve(DATA_DIR, 'backups');
const PRIMARY_DB_FILE = path.resolve(DATA_DIR, 'app_database.json');
const LATEST_BACKUP_JSON = path.resolve(BACKUP_DIR, 'db_backup_latest.json');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function validateAndSanitizeState(raw: any): DatabaseFullState {
  const defaultTransactionStore: TransactionStore = {
    masterTransactions: [],
    exportRecords: [],
    emailRecords: [],
    sendHistory: [],
    transactionIndexes: {},
    workflowTimelines: [],
    exportSnapshots: [],
    emailEvents: []
  };

  const defaultState: DatabaseFullState = {
    aiWorkspace: { memories: [], chatHistory: [] },
    adminSessions: {},
    adminSettings: {
      hkAgents: [],
      lastAdminHeartbeatTime: 0,
      activeAdminSupervisorId: null,
      activeAdminChatId: null,
      agentLastActiveMap: {}
    },
    liveChatSettings: { chatSessions: [], deletedChatIds: [] },
    transactionStore: defaultTransactionStore
  };

  if (!raw || typeof raw !== 'object') return defaultState;

  const rawTxStore = raw.transactionStore || {};

  return {
    aiWorkspace: {
      memories: Array.isArray(raw.aiWorkspace?.memories) ? raw.aiWorkspace.memories : [],
      chatHistory: Array.isArray(raw.aiWorkspace?.chatHistory) ? raw.aiWorkspace.chatHistory : []
    },
    adminSessions: (raw.adminSessions && typeof raw.adminSessions === 'object') ? raw.adminSessions : {},
    adminSettings: (raw.adminSettings && typeof raw.adminSettings === 'object') ? raw.adminSettings : defaultState.adminSettings,
    liveChatSettings: {
      chatSessions: Array.isArray(raw.liveChatSettings?.chatSessions) ? raw.liveChatSettings.chatSessions : [],
      deletedChatIds: Array.isArray(raw.liveChatSettings?.deletedChatIds) ? raw.liveChatSettings.deletedChatIds : []
    },
    transactionStore: {
      masterTransactions: Array.isArray(rawTxStore.masterTransactions) ? rawTxStore.masterTransactions : [],
      exportRecords: Array.isArray(rawTxStore.exportRecords) ? rawTxStore.exportRecords : [],
      emailRecords: Array.isArray(rawTxStore.emailRecords) ? rawTxStore.emailRecords : [],
      sendHistory: Array.isArray(rawTxStore.sendHistory) ? rawTxStore.sendHistory : [],
      transactionIndexes: (rawTxStore.transactionIndexes && typeof rawTxStore.transactionIndexes === 'object') ? rawTxStore.transactionIndexes : {},
      workflowTimelines: Array.isArray(rawTxStore.workflowTimelines) ? rawTxStore.workflowTimelines : [],
      exportSnapshots: Array.isArray(rawTxStore.exportSnapshots) ? rawTxStore.exportSnapshots : [],
      emailEvents: Array.isArray(rawTxStore.emailEvents) ? rawTxStore.emailEvents : []
    }
  };
}

// Create automatic backups before every write operation
export function createAutomaticBackup(fullState: DatabaseFullState) {
  try {
    ensureDirectories();
    const jsonContent = JSON.stringify(fullState, null, 2);

    // 1. Write full state JSON to latest backup file atomically
    const tmpBackup = path.resolve(BACKUP_DIR, `tmp_backup_${Date.now()}.json`);
    fs.writeFileSync(tmpBackup, jsonContent, 'utf8');
    fs.renameSync(tmpBackup, LATEST_BACKUP_JSON);

    // 2. Save a timestamped backup file
    const timestampBackup = path.resolve(BACKUP_DIR, `db_backup_${Date.now()}.json`);
    fs.writeFileSync(timestampBackup, jsonContent, 'utf8');

    // 3. Prune old timestamped backups, keeping max 10
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('db_backup_') && f.endsWith('.json') && f !== 'db_backup_latest.json')
      .map(f => path.resolve(BACKUP_DIR, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    if (backupFiles.length > 10) {
      for (const oldFile of backupFiles.slice(10)) {
        try { fs.unlinkSync(oldFile); } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[Database Storage] Error creating automatic backup:', err);
  }
}

// Restore state from backup files if primary database is missing or corrupted
export function restoreFromBackup(): DatabaseFullState | null {
  ensureDirectories();
  console.warn('[Database Storage] Primary storage missing or corrupted. Attempting recovery from backup...');

  // 1. Try latest backup JSON
  if (fs.existsSync(LATEST_BACKUP_JSON)) {
    try {
      const raw = fs.readFileSync(LATEST_BACKUP_JSON, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        console.log('[Database Storage] Successfully restored database state from latest backup JSON.');
        return validateAndSanitizeState(parsed);
      }
    } catch (e) {
      console.warn('[Database Storage] Latest backup JSON corrupted, checking timestamped backups...');
    }
  }

  // 2. Search for any valid timestamped backup file in descending chronological order
  if (fs.existsSync(BACKUP_DIR)) {
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => path.resolve(BACKUP_DIR, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    for (const backupPath of backupFiles) {
      try {
        const raw = fs.readFileSync(backupPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          console.log(`[Database Storage] Successfully restored state from backup file: ${path.basename(backupPath)}`);
          return validateAndSanitizeState(parsed);
        }
      } catch (e) {
        // continue checking older backups
      }
    }
  }

  return null;
}

// Synchronous load of full state from primary database storage or backup
export function loadFullStateFromDatabaseSync(): DatabaseFullState {
  ensureDirectories();
  const defaultState: DatabaseFullState = {
    aiWorkspace: { memories: [], chatHistory: [] },
    adminSessions: {},
    adminSettings: {
      hkAgents: [],
      lastAdminHeartbeatTime: 0,
      activeAdminSupervisorId: null,
      activeAdminChatId: null,
      agentLastActiveMap: {}
    },
    liveChatSettings: { chatSessions: [], deletedChatIds: [] },
    transactionStore: {
      masterTransactions: [],
      exportRecords: [],
      emailRecords: [],
      sendHistory: [],
      transactionIndexes: {},
      workflowTimelines: [],
      exportSnapshots: [],
      emailEvents: []
    }
  };

  if (fs.existsSync(PRIMARY_DB_FILE)) {
    try {
      const raw = fs.readFileSync(PRIMARY_DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return validateAndSanitizeState(parsed);
      }
    } catch (err) {
      console.error('[Database Storage] Primary DB JSON sync read/parse error:', err);
    }
  }

  const restored = restoreFromBackup();
  if (restored) {
    return restored;
  }

  return defaultState;
}

// Load full state from primary database storage or backup
export async function loadFullStateFromDatabase(): Promise<DatabaseFullState> {
  ensureDirectories();
  const defaultState: DatabaseFullState = {
    aiWorkspace: { memories: [], chatHistory: [] },
    adminSessions: {},
    adminSettings: {
      hkAgents: [],
      lastAdminHeartbeatTime: 0,
      activeAdminSupervisorId: null,
      activeAdminChatId: null,
      agentLastActiveMap: {}
    },
    liveChatSettings: { chatSessions: [], deletedChatIds: [] },
    transactionStore: {
      masterTransactions: [],
      exportRecords: [],
      emailRecords: [],
      sendHistory: [],
      transactionIndexes: {},
      workflowTimelines: [],
      exportSnapshots: [],
      emailEvents: []
    }
  };

  // 1. Try primary database JSON file
  if (fs.existsSync(PRIMARY_DB_FILE)) {
    try {
      const raw = fs.readFileSync(PRIMARY_DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return validateAndSanitizeState(parsed);
      }
    } catch (err) {
      console.error('[Database Storage] Primary DB JSON read/parse error:', err);
    }
  }

  // 2. If primary storage missing or corrupted, try restoring from backup
  const restored = restoreFromBackup();
  if (restored) {
    await saveFullStateToDatabase(restored);
    return restored;
  }

  // 3. Clean initial setup
  console.log('[Database Storage] Initialized clean persistent database storage.');
  await saveFullStateToDatabase(defaultState);
  return defaultState;
}

// Save full state to primary storage atomically with automatic backup before write
export async function saveFullStateToDatabase(fullState: DatabaseFullState): Promise<void> {
  try {
    ensureDirectories();

    // 1. Create automatic backup before writing
    createAutomaticBackup(fullState);

    // 2. Atomic write to primary database file
    const tmpFile = path.resolve(DATA_DIR, 'app_database.json.tmp');
    fs.writeFileSync(tmpFile, JSON.stringify(fullState, null, 2), 'utf8');
    fs.renameSync(tmpFile, PRIMARY_DB_FILE);
  } catch (err) {
    console.error('[Database Storage] Error saving state to database:', err);
  }
}
