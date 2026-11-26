import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Plus, Search, Users } from "lucide-react";
import PatientTable from "../components/PatientTable";
import { usePatients } from "../hooks/usePatients";

export default function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ search, page, limit: 10 }), [search, page]);
  const query = usePatients(params);
  const result = query.data;
  const pagination = result?.pagination;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300"><Activity className="h-4 w-4" />Clinical workspace</div><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Patients</h1><p className="mt-1 text-sm text-slate-500">Manage patient demographics and perioperative records for your institution.</p></div>
        <button type="button" onClick={() => navigate("/patients/new")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"><Plus className="h-4 w-4" />Register patient</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" />Patients in this view</div><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{pagination?.total ?? "—"}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500">Current page</p><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{pagination?.page ?? page}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500">Pages</p><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{pagination?.totalPages ?? "—"}</p></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="relative block max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, patient ID, phone or email" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <div className="mt-4">
          {query.isLoading ? <div className="py-12 text-center text-sm text-slate-500">Loading patient records...</div> : null}
          {query.isError ? <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{query.error.message}</div> : null}
          {!query.isLoading && !query.isError ? <PatientTable patients={result?.items || []} onOpen={(id) => navigate(`/patients/${id}`)} /> : null}
        </div>
        {pagination?.totalPages > 1 ? <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"><p className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40 dark:border-slate-700">Previous</button><button type="button" disabled={page >= pagination.totalPages || query.isFetching} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40 dark:border-slate-700">Next</button></div></div> : null}
      </div>
      <p className="text-xs text-slate-500">Patient search is restricted to the institution assigned to your approved clinical account.</p>
    </main>
  );
}
