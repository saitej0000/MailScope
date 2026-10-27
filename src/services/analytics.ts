/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AggregatedMetrics,
  DeliveryStatus,
  EmailDirection,
  FilterState,
  NormalizedEmailRecord,
} from '../types/email.ts';

/**
 * Filter email records based on active filter criteria.
 */
export function filterRecords(
  records: NormalizedEmailRecord[],
  filter: FilterState
): NormalizedEmailRecord[] {
  return records.filter((rec) => {
    // Date range filter
    if (filter.startDate && rec.date < filter.startDate) {
      return false;
    }
    if (filter.endDate && rec.date > filter.endDate) {
      return false;
    }

    // Direction filter
    if (filter.direction !== 'All' && rec.direction !== filter.direction) {
      return false;
    }

    // Delivery status filter
    if (filter.status !== 'All' && rec.status !== filter.status) {
      return false;
    }

    // Sender search query
    if (filter.senderQuery) {
      const q = filter.senderQuery.toLowerCase().trim();
      if (!rec.sender.includes(q)) return false;
    }

    // Recipient search query
    if (filter.recipientQuery) {
      const q = filter.recipientQuery.toLowerCase().trim();
      if (!rec.recipient.includes(q)) return false;
    }

    // Domain query (checks sender or recipient domain)
    if (filter.domainQuery) {
      const q = filter.domainQuery.toLowerCase().trim();
      if (!rec.senderDomain.includes(q) && !rec.recipientDomain.includes(q)) {
        return false;
      }
    }

    // Message ID query
    if (filter.messageIdQuery) {
      const q = filter.messageIdQuery.toLowerCase().trim();
      if (!rec.messageId || !rec.messageId.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes exact enterprise analytical metrics and distributions for active records.
 */
export function computeAggregatedMetrics(records: NormalizedEmailRecord[]): AggregatedMetrics {
  const totalRecords = records.length;

  let sentRecords = 0;
  let receivedRecords = 0;
  let internalRecords = 0;
  let unknownDirectionRecords = 0;

  let successfulDeliveries = 0;
  let failedDeliveries = 0;
  let deferredDeliveries = 0;
  let pendingDeliveries = 0;
  let unknownStatusDeliveries = 0;

  const senderSet = new Set<string>();
  const recipientSet = new Set<string>();
  const uniqueMessageIds = new Set<string>();

  const senderStatsMap = new Map<string, { domain: string; count: number; failed: number }>();
  const recipientStatsMap = new Map<string, { domain: string; count: number }>();
  const recurringFailureSenderMap = new Map<string, { count: number; lastError?: string; sampleMsg?: string }>();
  const recurringFailureRecipientMap = new Map<string, { count: number; lastError?: string; sampleMsg?: string }>();

  const dateMap = new Map<string, { total: number; sent: number; received: number; failed: number }>();
  const hourlyCount = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
    count: 0,
    failed: 0,
  }));

  let totalLatency = 0;
  let validLatencyCount = 0;

  for (const rec of records) {
    // Unique participants
    if (rec.sender) senderSet.add(rec.sender);
    if (rec.recipient) recipientSet.add(rec.recipient);
    if (rec.messageId) uniqueMessageIds.add(rec.messageId);

    // Direction classification
    if (rec.direction === 'Outbound') sentRecords++;
    else if (rec.direction === 'Inbound') receivedRecords++;
    else if (rec.direction === 'Internal') internalRecords++;
    else unknownDirectionRecords++;

    // Delivery Status classification
    if (rec.status === 'Delivered') successfulDeliveries++;
    else if (rec.status === 'Failed') failedDeliveries++;
    else if (rec.status === 'Deferred') deferredDeliveries++;
    else if (rec.status === 'Pending') pendingDeliveries++;
    else unknownStatusDeliveries++;

    // Latency aggregation (strictly valid non-negative numbers)
    if (typeof rec.latencyMs === 'number' && !isNaN(rec.latencyMs) && rec.latencyMs >= 0) {
      totalLatency += rec.latencyMs;
      validLatencyCount++;
    }

    // Sender aggregation
    const curSender = senderStatsMap.get(rec.sender) || { domain: rec.senderDomain, count: 0, failed: 0 };
    curSender.count++;
    if (rec.status === 'Failed') curSender.failed++;
    senderStatsMap.set(rec.sender, curSender);

    // Recipient aggregation
    const curRecip = recipientStatsMap.get(rec.recipient) || { domain: rec.recipientDomain, count: 0 };
    curRecip.count++;
    recipientStatsMap.set(rec.recipient, curRecip);

    // Failure tracking for sender and recipient
    if (rec.status === 'Failed') {
      const sFail = recurringFailureSenderMap.get(rec.sender) || { count: 0 };
      sFail.count++;
      if (rec.errorDetail) sFail.lastError = rec.errorDetail;
      if (rec.messageId) sFail.sampleMsg = rec.messageId;
      recurringFailureSenderMap.set(rec.sender, sFail);

      const rFail = recurringFailureRecipientMap.get(rec.recipient) || { count: 0 };
      rFail.count++;
      if (rec.errorDetail) rFail.lastError = rec.errorDetail;
      if (rec.messageId) rFail.sampleMsg = rec.messageId;
      recurringFailureRecipientMap.set(rec.recipient, rFail);
    }

    // Time-series date grouping
    const dateEntry = dateMap.get(rec.date) || { total: 0, sent: 0, received: 0, failed: 0 };
    dateEntry.total++;
    if (rec.direction === 'Outbound') dateEntry.sent++;
    if (rec.direction === 'Inbound') dateEntry.received++;
    if (rec.status === 'Failed') dateEntry.failed++;
    dateMap.set(rec.date, dateEntry);

    // Hourly activity
    if (rec.hour >= 0 && rec.hour < 24) {
      hourlyCount[rec.hour].count++;
      if (rec.status === 'Failed') hourlyCount[rec.hour].failed++;
    }
  }

  // Delivery rate calculations:
  // known final outcomes = Delivered + Failed (excludes deferred, pending, and unknown)
  const knownFinalOutcomes = successfulDeliveries + failedDeliveries;
  const deliverySuccessRate = knownFinalOutcomes > 0
    ? Number(((successfulDeliveries / knownFinalOutcomes) * 100).toFixed(1))
    : 0;
  const deliveryFailureRate = knownFinalOutcomes > 0
    ? Number(((failedDeliveries / knownFinalOutcomes) * 100).toFixed(1))
    : 0;

  const averageLatencyMs = validLatencyCount > 0
    ? Math.round(totalLatency / validLatencyCount)
    : null;

  // Deterministic top senders (count desc, then email asc)
  const topSenders = Array.from(senderStatsMap.entries())
    .map(([sender, data]) => ({
      sender,
      domain: data.domain,
      count: data.count,
      failed: data.failed,
      failureRate: data.count > 0 ? Number(((data.failed / data.count) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.sender.localeCompare(b.sender);
    })
    .slice(0, 10);

  // Deterministic top recipients (count desc, then email asc)
  const topRecipients = Array.from(recipientStatsMap.entries())
    .map(([recipient, data]) => ({
      recipient,
      domain: data.domain,
      count: data.count,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.recipient.localeCompare(b.recipient);
    })
    .slice(0, 10);

  // Time-series ordered chronologically
  const volumeOverTime = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      total: data.total,
      sent: data.sent,
      received: data.received,
      failed: data.failed,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Status distribution
  const statusCounts: Record<DeliveryStatus, number> = {
    Delivered: successfulDeliveries,
    Failed: failedDeliveries,
    Deferred: deferredDeliveries,
    Pending: pendingDeliveries,
    Expanded: records.filter((r) => r.status === 'Expanded').length,
    Quarantined: records.filter((r) => r.status === 'Quarantined').length,
    Unknown: unknownStatusDeliveries,
  };

  const statusDistribution = (Object.keys(statusCounts) as DeliveryStatus[])
    .filter((st) => statusCounts[st] > 0)
    .map((status) => ({
      status,
      count: statusCounts[status],
      percentage: totalRecords > 0 ? Number(((statusCounts[status] / totalRecords) * 100).toFixed(1)) : 0,
    }));

  // Direction distribution
  const dirCounts: Record<EmailDirection, number> = {
    Outbound: sentRecords,
    Inbound: receivedRecords,
    Internal: internalRecords,
    Unknown: unknownDirectionRecords,
  };

  const directionDistribution = (Object.keys(dirCounts) as EmailDirection[])
    .filter((d) => dirCounts[d] > 0)
    .map((direction) => ({
      direction,
      count: dirCounts[direction],
      percentage: totalRecords > 0 ? Number(((dirCounts[direction] / totalRecords) * 100).toFixed(1)) : 0,
    }));

  // Recurring failures (minimum 2 failures)
  const recurringFailures: Array<{
    entity: string;
    type: 'sender' | 'recipient';
    failureCount: number;
    lastError?: string;
    sampleMessageId?: string;
  }> = [];

  for (const [entity, data] of recurringFailureRecipientMap.entries()) {
    if (data.count >= 2) {
      recurringFailures.push({
        entity,
        type: 'recipient',
        failureCount: data.count,
        lastError: data.lastError,
        sampleMessageId: data.sampleMsg,
      });
    }
  }

  for (const [entity, data] of recurringFailureSenderMap.entries()) {
    if (data.count >= 2) {
      recurringFailures.push({
        entity,
        type: 'sender',
        failureCount: data.count,
        lastError: data.lastError,
        sampleMessageId: data.sampleMsg,
      });
    }
  }

  recurringFailures.sort((a, b) => b.failureCount - a.failureCount);

  return {
    totalRecords,
    sentRecords,
    receivedRecords,
    internalRecords,
    unknownDirectionRecords,
    successfulDeliveries,
    failedDeliveries,
    deferredDeliveries,
    pendingDeliveries,
    unknownStatusDeliveries,
    deliverySuccessRate,
    deliveryFailureRate,
    uniqueSenders: senderSet.size,
    uniqueRecipients: recipientSet.size,
    averageLatencyMs,
    totalAlerts: 0, // Injected by security module
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    volumeOverTime,
    statusDistribution,
    directionDistribution,
    hourlyActivity: hourlyCount,
    topSenders,
    topRecipients,
    recurringFailures: recurringFailures.slice(0, 15),
    uniqueMessageCount: uniqueMessageIds.size > 0 ? uniqueMessageIds.size : undefined,
  };
}
