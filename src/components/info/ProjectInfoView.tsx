/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  GraduationCap,
  Layers,
  Cpu,
  Shield,
  FileCheck,
  Compass,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

export const ProjectInfoView: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <GraduationCap className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wide uppercase">
            College Micro-Project Documentation
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          MailScope — Office 365 Email Activity Analyzer and Security Monitor
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Information and Cyber Security Analytical System for Message Tracking and Threat Triage.
        </p>
      </div>

      {/* Grid of Architectural Sections */}
      <div className="space-y-6 text-xs text-slate-700">
        {/* Section 1: Problem Statement & Objectives */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            1. Problem Statement & Project Objectives
          </h3>
          <p className="leading-relaxed">
            Enterprise messaging environments in Microsoft 365 and Exchange Online process millions of daily email transactions across internal, inbound, and outbound routes. While the Microsoft 365 Admin Center and Exchange Admin Center (EAC) permit exporting raw message trace logs, the exported CSV datasets lack unified visualization, automated anomaly correlation, and delivery diagnostic metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-900 block mb-1">Primary Objective</span>
              <span>
                Provide IT administrators and cybersecurity analysts with an automated engine to parse, validate, and compute operational statistics from M365 email trace logs without requiring persistent storage.
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-900 block mb-1">Security Objective</span>
              <span>
                Implement deterministic rule heuristics to detect outbound volume surges, off-hours spikes, burst dispatch, repeated delivery failures, and potential replay loops.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Technologies Used */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            2. Technologies & Architectural Stack
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-900 block">Frontend Architecture</span>
              <span className="text-slate-500 mt-1 block">
                React 19, TypeScript, Tailwind CSS, Recharts for responsive visualizations, Lucide React icons.
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-900 block">Data Processing</span>
              <span className="text-slate-500 mt-1 block">
                PapaParse for streaming CSV parsing, SheetJS (XLSX) for Excel parsing, custom schema normalization engine.
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-900 block">Server & Intelligence</span>
              <span className="text-slate-500 mt-1 block">
                Node.js Express backend, @google/genai TypeScript SDK with Gemini 3.8 Flash for grounded report generation, Vitest automated testing suite.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Flow Pipeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            3. System Data Flow Pipeline
          </h3>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-700 leading-relaxed overflow-x-auto">
            [M365 Admin Export (CSV/XLSX)] 
              &rarr; [Header Detection & Column Mapping] 
              &rarr; [Data Normalization & RFC Validation]
              &rarr; [Duplicate Detection & Rejection Reporting] 
              &rarr; [Analytical Aggregation (KPIs, Time-Series)] 
              &rarr; [Security Rule Heuristics Engine] 
              &rarr; [Interactive Visual Explorer & Triage Console] 
              &rarr; [Formula-Protected CSV / Printable HTML Report]
          </div>
        </div>

        {/* Section 4: Security Monitoring Methodology */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            4. Security Monitoring Methodology & Heuristics
          </h3>
          <p className="leading-relaxed">
            The security engine implements 9 distinct rule heuristics:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>1. High Outbound Volume:</strong> Identifies senders exceeding normal outbound thresholds (potential compromised marketing tool or spambot).
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>2. High Failure Rate:</strong> Detects senders with elevated bounce percentages across multiple recipients.
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>3. Recurring Failures:</strong> Surfaces endpoints generating repeated non-delivery reports (5.1.1, host unreachability).
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>4. Off-Hours Activity:</strong> Flags mail transmissions dispatched outside configured operational business hours.
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>5. Rapid Transmission Burst:</strong> Flags sender concentrations exceeding threshold counts within 5-minute sliding intervals.
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>6. Baseline Volume Spike:</strong> Compares daily sending volume against calculated baseline multipliers.
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>7. Message ID Replay Anomaly:</strong> Detects identical network message identifiers occurring across distinct events.
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>8. Sender IP Transitions:</strong> Detects a sender dispatching mail from 3+ distinct IP addresses within the recorded window.
            </div>
            <div className="p-2 border border-slate-200 rounded-md bg-white">
              <strong>9. Data Quality Anomaly:</strong> Flags report deficiencies (missing Message IDs, unclassified statuses) that hinder forensics.
            </div>
          </div>
        </div>

        {/* Section 5: Current Limitations & Future Work */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Current Micro-Project Limitations
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Relies on exported report files rather than real-time Microsoft Graph webhook feeds.</li>
              <li>Does not analyze message body text or attachments (preserves strict organizational confidentiality).</li>
              <li>DKIM and SPF verification details are not included in basic Exchange message trace summaries.</li>
              <li>Storage is session-based; browser refresh clears data unless re-imported.</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Future Enhancements
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Direct Microsoft Graph API integration using delegated or application permissions.</li>
              <li>Automated Microsoft Entra ID Conditional Access revocation for critical compromised sender alerts.</li>
              <li>Integration with SIEM platforms via Syslog/CEF formatting.</li>
              <li>Machine learning baseline profiling across multi-month historical trends.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
