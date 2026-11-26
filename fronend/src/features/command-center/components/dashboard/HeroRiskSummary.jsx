import { ShieldAlert } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function HeroRiskSummary() {
  const { activePatient, calculatedMortalityRate, mortalityDelta } = useClinicalStore();
  const { demographics, complications } = activePatient;

  const isHighRisk = calculatedMortalityRate > 15;
  const isModerateRisk = calculatedMortalityRate > 5 && calculatedMortalityRate <= 15;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-navy-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
              MRN: {demographics.mrn}
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
              {demographics.roomNumber}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                demographics.urgency === "Emergency"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {demographics.urgency} Procedure
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{demographics.name}</h1>
            <p className="text-sm font-bold text-navy-900 mt-0.5">{demographics.scheduledProcedure}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Age &amp; Sex</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {demographics.age} yrs • {demographics.sex}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">BMI</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{demographics.bmi} kg/m²</p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">ASA Status</span>
              <p className="font-bold text-navy-900 text-sm mt-0.5">{demographics.asaClass}</p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Surgeon</span>
              <p className="font-bold text-slate-900 text-xs mt-0.5 truncate">{demographics.attendingSurgeon}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div
            className={`p-6 rounded-2xl border-2 shadow-md flex flex-col items-center justify-center text-center space-y-2 transition-all ${
              isHighRisk
                ? "bg-rose-50/70 border-rose-500 text-rose-950"
                : isModerateRisk
                ? "bg-amber-50/70 border-amber-500 text-amber-950"
                : "bg-emerald-50/70 border-emerald-500 text-emerald-950"
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs tracking-wider uppercase">
              <ShieldAlert className="h-4 w-4" />
              <span>Predicted 30-Day Mortality Risk</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tight">{calculatedMortalityRate.toFixed(1)}</span>
              <span className="text-2xl font-bold">%</span>
            </div>

            {mortalityDelta < 0 ? (
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-600 text-white rounded-full">
                Simulated Risk Reduced by {Math.abs(mortalityDelta)}%
              </span>
            ) : null}

            <div
              className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wide border ${
                isHighRisk
                  ? "bg-rose-600 text-white border-rose-600"
                  : isModerateRisk
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-emerald-600 text-white border-emerald-600"
              }`}
            >
              {isHighRisk ? "HIGH RISK PATIENT" : isModerateRisk ? "MODERATE RISK" : "LOW RISK PATIENT"}
            </div>

            <p className="text-[11px] text-slate-600 mt-1">
              National Average Baseline for this procedure: ~4.2%
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3">
          Expected Post-Operative Complications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {complications.map((comp) => (
            <div
              key={comp.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-navy-900 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-xs">{comp.name}</span>
                <span
                  className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                    comp.percentage > 15
                      ? "bg-rose-100 text-rose-800"
                      : comp.percentage > 5
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {comp.percentage}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{comp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
