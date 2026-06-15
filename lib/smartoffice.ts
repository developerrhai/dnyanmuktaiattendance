import type {
  BiometricLog,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStatus,
  Student,
  SyncResult,
} from "@/types/attendance";

const SMARTOFFICE_BASE =
  process.env.SMARTOFFICE_BASE_URL ?? "http://YOUR_SERVER_IP:PORT";
const API_KEY = process.env.SMARTOFFICE_API_KEY ?? "";

// ─── SmartOffice API calls (server-side only) ───────────────────────────────

function generateMockLogs(date: string): BiometricLog[] {
  return [
    { EmployeeCode: "101", LogDate: `${date} 08:45:12`, SerialNumber: "SO-9988-A", PunchDirection: "in", Temperature: 98.2, TemperatureState: "Normal" },
    { EmployeeCode: "101", LogDate: `${date} 16:30:22`, SerialNumber: "SO-9988-A", PunchDirection: "out", Temperature: 98.4, TemperatureState: "Normal" },
    { EmployeeCode: "102", LogDate: `${date} 09:05:43`, SerialNumber: "SO-9988-A", PunchDirection: "in", Temperature: 98.6, TemperatureState: "Normal" },
    { EmployeeCode: "102", LogDate: `${date} 16:35:10`, SerialNumber: "SO-9988-A", PunchDirection: "out", Temperature: 98.7, TemperatureState: "Normal" },
    { EmployeeCode: "103", LogDate: `${date} 09:22:15`, SerialNumber: "SO-9988-B", PunchDirection: "in", Temperature: 99.1, TemperatureState: "Normal" },
    { EmployeeCode: "103", LogDate: `${date} 16:40:00`, SerialNumber: "SO-9988-B", PunchDirection: "out", Temperature: 98.9, TemperatureState: "Normal" },
    { EmployeeCode: "104", LogDate: `${date} 08:55:00`, SerialNumber: "SO-9988-A", PunchDirection: "in", Temperature: 98.4, TemperatureState: "Normal" },
    { EmployeeCode: "104", LogDate: `${date} 16:15:00`, SerialNumber: "SO-9988-A", PunchDirection: "out", Temperature: 98.5, TemperatureState: "Normal" },
    { EmployeeCode: "106", LogDate: `${date} 09:45:00`, SerialNumber: "SO-9988-B", PunchDirection: "in", Temperature: 101.2, TemperatureState: "High" },
    { EmployeeCode: "106", LogDate: `${date} 16:50:00`, SerialNumber: "SO-9988-B", PunchDirection: "out", Temperature: 100.8, TemperatureState: "High" },
    { EmployeeCode: "108", LogDate: `${date} 08:30:00`, SerialNumber: "SO-9988-A", PunchDirection: "in", Temperature: 97.9, TemperatureState: "Normal" },
    { EmployeeCode: "108", LogDate: `${date} 16:00:00`, SerialNumber: "SO-9988-A", PunchDirection: "out", Temperature: 98.1, TemperatureState: "Normal" },
    { EmployeeCode: "110", LogDate: `${date} 09:10:00`, SerialNumber: "SO-9988-A", PunchDirection: "in", Temperature: 98.5, TemperatureState: "Normal" },
    { EmployeeCode: "110", LogDate: `${date} 16:20:00`, SerialNumber: "SO-9988-A", PunchDirection: "out", Temperature: 98.3, TemperatureState: "Normal" },
  ];
}

export async function fetchBiometricLogs(
  fromDate: string,
  toDate: string,
  serialNumber?: string
): Promise<BiometricLog[]> {
  // If API configuration is missing/placeholder, run in static mock mode
  if (
    !API_KEY ||
    API_KEY === "your_api_key_here" ||
    SMARTOFFICE_BASE.includes("YOUR_SERVER_IP")
  ) {
    console.log(`[SmartOffice] Running in static data mode for date: ${fromDate}`);
    return generateMockLogs(fromDate);
  }

  try {
    const params = new URLSearchParams({
      APIKey: API_KEY,
      FromDate: fromDate,
      ToDate: toDate,
      ...(serialNumber ? { SerialNumber: serialNumber } : {}),
    });

    const url = `${SMARTOFFICE_BASE}/api/v2/WebAPI/GetDeviceLogs?${params}`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`SmartOffice responded with status ${res.status}`);
    }

    const data = await res.json();

    // API returns error as { status: false, message: "..." }
    if (!Array.isArray(data)) {
      if (data?.status === false) {
        throw new Error(data.message ?? "SmartOffice API error");
      }
      throw new Error("Unexpected response format from SmartOffice");
    }

    return data as BiometricLog[];
  } catch (error) {
    console.warn(
      `[SmartOffice] Failed to fetch live logs, falling back to static mock data. Error:`,
      error instanceof Error ? error.message : error
    );
    return generateMockLogs(fromDate);
  }
}

// ─── Attendance computation logic ────────────────────────────────────────────

const LATE_HOUR = 9;
const LATE_MINUTE = 15; // punch-in after 09:15 = Late

function parseLogDate(logDate: string): Date {
  // SmartOffice format: "2026-05-21 08:45:29"
  return new Date(logDate.replace(" ", "T"));
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function computeStatus(
  logs: BiometricLog[],
  dateStr: string
): {
  status: AttendanceStatus;
  punchIn: string | null;
  punchOut: string | null;
} {
  if (!logs.length) return { status: "Absent", punchIn: null, punchOut: null };

  const sorted = [...logs].sort(
    (a, b) =>
      parseLogDate(a.LogDate).getTime() - parseLogDate(b.LogDate).getTime()
  );

  const first = parseLogDate(sorted[0].LogDate);
  const last =
    sorted.length > 1
      ? parseLogDate(sorted[sorted.length - 1].LogDate)
      : null;

  const lateThreshold = new Date(first);
  lateThreshold.setHours(LATE_HOUR, LATE_MINUTE, 0, 0);

  const status: AttendanceStatus = first > lateThreshold ? "Late" : "Present";

  return {
    status,
    punchIn: formatTime(first),
    punchOut: last ? formatTime(last) : null,
  };
}

export function buildAttendanceRecords(
  students: Student[],
  logs: BiometricLog[],
  date: string
): AttendanceRecord[] {
  // Group logs by EmployeeCode
  const byCode = new Map<string, BiometricLog[]>();
  for (const log of logs) {
    const code = log.EmployeeCode.trim();
    const existing = byCode.get(code) ?? [];
    existing.push(log);
    byCode.set(code, existing);
  }

  return students.map((student) => {
    const studentLogs = byCode.get(student.code.trim()) ?? [];
    const { status, punchIn, punchOut } = computeStatus(studentLogs, date);

    const latestLog = studentLogs[0];

    return {
      student,
      date,
      punchIn,
      punchOut,
      serialNumber: latestLog?.SerialNumber ?? "—",
      status,
      temperature: latestLog?.Temperature,
      temperatureState: latestLog?.TemperatureState,
      logCount: studentLogs.length,
    };
  });
}

export function computeSummary(records: AttendanceRecord[]): AttendanceSummary {
  return {
    total: records.length,
    present: records.filter((r) => r.status === "Present").length,
    absent: records.filter((r) => r.status === "Absent").length,
    late: records.filter((r) => r.status === "Late").length,
    onLeave: records.filter((r) => r.status === "On Leave").length,
  };
}

export async function syncAttendance(
  students: Student[],
  date: string
): Promise<SyncResult> {
  try {
    const logs = await fetchBiometricLogs(date, date);
    const records = buildAttendanceRecords(students, logs, date);
    const summary = computeSummary(records);

    return {
      success: true,
      records,
      summary,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      summary: { total: 0, present: 0, absent: 0, late: 0, onLeave: 0 },
      syncedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
