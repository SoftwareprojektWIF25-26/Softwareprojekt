// src/routes/dashboard.ts
import { Router, Request, Response, NextFunction } from 'express';
import { param, body, validationResult } from 'express-validator';
import { DashboardService } from '../services/dashboard.ts';

const router = Router();
const dashboardService = new DashboardService();

// Interfaces für Route Params (bleiben String, da Express Params immer Strings sind)
interface ProjectIdParams {
    projectId: string;
}

interface TaskIdParams {
    taskId: string;
}

interface PhaseParams {
    projectId: string;
    phase: string;
}

/**
 * GET /api/dashboard/:projectId
 */
router.get(
    '/:projectId',
    param('projectId')
        .isInt({ min: 1 })
        .withMessage('projectId muss eine positive Zahl sein'),

    async (req: Request<ProjectIdParams>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { projectId } = req.params;
            const data = await dashboardService.getProjectDashboard(projectId);

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/dashboard/:projectId/timeline
 */
router.get(
    '/:projectId/timeline',
    param('projectId')
        .isInt({ min: 1 })
        .withMessage('projectId muss eine positive Zahl sein'),

    async (req: Request<ProjectIdParams>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { projectId } = req.params;
            const timeline = await dashboardService.getProjectTimeline(projectId);

            res.json({
                success: true,
                data: timeline
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/dashboard/tasks/:taskId/status
 */
router.patch(
    '/tasks/:taskId/status',
    [
        param('taskId')
            .isInt({ min: 1 })
            .withMessage('taskId muss eine positive Zahl sein'),
        body('status')
            .isIn(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'])
            .withMessage('Status muss TODO, IN_PROGRESS, BLOCKED oder DONE sein')
    ],

    async (req: Request<TaskIdParams>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { taskId } = req.params;
            const { status } = req.body;

            const task = await dashboardService.updateTaskStatus(taskId, status);

            res.json({
                success: true,
                data: task,
                message: 'Task-Status erfolgreich aktualisiert'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/dashboard/:projectId/status
 */
router.patch(
    '/:projectId/status',
    [
        param('projectId')
            .isInt({ min: 1 })
            .withMessage('projectId muss eine positive Zahl sein'),
        body('status')
            .isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
            .withMessage('Ungültiger Projektstatus')
    ],

    async (req: Request<ProjectIdParams>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { projectId } = req.params;
            const { status } = req.body;

            const project = await dashboardService.updateProjectStatus(projectId, status);

            res.json({
                success: true,
                data: project,
                message: 'Projektstatus erfolgreich aktualisiert'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/dashboard/:projectId/template-phase/:phase/status
 */
router.patch(
    '/:projectId/template-phase/:phase/status',
    [
        param('projectId')
            .isInt({ min: 1 })
            .withMessage('projectId muss eine positive Zahl sein'),
        param('phase')
            .isIn(['businessUnderstanding', 'dataCharacteristics', 'analysisConfig', 'deploymentConfig', 'utilizationConfig'])
            .withMessage('Ungültige Phase'),
        body('status')
            .isIn(['BLOCKED', 'READY', 'DRAFT', 'COMPLETED'])
            .withMessage('Status muss BLOCKED, READY, DRAFT oder COMPLETED sein')
    ],

    async (req: Request<PhaseParams>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { projectId, phase } = req.params;
            const { status } = req.body;

            const result = await dashboardService.updateTemplatePhaseStatus(
                projectId,
                phase as 'businessUnderstanding' | 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig',
                status as any
            );

            res.json({
                success: true,
                data: result,
                message: 'Template-Phase-Status erfolgreich aktualisiert'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/dashboard/:projectId/evaluations
 */
router.post(
    '/:projectId/evaluations',
    [
        param('projectId')
            .isInt({ min: 1 })
            .withMessage('projectId muss eine positive Zahl sein'),
        body('category').isString().notEmpty().withMessage('Kategorie ist erforderlich'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating muss zwischen 1 und 5 liegen'),
        body('notes').optional().isString()
    ],

    async (req: Request<ProjectIdParams>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { projectId } = req.params;
            const { category, rating, notes } = req.body;

            const evaluation = await dashboardService.addProjectEvaluation(
                projectId,
                category,
                rating,
                notes
            );

            res.status(201).json({
                success: true,
                data: evaluation,
                message: 'Evaluierung erfolgreich hinzugefügt'
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
