import path from 'path';
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

let pgPoolInstance: pg.Pool | null = null;
let schemaInitialized = false;

function getPgPool(): pg.Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === '') return null;

  if (!pgPoolInstance) {
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    pgPoolInstance = new Pool({
      connectionString: dbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pgPoolInstance.on('error', (err) => {
      console.error('[Neon Postgres] Unexpected background pool error:', err);
    });
  }
  return pgPoolInstance;
}

export async function closePgPool(): Promise<void> {
  if (pgPoolInstance) {
    try {
      await pgPoolInstance.end();
      console.log('[Neon Postgres] Connection pool closed gracefully.');
    } catch (err) {
      console.error('[Neon Postgres] Error closing connection pool:', err);
    } finally {
      pgPoolInstance = null;
      schemaInitialized = false;
    }
  }
}

// Process shutdown is handled by the orchestrator in server.ts to avoid database persistence race conditions.

async function initPgSchema(pool: pg.Pool): Promise<void> {
  if (schemaInitialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error('[Neon Postgres] Error initializing schema:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function saveToNeon(pool: pg.Pool, fullState: DatabaseFullState): Promise<void> {
  await initPgSchema(pool);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const jsonStr = JSON.stringify(fullState);

    await client.query(
      `INSERT INTO app_state (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['full_state', jsonStr]
    );

    // Also store granular domain sub-keys for targeted queries
    await client.query(
      `INSERT INTO app_state (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['ai_workspace', JSON.stringify(fullState.aiWorkspace)]
    );
    await client.query(
      `INSERT INTO app_state (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['admin_sessions', JSON.stringify(fullState.adminSessions)]
    );
    await client.query(
      `INSERT INTO app_state (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['admin_settings', JSON.stringify(fullState.adminSettings)]
    );
    await client.query(
      `INSERT INTO app_state (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['live_chat_settings', JSON.stringify(fullState.liveChatSettings)]
    );
    await client.query(
      `INSERT INTO app_state (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['transaction_store', JSON.stringify(fullState.transactionStore)]
    );

    await client.query('COMMIT');
    console.log('[Neon Postgres] Transaction committed successfully. State updated in app_state table.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[Neon Postgres] Error during transaction rollback:', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

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

const getStorageDir = (): string => {
  if (process.env.PERSISTENT_DIR) {
    return process.env.PERSISTENT_DIR;
  }
  const renderDataPath = '/data';
  try {
    if (fs.existsSync(renderDataPath)) {
      const testFile = path.join(renderDataPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return renderDataPath;
    }
  } catch (e) {}
  return process.cwd();
};

const STORAGE_DIR = getStorageDir();
const DATA_DIR = path.resolve(STORAGE_DIR, 'data');
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

// Load full state from primary database storage (Neon PostgreSQL) or fallback JSON
export async function loadFullStateFromDatabase(): Promise<DatabaseFullState> {
  ensureDirectories();
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.trim() !== '') {
    console.log('[Neon Postgres] DATABASE_URL detected.');
    const pool = getPgPool();
    if (pool) {
      try {
        console.log('[Neon Postgres] Connected successfully.');
        await initPgSchema(pool);
        console.log('[Neon Postgres] app_state table verified.');

        const res = await pool.query('SELECT data FROM app_state WHERE key = $1', ['full_state']);
        if (res.rows && res.rows.length > 0 && res.rows[0].data) {
          console.log('[Neon Postgres] Loaded full_state from Neon PostgreSQL.');
          console.log('[Neon Postgres] Runtime state hydrated from Neon PostgreSQL.');
          console.log('[Neon Postgres] Local JSON snapshot available for emergency fallback only.');
          return validateAndSanitizeState(res.rows[0].data);
        } else {
          console.log('[Neon Postgres] Database empty or missing full_state. Initializing migration from app_database.json...');
          let stateToMigrate: DatabaseFullState | null = null;

          if (fs.existsSync(PRIMARY_DB_FILE)) {
            try {
              const raw = fs.readFileSync(PRIMARY_DB_FILE, 'utf8');
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                stateToMigrate = validateAndSanitizeState(parsed);
              }
            } catch (err) {
              console.error('[Database Storage] Error reading app_database.json for migration:', err);
            }
          }

          if (!stateToMigrate) {
            stateToMigrate = restoreFromBackup();
          }

          if (!stateToMigrate) {
            stateToMigrate = {
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
          }

          // Migrate state into Neon PostgreSQL
          await saveToNeon(pool, stateToMigrate);
          console.log('[Neon Postgres] Successfully migrated existing data from app_database.json into Neon PostgreSQL.');
          console.log('[Neon Postgres] Loaded full_state from Neon PostgreSQL.');
          console.log('[Neon Postgres] Runtime state hydrated from Neon PostgreSQL.');
          console.log('[Neon Postgres] Local JSON snapshot available for emergency fallback only.');
          return stateToMigrate;
        }
      } catch (err) {
        console.error('[Neon Postgres] Error querying Neon PostgreSQL, falling back to local JSON store:', err);
      }
    }
  } else {
    console.log('[Neon Postgres] DATABASE_URL not detected. Using local JSON store as primary.');
  }

  // Fallback if DATABASE_URL is not provided or pool connection fails
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

  const restored = restoreFromBackup();
  if (restored) {
    await saveFullStateToDatabase(restored);
    return restored;
  }

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

  console.log('[Database Storage] Initialized clean persistent database storage.');
  await saveFullStateToDatabase(defaultState);
  return defaultState;
}

// Save full state to Neon PostgreSQL primary storage and create automatic backup
export async function saveFullStateToDatabase(fullState: DatabaseFullState): Promise<void> {
  try {
    ensureDirectories();

    // 1. Create automatic backup before writing
    createAutomaticBackup(fullState);

    // 2. Atomic write to local primary database JSON backup file
    const tmpFile = path.resolve(DATA_DIR, 'app_database.json.tmp');
    fs.writeFileSync(tmpFile, JSON.stringify(fullState, null, 2), 'utf8');
    fs.renameSync(tmpFile, PRIMARY_DB_FILE);

    // 3. Persist state to Neon PostgreSQL if DATABASE_URL is configured
    const pool = getPgPool();
    if (pool) {
      try {
        await saveToNeon(pool, fullState);
        console.log('[Neon Postgres] Successfully saved full_state to Neon PostgreSQL.');
      } catch (pgErr) {
        console.warn('[Neon Postgres] Initial write attempt encountered error, retrying:', (pgErr as Error)?.message || pgErr);
        try {
          await saveToNeon(pool, fullState);
          console.log('[Neon Postgres] Successfully saved full_state to Neon PostgreSQL on retry.');
        } catch (retryErr) {
          console.error('[Neon Postgres] Error persisting state to Neon PostgreSQL after retry, falling back to local JSON backup:', retryErr);
        }
      }
    } else {
      console.log('[Neon Postgres] DATABASE_URL not set; using local JSON store as primary.');
    }
  } catch (err) {
    console.error('[Database Storage] Error saving state to database:', err);
  }
}

