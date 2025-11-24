import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';


// Pfad ggf. anpassen, falls deine Ordnerstruktur anders ist
import projectRoutes from '../routes/CreaProjRoutes.ts';

const app = express();
app.use(express.json());
// Wir mounten die Routes genau wie in index.ts
app.use('/api/projects', projectRoutes);

const prisma = new PrismaClient();

describe('E2E Project Wizard Flow', () => {
    let projectId: string;

    beforeAll(async () => {
        await prisma.$connect();
        // Sicherstellen, dass ein Default Workspace existiert
        const ws = await prisma.localWorkspace.findFirst();
        if (!ws) {
            await prisma.localWorkspace.create({ data: { name: 'Default Workspace' } });
        }
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // 1. Projekt erstellen
    it('Schritt 1: Sollte ein neues Projekt erstellen', async () => {
        const response = await request(app)
            .post('/api/projects')
            .send({
                title: 'Integration Test Flow Project',
                domain: 'E2E Testing'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();

        // ID speichern für die nächsten Tests
        projectId = response.body.data.id;

        console.log('✅ Projekt erstellt mit ID:', projectId);
    });

    // 2. Business Understanding ausfüllen
    it('Schritt 2: Sollte Business Understanding speichern und Wizard hochzählen', async () => {
        const response = await request(app)
            .patch(`/api/projects/${projectId}/business-understanding`)
            .send({
                businessGoal: 'Wir wollen alles testen',
                teamSize: 5,
                timelineValue: 3,
                timelineUnit: 'MONTHS'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.businessGoal).toBe('Wir wollen alles testen');
    });

    // 3. Data Characteristics ausfüllen
    it('Schritt 3: Sollte Data Characteristics speichern und Wizard auf Step 2 setzen', async () => {
        const response = await request(app)
            .patch(`/api/projects/${projectId}/data-characteristics`)
            .send({
                dataSources: ['Database', 'API'],
                volumeValue: 100,
                volumeUnit: 'GB',
                // Required Fields aus deinem Service (variability/dataPreparationSteps) werden vom Service default gesetzt
                // aber wir schicken sie sicherheitshalber mit oder testen den Default
                dataPreparationSteps: 'JOINS'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    // 4. Gesamtstatus prüfen (Service Logik Test)
    it('Schritt 4: Sollte den korrekten Wizard-Status und freigeschaltete Phasen haben', async () => {
        const response = await request(app).get(`/api/projects/${projectId}`);

        expect(response.status).toBe(200);

        const projectData = response.body.project;
        const phases = response.body.templatePhases;

        // Wizard Step sollte jetzt 2 sein (weil wir 2 Schritte gemacht haben)
        // Dein Service erhöht bei DataCharacteristics update -> advanceWizardStep(id, 2)
        expect(projectData.wizardStep).toBeGreaterThanOrEqual(2);

        // Prüfen ob die Phasen-Status Logik funktioniert hat
        // Business Understanding sollte DRAFT sein
        const businessPhase = phases.find((p: any) => p.phase === 'businessUnderstanding');
        expect(businessPhase.status).toBe('DRAFT');

        // Analysis Config sollte jetzt READY sein (durch unlockNextPhase)
        const analysisPhase = phases.find((p: any) => p.phase === 'analysisConfig');
        expect(analysisPhase.status).toBe('READY');

        console.log('✅ Wizard Logic verifiziert: Analysis Config ist READY');
    });
});
