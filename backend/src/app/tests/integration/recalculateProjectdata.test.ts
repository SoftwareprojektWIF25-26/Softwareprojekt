import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../../routes/dashboardRoutes';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

// Echte Express-App für den Test aufbauen
const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard Integration Tests: Recalculate & Config Updates', () => {
    // DB Verbindung herstellen
    beforeAll(async () => {
        await prisma.$connect();
    });

    // DB Verbindung trennen
    afterAll(async () => {
        await prisma.$disconnect();
    });

    // Datenbank vor jedem Test leeren
    beforeEach(async () => {
        await prisma.project.deleteMany();
    });

    describe('POST /api/dashboard/:id/recalculate', () => {
        it('gibt 200 und success:true zurück, wenn das Projekt existiert und berechnet wird', async () => {
            // Arrange: Ein echtes Projekt mit den nötigen Phasen anlegen
            const project = await prisma.project.create({
                data: {
                    title: 'Test Projekt Recalculate',
                    domain: 'Finance',
                    status: ProjectStatus.INPROGRESS,
                    wizardStep: 6,
                    wizardCompleted: true,

                    businessUnderstanding: {
                        create: { status: 'COMPLETED', teamSize: 3 }
                    },
                    dataCharacteristics: { create: { status: 'COMPLETED' } },
                    analysisConfig: { create: { status: 'COMPLETED' } },
                    deploymentConfig: { create: { status: 'COMPLETED' } },
                    utilizationConfig: { create: { status: 'COMPLETED' } }
                }
            });

            // Act: Route aufrufen
            const res = await request(app)
                .post(`/api/dashboard/${project.id}/recalculate`)
                .send();

            // Assert
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.projectId).toBe(project.id);
            expect(res.body.message).toBe('Projektplan erfolgreich neu berechnet');

            // Verifizieren, dass der Projektplan wirklich in der DB erstellt wurde
            const createdPlan = await prisma.projectPlan.findUnique({
                where: { projectId: project.id }
            });
            expect(createdPlan).not.toBeNull();
        });

        it('gibt 500 zurück wenn das Projekt nicht existiert (Service schlägt fehl)', async () => {

            const res = await request(app)
                .post('/api/dashboard/9999/recalculate')
                .send();

            // Assert
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /api/dashboard/:id/config/:configType + POST /recalculate (Flow)', () => {
        it('führt den vollen Update+Recalculate-Flow erfolgreich aus', async () => {
            // Arrange: Neues Projekt inkl. Analysis Config anlegen
            const project = await prisma.project.create({
                data: {
                    title: 'Flow Test Projekt',
                    domain: 'Healthcare',
                    status: ProjectStatus.INPROGRESS,
                    wizardCompleted: true,
                    businessUnderstanding: { create: { status: 'COMPLETED', teamSize: 2 } },
                    dataCharacteristics: { create: { status: 'COMPLETED' } },
                    analysisConfig: {
                        create: {
                            status: 'COMPLETED',
                            typeOfAnalytics: 'CLASSIFICATION' // Initialer Wert
                        }
                    },
                    deploymentConfig: { create: { status: 'COMPLETED' } },
                    utilizationConfig: { create: { status: 'COMPLETED' } }
                }
            });

            // Act Schritt 1: Config ändern (PATCH)
            const patchRes = await request(app)
                .patch(`/api/dashboard/${project.id}/config/analysisConfig`)
                .send({ typeOfAnalytics: 'REGRESSION' });

            // Assert Schritt 1
            expect(patchRes.status).toBe(200);
            expect(patchRes.body.success).toBe(true);

            // Verifizieren in DB: Wurde der Wert wirklich auf REGRESSION geändert?
            const updatedConfig = await prisma.analysisConfig.findUnique({
                where: { projectId: project.id }
            });
            expect(updatedConfig?.typeOfAnalytics).toBe('REGRESSION');

            // Act Schritt 2: Neuberechnung auslösen (POST)
            const recalcRes = await request(app)
                .post(`/api/dashboard/${project.id}/recalculate`)
                .send();

            // Assert Schritt 2
            expect(recalcRes.status).toBe(200);
            expect(recalcRes.body.success).toBe(true);

            const newPlan = await prisma.projectPlan.findUnique({
                where: { projectId: project.id }
            });
            expect(newPlan).not.toBeNull();
        });

        it('blockiert ungültige configType mit 400', async () => {
            // Arrange
            const project = await prisma.project.create({
                data: { title: 'Invalid Config Test' }
            });

            // Act
            const res = await request(app)
                .patch(`/api/dashboard/${project.id}/config/nichtExistent`)
                .send({ someField: 'wert' });

            // Assert: DashboardRoutes validiert configType und wirft 400
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Ungültiger Config-Type');
        });
    });
});
