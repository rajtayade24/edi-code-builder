import { createHash, randomUUID } from "node:crypto";
import { aiConfig } from "../config/ai.js";
import { Patient } from "../models/Patient.js";
import { PatientSurgicalCase } from "../models/PatientSurgicalCase.js";
import { PatientComorbidity } from "../models/PatientComorbidity.js";
import { PatientVitals } from "../models/PatientVitals.js";
import { PatientLabResult } from "../models/PatientLabResult.js";
import { PatientMedicalHistory } from "../models/PatientMedicalHistory.js";
import { PatientAuditLog } from "../models/PatientAuditLog.js";
import { AiRiskAssessment } from "../models/AiRiskAssessment.js";
import { ApiError } from "../utils/api-error.js";
import { aiClient } from "./ai-client.js";

const MODEL_MANIFEST_VERSION = "unassigned";

function normalizeDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const year = String(value.getFullYear()).padStart(4, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function calculateAge(dateOfBirth) {
  const normalized = normalizeDateOnly(dateOfBirth);
  if (!normalized) return null;
  const dob = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  if (
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}

async function buildModelInput(patientId, caseId, institution) {
  const patient = await Patient.findOne({ _id: patientId, institution, isArchived: false })
    .select("dateOfBirth sexAtBirth")
    .lean();
  if (!patient) throw new ApiError(404, "Patient was not found in your institution.");

  const surgicalCase = await PatientSurgicalCase.findOne({ _id: caseId, patientId })
    .select("procedureName procedureCode specialty urgency status asaClass anesthesiaType notes")
    .lean();
  if (!surgicalCase) throw new ApiError(404, "Surgical case was not found for this patient.");

  const [comorbidities, vitalsDesc, labsDesc, notes] = await Promise.all([
    PatientComorbidity.find({ patientId, status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("conditionName conditionCode severity status")
      .lean(),
    PatientVitals.find({ patientId })
      .sort({ measuredAt: -1 })
      .limit(100)
      .lean(),
    PatientLabResult.find({
      patientId,
      institution,
      resultStatus: { $in: ["FINAL", "CORRECTED"] },
    })
      .sort({ collectedAt: -1 })
      .limit(100)
      .lean(),
    aiConfig.includeClinicalNotes
      ? PatientMedicalHistory.find({
          patientId,
          status: "ACTIVE",
          category: { $in: ["MEDICAL", "SURGICAL", "OTHER"] },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("title description")
          .lean()
      : Promise.resolve([]),
  ]);

  const vitals = [...vitalsDesc].reverse();
  const labs = [...labsDesc].reverse();

  const latestVitals = vitals.at(-1) || {};
  const weight = latestVitals.weightKg == null ? null : Number(latestVitals.weightKg);
  const height = latestVitals.heightCm == null ? null : Number(latestVitals.heightCm) / 100;
  const bmi = weight && height ? Number((weight / (height * height)).toFixed(2)) : null;

  const clinicalNotes = [
    surgicalCase.notes ? `Surgical case: ${surgicalCase.notes}` : null,
    ...notes.map((item) => [item.title, item.description].filter(Boolean).join(": ")),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 12000);

  // No names, contact details, patient number, address, or institution name are sent to Python.
  return {
    correlation_id: randomUUID(),
    patient: {
      age: calculateAge(patient.dateOfBirth),
      sex_at_birth: patient.sexAtBirth,
      bmi,
    },
    procedure: {
      name: surgicalCase.procedureName,
      code: surgicalCase.procedureCode,
      specialty: surgicalCase.specialty,
      urgency: surgicalCase.urgency,
      asa_class: surgicalCase.asaClass,
      anesthesia_type: surgicalCase.anesthesiaType,
    },
    comorbidities: comorbidities.map((item) => ({
      name: item.conditionName,
      code: item.conditionCode,
      severity: item.severity,
      status: item.status,
    })),
    vitals: vitals.map((item) => ({
      measured_at: item.measuredAt,
      systolic_bp: item.systolicBp,
      diastolic_bp: item.diastolicBp,
      heart_rate: item.heartRate,
      respiratory_rate: item.respiratoryRate,
      temperature_c: item.temperatureC == null ? null : Number(item.temperatureC),
      oxygen_saturation: item.oxygenSaturation == null ? null : Number(item.oxygenSaturation),
      blood_glucose_mg_dl: item.bloodGlucoseMgDl == null ? null : Number(item.bloodGlucoseMgDl),
    })),
    lab_results: labs.map((item) => ({
      code: item.labCode,
      test_name: item.testName,
      numeric_value: item.numericValue == null ? null : Number(item.numericValue),
      result_text: item.resultText,
      unit: item.unit,
      collected_at: item.collectedAt,
    })),
    clinical_notes: aiConfig.includeClinicalNotes && clinicalNotes ? clinicalNotes : null,
  };
}

function mapAssessment(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    patientId: doc.patientId,
    surgicalCaseId: doc.surgicalCaseId,
    status: doc.status,
    outcomeCode: doc.outcomeCode,
    result: doc.resultJson,
    modelStatuses: doc.modelStatusJson,
    errorCode: doc.errorCode,
    createdAt: doc.createdAt,
    completedAt: doc.completedAt,
  };
}

export async function getModelStatuses() {
  return aiClient.getModels();
}

export async function createRiskAssessment(patientId, caseId, auth) {
  const input = await buildModelInput(patientId, caseId, auth.institution);
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const assessmentId = randomUUID();

  await AiRiskAssessment.create({
    _id: assessmentId,
    patientId,
    surgicalCaseId: caseId,
    institution: auth.institution,
    requestedBy: auth.sub,
    status: "PENDING",
    inputFingerprint: fingerprint,
  });

  await PatientAuditLog.create({
    _id: randomUUID(),
    patientId,
    actorUserId: auth.sub,
    action: "AI_ASSESSMENT_REQUESTED",
    entityType: "AI_ASSESSMENT",
    entityId: assessmentId,
    changedFields: [],
  });

  try {
    const output = await aiClient.assess(input);
    const statuses = (output.branches || []).map((branch) => ({
      id: branch.id,
      status: branch.status,
      modelVersion: branch.model_version,
      latencyMs: branch.latency_ms,
    }));
    const completed = await AiRiskAssessment.findByIdAndUpdate(
      assessmentId,
      {
        $set: {
          status: "COMPLETED",
          resultJson: output,
          modelStatusJson: statuses,
          modelManifestVersion: String(output.model_manifest_version || MODEL_MANIFEST_VERSION).slice(0, 80),
          completedAt: new Date(),
        },
      },
      { new: true }
    ).lean();
    return mapAssessment(completed);
  } catch (error) {
    const unavailable = error.statusCode === 503;
    const statuses = error.details?.models || [];
    const failed = await AiRiskAssessment.findByIdAndUpdate(
      assessmentId,
      {
        $set: {
          status: unavailable ? "UNAVAILABLE" : "FAILED",
          errorCode: error.details?.code || "AI_ASSESSMENT_FAILED",
          modelStatusJson: statuses,
          completedAt: new Date(),
        },
      },
      { new: true }
    ).lean();
    return mapAssessment(failed);
  }
}

export async function listRiskAssessments(patientId, caseId, auth) {
  const [patient, surgicalCase] = await Promise.all([
    Patient.findOne({ _id: patientId, institution: auth.institution, isArchived: false })
      .select("_id")
      .lean(),
    PatientSurgicalCase.findOne({ _id: caseId, patientId }).select("_id").lean(),
  ]);
  if (!patient || !surgicalCase) {
    throw new ApiError(404, "Surgical case was not found for this patient.");
  }

  const rows = await AiRiskAssessment.find({
    patientId,
    surgicalCaseId: caseId,
    institution: auth.institution,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return rows.map(mapAssessment);
}

export async function getRiskAssessment(assessmentId, auth) {
  const row = await AiRiskAssessment.findOne({
    _id: assessmentId,
    institution: auth.institution,
  }).lean();
  if (!row) throw new ApiError(404, "Risk assessment was not found in your institution.");
  return mapAssessment(row);
}
