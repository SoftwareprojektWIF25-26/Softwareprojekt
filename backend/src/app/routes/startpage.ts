// src/routes/startpage.ts
import {NextFunction, Request, Response, Router} from 'express';
import { query, validationResult } from 'express-validator';
import { StartPageService } from '../services/startpage.ts';

const router = Router();
const startPageService = new StartPageService();

/**
 * GET /api/startpage
 */
router.get(
    '/',
    [
        query('workspaceId').optional().isString(),
        query('search').optional().isString(),
        query('status').optional().isIn(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']),
        query('sortBy').optional().isIn(['updatedAt', 'createdAt', 'title']),
        query('sortOrder').optional().isIn(['asc', 'desc'])
    ],

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { workspaceId, search, status, sortBy, sortOrder } = req.query as any;

            const data = await startPageService.getStartPageData({
                workspaceId,
                search,
                status,
                sortBy: sortBy || 'updatedAt',
                sortOrder: sortOrder || 'desc'
            });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/startpage/statistics
 */
router.get(
    '/statistics',
    query('workspaceId').optional().isString(),

    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { workspaceId } = req.query as any;
            const statistics = await startPageService.getStatistics(workspaceId);

            res.json({ success: true, data: statistics });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/startpage/recent-projects
 */
router.get(
    '/recent-projects',
    query('workspaceId').optional().isString(),

    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { workspaceId } = req.query as any;
            const recentProjects = await startPageService.getRecentProjects(workspaceId, 5);

            res.json({ success: true, data: recentProjects });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
