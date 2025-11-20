// src/app/routes/startpageRoutes.ts
import { Router } from 'express';

const router = Router();

// Demo-Daten
// TODO: Projektdaten aus der Datenbank holen
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

// GET /api/startpage
router.get('/', (req, res) => {
    res.json(demoProjects);
});

// GET /api/startpage/statistics
router.get('/statistics', (req, res) => {
    res.json({
        totalProjects: demoProjects.length,
        inProgress: demoProjects.filter((p) => p.status === 'in_progress').length,
        planned: demoProjects.filter((p) => p.status === 'planned').length,
        completed: demoProjects.filter((p) => p.status === 'done').length,
    });
});

// GET /api/startpage/recent-projects
router.get('/recent-projects', (req, res) => {
    const recent = [...demoProjects].sort((a, b) =>
        a.lastModified < b.lastModified ? 1 : -1
    );
    res.json(recent);
});

export default router;
