import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import AuthPage from "@/pages/auth/AuthPage";
import ClinicianApprovalsPage from "@/pages/admin/ClinicianApprovalsPage";
import ClinicalHomePage from "@/pages/ClinicalHomePage";
import NotFound from "@/pages/NotFound";
import SurgRiskLandingPage from "@/pages/SurgRiskLandingPage";
import ClinicalLayout from "@/layout/ClinicalLayout";
import SurgRiskPublicLayout from "@/layout/SurgRiskPublicLayout";
import useAuthStore from "@/store/useAuthStore";
import PatientsPage from "@/features/patients/pages/PatientsPage";
import PatientRegistrationPage from "@/features/patients/pages/PatientRegistrationPage";
import PatientDetailsPage from "@/features/patients/pages/PatientDetailsPage";
import RiskAssessmentPage from "@/features/ai-assessment/pages/RiskAssessmentPage";
import CommandCenterPage from "@/features/command-center/pages/CommandCenterPage";

export default function AppContent() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SurgRiskPublicLayout />}>
          <Route path="/" element={<SurgRiskLandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<ClinicalLayout />}>
            <Route path="/app" element={<ClinicalHomePage />} />
            <Route path="/command-center" element={<CommandCenterPage />} />
            <Route element={<RoleGuard allowedRoles={["CLINICIAN", "SURGEON", "ANESTHESIOLOGIST"]} />}>
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/new" element={<PatientRegistrationPage />} />
              <Route path="/patients/:patientId" element={<PatientDetailsPage />} />
              <Route path="/patients/:patientId/surgical-cases/:caseId/risk-assessment" element={<RiskAssessmentPage />} />
            </Route>
          </Route>
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route element={<ClinicalLayout />}>
              <Route path="/admin/clinicians" element={<ClinicianApprovalsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/clinicians" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
