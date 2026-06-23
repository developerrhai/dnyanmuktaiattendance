"use client";

import { useState } from "react";

interface WhatsAppNotifyModalProps {
  open: boolean;
  date: string;
  absentCount: number;
  lateCount: number;
  onClose: () => void;
  onConfirm: (includeLate: boolean) => Promise<void>;
}

interface NotifyResult {
  message: string;
  summary?: Record<string, number>;
}

type ModalState = "confirm" | "sending" | "done";

export function WhatsAppNotifyModal({
  open,
  date,
  absentCount,
  lateCount,
  onClose,
  onConfirm,
}: WhatsAppNotifyModalProps) {
  const [includeLate, setIncludeLate] = useState(false);
  const [state, setState] = useState<ModalState>("confirm");
  const [result, setResult] = useState<NotifyResult | null>(null);

  if (!open) return null;

  const handleSend = async () => {
    setState("sending");
    try {
      // onConfirm resolves quickly (fire-and-forget on backend)
      await onConfirm(includeLate);
      setResult({
        message: `Notifications started for ${absentCount + (includeLate ? lateCount : 0)} student(s). Messages are being sent in the background.`,
        summary: {
          absent: absentCount,
          ...(includeLate ? { late: lateCount } : {}),
          queued: absentCount + (includeLate ? lateCount : 0),
        },
      });
    } catch {
      setResult({ message: "Something went wrong. Check backend logs." });
    }
    setState("done");
  };

  const handleClose = () => {
    setState("confirm");
    setResult(null);
    setIncludeLate(false);
    onClose();
  };

  const queued = absentCount + (includeLate ? lateCount : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={state !== "sending" ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            {/* WhatsApp icon */}
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">WhatsApp Notification</h2>
            <p className="text-emerald-100 text-xs mt-0.5">{date}</p>
          </div>
          {state !== "sending" && (
            <button
              onClick={handleClose}
              className="ml-auto text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5">
          {/* ── CONFIRM STATE ── */}
          {state === "confirm" && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{absentCount}</div>
                  <div className="text-xs text-red-300 mt-0.5">Absent Students</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{lateCount}</div>
                  <div className="text-xs text-amber-300 mt-0.5">Late Students</div>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4">
                WhatsApp messages will be sent to parents of <strong className="text-white">{absentCount}</strong> absent
                student(s) using the configured WABA template.
              </p>

              {/* Include late toggle */}
              {lateCount > 0 && (
                <label className="flex items-center gap-3 mb-5 cursor-pointer group">
                  <div
                    onClick={() => setIncludeLate((v) => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${includeLate ? "bg-amber-500" : "bg-gray-600"}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeLate ? "translate-x-4" : ""}`}/>
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Also notify <strong className="text-amber-400">{lateCount}</strong> late student(s)
                  </span>
                </label>
              )}

              {/* Queue preview */}
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 mb-5 text-sm text-gray-400">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
                </svg>
                <span>
                  <strong className="text-white">{queued}</strong> message{queued !== 1 ? "s" : ""} will be queued
                  {queued > 1 && <span className="text-gray-500"> (~{Math.ceil(queued * 1.5)}s in background)</span>}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={queued === 0}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  Send {queued} Message{queued !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}

          {/* ── SENDING STATE ── */}
          {state === "sending" && (
            <div className="py-6 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"/>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  </svg>
                </div>
              </div>
              <p className="text-white font-medium mb-1">Starting notifications…</p>
              <p className="text-gray-400 text-sm">Messages are queued and will be sent in the background</p>
            </div>
          )}

          {/* ── DONE STATE ── */}
          {state === "done" && result && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Notifications Queued!</p>
                  <p className="text-gray-400 text-xs mt-0.5">{result.message}</p>
                </div>
              </div>

              {result.summary && (
                <div className="bg-gray-800 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                  {Object.entries(result.summary).map(([key, val]) => (
                    <div key={key}>
                      <div className="text-lg font-bold text-white">{val}</div>
                      <div className="text-gray-400 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300 mb-4">
                ⏳ Messages are sent with 1.5s delays to respect rate limits. Check backend logs for per-student results.
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
