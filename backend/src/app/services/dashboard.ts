import { PrismaClient, Prisma, LocalWorkspace, ProjectStatus, TemplatePhaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Type für vollständiges Projekt mit allen Relationen
type ProjectWithAll = Prisma.ProjectGetPayload<{
    include: {
        workspace: true;
        businessUnderstanding: true;
        dataCharacteristics: true;
        analysisConfig: true;
        deploymentConfig: true;
        utilizationConfig: true;
        projectPlan: {
            include: {
                phases: {
                    include: {
                        tasks: true;
                    }
                };
                tasks: true;
            }
        };
        evaluations: true;
    };
}>;

export class DashboardService {
    /**
     * Vollständiges Dashboard für ein spezifisches Projekt
     */
    async getProjectDashboard(projectId: string) {
        // String zu Int konvertieren
        const id = parseInt(projectId, 10);

        if (isNaN(id)) {
            throw new Error('Ungültige Projekt-ID');
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                workspace: true,
                businessUnderstanding: true,
                dataCharacteristics: true,
                analysisConfig: true,
                deploymentConfig: true,
                utilizationConfig: true,
                projectPlan: {
                    include: {
                        phases: {
                            include: {
                                tasks: {
                                    orderBy: { createdAt: 'asc' }
                                }
                            },
                            orderBy: { orderIndex: 'asc' }
                        },
                        tasks: {
                            orderBy: { createdAt: 'asc' }
                        },
                        dependencies: true
                    }
                },
                evaluations: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        // Wizard-Fortschritt (0-6)
        const wizardProgress = {
            currentStep: project.wizardStep,
            totalSteps: 6,
            completed: project.wizardCompleted,
            percentage: Math.round((project.wizardStep / 6) * 100)
        };

        // Template-Phasen Status
        const templatePhases = [
            {
                name: 'Business Understanding',
                status: project.businessUnderstanding?.status || 'BLOCKED',
                completedAt: project.businessUnderstanding?.completedAt
            },
            {
                name: 'Data Characteristics',
                status: project.dataCharacteristics?.status || 'BLOCKED',
                completedAt: project.dataCharacteristics?.completedAt
            },
            {
                name: 'Analysis Configuration',
                status: project.analysisConfig?.status || 'BLOCKED',
                completedAt: project.analysisConfig?.completedAt
            },
            {
                name: 'Deployment Configuration',
                status: project.deploymentConfig?.status || 'BLOCKED',
                completedAt: project.deploymentConfig?.completedAt
            },
            {
                name: 'Utilization Configuration',
                status: project.utilizationConfig?.status || 'BLOCKED',
                completedAt: project.utilizationConfig?.completedAt
            }
        ];

        const completedTemplatePhases = templatePhases.filter(p => p.status === 'COMPLETED').length;
        const templateProgress = Math.round((completedTemplatePhases / templatePhases.length) * 100);

        // Projektplan Phasen (CRISP-DM)
        let projectPlanProgress = null;
        if (project.projectPlan) {
            const totalPhases = project.projectPlan.phases.length;
            const totalTasks = project.projectPlan.tasks.length;
            const completedTasks = project.projectPlan.tasks.filter(t => t.status === 'DONE').length;

            projectPlanProgress = {
                totalPhases,
                totalTasks,
                completedTasks,
                percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                estimatedDuration: project.projectPlan.estimatedDuration,
                estimatedEffort: project.projectPlan.estimatedEffort,
                calculatedComplexity: project.projectPlan.calculatedComplexity
            };
        }

        // Gantt-Daten für Timeline
        const ganttData = project.projectPlan?.phases.map(phase => ({
            id: phase.id,
            name: phase.name,
            phaseType: phase.phaseType,
            description: phase.description,
            orderIndex: phase.orderIndex,
            startDate: phase.startDate,
            endDate: phase.endDate,
            estimatedDuration: phase.estimatedDuration,
            estimatedEffort: phase.estimatedEffort,
            tasks: phase.tasks.map(task => ({
                id: task.id,
                title: task.title || this.getTaskTitle(task.taskType),
                taskType: task.taskType,
                status: task.status,
                estimatedDuration: task.estimatedDuration,
                startDate: task.startDate,
                endDate: task.endDate
            }))
        })) || [];

        // Team-Informationen
        const teamInfo = project.businessUnderstanding ? {
            roles: project.businessUnderstanding.projectTeamRoles,
            teamSize: project.businessUnderstanding.teamSize,
            timeline: {
                value: project.businessUnderstanding.timelineValue,
                unit: project.businessUnderstanding.timelineUnit
            },
            estimatedCost: project.businessUnderstanding.estimatedCost
        } : null;

        return {
            project: {
                id: project.id,
                title: project.title,
                domain: project.domain,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            },
            workspace: {
                id: project.workspace.id,
                name: project.workspace.name
            },
            wizardProgress,
            templatePhases,
            templateProgress,
            projectPlanProgress,
            ganttData,
            team: teamInfo,
            configurations: {
                businessUnderstanding: project.businessUnderstanding,
                dataCharacteristics: project.dataCharacteristics,
                analysisConfig: project.analysisConfig,
                deploymentConfig: project.deploymentConfig,
                utilizationConfig: project.utilizationConfig
            },
            evaluations: project.evaluations
        };
    }

    /**
     * Projekt-Timeline/Gantt-Daten
     */
    async getProjectTimeline(projectId: string) {
        const id = parseInt(projectId, 10);

        if (isNaN(id)) {
            throw new Error('Ungültige Projekt-ID');
        }

        const projectPlan = await prisma.projectPlan.findFirst({
            where: { projectId: id },
            include: {
                phases: {
                    include: {
                        tasks: {
                            include: {
                                dependenciesFrom: {
                                    include: {
                                        toTask: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        if (!projectPlan) {
            throw new Error(`Projektplan für Projekt ${id} nicht gefunden`);
        }

        return {
            projectPlanId: projectPlan.id,
            estimatedDuration: projectPlan.estimatedDuration,
            estimatedEffort: projectPlan.estimatedEffort,
            phases: projectPlan.phases.map(phase => ({
                id: phase.id,
                name: phase.name,
                phaseType: phase.phaseType,
                orderIndex: phase.orderIndex,
                startDate: phase.startDate,
                endDate: phase.endDate,
                estimatedDuration: phase.estimatedDuration,
                tasks: phase.tasks.map(task => ({
                    id: task.id,
                    title: task.title || this.getTaskTitle(task.taskType),
                    status: task.status,
                    startDate: task.startDate,
                    endDate: task.endDate,
                    dependencies: task.dependenciesFrom.map(dep => ({
                        toTaskId: dep.toTaskId,
                        toTaskTitle: dep.toTask.title,
                        type: dep.dependencyType
                    }))
                }))
            }))
        };
    }

    /**
     * Task-Status aktualisieren
     */
    async updateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE') {
        const id = parseInt(taskId, 10);

        if (isNaN(id)) {
            throw new Error('Ungültige Task-ID');
        }

        const task = await prisma.phaseSteps.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        return task;
    }

    /**
     * Projektstatus ändern
     */
    async updateProjectStatus(projectId: string, status: ProjectStatus) {
        const id = parseInt(projectId, 10);

        if (isNaN(id)) {
            throw new Error('Ungültige Projekt-ID');
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        return project;
    }

    /**
     * Template-Phase-Status aktualisieren
     */
    async updateTemplatePhaseStatus(
        projectId: string,
        phase: 'businessUnderstanding' | 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig',
        status: TemplatePhaseStatus
    ) {
        const id = parseInt(projectId, 10);

        if (isNaN(id)) {
            throw new Error('Ungültige Projekt-ID');
        }

        const updateData: any = {
            status
        };

        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();
        }

        let result;
        switch (phase) {
            case 'businessUnderstanding':
                result = await prisma.businessUnderstanding.update({
                    where: { projectId: id },
                    data: updateData
                });
                break;
            case 'dataCharacteristics':
                result = await prisma.dataCharacteristics.update({
                    where: { projectId: id },
                    data: updateData
                });
                break;
            case 'analysisConfig':
                result = await prisma.analysisConfig.update({
                    where: { projectId: id },
                    data: updateData
                });
                break;
            case 'deploymentConfig':
                result = await prisma.deploymentConfig.update({
                    where: { projectId: id },
                    data: updateData
                });
                break;
            case 'utilizationConfig':
                result = await prisma.utilizationConfig.update({
                    where: { projectId: id },
                    data: updateData
                });
                break;
        }

        return result;
    }

    /**
     * Projekt-Evaluierung hinzufügen
     */
    async addProjectEvaluation(projectId: string, category: string, rating: number, notes?: string) {
        const id = parseInt(projectId, 10);

        if (isNaN(id)) {
            throw new Error('Ungültige Projekt-ID');
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating muss zwischen 1 und 5 liegen');
        }

        const evaluation = await prisma.projectEvaluation.create({
            data: {
                projectId: id,
                category,
                rating,
                notes
            }
        });

        return evaluation;
    }

    /**
     * Hilfsfunktion: Task-Titel aus Enum generieren
     */
    private getTaskTitle(taskType: string): string {
        const taskTitles: Record<string, string> = {
            'DEFINE_TITLE': 'Titel definieren',
            'DEFINE_DOMAIN': 'Domain festlegen',
            'DEFINE_BUSINESS_GOAL': 'Business Goal definieren',
            'DEFINE_FINAL_PRODUCT_FORM': 'Form des finalen Produkts festlegen',
            'IDENTIFY_PROJECT_TEAM_ROLES': 'Projekt-Team-Rollen identifizieren',
            'DETERMINE_TEAM_SIZE': 'Team-Größe bestimmen',
            'PLAN_TIMELINE': 'Timeline planen',
            'ESTIMATE_COST': 'Kosten schätzen',
            'SELECT_TOOLS_BUSINESS_UNDERSTANDING': 'Tools auswählen',
            'DETERMINE_DATA_ACCESS': 'Datenzugang bestimmen',
            'VERIFY_DATA_AVAILABILITY': 'Datenverfügbarkeit prüfen',
            'IDENTIFY_DATA_SOURCES': 'Datenquellen identifizieren',
            'ASSESS_DATA_SECURITY_PRIVACY': 'Datensicherheit bewerten',
            'EVALUATE_DATA_VELOCITY': 'Datengeschwindigkeit bewerten',
            'ASSESS_DATA_VERACITY': 'Datenqualität bewerten',
            'DETERMINE_DATA_VARIETY': 'Datenvielfalt bestimmen',
            'ESTIMATE_DATA_VOLUME': 'Datenvolumen schätzen',
            'ASSESS_DATA_VARIABILITY': 'Datenvariabilität bewerten',
            'DEFINE_DATA_PREPARATION_STEPS': 'Datenaufbereitungsschritte definieren',
            'SELECT_DATA_TOOLS': 'Daten-Tools auswählen',
            'DEFINE_DATA_SCIENCE_GOALS': 'Data Science Ziele definieren',
            'DETERMINE_ANALYTICS_TYPE': 'Analytics-Typ bestimmen',
            'SELECT_EVALUATION_METRICS': 'Evaluationsmetriken auswählen',
            'SELECT_ANALYSIS_TOOLS': 'Analyse-Tools auswählen',
            'DEFINE_TIMELINESS_REQUIREMENTS': 'Zeitanforderungen definieren',
            'IDENTIFY_ADDRESSED_USERS': 'Zielnutzer identifizieren',
            'PLAN_TESTING_STRATEGY': 'Test-Strategie planen',
            'DOCUMENT_PROJECT_ISSUES': 'Projekt-Issues dokumentieren',
            'SELECT_DEPLOYMENT_TOOLS': 'Deployment-Tools auswählen',
            'PLAN_MONITORING_ACTIVITIES': 'Monitoring-Aktivitäten planen',
            'PLAN_MAINTENANCE_STRATEGY': 'Wartungsstrategie planen',
            'SELECT_UTILIZATION_TOOLS': 'Nutzungs-Tools auswählen',
            'CUSTOM': 'Custom Task'
        };

        return taskTitles[taskType] || taskType;
    }
}
