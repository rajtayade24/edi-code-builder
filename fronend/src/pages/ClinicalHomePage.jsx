import { Activity, ArrowRight, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useAuthStore from "@/store/useAuthStore";
import CommandCenterPage from "@/features/command-center/pages/CommandCenterPage";

export default function ClinicalHomePage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Signed in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.role || "CLINICIAN"}
              {user?.institution ? ` · ${user.institution}` : ""})
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                <Link to="/patients">
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  Patient Records
                </Link>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-lg text-xs">
                <Link to="/patients/new">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Register Patient
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <CommandCenterPage />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Welcome, {user?.firstName || "Administrator"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review pending clinician registrations, assign clinical roles, or preview the Surgical Command Center.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/command-center">
              <Activity className="mr-2 h-4 w-4" />
              Preview Command Center
            </Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/admin/clinicians">
              Review clinician approvals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold">Clinician approvals</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Verify institution and license details before granting workspace access or specialist roles.
            </p>
            <Button asChild variant="link" className="mt-3 h-auto p-0 text-primary">
              <Link to="/admin/clinicians">
                Manage applications
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold">Access verified</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Signed in with the <strong>{user?.role || "ADMIN"}</strong> role
              {user?.institution ? ` at ${user.institution}` : ""}.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
