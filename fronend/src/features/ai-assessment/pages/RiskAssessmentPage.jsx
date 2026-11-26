import { ArrowLeft, BrainCircuit, Play, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ModelReadinessPanel from '../components/ModelReadinessPanel';
import AssessmentHistory from '../components/AssessmentHistory';
import AssessmentResult from '../components/AssessmentResult';
import { useAiModelStatus, useRiskAssessmentHistory, useRunRiskAssessment } from '../hooks/useAiAssessment';

export default function RiskAssessmentPage() {
  const { patientId, caseId } = useParams();
  const navigate = useNavigate();
  const models = useAiModelStatus();
  const history = useRiskAssessmentHistory(patientId, caseId);
  const run = useRunRiskAssessment(patientId, caseId);
  const items = history.data?.items || [];
  const latest = items[0];

  const requestAssessment = async () => {
    try {
      const result = await run.mutateAsync();
      if (result.assessment?.status === 'COMPLETED') toast.success('Assessment completed.');
      else toast.warning('Assessment request recorded, but no prediction was produced.');
    } catch (error) { toast.error(error.message); }
  };

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <button type="button" onClick={() => navigate(`/patients/${patientId}`)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className="h-4 w-4" />Back to patient</button>
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">SurgRisk-AI · Phase 4</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Surgical risk assessment</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Review model readiness, submit a case for assessment, and inspect previous assessment records.</p></div><button type="button" onClick={requestAssessment} disabled={run.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4" />{run.isPending ? 'Requesting…' : 'Request assessment'}</button></header>
    <ModelReadinessPanel query={models} />
    {run.isError ? <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{run.error.message}</div> : null}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-4 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-teal-700 dark:text-teal-300" /><h2 className="text-sm font-semibold text-slate-950 dark:text-white">Latest assessment</h2></div>{latest ? <AssessmentResult assessment={latest} /> : <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><ShieldAlert className="mt-0.5 h-5 w-5 text-slate-500" /><p className="text-sm text-slate-600 dark:text-slate-300">No assessment is recorded for this case yet. The first request will also verify whether model artifacts are installed and validated.</p></div>}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-950 dark:text-white">Assessment history</h2><button type="button" onClick={() => history.refetch()} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>{history.isLoading ? <p className="text-sm text-slate-500">Loading history…</p> : null}{history.isError ? <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{history.error.message}</p> : null}{!history.isLoading && !history.isError ? <AssessmentHistory items={items} /> : null}</section>
    <p className="text-xs leading-5 text-slate-500">A model-ready status is not proof of clinical validity. Before deployment, the model versions, calibration, intended population, validation evidence, and institutional approval must be reviewed and documented.</p>
  </main>;
}
