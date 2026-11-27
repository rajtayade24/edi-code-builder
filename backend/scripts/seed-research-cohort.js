import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { connectDb, disconnectDb } from "../src/config/db.js";
import {
  Patient,
  PatientComorbidity,
  PatientLabResult,
  PatientMedicalHistory,
  PatientSurgicalCase,
  PatientVitals,
  User,
} from "../src/models/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SEED_PATH = path.resolve(__dirname, "../data/mederi-cardiac-seed.json");

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

const seedPath = readArg("--file") || DEFAULT_SEED_PATH;
const ownerEmailArg = readArg("--owner-email")?.trim().toLowerCase() || null;

if (!fs.existsSync(seedPath)) {
  console.error(`Seed file not found: ${seedPath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
const records = Array.isArray(payload.patients) ? payload.patients : [];

try {
  await connectDb();
  const owner = ownerEmailArg
    ? await User.findOne({ email: ownerEmailArg }).select("_id email institution").lean()
    : await User.findOne({ accountStatus: "APPROVED" }).sort({ createdAt: 1 }).select("_id email institution").lean();

  if (!owner) {
    console.error("No approved user found in MongoDB. Register or approve a clinician/admin account first.");
    process.exit(1);
  }

  let createdPatients = 0;
  let skippedExisting = 0;

  for (const item of records) {
    const existing = await Patient.findOne({ patientNumber: item.patientNumber }).select("_id").lean();
    if (existing) {
      skippedExisting += 1;
      continue;
    }

    const patientId = randomUUID();
    await Patient.create({
      _id: patientId,
      patientNumber: item.patientNumber,
      institution: owner.institution,
      firstName: item.firstName,
      lastName: item.lastName,
      dateOfBirth: item.dateOfBirth,
      sexAtBirth: item.sexAtBirth || "UNKNOWN",
      country: item.country || "Colombia",
      city: item.city || null,
      createdBy: owner._id,
      updatedBy: owner._id,
    });

    if (item.surgicalCase) {
      await PatientSurgicalCase.create({
        _id: randomUUID(),
        patientId,
        procedureName: item.surgicalCase.procedureName,
        procedureCode: item.surgicalCase.procedureCode,
        specialty: item.surgicalCase.specialty,
        urgency: item.surgicalCase.urgency,
        status: item.surgicalCase.status || "PLANNED",
        plannedAt: item.surgicalCase.plannedAt ? new Date(item.surgicalCase.plannedAt) : null,
        anesthesiaType: item.surgicalCase.anesthesiaType || null,
        notes: item.surgicalCase.notes || null,
        createdBy: owner._id,
        updatedBy: owner._id,
      });
    }

    if (item.vitals && (item.vitals.weightKg || item.vitals.heightCm)) {
      await PatientVitals.create({
        _id: randomUUID(),
        patientId,
        weightKg: item.vitals.weightKg ?? null,
        heightCm: item.vitals.heightCm ?? null,
        notes: item.vitals.notes || null,
        recordedBy: owner._id,
      });
    }

    if (Array.isArray(item.comorbidities) && item.comorbidities.length > 0) {
      await PatientComorbidity.insertMany(
        item.comorbidities.map((c) => ({
          _id: randomUUID(),
          patientId,
          conditionName: c.conditionName,
          conditionCode: c.conditionCode || null,
          severity: c.severity || "UNKNOWN",
          status: c.status || "ACTIVE",
          createdBy: owner._id,
          updatedBy: owner._id,
        }))
      );
    }

    if (Array.isArray(item.labs) && item.labs.length > 0) {
      await PatientLabResult.insertMany(
        item.labs.map((l) => ({
          _id: randomUUID(),
          patientId,
          institution: owner.institution,
          labCode: l.labCode,
          testName: l.testName,
          numericValue: l.numericValue,
          unit: l.unit || null,
          resultStatus: l.resultStatus || "FINAL",
          recordedBy: owner._id,
        }))
      );
    }

    if (item.history) {
      await PatientMedicalHistory.create({
        _id: randomUUID(),
        patientId,
        category: item.history.category || "OTHER",
        title: item.history.title,
        description: item.history.description || null,
        status: item.history.status || "ACTIVE",
        createdBy: owner._id,
      });
    }

    createdPatients += 1;
  }

  console.info(
    `Mederi cardiac research cohort seed complete for institution="${owner.institution}" (${owner.email}): created=${createdPatients}, skippedExisting=${skippedExisting}.`
  );
} catch (error) {
  console.error("Failed to seed cardiac research cohort:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
