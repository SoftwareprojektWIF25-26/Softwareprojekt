// src/app/routes/configRoutes.ts

import { Router, Request, Response } from 'express';
import { defaultFields } from '../config/defaultFields.js';
import { defaultWeights } from '../config/defaultWeights.js';

const router = Router();

// Endpoint: Standard-Eingabefelder abrufen
router.get('/fields/default', (req: Request, res: Response) => {
    res.json(defaultFields);
});

// Endpoint: Standard-Gewichte abrufen
router.get('/weights/default', (req: Request, res: Response) => {
    res.json(defaultWeights);
});

export default router;
