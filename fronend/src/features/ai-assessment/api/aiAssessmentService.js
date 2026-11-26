import { api } from '@/services/api';
import { extractError } from '@/utils/extractError';

function unwrap(response) {
  return response?.data?.data ?? {};
}
async function request(work, fallback) {
  try { return await work(); }
  catch (error) { throw new Error(extractError(error, fallback)); }
}

export const aiAssessmentService = {
  getModels: () => request(async () => unwrap(await api.get('/ai/models')), 'Could not load AI model status.'),
  run: (patientId, caseId) => request(
    async () => unwrap(await api.post(`/ai/patients/${patientId}/surgical-cases/${caseId}/assessments`)),
    'Could not request an AI assessment.',
  ),
  list: (patientId, caseId) => request(
    async () => unwrap(await api.get(`/ai/patients/${patientId}/surgical-cases/${caseId}/assessments`)),
    'Could not load assessment history.',
  ),
  get: (assessmentId) => request(
    async () => unwrap(await api.get(`/ai/assessments/${assessmentId}`)),
    'Could not load this assessment.',
  ),
  listLabs: (patientId) => request(
    async () => unwrap(await api.get(`/patients/${patientId}/labs`)),
    'Could not load laboratory results.',
  ),
  addLab: (patientId, payload) => request(
    async () => unwrap(await api.post(`/patients/${patientId}/labs`, payload)),
    'Could not save the laboratory result.',
  ),
};
