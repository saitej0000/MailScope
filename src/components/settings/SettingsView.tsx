/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Trash2,
  Clock,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SecurityConfig } from '../../types/email.ts';
import { DEFAULT_SECURITY_CONFIG } from '../../constants/defaults.ts';

interface SettingsViewProps {
  config: SecurityConfig;
  onSaveConfig: (newConfig: SecurityConfig) => void;
  onClearData: () => void;
  isDemoData: boolean;
  activeRecordCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onClearData,
  isDemoData,
  activeRecordCount,
}) => {
  const [formData, setFormData] = useState<SecurityConfig>({ ...config });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_SECURITY_CONFIG });
    onSaveConfig({ ...DEFAULT_SECURITY_CONFIG });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Analysis & Security Rule Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tune operational thresholds, detection baselines, business hours, and data retention parameters. Changes recalculate active alerts immediately.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Security configuration saved and applied to active dataset calculations.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thresholds Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Rule-Based Detection Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                High Outbound Volume Threshold (Records)
              </label>
              <input
                type="number"
                min={1}
                max={5000}
                value={formData.outboundVolumeThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, outboundVolumeThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Trigger alerts when outbound send count from a sender exceeds this value.
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Failure Rate Threshold (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.failureRateThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, failureRateThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Trigger alert if sender delivery failure rate exceeds this percentage (min 4 attempts).
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Repeated Failure Count Threshold
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={formData.repeatedFailureThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, repeatedFailureThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Number of consecutive failed deliveries to a single recipient before alerting.
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Short Interval Burst (Messages in Window)
              </label>
              <input
                type="number"
                min={2}
                max={200}
                value={formData.burstThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, burstThreshold: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Flag rapid dispatch concentration if a sender sends this many messages in 5 minutes.
              </span>
            </div>
          </div>
        </div>

        {/* Operational Schedule Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Operational Window & Business Hours
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Business Hours Start (UTC)</label>
              <select
                value={formData.businessHoursStart}
                onChange={(e) =>
                  setFormData({ ...formData, businessHoursStart: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00 UTC
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Business Hours End (UTC)</label>
              <select
                value={formData.businessHoursEnd}
                onChange={(e) =>
                  setFormData({ ...formData, businessHoursEnd: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00 UTC
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Time Zone Reference</label>
              <select
                value={formData.timeZone}
                onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (Eastern)</option>
                <option value="America/Chicago">America/Chicago (Central)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI & Reporting Preference */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              AI-Assisted Report Generation Preference
            </h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">
                Enable AI-Assisted Report Writer
              </span>
              <span className="text-slate-500">
                When enabled, uses Google Gemini via server-side API to format executive analytical briefings. If disabled or when unconfigured, uses the deterministic local rule engine.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.aiReportEnabled}
              onChange={(e) => setFormData({ ...formData, aiReportEnabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300"
            />
          </div>
        </div>

        {/* Data Retention & Privacy Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Data Retention & Privacy Controls
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            MailScope enforces privacy-first data handling. Uploaded message tracking logs and derived analytics reside in browser session memory. No uploaded records are permanently persisted to disk or cloud databases.
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block">Active Dataset Status:</span>
              <span className="text-slate-500">
                {activeRecordCount > 0
                  ? `${activeRecordCount.toLocaleString()} records loaded (${isDemoData ? 'Demo Synthetic' : 'User Imported'})`
                  : 'No dataset currently loaded in session memory.'}
              </span>
            </div>
            {activeRecordCount > 0 && (
              <button
                type="button"
                onClick={onClearData}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Clear Current Data
              </button>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to System Defaults</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
