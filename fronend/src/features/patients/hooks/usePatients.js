import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientService } from "../api/patientService";

export const patientKeys = {
  all: ["patients"],
  lists: () => [...patientKeys.all, "list"],
  list: (params) => [...patientKeys.lists(), params],
  details: () => [...patientKeys.all, "detail"],
  detail: (patientId) => [...patientKeys.details(), patientId],
};

export function usePatients(params = {}) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientService.list(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePatient(patientId) {
  return useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => patientService.get(patientId),
    enabled: Boolean(patientId),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.lists() }),
  });
}

export function useUpdatePatient(patientId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => patientService.update(patientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) });
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

function usePatientRecordMutation(patientId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => mutationFn(patientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) }),
  });
}

export const useAddMedicalHistory = (patientId) => usePatientRecordMutation(patientId, patientService.addMedicalHistory);
export const useAddComorbidity = (patientId) => usePatientRecordMutation(patientId, patientService.addComorbidity);
export const useAddVitals = (patientId) => usePatientRecordMutation(patientId, patientService.addVitals);
export const useAddSurgicalCase = (patientId) => usePatientRecordMutation(patientId, patientService.addSurgicalCase);

export function useUpdateComorbidity(patientId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comorbidityId, payload }) => patientService.updateComorbidity(patientId, comorbidityId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) }),
  });
}

export function useUpdateSurgicalCase(patientId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, payload }) => patientService.updateSurgicalCase(patientId, caseId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) }),
  });
}
