import { useState } from "react";
import { Activity, FileText, ShieldCheck, Stethoscope, UserPlus, X } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

const INITIAL_FORM = {
  name: "",
  mrn: "",
  age: 65,
  sex: "Female",
  bmi: 28.5,
  scheduledProcedure: "Emergency Exploratory Laparotomy",
  urgency: "Emergency",
  asaClass: "Class IV",
  attendingSurgeon: "Dr. Sarah Jenkins, MD",
  clinicalReport: "",
  creatinine: 1.8,
  hemoglobin: 9.5,
  albumin: 3.8,
  map: 64,
};

export function AddPatientModal() {
  const { isAddPatientModalOpen, setIsAddPatientModalOpen, addPatient } = useClinicalStore();
  const [formData, setFormData] = useState(INITIAL_FORM);

  if (!isAddPatientModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addPatient({
      name: formData.name.trim(),
      mrn: formData.mrn.trim() || `PAT-${Math.floor(10000 + Math.random() * 90000)}`,
      age: Number(formData.age) || 65,
      sex: formData.sex,
      bmi: Number(formData.bmi) || 25,
      scheduledProcedure: formData.scheduledProcedure.trim() || "General Surgery Procedure",
      urgency: formData.urgency,
      asaClass: formData.asaClass,
      attendingSurgeon: formData.attendingSurgeon.trim(),
      clinicalReport: formData.clinicalReport.trim(),
      creatinine: Number(formData.creatinine) || 1.0,
      hemoglobin: Number(formData.hemoglobin) || 10.0,
      albumin: Number(formData.albumin) || 3.8,
      map: Number(formData.map) || 75,
    });
    setFormData(INITIAL_FORM);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-4 bg-[#1E3A8A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500 text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Add New Patient &amp; Clinical Report</h2>
              <p className="text-xs text-teal-200">Enter patient info &amp; paste report for instant AI risk assessment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddPatientModalOpen(false)}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Stethoscope className="h-4 w-4 text-teal-600" />
              1. Patient Demographics &amp; Procedure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Lawson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">MRN (Medical Record Number)</label>
                <input
                  type="text"
                  placeholder="e.g. PAT-88201 (Auto-generated if empty)"
                  value={formData.mrn}
                  onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Biological Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">BMI (kg/m²)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bmi}
                  onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheduled Procedure Name</label>
                <input
                  type="text"
                  value={formData.scheduledProcedure}
                  onChange={(e) => setFormData({ ...formData, scheduledProcedure: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Surgical Urgency</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                >
                  <option value="Emergency">Emergency Surgery</option>
                  <option value="Urgent">Urgent Surgery</option>
                  <option value="Elective">Elective Surgery</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ASA Physical Status Classification</label>
                <select
                  value={formData.asaClass}
                  onChange={(e) => setFormData({ ...formData, asaClass: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-navy-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                >
                  <option value="Class I">ASA I - Normal Healthy Patient</option>
                  <option value="Class II">ASA II - Mild Systemic Disease</option>
                  <option value="Class III">ASA III - Severe Systemic Disease</option>
                  <option value="Class IV">ASA IV - Severe Life-Threatening Disease</option>
                  <option value="Class V">ASA V - Moribund Patient</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attending Surgeon Name</label>
                <input
                  type="text"
                  value={formData.attendingSurgeon}
                  onChange={(e) => setFormData({ ...formData, attendingSurgeon: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <FileText className="h-4 w-4 text-teal-600" />
              2. Paste Clinical Medical Report &amp; Notes (Bio-BERT NLP Ingestion)
            </h3>

            <textarea
              rows={4}
              value={formData.clinicalReport}
              onChange={(e) => setFormData({ ...formData, clinicalReport: e.target.value })}
              placeholder="Paste ED intake report, operative summary, or clinical notes here... (e.g. 65yo female with acute abdominal pain, persistent hypotension, elevated creatinine, delayed resuscitation prior to transfer)."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 leading-relaxed focus:bg-white focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              The Bio-BERT NLP engine automatically parses risk phrases (e.g., hypotension, bowel perforation, sepsis) to weigh mortality probability.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Activity className="h-4 w-4 text-teal-600" />
              3. Pre-Op Key Labs &amp; Vitals Baseline
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Serum Creatinine (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.creatinine}
                  onChange={(e) => setFormData({ ...formData, creatinine: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hemoglobin (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.hemoglobin}
                  onChange={(e) => setFormData({ ...formData, hemoglobin: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mean Arterial MAP (mmHg)</label>
                <input
                  type="number"
                  value={formData.map}
                  onChange={(e) => setFormData({ ...formData, map: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddPatientModalOpen(false)}
              className="px-4 py-2.5 font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold bg-navy-900 hover:bg-navy-800 text-white rounded-xl flex items-center gap-2 shadow-md transition-all"
            >
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              Compute AI Risk &amp; Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
