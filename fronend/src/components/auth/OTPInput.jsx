import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OTPInput({
  value,
  onChange,
  label,
  placeholder,
  icon: Icon,
  maxLength = 6,
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={onChange}
          inputMode="numeric"
          maxLength={maxLength}
          placeholder={placeholder}
          className="h-12 rounded-2xl border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}