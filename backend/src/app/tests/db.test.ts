// src/tests/db.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Nutzt automatisch die URL aus .env.test (Port 5433)
const prisma = new PrismaClient();

describe('Database Integration Test', () => {

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('sollte das geseedete Projekt in der Test-DB finden', async () => {
        // Wir suchen das Projekt, das wir in seed.ts erstellt haben
        // (Achte darauf, dass der Titel mit deinem Seed übereinstimmt)
        const project = await prisma.project.findFirst({
            where: { title: 'Integration Test Project' }, // Oder 'E2E Test Project', je nachdem was im Seed steht
            include: {
                workspace: true,
                businessUnderstanding: true
            }
        });

        // Prüfungen (Assertions)
        expect(project).not.toBeNull();
        expect(project?.title).toContain('Test Project');
        expect(project?.workspace).toBeDefined();

        console.log('✅ Gefundenes Projekt:', project?.title);
    });
});
