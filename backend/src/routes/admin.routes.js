import { Router } from "express";
import {
  listPendingClinicians,
  listApprovedClinicians,
  updateClinicianApproval,
  updateClinicianRole,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/clinicians/pending", listPendingClinicians);
router.get("/clinicians/approved", listApprovedClinicians);
router.patch("/clinicians/:userId/approval", updateClinicianApproval);
router.patch("/clinicians/:userId/role", updateClinicianRole);

export default router;
