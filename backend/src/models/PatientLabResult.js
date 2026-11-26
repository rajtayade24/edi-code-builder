import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const labResultSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    institution: { type: String, required: true, trim: true, maxlength: 160 },
    labCode: { type: String, default: null, trim: true, maxlength: 60 },
    testName: { type: String, required: true, trim: true, maxlength: 180 },
    numericValue: { type: Number, default: null },
    resultText: { type: String, default: null, trim: true, maxlength: 2000 },
    unit: { type: String, default: null, trim: true, maxlength: 50 },
    referenceRangeLow: { type: Number, default: null },
    referenceRangeHigh: { type: Number, default: null },
    collectedAt: { type: Date, required: true, default: () => new Date() },
    resultStatus: {
      type: String,
      required: true,
      default: "FINAL",
      enum: ["PRELIMINARY", "FINAL", "CORRECTED", "CANCELLED"],
    },
    notes: { type: String, default: null, trim: true, maxlength: 3000 },
    recordedBy: { type: String, ref: "User", required: true },
  },
  {
    collection: "patient_lab_results",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

labResultSchema.index({ patientId: 1, collectedAt: -1 });
labResultSchema.index({ institution: 1, collectedAt: -1 });
labResultSchema.index({ patientId: 1, labCode: 1, collectedAt: -1 });

export const PatientLabResult =
  mongoose.models.PatientLabResult || mongoose.model("PatientLabResult", labResultSchema);
