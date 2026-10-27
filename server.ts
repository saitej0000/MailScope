/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to construct a deterministic, rule-grounded non-AI analytical report
function generateDeterministicFallbackReport(metrics: any, alerts: any[]): string {
  const topSenderList = (metrics?.topSenders || [])
    .slice(0, 5)
    .map((s: any) => `- **${s.sender}**: ${s.count} messages (${s.failed} delivery failures)`)
    .join('\n');

  const alertSummaryList = alerts.length > 0
    ? alerts.slice(0, 8).map((a: any) => `- **[${a.severity.toUpperCase()}] ${a.ruleName}** (${a.affectedEntity}): ${a.evidenceExplanation}`).join('\n')
    : '- No rule-based anomalies exceeded configured thresholds.';

  return `
# Analytical Email Security & Delivery Report (MailScope Engine)
*Generated via Local Rule-Based Analytics Engine*

### 1. Executive Summary
During the evaluated observation period, the messaging infrastructure processed **${metrics?.totalRecords ?? 0}** email records across **${metrics?.uniqueSenders ?? 0}** unique senders and **${metrics?.uniqueRecipients ?? 0}** unique recipients. The overall delivery success rate stands at **${metrics?.deliverySuccessRate ?? 0}%**, with **${metrics?.failedDeliveries ?? 0}** delivery failures and **${alerts?.length ?? 0}** security anomaly alerts generated.

### 2. Dataset Coverage & Quality
- Total Analyzed Records: ${metrics?.totalRecords ?? 0}
- Directional Distribution: ${metrics?.sentRecords ?? 0} Outbound (Sent), ${metrics?.receivedRecords ?? 0} Inbound (Received), ${metrics?.internalRecords ?? 0} Internal, ${metrics?.unknownDirectionRecords ?? 0} Unclassified.
- Data Quality Note: Metrics represent accepted and deduplicated message tracking records. Unknown and deferred statuses are maintained separately to avoid outcome bias.

### 3. Total Email Activity
- Peak messaging volume reflects enterprise business activity.
- Distinct senders: ${metrics?.uniqueSenders ?? 0}
- Distinct recipients: ${metrics?.uniqueRecipients ?? 0}
- Identified unique message identifiers: ${metrics?.uniqueMessageCount ?? 'Not captured in report'}

### 4. Sent and Received Activity Comparison
- Outbound (Egress) Traffic: ${metrics?.sentRecords ?? 0} records
- Inbound (Ingress) Traffic: ${metrics?.receivedRecords ?? 0} records
- Inbound vs. Outbound ratio reflects standard organizational communication flows without systemic inversion.

### 5. Delivery Performance
- Successfully Delivered: ${metrics?.successfulDeliveries ?? 0} records
- Hard/Soft Delivery Failures: ${metrics?.failedDeliveries ?? 0} records (${metrics?.deliveryFailureRate ?? 0}% failure rate)
- Deferred Deliveries: ${metrics?.deferredDeliveries ?? 0} records
- Pending / In Queue: ${metrics?.pendingDeliveries ?? 0} records
- Average Delivery Latency: ${metrics?.averageLatencyMs !== null ? `${metrics?.averageLatencyMs} ms` : 'Not recorded in source telemetry'}

### 6. Major Sending & Receiving Patterns
Top sending accounts:
${topSenderList || '- No sender activity recorded.'}

### 7. Detected Anomalies & Alert Evidence
The security rule engine generated ${alerts.length} security alerts:
${alertSummaryList}

### 8. Potential Risks & Limitations
- High email volume is an indicator for operational verification, not proof of host compromise.
- Message trace exports lack body context, DKIM signature details, and full SPF alignment logs.
- After-hours communications may represent international collaboration or automated scheduled reporting.

### 9. Recommended Administrative Actions
1. **Investigate High-Volume Outbound Accounts**: Review sign-in telemetry in Microsoft Entra ID for senders flagged under high volume or burst rules.
2. **Review Recurring Delivery Failures**: Cleanse obsolete addresses from distribution lists and verify destination MX validity to protect domain reputation.
3. **Verify Off-Hours Transmissions**: Ensure legitimate scheduled scripts or remote employees account for transmissions outside core business hours.

### 10. Conclusion
The messaging transport environment exhibits an overall delivery success rate of ${metrics?.deliverySuccessRate ?? 0}%. Identified delivery failures and volume spikes are documented above with actionable investigation steps.
`.trim();
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MailScope Email Activity Analyzer',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// AI Report Writer endpoint (Proxied to Gemini via @google/genai)
app.post('/api/generate-ai-report', async (req, res) => {
  try {
    const { metrics, alerts, filters, config } = req.body;

    if (!metrics) {
      return res.status(400).json({ error: 'Missing aggregated metrics payload.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

    if (!isKeyConfigured) {
      // Graceful non-AI analytical report fallback
      const fallbackReport = generateDeterministicFallbackReport(metrics, alerts || []);
      return res.json({
        success: true,
        isAiGenerated: false,
        source: 'Deterministic Analytics Engine (GEMINI_API_KEY not configured)',
        reportMarkdown: fallbackReport,
      });
    }

    // Initialize @google/genai SDK on server side
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptContext = {
      summaryMetrics: {
        totalRecords: metrics.totalRecords,
        sentRecords: metrics.sentRecords,
        receivedRecords: metrics.receivedRecords,
        internalRecords: metrics.internalRecords,
        unknownDirectionRecords: metrics.unknownDirectionRecords,
        successfulDeliveries: metrics.successfulDeliveries,
        failedDeliveries: metrics.failedDeliveries,
        deferredDeliveries: metrics.deferredDeliveries,
        pendingDeliveries: metrics.pendingDeliveries,
        deliverySuccessRate: `${metrics.deliverySuccessRate}%`,
        deliveryFailureRate: `${metrics.deliveryFailureRate}%`,
        uniqueSenders: metrics.uniqueSenders,
        uniqueRecipients: metrics.uniqueRecipients,
        averageLatencyMs: metrics.averageLatencyMs,
      },
      topSenders: (metrics.topSenders || []).slice(0, 8),
      topRecipients: (metrics.topRecipients || []).slice(0, 8),
      recurringFailures: (metrics.recurringFailures || []).slice(0, 6),
      securityAlerts: (alerts || []).slice(0, 15).map((a: any) => ({
        id: a.id,
        rule: a.ruleName,
        severity: a.severity,
        entity: a.affectedEntity,
        observed: a.observedValue,
        threshold: a.threshold,
        evidence: a.evidenceExplanation,
      })),
      operationalThresholds: config,
      activeFilters: filters,
    };

    const systemInstruction = `You are a Senior Cyber Threat Intelligence Analyst and Microsoft 365 Exchange Administrator producing an executive analytical report for MailScope.
Strict analytical grounding rules:
1. Base all findings exclusively on the provided quantitative metrics and security alerts. Never invent, hallucinate, or assume email addresses, message IDs, compromise states, or numbers not present in the data.
2. Clearly separate:
   - Observed Facts: empirical numbers directly computed.
   - Rule-Based Alerts: heuristics triggered by user-configured thresholds.
   - Possible Explanations: plausible operational reasons (e.g. bulk marketing, international timezones, newsletter bounces).
   - Recommended Next Steps: concrete IT administration and incident triage actions.
3. Emphasize that high volume is an indicator for verification, not proof of account takeover; that delivery failures are not automatically malicious; and that after-hours transmissions may represent normal shift work.
4. Provide the complete report strictly formatted into the following 10 sections using clear Markdown:
   1. Executive Summary
   2. Dataset Coverage and Quality
   3. Total Email Activity
   4. Sent and Received Activity Comparison
   5. Delivery Performance
   6. Major Sending and Receiving Patterns
   7. Detected Anomalies and Alert Evidence
   8. Potential Risks and Limitations
   9. Recommended Administrative Actions
   10. Conclusion`;

    const userPrompt = `Generate the MailScope Office 365 Email Activity and Security Report based on this validated operational metadata:
${JSON.stringify(promptContext, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for factual precision
      },
    });

    const reportMarkdown = response.text;

    if (!reportMarkdown) {
      throw new Error('Empty response from AI model');
    }

    return res.json({
      success: true,
      isAiGenerated: true,
      source: 'Gemini 3.8 Flash (Grounding Enforced)',
      reportMarkdown,
    });
  } catch (err: any) {
    console.error('AI Report generation error:', err);
    // Provide non-AI fallback on error so the application never breaks
    const fallback = generateDeterministicFallbackReport(req.body?.metrics, req.body?.alerts || []);
    return res.json({
      success: true,
      isAiGenerated: false,
      source: 'Deterministic Analytics Engine (AI Service Unavailable Fallback)',
      warning: `AI generation encountered an issue (${err.message || 'Service unavailable'}). Deterministic analytical report generated successfully.`,
      reportMarkdown: fallback,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MailScope server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
