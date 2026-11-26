import { Router } from 'express';
import { requireAuth, requireRole, requireInstitution } from '../middleware/auth.middleware.js';
import { getModels, createAssessment, listAssessments, getAssessment } from '../controllers/ai.controller.js';

const router = Router();
router.use(requireAuth, requireRole('CLINICIAN', 'SURGEON', 'ANESTHESIOLOGIST'), requireInstitution);
router.get('/models', getModels);
router.post('/patients/:patientId/surgical-cases/:caseId/assessments', createAssessment);
router.get('/patients/:patientId/surgical-cases/:caseId/assessments', listAssessments);
router.get('/assessments/:assessmentId', getAssessment);
export default router;
