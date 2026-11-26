import { Droplet, HeartPulse, RotateCcw, Sliders } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function WhatIfSimulator() {
  const {
    interventions,
    setIntervention,
    resetInterventions,
    calculatedMortalityRate,
    mortalityDelta,
  } = useClinicalStore();

  const isReduced = mortalityDelta < 0;

  return (
    <div className="bg-white border-2 border-navy-900 rounded-2xl p-6 shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-navy-900 text-teal-400">
              <Sliders className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Interactive &ldquo;What-If?&rdquo; Treatment Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate medical interventions in real-time to see how much patient mortality risk drops.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Simulated Risk</span>
            <div className="text-2xl font-black text-navy-900 font-mono">
              {calculatedMortalityRate.toFixed(1)}%
            </div>
          </div>

          {isReduced ? (
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Risk Saved</span>
              <div className="text-sm font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
                {mortalityDelta}%
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={resetInterventions}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            title="Reset Simulator"
            aria-label="Reset Simulator"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setIntervention("fluidBolus", !interventions.fluidBolus)}
          className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
            interventions.fluidBolus
              ? "bg-teal-50 border-teal-600 text-teal-950 shadow-sm"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                interventions.fluidBolus ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              <Droplet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs">Pre-Op IV Fluid Resuscitation Bolus</h3>
              <p className="text-[11px] text-slate-500">Target Blood Pressure MAP &gt; 75 mmHg</p>
            </div>
          </div>
          <span
            className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${
              interventions.fluidBolus ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {interventions.fluidBolus ? "ACTIVE (-3.5%)" : "OFF"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIntervention("icuAdmission", !interventions.icuAdmission)}
          className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
            interventions.icuAdmission
              ? "bg-teal-50 border-teal-600 text-teal-950 shadow-sm"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                interventions.icuAdmission ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs">Direct Post-Op Intensive Care (ICU) Transfer</h3>
              <p className="text-[11px] text-slate-500">Immediate hemodynamic monitoring</p>
            </div>
          </div>
          <span
            className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${
              interventions.icuAdmission ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {interventions.icuAdmission ? "ACTIVE (-2.8%)" : "OFF"}
          </span>
        </button>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Target Post-Op Hemoglobin Concentration (Blood Transfusion):</span>
            <span className="font-bold font-mono text-navy-900 bg-white border px-2 py-0.5 rounded">
              {interventions.targetHemoglobin.toFixed(1)} g/dL
            </span>
          </div>

          <input
            type="range"
            min="7.0"
            max="12.0"
            step="0.1"
            value={interventions.targetHemoglobin}
            onChange={(e) => setIntervention("targetHemoglobin", parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-navy-900"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
            <span>7.0 g/dL (Low Reserve)</span>
            <span>9.0 g/dL (Recommended Target)</span>
            <span>12.0 g/dL (Optimal)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
