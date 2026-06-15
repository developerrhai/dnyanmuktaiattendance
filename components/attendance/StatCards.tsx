"use client";

import type { AttendanceSummary } from "@/types/attendance";

interface Props {
  summary: AttendanceSummary;
}

const CARDS = [
  {
    key: "total" as const,
    label: "Total Students",
    bg: "bg-blue-600",
    icon: (
      <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4 6v-2m0 0a4 4 0 10-4-4 4 4 0 004 4z"/>
      </svg>
    ),
  },
  {
    key: "present" as const,
    label: "Present Today",
    bg: "bg-green-600",
    icon: (
      <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    key: "absent" as const,
    label: "Absent Today",
    bg: "bg-orange-600",
    icon: (
      <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    key: "late" as const,
    label: "Late / On Leave",
    bg: "bg-indigo-600",
    icon: (
      <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
];

export function StatCards({ summary }: Props) {
  const getValue = (key: keyof AttendanceSummary) => {
    if (key === "late") return summary.late + summary.onLeave;
    return summary[key];
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {CARDS.map(({ key, label, bg, icon }) => (
        <div key={key} className={`${bg} text-white rounded-xl p-5 flex flex-col gap-2`}>
          <div>{icon}</div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-3xl font-medium tabular-nums">{getValue(key)}</p>
        </div>
      ))}
    </div>
  );
}
