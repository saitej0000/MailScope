/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  AggregatedMetrics,
  FilterState,
  SecurityAlert,
  SecurityConfig,
} from '../../types/email.ts';
import { generatePrintableHtmlReport } from '../../services/exportService.ts';

interface AiReportViewProps {
  metrics: AggregatedMetrics;
  alerts: SecurityAlert[];
  filters: FilterState;
  config: SecurityConfig;
  datasetSource: string;
  reportContent: string | null;
  setReportContent: (content: string | null) => void;
  onNavigateToSettings: () => void;
}

export const AiReportView: React.FC<AiReportViewProps> = ({
  metrics,
  alerts,
  filters,
  config,
  datasetSource,
  reportContent,
  setReportContent,
  onNavigateToSettings,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportMetadata, setReportMetadata] = useState<{
    source: string;
    isAi: boolean;
  } | null>(null);

  const handleGenerateReport = async () => {
    if (metrics.totalRecords === 0) {
      setErrorMessage('Cannot generate report: No active email activity records loaded.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          alerts,
          filters,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: Failed to reach analytical reporting service`);
      }

      const data = await response.json();
      if (!data.success && !data.reportMarkdown) {
        throw new Error(data.error || 'Failed to generate analytical report');
      }

      setReportContent(data.reportMarkdown);
      setReportMetadata({
        source: data.source || 'Analytics Engine',
        isAi: Boolean(data.isAiGenerated),
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during report generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!reportContent) return;
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    generatePrintableHtmlReport(
      metrics,
      alerts,
      filters,
      datasetSource,
      reportContent || undefined
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Executive Security & Delivery Report Writer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Produce a comprehensive 10-section analytical briefing grounded in computed transport metrics and rule-based alert telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reportContent && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={isLoading || metrics.totalRecords === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Executive Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grounding & Privacy Assurance Banner */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-indigo-950">Grounding & Privacy Architecture: </span>
          Only aggregated, non-sensitive mathematical summaries (counts, delivery percentages, and rule alert explanations) are processed. Raw message bodies, passwords, and external attachments are never stored or transmitted. The model is constrained to stick strictly to empirical metrics.
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-600">
            &times;
          </button>
        </div>
      )}

      {/* Main Report Container */}
      {reportContent ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-800">
                MailScope Executive Report Output
              </span>
              {reportMetadata && (
                <span className="text-[11px] text-slate-500 font-mono">
                  ({reportMetadata.source})
                </span>
              )}
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Grounded in {metrics.totalRecords} records
            </span>
          </div>

          <div className="p-8 prose prose-slate max-w-none text-xs leading-relaxed font-sans select-text">
            <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-sm">
              {reportContent}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Analytical Report Generated Yet
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Click &quot;Generate Executive Report&quot; to synthesize an administrator-ready briefing covering executive summary, transport metrics, failure NDRs, security alerts, and administrative remediation steps.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading || metrics.totalRecords === 0}
            className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            Generate Report
          </button>
        </div>
      )}
    </div>
  );
};
