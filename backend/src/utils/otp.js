import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { ApiError } from "./api-error.js";

const DEVELOPMENT_OTP = "123456";

function ensureDevelopmentMode() {
  if (env.nodeEnv !== "development") {
    throw new ApiError(
      503,
      "Dummy OTP is available only in development."
    );
  }
}

export const createOtp = () => {
  ensureDevelopmentMode();
  return DEVELOPMENT_OTP;
};

export const hashOtp = (otp) => bcrypt.hash(otp, 10);

export const compareOtp = (otp, hash) =>
  bcrypt.compare(otp, hash);

export async function deliverOtp({ email, mobile }) {
  ensureDevelopmentMode();

  console.info("\n[SurgRisk-AI DUMMY OTP]");

  console.info(`Email: ${email} | OTP: ${DEVELOPMENT_OTP}`);
  console.info(`Mobile: ${mobile} | OTP: ${DEVELOPMENT_OTP}`);

  console.info("No actual email or SMS sent.\n");
}

export const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);

  return `${visible}${"*".repeat(
    Math.max(2, name.length - visible.length)
  )}@${domain}`;
};

export const maskMobile = (mobile) => {
  const digits = mobile.replace(/\D/g, "");

  return `${"*".repeat(
    Math.max(0, digits.length - 4)
  )}${digits.slice(-4)}`;
};

// import { randomInt } from "node:crypto";
// import bcrypt from "bcryptjs";
// import { env } from "../config/env.js";
// import { ApiError } from "./api-error.js";

// export const createOtp = () => String(randomInt(100000, 1_000_000));
// export const hashOtp = (otp) => bcrypt.hash(otp, 10);
// export const compareOtp = (otp, hash) => bcrypt.compare(otp, hash);

// /**
//  * Development adapter only. It deliberately does not pretend to deliver messages.
//  * Connect a real email and SMS provider before enabling production signup.
//  */
// export async function deliverOtp({ email, mobile, emailOtp, mobileOtp }) {
//   if (env.nodeEnv !== "development") {
//     throw new ApiError(
//       503,
//       "OTP delivery is not configured. Configure email and SMS providers before production signup."
//     );
//   }

//   console.info("\n[SurgRisk-AI development OTP]");
//   console.info(`Email destination: ${email} | OTP: ${emailOtp}`);
//   console.info(`Mobile destination: ${mobile} | OTP: ${mobileOtp}`);
//   console.info("These codes are for local development only.\n");
// }

// export const maskEmail = (email) => {
//   const [name, domain] = email.split("@");
//   const visible = name.slice(0, 2);
//   return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
// };

// export const maskMobile = (mobile) => {
//   const digits = mobile.replace(/\D/g, "");
//   return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
// };
