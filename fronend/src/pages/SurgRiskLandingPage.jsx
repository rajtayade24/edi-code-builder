import { Activity, ArrowRight, BrainCircuit, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useAuthStore from "@/store/useAuthStore";

const capabilities = [
  { icon: BrainCircuit, title: "Explainable risk insights", description: "Present model outputs alongside contributing factors for clinical review." },
  { icon: ChartNoAxesCombined, title: "Perioperative trends", description: "Bring patient vitals and clinical indicators into one workspace." },
  { icon: ShieldCheck, title: "Controlled clinical access", description: "Use verified accounts, administrator approval and role-based permissions." },
];

export default function SurgRiskLandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"><Activity className="h-4 w-4" /> Clinical decision-support prototype</div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Understand surgical risk with clearer clinical insight.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">SurgRisk-AI brings patient risk summaries, model explanations and perioperative trends into a focused clinical workspace for authorized professionals.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg" className="rounded-xl"><Link to="/app">Open clinical workspace<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            ) : (
              <>
                <Button asChild size="lg" className="rounded-xl"><Link to="/login">Clinician sign in<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl"><Link to="/register">Request access</Link></Button>
              </>
            )}
          </div>
          <p className="mt-5 max-w-xl text-xs leading-5 text-muted-foreground">This application is a development prototype. It is not a substitute for professional judgment, validated clinical systems or institutional review.</p>
        </section>
        <Card className="rounded-3xl border-border/80 shadow-xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Clinical workspace</p><h2 className="mt-1 text-xl font-semibold">Surgical risk overview</h2></div><span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">Preview</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">Patient profile</p><p className="mt-2 font-semibold">Clinical context</p><p className="mt-1 text-xs text-muted-foreground">Demographics and history</p></div>
              <div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">Risk assessment</p><p className="mt-2 font-semibold">Model explanation</p><p className="mt-1 text-xs text-muted-foreground">Factors for clinician review</p></div>
            </div>
            <div className="space-y-3">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-border p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
