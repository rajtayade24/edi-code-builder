import { useState } from "react";
import { useAddComorbidity, useAddMedicalHistory, useAddSurgicalCase, useAddVitals } from "../hooks/usePatients";

const fieldClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function TextField({ label, name, value, onChange, type = "text", required = false, placeholder, step, min, max }) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className={fieldClass}
        name={name}
        value={value ?? ""}
        type={type}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className={labelClass}>
      {label}
      <select className={fieldClass} name={name} value={value} onChange={onChange}>
        {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  );
}

function NotesField({ label = "Notes", name = "notes", value, onChange }) {
  return (
    <label className={labelClass}>
      {label}
      <textarea className={`${fieldClass} min-h-20 resize-y`} name={name} value={value ?? ""} onChange={onChange} rows={3} />
    </label>
  );
}

function RecordForm({ title, description, mutation, initial, children, buildPayload, submitLabel }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const handleChange = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = buildPayload(values);
      await mutation.mutateAsync(payload);
      setValues(initial);
    } catch (submitError) {
      setError(submitError.message || "Could not save this record.");
    }
  };
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <span>
          <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
          <span className="mt-1 block text-xs text-slate-500">{description}</span>
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 group-open:bg-teal-50 group-open:text-teal-800 dark:bg-slate-800 dark:text-slate-200 dark:group-open:bg-teal-950 dark:group-open:text-teal-200">Add</span>
      </summary>
      <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="grid gap-4 sm:grid-cols-2">{children(values, handleChange)}</div>
        {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end">
          <button type="submit" disabled={mutation.isPending} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
            {mutation.isPending ? "Saving..." : submitLabel || "Save record"}
          </button>
        </div>
      </form>
    </details>
  );
}

export function MedicalHistoryForm({ patientId }) {
  const mutation = useAddMedicalHistory(patientId);
  const initial = { category: "MEDICAL", title: "", description: "", notedOn: "", status: "ACTIVE" };
  return (
    <RecordForm title="Medical history" description="Add relevant medical, surgical, family, social, allergy or medication history." mutation={mutation} initial={initial} buildPayload={(v) => v}>
      {(v, change) => <>
        <SelectField label="Category" name="category" value={v.category} onChange={change} options={["MEDICAL", "SURGICAL", "FAMILY", "SOCIAL", "ALLERGY", "MEDICATION", "OTHER"].map((x) => ({ value: x, label: x.replaceAll("_", " ") }))} />
        <TextField label="Title" name="title" value={v.title} onChange={change} required />
        <TextField label="Noted on" name="notedOn" value={v.notedOn} onChange={change} type="date" />
        <SelectField label="Status" name="status" value={v.status} onChange={change} options={[{ value: "ACTIVE", label: "Active" }, { value: "RESOLVED", label: "Resolved" }, { value: "INACTIVE", label: "Inactive" }]} />
        <div className="sm:col-span-2"><NotesField name="description" label="Description" value={v.description} onChange={change} /></div>
      </>}
    </RecordForm>
  );
}

export function ComorbidityForm({ patientId }) {
  const mutation = useAddComorbidity(patientId);
  const initial = { conditionName: "", conditionCode: "", severity: "UNKNOWN", status: "ACTIVE", diagnosedOn: "", notes: "" };
  return (
    <RecordForm title="Comorbidity" description="Record a condition that may be relevant to perioperative assessment." mutation={mutation} initial={initial} buildPayload={(v) => v}>
      {(v, change) => <>
        <TextField label="Condition" name="conditionName" value={v.conditionName} onChange={change} required />
        <TextField label="Code (optional)" name="conditionCode" value={v.conditionCode} onChange={change} />
        <SelectField label="Severity" name="severity" value={v.severity} onChange={change} options={["UNKNOWN", "MILD", "MODERATE", "SEVERE"].map((x) => ({ value: x, label: x }))} />
        <SelectField label="Status" name="status" value={v.status} onChange={change} options={[{ value: "ACTIVE", label: "Active" }, { value: "RESOLVED", label: "Resolved" }]} />
        <TextField label="Diagnosed on" name="diagnosedOn" value={v.diagnosedOn} onChange={change} type="date" />
        <div className="sm:col-span-2"><NotesField value={v.notes} onChange={change} /></div>
      </>}
    </RecordForm>
  );
}

export function VitalsForm({ patientId }) {
  const mutation = useAddVitals(patientId);
  const initial = { systolicBp: "", diastolicBp: "", heartRate: "", respiratoryRate: "", temperatureC: "", oxygenSaturation: "", weightKg: "", heightCm: "", bloodGlucoseMgDl: "", notes: "" };
  const numberKeys = Object.keys(initial).filter((key) => key !== "notes");

  const buildPayload = (values) => {
    const payload = {};
    for (const key of numberKeys) {
      if (values[key] !== "") {
        const parsed = Number(values[key]);
        if (!Number.isFinite(parsed)) {
          throw new Error(`Enter a valid number for ${key}.`);
        }
        payload[key] = parsed;
      }
    }
    if (Object.keys(payload).length === 0) {
      throw new Error("Enter at least one vital measurement.");
    }
    if (values.notes.trim()) {
      payload.notes = values.notes.trim();
    }
    return payload;
  };

  return (
    <RecordForm title="Record vital signs" description="Save an observed measurement with its unit. Blank fields are omitted." mutation={mutation} initial={initial} submitLabel="Save vitals" buildPayload={buildPayload}>
      {(v, change) => <>
        <TextField label="Systolic BP (mmHg)" name="systolicBp" value={v.systolicBp} onChange={change} type="number" step="1" min="40" max="300" />
        <TextField label="Diastolic BP (mmHg)" name="diastolicBp" value={v.diastolicBp} onChange={change} type="number" step="1" min="20" max="200" />
        <TextField label="Heart rate (bpm)" name="heartRate" value={v.heartRate} onChange={change} type="number" step="1" min="20" max="250" />
        <TextField label="Respiratory rate (/min)" name="respiratoryRate" value={v.respiratoryRate} onChange={change} type="number" step="1" min="4" max="80" />
        <TextField label="Temperature (°C)" name="temperatureC" value={v.temperatureC} onChange={change} type="number" step="any" min="25" max="45" />
        <TextField label="Oxygen saturation (%)" name="oxygenSaturation" value={v.oxygenSaturation} onChange={change} type="number" step="any" min="0" max="100" />
        <TextField label="Weight (kg)" name="weightKg" value={v.weightKg} onChange={change} type="number" step="any" min="0.5" max="500" />
        <TextField label="Height (cm)" name="heightCm" value={v.heightCm} onChange={change} type="number" step="any" min="20" max="250" />
        <TextField label="Blood glucose (mg/dL)" name="bloodGlucoseMgDl" value={v.bloodGlucoseMgDl} onChange={change} type="number" step="any" min="1" max="2000" />
        <div className="sm:col-span-2"><NotesField value={v.notes} onChange={change} /></div>
      </>}
    </RecordForm>
  );
}

export function SurgicalCaseForm({ patientId }) {
  const mutation = useAddSurgicalCase(patientId);
  const initial = { procedureName: "", procedureCode: "", specialty: "", urgency: "ELECTIVE", status: "PLANNED", plannedAt: "", asaClass: "", anesthesiaType: "", roomNumber: "", surgeonUserId: "", anesthesiologistUserId: "", notes: "" };

  const buildPayload = (values) => {
    let plannedAt = "";
    if (values.plannedAt) {
      const parsedDate = new Date(values.plannedAt);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Enter a valid planned date and time.");
      }
      plannedAt = parsedDate.toISOString();
    }
    const surgeonUserId = values.surgeonUserId.trim();
    const anesthesiologistUserId = values.anesthesiologistUserId.trim();
    if (surgeonUserId && !UUID_REGEX.test(surgeonUserId)) {
      throw new Error("Surgeon user ID must be a valid UUID or left blank.");
    }
    if (anesthesiologistUserId && !UUID_REGEX.test(anesthesiologistUserId)) {
      throw new Error("Anesthesiologist user ID must be a valid UUID or left blank.");
    }
    return {
      ...values,
      procedureName: values.procedureName.trim(),
      procedureCode: values.procedureCode.trim(),
      specialty: values.specialty.trim(),
      anesthesiaType: values.anesthesiaType.trim(),
      roomNumber: values.roomNumber.trim(),
      surgeonUserId,
      anesthesiologistUserId,
      asaClass: values.asaClass === "" ? null : Number(values.asaClass),
      plannedAt,
    };
  };

  return (
    <RecordForm title="Surgical case" description="Create a planned or completed surgical case for this patient." mutation={mutation} initial={initial} submitLabel="Create surgical case" buildPayload={buildPayload}>
      {(v, change) => <>
        <TextField label="Procedure name" name="procedureName" value={v.procedureName} onChange={change} required />
        <TextField label="Procedure code" name="procedureCode" value={v.procedureCode} onChange={change} />
        <TextField label="Specialty" name="specialty" value={v.specialty} onChange={change} />
        <SelectField label="Urgency" name="urgency" value={v.urgency} onChange={change} options={[{ value: "ELECTIVE", label: "Elective" }, { value: "URGENT", label: "Urgent" }, { value: "EMERGENCY", label: "Emergency" }]} />
        <SelectField label="Case status" name="status" value={v.status} onChange={change} options={[{ value: "PLANNED", label: "Planned" }, { value: "SCHEDULED", label: "Scheduled" }, { value: "IN_PROGRESS", label: "In progress" }, { value: "COMPLETED", label: "Completed" }, { value: "CANCELLED", label: "Cancelled" }]} />
        <TextField label="Planned date and time" name="plannedAt" value={v.plannedAt} onChange={change} type="datetime-local" />
        <SelectField label="ASA class" name="asaClass" value={v.asaClass} onChange={change} options={[{ value: "", label: "Not recorded" }, ...[1, 2, 3, 4, 5, 6].map((x) => ({ value: String(x), label: `ASA ${x}` }))]} />
        <TextField label="Anesthesia type" name="anesthesiaType" value={v.anesthesiaType} onChange={change} />
        <TextField label="Operating room" name="roomNumber" value={v.roomNumber} onChange={change} />
        <TextField label="Surgeon user ID (optional UUID)" name="surgeonUserId" value={v.surgeonUserId} onChange={change} placeholder="Optional UUID" />
        <TextField label="Anesthesiologist user ID (optional UUID)" name="anesthesiologistUserId" value={v.anesthesiologistUserId} onChange={change} placeholder="Optional UUID" />
        <div className="sm:col-span-2"><NotesField value={v.notes} onChange={change} /></div>
      </>}
    </RecordForm>
  );
}
