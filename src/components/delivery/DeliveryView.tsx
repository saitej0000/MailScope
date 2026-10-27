/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
  TrendingDown,
  Timer,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { AggregatedMetrics, NormalizedEmailRecord } from '../../types/email.ts';

interface DeliveryViewProps {
  metrics: AggregatedMetrics;
  records: NormalizedEmailRecord[];
  onFilterByEntity?: (email: string) => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  metrics,
  records,
  onFilterByEntity,
}) => {
  // Extract specific failure error details
  const failureReasonsMap = new Map<string, number>();
  for (const r of records) {
    if (r.status === 'Failed' && r.errorDetail) {
      // Group by simplified reason prefix (e.g. "550 5.1.1" or exact code)
      const err = r.errorDetail.trim();
      failureReasonsMap.set(err, (failureReasonsMap.get(err) || 0) + 1);
    }
  }

  const commonFailureReasons = Array.from(failureReasonsMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Delivery Performance & Transport Diagnostics
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed breakdown of successful handoffs, non-delivery reports (NDRs), deferred greylisting, and recurring failure endpoints.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Success Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {metrics.deliverySuccessRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.successfulDeliveries.toLocaleString()} delivered successfully
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Failure Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {metrics.deliveryFailureRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.failedDeliveries.toLocaleString()} bounces & dropped msgs
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Deferred / Delayed
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {metrics.deferredDeliveries.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Greylisting & retry queues
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending / In Queue
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {metrics.pendingDeliveries.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Active hub transport pipeline
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Avg. Delivery Latency
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {metrics.averageLatencyMs !== null ? `${metrics.averageLatencyMs} ms` : 'N/A'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.averageLatencyMs !== null ? 'End-to-end hop duration' : 'Telemetry not provided'}
          </div>
        </div>
      </div>

      {/* Row 2: Recurring Failure Entities and Error Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Failures List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Recurring Delivery Failures by Entity
              </h3>
              <p className="text-xs text-slate-500">
                Addresses with multiple consecutive delivery failures
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Threshold: &ge; 2 failures
            </span>
          </div>

          {metrics.recurringFailures.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recurrent delivery failure patterns identified in the active dataset.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                    <th className="py-2 px-2">Role</th>
                    <th className="py-2 px-2">Email Entity</th>
                    <th className="py-2 px-2 text-right">Fails</th>
                    <th className="py-2 px-2">Last Reported NDR Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono">
                  {metrics.recurringFailures.slice(0, 8).map((rf, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2">
                        <span
                          className={`text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-sm ${
                            rf.type === 'recipient'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {rf.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-800 max-w-[200px] truncate" title={rf.entity}>
                        {rf.entity}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-rose-700 tabular-nums">
                        {rf.failureCount}
                      </td>
                      <td className="py-2 px-2 text-slate-500 font-sans text-[11px] max-w-[220px] truncate" title={rf.lastError || 'Undeliverable'}>
                        {rf.lastError || 'Undeliverable'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Common Failure Reasons */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Observed Non-Delivery Reports (NDR Codes)
            </h3>
            <p className="text-xs text-slate-500">
              Empirical error reasons extracted directly from message trace headers
            </p>
          </div>

          {commonFailureReasons.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No detailed NDR error codes or reasons recorded in the active dataset.
            </div>
          ) : (
            <div className="space-y-3">
              {commonFailureReasons.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-mono text-slate-900 font-semibold block truncate" title={item.reason}>
                      {item.reason}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Exchange SMTP bounce condition
                    </span>
                  </div>
                  <span className="font-mono text-rose-700 font-bold px-2 py-0.5 bg-rose-50 rounded-sm shrink-0 tabular-nums">
                    {item.count} occurrence{item.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Normalization Methodology Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Status Normalization Methodology & Assumptions
        </h4>
        <p className="leading-relaxed">
          Microsoft 365 Exchange Admin Center and on-premises Exchange transport servers emit diverse event codes (e.g. <code className="bg-white px-1 py-0.5 border border-slate-200 rounded-sm">SEND</code>, <code className="bg-white px-1 py-0.5 border border-slate-200 rounded-sm">DELIVER</code>, <code className="bg-white px-1 py-0.5 border border-slate-200 rounded-sm">FAIL</code>, <code className="bg-white px-1 py-0.5 border border-slate-200 rounded-sm">DEFER</code>, <code className="bg-white px-1 py-0.5 border border-slate-200 rounded-sm">EXPAND</code>). MailScope maps statuses into standardized categories strictly based on documented RFC outcome criteria:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-500">
          <li><strong>Delivered</strong>: Terminal successful receipt by the recipient mailbox server or downstream MX.</li>
          <li><strong>Failed</strong>: Permanent fatal delivery error (5xx SMTP code, NDR, user unknown, mailbox quota, or DNS failure).</li>
          <li><strong>Deferred / Delayed</strong>: Temporary retryable error (4xx SMTP code, greylisting, rate throttling). Preserved separately from failures.</li>
          <li><strong>Pending</strong>: Message currently enqueued in transport hub pipeline without final outcome.</li>
          <li><strong>Unknown</strong>: Any unclassified string preserved as-is to prevent outcome distortion or false assertions.</li>
        </ul>
      </div>
    </div>
  );
};
