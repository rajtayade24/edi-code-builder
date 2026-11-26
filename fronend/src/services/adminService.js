import { api } from "@/services/api";
import { extractError } from "@/utils/extractError";

function unwrap(response) {
  return response?.data?.data ?? {};
}

export async function getPendingClinicians() {
  try {
    const response = await api.get("/admin/clinicians/pending");
    return unwrap(response).clinicians ?? [];
  } catch (error) {
    throw new Error(extractError(error, "Could not load pending applications."));
  }
}

export async function getApprovedClinicians() {
  try {
    const response = await api.get("/admin/clinicians/approved");
    return unwrap(response).clinicians ?? [];
  } catch (error) {
    throw new Error(extractError(error, "Could not load approved clinicians."));
  }
}

export async function updateClinicianApproval(userId, status) {
  try {
    const response = await api.patch(`/admin/clinicians/${userId}/approval`, { status });
    return unwrap(response).clinician;
  } catch (error) {
    throw new Error(extractError(error, "Could not update the application."));
  }
}

export async function updateClinicianRole(userId, role) {
  try {
    const response = await api.patch(`/admin/clinicians/${userId}/role`, { role });
    return unwrap(response).clinician;
  } catch (error) {
    throw new Error(extractError(error, "Could not update the clinical role."));
  }
}
