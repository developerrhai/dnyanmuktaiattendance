import type { AttendanceStatus } from "@/types/attendance";

const CONFIG: Record<
  AttendanceStatus,
  { bg: string; text: string; dot: string }
> = {
  Present:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  Absent:   { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
  Late:     { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500"  },
  "On Leave": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
};

interface Props {
  status: AttendanceStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const cfg = CONFIG[status];
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.bg} ${cfg.text} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}
