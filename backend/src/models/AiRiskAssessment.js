import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const aiRiskAssessmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    surgicalCaseId: { type: String, ref: "PatientSurgicalCase", required: true },
    institution: { type: String, required: true, trim: true, maxlength: 160 },
    requestedBy: { type: String, ref: "User", required: true },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "COMPLETED", "UNAVAILABLE", "FAILED"],
    },
    outcomeCode: { type: String, required: true, default: "30_DAY_MORTALITY", maxlength: 60 },
    inputFingerprint: { type: String, required: true, maxlength: 64 },
    modelManifestVersion: { type: String, default: null, maxlength: 80 },
    resultJson: { type: mongoose.Schema.Types.Mixed, default: null },
    modelStatusJson: { type: [mongoose.Schema.Types.Mixed], required: true, default: [] },
    errorCode: { type: String, default: null, maxlength: 80 },
    completedAt: { type: Date, default: null },
  },
  {
    collection: "ai_risk_assessments",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

aiRiskAssessmentSchema.index({ patientId: 1, createdAt: -1 });
aiRiskAssessmentSchema.index({ surgicalCaseId: 1, createdAt: -1 });
aiRiskAssessmentSchema.index({ institution: 1, createdAt: -1 });

export const AiRiskAssessment =
  mongoose.models.AiRiskAssessment || mongoose.model("AiRiskAssessment", aiRiskAssessmentSchema);
