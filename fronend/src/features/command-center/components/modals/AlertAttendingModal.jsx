import { useState } from "react";
import { Send, ShieldAlert, X } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function AlertAttendingModal() {
  const { isAlertAttendingModalOpen, setIsAlertAttendingModalOpen, activePatient, sendAttendingAlert } =
    useClinicalStore();
  const [customNote, setCustomNote] = useState("");
  const [priority, setPriority] = useState("CRITICAL");

  if (!isAlertAttendingModalOpen) return null;

  const { demographics } = activePatient;

  const handleSubmit = (e) => {
    e.preventDefault();
    sendAttendingAlert(`[Priority: ${priority}] ${customNote.trim()}`);
    setCustomNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="text-base font-bold tracking-tight">Send Urgent Alert to Attending Surgeon</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsAlertAttendingModalOpen(false)}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <p className="font-bold text-rose-900">Recipient Information:</p>
            <p className="text-rose-800">
              Surgeon: <strong>{demographics.attendingSurgeon}</strong>
            </p>
            <p className="text-rose-800">
              Anesthesiologist: <strong>{demographics.anesthesiologist}</strong>
            </p>
            <p className="text-rose-700 text-[11px]">
              Patient: {demographics.name} ({demographics.mrn}) • OR: {demographics.roomNumber}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Alert Priority Level:</label>
            <div className="grid grid-cols-3 gap-2">
              {["CRITICAL", "URGENT", "HIGH"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    priority === lvl
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="customNote" className="block font-bold text-slate-700 mb-1">
              Clinical Observations &amp; Action Requested:
            </label>
            <textarea
              id="customNote"
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Inferred 30-day mortality elevated to 18.4%. Persistent MAP < 65 mmHg for >35 min. Bedside evaluation requested prior to transfer."
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAlertAttendingModalOpen(false)}
              className="px-4 py-2 font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Send className="h-4 w-4" />
              Dispatch Page &amp; Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
