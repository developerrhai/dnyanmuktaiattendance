"use client";

import { useState } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { StatCards } from "@/components/attendance/StatCards";
import { FilterBar } from "@/components/attendance/FilterBar";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { AddEmployeeModal } from "@/components/attendance/AddEmployeeModal";
import { EditRecordModal } from "@/components/attendance/EditRecordModal";
import { DeleteConfirmModal } from "@/components/attendance/DeleteConfirmModal";
import type { AttendanceRecord } from "@/types/attendance";

export default function AttendancePage() {
  const {
    records,
    summary,
    filter,
    updateFilter,
    syncing,
    syncedAt,
    error,
    page,
    totalPages,
    totalFiltered,
    setPage,
    sync,
    markLeave,
    addEmployee,
    editRecord,
    deleteRecord,
  } = useAttendance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Student Attendance</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Biometric attendance via SmartOffice API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => sync(filter.date)}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <svg className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? "Syncing..." : "Sync Biometric"}
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add Employee
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3C6.48 3 2 7.48 2 12s4.48 9 10 9 10-4.48 10-10S17.52 3 12 3z"/>
          </svg>
          <span>
            <strong>Sync error:</strong> {error}.{" "}
            {error.includes("API Key") && "Check your SMARTOFFICE_API_KEY in .env.local."}
            {error.includes("Serial Number") && "Verify the device serial number in SmartOffice."}
          </span>
        </div>
      )}

      {/* Stat cards */}
      <StatCards summary={summary} />

      {/* Table card */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-900 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Attendance Records
          </h2>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {[
              { color: "bg-green-500",  label: "Present"  },
              { color: "bg-red-500",    label: "Absent"   },
              { color: "bg-amber-500",  label: "Late"     },
              { color: "bg-indigo-500", label: "On Leave" },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <FilterBar
          filter={filter}
          onChange={updateFilter}
          onSync={() => sync(filter.date)}
          syncing={syncing}
          syncedAt={syncedAt}
        />

        <AttendanceTable
          records={records}
          page={page}
          totalPages={totalPages}
          totalFiltered={totalFiltered}
          onPageChange={setPage}
          onMarkLeave={markLeave}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* Modals */}
      <AddEmployeeModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={addEmployee}
      />
      <EditRecordModal
        open={!!editTarget}
        record={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={editRecord}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        record={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteRecord}
      />
    </div>
  );
}
