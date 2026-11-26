import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const patientAuditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    actorUserId: { type: String, ref: "User", default: null },
    action: { type: String, required: true, maxlength: 80 },
    entityType: { type: String, required: true, maxlength: 40 },
    entityId: { type: String, default: null },
    changedFields: { type: [String], required: true, default: [] },
  },
  {
    collection: "patient_audit_logs",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

patientAuditLogSchema.index({ patientId: 1, createdAt: -1 });

export const PatientAuditLog =
  mongoose.models.PatientAuditLog || mongoose.model("PatientAuditLog", patientAuditLogSchema);
