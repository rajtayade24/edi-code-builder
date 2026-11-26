import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiAssessmentService } from '../api/aiAssessmentService';

export function useAiModelStatus() {
  return useQuery({ queryKey: ['ai-model-status'], queryFn: aiAssessmentService.getModels, staleTime: 15_000 });
}

export function useRiskAssessmentHistory(patientId, caseId) {
  return useQuery({
    queryKey: ['risk-assessments', patientId, caseId],
    queryFn: () => aiAssessmentService.list(patientId, caseId),
    enabled: Boolean(patientId && caseId),
  });
}

export function useRunRiskAssessment(patientId, caseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => aiAssessmentService.run(patientId, caseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['risk-assessments', patientId, caseId] }),
  });
}

export function usePatientLabs(patientId) {
  return useQuery({
    queryKey: ['patient-labs', patientId],
    queryFn: () => aiAssessmentService.listLabs(patientId),
    enabled: Boolean(patientId),
  });
}

export function useAddPatientLab(patientId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => aiAssessmentService.addLab(patientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient-labs', patientId] }),
  });
}
