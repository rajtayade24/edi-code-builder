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
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <CommandHeader />

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

      <AddPatientModal />
      <HandoffPdfModal />
      <AlertAttendingModal />
      <FhirJsonModal />
      <ModelBranchDetailModal />
    </div>
  );
}
