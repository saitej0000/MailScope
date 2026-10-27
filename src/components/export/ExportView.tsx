/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  FileText,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  AggregatedMetrics,
  FilterState,
  NormalizedEmailRecord,
  SecurityAlert,
} from '../../types/email.ts';
import {
  exportFilteredRecordsToCsv,
  exportSecurityAlertsToCsv,
  exportSummaryStatsToCsv,
  generatePrintableHtmlReport,
} from '../../services/exportService.ts';

interface ExportViewProps {
  metrics: AggregatedMetrics;
  filteredRecords: NormalizedEmailRecord[];
  alerts: SecurityAlert[];
  filters: FilterState;
  datasetSource: string;
  aiReportContent: string | null;
}

export const ExportView: React.FC<ExportViewProps> = ({
  metrics,
  filteredRecords,
  alerts,
  filters,
  datasetSource,
  aiReportContent,
}) => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Report Export & Data Dissemination
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Export verified analytical findings, telemetry summaries, security incident alerts, and printable executive documentation.
        </p>
      </div>

      {/* Security & Integrity Safeguards Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-emerald-950">Spreadsheet Formula Injection Protection: </span>
          All CSV exports automatically sanitize untrusted text cells starting with formula trigger characters (<code className="bg-white/80 px-1 py-0.5 border border-emerald-200 rounded-sm">=</code>, <code className="bg-white/80 px-1 py-0.5 border border-emerald-200 rounded-sm">+</code>, <code className="bg-white/80 px-1 py-0.5 border border-emerald-200 rounded-sm">-</code>, <code className="bg-white/80 px-1 py-0.5 border border-emerald-200 rounded-sm">@</code>) by safely prepending a single quote. Values are preserved accurately without execution risks in Microsoft Excel.
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export 1: Filtered Email Records CSV */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Filtered Email Records (CSV)
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Export all currently filtered email events including normalized timestamps, sender/recipient addresses, message IDs, directions, and NDR failure reasons.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-400">
              Coverage: {filteredRecords.length.toLocaleString()} records
            </div>
          </div>
          <button
            onClick={() => exportFilteredRecordsToCsv(filteredRecords)}
            disabled={filteredRecords.length === 0}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Records CSV</span>
          </button>
        </div>

        {/* Export 2: Summary Statistics CSV */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Analytical Summary Metrics (CSV)
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Download clean, key-value operational metrics (delivery success rate, unique participants, outbound vs inbound volumes, latency, and alert tallies).
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-400">
              Coverage: 20 key KPI parameters
            </div>
          </div>
          <button
            onClick={() => exportSummaryStatsToCsv(metrics)}
            disabled={metrics.totalRecords === 0}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Metrics CSV</span>
          </button>
        </div>

        {/* Export 3: Security Alerts CSV */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Security Alerts & Anomalies (CSV)
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Export comprehensive alert log containing rule identifiers, affected entities, observed vs threshold values, evidence explanations, and analyst triage states.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-400">
              Coverage: {alerts.length} security alerts
            </div>
          </div>
          <button
            onClick={() => exportSecurityAlertsToCsv(alerts)}
            disabled={alerts.length === 0}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Alerts CSV</span>
          </button>
        </div>

        {/* Export 4: Printable HTML Report */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Printable Analytical Report (HTML / PDF)
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Generate a standalone, beautifully formatted executive document ready for browser print or saving as PDF with dataset coverage, KPIs, rankings, and alert findings.
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-400">
              Includes: Executive summary, tables, and AI assessment
            </div>
          </div>
          <button
            onClick={() =>
              generatePrintableHtmlReport(
                metrics,
                alerts,
                filters,
                datasetSource,
                aiReportContent || undefined
              )
            }
            disabled={metrics.totalRecords === 0}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Printable Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
