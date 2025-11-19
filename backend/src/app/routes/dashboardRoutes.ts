// src/app/routes/dashboardRoutes.ts
import { Router } from 'express';

const router = Router();

// TODO: DB anbinden, wie in startpage
const demoProjects = [
    {
        id: 1,
        name: 'Demo Projekt Reporting',
        type: 'REPORTING',
        status: 'in_progress',
        lastModified: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'ML Use Case',
        type: 'CLASSIC_ML',
        status: 'planned',
        lastModified: new Date().toISOString(),
    },
];

// GET /api/dashboard/:id
router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    const projekt = demoProjects.find((p) => p.id === id);

    if (!projekt) {
        return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }

    res.json({
        ...projekt,
        description: 'Dies ist ein Demo-Projekt vom Backend.',
    });
});

// GET /api/dashboard/:id/timeline
router.get('/:id/timeline', (req, res) => {
    const id = Number(req.params.id);

    res.json([
        {
            id: 1,
            projectId: id,
            label: 'Projekt angelegt',
            date: new Date().toISOString(),
        },
        {
            id: 2,
            projectId: id,
            label: 'Initiales Scoping',
            date: new Date().toISOString(),
        },
    ]);
});

// POST /api/dashboard/:id/evaluations
router.post('/:id/evaluations', (req, res) => {
    const { id } = req.params;
    const data = req.body;
    // TODO: speichern
    res.json({
        success: true,
        message: `Evaluation für Projekt ${id} gespeichert`,
        data,
    });
});

// PATCH /api/dashboard/:id/status
router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    res.json({
        success: true,
        message: `Status für Projekt ${id} auf ${status} geändert`,
    });
});

// PATCH /api/dashboard/tasks/:id/status
router.patch('/tasks/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    res.json({
        success: true,
        message: `Task ${id} Status auf ${status} geändert`,
    });
});

// PATCH /api/dashboard/:id/template-phase/:phase/status
router.patch('/:id/template-phase/:phase/status', (req, res) => {
    const { id, phase } = req.params;
    const { status } = req.body;

    res.json({
        success: true,
        message: `Phase ${phase} für Projekt ${id} auf ${status} geändert`,
    });
});

export default router;
