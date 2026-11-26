import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupSuccess({
  setSignupStep,
  setSignup,
  initialSignup,
  setOtpInfo,
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">Account verified</h3>
        <p className="text-sm text-muted-foreground">
          Your email and mobile number are verified. You can now sign in.
        </p>
      </div>

      <Button
        className="h-12 w-full rounded-2xl"
        onClick={() => {
          setSignupStep(1);
          setSignup(initialSignup);
          setOtpInfo({
            emailOtp: "",
            mobileOtp: "",
            signupSessionId: "",
            expiresAt: null,
            emailMasked: "",
            mobileMasked: "",
          });
        }}
      >
        Go to Signup Again
      </Button>
    </div>
  );
}