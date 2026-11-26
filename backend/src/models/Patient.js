import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const patientSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    patientNumber: { type: String, required: true, unique: true, maxlength: 40 },
    institution: { type: String, required: true, trim: true, maxlength: 160 },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    middleName: { type: String, default: null, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    dateOfBirth: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    sexAtBirth: {
      type: String,
      required: true,
      default: "UNKNOWN",
      enum: ["FEMALE", "MALE", "INTERSEX", "UNKNOWN"],
    },
    genderIdentity: { type: String, default: null, trim: true, maxlength: 80 },
    bloodGroup: {
      type: String,
      default: null,
      enum: [
        null,
        "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
        "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN",
      ],
    },
    mobile: { type: String, default: null, trim: true, maxlength: 20 },
    email: { type: String, default: null, lowercase: true, trim: true, maxlength: 254 },
    emergencyContactName: { type: String, default: null, trim: true, maxlength: 160 },
    emergencyContactMobile: { type: String, default: null, trim: true, maxlength: 20 },
    emergencyContactRelationship: { type: String, default: null, trim: true, maxlength: 80 },
    addressLine1: { type: String, default: null, trim: true, maxlength: 200 },
    addressLine2: { type: String, default: null, trim: true, maxlength: 200 },
    city: { type: String, default: null, trim: true, maxlength: 100 },
    state: { type: String, default: null, trim: true, maxlength: 100 },
    postalCode: { type: String, default: null, trim: true, maxlength: 20 },
    country: { type: String, default: "India", trim: true, maxlength: 80 },
    isArchived: { type: Boolean, required: true, default: false },
    createdBy: { type: String, ref: "User", required: true },
    updatedBy: { type: String, ref: "User", required: true },
  },
  {
    collection: "patients",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

patientSchema.index({ institution: 1, isArchived: 1, createdAt: -1 });

export const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);
