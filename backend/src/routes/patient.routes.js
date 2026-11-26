import { Router } from 'express';
import { requireAuth, requireRole, requireInstitution } from '../middleware/auth.middleware.js';
import {
  listPatients, createPatient, getPatient, updatePatient,
  listMedicalHistory, addMedicalHistory, listComorbidities, addComorbidity,
  updateComorbidity, listVitals, addVitals, listSurgicalCases, addSurgicalCase,
  updateSurgicalCase,
} from '../controllers/patient.controller.js';
import { listPatientLabs, addPatientLab } from '../controllers/lab.controller.js';

const router = Router();
router.use(requireAuth, requireRole('CLINICIAN', 'SURGEON', 'ANESTHESIOLOGIST'), requireInstitution);

router.get('/', listPatients);
router.post('/', createPatient);
router.get('/:patientId', getPatient);
router.patch('/:patientId', updatePatient);
router.get('/:patientId/medical-history', listMedicalHistory);
router.post('/:patientId/medical-history', addMedicalHistory);
router.get('/:patientId/comorbidities', listComorbidities);
router.post('/:patientId/comorbidities', addComorbidity);
router.patch('/:patientId/comorbidities/:comorbidityId', updateComorbidity);
router.get('/:patientId/vitals', listVitals);
router.post('/:patientId/vitals', addVitals);
router.get('/:patientId/labs', listPatientLabs);
router.post('/:patientId/labs', addPatientLab);
router.get('/:patientId/surgical-cases', listSurgicalCases);
router.post('/:patientId/surgical-cases', addSurgicalCase);
router.patch('/:patientId/surgical-cases/:caseId', updateSurgicalCase);

export default router;
