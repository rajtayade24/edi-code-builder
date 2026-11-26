import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { User } from "../src/models/User.js";

const required = [
  "BOOTSTRAP_ADMIN_FIRST_NAME",
  "BOOTSTRAP_ADMIN_LAST_NAME",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_MOBILE",
  "BOOTSTRAP_ADMIN_PASSWORD",
];

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Missing bootstrap environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (password.length < 12) {
  console.error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters long.");
  process.exit(1);
}

const firstName = process.env.BOOTSTRAP_ADMIN_FIRST_NAME.trim();
const lastName = process.env.BOOTSTRAP_ADMIN_LAST_NAME.trim();
const email = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
const mobile = process.env.BOOTSTRAP_ADMIN_MOBILE.trim().replace(/[\s()-]/g, "");

try {
  await connectDb();
  const existing = await User.findOne({
    $or: [{ role: "ADMIN" }, { email }, { mobile }],
  })
    .select("_id email")
    .lean();

  if (existing) {
    console.info("An administrator or matching account already exists. No new admin was created.");
  } else {
    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      _id: randomUUID(),
      firstName,
      lastName,
      email,
      mobile,
      passwordHash,
      role: "ADMIN",
      accountStatus: "APPROVED",
      isActive: true,
      emailVerifiedAt: now,
      mobileVerifiedAt: now,
      approvedAt: now,
    });
    console.info(`Bootstrap administrator created for ${email}. Remove BOOTSTRAP_ADMIN_* from .env now.`);
  }
} catch (error) {
  console.error("Failed to bootstrap administrator:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
