// src/app/services/homeview.ts
import { PrismaClient, Prisma, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface StartPageFilters {
    // workspaceId entfernt
    search?: string;
    status?: ProjectStatus;
    sortBy: 'updatedAt' | 'createdAt' | 'title';
    sortOrder: 'asc' | 'desc';
}

export class HomeViewService {
    /**
     * Hauptfunktion: Lädt alle Daten für die Startseite
     * (Keine Projekt-ID nötig, da wir EINE LISTE laden)
     */
    async getStartPageData(filters: StartPageFilters) {

        // 1. Basis Where-Clause (ohne Workspace Filter!)
        const whereClause: Prisma.ProjectWhereInput = {};

        // 2. Filter anwenden
        if (filters.status) {
            whereClause.status = filters.status;
        }

        if (filters.search) {
            whereClause.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { domain: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        // 3. Projekte laden
        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                projectPlan: {
                    include: {
                        tasks: {
                            select: {
                                status: true
                            }
                        }
                    }
                },
                businessUnderstanding: {
                    select: {
                        status: true,
                        projectTeamRoles: true
                    }
                }
            },
            orderBy: { [filters.sortBy]: filters.sortOrder }
        });

        // 4. Projekte aufbereiten (Mapping bleibt gleich)
        const projectList = projects.map(project => {
            // Wizard-Fortschritt
            const wizardProgress = Math.round((project.wizardStep / 6) * 100);

            // Task-Fortschritt
            let taskProgress = null;
            if (project.projectPlan) {
                const totalTasks = project.projectPlan.tasks.length;
                const completedTasks = project.projectPlan.tasks.filter(t => t.status === 'DONE').length;
                taskProgress = {
                    completed: completedTasks,
                    total: totalTasks,
                    percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                };
            }

            return {
                id: project.id,
                title: project.title,
                domain: project.domain,
                status: project.status,
                wizardStep: project.wizardStep,
                wizardCompleted: project.wizardCompleted,
                wizardProgress,
                taskProgress,
                teamRoles: project.businessUnderstanding?.projectTeamRoles || [],
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                startDate: project.startDate,
                endDate: project.endDate
            };
        });

        // 5. Statistiken berechnen
        const statistics = {
            totalProjects: projects.length,
            planning: projects.filter(p => p.status === 'PLANNING').length,
            inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
            completed: projects.filter(p => p.status === 'COMPLETED').length,
            onHold: projects.filter(p => p.status === 'ON_HOLD').length,
            cancelled: projects.filter(p => p.status === 'CANCELLED').length
        };

        return {
            // Workspace-Objekt entfernt, da nicht mehr existent
            projects: projectList,
            statistics,
            totalCount: projectList.length
        };
    }

    /**
     * Statistiken (Global)
     */
    async getStatistics() { // Parameter entfernt
        // Einfach alle Projekte laden (evtl. optimiert nur Status abfragen)
        const projects = await prisma.project.findMany({
            select: { status: true }
        });

        return {
            totalProjects: projects.length,
            planning: projects.filter(p => p.status === 'PLANNING').length,
            inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
            completed: projects.filter(p => p.status === 'COMPLETED').length,
            onHold: projects.filter(p => p.status === 'ON_HOLD').length,
            cancelled: projects.filter(p => p.status === 'CANCELLED').length
        };
    }

    /**
     * Zuletzt bearbeitete Projekte
     */
    async getRecentProjects(limit: number = 5) { // WorkspaceId Parameter entfernt

        const projects = await prisma.project.findMany({
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: {
                id: true,
                title: true,
                domain: true,
                status: true,
                updatedAt: true,
                wizardStep: true
            }
        });

        return projects;
    }


}
