import { Code, FileText, Send, ShieldAlert } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function Toolbar() {
  const {
    setIsHandoffModalOpen,
    setIsAlertAttendingModalOpen,
    setIsFhirModalOpen,
    alertNotification,
    dismissAlertNotification,
  } = useClinicalStore();

  return (
    <div className="space-y-3">
      {alertNotification?.show ? (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{alertNotification.message}</span>
            <span className="text-[10px] text-amber-700 font-mono">({alertNotification.timestamp})</span>
          </div>
          <button
            type="button"
            onClick={dismissAlertNotification}
            className="text-amber-800 hover:text-amber-950 font-bold text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-navy-900 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Export &amp; Clinical Handoff Actions
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsHandoffModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4 text-teal-400" />
            <span>Generate OR-to-ICU Handoff Summary (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAlertAttendingModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Send className="h-4 w-4 text-rose-200" />
            <span>Send Alert to Surgical Attending</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFhirModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Code className="h-4 w-4 text-slate-600" />
            <span>Export FHIR Observation Resource</span>
          </button>
        </div>
      </div>
    </div>
  );
}
