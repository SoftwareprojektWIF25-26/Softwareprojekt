// settings.routes.ts
import {Router, Request, Response, NextFunction} from 'express';
import {validationResult} from "express-validator";
import {SettingsService} from "../services/settings/settings.service.ts";

const router = Router();
const SETTINGS_ID = 1;
const settingsService = new SettingsService();

/**
 * GET /settings
 * Frontend: getWeights()
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    try {
        const weights = await settingsService.getWeightsSettings(SETTINGS_ID);
        res.json({
            success: true,
            data: weights
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /settings
 * Frontend: patchWeights()
 */
router.patch('/', async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success: false, errors: errors.array()});
    }
    try {
        const weights = await settingsService.patchWeightsSettings(SETTINGS_ID, req.body);
        res.json({
            success: true,
            data: weights,
        });
    } catch (error) {
        next(error);
    }
});

export default router;