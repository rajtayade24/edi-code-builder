import { CalendarDays, ChevronRight, UserRound } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function PatientTable({ patients = [], onOpen }) {
  if (!patients.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700"><UserRound className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No patients found</h3><p className="mt-1 text-sm text-slate-500">Register a patient or change your search.</p></div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_1fr_36px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 sm:grid">
        <span>Patient</span><span>Patient ID</span><span>Age / sex</span><span>Contact</span><span />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {patients.map((patient) => (
          <button key={patient.id} type="button" onClick={() => onOpen(patient.id)} className="grid w-full grid-cols-1 items-center gap-2 px-5 py-4 text-left transition hover:bg-teal-50/50 dark:hover:bg-teal-950/20 sm:grid-cols-[1.2fr_1fr_0.8fr_1fr_36px] sm:gap-4">
            <span><span className="block text-sm font-semibold text-slate-900 dark:text-white">{patient.firstName} {patient.middleName ? `${patient.middleName} ` : ""}{patient.lastName}</span><span className="mt-1 block text-xs text-slate-500">Created {formatDate(patient.createdAt)}</span></span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{patient.patientNumber}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{patient.age ?? "—"} years · {patient.sexAtBirth?.toLowerCase() || "—"}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{patient.mobile || patient.email || "Not provided"}</span>
            <ChevronRight className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
        ))}
      </div>
    </div>
  );
}
