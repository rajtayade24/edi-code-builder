import { z } from "zod";

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal(""));
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Enter a valid date.");
const optionalDate = dateOnly.optional().or(z.literal(""));
const dateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");
const optionalDateTime = dateTime.optional().or(z.literal(""));
const optionalNumber = (min, max) => z.number().finite().min(min).max(max).optional().nullable();
const optionalInteger = (min, max) => z.number().int().min(min).max(max).optional().nullable();

export const patientCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: optionalText(80),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: dateOnly.refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), "Date of birth cannot be in the future."),
  sexAtBirth: z.enum(["FEMALE", "MALE", "INTERSEX", "UNKNOWN"]),
  genderIdentity: optionalText(80),
  bloodGroup: z.enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"]).optional().or(z.literal("")),
  mobile: optionalText(20),
  email: z.union([z.email(), z.literal("")]).optional(),
  emergencyContactName: optionalText(160),
  emergencyContactMobile: optionalText(20),
  emergencyContactRelationship: optionalText(80),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  postalCode: optionalText(20),
  country: optionalText(80),
});

export const patientUpdateSchema = patientCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update."
);

export const medicalHistorySchema = z.object({
  category: z.enum(["MEDICAL", "SURGICAL", "FAMILY", "SOCIAL", "ALLERGY", "MEDICATION", "OTHER"]),
  title: z.string().trim().min(1).max(160),
  description: optionalText(5000),
  notedOn: optionalDate,
  status: z.enum(["ACTIVE", "RESOLVED", "INACTIVE"]).optional(),
});

export const comorbiditySchema = z.object({
  conditionName: z.string().trim().min(1).max(160),
  conditionCode: optionalText(40),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "UNKNOWN"]).optional(),
  status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
  diagnosedOn: optionalDate,
  notes: optionalText(3000),
});

export const comorbidityUpdateSchema = z.object({
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "UNKNOWN"]).optional(),
  status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
  diagnosedOn: optionalDate,
  notes: optionalText(3000),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export const vitalsSchema = z.object({
  measuredAt: optionalDateTime,
  systolicBp: optionalInteger(40, 300),
  diastolicBp: optionalInteger(20, 200),
  heartRate: optionalInteger(20, 250),
  respiratoryRate: optionalInteger(4, 80),
  temperatureC: optionalNumber(25, 45),
  oxygenSaturation: optionalNumber(0, 100),
  weightKg: optionalNumber(0.5, 500),
  heightCm: optionalNumber(20, 250),
  bloodGlucoseMgDl: optionalNumber(1, 2000),
  notes: optionalText(2000),
}).refine((value) => [
  "systolicBp", "diastolicBp", "heartRate", "respiratoryRate", "temperatureC",
  "oxygenSaturation", "weightKg", "heightCm", "bloodGlucoseMgDl",
].some((key) => value[key] !== undefined && value[key] !== null), "Enter at least one vital measurement.");

export const surgicalCaseSchema = z.object({
  procedureName: z.string().trim().min(1).max(200),
  procedureCode: optionalText(40),
  specialty: optionalText(120),
  urgency: z.enum(["ELECTIVE", "URGENT", "EMERGENCY"]).optional(),
  status: z.enum(["PLANNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  plannedAt: optionalDateTime,
  performedAt: optionalDateTime,
  asaClass: z.number().int().min(1).max(6).optional().nullable(),
  anesthesiaType: optionalText(100),
  roomNumber: optionalText(40),
  surgeonUserId: z.uuid().optional().or(z.literal("")),
  anesthesiologistUserId: z.uuid().optional().or(z.literal("")),
  notes: optionalText(5000),
});

export const surgicalCaseUpdateSchema = surgicalCaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one field to update."
);
