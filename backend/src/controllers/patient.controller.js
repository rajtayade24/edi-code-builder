import { z } from "zod";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as patientService from "../services/patient.service.js";
import {
  patientCreateSchema,
  patientUpdateSchema,
  medicalHistorySchema,
  comorbiditySchema,
  comorbidityUpdateSchema,
  vitalsSchema,
  surgicalCaseSchema,
  surgicalCaseUpdateSchema,
} from "../schemas/patient.schema.js";

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, "Please check the submitted fields.", result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })));
  }
  return result.data;
}

const idSchema = z.uuid();
function parseId(value, label = "patient ID") {
  const result = idSchema.safeParse(value);
  if (!result.success) throw new ApiError(400, `A valid ${label} is required.`);
  return result.data;
}

function send(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export const listPatients = asyncHandler(async (req, res) => {
  const page = Math.max(1, Math.min(10_000, Number.parseInt(req.query.page || "1", 10) || 1));
  const limit = Math.max(1, Math.min(50, Number.parseInt(req.query.limit || "10", 10) || 10));
  const search = typeof req.query.search === "string" ? req.query.search.slice(0, 100) : "";
  const includeArchived = req.query.archived === "true";
  const result = await patientService.listPatients({ institution: req.auth.institution, search, page, limit, includeArchived });
  return send(res, result);
});

export const createPatient = asyncHandler(async (req, res) => {
  const input = parse(patientCreateSchema, req.body);
  const patient = await patientService.createPatient(input, req.auth);
  return send(res, { patient }, 201);
});

export const getPatient = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const profile = await patientService.getPatientProfile(patientId, req.auth);
  return send(res, profile);
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const input = parse(patientUpdateSchema, req.body);
  const patient = await patientService.updatePatient(patientId, input, req.auth);
  return send(res, { patient });
});

export const listMedicalHistory = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const items = await patientService.listMedicalHistory(patientId, req.auth);
  return send(res, { items });
});

export const addMedicalHistory = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const input = parse(medicalHistorySchema, req.body);
  const item = await patientService.addMedicalHistory(patientId, input, req.auth);
  return send(res, { item }, 201);
});

export const listComorbidities = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const items = await patientService.listComorbidities(patientId, req.auth);
  return send(res, { items });
});

export const addComorbidity = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const input = parse(comorbiditySchema, req.body);
  const item = await patientService.addComorbidity(patientId, input, req.auth);
  return send(res, { item }, 201);
});

export const updateComorbidity = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const comorbidityId = parseId(req.params.comorbidityId, "comorbidity ID");
  const input = parse(comorbidityUpdateSchema, req.body);
  const item = await patientService.updateComorbidity(patientId, comorbidityId, input, req.auth);
  return send(res, { item });
});

export const listVitals = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit || "50", 10) || 50));
  const items = await patientService.listVitals(patientId, req.auth, limit);
  return send(res, { items });
});

export const addVitals = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const input = parse(vitalsSchema, req.body);
  const item = await patientService.addVitals(patientId, input, req.auth);
  return send(res, { item }, 201);
});

export const listSurgicalCases = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const items = await patientService.listSurgicalCases(patientId, req.auth);
  return send(res, { items });
});

export const addSurgicalCase = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const input = parse(surgicalCaseSchema, req.body);
  const item = await patientService.addSurgicalCase(patientId, input, req.auth);
  return send(res, { item }, 201);
});

export const updateSurgicalCase = asyncHandler(async (req, res) => {
  const patientId = parseId(req.params.patientId);
  const caseId = parseId(req.params.caseId, "surgical case ID");
  const input = parse(surgicalCaseUpdateSchema, req.body);
  const item = await patientService.updateSurgicalCase(patientId, caseId, input, req.auth);
  return send(res, { item });
});
