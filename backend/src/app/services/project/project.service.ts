// src/app/services/ProjectService.ts
// Falls ProjectMetrics nicht gefunden wird, stelle sicher, dass der Pfad stimmt
import { ProjectMetrics } from "../../types.ts";
import { mappingService } from '../mapping/mapping.service.js';
import { calculationService } from '../calculation/calculationService.ts';
import { PrismaClient, ProjectStatus, TeamRole } from '@prisma/client';


const prisma = new PrismaClient();

// ======================================================
// Request Interfaces
// ======================================================

export interface CreateProjectRequest {

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

// Request für Wizard-Steps
export interface UpdateBusinessUnderstandingRequest {
    businessGoal?: string;
    formOfFinalProduct?: any;
    projectTeamRoles?: TeamRole[];
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

export interface UpdateDeploymentConfigRequest {
    timelinessOfAnalytics?: any; // Oder spezifischer Enum Typ falls vorhanden
    addressedUsers?: string;
    tests?: string;
    projectIssues?: string[]; // Array von Strings/Enums
    toolsDeployment?: string;
}

export interface UpdateUtilizationConfigRequest {
    monitoring?: string;
    maintenance?: string;
    toolsUtilization?: string;
}

// ======================================================
// Service Class
// ======================================================

export class ProjectService {

    /**
     * POST /api/projects
     * Erstellt ein neues Projekt
     */
    async createProject(data: CreateProjectRequest) {

        // Projekt erstellen - direkt ohne Workspace-Relation
        const project = await prisma.project.create({
            data: {
                title: data.title,
                domain: data.domain,
                wizardStep: 0,
                wizardCompleted: false,
                status: 'PLANNING'
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
                // workspace: true,  <-- ENTFERNT
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

        // Template-Phasen Status zusammenstellen
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
            // Workspace Objekt entfernt
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
            }
            // include workspace entfernt
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
     * Projekt löschen
     */
    async deleteProject(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const existingProject = await prisma.project.findUnique({
            where: { id }
        });

        if (!existingProject) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        await prisma.project.delete({
            where: { id }
        });

        return {
            success: true,
            message: `Projekt ${id} erfolgreich gelöscht`
        };
    }

    // ======================================================
    // Template Phases Methods (Business, Data, etc.)
    // ======================================================

    async updateBusinessUnderstanding(projectId: string, data: UpdateBusinessUnderstandingRequest) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const businessUnderstanding = await prisma.businessUnderstanding.upsert({
            where: { projectId: id },
            create: { projectId: id, ...data, status: 'DRAFT' },
            update: { ...data, status: 'DRAFT' }
        });

        await this.advanceWizardStep(id, 1);
        await this.unlockNextPhase(id, 'dataCharacteristics');

        return businessUnderstanding;
    }

    async updateDataCharacteristics(projectId: string, data: UpdateDataCharacteristicsRequest) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const safeData: any = {
            dataAvailability: data.dataAvailability,
            dataSecurityConstraints: data.dataSecurityConstraints,
            velocity: data.velocity,
            veracity: data.veracity,
            variety: data.variety,
            volumeValue: data.volumeValue,
            volumeUnit: data.volumeUnit,
            toolsData: data.toolsData,
            variability: data.variability || 'NEVER',
            dataPreparationSteps: data.dataPreparationSteps || 'JOINS',
            status: 'DRAFT'
        };

        if (Array.isArray(data.dataSources)) {
            safeData.dataSources = data.dataSources;
        }

        if (Array.isArray(data.dataAccess)) {
            safeData.dataAccess = data.dataAccess;
        }

        const dataCharacteristics = await prisma.dataCharacteristics.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        await this.advanceWizardStep(id, 2);
        await this.unlockNextPhase(id, 'analysisConfig');

        return dataCharacteristics;
    }

    async updateUtilizationConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');
        // ... Daten mappen ...
        const config = await prisma.utilizationConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...data, status: 'COMPLETED' }, // oder READY
            update: { ...data, status: 'COMPLETED' }
        });
        return config;
    }

    /**
     * PATCH /api/projects/:id/deployment-config
     * Deployment Config Phase aktualisieren
     */
    async updateDeploymentConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // Sicheres Mapping der Felder, um ungewollte Daten zu filtern
        const safeData: any = {
            timelinessOfAnalytics: data.timelinessOfAnalytics,
            addressedUsers: data.addressedUsers,
            tests: data.tests,
            toolsDeployment: data.toolsDeployment,
            status: 'DRAFT' // oder 'COMPLETED', je nach Logik
        };

        // Arrays sicher übernehmen, falls vorhanden
        if (Array.isArray(data.projectIssues)) {
            safeData.projectIssues = data.projectIssues;
        }

        const deploymentConfig = await prisma.deploymentConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        // Wizard auf Schritt 4 setzen
        await this.advanceWizardStep(id, 4);

        // Nächste Phase (Utilization) freischalten
        await this.unlockNextPhase(id, 'utilizationConfig');

        return deploymentConfig;
    }





    // ======================================================
    // Wizard & Planning Logic
    // ======================================================

    async completeWizard(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // 1. Template-Daten laden (bleibt)
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                businessUnderstanding: true,
                dataCharacteristics: true,
                analysisConfig: true,
                deploymentConfig: true,
                utilizationConfig: true
            }
        });

        if (!project) throw new Error(`Projekt ${id} nicht gefunden`);

        // 2. NEU: In InputFields konvertieren
        const inputs = mappingService.mapToCalculationInputs({
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig,
            deploymentConfig: project.deploymentConfig,
            utilizationConfig: project.utilizationConfig
        });

        // 3. NEU: ProjectType bestimmen
        const projectType = mappingService.determineProjectType({
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig
        });

        // 4. NEU: Berechnung durchführen
        const metrics = calculationService.calculate({
            inputs,
            weights: {}, // defaultWeights später
            projectType,
            teamSize: project.businessUnderstanding?.teamSize || 3
        });

        // 5. Wizard als completed markieren
        await prisma.project.update({
            where: { id },
            data: {
                wizardCompleted: true,
                wizardStep: 6,
                status: 'IN_PROGRESS'
            }
        });

        // 6. Projektplan erstellen
        await this.createProjectPlanFromMetrics(String(id), metrics);

        return {
            success: true,
            message: 'Wizard abgeschlossen & Berechnung durchgeführt',
            projectId: id,
            metrics
        };
    }

    async createProjectPlanFromMetrics(projectId: string, metrics: ProjectMetrics) {
        const id = this.parseId(projectId, 'Projekt-ID');

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
                estimatedDuration: Math.round(metrics.durationWeeks * 7),
                estimatedEffort: metrics.effortPersonWeeks,
                calculatedComplexity: Math.round(metrics.categoryScores.complexity * 100),
                bufferPercentage: 15,
                phaseWeights: {
                    categoryScores: metrics.categoryScores,
                    overallScore: metrics.overallScore ?? null,
                    projectSize: metrics.projectSize,
                    storyPoints: metrics.storyPoints,
                    sprintCount: metrics.sprintCount
                } as any
            }
        });

        // 2. Phasen erstellen
        for (const [index, phase] of metrics.phases.entries()) {
            const projectPhase = await prisma.projectPhase.create({
                data: {
                    projectPlanId: projectPlan.id,
                    name: phase.name,
                    phaseType: this.mapPhaseNameToType(phase.name),
                    description: `${phase.name} - ${Math.round(phase.percentage * 100)}% des Gesamtaufwands`,
                    orderIndex: index + 1,
                    estimatedDuration: Math.round(phase.durationWeeks * 7),
                    estimatedEffort: phase.effortPersonWeeks,
                    baseEffort: phase.baseEffort,
                    bufferEffort: phase.bufferEffort,
                    baseDuration: phase.baseDuration,
                    bufferDuration: phase.bufferDuration
                }
            });

            // 3. Standard-Tasks erstellen
            await this.createStandardTasksForPhase(projectPlan.id, projectPhase.id, index + 1);
        }

        return await prisma.projectPlan.findUnique({
            where: { id: projectPlan.id },
            include: {
                phases: {
                    include: { tasks: true },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });
    }

    // ======================================================
    // Private Helpers
    // ======================================================

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

        const nameLower = phaseName.toLowerCase();
        if (nameLower.includes('anforderung') || nameLower.includes('business')) return 'BUSINESS_UNDERSTANDING';
        if (nameLower.includes('daten') || nameLower.includes('data')) return 'DATA_COLLECTION_EXPLORATION_PREPARATION';
        if (nameLower.includes('modell') || nameLower.includes('analysis')) return 'ANALYSIS_MODELING';
        if (nameLower.includes('evaluation') || nameLower.includes('test')) return 'EVALUATION';
        if (nameLower.includes('deployment')) return 'DEPLOYMENT';
        if (nameLower.includes('utilization') || nameLower.includes('monitoring')) return 'UTILIZATION';

        return mapping[phaseName] || 'BUSINESS_UNDERSTANDING';
    }

    private async createStandardTasksForPhase(projectPlanId: number, phaseId: number, phaseNumber: number) {
        const phaseTaskMapping: Record<number, string[]> = {
            1: ['DEFINE_BUSINESS_GOAL', 'IDENTIFY_PROJECT_TEAM_ROLES', 'PLAN_TIMELINE', 'ESTIMATE_COST'],
            2: ['IDENTIFY_DATA_SOURCES', 'VERIFY_DATA_AVAILABILITY', 'ASSESS_DATA_VERACITY', 'ESTIMATE_DATA_VOLUME', 'DEFINE_DATA_PREPARATION_STEPS'],
            3: ['DEFINE_DATA_SCIENCE_GOALS', 'DETERMINE_ANALYTICS_TYPE', 'SELECT_EVALUATION_METRICS', 'SELECT_ANALYSIS_TOOLS'],
            4: ['PLAN_TESTING_STRATEGY'],
            5: ['DEFINE_TIMELINESS_REQUIREMENTS', 'SELECT_DEPLOYMENT_TOOLS', 'PLAN_MONITORING_ACTIVITIES', 'PLAN_MAINTENANCE_STRATEGY']
        };

        const taskTypes = phaseTaskMapping[phaseNumber] || [];

        for (const taskType of taskTypes) {
            await prisma.phaseSteps.create({
                data: {
                    projectPlanId,
                    phaseId,
                    taskType: taskType as any,
                    status: 'TODO',
                    estimatedDuration: 3,
                    estimatedEffort: 2.0
                }
            });
        }
    }

    private async initializeTemplatePhases(projectId: number) {
        await prisma.businessUnderstanding.create({ data: { projectId, status: 'DRAFT'} });
        await prisma.dataCharacteristics.create({
            data: { projectId, status: 'BLOCKED', variability: 'NEVER', dataPreparationSteps: 'JOINS' }
        });
        await prisma.analysisConfig.create({ data: { projectId, status: 'BLOCKED' } });
        await prisma.deploymentConfig.create({ data: { projectId, status: 'BLOCKED' } });
        await prisma.utilizationConfig.create({ data: { projectId, status: 'BLOCKED' } });
    }

    private async advanceWizardStep(projectId: number, targetStep: number) {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { wizardStep: true } });
        if (project && project.wizardStep < targetStep) {
            await prisma.project.update({ where: { id: projectId }, data: { wizardStep: targetStep } });
        }
    }

    private async unlockNextPhase(projectId: number, phase: 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig') {
        const updateData = { status: 'READY' };
        // Dynamic table access logic simplified for readability
        if (phase === 'dataCharacteristics') await prisma.dataCharacteristics.update({ where: { projectId }, data: updateData as any });
        if (phase === 'analysisConfig') await prisma.analysisConfig.update({ where: { projectId }, data: updateData as any });
        if (phase === 'deploymentConfig') await prisma.deploymentConfig.update({ where: { projectId }, data: updateData as any });
        if (phase === 'utilizationConfig') await prisma.utilizationConfig.update({ where: { projectId }, data: updateData as any });
    }

    // getOrCreateWorkspace wurde gelöscht

    private parseId(value: string, fieldName: string): number {
        const id = parseInt(value, 10);
        if (isNaN(id) || id <= 0) throw new Error(`Ungültige ${fieldName}: ${value}`);
        return id;
    }
    async updateAnalysisConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const safeData: any = {
            dataScienceGoals: data.dataScienceGoals,
            typeOfAnalytics: data.typeOfAnalytics,
            toolsAnalysis: data.toolsAnalysis,
            status: 'DRAFT'
        };

        if (Array.isArray(data.evaluationMetrics)) {
            safeData.evaluationMetrics = data.evaluationMetrics;
        }

        const analysisConfig = await prisma.analysisConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        await this.advanceWizardStep(id, 3);
        await this.unlockNextPhase(id, 'deploymentConfig');

        return analysisConfig;
    }

    async debugBusinessUnderstanding() {
        const rows = await prisma.businessUnderstanding.findMany({
            select: {
                id: true,
                projectTeamRoles: true
            }
        });

        console.log('DEBUG business_understanding:', rows);
    }


}
