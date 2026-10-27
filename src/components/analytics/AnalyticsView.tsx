/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Eye,
  Calendar,
  Layers,
  Inbox,
  Send,
  ShieldAlert,
} from 'lucide-react';
import {
  DeliveryStatus,
  EmailDirection,
  FilterState,
  NormalizedEmailRecord,
} from '../../types/email.ts';
import { exportFilteredRecordsToCsv } from '../../services/exportService.ts';

interface AnalyticsViewProps {
  records: NormalizedEmailRecord[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onResetFilters: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  records,
  filters,
  setFilters,
  onResetFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<keyof NormalizedEmailRecord>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<NormalizedEmailRecord | null>(null);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === undefined || aVal === null) return sortAsc ? -1 : 1;
      if (bVal === undefined || bVal === null) return sortAsc ? 1 : -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [records, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: keyof NormalizedEmailRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for dates/counts
    }
  };

  const hasActiveFilters = Boolean(
    filters.startDate ||
    filters.endDate ||
    filters.direction !== 'All' ||
    filters.status !== 'All' ||
    filters.senderQuery ||
    filters.recipientQuery ||
    filters.domainQuery ||
    filters.messageIdQuery
  );

  return (
    <div className="w-full p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Email Activity Explorer
            </h3>
            <p className="text-xs text-slate-500">
              Filtered records: <span className="font-mono font-semibold text-slate-900 tabular-nums">{records.length.toLocaleString()}</span> entries
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
            <button
              onClick={() => exportFilteredRecordsToCsv(records)}
              disabled={records.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-100">
          {/* Sender Search */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Sender Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sender..."
                value={filters.senderQuery}
                onChange={(e) => {
                  setFilters({ ...filters, senderQuery: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Recipient Search */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Recipient Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search recipient..."
                value={filters.recipientQuery}
                onChange={(e) => {
                  setFilters({ ...filters, recipientQuery: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Direction Filter */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Direction</label>
            <select
              value={filters.direction}
              onChange={(e) => {
                setFilters({ ...filters, direction: e.target.value as any });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Directions</option>
              <option value="Outbound">Outbound (Sent)</option>
              <option value="Inbound">Inbound (Received)</option>
              <option value="Internal">Internal (Intra-tenant)</option>
              <option value="Unknown">Unknown Direction</option>
            </select>
          </div>

          {/* Delivery Status Filter */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Delivery Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value as any });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Delivered">Delivered (Success)</option>
              <option value="Failed">Failed (Bounce / Error)</option>
              <option value="Deferred">Deferred (Greylisted / Retry)</option>
              <option value="Pending">Pending (In Queue)</option>
              <option value="Quarantined">Quarantined (Spam / Phish)</option>
              <option value="Expanded">Expanded (DL)</option>
              <option value="Unknown">Unknown Status</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Date Range End */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Domain Query */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Domain Filter</label>
            <input
              type="text"
              placeholder="e.g. contoso.com"
              value={filters.domainQuery}
              onChange={(e) => {
                setFilters({ ...filters, domainQuery: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Message ID Query */}
          <div className="space-y-1">
            <label className="text-slate-600 font-medium">Message ID Search</label>
            <input
              type="text"
              placeholder="Search Message ID..."
              value={filters.messageIdQuery}
              onChange={(e) => {
                setFilters({ ...filters, messageIdQuery: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Records Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">No Matching Records</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No email events matched your active filter criteria. Try clearing queries or expanding the date range.
            </p>
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Clear All Active Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th
                      onClick={() => handleSort('timestamp')}
                      className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Timestamp (UTC)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('sender')}
                      className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Sender</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('recipient')}
                      className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Recipient</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('direction')}
                      className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Direction</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Delivery Status</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap">Subject</th>
                    <th className="py-3 px-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                        {r.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 max-w-[220px] truncate" title={r.sender}>
                        {r.sender}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 max-w-[220px] truncate" title={r.recipient}>
                        {r.recipient}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            r.direction === 'Outbound'
                              ? 'text-indigo-700'
                              : r.direction === 'Inbound'
                              ? 'text-sky-700'
                              : r.direction === 'Internal'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {r.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            r.status === 'Delivered'
                              ? 'text-emerald-700'
                              : r.status === 'Failed'
                              ? 'text-rose-700 font-semibold'
                              : r.status === 'Deferred'
                              ? 'text-amber-700'
                              : r.status === 'Quarantined'
                              ? 'text-purple-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.errorDetail && (
                          <span className="block text-[10px] text-rose-500 font-mono truncate max-w-[200px]" title={r.errorDetail}>
                            {r.errorDetail}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-[240px] truncate" title={r.subject || 'No subject'}>
                        {r.subject || <span className="text-slate-400 italic">No subject</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectRecord(r)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Inspect raw message telemetry"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-mono"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-400">|</span>
                <span>
                  Showing <span className="font-mono tabular-nums">{((currentPage - 1) * pageSize) + 1}</span> -{' '}
                  <span className="font-mono tabular-nums">{Math.min(currentPage * pageSize, sortedRecords.length)}</span> of{' '}
                  <span className="font-mono tabular-nums">{sortedRecords.length.toLocaleString()}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Inspect Record Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Email Event Telemetry Details
              </h3>
              <button
                onClick={() => setInspectRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Timestamp:</span>
                <span className="col-span-2 font-mono text-slate-900">{inspectRecord.timestamp}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Sender Address:</span>
                <span className="col-span-2 font-mono text-slate-900">{inspectRecord.sender}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Recipient Address:</span>
                <span className="col-span-2 font-mono text-slate-900">{inspectRecord.recipient}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Direction:</span>
                <span className="col-span-2 font-medium text-slate-900">{inspectRecord.direction}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Delivery Status:</span>
                <span className="col-span-2 font-medium text-slate-900">
                  {inspectRecord.status} (Raw: &quot;{inspectRecord.rawStatus}&quot;)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Subject:</span>
                <span className="col-span-2 text-slate-900">{inspectRecord.subject || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Message ID:</span>
                <span className="col-span-2 font-mono text-slate-900 break-all">{inspectRecord.messageId || 'Not Captured'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Original Client IP:</span>
                <span className="col-span-2 font-mono text-slate-900">{inspectRecord.sourceIp || 'Not Available'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Delivery Latency:</span>
                <span className="col-span-2 font-mono text-slate-900">
                  {inspectRecord.latencyMs !== undefined ? `${inspectRecord.latencyMs} ms` : 'Not Available'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500">Message Size:</span>
                <span className="col-span-2 font-mono text-slate-900">
                  {inspectRecord.sizeBytes !== undefined ? `${(inspectRecord.sizeBytes / 1024).toFixed(1)} KB (${inspectRecord.sizeBytes} bytes)` : 'Not Available'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1">
                <span className="text-slate-500">Error / NDR Detail:</span>
                <span className="col-span-2 font-mono text-rose-700">
                  {inspectRecord.errorDetail || 'None reported'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setInspectRecord(null)}
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
