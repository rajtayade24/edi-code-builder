import { Router } from "express";
import { login, me, resendSignupOtp, startSignup, verifySignup } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup/start", startSignup);
router.post("/signup/verify-otp", verifySignup);
router.post("/signup/resend-otp", resendSignupOtp);
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
