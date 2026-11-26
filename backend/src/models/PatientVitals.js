import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const vitalsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    measuredAt: { type: Date, required: true, default: () => new Date() },
    systolicBp: { type: Number, default: null, min: 40, max: 300 },
    diastolicBp: { type: Number, default: null, min: 20, max: 200 },
    heartRate: { type: Number, default: null, min: 20, max: 250 },
    respiratoryRate: { type: Number, default: null, min: 4, max: 80 },
    temperatureC: { type: Number, default: null, min: 25, max: 45 },
    oxygenSaturation: { type: Number, default: null, min: 0, max: 100 },
    weightKg: { type: Number, default: null, min: 0.5, max: 500 },
    heightCm: { type: Number, default: null, min: 20, max: 250 },
    bloodGlucoseMgDl: { type: Number, default: null, min: 1, max: 2000 },
    notes: { type: String, default: null, trim: true, maxlength: 2000 },
    recordedBy: { type: String, ref: "User", required: true },
  },
  {
    collection: "patient_vitals",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

vitalsSchema.index({ patientId: 1, measuredAt: -1 });

export const PatientVitals = mongoose.models.PatientVitals || mongoose.model("PatientVitals", vitalsSchema);
