import { FileText, Printer, X } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function HandoffPdfModal() {
  const { isHandoffModalOpen, setIsHandoffModalOpen, activePatient, calculatedMortalityRate, interventions } =
    useClinicalStore();

  if (!isHandoffModalOpen) return null;

  const { demographics, shapDrivers } = activePatient;
  const isHighRisk = calculatedMortalityRate > 15;
  const isModerateRisk = calculatedMortalityRate > 5 && calculatedMortalityRate <= 15;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <h2 className="text-base font-bold tracking-tight">OR-to-ICU Perioperative Risk &amp; Handoff Summary</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={() => setIsHandoffModalOpen(false)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 print:p-0 print:overflow-visible">
          <div className="border-b-2 border-navy-900 pb-4 flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-navy-900">SurgRisk-AI Clinical Command Center</h1>
              <p className="text-xs text-slate-500 font-medium">Perioperative Mortality &amp; Complication Assessment Report</p>
              <p className="text-[11px] text-slate-400 mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded">
                PATIENT MRN: {demographics.mrn}
              </span>
              <p className="text-xs text-slate-600 mt-1">OR Room: {demographics.roomNumber}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Patient Name:</span>
              <p className="font-bold text-slate-900 text-sm">{demographics.name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Age / Sex / BMI:</span>
              <p className="font-semibold text-slate-800">{demographics.age}yo {demographics.sex} ({demographics.bmi} kg/m²)</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">ASA Physical Status:</span>
              <p className="font-bold text-navy-900">{demographics.asaClass}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Surgical Urgency:</span>
              <p className="font-bold text-rose-700">{demographics.urgency}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Scheduled Procedure:</span>
            <p className="text-sm font-bold text-slate-900">{demographics.scheduledProcedure}</p>
          </div>

          <div className="p-4 border-2 border-navy-900 rounded-xl bg-navy-50/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-navy-900">Inferred 30-Day Mortality Risk</span>
              <div className="text-4xl font-extrabold text-navy-900 mt-1">{calculatedMortalityRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-600 mt-0.5">Ensemble Multi-Modal Inferred Score</p>
            </div>
            <div className="text-right space-y-1">
              <span
                className={`text-xs font-bold px-3 py-1 border rounded-full inline-block ${
                  isHighRisk
                    ? "bg-rose-100 text-rose-900 border-rose-300"
                    : isModerateRisk
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}
              >
                {isHighRisk
                  ? "HIGH PERIOPERATIVE HAZARD"
                  : isModerateRisk
                  ? "MODERATE PERIOPERATIVE RISK"
                  : "LOW PERIOPERATIVE RISK"}
              </span>
              <p className="text-xs text-slate-500">Attending: {demographics.attendingSurgeon}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Primary Risk Attribution (SHAP Factors)
            </h3>
            <div className="space-y-1.5 text-xs">
              {shapDrivers.slice(0, 4).map((d) => {
                const isIncrease = d.attributionPercent > 0;
                return (
                  <div key={d.id} className="flex justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-800">{d.featureName} ({d.currentValue})</span>
                    <span className={`font-bold font-mono shrink-0 ${isIncrease ? "text-rose-700" : "text-emerald-700"}`}>
                      {isIncrease ? `+${d.attributionPercent}%` : `${d.attributionPercent}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-1">
            <span className="font-bold">Intervention Simulation Status:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Pre-op Fluid Bolus: {interventions.fluidBolus ? "ACTIVE (Target MAP > 75)" : "NOT EXECUTED"}</li>
              <li>Post-Op Direct ICU Admission: {interventions.icuAdmission ? "ACTIVE" : "NOT EXECUTED"}</li>
              <li>Target Hemoglobin: {interventions.targetHemoglobin.toFixed(1)} g/dL</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => setIsHandoffModalOpen(false)}
            className="px-4 py-2 text-xs font-bold bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
