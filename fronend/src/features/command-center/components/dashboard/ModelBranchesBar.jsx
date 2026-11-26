import { Activity, BarChart3, ChevronRight, FileText, Network, Zap } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

function getBranchIcon(id) {
  switch (id) {
    case "bilstm":
      return <Activity className="h-4 w-4 text-teal-600" />;
    case "gat":
      return <Network className="h-4 w-4 text-navy-900" />;
    case "biobert":
      return <FileText className="h-4 w-4 text-indigo-600" />;
    case "xgboost":
      return <BarChart3 className="h-4 w-4 text-amber-600" />;
    default:
      return <Zap className="h-4 w-4 text-slate-600" />;
  }
}

export function ModelBranchesBar() {
  const { activePatient, setSelectedBranch } = useClinicalStore();
  const { modelBranches } = activePatient;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-teal-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            4-Branch Ensemble Model Status Bar
          </h2>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
            (Click branch chip to inspect live tensor weights &amp; features)
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
          Ensemble Weight: 100%
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {modelBranches.map((branch) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => setSelectedBranch(branch)}
            className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-500 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                  {getBranchIcon(branch.id)}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {branch.shortCode}
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">Weight: {branch.weightContribution}%</p>
                </div>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-800 truncate">{branch.statusText}</p>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>{branch.featuresProcessed}</span>
              <span>{branch.latencyMs}ms</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
