import { AlertCircle, CheckCircle2, Clock3, XCircle } from 'lucide-react';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}
function statusMeta(status) {
  if (status === 'COMPLETED') return { label: 'Completed', icon: CheckCircle2, style: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' };
  if (status === 'UNAVAILABLE') return { label: 'Unavailable', icon: AlertCircle, style: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40' };
  if (status === 'PENDING') return { label: 'Pending', icon: Clock3, style: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' };
  return { label: 'Failed', icon: XCircle, style: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40' };
}

export default function AssessmentHistory({ items = [] }) {
  if (!items.length) return <p className="text-sm text-slate-500">No assessment requests have been recorded for this surgical case.</p>;
  return <div className="space-y-2">
    {items.map((item) => {
      const meta = statusMeta(item.status);
      const Icon = meta.icon;
      const probability = item.result?.probability;
      return <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
        <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Assessment request</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{item.id}</p></div>
        <div className="flex items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.style}`}><Icon className="h-3.5 w-3.5" />{meta.label}</span>{item.status === 'COMPLETED' && typeof probability === 'number' ? <span className="text-sm font-bold text-slate-900 dark:text-white">{(probability * 100).toFixed(1)}%</span> : null}</div>
      </div>;
    })}
  </div>;
}
