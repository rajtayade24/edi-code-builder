import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApprovedClinicians, getPendingClinicians, updateClinicianApproval, updateClinicianRole } from "@/services/adminService";

export default function ClinicianApprovalsPage() {
  const [clinicians, setClinicians] = useState([]);
  const [approvedClinicians, setApprovedClinicians] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pending, approved] = await Promise.all([getPendingClinicians(), getApprovedClinicians()]);
      setClinicians(pending);
      setApprovedClinicians(approved);
      setRoleDrafts(Object.fromEntries(approved.map((item) => [item.id, item.role])));
    } catch (requestError) {
      setError(requestError.message || "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const saveRole = async (userId) => {
    const role = roleDrafts[userId];
    setBusyId(userId);
    try {
      const updated = await updateClinicianRole(userId, role);
      setApprovedClinicians((current) => current.map((item) => item.id === userId ? updated : item));
      toast.success("Clinical role updated.");
    } catch (requestError) {
      toast.error(requestError.message || "Could not update this role.");
    } finally {
      setBusyId(null);
    }
  };

  const decide = async (userId, status) => {
    setBusyId(userId);
    try {
      await updateClinicianApproval(userId, status);
      setClinicians((current) => current.filter((item) => item.id !== userId));
      if (status === "APPROVED") {
        const refreshed = await getApprovedClinicians();
        setApprovedClinicians(refreshed);
        setRoleDrafts(Object.fromEntries(refreshed.map((item) => [item.id, item.role])));
      }
      toast.success(status === "APPROVED" ? "Clinician approved." : "Application rejected.");
    } catch (requestError) {
      toast.error(requestError.message || "Could not update this application.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">Administration</p><h1 className="mt-2 text-3xl font-semibold">Clinician applications</h1><p className="mt-2 text-sm text-muted-foreground">Review professional details before enabling clinical workspace access.</p></div>
        <Button variant="outline" className="rounded-xl" onClick={loadApplications} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button>
      </div>

      {error ? <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading applications...</p> : null}
      {!loading && !error && clinicians.length === 0 ? <Card className="rounded-2xl"><CardContent className="flex flex-col items-center p-10 text-center"><ShieldCheck className="h-8 w-8 text-primary"/><h2 className="mt-4 font-semibold">No pending applications</h2><p className="mt-2 text-sm text-muted-foreground">New verified clinician registrations will appear here.</p></CardContent></Card> : null}

      <div className="space-y-4">
        {clinicians.map((clinician) => (
          <Card key={clinician.id} className="rounded-2xl"><CardContent className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{clinician.firstName} {clinician.middleName} {clinician.lastName}</h2><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">Pending review</span></div>
                <div className="mt-3 grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p><strong className="font-medium text-foreground">Email:</strong> {clinician.email}</p>
                  <p><strong className="font-medium text-foreground">Mobile:</strong> {clinician.mobile}</p>
                  <p><strong className="font-medium text-foreground">Institution:</strong> {clinician.institution || "Not provided"}</p>
                  <p><strong className="font-medium text-foreground">Registration ID:</strong> {clinician.licenseNumber || "Not provided"}</p>
                  <p><strong className="font-medium text-foreground">Submitted:</strong> {new Date(clinician.createdAt).toLocaleString()}</p>
                  <p><strong className="font-medium text-foreground">Contact verification:</strong> Email and mobile verified</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button className="rounded-xl" onClick={() => decide(clinician.id, "APPROVED")} disabled={busyId === clinician.id}><Check className="mr-2 h-4 w-4"/>Approve</Button>
                <Button variant="outline" className="rounded-xl" onClick={() => decide(clinician.id, "REJECTED")} disabled={busyId === clinician.id}><X className="mr-2 h-4 w-4"/>Reject</Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <section className="mt-12">
        <div className="mb-4"><h2 className="text-xl font-semibold">Approved clinicians</h2><p className="mt-1 text-sm text-muted-foreground">Assign a clinical role only after verifying the professional registration details.</p></div>
        <div className="space-y-3">
          {approvedClinicians.map((clinician) => (
            <Card key={clinician.id} className="rounded-2xl"><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div><p className="font-semibold">{clinician.firstName} {clinician.lastName}</p><p className="mt-1 text-sm text-muted-foreground">{clinician.email} · {clinician.institution || "Institution not provided"}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label={`Role for ${clinician.firstName} ${clinician.lastName}`} value={roleDrafts[clinician.id] || clinician.role} onChange={(event) => setRoleDrafts((current) => ({ ...current, [clinician.id]: event.target.value }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="CLINICIAN">Clinician</option>
                  <option value="SURGEON">Surgeon</option>
                  <option value="ANESTHESIOLOGIST">Anesthesiologist</option>
                </select>
                <Button size="sm" className="rounded-lg" onClick={() => saveRole(clinician.id)} disabled={busyId === clinician.id || roleDrafts[clinician.id] === clinician.role}>Save role</Button>
              </div>
            </CardContent></Card>
          ))}
          {approvedClinicians.length === 0 && !loading ? <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No approved clinicians yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
