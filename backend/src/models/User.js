import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    middleName: { type: String, default: null, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    mobile: { type: String, required: true, unique: true, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      default: "CLINICIAN",
      enum: ["CLINICIAN", "SURGEON", "ANESTHESIOLOGIST", "ADMIN"],
    },
    institution: { type: String, default: null, trim: true, maxlength: 160 },
    licenseNumber: { type: String, default: null, trim: true, maxlength: 80 },
    isActive: { type: Boolean, required: true, default: true },
    accountStatus: {
      type: String,
      required: true,
      default: "APPROVED",
      enum: ["PENDING", "APPROVED", "REJECTED"],
    },
    emailVerifiedAt: { type: Date, default: null },
    mobileVerifiedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, ref: "User", default: null },
    lastLoginAt: { type: Date, default: null },
  },
  {
    collection: "users",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
