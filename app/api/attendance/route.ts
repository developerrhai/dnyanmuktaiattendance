import { NextRequest, NextResponse } from "next/server";
import { syncAttendance } from "@/lib/smartoffice";
import type { Student } from "@/types/attendance";

// In production, replace this with a real DB query:
// import { db } from "@/lib/db";
// const students = await db.student.findMany({ where: { status: "active" } });

const MOCK_STUDENTS: Student[] = [
  { id: "1",  code: "101", name: "Anand Sharma",   gender: "Male",   contact: "9922425925", standard: "12th" },
  { id: "2",  code: "102", name: "Priya Desai",    gender: "Female", contact: "9876543210", standard: "11th" },
  { id: "3",  code: "103", name: "Rahul Patil",    gender: "Male",   contact: "8745874587", standard: "12th" },
  { id: "4",  code: "104", name: "Sneha Kulkarni", gender: "Female", contact: "9988776655", standard: "10th" },
  { id: "6",  code: "106", name: "Aisha Khan",     gender: "Female", contact: "9001234567", standard: "12th" },
  { id: "7",  code: "107", name: "Rohan Mehta",    gender: "Male",   contact: "9812345678", standard: "10th" },
  { id: "8",  code: "108", name: "Kavita Nair",    gender: "Female", contact: "9654321098", standard: "11th" },
  { id: "9",  code: "109", name: "Suresh Yadav",   gender: "Male",   contact: "9778899001", standard: "12th" },
  { id: "10", code: "110", name: "Deepa Iyer",     gender: "Female", contact: "9234567890", standard: "10th" },
];

// Simple in-memory storage for leaves in local development session
const markedLeaves = new Set<string>(); // Format: "studentCode:date"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { success: false, error: "date query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { success: false, error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // Replace MOCK_STUDENTS with your actual DB query
  const students = MOCK_STUDENTS;

  const result = await syncAttendance(students, date);

  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  // Apply marked leaves to result records
  result.records = result.records.map((record) => {
    if (markedLeaves.has(`${record.student.code}:${date}`)) {
      return {
        ...record,
        status: "On Leave",
        punchIn: null,
        punchOut: null,
      };
    }
    return record;
  });

  // Re-calculate summary to reflect the leave status
  result.summary = {
    total: result.records.length,
    present: result.records.filter((r) => r.status === "Present").length,
    absent: result.records.filter((r) => r.status === "Absent").length,
    late: result.records.filter((r) => r.status === "Late").length,
    onLeave: result.records.filter((r) => r.status === "On Leave").length,
  };

  return NextResponse.json(result);
}

// POST: mark individual student as On Leave
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentCode, date } = body;

  if (!studentCode || !date) {
    return NextResponse.json(
      { success: false, error: "studentCode and date are required" },
      { status: 400 }
    );
  }

  // Save leave record to our in-memory cache for local development
  markedLeaves.add(`${studentCode}:${date}`);

  return NextResponse.json({
    success: true,
    message: `Leave marked for ${studentCode} on ${date}`,
  });
}
