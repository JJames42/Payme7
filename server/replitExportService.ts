import dotenv from 'dotenv';
import {
  TransactionStore,
  ExportRecord,
  EmailRecord,
  SendHistoryRecord,
  TransactionIndexRecord,
  WorkflowTimelineEvent,
  ExportSnapshotRecord,
  EmailEventRecord
} from './db/databaseStore.js';
dotenv.config();

export interface EmailEvent {
  id: string;
  type: string;
  sentAt: string;
  recipient: string;
  status: string;
}

export interface ExportSnapshot {
  snapshotId: string;
  exportedAt: string;
  version: string;
  format: string;
}

export interface EmailAttachment {
  name: string;
  type: string;
  size?: string;
  url?: string;
}

export interface EmailLink {
  text: string;
  url: string;
}

export interface EmailButton {
  label: string;
  url: string;
}

export interface EmailImage {
  alt: string;
  url: string;
}

export interface StoredEmailRecord {
  type: 'CREDIT_ALERT' | 'DEBIT_ALERT';
  subject: string;
  senderEmail: string;
  recipientEmail: string;
  messageId: string;
  deliveryStatus: 'DELIVERED' | 'SENT' | 'PENDING' | 'FAILED';
  sentAt: string;
  dateSentStr: string;
  timeSentStr: string;
  amount: string | number;
  plainTextBody: string;
  htmlBody: string;
  rawMimeEmail?: string;
  attachments: EmailAttachment[];
  images: EmailImage[];
  buttons: EmailButton[];
  links: EmailLink[];
  paymentInstructions: string[];
  additionalPaymentInstructions: string[];
  complianceNotices: string[];
  paymentUnderReviewInstructions: string[];
  verificationRequirements: string[];
  footer: string;
  contactSupportInfo: string;
}

export interface MasterTransactionRecord {
  id: string;
  uuid: string;
  masterTransactionId: string;
  referenceNumber: string;
  referenceId: string;
  customerName: string;
  workflowStage: string;
  emailEvents: EmailEvent[];
  exportSnapshots: ExportSnapshot[];
  createdDate: string;
  createdTime: string;
  amount?: number | string;
  direction?: string;
  hkTime?: string;
  remarks?: string;
  creditAlert: StoredEmailRecord;
  debitAlert: StoredEmailRecord;
  raw?: any;
}

class ReplitExportService {
  private cachedStore: TransactionStore | null = null;

  private getApiUrl(): string {
    return process.env.TRANSACTION_EXPORT_API_URL || 'https://pay-me-from-hsbc--andrewtates2027.replit.app/';
  }

  private getApiKey(): string {
    return process.env.EXPORT_API_KEY || '';
  }

  setCachedStore(store: TransactionStore) {
    this.cachedStore = store;
  }

  getCachedStore(): TransactionStore | null {
    return this.cachedStore;
  }

  /**
   * Builds full TransactionStore with all 8 collections derived and indexed from MasterTransactionRecords.
   */
  buildTransactionStore(records: MasterTransactionRecord[]): TransactionStore {
    const exportRecords: ExportRecord[] = [];
    const emailRecords: EmailRecord[] = [];
    const sendHistory: SendHistoryRecord[] = [];
    const transactionIndexes: Record<string, TransactionIndexRecord> = {};
    const workflowTimelines: WorkflowTimelineEvent[] = [];
    const exportSnapshots: ExportSnapshotRecord[] = [];
    const emailEvents: EmailEventRecord[] = [];

    const stageMap: Record<string, number> = {
      'Received': 1,
      'Under Review': 2,
      'Payment Under Review': 2,
      'On Hold': 3,
      'Refund Verification': 4,
      'Pending Approval': 5,
      'Completed': 6
    };

    records.forEach((r, idx) => {
      const ref = r.referenceNumber || r.referenceId;

      // 1. Transaction Indexes
      if (ref) {
        transactionIndexes[`ref:${ref.toLowerCase()}`] = {
          key: `ref:${ref.toLowerCase()}`,
          transactionId: r.id,
          referenceNumber: ref,
          updatedAt: new Date().toISOString()
        };
      }
      if (r.masterTransactionId) {
        transactionIndexes[`master:${r.masterTransactionId.toLowerCase()}`] = {
          key: `master:${r.masterTransactionId.toLowerCase()}`,
          transactionId: r.id,
          referenceNumber: ref,
          updatedAt: new Date().toISOString()
        };
      }
      if (r.uuid) {
        transactionIndexes[`uuid:${r.uuid.toLowerCase()}`] = {
          key: `uuid:${r.uuid.toLowerCase()}`,
          transactionId: r.id,
          referenceNumber: ref,
          updatedAt: new Date().toISOString()
        };
      }
      if (r.customerName) {
        transactionIndexes[`customer:${r.customerName.toLowerCase()}`] = {
          key: `customer:${r.customerName.toLowerCase()}`,
          transactionId: r.id,
          referenceNumber: ref,
          updatedAt: new Date().toISOString()
        };
      }

      // 2. Email Records (Credit Alert & Debit Alert)
      if (r.creditAlert) {
        emailRecords.push({
          id: `email-credit-${r.id}`,
          transactionId: r.id,
          referenceNumber: ref,
          ...r.creditAlert
        });
        sendHistory.push({
          id: `send-credit-${r.id}`,
          emailRecordId: `email-credit-${r.id}`,
          transactionId: r.id,
          recipient: r.creditAlert.recipientEmail,
          subject: r.creditAlert.subject,
          sentAt: r.creditAlert.sentAt,
          status: r.creditAlert.deliveryStatus || 'DELIVERED',
          channel: 'EMAIL',
          attempts: 1
        });
      }
      if (r.debitAlert) {
        emailRecords.push({
          id: `email-debit-${r.id}`,
          transactionId: r.id,
          referenceNumber: ref,
          ...r.debitAlert
        });
        sendHistory.push({
          id: `send-debit-${r.id}`,
          emailRecordId: `email-debit-${r.id}`,
          transactionId: r.id,
          recipient: r.debitAlert.recipientEmail,
          subject: r.debitAlert.subject,
          sentAt: r.debitAlert.sentAt,
          status: r.debitAlert.deliveryStatus || 'DELIVERED',
          channel: 'EMAIL',
          attempts: 1
        });
      }

      // 3. Export Snapshots & Export Records
      if (Array.isArray(r.exportSnapshots)) {
        r.exportSnapshots.forEach((snap, snapIdx) => {
          exportSnapshots.push({
            snapshotId: snap.snapshotId,
            transactionId: r.id,
            referenceNumber: ref,
            exportedAt: snap.exportedAt,
            version: snap.version,
            format: snap.format,
            contentSummary: `Snapshot for ${ref} v${snap.version}`
          });
          exportRecords.push({
            id: `exp-${r.id}-${snapIdx}`,
            transactionId: r.id,
            referenceNumber: ref,
            exportedAt: snap.exportedAt,
            exportType: snap.format,
            snapshotId: snap.snapshotId,
            version: snap.version,
            format: snap.format,
            exportedBy: 'Replit Export System'
          });
        });
      }

      // 4. Email Events
      if (Array.isArray(r.emailEvents)) {
        r.emailEvents.forEach((evt, evtIdx) => {
          emailEvents.push({
            id: evt.id || `evt-${r.id}-${evtIdx}`,
            transactionId: r.id,
            referenceNumber: ref,
            type: evt.type,
            sentAt: evt.sentAt,
            recipient: evt.recipient,
            status: evt.status
          });
        });
      }

      // 5. Workflow Timelines
      const stageIdx = stageMap[r.workflowStage] || 2;
      workflowTimelines.push({
        id: `timeline-${r.id}`,
        transactionId: r.id,
        referenceNumber: ref,
        stage: r.workflowStage,
        stageIndex: stageIdx,
        title: `Workflow Stage: ${r.workflowStage}`,
        description: `Transaction ${ref} currently in workflow stage ${r.workflowStage}`,
        updatedAt: `${r.createdDate}T${r.createdTime}Z`,
        updatedBy: 'System'
      });
    });

    const store: TransactionStore = {
      masterTransactions: records,
      exportRecords,
      emailRecords,
      sendHistory,
      transactionIndexes,
      workflowTimelines,
      exportSnapshots,
      emailEvents
    };

    this.cachedStore = store;
    return store;
  }

  getDefaultInitialTransactions(): MasterTransactionRecord[] {
    const samples = [
      {
        referenceNumber: 'FP10082914',
        customerName: 'TechCorp HK Ltd',
        workflowStage: 'Payment Under Review',
        amount: 25000.00,
        direction: 'INBOUND',
        createdAt: '2026-07-28T09:15:00.000Z',
        remarks: 'Business registration verification required for high-value transfer'
      },
      {
        referenceNumber: 'FP10082915',
        customerName: 'Pacific Trading Solutions',
        workflowStage: 'Completed',
        amount: 8400.50,
        direction: 'INBOUND',
        createdAt: '2026-07-28T10:30:00.000Z',
        remarks: 'Settlement completed T+2'
      },
      {
        referenceNumber: 'FP10082916',
        customerName: 'Apex Digital Logistics',
        workflowStage: 'Refund Verification',
        amount: 1200.00,
        direction: 'OUTBOUND',
        createdAt: '2026-07-29T14:20:00.000Z',
        remarks: 'Merchant requested refund verification'
      },
      {
        referenceNumber: 'FP10082917',
        customerName: 'Kowloon Enterprise Co',
        workflowStage: 'Pending Approval',
        amount: 45000.00,
        direction: 'INBOUND',
        createdAt: '2026-07-30T11:05:00.000Z',
        remarks: 'Compliance manager sign-off required'
      },
      {
        referenceNumber: 'FP10082918',
        customerName: 'Global Sourcing Group',
        workflowStage: 'On Hold',
        amount: 15300.00,
        direction: 'INBOUND',
        createdAt: '2026-07-31T08:45:00.000Z',
        remarks: 'Risk hold due to mismatched account title'
      }
    ];

    return samples.map((item, idx) => this.normalizeRecord(item, idx));
  }

  /**
   * Authenticate and retrieve all Master Transaction Records from live Replit Export API.
   * Falls back to persistent database storage if network or API is unavailable.
   */
  async fetchMasterTransactions(): Promise<MasterTransactionRecord[]> {
    try {
      const baseUrl = this.getApiUrl();
      const isOldReplitUrl = !process.env.TRANSACTION_EXPORT_API_URL || 
                             baseUrl.includes('replit.app') || 
                             baseUrl.includes('andrewtates2027');

      if (isOldReplitUrl) {
        console.log('[Replit Export API] Old Replit endpoint ignored to avoid fetching Replit HTML page. Initializing from Neon PostgreSQL or default persistent storage.');
        if (this.cachedStore?.masterTransactions?.length) {
          return this.cachedStore.masterTransactions;
        }
        const initialRecords = this.getDefaultInitialTransactions();
        this.buildTransactionStore(initialRecords);
        return initialRecords;
      }

      const apiKey = this.getApiKey();
      const targetUrl = new URL('/api/transactions', baseUrl).toString();

      console.log(`[Replit Export API] Authenticating and fetching Master Transactions from: ${targetUrl}`);

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[Replit Export API Error] HTTP ${res.status}: ${errText}`);
        if (this.cachedStore?.masterTransactions?.length) {
          console.log('[Replit Export API] Returning masterTransactions from persistent database storage.');
          return this.cachedStore.masterTransactions;
        }
        console.warn('[Replit Export API] API unavailable and database cache empty. Initializing default persistent Master Transactions.');
        const initialRecords = this.getDefaultInitialTransactions();
        this.buildTransactionStore(initialRecords);
        return initialRecords;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error(`[Replit Export API Error] Expected JSON but received Content-Type: ${contentType}`);
        if (this.cachedStore?.masterTransactions?.length) {
          return this.cachedStore.masterTransactions;
        }
        const initialRecords = this.getDefaultInitialTransactions();
        this.buildTransactionStore(initialRecords);
        return initialRecords;
      }

      const text = await res.text();
      let rawData: any[];
      try {
        rawData = JSON.parse(text);
      } catch (parseErr) {
        console.error('[Replit Export API Error] Failed to parse response text as JSON:', parseErr);
        if (this.cachedStore?.masterTransactions?.length) {
          return this.cachedStore.masterTransactions;
        }
        const initialRecords = this.getDefaultInitialTransactions();
        this.buildTransactionStore(initialRecords);
        return initialRecords;
      }

      if (!Array.isArray(rawData)) {
        console.error('[Replit Export API Error] Parsed JSON is not an array.');
        if (this.cachedStore?.masterTransactions?.length) {
          return this.cachedStore.masterTransactions;
        }
        console.warn('[Replit Export API] Non-array response. Initializing default persistent Master Transactions.');
        const initialRecords = this.getDefaultInitialTransactions();
        this.buildTransactionStore(initialRecords);
        return initialRecords;
      }

      console.log(`[Replit Export API Success] Successfully retrieved ${rawData.length} transaction records.`);

      // Map and normalize all records
      const records = rawData.map((item: any, index: number) => this.normalizeRecord(item, index));
      return records;
    } catch (err: any) {
      if (this.cachedStore?.masterTransactions?.length) {
        console.warn('[Replit Export API] Fetch failed, returning masterTransactions from persistent database storage:', err.message);
        return this.cachedStore.masterTransactions;
      }
      console.warn('[Replit Export API] Network/API fetch failed and cache empty. Initializing default persistent Master Transactions.');
      const initialRecords = this.getDefaultInitialTransactions();
      this.buildTransactionStore(initialRecords);
      return initialRecords;
    }
  }

  /**
   * Normalizes raw transaction item into a complete MasterTransactionRecord.
   * Ensures referenceId and referenceNumber contain the exact same value.
   */
  normalizeRecord(item: any, index: number = 0): MasterTransactionRecord {
    const rawRef = item.referenceId || item.referenceNumber || item.refId || item.refNum || `FP${String(10000000 + index).padStart(8, '0')}`;
    // Guarantee both referenceId and referenceNumber always match identically
    const referenceValue = String(rawRef).trim();

    const createdIso = item.createdAt || item.created_at || new Date().toISOString();
    let createdDate = '2026-07-28';
    let createdTime = '12:00:00';
    try {
      const d = new Date(createdIso);
      if (!isNaN(d.getTime())) {
        createdDate = d.toISOString().split('T')[0];
        createdTime = d.toISOString().split('T')[1].substring(0, 8);
      }
    } catch {}

    const customerName = item.customerName || item.counterparty || item.userName || item.customer_name || 'Customer';
    const customerSlug = customerName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const uuid = item.uuid || item.transactionUuid || item.id || `tx-uuid-${index + 100}`;
    const masterTransactionId = item.masterTransactionId || item.masterTxId || `MTX-${referenceValue}`;
    const workflowStage = item.workflowStage || item.stage || item.status || 'Completed';

    const emailEvents: EmailEvent[] = Array.isArray(item.emailEvents) && item.emailEvents.length > 0
      ? item.emailEvents
      : [
          {
            id: `evt-${referenceValue}-01`,
            type: 'STAGE_CHANGE_NOTIFICATION',
            sentAt: createdIso,
            recipient: `${customerSlug || 'merchant'}@payme.hk`,
            status: 'DELIVERED'
          }
        ];

    const exportSnapshots: ExportSnapshot[] = Array.isArray(item.exportSnapshots) && item.exportSnapshots.length > 0
      ? item.exportSnapshots
      : [
          {
            snapshotId: `snap-${referenceValue}-v1`,
            exportedAt: createdIso,
            version: '1.0',
            format: 'JSON'
          }
        ];

    const amountVal = item.amount || '0.00';

    // Build Credit Alert (Authoritative Primary Source of Truth)
    const creditAlert: StoredEmailRecord = item.creditAlert || item.credit_alert || {
      type: 'CREDIT_ALERT',
      subject: `[HSBC PayMe Business] Credit Alert & Official Payment Advice - Ref: ${referenceValue}`,
      senderEmail: 'notifications@payme.hsbc.com.hk',
      recipientEmail: `${customerSlug || 'merchant'}@payme.hk`,
      messageId: `<credit-${referenceValue}@payme.hsbc.com.hk>`,
      deliveryStatus: 'DELIVERED',
      sentAt: createdIso,
      dateSentStr: createdDate,
      timeSentStr: createdTime,
      amount: amountVal,
      plainTextBody: `
HSBC PayMe Business - Official Credit Alert & Payment Advice
------------------------------------------------------------
Reference Number: ${referenceValue}
Master Transaction ID: ${masterTransactionId}
Customer / Merchant: ${customerName}
Amount: HK$ ${amountVal}
Workflow Stage: ${workflowStage}
Date & Time Sent: ${createdDate} ${createdTime} HKT
Sender Email: notifications@payme.hsbc.com.hk
Recipient Email: ${customerSlug || 'merchant'}@payme.hk
Message ID: <credit-${referenceValue}@payme.hsbc.com.hk>
Delivery Status: DELIVERED

[Payment Instructions]
1. Ensure funds are credited to your registered HSBC PayMe Business settlement account within T+2 settlement cycle.
2. Keep reference number ${referenceValue} for all billing and support inquiries.

[Additional Payment Instructions]
- For transactions held under 'Payment Under Review', submit an updated Business Registration Number (BRN) certificate.
- Verify that the account title matches the registered business entity name.

[Compliance Notices]
- Issued under HSBC PayMe Business SVF License & Cap. 584 Regulations.
- High-value transactions undergo automated Anti-Money Laundering (AML) and Know Your Customer (KYC) compliance scanning.

[Payment Under Review Instructions]
- If workflow stage indicates 'Payment Under Review', upload your updated BRN certificate via Live Chat or Merchant Portal immediately.
- Allow 1-2 business days for compliance review after document submission.

[Verification Requirements]
- Valid Hong Kong Business Registration Number (BRN) Certificate
- ID Proof of Authorized Director / Signatory
- Recent HK Bank Statement (last 3 months)

[Support & Live Chat]
HSBC PayMe Business Support Helpline: +852 2233 3000
Live Chat: Available 24/7 in HSBC PayMe App
Email: support@payme.hsbc.com.hk

[Footer]
The Hongkong and Shanghai Banking Corporation Limited. All rights reserved.
1 Queen's Road Central, Hong Kong.
`.trim(),
      htmlBody: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
  .card { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
  .header-logo { font-size: 20px; font-weight: 800; color: #f43f5e; letter-spacing: -0.5px; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-credit { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .badge-review { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .content { padding: 24px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
  .meta-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  .meta-label { font-weight: 600; color: #64748b; width: 35%; }
  .meta-val { font-weight: 700; color: #0f172a; }
  .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
  .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; margin-bottom: 8px; }
  .btn { display: inline-block; padding: 10px 20px; background: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 8px; margin-right: 8px; margin-top: 10px; }
  .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-logo">HSBC PayMe Business</div>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Credit Alert & Payment Advice Notification</p>
    </div>
    <div class="content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span class="badge badge-credit">CREDIT ALERT - PRIMARY RECORD</span>
        <span class="badge badge-review">${workflowStage}</span>
      </div>

      <table class="meta-table">
        <tr><td class="meta-label">Reference Number</td><td class="meta-val">${referenceValue}</td></tr>
        <tr><td class="meta-label">Master Transaction ID</td><td class="meta-val">${masterTransactionId}</td></tr>
        <tr><td class="meta-label">Merchant Name</td><td class="meta-val">${customerName}</td></tr>
        <tr><td class="meta-label">Amount</td><td class="meta-val" style="color: #059669; font-size: 16px;">HK$ ${amountVal}</td></tr>
        <tr><td class="meta-label">Sender Email</td><td class="meta-val">notifications@payme.hsbc.com.hk</td></tr>
        <tr><td class="meta-label">Recipient Email</td><td class="meta-val">${customerSlug || 'merchant'}@payme.hk</td></tr>
        <tr><td class="meta-label">Message ID</td><td class="meta-val">&lt;credit-${referenceValue}@payme.hsbc.com.hk&gt;</td></tr>
        <tr><td class="meta-label">Date & Time Sent</td><td class="meta-val">${createdDate} ${createdTime} HKT</td></tr>
        <tr><td class="meta-label">Delivery Status</td><td class="meta-val" style="color: #166534;">DELIVERED</td></tr>
      </table>

      <div class="section-box">
        <div class="section-title">Payment Instructions</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
          <li>Ensure funds are credited to your registered HSBC PayMe Business settlement account within T+2 settlement cycle.</li>
          <li>Keep reference number ${referenceValue} for all billing and support inquiries.</li>
        </ul>
      </div>

      <div class="section-box">
        <div class="section-title">Additional Payment & Verification Instructions</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
          <li>For transactions held under 'Payment Under Review', submit an updated Business Registration Number (BRN) certificate.</li>
          <li>Verify that the account title matches the registered business entity name.</li>
          <li>Upload documents via Live Chat or HSBC PayMe Merchant Portal.</li>
        </ul>
      </div>

      <div class="section-box" style="background: #fff1f2; border-color: #fecdd3;">
        <div class="section-title" style="color: #9f1239;">Compliance Notices & Requirements</div>
        <p style="margin: 0; font-size: 12px; color: #881337; leading-relaxed;">
          Issued under HSBC PayMe Business SVF License & Cap. 584 Regulations. High-value transactions undergo automated Anti-Money Laundering (AML) and Know Your Customer (KYC) compliance scanning. Required documents: Valid HK BRN Certificate, ID Proof of Director, and 3 months bank statement.
        </p>
      </div>

      <div style="margin-top: 20px;">
        <a href="https://payme.hsbc.com.hk/portal/transactions/${referenceValue}" class="btn">View Transaction Details</a>
        <a href="https://payme.hsbc.com.hk/portal/verify/${referenceValue}" class="btn" style="background: #e11d48;">Submit Verification Documents</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>HSBC PayMe Business Support Helpline:</strong> +852 2233 3000 | Live Chat: Available 24/7 in HSBC PayMe App</p>
      <p style="margin: 0;">The Hongkong and Shanghai Banking Corporation Limited. All rights reserved. 1 Queen's Road Central, Hong Kong.</p>
    </div>
  </div>
</body>
</html>
`.trim(),
      attachments: [
        { name: `Credit_Alert_Advice_${referenceValue}.pdf`, type: 'application/pdf', size: '245 KB' }
      ],
      images: [
        { alt: 'HSBC PayMe Business Logo', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&fit=crop' }
      ],
      buttons: [
        { label: 'View Transaction Details', url: `https://payme.hsbc.com.hk/portal/transactions/${referenceValue}` },
        { label: 'Submit Verification Documents', url: `https://payme.hsbc.com.hk/portal/verify/${referenceValue}` }
      ],
      links: [
        { text: 'HSBC PayMe Merchant Portal', url: 'https://payme.hsbc.com.hk/merchant' },
        { text: 'Terms & Conditions', url: 'https://payme.hsbc.com.hk/terms' }
      ],
      paymentInstructions: [
        `Ensure funds are credited to your registered HSBC PayMe Business settlement account within T+2 settlement cycle.`,
        `Keep reference number ${referenceValue} for all billing and support inquiries.`
      ],
      additionalPaymentInstructions: [
        `For transactions held under 'Payment Under Review', submit an updated Business Registration Number (BRN) certificate.`,
        `Verify that the account title matches the registered business entity name.`
      ],
      complianceNotices: [
        `Issued under HSBC PayMe Business SVF License & Cap. 584 Regulations.`,
        `All high-value payments undergo automated Anti-Money Laundering (AML) and Know Your Customer (KYC) compliance scanning.`
      ],
      paymentUnderReviewInstructions: [
        `If workflow stage indicates 'Payment Under Review', upload your updated BRN certificate via Live Chat or Merchant Portal immediately.`,
        `Allow 1-2 business days for compliance review after document submission.`
      ],
      verificationRequirements: [
        `Valid Hong Kong Business Registration Number (BRN) Certificate`,
        `ID Proof of Authorized Director / Signatory`,
        `Recent HK Bank Statement (last 3 months)`
      ],
      footer: "The Hongkong and Shanghai Banking Corporation Limited. All rights reserved. HSBC PayMe Business Division, 1 Queen's Road Central, Hong Kong.",
      contactSupportInfo: "HSBC PayMe Business Support Helpline: +852 2233 3000 | Live Chat: Available 24/7 in HSBC PayMe App | Email: support@payme.hsbc.com.hk"
    };

    if (!creditAlert.rawMimeEmail) {
      creditAlert.rawMimeEmail = `From: ${creditAlert.senderEmail}\r\nTo: ${creditAlert.recipientEmail}\r\nSubject: ${creditAlert.subject}\r\nDate: ${creditAlert.sentAt}\r\nMessage-ID: ${creditAlert.messageId}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary="----=_Part_Credit_${referenceValue}"\r\n\r\n------=_Part_Credit_${referenceValue}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${creditAlert.plainTextBody}\r\n\r\n------=_Part_Credit_${referenceValue}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${creditAlert.htmlBody}\r\n------=_Part_Credit_${referenceValue}--`;
    }

    // Build Debit Alert (Secondary Supporting Evidence)
    const debitAlert: StoredEmailRecord = item.debitAlert || item.debit_alert || {
      type: 'DEBIT_ALERT',
      subject: `[HSBC PayMe] Debit Confirmation - Payment Sent - Ref: ${referenceValue}`,
      senderEmail: 'alerts@payme.hsbc.com.hk',
      recipientEmail: `payer-${customerSlug || 'merchant'}@hsbc.com.hk`,
      messageId: `<debit-${referenceValue}@payme.hsbc.com.hk>`,
      deliveryStatus: 'DELIVERED',
      sentAt: createdIso,
      dateSentStr: createdDate,
      timeSentStr: createdTime,
      amount: amountVal,
      plainTextBody: `
HSBC PayMe - Debit Confirmation (Supporting Evidence)
-----------------------------------------------------
Payment Initiation Confirmed
Sender: ${customerName} (Payer Account ACC-${referenceValue.slice(-6)})
Amount Debited: HK$ ${amountVal}
Reference Number: ${referenceValue}
Timestamp: ${createdDate} ${createdTime} HKT
Status: DEBITED / PAYMENT INITIATED

Note: This Debit Alert is supporting evidence only confirming sender payment initiation and timestamp.
`.trim(),
      htmlBody: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:20px;background:#f8fafc;}</style></head>
<body>
  <div style="max-width:500px;margin:0 auto;background:#fff;padding:20px;border-radius:12px;border:1px solid #e2e8f0;">
    <h3 style="color:#0369a1;margin-top:0;">HSBC PayMe - Debit Alert</h3>
    <p><strong>Payment Initiation:</strong> Confirmed</p>
    <p><strong>Payer Name:</strong> ${customerName}</p>
    <p><strong>Amount Debited:</strong> HK$ ${amountVal}</p>
    <p><strong>Reference Number:</strong> ${referenceValue}</p>
    <p><strong>Timestamp:</strong> ${createdDate} ${createdTime} HKT</p>
    <p style="font-size:11px;color:#64748b;">This Debit Alert serves as supporting evidence confirming payment initiation and sender timestamp.</p>
  </div>
</body>
</html>
`.trim(),
      attachments: [],
      images: [],
      buttons: [
        { label: 'View Debit Receipt', url: `https://payme.hsbc.com.hk/debit/${referenceValue}` }
      ],
      links: [
        { text: 'HSBC Personal / Business Banking', url: 'https://payme.hsbc.com.hk' }
      ],
      paymentInstructions: ['Payment initiation confirmed from payer account.'],
      additionalPaymentInstructions: ['Supporting evidence of sender account debit.'],
      complianceNotices: ['Debit notification record for account debit verification.'],
      paymentUnderReviewInstructions: [],
      verificationRequirements: [],
      footer: "The Hongkong and Shanghai Banking Corporation Limited.",
      contactSupportInfo: "HSBC PayMe Helpline: +852 2233 3000"
    };

    if (!debitAlert.rawMimeEmail) {
      debitAlert.rawMimeEmail = `From: ${debitAlert.senderEmail}\r\nTo: ${debitAlert.recipientEmail}\r\nSubject: ${debitAlert.subject}\r\nDate: ${debitAlert.sentAt}\r\nMessage-ID: ${debitAlert.messageId}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary="----=_Part_Debit_${referenceValue}"\r\n\r\n------=_Part_Debit_${referenceValue}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${debitAlert.plainTextBody}\r\n\r\n------=_Part_Debit_${referenceValue}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${debitAlert.htmlBody}\r\n------=_Part_Debit_${referenceValue}--`;
    }

    return {
      id: item.id || uuid,
      uuid,
      masterTransactionId,
      referenceNumber: referenceValue,
      referenceId: referenceValue,
      customerName,
      workflowStage,
      emailEvents,
      exportSnapshots,
      createdDate,
      createdTime,
      amount: item.amount,
      direction: item.direction,
      hkTime: item.hkTime,
      remarks: item.remarks,
      creditAlert,
      debitAlert,
      raw: item
    };
  }

  /**
   * Retrieve single Master Transaction Record by referenceNumber, referenceId, or masterTransactionId
   */
  async findTransactionByReference(ref: string): Promise<MasterTransactionRecord | null> {
    if (!ref || !ref.trim()) return null;
    const searchRef = ref.trim().toLowerCase();

    const allTx = await this.fetchMasterTransactions();
    const found = allTx.find(t => 
      t.referenceNumber.toLowerCase() === searchRef ||
      t.referenceId.toLowerCase() === searchRef ||
      t.masterTransactionId.toLowerCase() === searchRef ||
      t.uuid.toLowerCase() === searchRef ||
      t.id.toLowerCase() === searchRef
    );

    return found || null;
  }
}

export const replitExportService = new ReplitExportService();
