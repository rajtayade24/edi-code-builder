import React from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionTitle from "./SectionTitle";
import OTPInput from "./OTPInput";

export default function SignupOtpStep({
  otpInfo,
  setOtpInfo,
  signup,
  submitVerifyOtp,
  resendOtp,
  loading,
  message,
  setSignupStep,
}) {
  return (
    <form onSubmit={submitVerifyOtp} className="space-y-6">
      <SectionTitle
        icon={BadgeCheck}
        title="Verify your account"
        description="Enter the OTP sent to your email and mobile number."
      />

      <div className="rounded-3xl border border-border bg-muted/30 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>OTP sent to: {otpInfo.emailMasked || signup.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>OTP sent to: {otpInfo.mobileMasked || signup.mobile}</span>
        </div>
        {otpInfo.expiresAt ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            <span>Expires at: {String(otpInfo.expiresAt)}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OTPInput
          value={otpInfo.emailOtp}
          onChange={(e) =>
            setOtpInfo((prev) => ({ ...prev, emailOtp: e.target.value.replace(/\D/g, "") }))
          }
          label="Email OTP"
          placeholder="Enter email OTP"
          icon={Mail}
        />
        <OTPInput
          value={otpInfo.mobileOtp}
          onChange={(e) =>
            setOtpInfo((prev) => ({ ...prev, mobileOtp: e.target.value.replace(/\D/g, "") }))
          }
          label="Mobile OTP"
          placeholder="Enter mobile OTP"
          icon={Phone}
        />
      </div>

      {message ? (
        <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl"
          onClick={() => setSignupStep(1)}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full rounded-2xl"
          onClick={resendOtp}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? "Resending..." : "Resend OTP"}
        </Button>
        <Button type="submit" className="h-12 w-full rounded-2xl" disabled={loading}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {loading ? "Verifying..." : "Verify & Activate"}
        </Button>
      </div>
    </form>
  );
}