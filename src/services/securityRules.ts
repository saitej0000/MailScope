/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NormalizedEmailRecord,
  SecurityAlert,
  SecurityConfig,
} from '../types/email.ts';

/**
 * Evaluates active dataset against 9 configurable security and anomaly detection rules.
 */
export function evaluateSecurityRules(
  records: NormalizedEmailRecord[],
  config: SecurityConfig,
  existingAlerts: SecurityAlert[] = []
): SecurityAlert[] {
  if (records.length === 0) return [];

  // Map to preserve alert status, notes, and user overrides from previous runs
  const existingStatusMap = new Map<string, { status: SecurityAlert['status']; notes?: string; updatedAt?: string }>();
  for (const alt of existingAlerts) {
    existingStatusMap.set(`${alt.ruleId}|${alt.affectedEntity}`, {
      status: alt.status,
      notes: alt.notes,
      updatedAt: alt.updatedAt,
    });
  }

  const generatedAlerts: SecurityAlert[] = [];
  let alertSeq = 1;

  const createAlert = (
    ruleId: string,
    ruleName: string,
    severity: SecurityAlert['severity'],
    affectedEntity: string,
    entityType: SecurityAlert['entityType'],
    timestamp: string,
    observedValue: string | number,
    threshold: string | number,
    evidenceExplanation: string,
    recommendedAction: string,
    relatedRecordIds: string[]
  ): SecurityAlert => {
    const key = `${ruleId}|${affectedEntity}`;
    const preserved = existingStatusMap.get(key);
    const id = `ALT-${String(alertSeq++).padStart(3, '0')}`;

    return {
      id,
      ruleId,
      ruleName,
      severity,
      affectedEntity,
      entityType,
      timestamp,
      observedValue,
      threshold,
      evidenceExplanation,
      recommendedAction,
      status: preserved?.status || 'New',
      notes: preserved?.notes,
      updatedAt: preserved?.updatedAt,
      relatedRecordIds,
    };
  };

  // Pre-aggregate data for rules
  const outboundSenderMap = new Map<string, NormalizedEmailRecord[]>();
  const allSenderMap = new Map<string, NormalizedEmailRecord[]>();
  const recipientFailMap = new Map<string, NormalizedEmailRecord[]>();
  const senderFailMap = new Map<string, NormalizedEmailRecord[]>();
  const messageIdMap = new Map<string, NormalizedEmailRecord[]>();
  const senderIpsMap = new Map<string, Set<string>>();

  let unknownStatusCount = 0;
  let missingMessageIdCount = 0;

  for (const rec of records) {
    // Senders
    const allSend = allSenderMap.get(rec.sender) || [];
    allSend.push(rec);
    allSenderMap.set(rec.sender, allSend);

    if (rec.direction === 'Outbound') {
      const outList = outboundSenderMap.get(rec.sender) || [];
      outList.push(rec);
      outboundSenderMap.set(rec.sender, outList);
    }

    // Failures
    if (rec.status === 'Failed') {
      const sFail = senderFailMap.get(rec.sender) || [];
      sFail.push(rec);
      senderFailMap.set(rec.sender, sFail);

      const rFail = recipientFailMap.get(rec.recipient) || [];
      rFail.push(rec);
      recipientFailMap.set(rec.recipient, rFail);
    }

    // Message ID tracking
    if (rec.messageId) {
      const mList = messageIdMap.get(rec.messageId) || [];
      mList.push(rec);
      messageIdMap.set(rec.messageId, mList);
    } else {
      missingMessageIdCount++;
    }

    // Source IP tracking
    if (rec.sourceIp) {
      const ips = senderIpsMap.get(rec.sender) || new Set<string>();
      ips.add(rec.sourceIp);
      senderIpsMap.set(rec.sender, ips);
    }

    if (rec.status === 'Unknown') {
      unknownStatusCount++;
    }
  }

  // RULE 1: Unusually high outbound email volume from a sender
  for (const [sender, outList] of outboundSenderMap.entries()) {
    if (outList.length >= config.outboundVolumeThreshold) {
      const latest = outList[outList.length - 1];
      generatedAlerts.push(
        createAlert(
          'RULE_HIGH_OUTBOUND_VOLUME',
          'Unusually High Outbound Volume',
          outList.length >= config.outboundVolumeThreshold * 2 ? 'Critical' : 'High',
          sender,
          'sender',
          latest.timestamp,
          `${outList.length} outbound records`,
          `${config.outboundVolumeThreshold} records`,
          `Sender dispatched ${outList.length} outbound messages, exceeding the threshold of ${config.outboundVolumeThreshold}. High volume is an indicator for review, not conclusive proof of account compromise.`,
          'Audit recent mailbox sign-ins, verify user consent grants in Entra ID, and check if automated marketing or notification scripts were authorized.',
          outList.slice(0, 20).map((r) => r.id)
        )
      );
    }
  }

  // RULE 2: High proportion of delivery failures for a sender
  for (const [sender, allList] of allSenderMap.entries()) {
    if (allList.length >= 4) {
      const fails = senderFailMap.get(sender) || [];
      const failRate = (fails.length / allList.length) * 100;
      if (failRate >= config.failureRateThreshold && fails.length >= 2) {
        const latest = fails[fails.length - 1];
        generatedAlerts.push(
          createAlert(
            'RULE_HIGH_FAILURE_RATE',
            'Elevated Delivery Failure Rate',
            failRate >= 50 ? 'High' : 'Medium',
            sender,
            'sender',
            latest.timestamp,
            `${failRate.toFixed(1)}% (${fails.length}/${allList.length})`,
            `${config.failureRateThreshold}%`,
            `Sender experienced a ${failRate.toFixed(1)}% bounce/failure rate across ${allList.length} attempts. May indicate an unverified recipient list or compromised mailbox generating spam.`,
            'Inspect Non-Delivery Reports (NDRs), check DNS SPF/DKIM alignment for outgoing routes, and review recipient addresses for scraping artifacts.',
            fails.map((r) => r.id)
          )
        );
      }
    }
  }

  // RULE 3: Repeated delivery failures associated with a sender or recipient
  for (const [recipient, fails] of recipientFailMap.entries()) {
    if (fails.length >= config.repeatedFailureThreshold) {
      const latest = fails[fails.length - 1];
      generatedAlerts.push(
        createAlert(
          'RULE_REPEATED_FAILURES',
          'Repeated Delivery Failures to Recipient',
          fails.length >= config.repeatedFailureThreshold * 2 ? 'High' : 'Medium',
          recipient,
          'recipient',
          latest.timestamp,
          `${fails.length} consecutive failures`,
          `${config.repeatedFailureThreshold} failures`,
          `Persistent delivery failures targeting recipient ${recipient}. Last error reported: "${latest.errorDetail || latest.rawStatus}".`,
          'Verify if the destination mailbox exists, check for remote mail exchanger MX blocks, or remove obsolete address from internal distribution lists.',
          fails.map((r) => r.id)
        )
      );
    }
  }

  // RULE 4: Activity outside configured business hours
  for (const [sender, allList] of allSenderMap.entries()) {
    const afterHours = allList.filter((r) => {
      // rec.hour is UTC (0-23)
      return r.hour < config.businessHoursStart || r.hour >= config.businessHoursEnd;
    });

    // Flag if sender has notable after-hours volume (>= 3 messages outside window)
    if (afterHours.length >= 3) {
      const latest = afterHours[afterHours.length - 1];
      generatedAlerts.push(
        createAlert(
          'RULE_AFTER_HOURS_ACTIVITY',
          'Off-Hours Email Transmission',
          afterHours.length >= 8 ? 'Medium' : 'Low',
          sender,
          'sender',
          latest.timestamp,
          `${afterHours.length} messages outside business hours`,
          `Hours: ${config.businessHoursStart}:00 - ${config.businessHoursEnd}:00`,
          `Sender sent ${afterHours.length} messages outside the configured operational window (${config.businessHoursStart}:00 - ${config.businessHoursEnd}:00). Note that legitimate shift work or scheduled workflows frequently run off-hours.`,
          'Confirm with user or team whether batch tasks or global timezone collaboration explain this schedule.',
          afterHours.slice(0, 15).map((r) => r.id)
        )
      );
    }
  }

  // RULE 5: Short interval burst concentration (burstThreshold within burstIntervalMinutes)
  for (const [sender, allList] of allSenderMap.entries()) {
    if (allList.length >= config.burstThreshold) {
      // Sort sender records by timestamp ascending
      const sorted = [...allList].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      let burstDetected = false;
      const burstWindowMs = config.burstIntervalMinutes * 60 * 1000;

      for (let i = 0; i <= sorted.length - config.burstThreshold; i++) {
        const start = new Date(sorted[i].timestamp).getTime();
        const end = new Date(sorted[i + config.burstThreshold - 1].timestamp).getTime();
        if (end - start <= burstWindowMs) {
          burstDetected = true;
          const burstRecords = sorted.slice(i, i + config.burstThreshold);
          generatedAlerts.push(
            createAlert(
              'RULE_SHORT_INTERVAL_BURST',
              'Rapid Transmission Burst',
              'High',
              sender,
              'sender',
              burstRecords[burstRecords.length - 1].timestamp,
              `${config.burstThreshold}+ messages in < ${config.burstIntervalMinutes} min`,
              `${config.burstThreshold} msg / ${config.burstIntervalMinutes} min`,
              `Sender initiated a rapid burst of ${config.burstThreshold} messages in under ${config.burstIntervalMinutes} minutes. Characteristic of bulk dispatch, mail-bombing scripts, or rapid automated alerting.`,
              'Inspect subject lines and destination domains to distinguish legitimate bulk mailings from rogue mail-forwarding or credential abuse.',
              burstRecords.map((r) => r.id)
            )
          );
          break; // One burst alert per sender to avoid spamming
        }
      }
    }
  }

  // RULE 6: Sudden increase in activity compared with baseline
  for (const [sender, allList] of allSenderMap.entries()) {
    if (allList.length >= config.minBaselineRecords) {
      const dailyCounts = new Map<string, number>();
      for (const r of allList) {
        dailyCounts.set(r.date, (dailyCounts.get(r.date) || 0) + 1);
      }
      if (dailyCounts.size >= 2) {
        const counts = Array.from(dailyCounts.values());
        const total = counts.reduce((a, b) => a + b, 0);
        const avg = total / counts.length;
        const maxDay = Math.max(...counts);

        if (maxDay >= avg * config.baselineMultiplier && maxDay >= 8) {
          const highestDate = Array.from(dailyCounts.entries()).find(([_, c]) => c === maxDay)?.[0] || '';
          const sampleRecords = allList.filter((r) => r.date === highestDate);
          generatedAlerts.push(
            createAlert(
              'RULE_BASELINE_SURGE',
              'Baseline Volume Spike',
              'Medium',
              sender,
              'sender',
              sampleRecords[0]?.timestamp || highestDate,
              `${maxDay} messages on peak day (${avg.toFixed(1)} avg/day)`,
              `${(avg * config.baselineMultiplier).toFixed(1)} messages (${config.baselineMultiplier}x baseline)`,
              `Sender volume surged to ${maxDay} emails on ${highestDate}, which is ${(maxDay / avg).toFixed(1)}x higher than their historical daily baseline of ${avg.toFixed(1)}.`,
              'Review user operational context to confirm if project milestone, quarterly communications, or bulk exports were conducted.',
              sampleRecords.slice(0, 10).map((r) => r.id)
            )
          );
        }
      }
    }
  }

  // RULE 7: Repeated messages with identical message identifier
  for (const [msgId, msgList] of messageIdMap.entries()) {
    if (msgList.length >= 3) {
      const first = msgList[0];
      generatedAlerts.push(
        createAlert(
          'RULE_REPEATED_MESSAGE_ID',
          'Message ID Loop / Replay Anomaly',
          'Low',
          first.sender,
          'sender',
          msgList[msgList.length - 1].timestamp,
          `${msgList.length} duplicate transmissions with ID`,
          '2 identical occurrences',
          `Message ID "${msgId}" appeared ${msgList.length} times across log entries. May indicate mail loop, routing misconfiguration, or client re-send retry loop.`,
          'Examine Exchange transport rules and mail routing loops for the message identifier.',
          msgList.map((r) => r.id)
        )
      );
    }
  }

  // RULE 8: Unusual source IP changes for a single sender (only when sufficient IP data exists)
  for (const [sender, ips] of senderIpsMap.entries()) {
    if (ips.size >= 3) {
      const recordsWithIps = allSenderMap.get(sender)?.filter((r) => r.sourceIp) || [];
      generatedAlerts.push(
        createAlert(
          'RULE_SENDER_IP_SHIFT',
          'Multiple Source IP Transitions',
          'Medium',
          sender,
          'sender',
          recordsWithIps[recordsWithIps.length - 1]?.timestamp || '',
          `${ips.size} unique IPs (${Array.from(ips).slice(0, 3).join(', ')})`,
          'Max 2 client IPs per analysis period',
          `Sender originated outbound messages from ${ips.size} distinct IP addresses within the recorded period. Can be caused by mobile roaming, VPN switching, or simultaneous session hijacking.`,
          'Correlate IP addresses with Entra ID Sign-in Logs and Conditional Access compliance telemetry.',
          recordsWithIps.slice(0, 15).map((r) => r.id)
        )
      );
    }
  }

  // RULE 9: Missing or inconsistent report fields affecting reliability
  if (records.length >= 10) {
    const missingIdPct = (missingMessageIdCount / records.length) * 100;
    const unknownStatusPct = (unknownStatusCount / records.length) * 100;

    if (missingIdPct >= 30 || unknownStatusPct >= 25) {
      generatedAlerts.push(
        createAlert(
          'RULE_DATA_QUALITY_ANOMALY',
          'Report Metadata Deficiency',
          'Low',
          'Dataset Telemetry',
          'system',
          records[0].timestamp,
          `${missingIdPct.toFixed(0)}% missing IDs, ${unknownStatusPct.toFixed(0)}% unclassified statuses`,
          'Max 20% missing key fields',
          `The analyzed dataset has significant missing fields (${missingIdPct.toFixed(1)}% missing message IDs; ${unknownStatusPct.toFixed(1)}% unclassified statuses). Forensic traceability and deduplication confidence are degraded.`,
          'Export message tracking logs directly from Exchange Admin Center (EAC) or PowerShell Get-MessageTrace with full header fields enabled.',
          records.slice(0, 5).map((r) => r.id)
        )
      );
    }
  }

  return generatedAlerts;
}
