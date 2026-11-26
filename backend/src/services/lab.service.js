import { randomUUID } from "node:crypto";
import { Patient } from "../models/Patient.js";
import { PatientLabResult } from "../models/PatientLabResult.js";
import { PatientAuditLog } from "../models/PatientAuditLog.js";
import { ApiError } from "../utils/api-error.js";

async function ensurePatient(patientId, institution) {
  const exists = await Patient.findOne({ _id: patientId, institution, isArchived: false })
    .select("_id")
    .lean();
  if (!exists) throw new ApiError(404, "Patient was not found in your institution.");
}

function mapLab(doc) {
  return {
    id: doc._id,
    labCode: doc.labCode,
    testName: doc.testName,
    numericValue: doc.numericValue,
    resultText: doc.resultText,
    unit: doc.unit,
    referenceRangeLow: doc.referenceRangeLow,
    referenceRangeHigh: doc.referenceRangeHigh,
    collectedAt: doc.collectedAt,
    resultStatus: doc.resultStatus,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

export async function listLabResults(patientId, auth, limit = 100) {
  await ensurePatient(patientId, auth.institution);
  const rows = await PatientLabResult.find({ patientId, institution: auth.institution })
    .sort({ collectedAt: -1 })
    .limit(limit)
    .lean();
  return rows.map(mapLab);
}

export async function addLabResult(patientId, input, auth) {
  await ensurePatient(patientId, auth.institution);

  const id = randomUUID();
  const created = await PatientLabResult.create({
    _id: id,
    patientId,
    institution: auth.institution,
    labCode: input.labCode || null,
    testName: input.testName,
    numericValue: input.numericValue ?? null,
    resultText: input.resultText || null,
    unit: input.unit || null,
    referenceRangeLow: input.referenceRangeLow ?? null,
    referenceRangeHigh: input.referenceRangeHigh ?? null,
    collectedAt: input.collectedAt ? new Date(input.collectedAt) : new Date(),
    resultStatus: input.resultStatus || "FINAL",
    notes: input.notes || null,
    recordedBy: auth.sub,
  });

  // Audit metadata only; no result values or free-text notes are copied to the audit log.
  await PatientAuditLog.create({
    _id: randomUUID(),
    patientId,
    actorUserId: auth.sub,
    action: "LAB_RESULT_ADDED",
    entityType: "LAB_RESULT",
    entityId: id,
    changedFields: Object.keys(input).filter((key) => key !== "notes"),
  });

  return mapLab(created.toObject());
}
