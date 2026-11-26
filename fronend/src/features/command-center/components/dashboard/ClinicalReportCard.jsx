import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function ClinicalReportCard() {
  const { activePatient } = useClinicalStore();
  const { clinicalNotesExcerpt, modelBranches } = activePatient;
  const bioBertBranch = modelBranches.find((b) => b.id === "biobert");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Ingested Patient Medical Report &amp; Clinical Notes
            </h2>
            <p className="text-[11px] text-slate-500">Bio-BERT NLP Extracted Findings</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded">
          NLP Confidence: 94%
        </span>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans font-medium">
        &ldquo;{clinicalNotesExcerpt}&rdquo;
      </div>

      {bioBertBranch && bioBertBranch.keyInsights.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Bio-BERT Extracted Clinical Hazards:
          </span>
          <div className="flex flex-wrap gap-2">
            {bioBertBranch.keyInsights.map((insight, idx) => (
              <div
                key={idx}
                className="text-[11px] font-semibold bg-indigo-50/80 text-indigo-950 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3 w-3 text-indigo-600 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
