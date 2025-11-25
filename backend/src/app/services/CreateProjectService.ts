// src/app/services/ProjectService.ts
import { PrismaClient, Prisma, ProjectStatus, TemplatePhaseStatus } from '@prisma/client';
import {ProjectMetrics} from "../types.ts";

const prisma = new PrismaClient();

// Request-Types für API
export interface CreateProjectRequest {
    workspaceId?: string;
    title: string;
    domain?: string;
}

export interface UpdateProjectRequest {
    title?: string;
    domain?: string;
    status?: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    wizardStep?: number;
    wizardCompleted?: boolean;
}

// Request für Wizard-Steps (Business Understanding, Data Characteristics, etc.)
export interface UpdateBusinessUnderstandingRequest {
    businessGoal?: string;
    formOfFinalProduct?: any;
    projectTeamRoles?: any[];
    teamSize?: number;
    timelineValue?: number;
    timelineUnit?: 'DAYS' | 'WEEKS' | 'MONTHS';
    estimatedCost?: number;
    toolsBusinessUnderstanding?: string;
}

export interface UpdateDataCharacteristicsRequest {
    dataAccess?: any[];
    dataAvailability?: boolean;
    dataSources?: string[];
    dataSecurityConstraints?: string;
    velocity?: any;
    veracity?: any;
    variety?: any;
    volumeValue?: number;
    volumeUnit?: 'RECORDS' | 'GB' | 'TB' | 'PB';
    variability?: any;
    dataPreparationSteps?: any;
    toolsData?: string;
}

export class ProjectService {
    /**
     * POST /api/projects
     * Erstellt ein neues Projekt (initial, minimal)
     */
    async createProject(data: CreateProjectRequest) {
        // Workspace ermitteln oder Default verwenden
        const workspace = await this.getOrCreateWorkspace(data.workspaceId);

        // Projekt erstellen
        const project = await prisma.project.create({
            data: {
                workspaceId: workspace.id,
                title: data.title,
                domain: data.domain,
                wizardStep: 0,
                wizardCompleted: false,
                status: 'PLANNING'
            },
            include: {
                workspace: true
            }
        });

        // Initialisiere alle Template-Phasen mit BLOCKED Status
        await this.initializeTemplatePhases(project.id);

        return {
            id: project.id,
            title: project.title,
            domain: project.domain,
            status: project.status,
            wizardStep: project.wizardStep,
            wizardCompleted: project.wizardCompleted,
            workspace: {
                id: project.workspace.id,
                name: project.workspace.name
            },
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        };
    }

    /**
     * GET /api/projects/:id
     * Projekt mit allen Relationen abrufen
     */
    async getProjectById(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

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
                                tasks: true
                            },
                            orderBy: { orderIndex: 'asc' }
                        },
                        tasks: true
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

        // Wizard-Fortschritt berechnen
        const wizardProgress = {
            currentStep: project.wizardStep,
            totalSteps: 6,
            completed: project.wizardCompleted,
            percentage: Math.round((project.wizardStep / 6) * 100)
        };

        // Template-Phasen Status
        const templatePhases = [
            {
                phase: 'businessUnderstanding',
                name: 'Business Understanding',
                status: project.businessUnderstanding?.status || 'BLOCKED',
                data: project.businessUnderstanding
            },
            {
                phase: 'dataCharacteristics',
                name: 'Data Characteristics',
                status: project.dataCharacteristics?.status || 'BLOCKED',
                data: project.dataCharacteristics
            },
            {
                phase: 'analysisConfig',
                name: 'Analysis Configuration',
                status: project.analysisConfig?.status || 'BLOCKED',
                data: project.analysisConfig
            },
            {
                phase: 'deploymentConfig',
                name: 'Deployment Configuration',
                status: project.deploymentConfig?.status || 'BLOCKED',
                data: project.deploymentConfig
            },
            {
                phase: 'utilizationConfig',
                name: 'Utilization Configuration',
                status: project.utilizationConfig?.status || 'BLOCKED',
                data: project.utilizationConfig
            }
        ];

        return {
            project: {
                id: project.id,
                title: project.title,
                domain: project.domain,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                wizardStep: project.wizardStep,
                wizardCompleted: project.wizardCompleted,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            },
            workspace: {
                id: project.workspace.id,
                name: project.workspace.name
            },
            wizardProgress,
            templatePhases,
            projectPlan: project.projectPlan,
            evaluations: project.evaluations
        };
    }

    /**
     * PATCH /api/projects/:id
     * Projekt-Basisdaten aktualisieren
     */
    async updateProject(projectId: string, data: UpdateProjectRequest) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // Prüfen ob Projekt existiert
        const existingProject = await prisma.project.findUnique({
            where: { id }
        });

        if (!existingProject) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        // Update durchführen
        const project = await prisma.project.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                workspace: true
            }
        });

        return {
            id: project.id,
            title: project.title,
            domain: project.domain,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            wizardStep: project.wizardStep,
            wizardCompleted: project.wizardCompleted,
            updatedAt: project.updatedAt
        };
    }

    /**
     * DELETE /api/projects/:id
     * Projekt löschen (Cascade löscht alle verknüpften Daten)
     */
    async deleteProject(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // Prüfen ob Projekt existiert
        const existingProject = await prisma.project.findUnique({
            where: { id }
        });

        if (!existingProject) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        // Löschen (Cascade durch Prisma Schema)
        await prisma.project.delete({
            where: { id }
        });

        return {
            success: true,
            message: `Projekt ${id} erfolgreich gelöscht`
        };
    }

    /**
     * PATCH /api/projects/:id/business-understanding
     * Business Understanding Phase aktualisieren
     */
    async updateBusinessUnderstanding(
        projectId: string,
        data: UpdateBusinessUnderstandingRequest
    ) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // Upsert: Erstellen falls nicht vorhanden, sonst updaten
        const businessUnderstanding = await prisma.businessUnderstanding.upsert({
            where: { projectId: id },
            create: {
                projectId: id,
                ...data,
                status: 'DRAFT' // Beim ersten Ausfüllen auf DRAFT setzen
            },
            update: {
                ...data,
                status: 'DRAFT'
            }
        });

        // Wizard-Step erhöhen wenn nötig
        await this.advanceWizardStep(id, 1);

        // Nächste Phase freischalten (Data Characteristics)
        await this.unlockNextPhase(id, 'dataCharacteristics');

        return businessUnderstanding;
    }

    /**
     * PATCH /api/projects/:id/data-characteristics
     * Data Characteristics Phase aktualisieren
     */
    async updateDataCharacteristics(
        projectId: string,
        data: UpdateDataCharacteristicsRequest
    ) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const dataCharacteristics = await prisma.dataCharacteristics.upsert({
            where: { projectId: id },
            create: {
                projectId: id,
                ...data,
                variability: data.variability || 'NEVER',
                dataPreparationSteps: data.dataPreparationSteps || 'JOINS',
                status: 'DRAFT'
            },
            update: {
                ...data,
                status: 'DRAFT'
            }
        });

        await this.advanceWizardStep(id, 2);
        await this.unlockNextPhase(id, 'analysisConfig');

        return dataCharacteristics;
    }

    /**
     * POST /api/projects/:id/complete-wizard
     * Wizard abschließen und Berechnungslogik triggern
     * WICHTIG: Hier wird später der CalcService integriert
     */
    async completeWizard(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // 1. Projekt laden
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                businessUnderstanding: true,
                dataCharacteristics: true,
                analysisConfig: true
            }
        });

        if (!project) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        // 2. Validierung
        if (!project.businessUnderstanding || !project.dataCharacteristics) {
            throw new Error('Business Understanding und Data Characteristics müssen ausgefüllt sein');
        }

        // 3. Wizard als completed markieren
        await prisma.project.update({
            where: { id },
            data: {
                wizardCompleted: true,
                wizardStep: 6,
                status: 'IN_PROGRESS'
            }
        });

        // 4. CalculationRequest sollte vom FRONTEND kommen!
        // Deswegen hier nur Projekt zurückgeben
        return {
            success: true,
            message: 'Wizard abgeschlossen - Projekt bereit für Berechnung',
            projectId: id,
            project: {
                businessUnderstanding: project.businessUnderstanding,
                dataCharacteristics: project.dataCharacteristics,
                analysisConfig: project.analysisConfig
            }
        };
    }
    /**
     * POST /api/projects/:id/plan
     * Erstellt ProjectPlan aus Calculation-Metriken (die vom Frontend kommen)
     */
    async createProjectPlanFromMetrics(
        projectId: string,
        metrics: ProjectMetrics
    ) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // Prüfen ob Projekt existiert und Wizard abgeschlossen ist
        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true, wizardCompleted: true }
        });

        if (!project) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        if (!project.wizardCompleted) {
            throw new Error('Wizard muss zuerst abgeschlossen werden');
        }

        // Prüfen ob bereits ein ProjectPlan existiert
        const existingPlan = await prisma.projectPlan.findUnique({
            where: { projectId: id }
        });

        if (existingPlan) {
            throw new Error('Für dieses Projekt existiert bereits ein Projektplan');
        }

        // 1. ProjectPlan erstellen
        const projectPlan = await prisma.projectPlan.create({
            data: {
                projectId: id,
                estimatedDuration: Math.round(metrics.durationWeeks * 7), // Wochen → Tage
                estimatedEffort: metrics.effortPersonWeeks,
                calculatedComplexity: Math.round(metrics.categoryScores.complexity * 100),
                bufferPercentage: 15,
                phaseWeights: {
                    categoryScores: {
                        readiness: metrics.categoryScores.readiness,
                        complexity: metrics.categoryScores.complexity,
                        uncertainty: metrics.categoryScores.uncertainty
                    },
                    overallScore: metrics.overallScore ?? null,
                    projectSize: metrics.projectSize,
                    storyPoints: metrics.storyPoints,
                    sprintCount: metrics.sprintCount
                } as any
            }
        });

        // 2. Phasen aus metrics.phases erstellen
        for (const [index, phase] of metrics.phases.entries()) {
            const projectPhase = await prisma.projectPhase.create({
                data: {
                    projectPlanId: projectPlan.id,
                    name: phase.name,
                    phaseType: this.mapPhaseNameToType(phase.name),
                    description: `${phase.name} - ${Math.round(phase.percentage * 100)}% des Gesamtaufwands`,
                    orderIndex: index + 1,
                    estimatedDuration: Math.round(phase.durationWeeks * 7), // Wochen → Tage
                    estimatedEffort: phase.effortPersonWeeks
                }
            });

            // 3. Standard-Tasks für diese Phase erstellen
            await this.createStandardTasksForPhase(
                projectPlan.id,
                projectPhase.id,
                index + 1
            );
        }

        // ProjectPlan mit allen Relationen zurückgeben
        const completePlan = await prisma.projectPlan.findUnique({
            where: { id: projectPlan.id },
            include: {
                phases: {
                    include: {
                        tasks: true
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        return completePlan;
    }

    /**
     * PRIVATE: Mapped Phase-Name zu PhaseType Enum
     */
    private mapPhaseNameToType(phaseName: string): any {
        const mapping: Record<string, string> = {
            'Anforderungsanalyse': 'BUSINESS_UNDERSTANDING',
            'Datenaufbereitung': 'DATA_COLLECTION_EXPLORATION_PREPARATION',
            'Modellierung': 'ANALYSIS_MODELING',
            'Evaluation & Testing': 'EVALUATION',
            'Deployment & Dokumentation': 'DEPLOYMENT',
            'Deployment': 'DEPLOYMENT',
            'Utilization': 'UTILIZATION'
        };

        // Fallback: Wenn Name nicht gemappt werden kann, versuche intelligent zu matchen
        const nameLower = phaseName.toLowerCase();

        if (nameLower.includes('anforderung') || nameLower.includes('business')) {
            return 'BUSINESS_UNDERSTANDING';
        }
        if (nameLower.includes('daten') || nameLower.includes('data')) {
            return 'DATA_COLLECTION_EXPLORATION_PREPARATION';
        }
        if (nameLower.includes('modell') || nameLower.includes('analysis')) {
            return 'ANALYSIS_MODELING';
        }
        if (nameLower.includes('evaluation') || nameLower.includes('test')) {
            return 'EVALUATION';
        }
        if (nameLower.includes('deployment')) {
            return 'DEPLOYMENT';
        }
        if (nameLower.includes('utilization') || nameLower.includes('monitoring')) {
            return 'UTILIZATION';
        }

        // Default fallback
        return mapping[phaseName] || 'BUSINESS_UNDERSTANDING';
    }

    /**
     * PRIVATE: Erstellt Standard-Tasks für eine Phase
     */
    private async createStandardTasksForPhase(
        projectPlanId: number,
        phaseId: number,
        phaseNumber: number
    ) {
        // Basis-Tasks pro Phase (mapped zu StandardTaskType Enum)
        const phaseTaskMapping: Record<number, string[]> = {
            1: [
                'DEFINE_BUSINESS_GOAL',
                'IDENTIFY_PROJECT_TEAM_ROLES',
                'PLAN_TIMELINE',
                'ESTIMATE_COST'
            ],
            2: [
                'IDENTIFY_DATA_SOURCES',
                'VERIFY_DATA_AVAILABILITY',
                'ASSESS_DATA_VERACITY',
                'ESTIMATE_DATA_VOLUME',
                'DEFINE_DATA_PREPARATION_STEPS'
            ],
            3: [
                'DEFINE_DATA_SCIENCE_GOALS',
                'DETERMINE_ANALYTICS_TYPE',
                'SELECT_EVALUATION_METRICS',
                'SELECT_ANALYSIS_TOOLS'
            ],
            4: [
                'PLAN_TESTING_STRATEGY'
            ],
            5: [
                'DEFINE_TIMELINESS_REQUIREMENTS',
                'SELECT_DEPLOYMENT_TOOLS',
                'PLAN_MONITORING_ACTIVITIES',
                'PLAN_MAINTENANCE_STRATEGY'
            ]
        };

        const taskTypes = phaseTaskMapping[phaseNumber] || [];

        for (const taskType of taskTypes) {
            await prisma.phaseSteps.create({
                data: {
                    projectPlan: {
                        connect: { id: projectPlanId }
                    },
                    phase: {
                        connect: { id: phaseId }
                    },
                    taskType: taskType as any,
                    status: 'TODO',
                    estimatedDuration: 3, // Default 3 Tage
                    estimatedEffort: 2.0  // Default 2 Person-Tage
                }
            });
        }
    }



    /**
     * PRIVATE HELPER: Template-Phasen initialisieren
     */
    private async initializeTemplatePhases(projectId: number) {
        // Business Understanding mit DRAFT starten (erste Phase kann bearbeitet werden)
        await prisma.businessUnderstanding.create({
            data: {
                projectId,
                status: 'DRAFT'
            }
        });

        // Alle anderen Phasen mit BLOCKED Status
        await prisma.dataCharacteristics.create({
            data: {
                projectId,
                status: 'BLOCKED',
                variability: 'NEVER', // Required field
                dataPreparationSteps: 'JOINS' // Required field
            }
        });

        await prisma.analysisConfig.create({
            data: {
                projectId,
                status: 'BLOCKED'
            }
        });

        await prisma.deploymentConfig.create({
            data: {
                projectId,
                status: 'BLOCKED'
            }
        });

        await prisma.utilizationConfig.create({
            data: {
                projectId,
                status: 'BLOCKED'
            }
        });
    }

    /**
     * PRIVATE HELPER: Wizard-Step erhöhen
     */
    private async advanceWizardStep(projectId: number, targetStep: number) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { wizardStep: true }
        });

        if (project && project.wizardStep < targetStep) {
            await prisma.project.update({
                where: { id: projectId },
                data: { wizardStep: targetStep }
            });
        }
    }

    /**
     * PRIVATE HELPER: Nächste Phase freischalten
     */
    private async unlockNextPhase(
        projectId: number,
        phase: 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig'
    ) {
        const updateData: any = {
            status: 'READY'
        };

        switch (phase) {
            case 'dataCharacteristics':
                await prisma.dataCharacteristics.update({
                    where: { projectId },
                    data: updateData
                });
                break;
            case 'analysisConfig':
                await prisma.analysisConfig.update({
                    where: { projectId },
                    data: updateData
                });
                break;
            case 'deploymentConfig':
                await prisma.deploymentConfig.update({
                    where: { projectId },
                    data: updateData
                });
                break;
            case 'utilizationConfig':
                await prisma.utilizationConfig.update({
                    where: { projectId },
                    data: updateData
                });
                break;
        }
    }

    /**
     * PRIVATE HELPER: Workspace laden oder erstellen
     */
    private async getOrCreateWorkspace(workspaceId?: string) {
        if (workspaceId) {
            const id = this.parseId(workspaceId, 'Workspace-ID');
            const workspace = await prisma.localWorkspace.findUnique({
                where: { id }
            });

            if (!workspace) {
                throw new Error(`Workspace mit ID ${workspaceId} nicht gefunden`);
            }

            return workspace;
        }

        // Default Workspace
        let workspace = await prisma.localWorkspace.findFirst();

        if (!workspace) {
            workspace = await prisma.localWorkspace.create({
                data: { name: 'Default Workspace' }
            });
        }

        return workspace;
    }

    /**
     * PRIVATE HELPER: String zu Int konvertieren
     */
    private parseId(value: string, fieldName: string): number {
        const id = parseInt(value, 10);

        if (isNaN(id) || id <= 0) {
            throw new Error(`Ungültige ${fieldName}: ${value}`);
        }

        return id;
    }
}