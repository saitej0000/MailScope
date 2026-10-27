/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Eye,
  Sliders,
  Filter,
  Info,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  Search,
} from 'lucide-react';
import {
  AlertSeverity,
  AlertStatus,
  SecurityAlert,
  SecurityConfig,
} from '../../types/email.ts';
import { exportSecurityAlertsToCsv } from '../../services/exportService.ts';

interface SecurityViewProps {
  alerts: SecurityAlert[];
  config: SecurityConfig;
  onUpdateAlertStatus: (alertId: string, newStatus: AlertStatus, notes?: string) => void;
  onNavigateToSettings: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  alerts,
  config,
  onUpdateAlertStatus,
  onNavigateToSettings,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'All' | AlertSeverity>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | AlertStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [analystNotes, setAnalystNotes] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !a.affectedEntity.toLowerCase().includes(q) &&
          !a.ruleName.toLowerCase().includes(q) &&
          !a.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, severityFilter, statusFilter, searchQuery]);

  const handleOpenDetail = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setAnalystNotes(alert.notes || '');
  };

  const handleSaveStatus = (newStatus: AlertStatus) => {
    if (!selectedAlert) return;
    onUpdateAlertStatus(selectedAlert.id, newStatus, analystNotes);
    setSelectedAlert({
      ...selectedAlert,
      status: newStatus,
      notes: analystNotes,
      updatedAt: new Date().toISOString(),
    });
  };

  const severityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'Critical':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm text-[11px] font-semibold">CRITICAL</span>;
      case 'High':
        return <span className="text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-sm text-[11px] font-semibold">HIGH</span>;
      case 'Medium':
        return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm text-[11px] font-semibold">MEDIUM</span>;
      case 'Low':
        return <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm text-[11px] font-semibold">LOW</span>;
    }
  };

  const statusBadge = (st: AlertStatus) => {
    switch (st) {
      case 'New':
        return <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm text-[11px] font-medium">New</span>;
      case 'Investigating':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm text-[11px] font-medium">Investigating</span>;
      case 'Resolved':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm text-[11px] font-medium">Resolved</span>;
      case 'False Positive':
        return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm text-[11px] font-medium">False Positive</span>;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Security Monitoring & Anomaly Detection
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rule-based detection for unusual outbound volume, recurring bounces, off-hours dispatch, and short-interval bursts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSecurityAlertsToCsv(alerts)}
            disabled={alerts.length === 0}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
          >
            Export Alerts CSV
          </button>
          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configure Thresholds</span>
          </button>
        </div>
      </div>

      {/* Cyber Security Analyst Principles Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900">Analyst Triage Notice: </span>
          A high volume alert or after-hours send is an indicator for operational verification, not conclusive proof of account takeover. Legitimate business bulk notices, international time zones, and scheduled automation frequently generate anomalies. Always correlate with Microsoft Entra ID sign-in telemetry.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search affected entity, rule, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">No Security Alerts</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No anomalies exceeded configured threshold rules under current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Alert ID</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Detection Rule</th>
                  <th className="py-3 px-3">Affected Entity</th>
                  <th className="py-3 px-3">Observed vs Threshold</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {alt.id}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {severityBadge(alt.severity)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {alt.ruleName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800 max-w-[200px] truncate" title={alt.affectedEntity}>
                      {alt.affectedEntity}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      <span className="font-semibold text-slate-900">{alt.observedValue}</span> / {alt.threshold}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {statusBadge(alt.status)}
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(alt)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Investigation Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedAlert.id}: {selectedAlert.ruleName}</span>
                    {severityBadge(selectedAlert.severity)}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Event time: {selectedAlert.timestamp}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Evidence Section */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Evidence & Analytical Explanation
                </span>
                <p className="text-slate-800 leading-relaxed font-sans">
                  {selectedAlert.evidenceExplanation}
                </p>
                <div className="pt-2 border-t border-slate-200 text-slate-600 font-mono text-[11px] flex gap-4">
                  <span><strong>Observed:</strong> {selectedAlert.observedValue}</span>
                  <span><strong>Threshold:</strong> {selectedAlert.threshold}</span>
                  <span><strong>Entity:</strong> {selectedAlert.affectedEntity}</span>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                  Recommended Administrative Action
                </span>
                <p className="text-indigo-900 leading-relaxed">
                  {selectedAlert.recommendedAction}
                </p>
              </div>

              {/* Related Record References */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Correlated Records ({selectedAlert.relatedRecordIds.length} references)
                </span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-600 max-h-24 overflow-y-auto">
                  {selectedAlert.relatedRecordIds.length > 0 ? (
                    selectedAlert.relatedRecordIds.join(', ')
                  ) : (
                    'Aggregated metric alert; no individual record IDs specified.'
                  )}
                </div>
              </div>

              {/* Analyst Triage & State Management */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Analyst Triage & Investigation Notes
                </span>
                <textarea
                  rows={2}
                  placeholder="Record investigation findings, ticket reference, or reason for resolution..."
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs font-sans"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <span className="text-slate-500">Update Alert Status:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSaveStatus('Investigating')}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-medium"
                  >
                    Investigating
                  </button>
                  <button
                    onClick={() => handleSaveStatus('Resolved')}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-medium"
                  >
                    Resolve Alert
                  </button>
                  <button
                    onClick={() => handleSaveStatus('False Positive')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium"
                  >
                    False Positive
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
