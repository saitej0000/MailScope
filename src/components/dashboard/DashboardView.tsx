/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Mail,
  Send,
  Inbox,
  CheckCircle,
  AlertOctagon,
  Clock,
  Percent,
  Users,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  BarChart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AggregatedMetrics, DeliveryStatus, EmailDirection, SecurityAlert } from '../../types/email.ts';
import { ActivePage } from '../layout/Navigation.tsx';

interface DashboardViewProps {
  metrics: AggregatedMetrics;
  alerts?: SecurityAlert[];
  onNavigate: (page: ActivePage) => void;
  onQuickFilter: (filters: { direction?: EmailDirection; status?: DeliveryStatus }) => void;
  onLoadDemo: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Delivered: '#10b981', // emerald-500
  Failed: '#ef4444', // rose-500
  Deferred: '#f59e0b', // amber-500
  Pending: '#6366f1', // indigo-500
  Expanded: '#8b5cf6', // violet-500
  Quarantined: '#d97706', // amber-600
  Unknown: '#94a3b8', // slate-400
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  alerts = [],
  onNavigate,
  onQuickFilter,
  onLoadDemo,
}) => {
  // Empty State: Fully centered in available main viewport
  if (metrics.totalRecords === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            No Email Activity Records Loaded
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            MailScope analyzes sent and received email reports exported from the Microsoft 365 Admin Center or Exchange Admin Center. Load synthetic demo data or import your CSV/Excel report to start analyzing.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLoadDemo}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Load Demo Data
            </button>
            <button
              onClick={() => onNavigate('import')}
              className="px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              Import CSV / Excel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Primary 6 KPI Cards specified in requirements
  const primaryKpis = [
    {
      title: 'Total Email Records',
      value: metrics.totalRecords.toLocaleString(),
      subtitle: metrics.uniqueMessageCount ? `${metrics.uniqueMessageCount} unique msg IDs` : 'Deduplicated events',
      icon: Mail,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100',
      onClick: () => onNavigate('analytics'),
    },
    {
      title: 'Sent Records (Outbound)',
      value: metrics.sentRecords.toLocaleString(),
      subtitle: `${metrics.totalRecords > 0 ? ((metrics.sentRecords / metrics.totalRecords) * 100).toFixed(0) : 0}% of total volume`,
      icon: Send,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      onClick: () => {
        onQuickFilter({ direction: 'Outbound' });
        onNavigate('analytics');
      },
    },
    {
      title: 'Received Records (Inbound)',
      value: metrics.receivedRecords.toLocaleString(),
      subtitle: `${metrics.totalRecords > 0 ? ((metrics.receivedRecords / metrics.totalRecords) * 100).toFixed(0) : 0}% of total volume`,
      icon: Inbox,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      onClick: () => {
        onQuickFilter({ direction: 'Inbound' });
        onNavigate('analytics');
      },
    },
    {
      title: 'Delivery Success Rate',
      value: `${metrics.deliverySuccessRate}%`,
      subtitle: `${metrics.successfulDeliveries.toLocaleString()} delivered`,
      icon: Percent,
      color: metrics.deliverySuccessRate >= 95 ? 'text-emerald-600' : 'text-amber-600',
      bgColor: metrics.deliverySuccessRate >= 95 ? 'bg-emerald-50' : 'bg-amber-50',
      onClick: () => onNavigate('delivery'),
    },
    {
      title: 'Failed Deliveries',
      value: metrics.failedDeliveries.toLocaleString(),
      subtitle: `${metrics.deliveryFailureRate}% hard/soft failure rate`,
      icon: AlertOctagon,
      color: metrics.failedDeliveries > 0 ? 'text-rose-600' : 'text-slate-600',
      bgColor: metrics.failedDeliveries > 0 ? 'bg-rose-50' : 'bg-slate-100',
      onClick: () => {
        onQuickFilter({ status: 'Failed' });
        onNavigate('delivery');
      },
    },
    {
      title: 'Security Alerts',
      value: metrics.totalAlerts.toString(),
      subtitle: `${metrics.criticalAlerts} critical, ${metrics.highAlerts} high priority`,
      icon: ShieldAlert,
      color: metrics.totalAlerts > 0 ? 'text-rose-600' : 'text-emerald-600',
      bgColor: metrics.totalAlerts > 0 ? 'bg-rose-50' : 'bg-emerald-50',
      onClick: () => onNavigate('security'),
    },
  ];

  // Secondary Contextual Metrics Bar
  const secondaryKpis = [
    { label: 'Unique Senders', value: metrics.uniqueSenders.toLocaleString() },
    { label: 'Unique Recipients', value: metrics.uniqueRecipients.toLocaleString() },
    { label: 'Pending / Deferred', value: (metrics.deferredDeliveries + metrics.pendingDeliveries).toLocaleString() },
    { label: 'Avg. Latency', value: metrics.averageLatencyMs !== null ? `${metrics.averageLatencyMs} ms` : 'N/A' },
  ];

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 6 Responsive Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {primaryKpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.onClick}
              className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bgColor} ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {kpi.value}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 truncate flex items-center justify-between">
                <span>{kpi.subtitle}</span>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Quick Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        {secondaryKpis.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-slate-500">{item.label}:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Security Alerts Section directly below KPI cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Recent Security Alerts & Threat Indicators</h3>
          </div>
          <button
            onClick={() => onNavigate('security')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <span>View All ({alerts.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No security anomalies or threshold violations detected under current operational rules.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                onClick={() => onNavigate('security')}
                className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                    alt.severity === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : alt.severity === 'High'
                      ? 'bg-orange-100 text-orange-700'
                      : alt.severity === 'Medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {alt.severity.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{alt.id}</span>
                </div>
                <div className="font-semibold text-xs text-slate-800 truncate" title={alt.ruleName}>
                  {alt.ruleName}
                </div>
                <div className="font-mono text-[11px] text-slate-600 truncate" title={alt.affectedEntity}>
                  {alt.affectedEntity}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {alt.evidenceExplanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 1 Charts: Volume Over Time & Delivery Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Volume Over Time Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Email Volume Over Time</h3>
              <p className="text-xs text-slate-500">Daily message dispatch and delivery trends</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                Total
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Sent
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Failed
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.volumeOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" name="Total Records" />
                <Area type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={1.5} fillOpacity={0} name="Outbound" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Status Distribution Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Delivery Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of transport outcomes</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {metrics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} records`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {metrics.statusDistribution.map((st) => (
              <div key={st.status} className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[st.status] || '#94a3b8' }}
                  />
                  <span>{st.status}</span>
                </span>
                <span className="font-mono tabular-nums text-slate-900 font-medium">
                  {st.count.toLocaleString()} ({st.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Hourly Activity & Sent vs Received */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Distribution (24 Hour Pattern) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Hourly Activity Distribution (24h UTC)</h3>
              <p className="text-xs text-slate-500">Message traffic by hour of the day to identify off-hours activity</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">00:00 - 23:00</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={metrics.hourlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval={2} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="Total Activity" />
                <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failures" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direction Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Traffic Direction Ratio</h3>
              <p className="text-xs text-slate-500">Inbound vs Outbound vs Internal</p>
            </div>
            <div className="space-y-4">
              {metrics.directionDistribution.map((d) => (
                <div key={d.direction} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{d.direction}</span>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {d.count.toLocaleString()} ({d.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.direction === 'Outbound'
                          ? 'bg-indigo-500'
                          : d.direction === 'Inbound'
                          ? 'bg-sky-500'
                          : d.direction === 'Internal'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span>Avg. Delivery Latency:</span>
              <span className="font-mono text-slate-900 font-medium">
                {metrics.averageLatencyMs !== null ? `${metrics.averageLatencyMs} ms` : 'Not Available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Unique Senders / Recipients:</span>
              <span className="font-mono text-slate-900 font-medium">
                {metrics.uniqueSenders} / {metrics.uniqueRecipients}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top 10 Senders and Top 10 Recipients Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Senders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top 10 Senders (by records)</h3>
              <p className="text-xs text-slate-500">Highest volume dispatch mailboxes</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2 px-1">#</th>
                  <th className="py-2 px-2">Sender Address</th>
                  <th className="py-2 px-2 text-right">Records</th>
                  <th className="py-2 px-2 text-right">Failures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.topSenders.slice(0, 7).map((s, idx) => (
                  <tr key={s.sender} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-1 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-slate-800 truncate max-w-[220px]" title={s.sender}>
                      {s.sender}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-900 font-medium tabular-nums">
                      {s.count.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums">
                      <span className={s.failed > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                        {s.failed} ({s.failureRate}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Recipients */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top 10 Recipients (by records)</h3>
              <p className="text-xs text-slate-500">Highest volume inbound & outbound target mailboxes</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2 px-1">#</th>
                  <th className="py-2 px-2">Recipient Address</th>
                  <th className="py-2 px-2">Domain</th>
                  <th className="py-2 px-2 text-right">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.topRecipients.slice(0, 7).map((r, idx) => (
                  <tr key={r.recipient} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-1 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-slate-800 truncate max-w-[200px]" title={r.recipient}>
                      {r.recipient}
                    </td>
                    <td className="py-2 px-2 text-slate-500 truncate max-w-[120px]">
                      {r.domain}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-900 font-medium tabular-nums">
                      {r.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
