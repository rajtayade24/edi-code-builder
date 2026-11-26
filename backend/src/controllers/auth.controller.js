import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import * as authService from "../services/auth.service.js";

const startSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
  mobile: z.string().trim().regex(/^\+?[0-9\s()-]{10,20}$/),
  password: z.string().min(8).max(72),
  confirmPassword: z.string().optional(),
  role: z.enum(["CLINICIAN", "SURGEON", "ANESTHESIOLOGIST"]).optional(),
  institution: z.string().trim().max(160).optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const verifySchema = z.object({
  verificationId: z.uuid(),
  emailOtp: z.string().regex(/^\d{6}$/),
  mobileOtp: z.string().regex(/^\d{6}$/),
});

const resendSchema = z.object({
  verificationId: z.uuid(),
});

const loginSchema = z.object({
  credential: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(72),
});

const parseBody = (schema, body) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, "Please check the submitted fields.", result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })));
  }
  return result.data;
};

export const startSignup = asyncHandler(async (req, res) => {
  const data = await authService.startSignup(parseBody(startSchema, req.body));
  res.status(201).json({ success: true, message: "Verification codes created.", data });
});

export const verifySignup = asyncHandler(async (req, res) => {
  const data = await authService.verifySignup(parseBody(verifySchema, req.body));
  res.status(201).json({ success: true, message: "Account verified successfully.", data });
});

export const resendSignupOtp = asyncHandler(async (req, res) => {
  const data = await authService.resendSignupOtp(parseBody(resendSchema, req.body));
  res.json({ success: true, message: "New verification codes created.", data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(parseBody(loginSchema, req.body));
  res.json({ success: true, message: "Login successful.", data });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.auth.sub);
  res.json({ success: true, data: { user } });
});
