import { PrismaClient, Prisma, ProjectStatus, TemplatePhaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Type für vollständiges Projekt mit allen Relationen
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
     * Aktualisiert Projekt Titel & Domaine
     */
    async updateProjectDetails(projectId: number, data: { title?: string, domain?: string }) {
        return prisma.project.update({
            where: { id: projectId },
            data: {
                title: data.title,
                domain: data.domain
            }
        });
    }


    /**
     * Aktualisiert Projekt-Konfigurationen (Wizard-Daten), die User aus Dashboard gemacht hat
     */
    async updateProjectConfig(
        projectId: string,
        configType: 'businessUnderstanding' | 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig',
        data: any
    ) {
        const id = parseInt(projectId, 10);
        if (isNaN(id)) throw new Error('Ungültige Projekt-ID');

        // Mapping von configType auf Prisma-Model-Delegates
        // Wir nutzen hier 'any', da Prisma Client Typen dynamisch schwer zu mappen sind,
        // aber zur Laufzeit funktioniert der Zugriff via Index.
        const delegateMap: Record<string, any> = {
            businessUnderstanding: prisma.businessUnderstanding,
            dataCharacteristics: prisma.dataCharacteristics,
            analysisConfig: prisma.analysisConfig,
            deploymentConfig: prisma.deploymentConfig,
            utilizationConfig: prisma.utilizationConfig
        };

        const delegate = delegateMap[configType];
        if (!delegate) throw new Error(`Ungültiger Konfigurationstyp: ${configType}`);

        // Update durchführen
        // Wir nutzen update, da der Record existieren muss (wurde beim Wizard-Abschluss erstellt)
        // Wir filtern 'id', 'projectId' und 'createdAt' aus den Daten sicherheitshalber raus
        const { id: _, projectId: __, createdAt: ___, ...updateData } = data;

        const result = await delegate.update({
            where: { projectId: id }, // Alle Config-Tabellen haben projectId @unique
            data: updateData
        });

        return result;
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
            // ========== BUSINESS UNDERSTANDING ==========
            'ASSESS_SITUATION': 'Assess Situation',
            'COMPOSE_PROJECT_TEAM': 'Compose Project Team',
            'SET_BUSINESS_OBJECTIVES': 'Set Business Objectives and Success Criteria',
            'DERIVE_DATA_SCIENCE_TARGETS': 'Derive Data Science Targets',
            'CREATE_PROJECT_PLAN': 'Create Project Plan',

            // ========== DATA COLLECTION, EXPLORATION & PREPARATION ==========
            'IDENTIFY_DATA_SOURCES': 'Identify Data Sources',
            'ACQUIRE_DATA': 'Acquire Data',
            'DESCRIBE_DATA': 'Describe Data',
            'EXPLORE_DATA': 'Explore Data',
            'ASSESS_DATA_QUALITY': 'Assess Data Quality',
            'PREPARE_DATA': 'Prepare Data',
            'DEVELOP_DATA_PIPELINE': 'Develop Data Pipeline',

            // ========== MODELING/ANALYSIS ==========
            'DEFINE_HYPOTHESIS': 'Define Hypothesis',
            'SELECT_ANALYTICAL_MODEL': 'Select Analytical Model',
            'DESIGN_TEST_FOR_ANALYTICAL_MODEL': 'Design Test for Analytical Model',
            'DEVELOP_ANALYTICAL_MODEL': 'Develop Analytical Model',
            'ASSESS_ANALYTICAL_MODEL': 'Assess Analytical Model',
            'DEVELOP_ANALYTICAL_PIPELINE': 'Develop Analytical Pipeline',

            // ========== EVALUATION ==========
            'ASSESS_ANALYTICAL_RESULTS': 'Assess Analytical Results',
            'EVALUATE_PROCESS': 'Evaluate Process and Perform Checkpoint Decision',
            'PERFORM_CHECKPOINT_DECISION': 'Perform Checkpoint Decision',

            // ========== DEPLOYMENT ==========
            'PERFORM_IMPACT_ASSESSMENT': 'Perform Impact Assessment',
            'PLAN_DEPLOYMENT': 'Plan Deployment',
            'PLAN_MONITORING_AND_MAINTENANCE': 'Plan Monitoring and Maintenance',
            'TEST_DEPLOYMENT': 'Test Deployment',
            'PERFORM_BUSINESS_INTEGRATION': 'Perform Business Integration',
            'FINALIZE_PROJECT': 'Finalize Project',

            // ========== UTILIZATION ==========
            'MONITOR_MODEL_PERFORMANCE': 'Monitor Model Performance',
            'MAINTAIN_DATA_PIPELINE': 'Maintain Data Pipeline',
            'UPDATE_MODEL': 'Update Model',

            // Legacy
            'CUSTOM': 'Custom Task'
        };

        return taskTitles[taskType] || taskType;
    }

}
