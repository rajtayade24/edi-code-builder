import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const pendingSignupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    middleName: { type: String, default: null, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    mobile: { type: String, required: true, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: "CLINICIAN", enum: ["CLINICIAN"] },
    institution: { type: String, default: null, trim: true, maxlength: 160 },
    licenseNumber: { type: String, default: null, trim: true, maxlength: 80 },
    emailOtpHash: { type: String, required: true },
    mobileOtpHash: { type: String, required: true },
    attemptCount: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
    resendAfter: { type: Date, required: true },
  },
  {
    collection: "pending_signups",
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

pendingSignupSchema.index({ email: 1 });
pendingSignupSchema.index({ mobile: 1 });
pendingSignupSchema.index({ expiresAt: 1 });

export const PendingSignup = mongoose.models.PendingSignup || mongoose.model("PendingSignup", pendingSignupSchema);
