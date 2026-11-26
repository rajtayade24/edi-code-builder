import React from "react";
import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionTitle from "./SectionTitle";

export default function LoginForm({
  login,
  handleLoginChange,
  loginPasswordVisible,
  setLoginPasswordVisible,
  submitLogin,
  loading,
  message,
}) {
  return (
    <form onSubmit={submitLogin} className="space-y-5">
      <SectionTitle
        icon={LogIn}
        title="Login to your account"
        description="Use your email or mobile number to sign in."
      />

      <div className="space-y-2">
        <Label htmlFor="credential" className="text-sm font-medium text-foreground">
          Email or Mobile
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="credential"
            name="credential"
            value={login.credential}
            onChange={handleLoginChange}
            placeholder="Enter email or mobile"
            className="h-12 rounded-2xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loginPassword" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="loginPassword"
            name="password"
            type={loginPasswordVisible ? "text" : "password"}
            value={login.password}
            onChange={handleLoginChange}
            placeholder="Enter password"
            className="h-12 rounded-2xl border-border bg-background pl-10 pr-10 text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setLoginPasswordVisible((prev) => !prev)}
            className="absolute right-3 top-3.5 text-muted-foreground transition hover:text-foreground"
            aria-label="Toggle login password visibility"
          >
            {loginPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          <input
            type="checkbox"
            name="rememberMe"
            checked={login.rememberMe}
            onChange={handleLoginChange}
            className="h-4 w-4 rounded border-border"
          />
          Remember me
        </label>
        <button type="button" className="font-medium text-primary hover:underline">
          Forgot password?
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {message}
        </div>
      ) : null}

      <Button type="submit" className="h-12 w-full rounded-2xl" disabled={loading}>
        <LogIn className="mr-2 h-4 w-4" />
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}