"use client";

import { useState, useEffect } from "react";
import type { FilterState, AttendanceStatus } from "@/types/attendance";

interface Props {
  filter: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onSync: () => void;
  syncing: boolean;
  syncedAt: string | null;
}

const STATUS_OPTIONS: { value: AttendanceStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "Present", label: "Present" },
  { value: "Absent", label: "Absent" },
  { value: "Late", label: "Late" },
  { value: "On Leave", label: "On Leave" },
];

function formatSyncTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function FilterBar({ filter, onChange, onSync, syncing, syncedAt }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name, contact, code..."
          value={filter.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <input
        type="date"
        value={filter.date}
        onChange={(e) => onChange({ date: e.target.value })}
        className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={filter.status}
        onChange={(e) => onChange({ status: e.target.value as AttendanceStatus | "" })}
        className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button
        onClick={onSync}
        disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {syncing ? "Syncing..." : "Sync Biometric"}
      </button>

      {mounted && syncedAt && (
        <p className="text-xs text-gray-400 ml-auto">
          Last synced: {formatSyncTime(syncedAt)}
        </p>
      )}
    </div>
  );
}
