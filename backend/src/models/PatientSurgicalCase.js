import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const surgicalCaseSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientId: { type: String, ref: "Patient", required: true },
    procedureName: { type: String, required: true, trim: true, maxlength: 200 },
    procedureCode: { type: String, default: null, trim: true, maxlength: 40 },
    specialty: { type: String, default: null, trim: true, maxlength: 120 },
    urgency: {
      type: String,
      required: true,
      default: "ELECTIVE",
      enum: ["ELECTIVE", "URGENT", "EMERGENCY"],
    },
    status: {
      type: String,
      required: true,
      default: "PLANNED",
      enum: ["PLANNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    },
    plannedAt: { type: Date, default: null },
    performedAt: { type: Date, default: null },
    asaClass: { type: Number, default: null, min: 1, max: 6 },
    anesthesiaType: { type: String, default: null, trim: true, maxlength: 100 },
    roomNumber: { type: String, default: null, trim: true, maxlength: 40 },
    surgeonUserId: { type: String, ref: "User", default: null },
    anesthesiologistUserId: { type: String, ref: "User", default: null },
    notes: { type: String, default: null, trim: true, maxlength: 5000 },
    createdBy: { type: String, ref: "User", required: true },
    updatedBy: { type: String, ref: "User", required: true },
  },
  {
    collection: "patient_surgical_cases",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

surgicalCaseSchema.index({ patientId: 1, plannedAt: -1, createdAt: -1 });

export const PatientSurgicalCase =
  mongoose.models.PatientSurgicalCase || mongoose.model("PatientSurgicalCase", surgicalCaseSchema);
