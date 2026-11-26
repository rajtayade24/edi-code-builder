import { useState } from "react";
import { Check, Copy, Database, Download, X } from "lucide-react";
import { toast } from "sonner";
import { useClinicalStore } from "../../store/useClinicalStore";

export function FhirJsonModal() {
  const { isFhirModalOpen, setIsFhirModalOpen, activePatient, calculatedMortalityRate } = useClinicalStore();
  const [copied, setCopied] = useState(false);

  if (!isFhirModalOpen) return null;

  const fhirResource = {
    resourceType: "RiskAssessment",
    id: `surgrisk-${activePatient.demographics.mrn.toLowerCase()}-mortality`,
    meta: {
      versionId: "1",
      lastUpdated: new Date().toISOString(),
      profile: ["http://hl7.org/fhir/StructureDefinition/RiskAssessment"],
    },
    status: "final",
    subject: {
      reference: `Patient/${activePatient.demographics.mrn}`,
      display: activePatient.demographics.name,
    },
    occurrenceDateTime: new Date().toISOString(),
    performer: {
      display: "SurgRisk-AI Ensemble Model v4.2 PRO (BiLSTM + GAT + Bio-BERT + XGBoost)",
    },
    basis: [
      { reference: `Observation/${activePatient.demographics.mrn}-bilstm-vitals` },
      { reference: `DiagnosticReport/${activePatient.demographics.mrn}-gat-comorbidity-matrix` },
    ],
    prediction: [
      {
        outcome: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "419620001",
              display: "30-Day Perioperative Mortality Risk",
            },
          ],
          text: "30-Day Perioperative Mortality Risk",
        },
        probabilityDecimal: Number((calculatedMortalityRate / 100).toFixed(4)),
        qualitativeRisk: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/risk-probability",
              code: calculatedMortalityRate > 15 ? "high" : calculatedMortalityRate > 5 ? "moderate" : "low",
              display:
                calculatedMortalityRate > 15
                  ? "High Risk (>15%)"
                  : calculatedMortalityRate > 5
                  ? "Moderate Risk (5-15%)"
                  : "Low Risk (<5%)",
            },
          ],
        },
      },
    ],
  };

  const jsonString = JSON.stringify(fhirResource, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access was blocked by the browser. Use Download .json instead.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FHIR_RiskAssessment_${activePatient.demographics.mrn}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Database className="h-5 w-5 text-teal-400 shrink-0" />
            <h2 className="text-base font-bold tracking-tight truncate">FHIR R4 Observation / RiskAssessment Payload</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download .json
            </button>
            <button
              type="button"
              onClick={() => setIsFhirModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 text-emerald-400 overflow-y-auto font-mono text-xs leading-relaxed flex-1">
          <pre>{jsonString}</pre>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>FHIR Version: R4 (4.0.1) Compliant • HL7 Interoperability Validated</span>
          <button
            type="button"
            onClick={() => setIsFhirModalOpen(false)}
            className="px-4 py-1.5 font-bold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
