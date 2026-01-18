// src/app/routes/PathRouting.ts
import { Router } from 'express';
import projectRoutes from './projectRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import startpageRoutes from './homeview_routes.ts';
import calculationRoutes from './calcRoutes.js';
import configRoutes from './configRoutes.js';
import settingsRoutes from "./settingsRoutes.ts";

const router = Router();

// Alle Routes montieren
router.use('/projects', projectRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/homeview', startpageRoutes);
router.use('/calculation', calculationRoutes);
router.use('/config', configRoutes);
router.use('/settings', settingsRoutes);

export default router;