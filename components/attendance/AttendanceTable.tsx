"use client";

import { useState, Fragment } from "react";
import type { AttendanceRecord } from "@/types/attendance";
import { StatusBadge } from "./StatusBadge";

interface Props {
  records: AttendanceRecord[];
  page: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  onMarkLeave: (studentCode: string) => void;
  onEdit: (record: AttendanceRecord) => void;
  onDelete: (record: AttendanceRecord) => void;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function AttendanceTable({
  records,
  page,
  totalPages,
  totalFiltered,
  onPageChange,
  onMarkLeave,
  onEdit,
  onDelete,
}: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
        <p className="text-sm font-medium">No records found</p>
        <p className="text-xs mt-1">Sync biometric data or adjust filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-300">
              <th className="px-4 py-3 text-left font-medium text-xs w-10">#</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Student</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Punch In</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Punch Out</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Device Serial</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Status</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((record, i) => {
              const isExpanded = expandedRow === record.student.code;
              return (
                <Fragment key={record.student.code}>
                  <tr
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedRow(isExpanded ? null : record.student.code)
                    }
                  >
                    {/* # */}
                    <td className="px-4 py-3 text-gray-400 tabular-nums">
                      {page * 10 + i + 1}
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {getInitials(record.student.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.student.name}</p>
                          <p className="text-xs text-gray-400">{record.student.gender} · #{record.student.code}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                      {record.student.contact}
                    </td>

                    {/* Punch In */}
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {record.punchIn ?? "—"}
                    </td>

                    {/* Punch Out */}
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {record.punchOut ?? "—"}
                    </td>

                    {/* Serial */}
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs max-w-[140px] truncate">
                      {record.serialNumber}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={record.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {/* View */}
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : record.student.code)}
                          className="px-2.5 py-1 text-xs rounded-md border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title="View details"
                        >
                          View
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEdit(record)}
                          className="px-2.5 py-1 text-xs rounded-md border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                          title="Edit record"
                        >
                          <svg className="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDelete(record)}
                          className="px-2.5 py-1 text-xs rounded-md border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          title="Delete record"
                        >
                          <svg className="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          Delete
                        </button>

                        {/* Leave (only for Absent) */}
                        {record.status === "Absent" && (
                          <button
                            onClick={() => onMarkLeave(record.student.code)}
                            className="px-2.5 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr key={`${record.student.code}-detail`} className="bg-blue-50/60">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400 mb-0.5">Standard</p>
                            <p className="font-medium text-gray-700">{record.student.standard ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-0.5">Total punches</p>
                            <p className="font-medium text-gray-700">{record.logCount} log(s)</p>
                          </div>
                          {record.temperature != null && (
                            <div>
                              <p className="text-gray-400 mb-0.5">Temperature</p>
                              <p className="font-medium text-gray-700">
                                {record.temperature}°F
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${record.temperatureState === "Normal" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {record.temperatureState}
                                </span>
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400 mb-0.5">Date</p>
                            <p className="font-medium text-gray-700">{record.date}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
        <span>Showing {records.length} of {totalFiltered} records</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 text-xs rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs px-2">
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 text-xs rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );
}
