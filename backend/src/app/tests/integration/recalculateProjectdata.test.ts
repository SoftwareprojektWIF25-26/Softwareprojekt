
import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../dashboardRoutes.ts';
import { ProjectService } from '../../services/project/project.service.ts';
import { DashboardService } from '../../services/dashboard/dashboard.service.ts';

// Services komplett mocken
jest.mock('../../services/project/project.service.ts');
jest.mock('../../services/dashboard/dashboard.service.ts');

const MockedProjectService = ProjectService as jest.MockedClass<typeof ProjectService>;
const MockedDashboardService = DashboardService as jest.MockedClass<typeof DashboardService>;

// Test-App aufbauen
const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('POST /api/dashboard/:id/recalculate', () => {
    beforeEach(() => jest.clearAllMocks());

    it('gibt 200 und success:true zurück', async () => {
        MockedProjectService.prototype.recalculateProjectPlan.mockResolvedValue({
            success: true,
            projectId: 14,
            message: 'Projektplan erfolgreich neu berechnet',
            metrics: { durationWeeks: 12 } as any,
        });

        const res = await request(app)
            .post('/api/dashboard/14/recalculate')
            .send();

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.projectId).toBe(14);
    });

    it('gibt 500 zurück wenn Service fehlschlägt', async () => {
        MockedProjectService.prototype.recalculateProjectPlan.mockRejectedValue(
            new Error('Projekt nicht gefunden')
        );

        const res = await request(app)
            .post('/api/dashboard/99/recalculate')
            .send();

        expect(res.status).toBe(500);
    });
});

describe('PATCH /api/dashboard/:id/config/:configType + POST /recalculate (Flow)', () => {
    it('führt den vollen Update+Recalculate-Flow erfolgreich aus', async () => {
        // 1. Config-Update Mock
        MockedDashboardService.prototype.updateProjectConfig.mockResolvedValue({
            projectId: 14,
            typeOfAnalytics: 'REGRESSION',
        } as any);

        // 2. Recalculate Mock
        MockedProjectService.prototype.recalculateProjectPlan.mockResolvedValue({
            success: true,
            projectId: 14,
            message: 'Projektplan erfolgreich neu berechnet',
            metrics: { durationWeeks: 10 } as any,
        });

        // Schritt 1: Config ändern
        const patchRes = await request(app)
            .patch('/api/dashboard/14/config/analysisConfig')
            .send({ typeOfAnalytics: 'REGRESSION' });

        expect(patchRes.status).toBe(200);
        expect(patchRes.body.success).toBe(true);

        // Schritt 2: Neuberechnung auslösen
        const recalcRes = await request(app)
            .post('/api/dashboard/14/recalculate')
            .send();

        expect(recalcRes.status).toBe(200);
        expect(recalcRes.body.success).toBe(true);

        // Sicherstellen, dass beide Services korrekt aufgerufen wurden
        expect(MockedDashboardService.prototype.updateProjectConfig)
            .toHaveBeenCalledWith('14', 'analysisConfig', { typeOfAnalytics: 'REGRESSION' });
        expect(MockedProjectService.prototype.recalculateProjectPlan)
            .toHaveBeenCalledWith('14');
    });

    it('blockiert ungültige configType mit 400', async () => {
        const res = await request(app)
            .patch('/api/dashboard/14/config/nichtExistent')
            .send({ someField: 'wert' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
