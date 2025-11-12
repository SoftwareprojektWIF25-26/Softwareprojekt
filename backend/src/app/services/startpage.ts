// src/services/startpage.ts
import { PrismaClient, Prisma, LocalWorkspace, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface StartPageFilters {
    workspaceId?: string;
    search?: string;
    status?: ProjectStatus;
    sortBy: 'updatedAt' | 'createdAt' | 'title';
    sortOrder: 'asc' | 'desc';
}

export class StartPageService {
    /**
     * Hauptfunktion: Lädt alle Daten für die Startseite
     */
    async getStartPageData(filters: StartPageFilters) {
        const workspace = await this.getOrCreateWorkspace(filters.workspaceId);

        // WHERE-Clause
        const whereClause: Prisma.ProjectWhereInput = {
            workspaceId: workspace.id
        };

        if (filters.status) {
            whereClause.status = filters.status;
        }

        if (filters.search) {
            whereClause.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { domain: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        // Projekte laden
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

        // Projekte aufbereiten
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

        // Statistiken
        const statistics = {
            totalProjects: projects.length,
            planning: projects.filter(p => p.status === 'PLANNING').length,
            inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
            completed: projects.filter(p => p.status === 'COMPLETED').length,
            onHold: projects.filter(p => p.status === 'ON_HOLD').length,
            cancelled: projects.filter(p => p.status === 'CANCELLED').length
        };

        return {
            workspace: {
                id: workspace.id,
                name: workspace.name
            },
            projects: projectList,
            statistics,
            totalCount: projectList.length
        };
    }

    /**
     * Statistiken
     */
    async getStatistics(workspaceId?: string) {
        const workspace = await this.getOrCreateWorkspace(workspaceId);

        const projects = await prisma.project.findMany({
            where: { workspaceId: workspace.id },
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
    async getRecentProjects(workspaceId?: string, limit: number = 5) {
        const workspace = await this.getOrCreateWorkspace(workspaceId);

        const projects = await prisma.project.findMany({
            where: { workspaceId: workspace.id },
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

    /**
     * Workspace laden oder erstellen
     */
    private async getOrCreateWorkspace(workspaceId?: string): Promise<LocalWorkspace> {
        if (workspaceId) {
            const id = this.parseId(workspaceId, 'Workspace-ID')
            const workspace = await prisma.localWorkspace.findUnique({
                where: { id }
            });

            if (!workspace) {
                throw new Error(`Workspace mit ID ${workspaceId} nicht gefunden`);
            }

            return workspace;
        }

        let workspace = await prisma.localWorkspace.findFirst();

        if (!workspace) {
            workspace = await prisma.localWorkspace.create({
                data: { name: 'Default Workspace' }
            });
        }

        return workspace;
    }

    /**
     * Hilfsfunktion: String zu Int konvertieren mit Validierung
     */
    private parseId(value: string, fieldName: string): number {
        const id = parseInt(value, 10);

        if (isNaN(id) || id <= 0) {
            throw new Error(`Ungültige ${fieldName}: ${value}`);
        }

        return id;
    }
}
