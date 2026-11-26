import { Activity, ShieldCheck } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

export default function SurgRiskPublicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Activity className="h-5 w-5" /></span>
            <span><span className="block text-sm font-semibold tracking-tight">SurgRisk-AI</span><span className="block text-xs text-muted-foreground">Clinical risk intelligence</span></span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /><span>Secure professional access</span></div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
