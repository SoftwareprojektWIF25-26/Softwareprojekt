import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import homeviewRouter from '../../routes/homeview_routes';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/api/homeview', homeviewRouter);

const prisma = new PrismaClient();

describe('Homeview Routes (Echte DB)', () => {
    // 1. Vor allen Tests: Datenbank aufräumen oder Testdaten einfügen (Seeding)
    beforeAll(async () => {
        await prisma.$connect();
        // OPTIONAL: Lösche alle bestehenden Projekte, um eine saubere Testumgebung zu haben
        // await prisma.project.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /api/homeview', () => {
        it('sollte echte Projekte aus der Datenbank laden', async () => {
            // Vorbereitung: Leg ein echtes Projekt in der DB an
            await prisma.project.create({
                data: {
                    title: 'Echter E2E Test',
                    domain: 'Testing',
                    status: 'PLANNING',
                    // ... weitere benötigte Pflichtfelder
                }
            });

            // Act: Echte HTTP-Anfrage absetzen
            const response = await request(app).get('/api/homeview');

            // Assert: Prüfen, ob das echte Projekt zurückkommt
            expect(response.status).toBe(200);
            expect(response.body.projects.length).toBeGreaterThan(0);
            expect(response.body.projects[0].title).toBe('Echter E2E Test');
        });
    });
});
