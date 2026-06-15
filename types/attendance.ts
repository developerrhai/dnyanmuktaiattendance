export type AttendanceStatus = "Present" | "Absent" | "Late" | "On Leave";

export interface BiometricLog {
  EmployeeCode: string;
  LogDate: string;
  SerialNumber: string;
  PunchDirection: "in" | "out" | "";
  Temperature: number;
  TemperatureState: string;
}

export interface Student {
  id: string;
  code: string;
  name: string;
  gender: "Male" | "Female" | string;
  contact: string;
  rollNo?: string;
  standard?: string;
}

export interface AttendanceRecord {
  student: Student;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  serialNumber: string;
  status: AttendanceStatus;
  temperature?: number;
  temperatureState?: string;
  logCount: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
}

export interface SyncResult {
  success: boolean;
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  syncedAt: string;
  error?: string;
}

export interface SmartOfficeError {
  status: boolean;
  message: string;
}

export interface FilterState {
  search: string;
  status: AttendanceStatus | "";
  date: string;
}
