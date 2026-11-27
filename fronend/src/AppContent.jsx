import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import AuthPage from "@/pages/auth/AuthPage";
import NotFound from "@/pages/NotFound";
import SurgRiskLandingPage from "@/pages/SurgRiskLandingPage";
import ClinicalLayout from "@/layout/ClinicalLayout";
import SurgRiskPublicLayout from "@/layout/SurgRiskPublicLayout";
import useAuthStore from "@/store/useAuthStore";

const ClinicalHomePage = lazy(() => import("@/pages/ClinicalHomePage"));
const CommandCenterPage = lazy(() => import("@/features/command-center/pages/CommandCenterPage"));
const PatientsPage = lazy(() => import("@/features/patients/pages/PatientsPage"));
const PatientRegistrationPage = lazy(() => import("@/features/patients/pages/PatientRegistrationPage"));
const PatientDetailsPage = lazy(() => import("@/features/patients/pages/PatientDetailsPage"));
const RiskAssessmentPage = lazy(() => import("@/features/ai-assessment/pages/RiskAssessmentPage"));
const ClinicianApprovalsPage = lazy(() => import("@/pages/admin/ClinicianApprovalsPage"));

function RouteLoader() {
  return (
    <main className="grid min-h-[50vh] place-items-center px-6">
      <p className="text-sm text-muted-foreground">Loading clinical module...</p>
    </main>
  );
}

export default function AppContent() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
