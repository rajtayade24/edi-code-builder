import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthStore from "@/store/useAuthStore";
import {
  resendSignupOtpRequest,
  signupStartRequest,
  verifySignupOtpRequest,
} from "@/services/authService";

const emptySignup = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  mobile: "",
  institution: "",
  licenseNumber: "",
  password: "",
  confirmPassword: "",
};

const inputClass = "h-11 rounded-xl bg-background";

function Field({ id, label, value, onChange, type = "text", placeholder, required = false, autoComplete }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </div>
  );
}

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.loading);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ credential: "", password: "" });
  const [signup, setSignup] = useState(emptySignup);
  const [step, setStep] = useState("details");
  const [verification, setVerification] = useState(null);
  const [otp, setOtp] = useState({ emailOtp: "", mobileOtp: "" });
  const [resendAt, setResendAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const nextPath = useMemo(() => {
    const requested = location.state?.from?.pathname;
    return requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/app";
  }, [location.state]);

  useEffect(() => {
    setStep("details");
    setError("");
    setVerification(null);
    setOtp({ emailOtp: "", mobileOtp: "" });
    setResendAt(null);
    setSecondsLeft(0);
  }, [mode]);

  useEffect(() => {
    if (!resendAt) {
      setSecondsLeft(0);
      return undefined;
    }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(resendAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  if (!authLoading && isAuthenticated && step !== "pending") {
    return <Navigate to={nextPath} replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginForm);
      toast.success("Signed in successfully.");
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStart = async (event) => {
    event.preventDefault();
    setError("");
    if (signup.password !== signup.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (signup.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signupStartRequest(signup);
      setVerification(result);
      setResendAt(result.resendAvailableAt);
      setStep("otp");
      toast.success("Verification codes generated.");
    } catch (requestError) {
      setError(requestError.message || "Could not start registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.emailOtp) || !/^\d{6}$/.test(otp.mobileOtp)) {
      setError("Enter both 6-digit verification codes.");
      return;
    }

    setLoading(true);
    try {
      await verifySignupOtpRequest({
        verificationId: verification.verificationId,
        emailOtp: otp.emailOtp,
        mobileOtp: otp.mobileOtp,
      });
      setStep("pending");
      toast.success("Contact details verified. Your application is submitted for review.");
    } catch (requestError) {
      setError(requestError.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verification?.verificationId || secondsLeft > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await resendSignupOtpRequest({ verificationId: verification.verificationId });
      setVerification(result);
      setResendAt(result.resendAvailableAt);
      setOtp({ emailOtp: "", mobileOtp: "" });
      toast.success("New verification codes generated.");
    } catch (requestError) {
      setError(requestError.message || "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const updateLogin = (event) => setLoginForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateSignup = (event) => setSignup((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <section className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300">
              <Activity className="h-6 w-6" />
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-teal-300">SurgRisk-AI</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Clinical intelligence for safer surgical decisions.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              A secure workspace for approved clinical professionals to review patient risk, contributing factors and perioperative trends.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <ShieldCheck className="h-5 w-5 text-teal-300" />
            <span>Professional access is subject to institution review.</span>
          </div>
        </aside>

        <div className="p-6 sm:p-9 lg:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div>
            <div><p className="font-semibold">SurgRisk-AI</p><p className="text-xs text-muted-foreground">Clinical command center</p></div>
          </div>

          {step === "pending" ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600"><BadgeCheck className="h-8 w-8" /></div>
              <h2 className="mt-6 text-2xl font-semibold">Application submitted</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Your email and mobile number are verified. An administrator must review your professional details before clinical access is enabled.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-left text-sm">
                <p><strong>Email:</strong> {signup.email}</p>
                <p className="mt-1"><strong>Institution:</strong> {signup.institution || "Not provided"}</p>
                <p className="mt-1"><strong>Status:</strong> Pending approval</p>
              </div>
              <Button className="mt-6 w-full rounded-xl" onClick={() => navigate("/login")}>Continue to login</Button>
            </div>
          ) : null}

          {step === "details" && !isRegister ? (
            <form onSubmit={handleLogin} className="mx-auto max-w-md space-y-5">
              <div>
                <p className="text-sm font-medium text-primary">Welcome back</p>
                <h2 className="mt-2 text-2xl font-semibold">Sign in to your workspace</h2>
                <p className="mt-2 text-sm text-muted-foreground">Use your registered email or mobile number.</p>
              </div>
              <Field id="credential" label="Email or mobile number" value={loginForm.credential} onChange={updateLogin} placeholder="you@hospital.com" required autoComplete="username" />
              <Field id="password" label="Password" type="password" value={loginForm.password} onChange={updateLogin} placeholder="Enter your password" required autoComplete="current-password" />
              {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading ? "Signing in..." : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              <p className="text-center text-sm text-muted-foreground">New to SurgRisk-AI? <Link to="/register" className="font-medium text-primary hover:underline">Request clinician access</Link></p>
            </form>
          ) : null}

          {step === "details" && isRegister ? (
            <form onSubmit={handleSignupStart} className="space-y-5">
              <div>
                <p className="text-sm font-medium text-primary">Professional registration</p>
                <h2 className="mt-2 text-2xl font-semibold">Request clinician access</h2>
                <p className="mt-2 text-sm text-muted-foreground">Verify your contact details. An administrator will review your institution and professional credentials.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="firstName" label="First name" value={signup.firstName} onChange={updateSignup} placeholder="Asha" required autoComplete="given-name" />
                <Field id="lastName" label="Last name" value={signup.lastName} onChange={updateSignup} placeholder="Kulkarni" required autoComplete="family-name" />
              </div>
              <Field id="middleName" label="Middle name (optional)" value={signup.middleName} onChange={updateSignup} placeholder="Middle name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="email" label="Work email" type="email" value={signup.email} onChange={updateSignup} placeholder="name@hospital.com" required autoComplete="email" />
                <Field id="mobile" label="Mobile number" type="tel" value={signup.mobile} onChange={updateSignup} placeholder="+91 9876543210" required autoComplete="tel" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="institution" label="Hospital / institution" value={signup.institution} onChange={updateSignup} placeholder="Hospital name" required />
                <Field id="licenseNumber" label="Professional registration number" value={signup.licenseNumber} onChange={updateSignup} placeholder="Registration / license ID" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="password" label="Password" type="password" value={signup.password} onChange={updateSignup} placeholder="At least 8 characters" required autoComplete="new-password" />
                <Field id="confirmPassword" label="Confirm password" type="password" value={signup.confirmPassword} onChange={updateSignup} placeholder="Repeat password" required autoComplete="new-password" />
              </div>
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-muted-foreground">New registrations receive the basic CLINICIAN role. Surgeon and anesthesiologist permissions can only be assigned by an administrator after credential review.</p>
              {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading ? "Preparing verification..." : "Continue to verification"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              <p className="text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
            </form>
          ) : null}

          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="mx-auto max-w-lg space-y-5">
              <button type="button" onClick={() => { setStep("details"); setError(""); }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to details</button>
              <div>
                <p className="text-sm font-medium text-primary">Contact verification</p>
                <h2 className="mt-2 text-2xl font-semibold">Verify email and mobile</h2>
                <p className="mt-2 text-sm text-muted-foreground">Enter the six-digit codes sent to {verification?.emailMasked} and {verification?.mobileMasked}.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="emailOtp">Email OTP</Label><Input id="emailOtp" value={otp.emailOtp} onChange={(event) => setOtp((current) => ({ ...current, emailOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-12 rounded-xl text-center text-xl tracking-[0.35em]" required /></div>
                <div className="space-y-2"><Label htmlFor="mobileOtp">Mobile OTP</Label><Input id="mobileOtp" value={otp.mobileOtp} onChange={(event) => setOtp((current) => ({ ...current, mobileOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))} inputMode="numeric" placeholder="000000" className="h-12 rounded-xl text-center text-xl tracking-[0.35em]" required /></div>
              </div>
              {verification?.expiresAt ? <p className="text-xs text-muted-foreground">Codes expire at {new Date(verification.expiresAt).toLocaleTimeString()}.</p> : null}
              {import.meta.env.DEV ? (
                <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  Development dummy OTP: use <strong>123456</strong> for both email and mobile verification.
                </p>
              ) : null}
              {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading ? "Verifying..." : "Verify and submit application"}<KeyRound className="ml-2 h-4 w-4" /></Button>
              <div className="text-center text-sm text-muted-foreground">
                {secondsLeft > 0 ? `You can request new codes in ${secondsLeft}s.` : "Did not receive the codes?"}{" "}
                <button type="button" onClick={handleResendOtp} disabled={loading || secondsLeft > 0} className="font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50">Resend OTP</button>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
