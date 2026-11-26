import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import * as labService from '../services/lab.service.js';
import { labResultSchema } from '../schemas/lab.schema.js';

const uuidSchema = z.uuid();
function parsePatientId(value) {
  if (!uuidSchema.safeParse(value).success) throw new ApiError(400, 'A valid patient ID is required.');
  return value;
}
function parseBody(value) {
  const parsed = labResultSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(400, 'Please check the submitted laboratory result.', parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'), message: issue.message,
    })));
  }
  return parsed.data;
}

export const listPatientLabs = asyncHandler(async (req, res) => {
  const patientId = parsePatientId(req.params.patientId);
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit || '100', 10) || 100));
  const items = await labService.listLabResults(patientId, req.auth, limit);
  return res.json({ success: true, data: { items } });
});

export const addPatientLab = asyncHandler(async (req, res) => {
  const patientId = parsePatientId(req.params.patientId);
  const input = parseBody(req.body);
  const item = await labService.addLabResult(patientId, input, req.auth);
  return res.status(201).json({ success: true, data: { item } });
});
