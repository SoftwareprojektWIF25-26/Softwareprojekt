import { PrismaClient, Prisma, ProjectStatus, TemplatePhaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

export type ConfigPhaseType =
    | 'businessUnderstanding'
    | 'dataCharacteristics'
    | 'analysisConfig'
    | 'deploymentConfig'
    | 'utilizationConfig';

// Typendefinition für ein vollständig geladenes Projekt inklusive aller relationalen Abhängigkeiten
type ProjectWithAll = Prisma.ProjectGetPayload<{
    include: {
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
     * Aggregiert alle relevanten Metriken, Konfigurationen und Planungsdaten
     * für die Hauptansicht eines Projekts im Dashboard.
     */
    public async getProjectDashboard(projectId: string) {
        const id = this.parseValidId(projectId, 'Projekt-ID');

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
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

        const templatePhases = this.extractTemplatePhases(project);
        const completedTemplatePhases = templatePhases.filter(p => p.status === 'COMPLETED').length;

        let projectPlanProgress = null;
        if (project.projectPlan) {
            const totalTasks = project.projectPlan.tasks.length;
            const completedTasks = project.projectPlan.tasks.filter(t => t.status === 'DONE').length;

            projectPlanProgress = {
                totalPhases: project.projectPlan.phases.length,
                totalTasks,
                completedTasks,
                percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                estimatedDuration: project.projectPlan.estimatedDuration,
                estimatedEffort: project.projectPlan.estimatedEffort,
                calculatedComplexity: project.projectPlan.calculatedComplexity
            };
        }

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
            wizardProgress: {
                currentStep: project.wizardStep,
                totalSteps: 6,
                completed: project.wizardCompleted,
                percentage: Math.round((project.wizardStep / 6) * 100)
            },
            templatePhases,
            templateProgress: Math.round((completedTemplatePhases / templatePhases.length) * 100),
            projectPlanProgress,
            ganttData: this.buildGanttData(project.projectPlan),
            team: project.businessUnderstanding ? {
                roles: project.businessUnderstanding.projectTeamRoles,
                teamSize: project.businessUnderstanding.teamSize,
                timeline: {
                    value: project.businessUnderstanding.timelineValue,
                    unit: project.businessUnderstanding.timelineUnit
                },
                estimatedCost: project.businessUnderstanding.estimatedCost
            } : null,
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

    public async updateProjectDetails(projectId: number, data: { title?: string, domain?: string }) {
        return prisma.project.update({
            where: { id: projectId },
            data: {
                title: data.title,
                domain: data.domain
            }
        });
    }

    /**
     * Speichert benutzerspezifische Anpassungen innerhalb einer bestimmten
     * Projektphase (z. B. Data Characteristics oder Analysis Config).
     */
    public async updateProjectConfig(
        projectId: string,
        configType: ConfigPhaseType,
        data: any
    ) {
        const id = this.parseValidId(projectId, 'Projekt-ID');
        const delegate = this.getPrismaDelegate(configType);

        // Systemrelevante Identifikatoren dürfen nicht überschrieben werden
        const { id: _, projectId: __, createdAt: ___, ...updateData } = data;

        return delegate.update({
            where: { projectId: id },
            data: updateData
        });
    }

    /**
     * Lädt die chronologische Abfolge der Projektphasen und Aufgaben für die Gantt-Chart-Darstellung.
     */
    public async getProjectTimeline(projectId: string) {
        const id = this.parseValidId(projectId, 'Projekt-ID');

        const projectPlan = await prisma.projectPlan.findFirst({
            where: { projectId: id },
            include: {
                phases: {
                    include: {
                        tasks: {
                            include: {
                                dependenciesFrom: {
                                    include: { toTask: true }
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
                estimatedEffort: phase.estimatedEffort,
                baseEffort: phase.baseEffort,
                bufferEffort: phase.bufferEffort,
                baseDuration: phase.baseDuration,
                bufferDuration: phase.bufferDuration,
                tasks: phase.tasks.map(task => ({
                    id: task.id,
                    title: task.title || this.getTaskTitle(task.taskType),
                    status: task.status,
                    startDate: task.startDate,
                    endDate: task.endDate,
                    estimatedDuration: task.estimatedDuration,
                    dependencies: task.dependenciesFrom.map(dep => ({
                        toTaskId: dep.toTaskId,
                        toTaskTitle: dep.toTask.title,
                        type: dep.dependencyType
                    }))
                }))
            }))
        };
    }

    public async updateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE') {
        const id = this.parseValidId(taskId, 'Task-ID');

        return prisma.phaseSteps.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        });
    }

    public async updateProjectStatus(projectId: string, status: ProjectStatus) {
        const id = this.parseValidId(projectId, 'Projekt-ID');

        return prisma.project.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Markiert eine Konfigurationsphase als abgeschlossen oder ändert ihren Bearbeitungsstatus.
     * Beim Abschluss wird zusätzlich ein Zeitstempel gesetzt.
     */
    public async updateTemplatePhaseStatus(
        projectId: string,
        phase: ConfigPhaseType,
        status: TemplatePhaseStatus
    ) {
        const id = this.parseValidId(projectId, 'Projekt-ID');
        const delegate = this.getPrismaDelegate(phase);

        const updateData: any = { status };
        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();
        }

        return delegate.update({
            where: { projectId: id },
            data: updateData
        });
    }

    public async addProjectEvaluation(projectId: string, category: string, rating: number, notes?: string) {
        const id = this.parseValidId(projectId, 'Projekt-ID');

        if (rating < 1 || rating > 5) {
            throw new Error('Rating muss zwischen 1 und 5 liegen');
        }

        return prisma.projectEvaluation.create({
            data: {
                projectId: id,
                category,
                rating,
                notes
            }
        });
    }

    // ============================================================================
    // PRIVATE HILFSMETHODEN
    // ============================================================================

    /**
     * Stellt sicher, dass die übergebene ID in einen gültigen Integer umgewandelt werden kann.
     */
    private parseValidId(id: string | number, entityName: string): number {
        const parsedId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(parsedId)) {
            throw new Error(`Ungültige ${entityName}`);
        }
        return parsedId;
    }

    /**
     * Mappt den Phasen-Typ auf das entsprechende Prisma-Model.
     * Verhindert große und unübersichtliche switch/case-Anweisungen.
     */
    private getPrismaDelegate(phase: ConfigPhaseType): any {
        const delegateMap: Record<ConfigPhaseType, any> = {
            businessUnderstanding: prisma.businessUnderstanding,
            dataCharacteristics: prisma.dataCharacteristics,
            analysisConfig: prisma.analysisConfig,
            deploymentConfig: prisma.deploymentConfig,
            utilizationConfig: prisma.utilizationConfig
        };

        const delegate = delegateMap[phase];
        if (!delegate) throw new Error(`Ungültiger Konfigurationstyp: ${phase}`);

        return delegate;
    }

    /**
     * Extrahiert die Phasenstati aus dem Projekt-Objekt für die Übersicht.
     */
    private extractTemplatePhases(project: any) {
        return [
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
    }

    /**
     * Bereitet die rohen Datenbankdaten für die Visualisierung in einem Gantt-Chart auf.
     */
    private buildGanttData(projectPlan: any) {
        if (!projectPlan || !projectPlan.phases) return [];

        return projectPlan.phases.map((phase: any) => ({
            id: phase.id,
            name: phase.name,
            phaseType: phase.phaseType,
            description: phase.description,
            orderIndex: phase.orderIndex,
            startDate: phase.startDate,
            endDate: phase.endDate,
            estimatedDuration: phase.estimatedDuration,
            estimatedEffort: phase.estimatedEffort,
            tasks: phase.tasks.map((task: any) => ({
                id: task.id,
                title: task.title || this.getTaskTitle(task.taskType),
                taskType: task.taskType,
                status: task.status,
                estimatedDuration: task.estimatedDuration,
                startDate: task.startDate,
                endDate: task.endDate
            }))
        }));
    }

    /**
     * Konvertiert systeminterne Task-Typen in lesbare Standardtitel.
     */
    private getTaskTitle(taskType: string): string {
        const taskTitles: Record<string, string> = {
            'ASSESS_SITUATION': 'Assess Situation',
            'COMPOSE_PROJECT_TEAM': 'Compose Project Team',
            'SET_BUSINESS_OBJECTIVES': 'Set Business Objectives and Success Criteria',
            'DERIVE_DATA_SCIENCE_TARGETS': 'Derive Data Science Targets',
            'CREATE_PROJECT_PLAN': 'Create Project Plan',
            'IDENTIFY_DATA_SOURCES': 'Identify Data Sources',
            'ACQUIRE_DATA': 'Acquire Data',
            'DESCRIBE_DATA': 'Describe Data',
            'EXPLORE_DATA': 'Explore Data',
            'ASSESS_DATA_QUALITY': 'Assess Data Quality',
            'PREPARE_DATA': 'Prepare Data',
            'DEVELOP_DATA_PIPELINE': 'Develop Data Pipeline',
            'DEFINE_HYPOTHESIS': 'Define Hypothesis',
            'SELECT_ANALYTICAL_MODEL': 'Select Analytical Model',
            'DESIGN_TEST_FOR_ANALYTICAL_MODEL': 'Design Test for Analytical Model',
            'DEVELOP_ANALYTICAL_MODEL': 'Develop Analytical Model',
            'ASSESS_ANALYTICAL_MODEL': 'Assess Analytical Model',
            'DEVELOP_ANALYTICAL_PIPELINE': 'Develop Analytical Pipeline',
            'ASSESS_ANALYTICAL_RESULTS': 'Assess Analytical Results',
            'EVALUATE_PROCESS': 'Evaluate Process and Perform Checkpoint Decision',
            'PERFORM_CHECKPOINT_DECISION': 'Perform Checkpoint Decision',
            'PERFORM_IMPACT_ASSESSMENT': 'Perform Impact Assessment',
            'PLAN_DEPLOYMENT': 'Plan Deployment',
            'PLAN_MONITORING_AND_MAINTENANCE': 'Plan Monitoring and Maintenance',
            'TEST_DEPLOYMENT': 'Test Deployment',
            'PERFORM_BUSINESS_INTEGRATION': 'Perform Business Integration',
            'FINALIZE_PROJECT': 'Finalize Project',
            'MONITOR_MODEL_PERFORMANCE': 'Monitor Model Performance',
            'MAINTAIN_DATA_PIPELINE': 'Maintain Data Pipeline',
            'UPDATE_MODEL': 'Update Model',
            'CUSTOM': 'Custom Task'
        };

        return taskTitles[taskType] || taskType;
    }
}
