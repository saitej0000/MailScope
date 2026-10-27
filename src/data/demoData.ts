/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedEmailRecord, RawEmailRecord } from '../types/email.ts';

/**
 * Standard synthetic raw records mimicking Microsoft 365 Message Trace CSV exports.
 * All data is strictly synthetic and labeled as demo.
 */
export const SYNTHETIC_M365_RAW_ROWS: RawEmailRecord[] = [
  // Outbound normal business day
  {
    "Date(UTC)": "2026-10-20 09:12:05",
    "Sender Address": "sarah.chen@contoso.com",
    "Recipient Address": "michael.scott@dundermifflin.com",
    "Subject": "Q3 Performance Review & Deliverables",
    "Direction": "Outbound",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261020-0912-001@contoso.com>",
    "Size(bytes)": 42150,
    "Delivery Latency(ms)": 240,
    "Original Client IP": "198.51.100.14",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-20 09:15:22",
    "Sender Address": "sarah.chen@contoso.com",
    "Recipient Address": "claire.dunphy@pritchettclosets.com",
    "Subject": "Vendor agreement updates",
    "Direction": "Outbound",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261020-0915-002@contoso.com>",
    "Size(bytes)": 15820,
    "Delivery Latency(ms)": 180,
    "Original Client IP": "198.51.100.14",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-20 09:30:11",
    "Sender Address": "hr-announcements@contoso.com",
    "Recipient Address": "all-staff@contoso.com",
    "Subject": "Benefits Open Enrollment Notice",
    "Direction": "Internal",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261020-0930-003@contoso.com>",
    "Size(bytes)": 98400,
    "Delivery Latency(ms)": 95,
    "Original Client IP": "198.51.100.2",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },

  // Recurring Failure Scenario: recipient "accounting@defunct-vendor.org" failing repeatedly
  {
    "Date(UTC)": "2026-10-20 10:04:12",
    "Sender Address": "billing@contoso.com",
    "Recipient Address": "accounting@defunct-vendor.org",
    "Subject": "Invoice Payment Remittance #84210",
    "Direction": "Outbound",
    "Delivery Status": "Failed",
    "Message ID": "<CON-20261020-1004-004@contoso.com>",
    "Size(bytes)": 34500,
    "Delivery Latency(ms)": 1250,
    "Original Client IP": "198.51.100.45",
    "Threat Classification": "Clean",
    "Error Detail": "550 5.1.1 User unknown; destination domain does not exist"
  },
  {
    "Date(UTC)": "2026-10-21 10:05:00",
    "Sender Address": "billing@contoso.com",
    "Recipient Address": "accounting@defunct-vendor.org",
    "Subject": "RE: Invoice Payment Remittance #84210 (Resend)",
    "Direction": "Outbound",
    "Delivery Status": "Failed",
    "Message ID": "<CON-20261021-1005-005@contoso.com>",
    "Size(bytes)": 34800,
    "Delivery Latency(ms)": 1100,
    "Original Client IP": "198.51.100.45",
    "Threat Classification": "Clean",
    "Error Detail": "550 5.1.1 User unknown; destination domain does not exist"
  },
  {
    "Date(UTC)": "2026-10-22 10:10:44",
    "Sender Address": "billing@contoso.com",
    "Recipient Address": "accounting@defunct-vendor.org",
    "Subject": "FINAL NOTICE: Invoice Payment Remittance #84210",
    "Direction": "Outbound",
    "Delivery Status": "Failed",
    "Message ID": "<CON-20261022-1010-006@contoso.com>",
    "Size(bytes)": 35200,
    "Delivery Latency(ms)": 1320,
    "Original Client IP": "198.51.100.45",
    "Threat Classification": "Clean",
    "Error Detail": "550 5.1.1 User unknown; destination domain does not exist"
  },

  // Inbound normal activity
  {
    "Date(UTC)": "2026-10-20 11:20:18",
    "Sender Address": "jason.bourne@treadstone-supply.net",
    "Recipient Address": "procurement@contoso.com",
    "Subject": "Hardware dispatch confirmation",
    "Direction": "Inbound",
    "Delivery Status": "Delivered",
    "Message ID": "<TS-20261020-1120-101@treadstone-supply.net>",
    "Size(bytes)": 28400,
    "Delivery Latency(ms)": 310,
    "Original Client IP": "203.0.113.88",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-20 11:45:00",
    "Sender Address": "support@saas-cloud-monitoring.io",
    "Recipient Address": "devops-alerts@contoso.com",
    "Subject": "[RESOLVED] US-East Gateway Latency Alert",
    "Direction": "Inbound",
    "Delivery Status": "Delivered",
    "Message ID": "<MON-20261020-1145-202@saas-cloud-monitoring.io>",
    "Size(bytes)": 14200,
    "Delivery Latency(ms)": 160,
    "Original Client IP": "192.0.2.77",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },

  // Deferred delivery example (greylisted)
  {
    "Date(UTC)": "2026-10-20 13:10:00",
    "Sender Address": "alex.reed@contoso.com",
    "Recipient Address": "contact@secure-enterprise-gate.com",
    "Subject": "Project Horizon Milestone Architecture",
    "Direction": "Outbound",
    "Delivery Status": "Deferred",
    "Message ID": "<CON-20261020-1310-007@contoso.com>",
    "Size(bytes)": 128900,
    "Delivery Latency(ms)": 840,
    "Original Client IP": "198.51.100.58",
    "Threat Classification": "Clean",
    "Error Detail": "451 4.7.1 Greylisting in action, please retry later"
  },

  // Quarantined spam inbound
  {
    "Date(UTC)": "2026-10-20 14:02:50",
    "Sender Address": "urgent-payroll-update@secure-hr-verify-portal.top",
    "Recipient Address": "finance.dept@contoso.com",
    "Subject": "ACTION REQUIRED: Direct Deposit Credentials Validation",
    "Direction": "Inbound",
    "Delivery Status": "Quarantined",
    "Message ID": "<SPAM-20261020-1402-999@secure-hr-verify-portal.top>",
    "Size(bytes)": 11200,
    "Delivery Latency(ms)": 45,
    "Original Client IP": "185.220.101.5",
    "Threat Classification": "HighConfidencePhish",
    "Error Detail": "Message quarantined by Microsoft Defender for Office 365"
  },

  // After-hours activity: Transmission at 02:30 AM UTC
  {
    "Date(UTC)": "2026-10-21 02:30:15",
    "Sender Address": "carlos.mendoza@contoso.com",
    "Recipient Address": "asia-pacific-partner@tokyo-dist.jp",
    "Subject": "Firmware binary patch v4.2.1 signed",
    "Direction": "Outbound",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261021-0230-008@contoso.com>",
    "Size(bytes)": 845000,
    "Delivery Latency(ms)": 420,
    "Original Client IP": "198.51.100.99",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-21 02:45:00",
    "Sender Address": "carlos.mendoza@contoso.com",
    "Recipient Address": "support@tokyo-dist.jp",
    "Subject": "Deployment runbook checklist",
    "Direction": "Outbound",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261021-0245-009@contoso.com>",
    "Size(bytes)": 48200,
    "Delivery Latency(ms)": 390,
    "Original Client IP": "198.51.100.99",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-21 03:15:20",
    "Sender Address": "carlos.mendoza@contoso.com",
    "Recipient Address": "qa-team@tokyo-dist.jp",
    "Subject": "Validation telemetry results",
    "Direction": "Outbound",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261021-0315-010@contoso.com>",
    "Size(bytes)": 62100,
    "Delivery Latency(ms)": 350,
    "Original Client IP": "198.51.100.99",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },

  // High outbound volume & short interval burst: alex.reed@contoso.com sending rapid messages
  ...Array.from({ length: 18 }, (_, idx) => {
    const min = 10 + Math.floor(idx / 3);
    const sec = (idx % 3) * 18;
    const isFailed = idx === 16;
    const ip = idx > 12 ? "198.51.100.220" : idx > 6 ? "198.51.100.115" : "198.51.100.58"; // Multiple IPs for IP shift rule
    return {
      "Date(UTC)": `2026-10-21 14:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
      "Sender Address": "alex.reed@contoso.com",
      "Recipient Address": `client-${idx + 1}@external-customer-${(idx % 5) + 1}.org`,
      "Subject": `Executive Briefing Schedule Invitation ${idx + 1}`,
      "Direction": "Outbound",
      "Delivery Status": isFailed ? "Failed" : "Delivered",
      "Message ID": `<CON-20261021-BURST-${String(idx).padStart(3, '0')}@contoso.com>`,
      "Size(bytes)": 24000 + idx * 800,
      "Delivery Latency(ms)": 150 + idx * 25,
      "Original Client IP": ip,
      "Threat Classification": "Clean",
      "Error Detail": isFailed ? "552 5.2.2 Mailbox full for recipient" : ""
    };
  }),

  // Replay / Loop anomaly: identical Message ID appearing multiple times
  {
    "Date(UTC)": "2026-10-22 08:00:10",
    "Sender Address": "telemetry-probe@contoso.com",
    "Recipient Address": "syslog-collector@log-server.contoso.com",
    "Subject": "Heartbeat probe ping",
    "Direction": "Internal",
    "Delivery Status": "Delivered",
    "Message ID": "<REPLAY-PROBE-LOOP-101@contoso.com>",
    "Size(bytes)": 2400,
    "Delivery Latency(ms)": 35,
    "Original Client IP": "198.51.100.2",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-22 08:00:15",
    "Sender Address": "telemetry-probe@contoso.com",
    "Recipient Address": "syslog-collector@log-server.contoso.com",
    "Subject": "Heartbeat probe ping",
    "Direction": "Internal",
    "Delivery Status": "Delivered",
    "Message ID": "<REPLAY-PROBE-LOOP-101@contoso.com>",
    "Size(bytes)": 2400,
    "Delivery Latency(ms)": 34,
    "Original Client IP": "198.51.100.2",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-22 08:00:20",
    "Sender Address": "telemetry-probe@contoso.com",
    "Recipient Address": "syslog-collector@log-server.contoso.com",
    "Subject": "Heartbeat probe ping",
    "Direction": "Internal",
    "Delivery Status": "Delivered",
    "Message ID": "<REPLAY-PROBE-LOOP-101@contoso.com>",
    "Size(bytes)": 2400,
    "Delivery Latency(ms)": 38,
    "Original Client IP": "198.51.100.2",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },

  // Additional diverse traffic to simulate full enterprise patterns
  {
    "Date(UTC)": "2026-10-22 11:15:30",
    "Sender Address": "emily.watson@contoso.com",
    "Recipient Address": "contracts@adatum-legal.com",
    "Subject": "Mutual NDA Countersignature Attached",
    "Direction": "Outbound",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261022-1115-021@contoso.com>",
    "Size(bytes)": 412000,
    "Delivery Latency(ms)": 290,
    "Original Client IP": "198.51.100.33",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-22 13:40:00",
    "Sender Address": "newsletter@industry-insights-daily.org",
    "Recipient Address": "emily.watson@contoso.com",
    "Subject": "Cybersecurity Briefing: October 2026",
    "Direction": "Inbound",
    "Delivery Status": "Delivered",
    "Message ID": "<II-20261022-1340-991@industry-insights-daily.org>",
    "Size(bytes)": 58300,
    "Delivery Latency(ms)": 210,
    "Original Client IP": "192.0.2.140",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-22 15:22:10",
    "Sender Address": "david.kim@contoso.com",
    "Recipient Address": "invalid-address-format-typo@baddomain-does-not-exist.biz",
    "Subject": "Meeting notes follow up",
    "Direction": "Outbound",
    "Delivery Status": "Failed",
    "Message ID": "<CON-20261022-1522-022@contoso.com>",
    "Size(bytes)": 18200,
    "Delivery Latency(ms)": 980,
    "Original Client IP": "198.51.100.67",
    "Threat Classification": "Clean",
    "Error Detail": "550 5.4.312 DNS query failed; Host not found"
  },
  {
    "Date(UTC)": "2026-10-22 16:05:44",
    "Sender Address": "david.kim@contoso.com",
    "Recipient Address": "sarah.chen@contoso.com",
    "Subject": "Code review ready: PR #240",
    "Direction": "Internal",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261022-1605-023@contoso.com>",
    "Size(bytes)": 14500,
    "Delivery Latency(ms)": 65,
    "Original Client IP": "198.51.100.67",
    "Threat Classification": "Clean",
    "Error Detail": ""
  },
  {
    "Date(UTC)": "2026-10-22 16:50:00",
    "Sender Address": "service.desk@contoso.com",
    "Recipient Address": "alex.reed@contoso.com",
    "Subject": "[Ticket #9941] Laptop battery replacement schedule",
    "Direction": "Internal",
    "Delivery Status": "Delivered",
    "Message ID": "<CON-20261022-1650-024@contoso.com>",
    "Size(bytes)": 22100,
    "Delivery Latency(ms)": 80,
    "Original Client IP": "198.51.100.3",
    "Threat Classification": "Clean",
    "Error Detail": ""
  }
];

/**
 * Returns formatted CSV string matching Microsoft 365 Exchange Admin Center Message Trace format.
 */
export function generateSampleCsvContent(): string {
  const headers = [
    'Date(UTC)',
    'Sender Address',
    'Recipient Address',
    'Subject',
    'Direction',
    'Delivery Status',
    'Message ID',
    'Size(bytes)',
    'Delivery Latency(ms)',
    'Original Client IP',
    'Threat Classification',
    'Error Detail'
  ];

  const rows = SYNTHETIC_M365_RAW_ROWS.map((r) => [
    `"${r['Date(UTC)']}"`,
    `"${r['Sender Address']}"`,
    `"${r['Recipient Address']}"`,
    `"${(r['Subject'] || '').replace(/"/g, '""')}"`,
    `"${r['Direction']}"`,
    `"${r['Delivery Status']}"`,
    `"${r['Message ID']}"`,
    r['Size(bytes)'],
    r['Delivery Latency(ms)'],
    `"${r['Original Client IP']}"`,
    `"${r['Threat Classification']}"`,
    `"${(r['Error Detail'] || '').replace(/"/g, '""')}"`
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
