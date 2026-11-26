import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function ShapExplainability() {
  const { activePatient } = useClinicalStore();
  const { shapDrivers } = activePatient;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 h-full flex flex-col justify-between">
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-100 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Why is this Patient at Risk? (AI Explanation)
          </h2>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
            SHAP AI Attribution
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Top factors increasing or decreasing this patient&apos;s 30-day mortality risk:
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {shapDrivers.map((driver) => {
          const isIncrease = driver.attributionPercent > 0;
          return (
            <div
              key={driver.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isIncrease ? "bg-rose-50/50 border-rose-200" : "bg-emerald-50/50 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isIncrease ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-xs">{driver.featureName}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">({driver.currentValue})</span>
                  </div>
                </div>

                <span
                  className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded shrink-0 ${
                    isIncrease ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                  }`}
                >
                  {isIncrease ? `+${driver.attributionPercent}% Risk` : `${driver.attributionPercent}% Risk`}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 mt-1.5 pl-6">{driver.explanation}</p>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
        <Info className="h-4 w-4 text-navy-900 shrink-0" />
        <span>
          <strong>Doctor Tip:</strong> Factors with <span className="text-rose-700 font-bold">+%</span> add to patient mortality risk, while <span className="text-emerald-700 font-bold">-%</span> protect the patient.
        </span>
      </div>
    </div>
  );
}
