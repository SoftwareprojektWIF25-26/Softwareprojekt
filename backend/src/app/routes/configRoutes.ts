// src/app/routes/configRoutes.ts
import { Router, Request, Response } from 'express';
import { defaultFields } from '../config/defaultFields.js';
import { defaultWeights } from '../config/defaultWeights.js';

const router = Router();

/**
 * GET /api/config/fields/default
 * Standard-Eingabefelder abrufen
 */
router.get('/fields/default', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: defaultFields
    });
});

/**
 * GET /api/config/weights/default
 * Standard-Gewichte abrufen
 */
router.get('/weights/default', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: defaultWeights
    });
});

export default router;