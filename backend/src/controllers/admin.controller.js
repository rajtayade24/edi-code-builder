import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import * as adminService from "../services/admin.service.js";

const userIdSchema = z.uuid();
const approvalSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });
const roleSchema = z.object({ role: z.enum(["CLINICIAN", "SURGEON", "ANESTHESIOLOGIST"]) });

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(400, "Invalid request data.", result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })));
  }
  return result.data;
}

export const listPendingClinicians = asyncHandler(async (req, res) => {
  const clinicians = await adminService.listPendingClinicians();
  res.json({ success: true, data: { clinicians } });
});

export const listApprovedClinicians = asyncHandler(async (req, res) => {
  const clinicians = await adminService.listApprovedClinicians();
  res.json({ success: true, data: { clinicians } });
});

export const updateClinicianApproval = asyncHandler(async (req, res) => {
  const { status } = parse(approvalSchema, req.body);
  const userId = parse(userIdSchema, req.params.userId);
  const clinician = await adminService.updateClinicianApproval(userId, req.auth.sub, status);
  res.json({ success: true, message: `Clinician application ${status.toLowerCase()}.`, data: { clinician } });
});

export const updateClinicianRole = asyncHandler(async (req, res) => {
  const { role } = parse(roleSchema, req.body);
  const userId = parse(userIdSchema, req.params.userId);
  const clinician = await adminService.updateClinicianRole(userId, role, req.auth.sub);
  res.json({ success: true, message: "Clinical role updated.", data: { clinician } });
});
