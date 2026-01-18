import {Router, Request, Response, NextFunction} from 'express';
import {validationResult} from "express-validator";
import {SettingsService} from "../services/settings/settings.service.ts";

const router = Router();
const SETTINGS_ID = 1
/**
 * GET /settings
 * Frontend: getWeights()
 */
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success: false, errors: errors.array()});
        }
        try {
            const weights = await SettingsService.getWeightsSettings(SETTINGS_ID);
            res.json(weights);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /settings
 * Frontend: patchWeights()
 */
router.patch('/settings', async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success: false, errors: errors.array()});
        }
        try {
            const weights = await SettingsService.patchWeightsSettings(SETTINGS_ID,req.body);
            res.json({
                success: true,
                data: weights,
            });
        } catch (error) {
            next(error);
        }
    }
)
