import { useState } from "react";
import { Check, ChevronDown, Plus, Search, UserPlus } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function CommandHeader() {
  const {
    patients,
    activePatientId,
    activePatient,
    selectPatient,
    searchQuery,
    setSearchQuery,
    setIsAddPatientModalOpen,
  } = useClinicalStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredPatients = patients.filter(
    (p) =>
      p.demographics.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.demographics.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.demographics.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative flex-1 min-w-[260px] max-w-2xl">
        <button
          type="button"
          onClick={() => setIsDropdownOpen((open) => !open)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-left text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-900 flex items-center justify-between transition-colors shadow-sm"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <span className="truncate flex items-center gap-2">
            <span className="font-bold text-navy-900">{activePatient.demographics.mrn}:</span>
            <span className="text-slate-900 font-semibold">{activePatient.demographics.name}</span>
            <span className="text-xs text-slate-500 font-normal hidden sm:inline">
              ({activePatient.demographics.scheduledProcedure})
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
        </button>

        {isDropdownOpen ? (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <input
                type="text"
                placeholder="Search Patient Name, MRN, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase bg-slate-50/50 flex justify-between items-center">
              <span>Patients List ({patients.length})</span>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAddPatientModalOpen(true);
                }}
                className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Patient
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-500">No matching patients found.</p>
              ) : (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      selectPatient(p.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 hover:bg-teal-50/50 flex items-center justify-between transition-colors ${
                      p.id === activePatientId ? "bg-teal-50/80 font-semibold" : ""
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-navy-900">{p.demographics.mrn}</span>
                        <span className="text-sm font-semibold text-slate-900">{p.demographics.name}</span>
                        {p.isCustomAdded ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded font-bold">
                            Added by Doctor
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-600 truncate">{p.demographics.scheduledProcedure}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.demographics.age}yo {p.demographics.sex} • ASA {p.demographics.asaClass}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${
                          p.baselineMortalityRate > 15
                            ? "bg-rose-100 text-rose-800"
                            : p.baselineMortalityRate > 5
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.baselineMortalityRate}% Mort.
                      </div>
                      {p.id === activePatientId ? (
                        <div className="mt-1 flex justify-end">
                          <Check className="h-4 w-4 text-teal-600" />
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setIsAddPatientModalOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
      >
        <UserPlus className="h-4 w-4 text-teal-400" />
        <span>+ Add Patient &amp; Report</span>
      </button>
    </div>
  );
}
