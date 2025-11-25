// src/app/routes/startpageRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { StartPageService } from '../services/startpage.js'; // Pfad passt, weil routes & services unter app liegen

const router = Router();
const startPageService = new StartPageService();

/**
 * GET /api/startpage
 * Frontend: getProjektListe()
 */
router.get(
    '/',
    [
        query('workspaceId').optional().isString(),
        query('search').optional().isString(),
        query('status')
            .optional()
            .isIn(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
        query('sortBy').optional().isIn(['updatedAt', 'createdAt', 'title']),
        query('sortOrder').optional().isIn(['asc', 'desc']),
    ],
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Fehlerfall darf ruhig Wrapper haben, Frontend nutzt das aktuell eh nicht explizit
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { workspaceId, search, status, sortBy, sortOrder } = req.query as any;

            const data = await startPageService.getStartPageData({
                workspaceId,
                search,
                status,
                sortBy: sortBy || 'updatedAt',
                sortOrder: sortOrder || 'desc',
            });

            // WICHTIG: direkt Daten zurückgeben, damit getProjektListe().then(res => res.data)
            // weiter funktioniert (res.data = Array<Projekt>)
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/startpage/statistics
 * Frontend: getStatistiken()
 */
router.get(
    '/statistics',
    query('workspaceId').optional().isString(),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { workspaceId } = req.query as any;
            const statistics = await startPageService.getStatistics(workspaceId);

            // Frontend erwartet direkt das Statistics-Objekt
            res.json(statistics);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/startpage/recent-projects
 * Frontend: getZuletztBearbeitet()
 */
router.get(
    '/recent-projects',
    query('workspaceId').optional().isString(),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { workspaceId } = req.query as any;
            const recentProjects = await startPageService.getRecentProjects(workspaceId, 5);

            // Frontend erwartet direkt ein Array von Projekten
            res.json(recentProjects);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
