// src/app/routes/calcRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { calculationService } from '../services/calculation/calculationService.ts';
import { CalculationRequest } from '../types.ts';

const router = Router();

/**
 * POST /api/calculation/estimate
 * Projektmetriken berechnen (ohne Speicherung)
 */
router.post(
    '/estimate',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const request = req.body as CalculationRequest;

            // Validierung
            if (!request.inputs || !Array.isArray(request.inputs)) {
                return res.status(400).json({
                    success: false,
                    error: 'Inputs array ist erforderlich',
                });
            }

            if (!request.projectType) {
                return res.status(400).json({
                    success: false,
                    error: 'ProjectType ist erforderlich',
                });
            }

            if (!request.teamSize || request.teamSize < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Teamgröße muss mindestens 1 sein',
                });
            }

            const metrics = calculationService.calculate(request);

            res.json({
                success: true,
                data: metrics,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/calculation/validate-weights
 * Gewichte validieren und normalisieren
 */
router.post(
    '/validate-weights',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { weights } = req.body;

            if (!weights || typeof weights !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'Weights object ist erforderlich',
                });
            }

            const weightValues = Object.values(weights) as number[];
            const sum = weightValues.reduce((a, b) => a + b, 0);

            const normalizedWeights: Record<string, number> = {};
            Object.keys(weights).forEach((key) => {
                normalizedWeights[key] = weights[key] / sum;
            });

            res.json({
                success: true,
                data: {
                    originalSum: sum,
                    normalizedWeights
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;