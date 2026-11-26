import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import PatientForm from "../components/PatientForm";
import { useCreatePatient } from "../hooks/usePatients";

export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();

  const handleSubmit = async (payload) => {
    const result = await createPatient.mutateAsync(payload);
    navigate(`/patients/${result.patient.id}`, { replace: true, state: { created: true } });
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate("/patients")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className="h-4 w-4" />Back to patients</button>
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><UserPlus className="h-5 w-5" /></span><div><h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Register patient</h1><p className="mt-1 text-sm text-slate-500">Create a new patient record in your institution.</p></div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <PatientForm onSubmit={handleSubmit} onCancel={() => navigate("/patients")} isSubmitting={createPatient.isPending} />
      </div>
      <p className="text-xs text-slate-500">Only collect information that is required for care. This development module is not a substitute for a formally approved clinical records system.</p>
    </main>
  );
}
