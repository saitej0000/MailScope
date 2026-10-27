/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmailDirection = 'Inbound' | 'Outbound' | 'Internal' | 'Unknown';

export type DeliveryStatus =
  | 'Delivered'
  | 'Failed'
  | 'Deferred'
  | 'Pending'
  | 'Expanded'
  | 'Quarantined'
  | 'Unknown';

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertStatus = 'New' | 'Investigating' | 'Resolved' | 'False Positive';

export interface RawEmailRecord {
  [key: string]: any;
}

export interface NormalizedEmailRecord {
  id: string;
  timestamp: string; // ISO 8601 string
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  sender: string; // normalized lowercase email
  senderDomain: string;
  recipient: string; // normalized lowercase email
  recipientDomain: string;
  direction: EmailDirection;
  status: DeliveryStatus;
  rawStatus: string;
  subject?: string;
  messageId?: string;
  sizeBytes?: number;
  latencyMs?: number;
  sourceIp?: string;
  threatClassification?: string;
  errorDetail?: string;
}

export interface ColumnMapping {
  timestamp: string;
  sender: string;
  recipient: string;
  direction?: string;
  status: string;
  subject?: string;
  messageId?: string;
  sizeBytes?: string;
  latencyMs?: string;
  sourceIp?: string;
  threatClassification?: string;
  errorDetail?: string;
}

export interface RejectionDetail {
  rowNumber: number;
  reason: string;
  rawSnippet?: string;
}

export interface ImportSummary {
  fileName: string;
  fileSizeBytes: number;
  fileType: 'csv' | 'xlsx' | 'xls' | 'demo';
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  duplicateRows: number;
  rejectionDetails: RejectionDetail[];
  mappedColumns: Record<string, string>;
  detectedHeaders: string[];
  importedAt: string;
}

export interface SecurityAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  affectedEntity: string;
  entityType: 'sender' | 'recipient' | 'system';
  timestamp: string;
  observedValue: string | number;
  threshold: string | number;
  evidenceExplanation: string;
  recommendedAction: string;
  status: AlertStatus;
  relatedRecordIds: string[];
  notes?: string;
  updatedAt?: string;
}

export interface SecurityConfig {
  outboundVolumeThreshold: number;
  failureRateThreshold: number; // percentage, e.g. 20
  repeatedFailureThreshold: number; // e.g. 3
  businessHoursStart: number; // e.g. 8 (08:00)
  businessHoursEnd: number; // e.g. 18 (18:00)
  burstThreshold: number; // e.g. 8 messages
  burstIntervalMinutes: number; // e.g. 5 minutes
  baselineMultiplier: number; // e.g. 2.5x normal
  minBaselineRecords: number; // e.g. 5
  timeZone: string;
  aiReportEnabled: boolean;
}

export interface FilterState {
  startDate: string; // YYYY-MM-DD or empty
  endDate: string; // YYYY-MM-DD or empty
  direction: 'All' | EmailDirection;
  status: 'All' | DeliveryStatus;
  senderQuery: string;
  recipientQuery: string;
  domainQuery: string;
  messageIdQuery: string;
}

export interface AggregatedMetrics {
  totalRecords: number;
  sentRecords: number;
  receivedRecords: number;
  internalRecords: number;
  unknownDirectionRecords: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deferredDeliveries: number;
  pendingDeliveries: number;
  unknownStatusDeliveries: number;
  deliverySuccessRate: number; // percentage
  deliveryFailureRate: number; // percentage
  uniqueSenders: number;
  uniqueRecipients: number;
  averageLatencyMs: number | null;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  volumeOverTime: Array<{
    date: string;
    total: number;
    sent: number;
    received: number;
    failed: number;
  }>;
  statusDistribution: Array<{
    status: DeliveryStatus;
    count: number;
    percentage: number;
  }>;
  directionDistribution: Array<{
    direction: EmailDirection;
    count: number;
    percentage: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    label: string;
    count: number;
    failed: number;
  }>;
  topSenders: Array<{
    sender: string;
    domain: string;
    count: number;
    failed: number;
    failureRate: number;
  }>;
  topRecipients: Array<{
    recipient: string;
    domain: string;
    count: number;
  }>;
  recurringFailures: Array<{
    entity: string;
    type: 'sender' | 'recipient';
    failureCount: number;
    lastError?: string;
    sampleMessageId?: string;
  }>;
  uniqueMessageCount?: number;
}
