# MailScope — Office 365 Email Activity Analyzer

> **Email Analytics, Delivery Insights & Security Monitoring**  
> An enterprise-grade analytical system designed for IT administrators and cybersecurity analysts to inspect message tracking logs exported from Microsoft 365 Admin Center and Exchange Admin Center (EAC).

---

## 1. System Overview & Problem Statement

Organizations utilizing Microsoft 365 often generate high-volume email traffic across internal, inbound, and outbound routes. When investigating delivery bottlenecks, phishing anomalies, spambot compromised accounts, or non-delivery reports (NDRs), IT teams frequently export raw CSV or Excel trace files from Exchange Online.

Raw logs are difficult to interpret quickly without specialized processing. **MailScope** resolves this by providing an in-memory, privacy-preserving analytical pipeline that parses, validates, normalizes, visualizes, and audits email logs with rule-based security heuristics and optional AI-assisted executive report generation.

---

## 2. Key Features

- **Executive KPI Dashboard**: 10 real-time metrics (Total records, Sent vs. Received, Deliveries, Bounces, Success %, Unique Senders/Recipients, and Alerts).
- **Interactive Visualizations**: Time-series area charts, delivery status donuts, hourly distribution (00:00–23:00 UTC), and deterministic rankings for top senders and recipients.
- **Robust Import Engine**:
  - Handles **CSV**, **XLSX**, and **XLS** reports.
  - Automatic column detection for Exchange Admin Center headers.
  - Interactive column re-mapping modal.
  - Strict validation reporting: accepted count, duplicate detection, and row-by-row rejection breakdown.
  - One-click **Download Sample CSV** and **Load Demo Data (Synthetic)**.
- **Email Activity Explorer**:
  - Filter by date range, direction, delivery status, sender, recipient, domain, and Message ID.
  - Sortable, paginated event table with full header and error inspection modal.
- **Transport Delivery Diagnostics**:
  - Normalization of diverse event codes into RFC standard categories (`Delivered`, `Failed`, `Deferred`, `Pending`, `Quarantined`, `Expanded`, `Unknown`).
  - Analysis of recurring failure endpoints and observed NDR bounce codes.
- **Rule-Based Security Monitoring Engine**:
  - 9 automated detection heuristics (High outbound volume, elevated failure rates, repeat failures, off-hours dispatch, rapid bursts, baseline surges, message ID replay loops, and source IP transitions).
  - Analyst triage console: update status (`New` &rarr; `Investigating` &rarr; `Resolved` &rarr; `False Positive`) with persistent analyst notes.
- **AI-Assisted Executive Report Writer**:
  - Structured 10-section briefing grounded strictly in computed metrics via Google Gemini (`gemini-3.8-flash`) through the server-side API proxy.
  - Grounding safeguards: only aggregated mathematical summaries are sent; raw message bodies are never collected.
  - Built-in deterministic non-AI analytical report fallback when the API service is unconfigured or unavailable.
- **Enterprise Report Exports**:
  - CSV export for filtered records, summary statistics, and security alerts.
  - **Spreadsheet Formula Injection Protection**: Prepending `'` to untrusted cells starting with `=`, `+`, `-`, or `@`.
  - Professional HTML printable report ready for browser print or saving as PDF (`window.print()`).
- **Privacy & Security Safeguards**:
  - Zero permanent database storage of uploaded employee data.
  - Immediate "Clear Current Data" action.

---

## 3. Supported Column Headers & Status Normalization

### A. Supported Column Name Variations
MailScope's auto-detection engine matches standard Exchange / M365 export headers:

| Standard Field | Common Export Column Variations |
| :--- | :--- |
| **Timestamp (Required)** | `Date(UTC)`, `Received`, `Timestamp`, `Date`, `EventTime`, `Time_Stamp`, `DateTime` |
| **Sender (Required)** | `Sender Address`, `SenderAddress`, `From`, `Sender`, `Sender_Address`, `P1Sender` |
| **Recipient (Required)** | `Recipient Address`, `RecipientAddress`, `To`, `Recipient`, `Recipient_Address`, `P1Recipient` |
| **Delivery Status (Required)** | `Delivery Status`, `DeliveryStatus`, `Status`, `Action`, `EventId`, `Result` |
| **Direction (Optional)** | `Direction`, `MessageDirection`, `TrafficType` |
| **Subject (Optional)** | `Subject`, `MessageSubject` |
| **Message ID (Optional)** | `Message ID`, `MessageId`, `NetworkMessageId`, `Message-ID`, `InternetMessageId` |
| **Size (Optional)** | `Size(bytes)`, `Size`, `TotalBytes`, `MessageSize` |
| **Delivery Latency (Optional)** | `Delivery Latency(ms)`, `Latency`, `Duration`, `DeliveryLatency` |
| **Original Client IP (Optional)** | `Original Client IP`, `ClientIP`, `SourceIP`, `SenderIP` |
| **Threat Classification (Optional)** | `Threat Classification`, `ThreatClassification`, `SpamVerdict`, `Classification` |
| **Error / NDR Detail (Optional)** | `Error Detail`, `LastError`, `FailureReason`, `Error`, `Reason` |

### B. Status Normalization Rules
To ensure data integrity without fabricated outcomes:
- **`Delivered`**: Mapped from `Delivered`, `Success`, `Send`, `Sent`, `Completed`, `Resolved`.
- **`Failed`**: Mapped from `Failed`, `Failure`, `Rejected`, `Bounced`, `Dropped`, `Undeliverable`, `Error`.
- **`Deferred`**: Mapped from `Deferred`, `Delayed`, `Throttle`, `Retry`, `Greylisted`. (Excluded from final success/failure ratios).
- **`Pending`**: Mapped from `Pending`, `Queued`, `Processing`, `InQueue`.
- **`Quarantined`**: Mapped from `Quarantined`, `Spam`, `Filtered`, `Blocked`.
- **`Expanded`**: Mapped from `Expanded` (distribution list expansion).
- **`Unknown`**: Preserves unclassified source strings as-is to avoid distortion.

---

## 4. Analytical Calculations & Calculation Integrity

- **Total Records**: Exact count of accepted records in the active dataset.
- **Unique Senders**: Distinct, normalized lowercase sender addresses.
- **Unique Recipients**: Distinct, normalized lowercase recipient addresses.
- **Delivery Success Rate**: $\frac{\text{Delivered}}{\text{Delivered} + \text{Failed}} \times 100$. (Handles division by zero safely).
- **Delivery Failure Rate**: $\frac{\text{Failed}}{\text{Delivered} + \text{Failed}} \times 100$.
- **Pending/Deferred Handling**: Preserved in operational counts, but excluded from terminal success/failure percentages.
- **Latency**: Averages only valid positive numbers; labeled "Not Available" when absent rather than falsely showing 0 ms.
- **Top Rankings**: Deterministically ordered by record count descending, then alphabetically by email address.

---

## 5. Security Detection Heuristics

1. **`RULE_HIGH_OUTBOUND_VOLUME`**: Senders exceeding configured outbound threshold (default: 15 records).
2. **`RULE_HIGH_FAILURE_RATE`**: Senders exceeding configured failure percentage (default: 20%) with at least 4 attempts.
3. **`RULE_REPEATED_FAILURES`**: Senders or recipients generating recurring non-delivery reports (default: &ge; 3 failures).
4. **`RULE_AFTER_HOURS_ACTIVITY`**: Email transmission outside configured business hours window (default: 08:00–18:00 UTC).
5. **`RULE_SHORT_INTERVAL_BURST`**: Concentration of messages (&ge; 6) dispatched within a 5-minute sliding window.
6. **`RULE_BASELINE_SURGE`**: Single-day volume exceeding sender's daily average by &ge; 2.5x multiplier.
7. **`RULE_REPEATED_MESSAGE_ID`**: Identical network message identifier appearing &ge; 3 times (transport replay or loop).
8. **`RULE_SENDER_IP_SHIFT`**: Single sender dispatching messages from 3+ distinct IP addresses.
9. **`RULE_DATA_QUALITY_ANOMALY`**: Report deficiency (> 25% missing message IDs or unknown statuses) that compromises forensic attribution.

---

## 6. Execution & Build Instructions

### Installation
Dependencies are already configured:
```bash
npm install
```

### Starting the Development Server
Runs the Express backend with Vite middleware on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
Executes the Vitest suite covering all 24 required test scenarios:
```bash
npm test
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
Generates the production distribution:
```bash
npm run build
```

---

## 7. Configuration & Environment Variables

Create or update `.env` (refer to `.env.example`):
```bash
# GEMINI_API_KEY: Optional. Used server-side for AI-assisted executive report generation.
# If omitted, MailScope automatically provides a rich deterministic non-AI analytical report.
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

---

## 8. College Micro-Project Attribution

- **Project Title**: Office 365 Email Activity Analyzer and Security Monitor (MailScope)
- **Domain**: Information and Cyber Security (ICS)
- **Course**: Final Year Engineering Micro-Project
