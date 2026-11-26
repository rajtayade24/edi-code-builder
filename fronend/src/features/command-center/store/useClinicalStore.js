import { create } from "zustand";
import { MOCK_PATIENTS } from "../data/mockPatients.js";

const DEFAULT_INTERVENTIONS = {
  fluidBolus: false,
  icuAdmission: false,
  targetHemoglobin: 8.5,
  inotropicSupport: false,
  prophylacticAntibiotics: false,
};

function getBaselineHemoglobin(patient) {
  if (typeof patient?.baselineHemoglobin === "number" && Number.isFinite(patient.baselineHemoglobin)) {
    return patient.baselineHemoglobin;
  }
  if (patient?.id === "PAT-99042") return 8.1;
  if (patient?.id === "PAT-44120") return 10.2;
  return 13.8;
}

export const useClinicalStore = create((set, get) => ({
  patients: MOCK_PATIENTS,
  activePatientId: MOCK_PATIENTS[0].id,
  activePatient: MOCK_PATIENTS[0],
  searchQuery: "",

  setSearchQuery: (query) => set({ searchQuery: query }),

  selectPatient: (id) => {
    const query = String(id || "").trim();
    if (!query) return;
    const found = get().patients.find(
      (p) =>
        p.id === query ||
        p.mrn === query ||
        p.demographics.id === query ||
        p.demographics.mrn === query ||
        p.demographics.name.toLowerCase().includes(query.toLowerCase())
    );
    if (found) {
      set({
        activePatientId: found.id,
        activePatient: found,
        interventions: {
          ...DEFAULT_INTERVENTIONS,
          targetHemoglobin: getBaselineHemoglobin(found),
        },
        calculatedMortalityRate: found.baselineMortalityRate,
        mortalityDelta: 0,
        selectedGatNode: null,
      });
    }
  },

  addPatient: (input) => {
    const newId = `PAT-${Math.floor(10000 + Math.random() * 90000)}`;
    const formattedMrn = input.mrn?.trim() || newId;

    let estimatedMortality = 2.5;
    if (input.urgency === "Emergency") estimatedMortality += 7.0;
    else if (input.urgency === "Urgent") estimatedMortality += 3.5;

    if (input.asaClass === "Class IV" || input.asaClass === "Class V") estimatedMortality += 6.5;
    else if (input.asaClass === "Class III") estimatedMortality += 3.5;

    if (input.age > 70) estimatedMortality += 3.0;
    else if (input.age > 60) estimatedMortality += 1.5;

    if (input.creatinine > 1.8) estimatedMortality += 3.8;
    if (input.hemoglobin < 9.0) estimatedMortality += 2.2;
    if (input.map < 65) estimatedMortality += 3.2;

    const finalMortality = Number(Math.min(48.5, Math.max(0.8, estimatedMortality)).toFixed(1));
    const isHigh = finalMortality > 15;
    const baseHb = Number.isFinite(Number(input.hemoglobin)) ? Number(input.hemoglobin) : 8.5;

    const newPatient = {
      id: newId,
      mrn: formattedMrn,
      baselineHemoglobin: baseHb,
      isCustomAdded: true,
      demographics: {
        id: newId,
        mrn: formattedMrn,
        name: input.name.trim(),
        age: Number(input.age),
        sex: input.sex,
        bmi: Number(input.bmi),
        scheduledProcedure: input.scheduledProcedure,
        urgency: input.urgency,
        asaClass: input.asaClass,
        roomNumber: "OR-03 / Bedside Intake",
        admissionDate: new Date().toISOString().replace("T", " ").slice(0, 16),
        attendingSurgeon: input.attendingSurgeon || "Dr. On-Duty Surgeon, MD",
        anesthesiologist: "Dr. Clinical Anesthesiology Lead, MD",
      },
      baselineMortalityRate: finalMortality,
      complications: [
        {
          id: `comp-new-1-${newId}`,
          name: "Acute Kidney Injury (AKI)",
          percentage: Number((finalMortality * 1.3).toFixed(1)),
          riskLevel: finalMortality * 1.3 > 15 ? "high" : finalMortality * 1.3 >= 5 ? "moderate" : "low",
          benchmarkAvg: 5.2,
          description: `Renal hypoperfusion hazard based on Creatinine (${input.creatinine} mg/dL).`,
        },
        {
          id: `comp-new-2-${newId}`,
          name: "Extended ICU Stay (>48h)",
          percentage: Number((finalMortality * 1.6).toFixed(1)),
          riskLevel: finalMortality * 1.6 > 15 ? "high" : finalMortality * 1.6 >= 5 ? "moderate" : "low",
          benchmarkAvg: 8.1,
          description: "Prolonged postoperative stabilization requirement.",
        },
        {
          id: `comp-new-3-${newId}`,
          name: "Post-Op Sepsis / Infection",
          percentage: Number((finalMortality * 0.8).toFixed(1)),
          riskLevel: finalMortality * 0.8 > 15 ? "high" : finalMortality * 0.8 >= 5 ? "moderate" : "low",
          benchmarkAvg: 3.5,
          description: "Systemic inflammation or surgical site exposure hazard.",
        },
      ],
      modelBranches: [
        {
          id: "bilstm",
          name: "BiLSTM Branch",
          shortCode: "BiLSTM",
          description: "Longitudinal Signal Intake",
          statusText: "Doctor Uploaded Report Ingested",
          featuresProcessed: "Custom Intake Signals",
          latencyMs: 18,
          weightContribution: 35,
          lastUpdate: "Just Now",
          keyInsights: [`Ingested initial MAP (${input.map} mmHg).`, `Serum Creatinine: ${input.creatinine} mg/dL.`],
        },
        {
          id: "gat",
          name: "GAT Branch",
          shortCode: "GAT Network",
          description: "Co-morbidity Graph Layer",
          statusText: "Intake Graph Evaluated",
          featuresProcessed: "Custom Nodes",
          latencyMs: 24,
          weightContribution: 25,
          lastUpdate: "Just Now",
          keyInsights: ["Physician entered medical background processed."],
        },
        {
          id: "biobert",
          name: "Bio-BERT Branch",
          shortCode: "Bio-BERT",
          description: "Clinical Report NLP Parser",
          statusText: "Medical Report Scanned",
          featuresProcessed: "1 Uploaded Clinical Report",
          latencyMs: 32,
          weightContribution: 20,
          lastUpdate: "Just Now",
          keyInsights: [
            input.clinicalReport?.trim()
              ? `Parsed Report: "${input.clinicalReport.trim().slice(0, 70)}..."`
              : "Direct Intake Note Attached.",
          ],
        },
        {
          id: "xgboost",
          name: "XGBoost Branch",
          shortCode: "XGBoost",
          description: "Baseline Tabular Model",
          statusText: "EHR Vector Formed",
          featuresProcessed: "Dynamic Vector",
          latencyMs: 10,
          weightContribution: 20,
          lastUpdate: "Just Now",
          keyInsights: [`Age ${input.age} + ${input.asaClass} baseline scored.`],
        },
      ],
      shapDrivers: [
        {
          id: `shap-new-1-${newId}`,
          featureName: `Serum Creatinine (${input.creatinine} mg/dL)`,
          category: "lab",
          attributionPercent: input.creatinine > 1.5 ? 3.5 : -1.2,
          currentValue: `${input.creatinine} mg/dL`,
          baselineRange: "0.6 - 1.1 mg/dL",
          explanation: "Renal filtration baseline evaluated from doctor intake report.",
          impactLevel: input.creatinine > 1.5 ? "critical" : "favorable",
        },
        {
          id: `shap-new-2-${newId}`,
          featureName: `ASA Physical Status (${input.asaClass})`,
          category: "vitals",
          attributionPercent: input.asaClass === "Class IV" || input.asaClass === "Class V" ? 4.1 : input.asaClass === "Class III" ? 2.2 : -1.5,
          currentValue: input.asaClass,
          baselineRange: "ASA I-II",
          explanation: "Surgical physiological vulnerability baseline.",
          impactLevel: input.asaClass === "Class IV" || input.asaClass === "Class V" ? "critical" : "moderate",
        },
        {
          id: `shap-new-3-${newId}`,
          featureName: `Pre-op Hemoglobin (${baseHb} g/dL)`,
          category: "lab",
          attributionPercent: baseHb < 10.0 ? 2.5 : -1.8,
          currentValue: `${baseHb} g/dL`,
          baselineRange: "12.0 - 15.5 g/dL",
          explanation: "Oxygen carrying capacity reserve.",
          impactLevel: baseHb < 10.0 ? "critical" : "favorable",
        },
        {
          id: `shap-new-4-${newId}`,
          featureName: "Physician Report Ingestion",
          category: "note",
          attributionPercent: isHigh ? 2.8 : -1.0,
          currentValue: "Bio-BERT NLP Parsed",
          baselineRange: "Standard Intake",
          explanation: "Extracted key phrases from doctor uploaded report.",
          impactLevel: isHigh ? "critical" : "favorable",
        },
      ],
      gatNodes: [
        {
          id: `node-custom-1-${newId}`,
          name: "Renal Reserve Alert",
          icdCode: "N18.9",
          category: "Renal",
          attentionWeight: input.creatinine > 1.5 ? 0.85 : 0.4,
          severity: input.creatinine > 1.5 ? "critical" : "low",
          connectsTo: [],
          description: `Creatinine ${input.creatinine} mg/dL from clinical report.`,
          x: 350,
          y: 180,
        },
      ],
      vitalsSeries: [
        { time: "08:00", map: input.map + 10, hr: 78, spo2: 98, rr: 16, lactate: 1.2, baseExcess: 0.0, isMapAlert: false },
        { time: "09:00", map: input.map, hr: 84, spo2: 97, rr: 18, lactate: 1.5, baseExcess: -1.0, isMapAlert: input.map < 65 },
        { time: "10:00", map: input.map + 4, hr: 82, spo2: 97, rr: 17, lactate: 1.6, baseExcess: -0.8, isMapAlert: false },
      ],
      clinicalNotesExcerpt:
        input.clinicalReport?.trim() ||
        `Patient ${input.name} added by doctor via Clinical Command Center intake. Scheduled for ${input.scheduledProcedure}. MAP: ${input.map} mmHg, Hemoglobin: ${baseHb} g/dL, Creatinine: ${input.creatinine} mg/dL.`,
    };

    set((state) => ({
      patients: [newPatient, ...state.patients],
      activePatientId: newPatient.id,
      activePatient: newPatient,
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        targetHemoglobin: baseHb,
      },
      calculatedMortalityRate: newPatient.baselineMortalityRate,
      mortalityDelta: 0,
      selectedGatNode: null,
      isAddPatientModalOpen: false,
      alertNotification: {
        show: true,
        message: `NEW PATIENT ADDED: ${input.name} (${formattedMrn}) successfully ingested and risk score computed (${finalMortality}% Mortality).`,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));
  },

  interventions: { ...DEFAULT_INTERVENTIONS, targetHemoglobin: 8.1 },

  setIntervention: (key, value) => {
    set((state) => {
      const newInterventions = { ...state.interventions, [key]: value };
      const baseline = state.activePatient.baselineMortalityRate;
      let reduction = 0;

      if (newInterventions.fluidBolus) reduction += 3.5;
      if (newInterventions.icuAdmission) reduction += 2.8;
      if (newInterventions.inotropicSupport) reduction += 2.1;
      if (newInterventions.prophylacticAntibiotics) reduction += 1.4;

      const baseHb = getBaselineHemoglobin(state.activePatient);
      if (newInterventions.targetHemoglobin > baseHb) {
        const hbDiff = newInterventions.targetHemoglobin - baseHb;
        reduction += Math.min(2.5, hbDiff * 0.8);
      }

      const newMortality = Math.max(0.4, Number((baseline - reduction).toFixed(1)));
      const delta = Number((newMortality - baseline).toFixed(1));

      return {
        interventions: newInterventions,
        calculatedMortalityRate: newMortality,
        mortalityDelta: delta,
      };
    });
  },

  resetInterventions: () => {
    const active = get().activePatient;
    set({
      interventions: {
        ...DEFAULT_INTERVENTIONS,
        targetHemoglobin: getBaselineHemoglobin(active),
      },
      calculatedMortalityRate: active.baselineMortalityRate,
      mortalityDelta: 0,
    });
  },

  calculatedMortalityRate: MOCK_PATIENTS[0].baselineMortalityRate,
  mortalityDelta: 0,

  selectedBranch: null,
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  selectedGatNode: null,
  setSelectedGatNode: (node) => set({ selectedGatNode: node }),

  isAddPatientModalOpen: false,
  setIsAddPatientModalOpen: (open) => set({ isAddPatientModalOpen: open }),

  isHandoffModalOpen: false,
  setIsHandoffModalOpen: (open) => set({ isHandoffModalOpen: open }),

  isAlertAttendingModalOpen: false,
  setIsAlertAttendingModalOpen: (open) => set({ isAlertAttendingModalOpen: open }),

  isFhirModalOpen: false,
  setIsFhirModalOpen: (open) => set({ isFhirModalOpen: open }),

  alertNotification: null,

  sendAttendingAlert: (notes) => {
    const patient = get().activePatient;
    set({
      isAlertAttendingModalOpen: false,
      alertNotification: {
        show: true,
        message: `EMERGENCY ALERT DISPATCHED: ${patient.demographics.attendingSurgeon} notified for ${patient.demographics.name} (${patient.mrn}). Note: "${notes || "Immediate bedside review requested."}"`,
        timestamp: new Date().toLocaleTimeString(),
      },
    });
  },

  dismissAlertNotification: () => set({ alertNotification: null }),
}));
