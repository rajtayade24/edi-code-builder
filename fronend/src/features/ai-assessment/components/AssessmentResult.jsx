import { Activity, AlertTriangle, BrainCircuit, Network, ShieldCheck } from 'lucide-react';

const BRANCH_NAMES = { xgboost: 'XGBoost', bilstm: 'BiLSTM', gat: 'GAT', biobert: 'BioBERT' };

function formatPercent(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—';
}

function formatNumber(value, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';
}

export default function AssessmentResult({ assessment }) {
  if (!assessment) return null;
  if (assessment.status !== 'COMPLETED' || !assessment.result) {
    const message = assessment.status === 'UNAVAILABLE'
      ? 'The model service or one or more required model branches are not configured. No risk estimate was produced.'
      : assessment.status === 'FAILED'
        ? 'The assessment request failed. No risk estimate was produced.'
        : 'The assessment has not completed. No risk estimate is available.';
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <h3 className="font-semibold text-amber-950 dark:text-amber-100">No clinical prediction available</h3>
            <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-200">{message}</p>
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Status: {assessment.status} · Code: {assessment.errorCode || '—'}</p>
          </div>
        </div>
      </div>
    );
  }
  const result = assessment.result;
  const explainability = result.explainability || {};
  const branches = result.branches || [];
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700 dark:text-emerald-300" />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">Model output · 30-day mortality endpoint</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">{formatPercent(result.probability)}</p>
            <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">Manifest {result.model_manifest_version || '—'} · Validation reference {result.ensemble_validation_reference || '—'}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{BRANCH_NAMES[branch.id] || branch.id}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{branch.status}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{formatPercent(branch.probability)}</p>
            <p className="mt-1 text-xs text-slate-500">v{branch.model_version || '—'} · {formatNumber(Number(branch.latency_ms), 0)} ms</p>
            <p className="mt-1 text-[11px] text-slate-400">Validation: {branch.validation_reference || '—'}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><BrainCircuit className="h-4 w-4 text-teal-700" />SHAP drivers</h3>
          {explainability.shap_drivers?.length ? <div className="mt-3 space-y-2">{explainability.shap_drivers.map((driver, index) => <div key={`${driver.feature_name}-${index}`} className="border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800"><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{driver.feature_name}</p><p className="mt-1 text-xs text-slate-500">Attribution {driver.attribution} {driver.unit || ''} · {driver.impact_level}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No SHAP explanations were returned by the installed adapters.</p>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><Network className="h-4 w-4 text-teal-700" />GAT comorbidity graph</h3>
          {explainability.gat_nodes?.length ? <div className="mt-3 space-y-2">{explainability.gat_nodes.map((node) => <div key={node.node_id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800"><div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{node.label}</p><p className="text-xs text-slate-500">{node.code || 'No code'} · {node.severity}</p></div><span className="font-mono text-xs text-slate-600 dark:text-slate-300">{formatNumber(node.attention_weight, 3)}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No graph nodes were returned by the installed GAT adapter.</p>}
        </section>
      </div>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Activity className="mt-0.5 h-4 w-4 shrink-0" />This software output is decision-support information only. It does not diagnose, recommend treatment, or replace independent clinician assessment.</p>
    </section>
  );
}
