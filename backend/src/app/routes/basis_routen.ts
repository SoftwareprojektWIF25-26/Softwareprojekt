
import { Router } from 'express';
import projectRoutes from './projectRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import startpageRoutes from './homeview_routes.ts';
import calculationRoutes from './calcRoutes.js';
import configRoutes from './configRoutes.js';
import settingsRoutes from "./settingsRoutes.ts";
import categoryRoutes from './project_categorie.ts'

const router = Router();

// Alle Routen aufgelistet
router.use('/projects', projectRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/homeview', startpageRoutes);
router.use('/calculation', calculationRoutes);
router.use('/config', configRoutes);
router.use('/settings', settingsRoutes);
router.use('/categories', categoryRoutes)

export default router;