import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import patientRoutes from './patient.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/patients', patientRoutes);
router.use('/ai', aiRoutes);
export default router;
