import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowLeft, ClipboardList, HeartPulse, Stethoscope, UserRound } from "lucide-react";
import { toast } from "sonner";
import { usePatient, useUpdateComorbidity, useUpdatePatient, useUpdateSurgicalCase } from "../hooks/usePatients";
import PatientForm from "../components/PatientForm";
import { ComorbidityForm, MedicalHistoryForm, SurgicalCaseForm, VitalsForm } from "../components/PatientRecordForms";
import PatientLabsPanel from "@/features/ai-assessment/components/PatientLabsPanel";

function displayDate(value) {
  if (!value) return "Not recorded";
  const day = String(value).slice(0, 10);
  const parts = day.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : day;
}

function formatBmi(weightKg, heightCm) {
  const weight = Number(weightKg);
  const heightMeters = Number(heightCm) / 100;
  if (!Number.isFinite(weight) || !Number.isFinite(heightMeters) || weight <= 0 || heightMeters <= 0) return "—";
  return `${(weight / (heightMeters * heightMeters)).toFixed(1)} kg/m²`;
}

function Panel({ title, icon: Icon, children, count }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Icon className="h-4 w-4 text-teal-700 dark:text-teal-300" />
          {title}
        </h2>
        {typeof count === "number" ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{count}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyText() { return <p className="text-sm text-slate-500">No records added yet.</p>; }

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const query = usePatient(patientId);
  const updatePatient = useUpdatePatient(patientId);
  const updateComorbidity = useUpdateComorbidity(patientId);
  const updateSurgicalCase = useUpdateSurgicalCase(patientId);
  const [editing, setEditing] = useState(false);
  const profile = query.data;
  const patient = profile?.patient;

  const handleToggleComorbidityStatus = async (item) => {
    const nextStatus = item.status === "ACTIVE" ? "RESOLVED" : "ACTIVE";
    try {
      await updateComorbidity.mutateAsync({ comorbidityId: item.id, payload: { status: nextStatus } });
      toast.success(`Comorbidity marked ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      toast.error(error.message || "Could not update comorbidity.");
    }
  };

  const handleCaseStatusChange = async (caseId, status) => {
    try {
      await updateSurgicalCase.mutateAsync({ caseId, payload: { status } });
      toast.success("Surgical case status updated.");
    } catch (error) {
      toast.error(error.message || "Could not update surgical case.");
    }
  };

  if (query.isLoading) return <main className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-slate-500">Loading patient profile...</main>;
  if (query.isError) return <main className="mx-auto max-w-3xl px-4 py-12"><button type="button" onClick={() => navigate("/patients")} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />Patients</button><div role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{query.error.message}</div></main>;
  if (!patient) return null;

  const latestVitals = profile.vitals?.[0];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate("/patients")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className="h-4 w-4" />Back to patients</button>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><UserRound className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Patient profile</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{patient.firstName} {patient.middleName ? `${patient.middleName} ` : ""}{patient.lastName}</h1>
              <p className="mt-1 text-sm text-slate-500">Patient ID: <span className="font-semibold text-slate-700 dark:text-slate-300">{patient.patientNumber}</span></p>
            </div>
          </div>
          <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{editing ? "Close editor" : "Edit profile"}</button>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"><p className="text-xs text-slate-500">Age</p><p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{patient.age ?? "—"}</p></div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"><p className="text-xs text-slate-500">Sex at birth</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{patient.sexAtBirth}</p></div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"><p className="text-xs text-slate-500">Blood group</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{patient.bloodGroup || "—"}</p></div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-slate-500">Date of birth</p><p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{displayDate(patient.dateOfBirth)}</p></div>
          <div><p className="text-xs text-slate-500">Mobile</p><p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{patient.mobile || "Not provided"}</p></div>
          <div><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all font-medium text-slate-800 dark:text-slate-200">{patient.email || "Not provided"}</p></div>
          <div><p className="text-xs text-slate-500">Institution</p><p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{patient.institution}</p></div>
        </div>
      </section>

      {editing ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5"><h2 className="text-lg font-bold text-slate-950 dark:text-white">Edit patient profile</h2><p className="mt-1 text-sm text-slate-500">Update the demographic and contact information.</p></div>
          <PatientForm initialData={patient} onSubmit={async (payload) => { await updatePatient.mutateAsync(payload); setEditing(false); toast.success("Patient profile updated."); }} onCancel={() => setEditing(false)} isSubmitting={updatePatient.isPending} submitLabel="Save changes" />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Comorbidities" icon={HeartPulse} count={profile.comorbidities?.length || 0}>
          {profile.comorbidities?.length ? (
            <div className="space-y-3">
              {profile.comorbidities.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.conditionName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.conditionCode || "No code"} · {item.severity} · {item.status}</p>
                    {item.notes ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.notes}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-slate-400">{displayDate(item.diagnosedOn)}</span>
                    <button
                      type="button"
                      disabled={updateComorbidity.isPending}
                      onClick={() => handleToggleComorbidityStatus(item)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Mark {item.status === "ACTIVE" ? "resolved" : "active"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyText />}
        </Panel>
        <Panel title="Latest vital signs" icon={Activity} count={profile.vitals?.length || 0}>
          {latestVitals ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Blood pressure", latestVitals.systolicBp != null && latestVitals.diastolicBp != null ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp} mmHg` : "—"],
                ["Heart rate", latestVitals.heartRate != null ? `${latestVitals.heartRate} bpm` : "—"],
                ["Respiratory rate", latestVitals.respiratoryRate != null ? `${latestVitals.respiratoryRate}/min` : "—"],
                ["Temperature", latestVitals.temperatureC != null ? `${latestVitals.temperatureC} °C` : "—"],
                ["SpO₂", latestVitals.oxygenSaturation != null ? `${latestVitals.oxygenSaturation}%` : "—"],
                ["Glucose", latestVitals.bloodGlucoseMgDl != null ? `${latestVitals.bloodGlucoseMgDl} mg/dL` : "—"],
                ["Weight", latestVitals.weightKg != null ? `${latestVitals.weightKg} kg` : "—"],
                ["Height", latestVitals.heightCm != null ? `${latestVitals.heightCm} cm` : "—"],
                ["BMI", formatBmi(latestVitals.weightKg, latestVitals.heightCm)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : <EmptyText />}
          {latestVitals?.measuredAt ? <p className="mt-3 text-xs text-slate-400">Recorded {new Date(latestVitals.measuredAt).toLocaleString()}</p> : null}
        </Panel>
      </div>

      <PatientLabsPanel patientId={patientId} />

      <Panel title="Medical history" icon={ClipboardList} count={profile.medicalHistory?.length || 0}>
        {profile.medicalHistory?.length ? <div className="space-y-3">{profile.medicalHistory.map((item) => <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.category} · {item.status}</span></div>{item.description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p> : null}</div>)}</div> : <EmptyText />}
      </Panel>

      <Panel title="Surgical cases" icon={Stethoscope} count={profile.surgicalCases?.length || 0}>
        {profile.surgicalCases?.length ? (
          <div className="space-y-3">
            {profile.surgicalCases.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.procedureName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.specialty || "Specialty not specified"} · {item.urgency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Status for ${item.procedureName}`}
                      value={item.status}
                      disabled={updateSurgicalCase.isPending}
                      onChange={(event) => handleCaseStatusChange(item.id, event.target.value)}
                      className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200"
                    >
                      <option value="PLANNED">PLANNED</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Planned: {item.plannedAt ? new Date(item.plannedAt).toLocaleString() : "Not scheduled"} · ASA {item.asaClass || "—"}</p>
                <button type="button" onClick={() => navigate(`/patients/${patientId}/surgical-cases/${item.id}/risk-assessment`)} className="mt-3 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">Open risk assessment</button>
                <p className="mt-1 text-xs text-slate-500">Surgeon: {item.surgeonName || "Unassigned"} · Anesthesiologist: {item.anesthesiologistName || "Unassigned"}</p>
              </div>
            ))}
          </div>
        ) : <EmptyText />}
      </Panel>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Add clinical records</h2>
          <p className="mt-1 text-sm text-slate-500">Add structured entries to the patient&apos;s record. Information entered here is not itself an AI risk prediction.</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <MedicalHistoryForm patientId={patientId} />
          <ComorbidityForm patientId={patientId} />
          <VitalsForm patientId={patientId} />
          <SurgicalCaseForm patientId={patientId} />
        </div>
      </section>
    </main>
  );
}
