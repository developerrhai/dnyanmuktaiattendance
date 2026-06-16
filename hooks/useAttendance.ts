"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStatus,
  FilterState,
} from "@/types/attendance";

const today = new Date().toISOString().split("T")[0];

const defaultFilter: FilterState = {
  search: "",
  status: "",
  date: today,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://absolutefoundationattend.rhaitech.online/api";

function computeSummary(recs: AttendanceRecord[]): AttendanceSummary {
  return {
    total: recs.length,
    present: recs.filter((r) => r.status === "Present").length,
    absent: recs.filter((r) => r.status === "Absent").length,
    late: recs.filter((r) => r.status === "Late").length,
    onLeave: recs.filter((r) => r.status === "On Leave").length,
  };
}

export interface AddEmployeeData {
  code: string;
  name: string;
  gender: string;
  contact: string;
  rollNo: string;
  standard: string;
  status: AttendanceStatus;
  punchIn: string;
  punchOut: string;
}

export interface BiometricUploadOptions {
  cardNumber?: string;
  serialNumbers?: string; // comma-separated; defaults to configured device(s) on the backend
  verifyMode?: string;    // e.g. "1" for face+card dual verification
  isFaceUpload?: boolean;
  isFPUpload?: boolean;
  isCardUpload?: boolean;
  isBioPasswordUpload?: boolean;
}

export interface EditRecordData {
  name: string;
  contact: string;
  status: AttendanceStatus;
  punchIn: string;
  punchOut: string;
}

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [biometricImportCode, setBiometricImportCode] = useState<string | null>(null);

  const PER_PAGE = 10;

  // ── Fetch Attendance ──────────────────────────────────────────────
  // const fetchAttendance = useCallback(async (targetDate: string) => {
  //   setSyncing(true);
  //   setError(null);
  //   try {
  //     const res = await fetch(`${API_BASE}/attendance?date=${targetDate}`);
  //     if (!res.ok) {
  //       const errData = await res.json();
  //       throw new Error(errData.error || "Failed to fetch attendance.");
  //     }
  //     const data = await res.json();
  //     setRecords(data.records);
  //     setSyncedAt(data.syncedAt);
  //   } catch (err: any) {
  //     console.error(err);
  //     setError(err.message || "Failed to fetch attendance.");
  //   } finally {
  //     setSyncing(false);
  //   }
  // }, []);

  const fetchAttendance = useCallback(async (targetDate: string) => {
  setSyncing(true);
  setError(null);
  try {
    const res = await fetch(`${API_BASE}/attendance?date=${targetDate}`);
    if (!res.ok) {
      let errData;
      try {
        errData = await res.json();
      } catch {
        throw new Error(`Server returned a non-JSON error (status ${res.status}). Ensure the backend is running properly.`);
      }
      throw new Error(errData.error || "Failed to fetch attendance.");
    }
    const data = await res.json();

    // ✅ ADD THIS — normalize whatever shape the API returns into r.student.*
    const mapped = (data.records ?? []).map((r: any) => ({
      ...r,
      student: {
        id:       r.student?.id       ?? r.studentId   ?? r.id       ?? "",
        code:     r.student?.code     ?? r.studentCode ?? r.code     ?? "",
        name:     r.student?.name     ?? r.studentName ?? r.name     ?? "",
        gender:   r.student?.gender   ?? r.gender                    ?? "",
        contact:  r.student?.contact  ?? r.contact                   ?? "",
        rollNo:   r.student?.rollNo   ?? r.rollNo                    ?? "",
        standard: r.student?.standard ?? r.standard                  ?? "",
      },
    }));

    setRecords(mapped);
    setSyncedAt(data.syncedAt);
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Failed to fetch attendance.");
  } finally {
    setSyncing(false);
  }
}, []);

  // Fetch on date change
  useEffect(() => {
    fetchAttendance(filter.date);
  }, [filter.date, fetchAttendance]);

  // ── Sync Biometric Logs ───────────────────────────────────────────
  const sync = useCallback(async (targetDate?: string) => {
    const d = targetDate || filter.date;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: d }),
      });
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          throw new Error(`Server returned a non-JSON error (status ${res.status}).`);
        }
        throw new Error(errData.error || "Sync failed.");
      }
      const data = await res.json();
      setRecords(data.records);
      setSyncedAt(data.syncedAt);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sync biometric data.");
    } finally {
      setSyncing(false);
    }
  }, [filter.date]);

  // ── Mark Leave ────────────────────────────────────────────────────
  const markLeave = useCallback(async (studentCode: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCode, date: filter.date }),
      });
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          throw new Error(`Server returned a non-JSON error (status ${res.status}).`);
        }
        throw new Error(errData.error || "Failed to mark leave.");
      }
      setRecords((prev) =>
        prev.map((r) =>
          r.student.code === studentCode
            ? { ...r, status: "On Leave" as const, punchIn: null, punchOut: null, manuallyEdited: true }
            : r
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to mark leave.");
    }
  }, [filter.date]);

  // ── Add Employee ──────────────────────────────────────────────────
  const addEmployee = useCallback(async (data: AddEmployeeData) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.code,
          name: data.name,
          gender: data.gender,
          contact: data.contact,
          rollNo: data.rollNo,
          standard: data.standard,
        }),
      });
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          throw new Error(`Server returned a non-JSON error (status ${res.status}). The deployed API might be crashing.`);
        }
        throw new Error(errData.error || "Failed to add student.");
      }

      // If manual override details are specified, update the attendance record
      if (data.punchIn || data.punchOut || data.status !== "Present") {
        await fetch(`${API_BASE}/attendance/record`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentCode: data.code,
            date: filter.date,
            status: data.status,
            punchIn: data.punchIn,
            punchOut: data.punchOut,
          }),
        });
      }

      await fetchAttendance(filter.date);
      setPage(0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add employee.");
    }
  }, [filter.date, fetchAttendance]);

  // ── Edit Record ───────────────────────────────────────────────────
  const editRecord = useCallback(async (studentCode: string, data: EditRecordData) => {
    setError(null);
    try {
      // 1. Update Student Profile Details
      const studentRes = await fetch(`${API_BASE}/students/${studentCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, contact: data.contact }),
      });
      if (!studentRes.ok) {
        let errData;
        try {
          errData = await studentRes.json();
        } catch {
          throw new Error(`Server returned a non-JSON error (status ${studentRes.status}).`);
        }
        throw new Error(errData.error || "Failed to update student profile.");
      }

      // 2. Update Attendance punch / status details
      const attendanceRes = await fetch(`${API_BASE}/attendance/record`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCode,
          date: filter.date,
          status: data.status,
          punchIn: data.punchIn,
          punchOut: data.punchOut,
        }),
      });
      if (!attendanceRes.ok) {
        let errData;
        try {
          errData = await attendanceRes.json();
        } catch {
          throw new Error(`Server returned a non-JSON error (status ${attendanceRes.status}).`);
        }
        throw new Error(errData.error || "Failed to update attendance record.");
      }

      await fetchAttendance(filter.date);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to edit attendance record.");
    }
  }, [filter.date, fetchAttendance]);

  // ── Delete Record ─────────────────────────────────────────────────
  const deleteRecord = useCallback(async (studentCode: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/students/${studentCode}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          throw new Error(`Server returned a non-JSON error (status ${res.status}).`);
        }
        throw new Error(errData.error || "Failed to delete student.");
      }
      await fetchAttendance(filter.date);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete student.");
    }
  }, [filter.date, fetchAttendance]);

  // ── Import / Register Student on Biometric Device ────────────────
  const importToBiometric = useCallback(
    async (studentCode: string, options?: BiometricUploadOptions) => {
      setError(null);
      setBiometricImportCode(studentCode);
      try {
        const res = await fetch(`${API_BASE}/biometric/upload-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentCode,
            cardNumber: options?.cardNumber,
            serialNumbers: options?.serialNumbers,
            verifyMode: options?.verifyMode,
            isFaceUpload: options?.isFaceUpload,
            isFPUpload: options?.isFPUpload,
            isCardUpload: options?.isCardUpload,
            isBioPasswordUpload: options?.isBioPasswordUpload,
          }),
        });
        if (!res.ok) {
          let errData;
          try {
            errData = await res.json();
          } catch {
            throw new Error(`Server returned a non-JSON error (status ${res.status}).`);
          }
          throw new Error(errData.error || "Failed to register student on the biometric device.");
        }
        return await res.json();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to register student on the biometric device.");
        throw err;
      } finally {
        setBiometricImportCode(null);
      }
    },
    []
  );

  // ── Filter & Pagination ───────────────────────────────────────────
  const updateFilter = useCallback((patch: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
    setPage(0);
  }, []);

  const filtered = useMemo(() => {
    const q = filter.search.toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        r.student.name.toLowerCase().includes(q) ||
        r.student.contact.includes(q) ||
        r.student.code.toLowerCase().includes(q);

      const matchStatus = !filter.status || r.status === filter.status;

      return matchSearch && matchStatus;
    });
  }, [records, filter.search, filter.status]);

  const filteredSummary = useMemo(() => computeSummary(filtered), [filtered]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return {
    records: paged,
    allRecords: records,
    summary: filteredSummary,
    filter,
    updateFilter,
    syncing,
    syncedAt,
    error,
    page,
    totalPages,
    totalFiltered: filtered.length,
    setPage,
    sync,
    markLeave,
    addEmployee,
    editRecord,
    deleteRecord,
    importToBiometric,
    biometricImportCode,
  };
}