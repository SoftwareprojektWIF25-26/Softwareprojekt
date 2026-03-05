// src/app/routes/calcRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { calculationService } from '../services/calculation/calculationService.ts';
import { CalculationRequest } from '../types.ts';


const router = Router();

//
// HANDLER FUNKTIONEN
//

/**
 * Berechnet Projektmetriken auf Basis der übergebenen Inputs (ohne DB-Speicherung)
 */
const estimateProjectMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = req.body as CalculationRequest;

        // --- 1. Validierung ---
        const missingFields: string[] = [];

        if (!request.inputs || !Array.isArray(request.inputs)) {
            missingFields.push('inputs (muss ein Array sein)');
        }
        if (!request.projectType) {
            missingFields.push('projectType');
        }
        if (!request.teamSize || request.teamSize < 1) {
            missingFields.push('teamSize (muss mindestens 1 sein)');
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Validierungsfehler. Folgende Felder fehlen oder sind ungültig: ${missingFields.join(', ')}`,
            });
        }

        // --- 2. Berechnung ausführen ---
        const metrics = calculationService.calculate(request);

        // --- 3. Erfolgreiche Antwort ---
        return res.json({
            success: true,
            data: metrics,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Validiert ein Objekt von Gewichten und gibt diese normalisiert (Summe = 1) zurück
 */
const validateAndNormalizeWeights = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { weights } = req.body as { weights: Record<string, number> };

        // --- 1. Validierung ---
        if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
            return res.status(400).json({
                success: false,
                error: 'Weights object ist erforderlich (darf kein Array sein)',
            });
        }

        // --- 2. Berechnung der Normalisierung ---
        const entries = Object.entries(weights);
        const sum = entries.reduce((total, [_, value]) => total + (Number(value) || 0), 0);

        if (sum === 0) {
            return res.status(400).json({
                success: false,
                error: 'Die Summe der Gewichte darf nicht 0 sein',
            });
        }

        // Gewichte normalisieren (jeder Wert / Gesamtsumme)
        const normalizedWeights = entries.reduce((acc, [key, value]) => {
            acc[key] = (Number(value) || 0) / sum;
            return acc;
        }, {} as Record<string, number>);

        // --- 3. Erfolgreiche Antwort ---
        return res.json({
            success: true,
            data: {
                originalSum: sum,
                normalizedWeights,
            },
        });

    } catch (error) {
        next(error);
    }
};

//
// ROUTEN-DEFINITIONEN
//

router.post('/estimate', estimateProjectMetrics);
router.post('/validate-weights', validateAndNormalizeWeights);

export default router;