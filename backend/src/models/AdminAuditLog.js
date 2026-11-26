import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const adminAuditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    actorUserId: { type: String, ref: "User", default: null },
    subjectUserId: { type: String, ref: "User", default: null },
    action: { type: String, required: true, maxlength: 80 },
    previousValues: { type: mongoose.Schema.Types.Mixed, default: null },
    newValues: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    collection: "admin_audit_logs",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

adminAuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
adminAuditLogSchema.index({ subjectUserId: 1, createdAt: -1 });

export const AdminAuditLog = mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);
