/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ColumnMapping,
  ImportSummary,
  NormalizedEmailRecord,
  RawEmailRecord,
} from '../../types/email.ts';
import { STANDARD_COLUMNS } from '../../constants/defaults.ts';
import {
  autoDetectColumnMapping,
  normalizeRecords,
  parseCsvFile,
  parseExcelBuffer,
} from '../../services/dataParser.ts';
import { generateSampleCsvContent } from '../../data/demoData.ts';
import { downloadFile } from '../../services/exportService.ts';

interface ImportViewProps {
  onImportSuccess: (records: NormalizedEmailRecord[], summary: ImportSummary) => void;
  onLoadDemo: () => void;
  activeSummary: ImportSummary | null;
  activeRecordCount: number;
}

export const ImportView: React.FC<ImportViewProps> = ({
  onImportSuccess,
  onLoadDemo,
  activeSummary,
  activeRecordCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File staging states
  const [stagedFile, setStagedFile] = useState<{
    name: string;
    size: number;
    type: 'csv' | 'xlsx' | 'xls';
    rawRows: RawEmailRecord[];
    headers: string[];
  } | null>(null);

  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    timestamp: '',
    sender: '',
    recipient: '',
    status: '',
  });

  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showRejectionsModal, setShowRejectionsModal] = useState(false);
  const [currentImportSummary, setCurrentImportSummary] = useState<ImportSummary | null>(activeSummary);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsvContent();
    downloadFile(csvContent, 'm365-message-trace-sample.csv', 'text/csv;charset=utf-8;');
  };

  const processUploadedFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const fileName = file.name.toLowerCase();
      let rawRows: RawEmailRecord[] = [];
      let headers: string[] = [];
      let fileType: 'csv' | 'xlsx' | 'xls' = 'csv';

      if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        fileType = 'csv';
        const text = await file.text();
        if (!text.trim()) {
          throw new Error('Uploaded CSV file is completely empty.');
        }
        const parsed = await parseCsvFile(text);
        rawRows = parsed.rows;
        headers = parsed.headers;
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        fileType = fileName.endsWith('.xlsx') ? 'xlsx' : 'xls';
        const buffer = await file.arrayBuffer();
        const parsed = parseExcelBuffer(buffer);
        rawRows = parsed.rows;
        headers = parsed.headers;
      } else {
        throw new Error('Unsupported file extension. Please upload a .CSV, .XLSX, or .XLS file.');
      }

      if (headers.length === 0 || rawRows.length === 0) {
        throw new Error('The file contains no readable data rows or column headers.');
      }

      // Auto-detect column mapping
      const detectedMapping = autoDetectColumnMapping(headers);

      setStagedFile({
        name: file.name,
        size: file.size,
        type: fileType,
        rawRows,
        headers,
      });

      setColumnMapping(detectedMapping);
      setShowMappingModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while reading the file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFinalizeImport = () => {
    if (!stagedFile) return;

    // Validate required mappings
    if (!columnMapping.timestamp || !columnMapping.sender || !columnMapping.recipient || !columnMapping.status) {
      setErrorMessage('Please map all required fields: Timestamp, Sender, Recipient, and Status.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = normalizeRecords(stagedFile.rawRows, columnMapping, { maxRows: 50000 });

      if (result.acceptedCount === 0) {
        throw new Error('Zero records were accepted. All rows failed validation checks. Please review your column mappings or check the file format.');
      }

      const summary: ImportSummary = {
        fileName: stagedFile.name,
        fileSizeBytes: stagedFile.size,
        fileType: stagedFile.type,
        totalRows: stagedFile.rawRows.length,
        acceptedRows: result.acceptedCount,
        rejectedRows: result.rejectedCount,
        duplicateRows: result.duplicateCount,
        rejectionDetails: result.rejections,
        mappedColumns: columnMapping as unknown as Record<string, string>,
        detectedHeaders: stagedFile.headers,
        importedAt: new Date().toISOString(),
      };

      setCurrentImportSummary(summary);
      setShowMappingModal(false);
      setStagedFile(null);
      onImportSuccess(result.records, summary);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during row normalization.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Import Microsoft 365 Email Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Parse, validate, and normalize Exchange Admin Center (EAC) or Microsoft 365 Security message tracking reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </button>
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Demo Data</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-xs">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Import Error: </span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={handleFileSelect}
          className="hidden"
          id="m365-file-upload"
        />
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">
          Upload Message Trace Export (CSV, XLSX, XLS)
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Drag and drop your exported report file here, or browse from your computer. Configurable upload limit is 50,000 rows.
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <label
            htmlFor="m365-file-upload"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors shadow-xs"
          >
            {isProcessing ? 'Processing File...' : 'Select File'}
          </label>
        </div>

        <div className="mt-4 text-[11px] text-slate-400">
          Supported sources: Microsoft 365 Admin Center, Exchange Online Message Trace, Exchange Server MessageTrackingLog
        </div>
      </div>

      {/* Active Import Summary Banner */}
      {currentImportSummary && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Import Validation Summary: {currentImportSummary.fileName}
                </h4>
                <p className="text-xs text-slate-500">
                  Imported at {new Date(currentImportSummary.importedAt).toLocaleTimeString()} · File size: {(currentImportSummary.fileSizeBytes / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {currentImportSummary.rejectionDetails.length > 0 && (
              <button
                onClick={() => setShowRejectionsModal(true)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Row Rejection Details ({currentImportSummary.rejectionDetails.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Total Rows Processed</span>
              <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block tabular-nums">
                {currentImportSummary.totalRows.toLocaleString()}
              </span>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
              <span className="text-emerald-700 block font-medium">Accepted & Validated</span>
              <span className="text-base font-bold font-mono text-emerald-800 mt-0.5 block tabular-nums">
                {currentImportSummary.acceptedRows.toLocaleString()}
              </span>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100">
              <span className="text-amber-700 block font-medium">Duplicate Rows</span>
              <span className="text-base font-bold font-mono text-amber-800 mt-0.5 block tabular-nums">
                {currentImportSummary.duplicateRows.toLocaleString()}
              </span>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-100">
              <span className="text-rose-700 block font-medium">Rejected / Invalid</span>
              <span className="text-base font-bold font-mono text-rose-800 mt-0.5 block tabular-nums">
                {currentImportSummary.rejectedRows.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping & Preview Modal */}
      {showMappingModal && stagedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  Map Columns: {stagedFile.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm or adjust column associations. Required fields are marked with an asterisk (*).
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMappingModal(false);
                  setStagedFile(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Mapping Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {STANDARD_COLUMNS.map((col) => {
                  const currentValue = (columnMapping as any)[col.key] || '';
                  return (
                    <div key={col.key} className="space-y-1">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>
                          {col.label} {col.required && <span className="text-rose-500">*</span>}
                        </span>
                        {currentValue && (
                          <span className="text-[10px] text-emerald-600 font-mono">Matched</span>
                        )}
                      </label>
                      <select
                        value={currentValue}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [col.key]: e.target.value })
                        }
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                          col.required && !currentValue
                            ? 'border-rose-300 bg-rose-50/20'
                            : 'border-slate-300'
                        }`}
                      >
                        <option value="">-- Unmapped --</option>
                        {stagedFile.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 block truncate" title={col.hint}>
                        {col.hint}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Raw Rows Preview Table */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Raw File Preview (First 5 Rows of {stagedFile.rawRows.length.toLocaleString()})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stagedFile.headers.length} Columns Detected
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        {stagedFile.headers.map((h) => (
                          <th key={h} className="py-1.5 px-2 font-mono text-slate-600 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {stagedFile.rawRows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {stagedFile.headers.map((h) => (
                            <td key={h} className="py-1 px-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Ready to normalize <span className="font-mono font-semibold text-slate-800">{stagedFile.rawRows.length.toLocaleString()}</span> records.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMappingModal(false);
                    setStagedFile(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeImport}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
                >
                  <span>Confirm & Run Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Rejections Details Modal */}
      {showRejectionsModal && currentImportSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Row Rejection Details ({currentImportSummary.rejectionDetails.length} items)
              </h3>
              <button
                onClick={() => setShowRejectionsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs">
              <p className="text-slate-500 mb-3">
                The following rows were omitted from analytics due to structural validation failures or duplicate event signatures.
              </p>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {currentImportSummary.rejectionDetails.map((rej, i) => (
                  <div key={i} className="p-2.5 flex items-start justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <span className="font-mono text-slate-400 font-medium">Row #{rej.rowNumber}:</span>{' '}
                      <span className="font-medium text-rose-700">{rej.reason}</span>
                      {rej.rawSnippet && (
                        <span className="block font-mono text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                          Snippet: {rej.rawSnippet}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowRejectionsModal(false)}
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
