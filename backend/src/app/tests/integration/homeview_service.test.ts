import { HomeviewService } from '../../services/homeview/homeview.service';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('HomeviewService (Integration)', () => {
    let service: HomeviewService;

    // Datenbank-Verbindung sicherstellen
    beforeAll(async () => {
        await prisma.$connect();
    });

    // Nach allen Tests Verbindung schließen
    afterAll(async () => {
        await prisma.$disconnect();
    });

    // Vor JEDEM Test die Datenbank komplett leeren
    beforeEach(async () => {
        service = new HomeviewService();

        // Reihenfolge beachten wegen Foreign Keys (Cascade sollte das meiste regeln,
        // aber Project löschen räumt alles darunter ab)
        await prisma.project.deleteMany();
        await prisma.projectCategory.deleteMany(); // Falls du Kategorien mit anlegst
    });

    describe('getStatistics', () => {
        it('sollte die Statistiken korrekt berechnen', async () => {
            // Arrange: Echte Projekte in die Test-DB schreiben
            await prisma.project.createMany({
                data: [
                    { title: 'Proj 1', domain: 'A', status: ProjectStatus.PLANNING },
                    { title: 'Proj 2', domain: 'B', status: ProjectStatus.INPROGRESS },
                    { title: 'Proj 3', domain: 'C', status: ProjectStatus.INPROGRESS },
                    { title: 'Proj 4', domain: 'D', status: ProjectStatus.COMPLETED },
                ]
            });

            // Act
            const result = await service.getStatistics();

            // Assert
            expect(result).toEqual({
                totalProjects: 4,
                planning: 1,
                inProgress: 2,
                completed: 1,
                onHold: 0,
                cancelled: 0,
            });
        });
    });

    describe('getRecentProjects', () => {
        it('sollte die zuletzt bearbeiteten Projekte in korrekter Reihenfolge zurückgeben', async () => {
            // Arrange
            const now = new Date();
            const pastDate = new Date(now.getTime() - 100000); // etwas in der Vergangenheit

            // Projekt 1 (älter)
            await prisma.project.create({
                data: { title: 'Projekt Alt', domain: 'Alt', status: ProjectStatus.COMPLETED, updatedAt: pastDate }
            });

            // Projekt 2 (neuer)
            const recentProject = await prisma.project.create({
                data: { title: 'Projekt Neu', domain: 'Neu', status: ProjectStatus.INPROGRESS, updatedAt: now }
            });

            // Act
            const result = await service.getRecentProjects(1); // Nur 1 laden

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Projekt Neu'); // Muss das neuere sein
            expect(result[0].id).toBe(recentProject.id);
        });
    });

    describe('getStartPageData', () => {
        it('sollte Projekte filtern, formatieren und Statistiken berechnen', async () => {
            // Arrange: Zuerst eine Kategorie erstellen
            const category = await prisma.projectCategory.create({
                data: { name: 'Risk', color: '#ff0000' }
            });

            // Projekt 1: Soll vom Filter "Data" und "INPROGRESS" gefunden werden
            await prisma.project.create({
                data: {
                    title: 'Data Science Project',
                    domain: 'Finance',
                    status: ProjectStatus.INPROGRESS,
                    wizardStep: 3,
                    wizardCompleted: false,
                    categoryId: category.id,
                    businessUnderstanding: {
                        create: {
                            status: 'DRAFT',
                            projectTeamRoles: ['DATASCIENTIST'],
                        }
                    },
                    projectPlan: {
                        create: {
                            tasks: {
                                create: [
                                    { status: 'DONE', taskType: 'CUSTOM' },
                                    { status: 'TODO', taskType: 'CUSTOM' }
                                ]
                            }
                        }
                    }
                }
            });

            // Projekt 2: Anderer Status, anderer Titel -> Sollte rausgefiltert werden
            await prisma.project.create({
                data: {
                    title: 'Ignoriertes Projekt',
                    domain: 'HR',
                    status: ProjectStatus.PLANNING,
                }
            });

            const filters = {
                search: 'Data',
                status: ProjectStatus.INPROGRESS,
                sortBy: 'title' as const,
                sortOrder: 'asc' as const,
            };

            // Act
            const result = await service.getStartPageData(filters);

            // Assert
            // Es sollte nur 1 Projekt gefunden werden (das "Data Science Project")
            expect(result.projects).toHaveLength(1);
            expect(result.totalCount).toBe(1);

            const filteredProject = result.projects[0];

            // Prüft die formatierte Rückgabe
            expect(filteredProject).toMatchObject({
                title: 'Data Science Project',
                wizardProgress: 50, // (3 / 6) * 100
                teamRoles: ['DATASCIENTIST'],
            });

            // Task Progress muss 50% sein (1 von 2 Tasks ist DONE)
            expect(filteredProject.taskProgress).toEqual({
                completed: 1,
                total: 2,
                percentage: 50
            });

            // Prüft ob die Kategorie richtig aufgelöst wurde
            expect(filteredProject.category).toMatchObject({
                name: 'Risk',
                color: '#ff0000',
            });

            // Prüft die integrierten Statistiken (beruht auf dem gefilterten Ergebnis)
            expect(result.statistics.inProgress).toBe(1);
            expect(result.statistics.planning).toBe(0); // Die Statistiken in StartPageData beziehen sich oft auf alle Projekte der Query
        });
    });
});
