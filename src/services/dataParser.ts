/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ColumnMapping,
  DeliveryStatus,
  EmailDirection,
  ImportSummary,
  NormalizedEmailRecord,
  RawEmailRecord,
  RejectionDetail,
} from '../types/email.ts';

/**
 * Normalizes email address and extracts domain.
 */
export function normalizeEmail(rawEmail: any): { email: string; domain: string; isValid: boolean } {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { email: '', domain: '', isValid: false };
  }

  // Remove potential display name: e.g. "John Doe <john@example.com>"
  let cleaned = rawEmail.trim();
  const angleMatch = cleaned.match(/<([^>]+)>/);
  if (angleMatch) {
    cleaned = angleMatch[1].trim();
  }

  cleaned = cleaned.toLowerCase();
  const atIndex = cleaned.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === cleaned.length - 1) {
    return { email: cleaned, domain: '', isValid: false };
  }

  const domain = cleaned.slice(atIndex + 1).trim();
  const isValid = domain.length > 0 && cleaned.includes('.');
  return { email: cleaned, domain, isValid };
}

/**
 * Parses diverse timestamp formats from M365 exports, Excel serial numbers, or ISO strings.
 */
export function parseTimestamp(rawDate: any): { dateObj: Date | null; iso: string; dateStr: string; hour: number; error?: string } {
  if (rawDate === undefined || rawDate === null || rawDate === '') {
    return { dateObj: null, iso: '', dateStr: '', hour: 0, error: 'Empty timestamp' };
  }

  let d: Date | null = null;

  // Handle Excel serial date number
  if (typeof rawDate === 'number') {
    // Excel epoch starts Jan 1, 1900 with leap year bug
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 86400 * 1000;
    d = new Date(excelEpoch.getTime() + rawDate * msPerDay);
  } else if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    // Try standard Date parsing
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      d = new Date(parsed);
    } else {
      // Try common M365 format: MM/DD/YYYY HH:MM:SS or DD/MM/YYYY HH:MM:SS
      const parts = trimmed.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
      if (parts) {
        let y = parseInt(parts[1], 10);
        let m = parseInt(parts[2], 10);
        let day = parseInt(parts[3], 10);
        if (parts[3].length === 4) {
          // Format was MM/DD/YYYY or DD/MM/YYYY
          y = parseInt(parts[3], 10);
          m = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        }
        const hour = parseInt(parts[4], 10);
        const min = parseInt(parts[5], 10);
        const sec = parts[6] ? parseInt(parts[6], 10) : 0;
        d = new Date(Date.UTC(y, m - 1, day, hour, min, sec));
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    return { dateObj: null, iso: '', dateStr: '', hour: 0, error: `Invalid date format: "${String(rawDate)}"` };
  }

  const iso = d.toISOString();
  const dateStr = iso.slice(0, 10);
  const hour = d.getUTCHours();

  return { dateObj: d, iso, dateStr, hour };
}

/**
 * Standardizes email direction according to RFC and Exchange report rules.
 */
export function normalizeDirection(rawDirection: any, senderDomain: string, recipientDomain: string): EmailDirection {
  if (typeof rawDirection === 'string' && rawDirection.trim()) {
    const val = rawDirection.trim().toLowerCase();
    if (val.includes('internal') || val.includes('intra')) {
      return 'Internal';
    }
    if (val.includes('out') || val.includes('sent') || val.includes('egress') || val.includes('external out')) {
      return 'Outbound';
    }
    if (val === 'in' || val.startsWith('inbound') || val.includes('recv') || val.includes('received') || val.includes('ingress') || val.includes('external in')) {
      return 'Inbound';
    }
  }

  // Infer based on domains if direction is blank
  if (senderDomain && recipientDomain && senderDomain === recipientDomain) {
    return 'Internal';
  }

  return 'Unknown';
}

/**
 * Normalizes delivery status into standard enterprise categories.
 * Preserves original status string and accurately categorizes without guessing.
 */
export function normalizeStatus(rawStatus: any): { status: DeliveryStatus; raw: string } {
  if (!rawStatus || typeof rawStatus !== 'string') {
    return { status: 'Unknown', raw: String(rawStatus ?? '') };
  }

  const raw = rawStatus.trim();
  const lower = raw.toLowerCase();

  if (
    lower === 'delivered' ||
    lower === 'success' ||
    lower === 'successful' ||
    lower === 'send' ||
    lower === 'sent' ||
    lower === 'deliver' ||
    lower === 'completed'
  ) {
    return { status: 'Delivered', raw };
  }

  if (
    lower.includes('fail') ||
    lower.includes('reject') ||
    lower.includes('bounce') ||
    lower.includes('dropped') ||
    lower === 'undeliverable' ||
    lower === 'error'
  ) {
    return { status: 'Failed', raw };
  }

  if (lower.includes('defer') || lower.includes('delay') || lower.includes('throttle') || lower.includes('retry')) {
    return { status: 'Deferred', raw };
  }

  if (lower.includes('pending') || lower.includes('queue') || lower.includes('processing')) {
    return { status: 'Pending', raw };
  }

  if (lower.includes('quarantine') || lower.includes('spam') || lower.includes('blocked')) {
    return { status: 'Quarantined', raw };
  }

  if (lower.includes('expand')) {
    return { status: 'Expanded', raw };
  }

  return { status: 'Unknown', raw };
}

/**
 * Automatic header detection for Microsoft 365 Admin Center, Exchange Message Tracking, and third-party gateways.
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    timestamp: '',
    sender: '',
    recipient: '',
    status: '',
  };

  const clean = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const h of headers) {
    const c = clean(h);

    // Timestamp
    if (!mapping.timestamp && (c.includes('date') || c.includes('time') || c.includes('received') || c.includes('timestamp'))) {
      mapping.timestamp = h;
    }
    // Sender
    else if (!mapping.sender && (c.includes('sender') || c === 'from' || c.includes('fromaddress') || c === 'p1sender')) {
      mapping.sender = h;
    }
    // Recipient
    else if (!mapping.recipient && (c.includes('recipient') || c === 'to' || c.includes('toaddress') || c === 'p1recipient')) {
      mapping.recipient = h;
    }
    // Status
    else if (!mapping.status && (c.includes('status') || c.includes('eventid') || c.includes('deliverystatus') || c === 'action' || c === 'result')) {
      mapping.status = h;
    }
    // Direction
    else if (!mapping.direction && (c.includes('direction') || c.includes('traffic') || c.includes('messagedirection'))) {
      mapping.direction = h;
    }
    // Subject
    else if (!mapping.subject && (c.includes('subject') || c.includes('messagesubject'))) {
      mapping.subject = h;
    }
    // Message ID
    else if (!mapping.messageId && (c.includes('messageid') || c.includes('networkmessageid') || c.includes('msgid') || c.includes('internetmessageid'))) {
      mapping.messageId = h;
    }
    // Size
    else if (!mapping.sizeBytes && (c.includes('size') || c.includes('totalbytes') || c.includes('bytes'))) {
      mapping.sizeBytes = h;
    }
    // Latency
    else if (!mapping.latencyMs && (c.includes('latency') || c.includes('duration') || c.includes('elapsed'))) {
      mapping.latencyMs = h;
    }
    // Source IP
    else if (!mapping.sourceIp && (c.includes('ip') || c.includes('clientip') || c.includes('sourceip') || c.includes('originalclientip'))) {
      mapping.sourceIp = h;
    }
    // Threat / Spam
    else if (!mapping.threatClassification && (c.includes('threat') || c.includes('spam') || c.includes('classification') || c.includes('verdict'))) {
      mapping.threatClassification = h;
    }
    // Error detail
    else if (!mapping.errorDetail && (c.includes('error') || c.includes('reason') || c.includes('lasterror') || c.includes('errordetail') || c.includes('code'))) {
      mapping.errorDetail = h;
    }
  }

  return mapping;
}

/**
 * Normalizes an array of raw row records using the provided column mapping.
 */
export function normalizeRecords(
  rows: RawEmailRecord[],
  mapping: ColumnMapping,
  options?: { maxRows?: number }
): {
  records: NormalizedEmailRecord[];
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  rejections: RejectionDetail[];
} {
  const records: NormalizedEmailRecord[] = [];
  const rejections: RejectionDetail[] = [];
  const seenSignatures = new Set<string>();
  let duplicateCount = 0;

  const rowLimit = options?.maxRows ?? 50000;
  const processRows = rows.slice(0, rowLimit);

  processRows.forEach((row, index) => {
    const rowNum = index + 1;

    // Check if entire row is empty
    const values = Object.values(row).filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    if (values.length === 0) {
      // Empty row
      rejections.push({ rowNumber: rowNum, reason: 'Empty row' });
      return;
    }

    // Check required columns in mapping
    if (!mapping.timestamp || !mapping.sender || !mapping.recipient || !mapping.status) {
      rejections.push({ rowNumber: rowNum, reason: 'Missing required column mapping' });
      return;
    }

    // Extract values from row
    const rawTime = row[mapping.timestamp];
    const rawSender = row[mapping.sender];
    const rawRecipient = row[mapping.recipient];
    const rawStatus = row[mapping.status];

    // Timestamp check
    const timeParsed = parseTimestamp(rawTime);
    if (!timeParsed.dateObj) {
      rejections.push({
        rowNumber: rowNum,
        reason: timeParsed.error || 'Invalid timestamp',
        rawSnippet: String(rawTime || '').slice(0, 50),
      });
      return;
    }

    // Sender check
    const senderParsed = normalizeEmail(rawSender);
    if (!senderParsed.isValid) {
      rejections.push({
        rowNumber: rowNum,
        reason: `Invalid sender email: "${String(rawSender || '').slice(0, 40)}"`,
      });
      return;
    }

    // Recipient check
    const recipientParsed = normalizeEmail(rawRecipient);
    if (!recipientParsed.isValid) {
      rejections.push({
        rowNumber: rowNum,
        reason: `Invalid recipient email: "${String(rawRecipient || '').slice(0, 40)}"`,
      });
      return;
    }

    // Status check
    const statusParsed = normalizeStatus(rawStatus);

    // Optional fields
    const rawDirection = mapping.direction ? row[mapping.direction] : undefined;
    const direction = normalizeDirection(rawDirection, senderParsed.domain, recipientParsed.domain);

    const subject = mapping.subject && row[mapping.subject] ? String(row[mapping.subject]).trim() : undefined;
    const messageId = mapping.messageId && row[mapping.messageId] ? String(row[mapping.messageId]).trim() : undefined;

    let sizeBytes: number | undefined = undefined;
    if (mapping.sizeBytes && row[mapping.sizeBytes] !== undefined) {
      const num = parseInt(String(row[mapping.sizeBytes]).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num >= 0) sizeBytes = num;
    }

    let latencyMs: number | undefined = undefined;
    if (mapping.latencyMs && row[mapping.latencyMs] !== undefined) {
      const num = parseFloat(String(row[mapping.latencyMs]).replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num >= 0) latencyMs = num;
    }

    const sourceIp = mapping.sourceIp && row[mapping.sourceIp] ? String(row[mapping.sourceIp]).trim() : undefined;
    const threatClassification = mapping.threatClassification && row[mapping.threatClassification]
      ? String(row[mapping.threatClassification]).trim()
      : undefined;
    const errorDetail = mapping.errorDetail && row[mapping.errorDetail] ? String(row[mapping.errorDetail]).trim() : undefined;

    // Duplicate detection based on composite signature:
    // timestamp (to second) + sender + recipient + (messageId OR subject)
    const sigKey = `${timeParsed.iso.slice(0, 19)}|${senderParsed.email}|${recipientParsed.email}|${messageId || subject || ''}`;
    if (seenSignatures.has(sigKey)) {
      duplicateCount++;
      rejections.push({
        rowNumber: rowNum,
        reason: 'Duplicate email activity record detected',
        rawSnippet: `${senderParsed.email} -> ${recipientParsed.email}`,
      });
      return;
    }
    seenSignatures.add(sigKey);

    const record: NormalizedEmailRecord = {
      id: `rec-${rowNum}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: timeParsed.iso,
      date: timeParsed.dateStr,
      hour: timeParsed.hour,
      sender: senderParsed.email,
      senderDomain: senderParsed.domain,
      recipient: recipientParsed.email,
      recipientDomain: recipientParsed.domain,
      direction,
      status: statusParsed.status,
      rawStatus: statusParsed.raw,
      subject,
      messageId,
      sizeBytes,
      latencyMs,
      sourceIp,
      threatClassification,
      errorDetail,
    };

    records.push(record);
  });

  return {
    records,
    acceptedCount: records.length,
    rejectedCount: rejections.length - duplicateCount,
    duplicateCount,
    rejections,
  };
}

/**
 * Parses a CSV string or File into raw row objects.
 */
export function parseCsvFile(fileContent: string): Promise<{ rows: RawEmailRecord[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    if (!fileContent || !fileContent.trim()) {
      return reject(new Error('Uploaded CSV file is completely empty.'));
    }
    Papa.parse<RawEmailRecord>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({ rows: results.data, headers });
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing error: ${error?.message || String(error)}`));
      },
    });
  });
}

/**
 * Parses an Excel ArrayBuffer (XLSX or XLS) into raw row objects.
 */
export function parseExcelBuffer(buffer: ArrayBuffer): { rows: RawEmailRecord[]; headers: string[] } {
  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no sheets.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<RawEmailRecord>(worksheet, { defval: '' });
    
    // Extract headers from first row keys or sheet range
    const headers: string[] = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    return { rows: jsonData, headers };
  } catch (err: any) {
    throw new Error(`Excel parsing failure: ${err.message || 'Malformed spreadsheet file'}`);
  }
}
