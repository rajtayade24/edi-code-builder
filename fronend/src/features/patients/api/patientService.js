import { api } from "@/services/api";
import { extractError } from "@/utils/extractError";

function unwrap(response) {
  return response?.data?.data ?? {};
}

async function request(work, fallback) {
  try {
    return await work();
  } catch (error) {
    throw new Error(extractError(error, fallback));
  }
}

export const patientService = {
  list: (params = {}) => request(
    async () => unwrap(await api.get("/patients", { params })),
    "Could not load patients."
  ),
  get: (patientId) => request(
    async () => unwrap(await api.get(`/patients/${patientId}`)),
    "Could not load this patient."
  ),
  create: (payload) => request(
    async () => unwrap(await api.post("/patients", payload)),
    "Could not register the patient."
  ),
  update: (patientId, payload) => request(
    async () => unwrap(await api.patch(`/patients/${patientId}`, payload)),
    "Could not update the patient."
  ),
  addMedicalHistory: (patientId, payload) => request(
    async () => unwrap(await api.post(`/patients/${patientId}/medical-history`, payload)),
    "Could not add medical history."
  ),
  addComorbidity: (patientId, payload) => request(
    async () => unwrap(await api.post(`/patients/${patientId}/comorbidities`, payload)),
    "Could not add the comorbidity."
  ),
  updateComorbidity: (patientId, comorbidityId, payload) => request(
    async () => unwrap(await api.patch(`/patients/${patientId}/comorbidities/${comorbidityId}`, payload)),
    "Could not update the comorbidity."
  ),
  addVitals: (patientId, payload) => request(
    async () => unwrap(await api.post(`/patients/${patientId}/vitals`, payload)),
    "Could not save vital signs."
  ),
  addSurgicalCase: (patientId, payload) => request(
    async () => unwrap(await api.post(`/patients/${patientId}/surgical-cases`, payload)),
    "Could not create the surgical case."
  ),
  updateSurgicalCase: (patientId, caseId, payload) => request(
    async () => unwrap(await api.patch(`/patients/${patientId}/surgical-cases/${caseId}`, payload)),
    "Could not update the surgical case."
  ),
};
