import { CheckCircle2, X, Zap } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function ModelBranchDetailModal() {
  const { selectedBranch, setSelectedBranch } = useClinicalStore();

  if (!selectedBranch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-teal-400" />
            <h2 className="text-base font-bold tracking-tight">
              {selectedBranch.name} Architecture &amp; Tensor Inspection
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSelectedBranch(null)}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-mono uppercase bg-navy-100 text-navy-900 font-bold px-2 py-0.5 rounded">
              Ensemble Weight: {selectedBranch.weightContribution}%
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">{selectedBranch.description}</h3>
            <p className="text-slate-600">{selectedBranch.statusText}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-xl bg-white">
              <span className="text-slate-400 font-medium">Inference Latency:</span>
              <p className="text-lg font-black text-navy-900 font-mono">{selectedBranch.latencyMs} ms</p>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-white">
              <span className="text-slate-400 font-medium">Features Processed:</span>
              <p className="text-lg font-black text-teal-700 font-mono">{selectedBranch.featuresProcessed}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-2">Live Key Clinical Insights:</h4>
            <div className="space-y-1.5">
              {selectedBranch.keyInsights.map((insight, idx) => (
                <div key={idx} className="p-2.5 bg-teal-50/60 border border-teal-100 rounded-lg flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => setSelectedBranch(null)}
            className="px-4 py-2 font-bold bg-navy-900 text-white rounded-xl hover:bg-navy-800"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
