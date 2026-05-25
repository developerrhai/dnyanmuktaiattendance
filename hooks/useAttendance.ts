"use client";

import { useState, useCallback, useMemo } from "react";
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

// ── Static student records ──────────────────────────────────────────
const staticRecords: AttendanceRecord[] = [
  {
    student: { id: "1", code: "STU001", name: "Aarav Sharma", gender: "Male", contact: "9876543210", rollNo: "01", standard: "10A" },
    date: today, punchIn: "08:05:32", punchOut: "14:30:10", serialNumber: "DEV-001", status: "Present", temperature: 36.5, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "2", code: "STU002", name: "Priya Patel", gender: "Female", contact: "9876543211", rollNo: "02", standard: "10A" },
    date: today, punchIn: "08:45:11", punchOut: "14:28:55", serialNumber: "DEV-001", status: "Late", temperature: 36.7, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "3", code: "STU003", name: "Rohan Mehta", gender: "Male", contact: "9876543212", rollNo: "03", standard: "10A" },
    date: today, punchIn: null, punchOut: null, serialNumber: "DEV-001", status: "Absent", logCount: 0,
  },
  {
    student: { id: "4", code: "STU004", name: "Ananya Gupta", gender: "Female", contact: "9876543213", rollNo: "04", standard: "10A" },
    date: today, punchIn: "07:55:20", punchOut: "14:35:42", serialNumber: "DEV-001", status: "Present", temperature: 36.4, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "5", code: "STU005", name: "Vihaan Singh", gender: "Male", contact: "9876543214", rollNo: "05", standard: "10A" },
    date: today, punchIn: null, punchOut: null, serialNumber: "DEV-001", status: "On Leave", logCount: 0,
  },
  {
    student: { id: "6", code: "STU006", name: "Diya Reddy", gender: "Female", contact: "9876543215", rollNo: "06", standard: "10A" },
    date: today, punchIn: "08:02:17", punchOut: "14:29:03", serialNumber: "DEV-001", status: "Present", temperature: 36.6, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "7", code: "STU007", name: "Arjun Nair", gender: "Male", contact: "9876543216", rollNo: "07", standard: "10A" },
    date: today, punchIn: "09:10:44", punchOut: "14:32:18", serialNumber: "DEV-001", status: "Late", temperature: 36.8, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "8", code: "STU008", name: "Ishita Verma", gender: "Female", contact: "9876543217", rollNo: "08", standard: "10A" },
    date: today, punchIn: "08:00:05", punchOut: "14:25:33", serialNumber: "DEV-001", status: "Present", temperature: 36.3, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "9", code: "STU009", name: "Kabir Joshi", gender: "Male", contact: "9876543218", rollNo: "09", standard: "10A" },
    date: today, punchIn: null, punchOut: null, serialNumber: "DEV-001", status: "Absent", logCount: 0,
  },
  {
    student: { id: "10", code: "STU010", name: "Myra Khan", gender: "Female", contact: "9876543219", rollNo: "10", standard: "10A" },
    date: today, punchIn: "07:58:29", punchOut: "14:31:47", serialNumber: "DEV-001", status: "Present", temperature: 36.5, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "11", code: "STU011", name: "Reyansh Chopra", gender: "Male", contact: "9876543220", rollNo: "11", standard: "10A" },
    date: today, punchIn: "08:03:55", punchOut: "14:27:12", serialNumber: "DEV-001", status: "Present", temperature: 36.4, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "12", code: "STU012", name: "Sara Ali", gender: "Female", contact: "9876543221", rollNo: "12", standard: "10A" },
    date: today, punchIn: null, punchOut: null, serialNumber: "DEV-001", status: "On Leave", logCount: 0,
  },
  {
    student: { id: "13", code: "STU013", name: "Aditya Kumar", gender: "Male", contact: "9876543222", rollNo: "13", standard: "10A" },
    date: today, punchIn: "08:50:30", punchOut: "14:33:05", serialNumber: "DEV-001", status: "Late", temperature: 36.9, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "14", code: "STU014", name: "Navya Iyer", gender: "Female", contact: "9876543223", rollNo: "14", standard: "10A" },
    date: today, punchIn: "07:50:12", punchOut: "14:34:28", serialNumber: "DEV-001", status: "Present", temperature: 36.2, temperatureState: "Normal", logCount: 2,
  },
  {
    student: { id: "15", code: "STU015", name: "Vivaan Desai", gender: "Male", contact: "9876543224", rollNo: "15", standard: "10A" },
    date: today, punchIn: null, punchOut: null, serialNumber: "DEV-001", status: "Absent", logCount: 0,
  },
];

let nextId = 16;

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
  name: string;
  gender: string;
  contact: string;
  rollNo: string;
  standard: string;
  status: AttendanceStatus;
  punchIn: string;
  punchOut: string;
}

export interface EditRecordData {
  name: string;
  contact: string;
  status: AttendanceStatus;
  punchIn: string;
  punchOut: string;
}

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(staticRecords);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [syncing] = useState(false);
  const [syncedAt] = useState<string | null>(new Date().toISOString());
  const [error] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const PER_PAGE = 10;

  // Sync is a no-op with static data
  const sync = useCallback(async (_date?: string) => {
    // No-op: data is static
  }, []);

  const markLeave = useCallback(async (studentCode: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.student.code === studentCode
          ? { ...r, status: "On Leave" as const }
          : r
      )
    );
  }, []);

  // ── Add Employee ──────────────────────────────────────────────────
  const addEmployee = useCallback((data: AddEmployeeData) => {
    const id = String(nextId++);
    const code = `STU${id.padStart(3, "0")}`;

    const newRecord: AttendanceRecord = {
      student: {
        id,
        code,
        name: data.name,
        gender: data.gender,
        contact: data.contact,
        rollNo: data.rollNo,
        standard: data.standard,
      },
      date: today,
      punchIn: data.punchIn || null,
      punchOut: data.punchOut || null,
      serialNumber: "DEV-001",
      status: data.status,
      logCount: data.punchIn ? (data.punchOut ? 2 : 1) : 0,
    };

    setRecords((prev) => [newRecord, ...prev]);
    setPage(0);
  }, []);

  // ── Edit Record ───────────────────────────────────────────────────
  const editRecord = useCallback((studentCode: string, data: EditRecordData) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.student.code === studentCode
          ? {
              ...r,
              student: { ...r.student, name: data.name, contact: data.contact },
              status: data.status,
              punchIn: data.punchIn || null,
              punchOut: data.punchOut || null,
              logCount: data.punchIn ? (data.punchOut ? 2 : 1) : 0,
            }
          : r
      )
    );
  }, []);

  // ── Delete Record ─────────────────────────────────────────────────
  const deleteRecord = useCallback((studentCode: string) => {
    setRecords((prev) => prev.filter((r) => r.student.code !== studentCode));
  }, []);

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
        r.student.code.includes(q);

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
  };
}
