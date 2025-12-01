// src/app/routes/projectRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ProjectService } from '../services/CRUD-Project.ts';

const router = Router();
const projectService = new ProjectService();

/**
 * POST /api/projects
 * Neues Projekt erstellen (initial, minimal)
 */
router.post(
    '/',
    [
        body('title').notEmpty().withMessage('Titel ist erforderlich'),
        body('domain').optional().isString(),

    ],
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { title, domain } = req.body;

            const project = await projectService.createProject({
                title,
                domain,

            });

            res.status(201).json({
                success: true,
                data: project,
                message: 'Projekt erfolgreich erstellt'
            });
        } catch (error) {
            console.error('Error in POST /api/projects', error);
            next(error);
        }
    }
);

/**
 * GET /api/projects/:id
 * Projekt mit allen Details abrufen
 */
router.get(
    '/:id',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const project = await projectService.getProjectById(id);

            res.json(project);
        } catch (error) {
            console.error('Error in GET /api/projects/:id', error);
            next(error);
        }
    }
);

/**
 * PATCH /api/projects/:id
 * Projekt-Basisdaten aktualisieren
 */
router.patch(
    '/:id',
    [
        body('title').optional().isString(),
        body('domain').optional().isString(),
        body('status')
            .optional()
            .isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
        body('startDate').optional().isISO8601(),
        body('endDate').optional().isISO8601(),
        body('wizardStep').optional().isInt({ min: 0, max: 6 }),
        body('wizardCompleted').optional().isBoolean()
    ],
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { id } = req.params;
            const updateData = req.body;

            // Datum-Strings zu Date-Objekten konvertieren
            if (updateData.startDate) {
                updateData.startDate = new Date(updateData.startDate);
            }
            if (updateData.endDate) {
                updateData.endDate = new Date(updateData.endDate);
            }

            const project = await projectService.updateProject(id, updateData);

            res.json({
                success: true,
                data: project,
                message: 'Projekt erfolgreich aktualisiert'
            });
        } catch (error) {
            console.error('Error in PATCH /api/projects/:id', error);
            next(error);
        }
    }
);

/**
 * DELETE /api/projects/:id
 * Projekt löschen
 */
router.delete(
    '/:id',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            // Route Parameter extrahieren
            // Beispiel: Bei URL "/api/projects/42" ist id = "42"
            const { id } = req.params;

            // 2. Service-Methode aufrufen
            const result = await projectService.deleteProject(id);

            // 3. Erfolgs-Response zurückgeben
            // HTTP 200 OK (Express default)
            // Body: { success: true, message: "..." }
            res.json(result);
        } catch (error) {
            console.error('Error in DELETE /api/projects/:id', error);
            next(error);
        }
    }
);

/**
 * PATCH /api/projects/:id/business-understanding
 * Business Understanding Phase aktualisieren
 */
router.patch(
    '/:id/business-understanding',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const result = await projectService.updateBusinessUnderstanding(id, data);

            res.json({
                success: true,
                data: result,
                message: 'Business Understanding erfolgreich aktualisiert'
            });
        } catch (error) {
            console.error('Error in PATCH /api/projects/:id/business-understanding', error);
            next(error);
        }
    }
);

/**
 * PATCH /api/projects/:id/data-characteristics
 * Data Characteristics Phase aktualisieren
 */
router.patch(
    '/:id/data-characteristics',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const result = await projectService.updateDataCharacteristics(id, data);

            res.json({
                success: true,
                data: result,
                message: 'Data Characteristics erfolgreich aktualisiert'
            });
        } catch (error) {
            console.error('Error in PATCH /api/projects/:id/data-characteristics', error);
            next(error);
        }
    }
);

/**
 * POST /api/projects/:id/complete-wizard
 * Wizard abschließen und Projektplan generieren
 */
router.post(
    '/:id/complete-wizard',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const result = await projectService.completeWizard(id);

            res.json(result);
        } catch (error) {
            console.error('Error in POST /api/projects/:id/complete-wizard', error);
            next(error);
        }
    }
);

/**
 * POST /api/projects/:id/plan
 * ProjectPlan aus Calculation-Metriken erstellen
 */
router.post(
    '/:id/plan',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { metrics } = req.body; // ProjectMetrics vom Frontend

            const projectPlan = await projectService.createProjectPlanFromMetrics(
                id,
                metrics
            );

            res.status(201).json({
                success: true,
                data: projectPlan,
                message: 'Projektplan erfolgreich erstellt'
            });
        } catch (error) {
            console.error('Error in POST /api/projects/:id/plan', error);
            next(error);
        }
    }
);

export default router;