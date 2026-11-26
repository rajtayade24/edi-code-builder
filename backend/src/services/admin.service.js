import { randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { AdminAuditLog } from "../models/AdminAuditLog.js";
import { ApiError } from "../utils/api-error.js";

const CLINICAL_ROLES = ["CLINICIAN", "SURGEON", "ANESTHESIOLOGIST"];

function toPublicClinician(doc) {
  return {
    id: doc._id,
    firstName: doc.firstName,
    middleName: doc.middleName,
    lastName: doc.lastName,
    email: doc.email,
    mobile: doc.mobile,
    role: doc.role,
    institution: doc.institution,
    licenseNumber: doc.licenseNumber,
    accountStatus: doc.accountStatus,
    createdAt: doc.createdAt,
    emailVerifiedAt: doc.emailVerifiedAt,
    mobileVerifiedAt: doc.mobileVerifiedAt,
  };
}

export async function listPendingClinicians() {
  const rows = await User.find({ accountStatus: "PENDING", role: { $ne: "ADMIN" } })
    .sort({ createdAt: 1 })
    .lean();
  return rows.map(toPublicClinician);
}

export async function listApprovedClinicians() {
  const rows = await User.find({
    accountStatus: "APPROVED",
    role: { $ne: "ADMIN" },
    isActive: true,
  })
    .sort({ lastName: 1, firstName: 1 })
    .lean();
  return rows.map(toPublicClinician);
}

export async function updateClinicianApproval(userId, adminId, status) {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new ApiError(400, "Approval status must be APPROVED or REJECTED.");
  }

  const isApproved = status === "APPROVED";
  const updated = await User.findOneAndUpdate(
    { _id: userId, role: { $ne: "ADMIN" }, accountStatus: "PENDING" },
    {
      $set: {
        accountStatus: status,
        isActive: isApproved,
        approvedAt: isApproved ? new Date() : null,
        approvedBy: isApproved ? adminId : null,
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ApiError(404, "Pending clinician application was not found.");
  }

  await AdminAuditLog.create({
    _id: randomUUID(),
    actorUserId: adminId,
    subjectUserId: userId,
    action: "CLINICIAN_APPROVAL_UPDATED",
    previousValues: { accountStatus: "PENDING" },
    newValues: { accountStatus: status },
  });

  return toPublicClinician(updated);
}

export async function updateClinicianRole(userId, role, adminId) {
  if (!CLINICAL_ROLES.includes(role)) {
    throw new ApiError(400, "Invalid clinical role.");
  }

  const current = await User.findOne({
    _id: userId,
    accountStatus: "APPROVED",
    role: { $ne: "ADMIN" },
  })
    .select("role")
    .lean();

  if (!current) throw new ApiError(404, "Approved clinician was not found.");

  const updated = await User.findOneAndUpdate(
    { _id: userId, accountStatus: "APPROVED", role: { $ne: "ADMIN" } },
    { $set: { role } },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(404, "Approved clinician was not found.");

  await AdminAuditLog.create({
    _id: randomUUID(),
    actorUserId: adminId,
    subjectUserId: userId,
    action: "CLINICAL_ROLE_UPDATED",
    previousValues: { role: current.role },
    newValues: { role },
  });

  return toPublicClinician(updated);
}
