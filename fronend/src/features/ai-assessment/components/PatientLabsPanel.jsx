import { useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAddPatientLab, usePatientLabs } from '../hooks/useAiAssessment';

const EMPTY = { labCode: '', testName: '', numericValue: '', resultText: '', unit: '', referenceRangeLow: '', referenceRangeHigh: '', collectedAt: '', resultStatus: 'FINAL', notes: '' };
function optionalNumber(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function PatientLabsPanel({ patientId }) {
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const labs = usePatientLabs(patientId);
  const addLab = useAddPatientLab(patientId);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const numericValue = optionalNumber(form.numericValue);
    const resultText = form.resultText.trim();
    if (numericValue === null && !resultText) {
      toast.error('Provide a numeric value or a text result.');
      return;
    }
    let collectedAt;
    if (form.collectedAt) {
      const parsed = new Date(form.collectedAt);
      if (Number.isNaN(parsed.getTime())) {
        toast.error('Enter a valid collection date and time.');
        return;
      }
      collectedAt = parsed.toISOString();
    }
    const payload = {
      ...form,
      testName: form.testName.trim(),
      numericValue,
      referenceRangeLow: optionalNumber(form.referenceRangeLow),
      referenceRangeHigh: optionalNumber(form.referenceRangeHigh),
      collectedAt,
      resultText: resultText || undefined,
      labCode: form.labCode.trim() || undefined,
      unit: form.unit.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      await addLab.mutateAsync(payload);
      setForm(EMPTY);
      setOpen(false);
      toast.success('Laboratory result added.');
    } catch (error) { toast.error(error.message); }
  };

  const items = labs.data?.items || [];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><FlaskConical className="h-4 w-4 text-teal-700 dark:text-teal-300" />Laboratory results</h2>
          <p className="mt-1 text-xs text-slate-500">Structured results can be included in AI input when a reviewed model adapter supports them.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Plus className="h-4 w-4" />Add result</button>
      </div>
      {open ? (
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Test name<input required name="testName" value={form.testName} onChange={update} maxLength={180} placeholder="Serum creatinine" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Lab code<input name="labCode" value={form.labCode} onChange={update} maxLength={60} placeholder="LOINC / local code" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Numeric value<input type="number" step="any" name="numericValue" value={form.numericValue} onChange={update} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Text result<input name="resultText" value={form.resultText} onChange={update} maxLength={2000} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Unit<input name="unit" value={form.unit} onChange={update} maxLength={50} placeholder="mg/dL" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Collected at<input type="datetime-local" name="collectedAt" value={form.collectedAt} onChange={update} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Reference low<input type="number" step="any" name="referenceRangeLow" value={form.referenceRangeLow} onChange={update} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Reference high<input type="number" step="any" name="referenceRangeHigh" value={form.referenceRangeHigh} onChange={update} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
            Result status
            <select name="resultStatus" value={form.resultStatus} onChange={update} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="FINAL">Final</option>
              <option value="PRELIMINARY">Preliminary</option>
              <option value="CORRECTED">Corrected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-200 sm:col-span-2 lg:col-span-2">Notes<input name="notes" value={form.notes} onChange={update} maxLength={3000} placeholder="Optional clinical context" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>
          <div className="flex items-end gap-2"><button type="submit" disabled={addLab.isPending} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{addLab.isPending ? 'Saving…' : 'Save result'}</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700">Cancel</button></div>
        </form>
      ) : null}
      {labs.isLoading ? <p className="mt-4 text-sm text-slate-500">Loading laboratory results…</p> : null}
      {labs.isError ? <p role="alert" className="mt-4 text-sm text-rose-700 dark:text-rose-300">{labs.error.message}</p> : null}
      {!labs.isLoading && !labs.isError && !items.length ? <p className="mt-4 text-sm text-slate-500">No laboratory results recorded.</p> : null}
      {items.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="py-2 pr-3">Test</th><th className="py-2 pr-3">Result</th><th className="py-2 pr-3">Reference</th><th className="py-2 pr-3">Collected</th><th className="py-2">Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800"><td className="py-3 pr-3 font-medium text-slate-800 dark:text-slate-200">{item.testName}<span className="block text-[10px] text-slate-400">{item.labCode || 'No lab code'}</span></td><td className="py-3 pr-3 text-slate-700 dark:text-slate-300">{item.numericValue ?? item.resultText ?? '—'} {item.unit || ''}</td><td className="py-3 pr-3 text-slate-500">{item.referenceRangeLow ?? '—'} – {item.referenceRangeHigh ?? '—'}</td><td className="py-3 pr-3 text-xs text-slate-500">{item.collectedAt ? new Date(item.collectedAt).toLocaleString() : '—'}</td><td className="py-3 text-xs text-slate-500">{item.resultStatus}</td></tr>)}</tbody></table></div> : null}
    </section>
  );
}
