import { CommandHeader } from "../components/layout/CommandHeader";
import { Toolbar } from "../components/layout/Toolbar";
import { HeroRiskSummary } from "../components/dashboard/HeroRiskSummary";
import { ClinicalReportCard } from "../components/dashboard/ClinicalReportCard";
import { ModelBranchesBar } from "../components/dashboard/ModelBranchesBar";
import { ShapExplainability } from "../components/dashboard/ShapExplainability";
import { ComorbidityGraph } from "../components/dashboard/ComorbidityGraph";
import { TimeSeriesVitals } from "../components/dashboard/TimeSeriesVitals";
import { WhatIfSimulator } from "../components/dashboard/WhatIfSimulator";
import { AddPatientModal } from "../components/modals/AddPatientModal";
import { HandoffPdfModal } from "../components/modals/HandoffPdfModal";
import { AlertAttendingModal } from "../components/modals/AlertAttendingModal";
import { FhirJsonModal } from "../components/modals/FhirJsonModal";
import { ModelBranchDetailModal } from "../components/modals/ModelBranchDetailModal";

export default function CommandCenterPage() {
  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      <CommandHeader />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <HeroRiskSummary />

        <ClinicalReportCard />

        <ModelBranchesBar />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <ShapExplainability />
          </div>
          <div className="lg:col-span-6">
            <ComorbidityGraph />
          </div>
        </div>

        <TimeSeriesVitals />

        <WhatIfSimulator />

        <Toolbar />
      </main>

      <div className="bg-white border-t border-slate-200 py-4 mt-4">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>&copy; 2026 SurgRisk-AI Command Center • Designed for Operating Rooms, Surgical Teams &amp; ICU Workstations</p>
          <div className="flex items-center gap-4 font-medium">
            <span>HIPAA Compliant</span>
            <span>MIMIC-IV Connected</span>
            <span>HL7 FHIR R4 Standard</span>
          </div>
        </div>
      </div>

      <AddPatientModal />
      <HandoffPdfModal />
      <AlertAttendingModal />
      <FhirJsonModal />
      <ModelBranchDetailModal />
    </div>
  );
}
