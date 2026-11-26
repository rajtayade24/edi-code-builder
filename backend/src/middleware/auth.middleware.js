import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Loads user role, status, and institution from MongoDB on each request so
 * tenant scoping and role changes take effect immediately.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token, extra] = header.split(" ");
  if (scheme !== "Bearer" || !token || extra) {
    throw new ApiError(401, "Authentication is required.");
  }

  let claims;
  try {
    claims = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, "Your session is invalid or expired. Please sign in again.");
  }

  const user = await User.findById(claims.sub)
    .select("_id role accountStatus isActive institution")
    .lean();

  if (!user || !user.isActive) throw new ApiError(401, "This account is unavailable.");
  if (user.accountStatus !== "APPROVED") {
    throw new ApiError(403, "Your account does not have approved clinical access.");
  }

  req.auth = {
    sub: user._id,
    role: user.role,
    institution: user.institution?.trim() || null,
  };
  return next();
});

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) return next(new ApiError(401, "Authentication is required."));
    if (!allowedRoles.includes(req.auth.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    return next();
  };
}

export function requireInstitution(req, res, next) {
  if (!req.auth?.institution) {
    return next(new ApiError(403, "Your account must be assigned to an institution before accessing patient records."));
  }
  return next();
}
