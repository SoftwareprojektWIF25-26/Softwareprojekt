// src/routes/dashboard.ts
import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { DashboardService } from '../services/dashboard.ts';

const router = Router();
const dashboardService = new DashboardService();

/**
 * GET /api/dashboard
 * Holt alle Daten für die Startseite
 * - Optionaler Query-Parameter: ?workspaceId=...
 */
router.get(
    '/',
    //  Validierungs-Middleware
    query('workspaceId').optional().isString().withMessage('workspaceId muss ein String sein'),

    async (req, res, next) => {
        // Prüfe auf Validierungs-Fehler
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // workspaceId wird jetzt sicher als string | undefined typisiert
            const { workspaceId } = req.query as { workspaceId?: string };

            const data = await dashboardService.getDashboardData(workspaceId);

            res.json(data);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
