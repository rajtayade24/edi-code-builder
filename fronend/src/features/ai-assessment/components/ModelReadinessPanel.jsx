import { AlertTriangle, Cpu } from 'lucide-react';

const MODEL_LABELS = {
  xgboost: 'XGBoost · Tabular baseline',
  bilstm: 'BiLSTM · Vitals sequence',
  gat: 'GAT · Comorbidity graph',
  biobert: 'BioBERT · Clinical text',
};

function statusStyle(status) {
  if (status === 'READY') return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (status === 'LOADED_PENDING_VALIDATION') return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

export default function ModelReadinessPanel({ query }) {
  const models = query.data?.models || [];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-teal-50 p-2 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Cpu className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-950 dark:text-white">AI model readiness</h2>
          <p className="mt-1 text-sm text-slate-500">Model availability is reported by the private Python inference service.</p>
        </div>
      </div>
      {query.isLoading ? <p className="mt-4 text-sm text-slate-500">Checking model service…</p> : null}
      {query.isError ? <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{query.error.message}</div> : null}
      {models.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {models.map((model) => <div key={model.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
          <div className="min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{MODEL_LABELS[model.id] || model.name}</p><p className="mt-1 text-xs text-slate-500">{model.model_version || 'No model artifact installed'}</p></div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle(model.status)}`}>{model.status.replaceAll('_', ' ')}</span>
        </div>)}
      </div> : null}
      {!query.isLoading && !query.isError && models.length === 0 ? <p className="mt-4 text-sm text-slate-500">No model status was returned.</p> : null}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">Ensemble: {query.data?.ensemble?.status || 'STATUS UNKNOWN'}</p>
          <p className="mt-1">{query.data?.ensemble?.message || 'Predictions remain disabled until trained artifacts, calibration, independent validation, and an approved ensemble manifest are installed. No demo score is substituted.'}</p>
        </div>
      </div>
    </section>
  );
}
