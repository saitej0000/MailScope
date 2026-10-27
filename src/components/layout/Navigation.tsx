/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  Send,
  ShieldAlert,
  FileText,
  Download,
  Settings,
  Info,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export type ActivePage =
  | 'dashboard'
  | 'import'
  | 'analytics'
  | 'delivery'
  | 'security'
  | 'ai-report'
  | 'export'
  | 'settings'
  | 'info';

interface TopHeaderProps {
  activePage: ActivePage;
  recordCount: number;
  alertCount: number;
  isDemoData: boolean;
  onClearData: () => void;
  onLoadDemo: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activePage,
  recordCount,
  alertCount,
  isDemoData,
  onClearData,
  onLoadDemo,
}) => {
  const getPageTitle = (page: ActivePage) => {
    switch (page) {
      case 'dashboard':
        return 'Executive Overview & Activity Metrics';
      case 'import':
        return 'Import Email Activity Reports';
      case 'analytics':
        return 'Email Activity Explorer & Search';
      case 'delivery':
        return 'Delivery Performance & Failure Analysis';
      case 'security':
        return 'Rule-Based Security Monitoring';
      case 'ai-report':
        return 'AI-Assisted Security & Delivery Report';
      case 'export':
        return 'Analytical Reports & Data Exports';
      case 'settings':
        return 'Security Rules & Analysis Configuration';
      case 'info':
        return 'College Micro-Project Documentation';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8 sticky top-0 z-30 w-full shrink-0">
      {/* Zone 1: Brand wordmark & subtitle */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          M
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            MailScope
          </span>
          <span className="hidden md:inline text-xs text-slate-500 font-medium">
            Office 365 Email Activity Analyzer
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual Page Title & Dataset Indicator */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 truncate">
        <span className="font-medium text-slate-800">{getPageTitle(activePage)}</span>
        <span aria-hidden="true" className="text-slate-300">/</span>
        {recordCount > 0 ? (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              {isDemoData ? 'Demo Dataset (Synthetic)' : 'Uploaded EAC Report'}
            </span>
            <span className="font-mono text-slate-900 font-medium whitespace-nowrap">
              ({recordCount.toLocaleString()} records)
            </span>
          </div>
        ) : (
          <span className="text-slate-400">No active dataset loaded</span>
        )}
      </div>

      {/* Zone 3: Primary action & Clear action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {recordCount === 0 ? (
          <button
            onClick={onLoadDemo}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs whitespace-nowrap"
          >
            Load Demo Data
          </button>
        ) : (
          <button
            onClick={onClearData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap"
            title="Clear active dataset and computed metrics"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Current Data</span>
          </button>
        )}
      </div>
    </header>
  );
};

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  recordCount: number;
  alertCount: number;
  isDemoData: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  recordCount,
  alertCount,
  isDemoData,
}) => {
  const navItems = [
    { id: 'dashboard' as ActivePage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import' as ActivePage, label: 'Import Reports', icon: UploadCloud },
    { id: 'analytics' as ActivePage, label: 'Email Analytics', icon: BarChart3 },
    { id: 'delivery' as ActivePage, label: 'Delivery Analysis', icon: Send },
    {
      id: 'security' as ActivePage,
      label: 'Security Monitoring',
      icon: ShieldAlert,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    { id: 'ai-report' as ActivePage, label: 'AI Report Writer', icon: FileText },
    { id: 'export' as ActivePage, label: 'Report Export', icon: Download },
    { id: 'settings' as ActivePage, label: 'Settings', icon: Settings },
    { id: 'info' as ActivePage, label: 'Project Information', icon: Info },
  ];

  return (
    <aside className="w-full md:w-60 lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 md:min-h-[calc(100vh-4rem)]">
      <div className="p-3 sm:p-4 flex-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm font-semibold shrink-0 ${
                      isActive
                        ? 'bg-indigo-200 text-indigo-900'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dataset status footer in sidebar */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-slate-50/50 text-xs">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Active Dataset
        </div>
        {recordCount > 0 ? (
          <div className="space-y-1 text-slate-600">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isDemoData ? 'Demo Active' : 'Imported'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Records:</span>
              <span className="font-mono font-medium text-slate-900">
                {recordCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Alerts:</span>
              <span className={`font-mono font-medium ${alertCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {alertCount}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 py-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Ready for report import</span>
          </div>
        )}
      </div>
    </aside>
  );
};
