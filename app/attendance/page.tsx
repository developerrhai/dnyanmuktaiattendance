"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useAttendance } from "@/hooks/useAttendance";
import { StatCards } from "@/components/attendance/StatCards";
import { FilterBar } from "@/components/attendance/FilterBar";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { AddEmployeeModal } from "@/components/attendance/AddEmployeeModal";
import { EditRecordModal } from "@/components/attendance/EditRecordModal";
import { DeleteConfirmModal } from "@/components/attendance/DeleteConfirmModal";
import { WhatsAppNotifyModal } from "@/components/attendance/WhatsAppNotifyModal";
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
    notifyWhatsApp,
    notifyingWhatsApp,
  } = useAttendance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // ─── Import Excel ─────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      if (rows.length === 0) {
        setImportError("The Excel file is empty or has no valid rows.");
        return;
      }

      for (const row of rows) {
        await addEmployee({
          code:     row["Employee Code"] ?? row["Employee ID"] ?? row["Code"] ?? row["ID"]  ?? "",
          name:     row["Employee Name"] ?? row["Name"]        ?? "",
          gender:   row["Gender"]                                    ?? "",
          contact:  row["Contact"]     ?? row["Phone"]               ?? "",
          rollNo:   row["Roll No"]     ?? row["Roll Number"]         ?? "",
          standard: row["Standard"]    ?? row["Class"]               ?? "",
          status:  (row["Status"] as AttendanceRecord["status"])     ?? "Present",
          punchIn:  row["Punch In"]    ?? row["Check In"]            ?? "",
          punchOut: row["Punch Out"]   ?? row["Check Out"]           ?? "",
        });
      }
    } catch (err) {
      setImportError("Failed to parse the Excel file. Please check the format.");
      console.error(err);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // ─── Export Excel ─────────────────────────────────────────────────────────
  const handleExport = () => {
    if (records.length === 0) return;

    // ✅ Uses correct nested AttendanceRecord shape (r.student.*)
    const rows = records.map((r) => ({
      "Employee ID": r.student.code,
      "Name":        r.student.name,
      "Roll No":     r.student.rollNo,
      "Standard":    r.student.standard,
      "Gender":      r.student.gender,
      "Contact":     r.student.contact,
      "Date":        r.date,
      "Punch In":    r.punchIn  ?? "",
      "Punch Out":   r.punchOut ?? "",
      "Status":      r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-width: measure the longest value in each column
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)
      ) + 2,
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const fileName = `attendance-${filter.date ?? new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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
            Add Student
          </button>

          {/* Hidden file input */}
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />

          {/* Import Excel */}
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            <svg className={`w-4 h-4 ${importing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            {importing ? "Importing..." : "Import Excel"}
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export Excel
          </button>

          {/* Notify WhatsApp */}
          <button
            onClick={() => setWhatsAppModalOpen(true)}
            disabled={records.length === 0 || notifyingWhatsApp}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            <svg className={`w-4 h-4 ${notifyingWhatsApp ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {notifyingWhatsApp ? "Sending..." : "Notify WhatsApp"}
          </button>
        </div>
      </div>

      {/* Sync error banner */}
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

      {/* Import error banner */}
      {importError && (
        <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-sm text-amber-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3C6.48 3 2 7.48 2 12s4.48 9 10 9 10-4.48 10-10S17.52 3 12 3z"/>
          </svg>
          <span><strong>Import error:</strong> {importError}</span>
          <button onClick={() => setImportError(null)} className="ml-auto text-amber-500 hover:text-amber-700">✕</button>
        </div>
      )}

      {/* Stat cards */}
      <StatCards summary={summary} />

      {/* Table card */}
      <div className="mx-6 mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Attendance Records
          </h2>
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
      <WhatsAppNotifyModal
        open={whatsAppModalOpen}
        date={filter.date}
        absentCount={summary.absent}
        lateCount={summary.late}
        onClose={() => setWhatsAppModalOpen(false)}
        onConfirm={async (includeLate) => {
          await notifyWhatsApp(filter.date, includeLate);
        }}
      />
    </div>
  );
}