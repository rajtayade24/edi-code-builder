import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label className={labelClass}>
      {label}{required ? <span className="ml-1 text-rose-600">*</span> : null}
      <input className={inputClass} name={name} type={type} value={value ?? ""} onChange={onChange} required={required} placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options, required = false }) {
  return (
    <label className={labelClass}>
      {label}{required ? <span className="ml-1 text-rose-600">*</span> : null}
      <select className={inputClass} name={name} value={value ?? ""} onChange={onChange} required={required}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

const initialValues = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", sexAtBirth: "UNKNOWN",
  genderIdentity: "", bloodGroup: "", mobile: "", email: "", emergencyContactName: "",
  emergencyContactMobile: "", emergencyContactRelationship: "", addressLine1: "",
  addressLine2: "", city: "", state: "", postalCode: "", country: "India",
};

export default function PatientForm({ initialData = initialValues, onSubmit, onCancel, isSubmitting = false, submitLabel = "Register patient" }) {
  const [values, setValues] = useState(() => Object.fromEntries(
    Object.keys(initialValues).map((key) => [key, initialData?.[key] ?? initialValues[key]])
  ));
  const [formError, setFormError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    );
    try {
      await onSubmit(payload);
    } catch (error) {
      setFormError(error.message || "Could not save the patient.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <section className="space-y-4">
        <div><h2 className="text-base font-semibold text-slate-900 dark:text-white">Basic information</h2><p className="mt-1 text-sm text-slate-500">Enter the patient's identifying details.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First name" name="firstName" value={values.firstName} onChange={handleChange} required />
          <Field label="Middle name" name="middleName" value={values.middleName} onChange={handleChange} />
          <Field label="Last name" name="lastName" value={values.lastName} onChange={handleChange} required />
          <Field label="Date of birth" name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={handleChange} required />
          <SelectField label="Sex at birth" name="sexAtBirth" value={values.sexAtBirth} onChange={handleChange} required options={[
            { value: "UNKNOWN", label: "Select / not recorded" }, { value: "FEMALE", label: "Female" },
            { value: "MALE", label: "Male" }, { value: "INTERSEX", label: "Intersex" },
          ]} />
          <Field label="Gender identity (optional)" name="genderIdentity" value={values.genderIdentity} onChange={handleChange} />
          <SelectField label="Blood group" name="bloodGroup" value={values.bloodGroup} onChange={handleChange} options={[
            { value: "", label: "Not recorded" }, ...["A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE","AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE","UNKNOWN"].map((value) => ({ value, label: value.replace("_POSITIVE", "+").replace("_NEGATIVE", "−").replace("_", " ") })),
          ]} />
          <Field label="Mobile number" name="mobile" value={values.mobile} onChange={handleChange} placeholder="Optional" />
          <Field label="Email" name="email" type="email" value={values.email} onChange={handleChange} />
        </div>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-base font-semibold text-slate-900 dark:text-white">Emergency contact</h2><p className="mt-1 text-sm text-slate-500">Add a contact who may be reached when needed.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Contact name" name="emergencyContactName" value={values.emergencyContactName} onChange={handleChange} />
          <Field label="Contact mobile" name="emergencyContactMobile" value={values.emergencyContactMobile} onChange={handleChange} />
          <Field label="Relationship" name="emergencyContactRelationship" value={values.emergencyContactRelationship} onChange={handleChange} />
        </div>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-base font-semibold text-slate-900 dark:text-white">Address</h2><p className="mt-1 text-sm text-slate-500">Address details are optional.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Address line 1" name="addressLine1" value={values.addressLine1} onChange={handleChange} />
          <Field label="Address line 2" name="addressLine2" value={values.addressLine2} onChange={handleChange} />
          <Field label="City" name="city" value={values.city} onChange={handleChange} />
          <Field label="State" name="state" value={values.state} onChange={handleChange} />
          <Field label="Postal code" name="postalCode" value={values.postalCode} onChange={handleChange} />
          <Field label="Country" name="country" value={values.country} onChange={handleChange} />
        </div>
      </section>

      {formError ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{formError}</p> : null}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        {onCancel ? <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" />Cancel</button> : null}
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{isSubmitting ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}
