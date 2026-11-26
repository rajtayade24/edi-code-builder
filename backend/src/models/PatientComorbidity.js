import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const comorbiditySchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    conditionName: { type: String, required: true, trim: true, maxlength: 160 },
    conditionCode: { type: String, default: null, trim: true, maxlength: 40 },
    severity: {
      type: String,
      required: true,
      default: "UNKNOWN",
      enum: ["MILD", "MODERATE", "SEVERE", "UNKNOWN"],
    },
    status: {
      type: String,
      required: true,
      default: "ACTIVE",
      enum: ["ACTIVE", "RESOLVED"],
    },
    diagnosedOn: { type: String, default: null },
    notes: { type: String, default: null, trim: true, maxlength: 3000 },
    createdBy: { type: String, ref: "User", required: true },
    updatedBy: { type: String, ref: "User", required: true },
  },
  {
    collection: "patient_comorbidities",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

comorbiditySchema.index({ patientId: 1, createdAt: -1 });

export const PatientComorbidity =
  mongoose.models.PatientComorbidity || mongoose.model("PatientComorbidity", comorbiditySchema);
