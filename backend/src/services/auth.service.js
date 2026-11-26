import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { PendingSignup } from "../models/PendingSignup.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import {
  compareOtp,
  createOtp,
  deliverOtp,
  hashOtp,
  maskEmail,
  maskMobile,
} from "../utils/otp.js";

const SIGNUP_OTP_TTL_MINUTES = 10;
const OTP_RESEND_WAIT_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const PASSWORD_ROUNDS = 12;

const publicUser = (doc) => ({
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
  isActive: doc.isActive,
  createdAt: doc.createdAt,
});

const makeToken = (user) => jwt.sign(
  {},
  env.jwtSecret,
  { subject: user.id, expiresIn: env.jwtExpiresIn }
);

const normalizeMobile = (value) => value.replace(/[\s()-]/g, "");

export async function startSignup(input) {
  const firstName = input.firstName.trim();
  const middleName = input.middleName?.trim() || null;
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const mobile = normalizeMobile(input.mobile.trim());
  const institution = input.institution?.trim() || null;
  const licenseNumber = input.licenseNumber?.trim() || null;

  const duplicate = await User.findOne({ $or: [{ email }, { mobile }] }).select("_id").lean();
  if (duplicate) {
    throw new ApiError(409, "An account already exists with this email or mobile number.");
  }

  const emailOtp = createOtp();
  const mobileOtp = createOtp();
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  const emailOtpHash = await hashOtp(emailOtp);
  const mobileOtpHash = await hashOtp(mobileOtp);
  const verificationId = randomUUID();
  const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MINUTES * 60_000);
  const resendAfter = new Date(Date.now() + OTP_RESEND_WAIT_SECONDS * 1_000);

  await PendingSignup.deleteMany({ $or: [{ email }, { mobile }] });

  await PendingSignup.create({
    _id: verificationId,
    firstName,
    middleName,
    lastName,
    email,
    mobile,
    passwordHash,
    role: "CLINICIAN",
    institution,
    licenseNumber,
    emailOtpHash,
    mobileOtpHash,
    attemptCount: 0,
    expiresAt,
    resendAfter,
  });

  try {
    await deliverOtp({ email, mobile, emailOtp, mobileOtp });
  } catch (error) {
    await PendingSignup.deleteOne({ _id: verificationId });
    throw error;
  }

  return {
    verificationId,
    emailMasked: maskEmail(email),
    mobileMasked: maskMobile(mobile),
    expiresAt: expiresAt.toISOString(),
    resendAvailableAt: resendAfter.toISOString(),
  };
}

export async function verifySignup(input) {
  const pending = await PendingSignup.findById(input.verificationId);
  if (!pending) throw new ApiError(404, "Signup verification was not found. Start registration again.");
  if (pending.expiresAt.getTime() < Date.now()) {
    throw new ApiError(410, "OTP expired. Request new OTPs to continue.");
  }
  if (pending.attemptCount >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, "Too many incorrect OTP attempts. Request new OTPs.");
  }

  const [emailMatches, mobileMatches] = await Promise.all([
    compareOtp(input.emailOtp, pending.emailOtpHash),
    compareOtp(input.mobileOtp, pending.mobileOtpHash),
  ]);

  if (!emailMatches || !mobileMatches) {
    await PendingSignup.updateOne({ _id: input.verificationId }, { $inc: { attemptCount: 1 } });
    throw new ApiError(400, "The email OTP or mobile OTP is incorrect.");
  }

  const now = new Date();
  let created;
  try {
    created = await User.create({
      _id: randomUUID(),
      firstName: pending.firstName,
      middleName: pending.middleName,
      lastName: pending.lastName,
      email: pending.email,
      mobile: pending.mobile,
      passwordHash: pending.passwordHash,
      role: "CLINICIAN",
      institution: pending.institution,
      licenseNumber: pending.licenseNumber,
      accountStatus: "PENDING",
      isActive: true,
      emailVerifiedAt: now,
      mobileVerifiedAt: now,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "An account already exists with this email or mobile number.");
    }
    throw error;
  }

  await PendingSignup.deleteOne({ _id: input.verificationId });

  return {
    user: publicUser(created.toObject()),
    requiresApproval: true,
  };
}

export async function resendSignupOtp(input) {
  const pending = await PendingSignup.findById(input.verificationId);
  if (!pending) throw new ApiError(404, "Signup verification was not found. Start registration again.");
  if (pending.resendAfter.getTime() > Date.now()) {
    throw new ApiError(429, "Please wait before requesting another OTP.");
  }

  const emailOtp = createOtp();
  const mobileOtp = createOtp();
  const emailOtpHash = await hashOtp(emailOtp);
  const mobileOtpHash = await hashOtp(mobileOtp);
  const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MINUTES * 60_000);
  const resendAfter = new Date(Date.now() + OTP_RESEND_WAIT_SECONDS * 1_000);

  await PendingSignup.updateOne(
    { _id: input.verificationId },
    {
      $set: {
        emailOtpHash,
        mobileOtpHash,
        expiresAt,
        resendAfter,
        attemptCount: 0,
      },
    }
  );

  await deliverOtp({ email: pending.email, mobile: pending.mobile, emailOtp, mobileOtp });

  return {
    verificationId: input.verificationId,
    emailMasked: maskEmail(pending.email),
    mobileMasked: maskMobile(pending.mobile),
    expiresAt: expiresAt.toISOString(),
    resendAvailableAt: resendAfter.toISOString(),
  };
}

export async function login(input) {
  const credential = input.credential.trim();
  const normalizedEmail = credential.toLowerCase();
  const normalizedMobile = normalizeMobile(credential);

  const userDoc = await User.findOne({
    $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
  }).lean();

  if (!userDoc || !(await bcrypt.compare(input.password, userDoc.passwordHash))) {
    throw new ApiError(401, "Invalid email/mobile or password.");
  }
  if (userDoc.accountStatus === "PENDING") {
    throw new ApiError(403, "Your contact details are verified, but administrator approval is still pending.");
  }
  if (userDoc.accountStatus === "REJECTED") {
    throw new ApiError(403, "Your account application was not approved. Contact your institution administrator.");
  }
  if (!userDoc.isActive) throw new ApiError(403, "This account has been deactivated.");

  await User.updateOne({ _id: userDoc._id }, { $set: { lastLoginAt: new Date() } });
  const user = publicUser(userDoc);
  return { token: makeToken(user), user };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user || !user.isActive || user.accountStatus !== "APPROVED") {
    throw new ApiError(401, "Account is unavailable.");
  }
  return publicUser(user);
}
