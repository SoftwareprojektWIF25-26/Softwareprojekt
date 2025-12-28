// src/app/routes/index.ts
import { Router } from 'express';
import projectRoutes from './projectRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import startpageRoutes from './homeview_routes.ts';
import calculationRoutes from './calcRoutes.js';
import configRoutes from './configRoutes.js';

const router = Router();

// Alle Routes montieren
router.use('/projects', projectRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/homeview', startpageRoutes);
router.use('/calculation', calculationRoutes);
router.use('/config', configRoutes);

export default router;