import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const medicalHistorySchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    category: {
      type: String,
      required: true,
      enum: ["MEDICAL", "SURGICAL", "FAMILY", "SOCIAL", "ALLERGY", "MEDICATION", "OTHER"],
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: null, trim: true, maxlength: 5000 },
    notedOn: { type: String, default: null },
    status: {
      type: String,
      required: true,
      default: "ACTIVE",
      enum: ["ACTIVE", "RESOLVED", "INACTIVE"],
    },
    createdBy: { type: String, ref: "User", required: true },
  },
  {
    collection: "patient_medical_history",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

medicalHistorySchema.index({ patientId: 1, createdAt: -1 });

export const PatientMedicalHistory =
  mongoose.models.PatientMedicalHistory || mongoose.model("PatientMedicalHistory", medicalHistorySchema);
