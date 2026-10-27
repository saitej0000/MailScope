/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivePage,
  Sidebar,
  TopHeader,
} from './components/layout/Navigation.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { ImportView } from './components/import/ImportView.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { DeliveryView } from './components/delivery/DeliveryView.tsx';
import { SecurityView } from './components/security/SecurityView.tsx';
import { AiReportView } from './components/report/AiReportView.tsx';
import { ExportView } from './components/export/ExportView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { ProjectInfoView } from './components/info/ProjectInfoView.tsx';
import { ConfirmModal } from './components/common/ConfirmModal.tsx';
import {
  AlertStatus,
  DeliveryStatus,
  EmailDirection,
  FilterState,
  ImportSummary,
  NormalizedEmailRecord,
  SecurityAlert,
  SecurityConfig,
} from './types/email.ts';
import {
  DEFAULT_SECURITY_CONFIG,
  INITIAL_FILTER_STATE,
} from './constants/defaults.ts';
import {
  computeAggregatedMetrics,
  filterRecords,
} from './services/analytics.ts';
import { evaluateSecurityRules } from './services/securityRules.ts';
import {
  autoDetectColumnMapping,
  normalizeRecords,
} from './services/dataParser.ts';
import { SYNTHETIC_M365_RAW_ROWS } from './data/demoData.ts';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [records, setRecords] = useState<NormalizedEmailRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [config, setConfig] = useState<SecurityConfig>(DEFAULT_SECURITY_CONFIG);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Re-evaluate security alerts whenever records or config changes
  useEffect(() => {
    if (records.length === 0) {
      setAlerts([]);
      return;
    }
    const newAlerts = evaluateSecurityRules(records, config, alerts);
    setAlerts(newAlerts);
  }, [records, config]);

  // Compute filtered records for active exploration
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  // Compute aggregated analytical metrics based on filtered records
  const metrics = useMemo(() => {
    const calculated = computeAggregatedMetrics(filteredRecords);

    // Correlate alert severities
    const crit = alerts.filter((a) => a.severity === 'Critical').length;
    const hi = alerts.filter((a) => a.severity === 'High').length;
    const med = alerts.filter((a) => a.severity === 'Medium').length;
    const lo = alerts.filter((a) => a.severity === 'Low').length;

    calculated.totalAlerts = alerts.length;
    calculated.criticalAlerts = crit;
    calculated.highAlerts = hi;
    calculated.mediumAlerts = med;
    calculated.lowAlerts = lo;

    return calculated;
  }, [filteredRecords, alerts]);

  // Load Synthetic Demo Data
  const handleLoadDemoData = () => {
    const headers = Object.keys(SYNTHETIC_M365_RAW_ROWS[0]);
    const mapping = autoDetectColumnMapping(headers);
    const result = normalizeRecords(SYNTHETIC_M365_RAW_ROWS, mapping);

    const summary: ImportSummary = {
      fileName: 'M365_MessageTrace_Synthetic_Demo.csv',
      fileSizeBytes: 24500,
      fileType: 'demo',
      totalRows: SYNTHETIC_M365_RAW_ROWS.length,
      acceptedRows: result.acceptedCount,
      rejectedRows: result.rejectedCount,
      duplicateRows: result.duplicateCount,
      rejectionDetails: result.rejections,
      mappedColumns: mapping as unknown as Record<string, string>,
      detectedHeaders: headers,
      importedAt: new Date().toISOString(),
    };

    setRecords(result.records);
    setImportSummary(summary);
    setIsDemoData(true);
    setFilters(INITIAL_FILTER_STATE);
    setReportContent(null);
    setActivePage('dashboard');
  };

  // Import User Uploaded Records
  const handleImportSuccess = (
    newRecords: NormalizedEmailRecord[],
    summary: ImportSummary
  ) => {
    setRecords(newRecords);
    setImportSummary(summary);
    setIsDemoData(false);
    setFilters(INITIAL_FILTER_STATE);
    setReportContent(null);
    setActivePage('dashboard');
  };

  // Clear Active Dataset
  const handleConfirmClear = () => {
    setRecords([]);
    setFilters(INITIAL_FILTER_STATE);
    setImportSummary(null);
    setIsDemoData(false);
    setAlerts([]);
    setReportContent(null);
    setShowClearModal(false);
    setActivePage('dashboard');
  };

  // Quick Filter Action from Dashboard or Delivery Views
  const handleQuickFilter = (qf: {
    direction?: EmailDirection;
    status?: DeliveryStatus;
  }) => {
    setFilters((prev) => ({
      ...prev,
      direction: qf.direction || prev.direction,
      status: qf.status || prev.status,
    }));
  };

  // Update specific alert status and analyst notes
  const handleUpdateAlertStatus = (
    alertId: string,
    newStatus: AlertStatus,
    notes?: string
  ) => {
    setAlerts((prev) =>
      prev.map((alt) =>
        alt.id === alertId
          ? {
              ...alt,
              status: newStatus,
              notes: notes !== undefined ? notes : alt.notes,
              updatedAt: new Date().toISOString(),
            }
          : alt
      )
    );
  };

  const datasetSource = isDemoData
    ? 'Synthetic Demo Dataset (M365 EAC Simulation)'
    : importSummary?.fileName || 'Uploaded EAC Log';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Header - Full Width */}
      <TopHeader
        activePage={activePage}
        recordCount={records.length}
        alertCount={alerts.length}
        isDemoData={isDemoData}
        onClearData={() => setShowClearModal(true)}
        onLoadDemo={handleLoadDemoData}
      />

      {/* Main Container: Compact Left Sidebar + Flexible Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          recordCount={records.length}
          alertCount={alerts.length}
          isDemoData={isDemoData}
        />

        {/* Flexible Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto w-full">
          {activePage === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              alerts={alerts}
              onNavigate={setActivePage}
              onQuickFilter={handleQuickFilter}
              onLoadDemo={handleLoadDemoData}
            />
          )}

            {activePage === 'import' && (
              <ImportView
                onImportSuccess={handleImportSuccess}
                onLoadDemo={handleLoadDemoData}
                activeSummary={importSummary}
                activeRecordCount={records.length}
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsView
                records={filteredRecords}
                filters={filters}
                setFilters={setFilters}
                onResetFilters={() => setFilters(INITIAL_FILTER_STATE)}
              />
            )}

            {activePage === 'delivery' && (
              <DeliveryView
                metrics={metrics}
                records={filteredRecords}
                onFilterByEntity={(email) => {
                  setFilters((prev) => ({ ...prev, recipientQuery: email }));
                  setActivePage('analytics');
                }}
              />
            )}

            {activePage === 'security' && (
              <SecurityView
                alerts={alerts}
                config={config}
                onUpdateAlertStatus={handleUpdateAlertStatus}
                onNavigateToSettings={() => setActivePage('settings')}
              />
            )}

            {activePage === 'ai-report' && (
              <AiReportView
                metrics={metrics}
                alerts={alerts}
                filters={filters}
                config={config}
                datasetSource={datasetSource}
                reportContent={reportContent}
                setReportContent={setReportContent}
                onNavigateToSettings={() => setActivePage('settings')}
              />
            )}

            {activePage === 'export' && (
              <ExportView
                metrics={metrics}
                filteredRecords={filteredRecords}
                alerts={alerts}
                filters={filters}
                datasetSource={datasetSource}
                aiReportContent={reportContent}
              />
            )}

            {activePage === 'settings' && (
              <SettingsView
                config={config}
                onSaveConfig={setConfig}
                onClearData={() => setShowClearModal(true)}
                isDemoData={isDemoData}
                activeRecordCount={records.length}
              />
            )}

            {activePage === 'info' && <ProjectInfoView />}
          </main>
        </div>

      {/* Confirmation Modal for Clearing Active Dataset */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Current Active Dataset?"
        message="This action will wipe all imported email records, computed KPI metrics, security alerts, and generated reports from session memory. You can re-import your report or load demo data at any time."
        confirmLabel="Clear All Data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
