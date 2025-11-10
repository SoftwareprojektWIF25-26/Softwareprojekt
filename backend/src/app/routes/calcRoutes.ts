// src/app/routes/calcRoutes.ts

import { Router, Request, Response } from 'express';
import { calculationService } from '../services/calculationService.js'; // oder aktueller Pfad
import { CalculationRequest, CalculationResponse } from '../types.js';

const router = Router();

// Hauptendpoint: Projektmetriken berechnen
router.post('/calculate', (req: Request, res: Response) => {
    try {
        const request: CalculationRequest = req.body;

        if (!request.inputs || !Array.isArray(request.inputs)) {
            return res.status(400).json({
                success: false,
                error: 'Inputs array ist erforderlich'
            });
        }
        if (!request.projectType) {
            return res.status(400).json({
                success: false,
                error: 'ProjectType ist erforderlich'
            });
        }
        if (!request.teamSize || request.teamSize < 1) {
            return res.status(400).json({
                success: false,
                error: 'Teamgröße muss mindestens 1 sein'
            });
        }

        const metrics = calculationService.calculate(request);

        const response: CalculationResponse = {
            success: true,
            metrics
        };

        res.json(response);
    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});

// Endpoint: Gewichte validieren/normalisieren
router.post('/weights/validate', (req: Request, res: Response) => {
    try {
        const { weights } = req.body;

        if (!weights || typeof weights !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Weights object ist erforderlich'
            });
        }

        const weightValues = Object.values(weights) as number[];
        const sum = weightValues.reduce((a, b) => a + b, 0);

        const normalizedWeights: Record<string, number> = {};
        Object.keys(weights).forEach(key => {
            normalizedWeights[key] = weights[key] / sum;
        });

        res.json({
            success: true,
            originalSum: sum,
            normalizedWeights
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});

export default router;
