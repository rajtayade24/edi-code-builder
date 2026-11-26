import { z } from 'zod';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as assessmentService from '../services/ai-assessment.service.js';

const uuid = z.uuid();
function parseUuid(value, label) {
  if (!uuid.safeParse(value).success) throw new ApiError(400, `A valid ${label} is required.`);
  return value;
}

export const getModels = asyncHandler(async (req, res) => {
  const result = await assessmentService.getModelStatuses();
  return res.json({ success: true, data: result });
});

export const createAssessment = asyncHandler(async (req, res) => {
  const patientId = parseUuid(req.params.patientId, 'patient ID');
  const caseId = parseUuid(req.params.caseId, 'surgical case ID');
  const assessment = await assessmentService.createRiskAssessment(patientId, caseId, req.auth);
  return res.status(201).json({ success: true, data: { assessment } });
});

export const listAssessments = asyncHandler(async (req, res) => {
  const patientId = parseUuid(req.params.patientId, 'patient ID');
  const caseId = parseUuid(req.params.caseId, 'surgical case ID');
  const items = await assessmentService.listRiskAssessments(patientId, caseId, req.auth);
  return res.json({ success: true, data: { items } });
});

export const getAssessment = asyncHandler(async (req, res) => {
  const assessmentId = parseUuid(req.params.assessmentId, 'assessment ID');
  const assessment = await assessmentService.getRiskAssessment(assessmentId, req.auth);
  return res.json({ success: true, data: { assessment } });
});
