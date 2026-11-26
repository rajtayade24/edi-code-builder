import { randomBytes, randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { Patient } from "../models/Patient.js";
import { PatientMedicalHistory } from "../models/PatientMedicalHistory.js";
import { PatientComorbidity } from "../models/PatientComorbidity.js";
import { PatientVitals } from "../models/PatientVitals.js";
import { PatientSurgicalCase } from "../models/PatientSurgicalCase.js";
import { PatientAuditLog } from "../models/PatientAuditLog.js";
import { ApiError } from "../utils/api-error.js";

const clean = (value) => (value === "" || value === undefined ? null : value);

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
  if (!dateOfBirth) return null;
  const dob = new Date(`${normalizeDateOnly(dateOfBirth)}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function patientNumber() {
  const year = new Date().getFullYear();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `SR-${year}-${random}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function audit({ patientId, actorId, action, entityType = "PATIENT", entityId = patientId, changedFields = [] }) {
  await PatientAuditLog.create({
    _id: randomUUID(),
    patientId,
    actorUserId: actorId,
    action,
    entityType,
    entityId,
    changedFields,
  });
}

function mapPatient(doc) {
  const dateOfBirth = normalizeDateOnly(doc.dateOfBirth);
  return {
    id: doc._id,
    patientNumber: doc.patientNumber,
    institution: doc.institution,
    firstName: doc.firstName,
    middleName: doc.middleName,
    lastName: doc.lastName,
    dateOfBirth,
    age: calculateAge(dateOfBirth),
    sexAtBirth: doc.sexAtBirth,
    genderIdentity: doc.genderIdentity,
    bloodGroup: doc.bloodGroup,
    mobile: doc.mobile,
    email: doc.email,
    emergencyContactName: doc.emergencyContactName,
    emergencyContactMobile: doc.emergencyContactMobile,
    emergencyContactRelationship: doc.emergencyContactRelationship,
    addressLine1: doc.addressLine1,
    addressLine2: doc.addressLine2,
    city: doc.city,
    state: doc.state,
    postalCode: doc.postalCode,
    country: doc.country,
    isArchived: doc.isArchived,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapMedicalHistory(doc) {
  return {
    id: doc._id,
    category: doc.category,
    title: doc.title,
    description: doc.description,
    notedOn: doc.notedOn,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function mapComorbidity(doc) {
  return {
    id: doc._id,
    conditionName: doc.conditionName,
    conditionCode: doc.conditionCode,
    severity: doc.severity,
    status: doc.status,
    diagnosedOn: doc.diagnosedOn,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapVitals(doc) {
  return {
    id: doc._id,
    measuredAt: doc.measuredAt,
    systolicBp: doc.systolicBp,
    diastolicBp: doc.diastolicBp,
    heartRate: doc.heartRate,
    respiratoryRate: doc.respiratoryRate,
    temperatureC: doc.temperatureC,
    oxygenSaturation: doc.oxygenSaturation,
    weightKg: doc.weightKg,
    heightCm: doc.heightCm,
    bloodGlucoseMgDl: doc.bloodGlucoseMgDl,
    notes: doc.notes,
  };
}

function mapSurgicalCase(doc, userNamesById = new Map()) {
  return {
    id: doc._id,
    procedureName: doc.procedureName,
    procedureCode: doc.procedureCode,
    specialty: doc.specialty,
    urgency: doc.urgency,
    status: doc.status,
    plannedAt: doc.plannedAt,
    performedAt: doc.performedAt,
    asaClass: doc.asaClass,
    anesthesiaType: doc.anesthesiaType,
    roomNumber: doc.roomNumber,
    surgeonUserId: doc.surgeonUserId,
    anesthesiologistUserId: doc.anesthesiologistUserId,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    surgeonName: doc.surgeonUserId ? userNamesById.get(doc.surgeonUserId) || "" : "",
    anesthesiologistName: doc.anesthesiologistUserId ? userNamesById.get(doc.anesthesiologistUserId) || "" : "",
  };
}

async function resolveAssigneeNames(cases) {
  const userIds = [
    ...new Set(
      cases
        .flatMap((item) => [item.surgeonUserId, item.anesthesiologistUserId])
        .filter(Boolean)
    ),
  ];
  if (!userIds.length) return new Map();

  const users = await User.find({ _id: { $in: userIds } })
    .select("_id firstName lastName")
    .lean();

  return new Map(
    users.map((user) => [user._id, [user.firstName, user.lastName].filter(Boolean).join(" ")])
  );
}

async function findPatient(patientId, institution, { includeArchived = false } = {}) {
  const filter = { _id: patientId, institution };
  if (!includeArchived) filter.isArchived = false;
  const patient = await Patient.findOne(filter).lean();
  if (!patient) throw new ApiError(404, "Patient was not found in your institution.");
  return mapPatient(patient);
}

export async function listPatients({ institution, search = "", page = 1, limit = 10, includeArchived = false }) {
  const offset = (page - 1) * limit;
  const filter = { institution };
  if (!includeArchived) filter.isArchived = false;

  const trimmed = search.trim();
  if (trimmed) {
    const pattern = new RegExp(escapeRegex(trimmed), "i");
    filter.$or = [
      { patientNumber: pattern },
      { firstName: pattern },
      { middleName: pattern },
      { lastName: pattern },
      { mobile: pattern },
      { email: pattern },
    ];
  }

  const [items, total] = await Promise.all([
    Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => {
      const dateOfBirth = normalizeDateOnly(doc.dateOfBirth);
      return {
        id: doc._id,
        patientNumber: doc.patientNumber,
        firstName: doc.firstName,
        middleName: doc.middleName,
        lastName: doc.lastName,
        dateOfBirth,
        age: calculateAge(dateOfBirth),
        sexAtBirth: doc.sexAtBirth,
        mobile: doc.mobile,
        email: doc.email,
        bloodGroup: doc.bloodGroup,
        createdAt: doc.createdAt,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createPatient(input, auth) {
  const id = randomUUID();
  const number = patientNumber();
  const created = await Patient.create({
    _id: id,
    patientNumber: number,
    institution: auth.institution,
    firstName: input.firstName.trim(),
    middleName: clean(input.middleName),
    lastName: input.lastName.trim(),
    dateOfBirth: input.dateOfBirth,
    sexAtBirth: input.sexAtBirth,
    genderIdentity: clean(input.genderIdentity),
    bloodGroup: clean(input.bloodGroup),
    mobile: clean(input.mobile),
    email: clean(input.email)?.toLowerCase() || null,
    emergencyContactName: clean(input.emergencyContactName),
    emergencyContactMobile: clean(input.emergencyContactMobile),
    emergencyContactRelationship: clean(input.emergencyContactRelationship),
    addressLine1: clean(input.addressLine1),
    addressLine2: clean(input.addressLine2),
    city: clean(input.city),
    state: clean(input.state),
    postalCode: clean(input.postalCode),
    country: clean(input.country) || "India",
    createdBy: auth.sub,
    updatedBy: auth.sub,
  });

  await audit({
    patientId: id,
    actorId: auth.sub,
    action: "PATIENT_CREATED",
    changedFields: Object.keys(input),
  });

  return mapPatient(created.toObject());
}

const editablePatientFields = new Set([
  "firstName", "middleName", "lastName", "dateOfBirth", "sexAtBirth",
  "genderIdentity", "bloodGroup", "mobile", "email", "emergencyContactName",
  "emergencyContactMobile", "emergencyContactRelationship", "addressLine1",
  "addressLine2", "city", "state", "postalCode", "country",
]);

export async function updatePatient(patientId, input, auth) {
  await findPatient(patientId, auth.institution);
  const fields = Object.entries(input).filter(([key]) => editablePatientFields.has(key));
  if (!fields.length) throw new ApiError(400, "No editable patient fields were supplied.");

  const updates = { updatedBy: auth.sub };
  for (const [key, value] of fields) {
    if (key === "country") updates[key] = clean(value) || "India";
    else if (key === "email") updates[key] = clean(value)?.toLowerCase() || null;
    else updates[key] = clean(value);
  }

  const updated = await Patient.findOneAndUpdate(
    { _id: patientId, institution: auth.institution, isArchived: false },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(404, "Patient was not found in your institution.");

  await audit({
    patientId,
    actorId: auth.sub,
    action: "PATIENT_UPDATED",
    changedFields: fields.map(([key]) => key),
  });

  return mapPatient(updated);
}

export async function getPatientProfile(patientId, auth) {
  const patient = await findPatient(patientId, auth.institution);
  const [history, comorbidities, vitals, surgicalCases] = await Promise.all([
    PatientMedicalHistory.find({ patientId }).sort({ createdAt: -1 }).limit(100).lean(),
    PatientComorbidity.find({ patientId }).sort({ createdAt: -1 }).lean(),
    PatientVitals.find({ patientId }).sort({ measuredAt: -1 }).limit(20).lean(),
    PatientSurgicalCase.find({ patientId }).sort({ plannedAt: -1, createdAt: -1 }).lean(),
  ]);

  const userNames = await resolveAssigneeNames(surgicalCases);
  await audit({
    patientId,
    actorId: auth.sub,
    action: "PATIENT_VIEWED",
    changedFields: [],
  });

  return {
    patient,
    medicalHistory: history.map(mapMedicalHistory),
    comorbidities: comorbidities.map(mapComorbidity),
    vitals: vitals.map(mapVitals),
    surgicalCases: surgicalCases.map((doc) => mapSurgicalCase(doc, userNames)),
  };
}

export async function addMedicalHistory(patientId, input, auth) {
  await findPatient(patientId, auth.institution);
  const id = randomUUID();
  const created = await PatientMedicalHistory.create({
    _id: id,
    patientId,
    category: input.category,
    title: input.title,
    description: clean(input.description),
    notedOn: clean(input.notedOn),
    status: input.status || "ACTIVE",
    createdBy: auth.sub,
  });

  await audit({
    patientId,
    actorId: auth.sub,
    action: "MEDICAL_HISTORY_ADDED",
    entityType: "MEDICAL_HISTORY",
    entityId: id,
    changedFields: Object.keys(input),
  });

  return mapMedicalHistory(created.toObject());
}

export async function addComorbidity(patientId, input, auth) {
  await findPatient(patientId, auth.institution);
  const id = randomUUID();
  const created = await PatientComorbidity.create({
    _id: id,
    patientId,
    conditionName: input.conditionName,
    conditionCode: clean(input.conditionCode),
    severity: input.severity || "UNKNOWN",
    status: input.status || "ACTIVE",
    diagnosedOn: clean(input.diagnosedOn),
    notes: clean(input.notes),
    createdBy: auth.sub,
    updatedBy: auth.sub,
  });

  await audit({
    patientId,
    actorId: auth.sub,
    action: "COMORBIDITY_ADDED",
    entityType: "COMORBIDITY",
    entityId: id,
    changedFields: Object.keys(input),
  });

  return mapComorbidity(created.toObject());
}

export async function updateComorbidity(patientId, comorbidityId, input, auth) {
  await findPatient(patientId, auth.institution);
  const editable = new Set(["severity", "status", "diagnosedOn", "notes"]);
  const fields = Object.entries(input).filter(([key]) => editable.has(key));
  if (!fields.length) throw new ApiError(400, "No editable comorbidity fields were supplied.");

  const updates = { updatedBy: auth.sub };
  for (const [key, value] of fields) updates[key] = clean(value);

  const updated = await PatientComorbidity.findOneAndUpdate(
    { _id: comorbidityId, patientId },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(404, "Comorbidity was not found for this patient.");

  await audit({
    patientId,
    actorId: auth.sub,
    action: "COMORBIDITY_UPDATED",
    entityType: "COMORBIDITY",
    entityId: comorbidityId,
    changedFields: fields.map(([key]) => key),
  });

  return mapComorbidity(updated);
}

export async function addVitals(patientId, input, auth) {
  await findPatient(patientId, auth.institution);
  const id = randomUUID();
  const created = await PatientVitals.create({
    _id: id,
    patientId,
    measuredAt: clean(input.measuredAt) ? new Date(input.measuredAt) : new Date(),
    systolicBp: input.systolicBp ?? null,
    diastolicBp: input.diastolicBp ?? null,
    heartRate: input.heartRate ?? null,
    respiratoryRate: input.respiratoryRate ?? null,
    temperatureC: input.temperatureC ?? null,
    oxygenSaturation: input.oxygenSaturation ?? null,
    weightKg: input.weightKg ?? null,
    heightCm: input.heightCm ?? null,
    bloodGlucoseMgDl: input.bloodGlucoseMgDl ?? null,
    notes: clean(input.notes),
    recordedBy: auth.sub,
  });

  await audit({
    patientId,
    actorId: auth.sub,
    action: "VITALS_RECORDED",
    entityType: "VITALS",
    entityId: id,
    changedFields: Object.keys(input).filter((key) => key !== "notes"),
  });

  return mapVitals(created.toObject());
}

async function verifyClinicalAssignee(userId, institution, role) {
  if (!userId) return null;
  const assignee = await User.findOne({
    _id: userId,
    institution,
    accountStatus: "APPROVED",
    isActive: true,
    role,
  })
    .select("_id")
    .lean();

  if (!assignee) {
    throw new ApiError(400, `Selected ${role.toLowerCase()} is not an active approved user in your institution.`);
  }
  return userId;
}

export async function addSurgicalCase(patientId, input, auth) {
  await findPatient(patientId, auth.institution);
  await verifyClinicalAssignee(clean(input.surgeonUserId), auth.institution, "SURGEON");
  await verifyClinicalAssignee(clean(input.anesthesiologistUserId), auth.institution, "ANESTHESIOLOGIST");

  const id = randomUUID();
  const created = await PatientSurgicalCase.create({
    _id: id,
    patientId,
    procedureName: input.procedureName,
    procedureCode: clean(input.procedureCode),
    specialty: clean(input.specialty),
    urgency: input.urgency || "ELECTIVE",
    status: input.status || "PLANNED",
    plannedAt: clean(input.plannedAt) ? new Date(input.plannedAt) : null,
    performedAt: clean(input.performedAt) ? new Date(input.performedAt) : null,
    asaClass: input.asaClass ?? null,
    anesthesiaType: clean(input.anesthesiaType),
    roomNumber: clean(input.roomNumber),
    surgeonUserId: clean(input.surgeonUserId),
    anesthesiologistUserId: clean(input.anesthesiologistUserId),
    notes: clean(input.notes),
    createdBy: auth.sub,
    updatedBy: auth.sub,
  });

  await audit({
    patientId,
    actorId: auth.sub,
    action: "SURGICAL_CASE_CREATED",
    entityType: "SURGICAL_CASE",
    entityId: id,
    changedFields: Object.keys(input),
  });

  const obj = created.toObject();
  const userNames = await resolveAssigneeNames([obj]);
  return mapSurgicalCase(obj, userNames);
}

export async function updateSurgicalCase(patientId, caseId, input, auth) {
  await findPatient(patientId, auth.institution);
  if (input.surgeonUserId !== undefined) {
    await verifyClinicalAssignee(clean(input.surgeonUserId), auth.institution, "SURGEON");
  }
  if (input.anesthesiologistUserId !== undefined) {
    await verifyClinicalAssignee(clean(input.anesthesiologistUserId), auth.institution, "ANESTHESIOLOGIST");
  }

  const editable = new Set([
    "procedureName", "procedureCode", "specialty", "urgency", "status",
    "plannedAt", "performedAt", "asaClass", "anesthesiaType", "roomNumber",
    "surgeonUserId", "anesthesiologistUserId", "notes",
  ]);
  const fields = Object.entries(input).filter(([key]) => editable.has(key));
  if (!fields.length) throw new ApiError(400, "No editable surgical-case fields were supplied.");

  const updates = { updatedBy: auth.sub };
  for (const [key, value] of fields) {
    if (key === "plannedAt" || key === "performedAt") {
      updates[key] = clean(value) ? new Date(value) : null;
    } else {
      updates[key] = clean(value);
    }
  }

  const updated = await PatientSurgicalCase.findOneAndUpdate(
    { _id: caseId, patientId },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(404, "Surgical case was not found for this patient.");

  await audit({
    patientId,
    actorId: auth.sub,
    action: "SURGICAL_CASE_UPDATED",
    entityType: "SURGICAL_CASE",
    entityId: caseId,
    changedFields: fields.map(([key]) => key),
  });

  const userNames = await resolveAssigneeNames([updated]);
  return mapSurgicalCase(updated, userNames);
}

export async function listMedicalHistory(patientId, auth) {
  await findPatient(patientId, auth.institution);
  const rows = await PatientMedicalHistory.find({ patientId }).sort({ createdAt: -1 }).limit(200).lean();
  return rows.map(mapMedicalHistory);
}

export async function listComorbidities(patientId, auth) {
  await findPatient(patientId, auth.institution);
  const rows = await PatientComorbidity.find({ patientId }).sort({ createdAt: -1 }).lean();
  return rows.map(mapComorbidity);
}

export async function listVitals(patientId, auth, limit = 50) {
  await findPatient(patientId, auth.institution);
  const rows = await PatientVitals.find({ patientId }).sort({ measuredAt: -1 }).limit(limit).lean();
  return rows.map(mapVitals);
}

export async function listSurgicalCases(patientId, auth) {
  await findPatient(patientId, auth.institution);
  const rows = await PatientSurgicalCase.find({ patientId }).sort({ plannedAt: -1, createdAt: -1 }).lean();
  const userNames = await resolveAssigneeNames(rows);
  return rows.map((doc) => mapSurgicalCase(doc, userNames));
}
