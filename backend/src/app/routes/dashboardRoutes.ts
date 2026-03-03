// src/app/routes/dashboardRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
// src/app/routes/dashboardRoutes.ts
import { DashboardService } from '../services/dashboard/dashboard.service.ts';
import { ProjectService } from '../services/project/project.service.ts';

const router = Router();
const dashboardService = new DashboardService();
const projectService = new ProjectService();

/**
 * Hilfsfunktion:
 * Mapped das „fette“ Dashboard-Objekt aus dem Service
 * auf ein einfaches Projekt-Objekt so wie die ursprünglichen Demo-Daten.
 *
 * Damit bleibt getProjektById(id): Promise<Projekt> kompatibel.
 */
function mapDashboardToProjekt(dashboard: Awaited<ReturnType<DashboardService['getProjectDashboard']>>) {
    return {
        id: dashboard.project.id,
        name: dashboard.project.title,
        type: dashboard.project.domain,
        status: dashboard.project.status,
        lastModified: dashboard.project.updatedAt,
        description: `Projekt: ${dashboard.project.title}`,
    };
}

/**
 * GET /api/dashboard/:id
 * Frontend: getProjektById(id)
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const dashboard = await dashboardService.getProjectDashboard(id);

        res.json({
            success: true,
            data: dashboard  // ← Vollständiges Objekt!
        });
    } catch (error) {
        console.error('Error in GET /api/dashboard/:id', error);
        next(error);
    }
});

/**
 * PATCH /api/dashboard/:id/details
 * Aktualisiert Projekttitel und Domain
 * Frontend: updateProjectDetails(id, { title, domain })
 */
router.patch(
    '/:id/details',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = req.body as { title?: string; domain?: string };

            const projectId = parseInt(id, 10);
            if (isNaN(projectId)) {
                res.status(400).json({
                    success: false,
                    message: 'Ungültige Projekt-ID'
                });
                return;
            }

            const result = await dashboardService.updateProjectDetails(projectId, data);

            res.json({
                success: true,
                data: result,
                message: 'Projektdetails erfolgreich aktualisiert'
            });
        } catch (error) {
            console.error('Error in PATCH /api/dashboard/:id/details', error);
            next(error);
        }
    }
);






/**
 * PATCH /api/dashboard/:id/config/:configType
 * Aktualisiert spezifische Konfigurationsbereiche (z.B. businessUnderstanding)
 */
router.patch(
    '/:id/config/:configType',
    async (req: Request<{ id: string; configType: string }>, res: Response, next: NextFunction) => {
        try {
            const { id, configType } = req.params;
            const data = req.body;

            // Validierung des configType
            const validTypes = [
                'businessUnderstanding',
                'dataCharacteristics',
                'analysisConfig',
                'deploymentConfig',
                'utilizationConfig'
            ];

            if (!validTypes.includes(configType)) {
                res.status(400).json({
                    success: false,
                    message: `Ungültiger Config-Type. Erlaubt sind: ${validTypes.join(', ')}`
                });
                return;
            }

            const result = await dashboardService.updateProjectConfig(
                id,
                configType as any,
                data
            );

            res.json({
                success: true,
                data: result,
                message: 'Konfiguration erfolgreich aktualisiert'
            });
        } catch (error) {
            console.error(`Error in PATCH /api/dashboard/${req.params.id}/config/${req.params.configType}`, error);
            next(error);
        }
    }
);



/**
 * GET /api/dashboard/:id/timeline
 * Frontend: getTimeline(id)
 */
router.get('/:id/timeline', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const timeline = await dashboardService.getProjectTimeline(id);

        res.json(timeline);
    } catch (error) {
        console.error('Error in GET /api/dashboard/:id/timeline', error);
        next(error);
    }
});

/**
 * PATCH /api/dashboard/tasks/:id/status
 * Frontend: patchTaskStatus(id, status)
 */
router.patch(
    '/tasks/:id/status',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body as { status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' };

            const task = await dashboardService.updateTaskStatus(id, status);

            res.json({
                success: true,
                data: task,
                message: 'Task-Status erfolgreich aktualisiert',
            });
        } catch (error) {
            console.error('Error in PATCH /api/dashboard/tasks/:id/status', error);
            next(error);
        }
    }
);

/**
 * PATCH /api/dashboard/:id/status
 * Frontend: patchProjektStatus(id, status)
 */
router.patch(
    '/:id/status',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body as { status: any }; // Typ kannst du bei Bedarf schärfen

            const project = await dashboardService.updateProjectStatus(id, status);

            res.json({
                success: true,
                data: project,
                message: 'Projektstatus erfolgreich aktualisiert',
            });
        } catch (error) {
            console.error('Error in PATCH /api/dashboard/:id/status', error);
            next(error);
        }
    }
);

/**
 * PATCH /api/dashboard/:id/template-phase/:phase/status
 * Frontend: patchTemplatePhase(id, phase)
 */
router.patch(
    '/:id/template-phase/:phase/status',
    async (req: Request<{ id: string; phase: string }>, res: Response, next: NextFunction) => {
        try {
            const { id, phase } = req.params;
            const { status } = req.body as { status: any };

            const result = await dashboardService.updateTemplatePhaseStatus(
                id,
                phase as
                    | 'businessUnderstanding'
                    | 'dataCharacteristics'
                    | 'analysisConfig'
                    | 'deploymentConfig'
                    | 'utilizationConfig',
                status
            );

            res.json({
                success: true,
                data: result,
                message: 'Template-Phase-Status erfolgreich aktualisiert',
            });
        } catch (error) {
            console.error('Error in PATCH /api/dashboard/:id/template-phase/:phase/status', error);
            next(error);
        }
    }
);

/**
 * POST /api/dashboard/:id/evaluations
 * Frontend: postEvaluation(id)
 */
router.post(
    '/:id/evaluations',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { category, rating, notes } = req.body as {
                category: string;
                rating: number;
                notes?: string;
            };

            const evaluation = await dashboardService.addProjectEvaluation(id, category, rating, notes);

            res.status(201).json({
                success: true,
                data: evaluation,
                message: 'Evaluierung erfolgreich hinzugefügt',
            });
        } catch (error) {
            console.error('Error in POST /api/dashboard/:id/evaluations', error);
            next(error);
        }
    }
);

/**
 * POST /api/dashboard/:id/recalculate
 * Neuberechnung des Projektplans nach Änderungen an den Projektdaten.
 * Frontend: recalculateProjectPlan(id)
 */

router.post(
    '/:id/recalculate',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await projectService.recalculateProjectPlan(id);

            res.json({
                success: true,
                data: result,
                message: 'Projektplan erfolgreich neu berechnet'
            });
        } catch (error) {
            console.error('Error in POST /api/dashboard/:id/recalculate', error);
            next(error);
        }
    }
);


export default router;
