import React from "react";
import { ArrowRight, Home, Mail, Phone, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionTitle from "./SectionTitle";
import PasswordField from "./PasswordField";

export default function SignupStepOne({
  signup,
  handleSignupChange,
  signupPasswordVisible,
  setSignupPasswordVisible,
  signupConfirmVisible,
  setSignupConfirmVisible,
  submitSignupStart,
  loading,
  message,
}) {
  return (
    <form onSubmit={submitSignupStart} className="space-y-6">
      <SectionTitle
        icon={UserPlus}
        title="Create your citizen account"
        description="Enter your personal details and address to register."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-foreground">
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              name="firstName"
              value={signup.firstName}
              onChange={handleSignupChange}
              placeholder="Prem"
              className="h-12 rounded-2xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName" className="text-foreground">
            Middle Name
          </Label>
          <Input
            id="middleName"
            name="middleName"
            value={signup.middleName}
            onChange={handleSignupChange}
            placeholder="Optional"
            className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-foreground">
            Last Name
          </Label>
          <Input
            id="lastName"
            name="lastName"
            value={signup.lastName}
            onChange={handleSignupChange}
            placeholder="Patil"
            className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signupEmail" className="text-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="signupEmail"
              name="email"
              type="email"
              value={signup.email}
              onChange={handleSignupChange}
              placeholder="you@example.com"
              className="h-12 rounded-2xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-foreground">
            Mobile Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              name="mobile"
              value={signup.mobile}
              onChange={handleSignupChange}
              placeholder="10-digit mobile number"
              className="h-12 rounded-2xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PasswordField
          id="signupPassword"
          name="password"
          label="Password"
          value={signup.password}
          onChange={handleSignupChange}
          placeholder="Create a password"
          showPassword={signupPasswordVisible}
          setShowPassword={setSignupPasswordVisible}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          value={signup.confirmPassword}
          onChange={handleSignupChange}
          placeholder="Re-enter password"
          showPassword={signupConfirmVisible}
          setShowPassword={setSignupConfirmVisible}
        />
      </div>

      <div className="rounded-3xl border border-border bg-muted/30 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Address Details</h4>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="line1" className="text-foreground">
              Address Line 1
            </Label>
            <Input
              id="line1"
              name="line1"
              value={signup.line1}
              onChange={handleSignupChange}
              placeholder="Flat / House No / Street"
              className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="line2" className="text-foreground">
              Address Line 2
            </Label>
            <Input
              id="line2"
              name="line2"
              value={signup.line2}
              onChange={handleSignupChange}
              placeholder="Area / Landmark"
              className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-foreground">
              City
            </Label>
            <Input
              id="city"
              name="city"
              value={signup.city}
              onChange={handleSignupChange}
              placeholder="Pune"
              className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-foreground">
              State
            </Label>
            <Input
              id="state"
              name="state"
              value={signup.state}
              onChange={handleSignupChange}
              placeholder="Maharashtra"
              className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode" className="text-foreground">
              Pincode
            </Label>
            <Input
              id="pincode"
              name="pincode"
              value={signup.pincode}
              onChange={handleSignupChange}
              placeholder="411033"
              className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-foreground">
              Country
            </Label>
            <Input
              id="country"
              name="country"
              value={signup.country}
              onChange={handleSignupChange}
              placeholder="INDIA"
              className="h-12 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {message}
        </div>
      ) : null}

      <Button type="submit" className="h-12 w-full rounded-2xl" disabled={loading}>
        <ArrowRight className="mr-2 h-4 w-4" />
        {loading ? "Sending OTP..." : "Continue to OTP Verification"}
      </Button>
    </form>
  );
}