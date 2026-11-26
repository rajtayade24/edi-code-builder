import { Activity, ClipboardList, LayoutDashboard, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/useAuthStore";

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;

export default function ClinicalLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const darkMode = useAuthStore((state) => state.darkMode);
  const toggleDarkMode = useAuthStore((state) => state.toggleDarkMode);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate("/app")} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Activity className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">SurgRisk-AI</span>
              <span className="block text-xs text-slate-500">Clinical workspace</span>
            </span>
          </button>
          <nav className="flex items-center gap-1">
            <NavLink to="/app" end className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              {user?.role === "ADMIN" ? "Overview" : "Command Center"}
            </NavLink>
            {user?.role !== "ADMIN" ? (
              <NavLink to="/patients" className={navLinkClass}>
                <ClipboardList className="h-4 w-4" />
                Patients
              </NavLink>
            ) : (
              <>
                <NavLink to="/command-center" className={navLinkClass}>
                  <Activity className="h-4 w-4" />
                  Command Center
                </NavLink>
                <NavLink to="/admin/clinicians" className={navLinkClass}>
                  <ShieldCheck className="h-4 w-4" />
                  Approvals
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8">
        <ShieldCheck className="h-4 w-4" />
        Patient data is restricted to approved clinical users in your institution.
      </footer>
    </div>
  );
}
