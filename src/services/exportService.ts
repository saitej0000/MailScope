/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregatedMetrics, FilterState, NormalizedEmailRecord, SecurityAlert } from '../types/email.ts';
export { generateSampleCsvContent } from '../data/demoData.ts';

/**
 * Sanitizes untrusted spreadsheet text cells to neutralize Formula Injection (CSV Injection).
 * Any cell starting with '=', '+', '-', or '@' is safely prefixed with a single quote.
 */
export function sanitizeForCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // If starts with dangerous spreadsheet formula triggers, prefix with '
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Triggers a browser file download of text content with specified MIME type.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports filtered email records to CSV with formula injection safeguards.
 */
export function exportFilteredRecordsToCsv(records: NormalizedEmailRecord[], filename = 'mailscope-records.csv') {
  const headers = [
    'Timestamp (UTC)',
    'Sender',
    'Sender Domain',
    'Recipient',
    'Recipient Domain',
    'Direction',
    'Delivery Status',
    'Original Status',
    'Subject',
    'Message ID',
    'Size (Bytes)',
    'Latency (ms)',
    'Client IP',
    'Threat Classification',
    'Error Detail'
  ];

  const rows = records.map((r) => [
    sanitizeForCsv(r.timestamp),
    sanitizeForCsv(r.sender),
    sanitizeForCsv(r.senderDomain),
    sanitizeForCsv(r.recipient),
    sanitizeForCsv(r.recipientDomain),
    sanitizeForCsv(r.direction),
    sanitizeForCsv(r.status),
    sanitizeForCsv(r.rawStatus),
    sanitizeForCsv(r.subject || ''),
    sanitizeForCsv(r.messageId || ''),
    r.sizeBytes !== undefined ? r.sizeBytes : '',
    r.latencyMs !== undefined ? r.latencyMs : '',
    sanitizeForCsv(r.sourceIp || ''),
    sanitizeForCsv(r.threatClassification || ''),
    sanitizeForCsv(r.errorDetail || '')
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, filename);
}

/**
 * Exports summary statistics to CSV.
 */
export function exportSummaryStatsToCsv(metrics: AggregatedMetrics, filename = 'mailscope-summary-metrics.csv') {
  const rows = [
    ['Metric', 'Value'],
    ['Total Email Records Analysed', metrics.totalRecords],
    ['Sent Records (Outbound)', metrics.sentRecords],
    ['Received Records (Inbound)', metrics.receivedRecords],
    ['Internal Records', metrics.internalRecords],
    ['Unknown Direction Records', metrics.unknownDirectionRecords],
    ['Successful Deliveries', metrics.successfulDeliveries],
    ['Failed Deliveries', metrics.failedDeliveries],
    ['Deferred Deliveries', metrics.deferredDeliveries],
    ['Pending Deliveries', metrics.pendingDeliveries],
    ['Unclassified Deliveries', metrics.unknownStatusDeliveries],
    ['Delivery Success Rate (%)', `${metrics.deliverySuccessRate}%`],
    ['Delivery Failure Rate (%)', `${metrics.deliveryFailureRate}%`],
    ['Unique Senders', metrics.uniqueSenders],
    ['Unique Recipients', metrics.uniqueRecipients],
    ['Unique Messages Identified', metrics.uniqueMessageCount || 'N/A'],
    ['Average Latency (ms)', metrics.averageLatencyMs !== null ? `${metrics.averageLatencyMs} ms` : 'Not available'],
    ['Total Security Alerts', metrics.totalAlerts],
    ['Critical Alerts', metrics.criticalAlerts],
    ['High Severity Alerts', metrics.highAlerts],
    ['Medium Severity Alerts', metrics.mediumAlerts],
    ['Low Severity Alerts', metrics.lowAlerts]
  ];

  const csv = rows.map((r) => r.map((c) => sanitizeForCsv(c)).join(',')).join('\n');
  downloadFile(csv, filename);
}

/**
 * Exports security alerts to CSV with formula injection safeguards.
 */
export function exportSecurityAlertsToCsv(alerts: SecurityAlert[], filename = 'mailscope-security-alerts.csv') {
  const headers = [
    'Alert ID',
    'Rule ID',
    'Rule Name',
    'Severity',
    'Status',
    'Affected Entity',
    'Entity Type',
    'Detection Timestamp',
    'Observed Value',
    'Configured Threshold',
    'Evidence Explanation',
    'Recommended Action',
    'Related Record Count',
    'Analyst Notes'
  ];

  const rows = alerts.map((a) => [
    sanitizeForCsv(a.id),
    sanitizeForCsv(a.ruleId),
    sanitizeForCsv(a.ruleName),
    sanitizeForCsv(a.severity),
    sanitizeForCsv(a.status),
    sanitizeForCsv(a.affectedEntity),
    sanitizeForCsv(a.entityType),
    sanitizeForCsv(a.timestamp),
    sanitizeForCsv(a.observedValue),
    sanitizeForCsv(a.threshold),
    sanitizeForCsv(a.evidenceExplanation),
    sanitizeForCsv(a.recommendedAction),
    a.relatedRecordIds.length,
    sanitizeForCsv(a.notes || '')
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, filename);
}

/**
 * Generates and triggers print for the printable analytical HTML report.
 */
export function generatePrintableHtmlReport(
  metrics: AggregatedMetrics,
  alerts: SecurityAlert[],
  activeFilters: FilterState,
  datasetSource: string,
  aiReportContent?: string
) {
  const reportDate = new Date().toUTCString();

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable analytical report.');
    return;
  }

  const alertRowsHtml = alerts.map((a) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px; font-family: monospace; font-size: 11px;">${a.id}</td>
      <td style="padding: 8px;">
        <strong style="color: ${a.severity === 'Critical' ? '#be123c' : a.severity === 'High' ? '#c2410c' : a.severity === 'Medium' ? '#b45309' : '#475569'};">
          ${a.severity.toUpperCase()}
        </strong> - ${a.ruleName}
      </td>
      <td style="padding: 8px; font-family: monospace; font-size: 12px;">${a.affectedEntity}</td>
      <td style="padding: 8px; font-size: 12px;">${a.evidenceExplanation}</td>
      <td style="padding: 8px; font-size: 12px; color: #334155;">${a.recommendedAction}</td>
      <td style="padding: 8px; font-size: 12px;">${a.status}</td>
    </tr>
  `).join('');

  const topSendersHtml = metrics.topSenders.map((s, idx) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 6px 8px; color: #64748b;">${idx + 1}</td>
      <td style="padding: 6px 8px; font-family: monospace;">${s.sender}</td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${s.count.toLocaleString()}</td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: ${s.failed > 0 ? '#e11d48' : '#64748b'};">${s.failed} (${s.failureRate}%)</td>
    </tr>
  `).join('');

  const topRecipientsHtml = metrics.topRecipients.map((r, idx) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 6px 8px; color: #64748b;">${idx + 1}</td>
      <td style="padding: 6px 8px; font-family: monospace;">${r.recipient}</td>
      <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${r.count.toLocaleString()}</td>
    </tr>
  `).join('');

  const aiSectionHtml = aiReportContent ? `
    <div style="margin-top: 32px; padding: 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
        AI-Assisted Analytical Assessment (Grounded in Verified Metrics)
      </h3>
      <div style="font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
${aiReportContent}
      </div>
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>MailScope Analytical Report - ${reportDate}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; background: #fff; }
        h1, h2, h3 { color: #0f172a; }
        .grid-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
        .kpi-card { border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; background: #f8fafc; }
        .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em; }
        .kpi-val { font-size: 20px; font-weight: 700; margin-top: 4px; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        th { text-align: left; padding: 8px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; }
        .tag { font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        @media print {
          body { margin: 15mm; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; background: #e0e7ff; padding: 12px 16px; border-radius: 6px;">
        <span style="font-size: 13px; color: #3730a3; font-weight: 500;">MailScope Executive Analytical Report is ready for review or printing.</span>
        <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
          Print / Save as PDF
        </button>
      </div>

      <header style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div>
            <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.02em;">MailScope — Office 365 Email Activity Analyzer</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Email Analytics, Delivery Insights & Security Monitoring</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <div><strong>Generated:</strong> ${reportDate}</div>
            <div><strong>Dataset Source:</strong> ${datasetSource}</div>
          </div>
        </div>
      </header>

      <section>
        <h2 style="font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">1. Operational KPI Summary</h2>
        <div class="grid-kpi">
          <div class="kpi-card">
            <div class="kpi-title">Total Records</div>
            <div class="kpi-val">${metrics.totalRecords.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Outbound (Sent)</div>
            <div class="kpi-val">${metrics.sentRecords.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Inbound (Received)</div>
            <div class="kpi-val">${metrics.receivedRecords.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Delivery Success Rate</div>
            <div class="kpi-val" style="color: ${metrics.deliverySuccessRate >= 95 ? '#15803d' : '#b45309'};">${metrics.deliverySuccessRate}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Successful Deliveries</div>
            <div class="kpi-val" style="color: #15803d;">${metrics.successfulDeliveries.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Failed Deliveries</div>
            <div class="kpi-val" style="color: ${metrics.failedDeliveries > 0 ? '#be123c' : '#334155'};">${metrics.failedDeliveries.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Unique Senders</div>
            <div class="kpi-val">${metrics.uniqueSenders.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Security Alerts</div>
            <div class="kpi-val" style="color: ${metrics.totalAlerts > 0 ? '#be123c' : '#334155'};">${metrics.totalAlerts}</div>
          </div>
        </div>
      </section>

      <section style="margin-top: 24px;">
        <h2 style="font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">2. Top Communicating Entities</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <h3 style="font-size: 13px; text-transform: uppercase; color: #475569;">Top Senders (by records)</h3>
            <table>
              <thead>
                <tr><th>#</th><th>Sender</th><th style="text-align: right;">Count</th><th style="text-align: right;">Failed</th></tr>
              </thead>
              <tbody>${topSendersHtml || '<tr><td colspan="4">No sender data</td></tr>'}</tbody>
            </table>
          </div>
          <div>
            <h3 style="font-size: 13px; text-transform: uppercase; color: #475569;">Top Recipients (by records)</h3>
            <table>
              <thead>
                <tr><th>#</th><th>Recipient</th><th style="text-align: right;">Count</th></tr>
              </thead>
              <tbody>${topRecipientsHtml || '<tr><td colspan="3">No recipient data</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section style="margin-top: 32px;">
        <h2 style="font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">3. Rule-Based Security Alerts & Anomalies (${alerts.length})</h2>
        ${alerts.length === 0 ? '<p style="font-size: 13px; color: #64748b;">No security anomalies or threshold violations detected under configured rules.</p>' : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Rule & Severity</th>
                <th>Entity</th>
                <th>Evidence & Explanation</th>
                <th>Recommended Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${alertRowsHtml}
            </tbody>
          </table>
        `}
      </section>

      ${aiSectionHtml}

      <footer style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>MailScope - Academic Micro-Project in Information and Cyber Security</span>
        <span>Confidential Organizational Metadata Assessment</span>
      </footer>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
