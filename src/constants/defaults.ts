/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterState, SecurityConfig } from '../types/email.ts';

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  outboundVolumeThreshold: 15,
  failureRateThreshold: 20, // 20%
  repeatedFailureThreshold: 3, // 3 failures for sender/recipient
  businessHoursStart: 8, // 08:00
  businessHoursEnd: 18, // 18:00
  burstThreshold: 6, // 6 messages within burstIntervalMinutes
  burstIntervalMinutes: 5,
  baselineMultiplier: 2.5,
  minBaselineRecords: 4,
  timeZone: 'UTC',
  aiReportEnabled: true,
};

export const INITIAL_FILTER_STATE: FilterState = {
  startDate: '',
  endDate: '',
  direction: 'All',
  status: 'All',
  senderQuery: '',
  recipientQuery: '',
  domainQuery: '',
  messageIdQuery: '',
};

export const STANDARD_COLUMNS = [
  { key: 'timestamp', label: 'Date / Timestamp', required: true, hint: 'e.g. Date, Received, Timestamp, EventTime' },
  { key: 'sender', label: 'Sender Address', required: true, hint: 'e.g. Sender, SenderAddress, From, P1Sender' },
  { key: 'recipient', label: 'Recipient Address', required: true, hint: 'e.g. Recipient, RecipientAddress, To, P1Recipient' },
  { key: 'status', label: 'Delivery Status', required: true, hint: 'e.g. Status, DeliveryStatus, Action, EventId' },
  { key: 'direction', label: 'Direction', required: false, hint: 'e.g. Direction, MessageDirection, TrafficType' },
  { key: 'subject', label: 'Subject (Optional)', required: false, hint: 'e.g. Subject, MessageSubject' },
  { key: 'messageId', label: 'Message ID (Optional)', required: false, hint: 'e.g. MessageId, NetworkMessageId, Message-ID' },
  { key: 'sizeBytes', label: 'Size in Bytes (Optional)', required: false, hint: 'e.g. Size, TotalBytes, MessageSize' },
  { key: 'latencyMs', label: 'Delivery Latency ms (Optional)', required: false, hint: 'e.g. Latency, Duration, DeliveryLatency' },
  { key: 'sourceIp', label: 'Source IP Address (Optional)', required: false, hint: 'e.g. ClientIP, SourceIP, OriginalClientIP' },
  { key: 'threatClassification', label: 'Threat / Spam Classification', required: false, hint: 'e.g. ThreatClassification, SpamVerdict' },
  { key: 'errorDetail', label: 'Error Code / Reason (Optional)', required: false, hint: 'e.g. ErrorDetail, LastError, FailureReason' },
] as const;
