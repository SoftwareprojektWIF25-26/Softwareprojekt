// src/app/services/ProjectService.ts
import {ProjectMetrics, CalculatedTask, TaskWeightConfig} from "../../types.ts";
import { mappingService } from '../mapping/mapping.service.js';
import { calculationService } from '../calculation/calculationService.ts';
import { PrismaClient, ProjectStatus, TeamRole, TaskType } from '@prisma/client';
import { defaultWeights as configDefaults } from '../../config/defaultWeights.ts';
import {SettingsService} from "../settings/settings.service.ts";


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
    volumeUnit?: 'RECORDS' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
    variability?: any;
    dataPreparationSteps?: any[];
    toolsData?: string;
}

export interface UpdateDeploymentConfigRequest {
    timelinessOfAnalytics?: any;
    addressedUsers?: string;
    tests?: string;
    projectIssues?: string[];
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
        // Projekt erstellen
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
            variability: data.variability,
            dataPreparationSteps: data.dataPreparationSteps || [],
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

    async updateDeploymentConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const safeData: any = {
            timelinessOfAnalytics: data.timelinessOfAnalytics,
            addressedUsers: data.addressedUsers,
            tests: data.tests,
            toolsDeployment: data.toolsDeployment,
            status: 'DRAFT'
        };

        if (Array.isArray(data.projectIssues)) {
            safeData.projectIssues = data.projectIssues;
        }

        const deploymentConfig = await prisma.deploymentConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        await this.advanceWizardStep(id, 4);
        await this.unlockNextPhase(id, 'utilizationConfig');

        return deploymentConfig;
    }

    async updateUtilizationConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const config = await prisma.utilizationConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...data, status: 'COMPLETED' },
            update: { ...data, status: 'COMPLETED' }
        });

        return config;
    }

    // ======================================================
    // Wizard & Planning Logic
    // ======================================================

    async completeWizard(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // 1. Template-Daten laden
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

        // 2. In InputFields konvertieren
        const inputs = mappingService.mapToCalculationInputs({
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig,
            deploymentConfig: project.deploymentConfig,
            utilizationConfig: project.utilizationConfig
        });

        // 3. ProjectType bestimmen
        const projectType = mappingService.determineProjectType({
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig
        });

        // Settings laden

        const settings = await this.loadWeightSettings();
        const taskWeights = this.convertSettingsToTaskWeights(settings);
        const inputWeights = settings?.defaultWeights || configDefaults.defaultWeights;

        // 4. Berechnung durchführen
        const metrics = calculationService.calculate({
            inputs,
            weights: inputWeights,
            projectType,
            teamSize: project.businessUnderstanding?.teamSize || 3,
            taskWeights
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

    /**
     * Löscht den bestehenden Projektplan und berechnet ihn neu
     * auf Basis der aktuellen Konfigurationsdaten.
     */
    async recalculateProjectPlan(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');

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

        const inputs = mappingService.mapToCalculationInputs({
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig,
            deploymentConfig: project.deploymentConfig,
            utilizationConfig: project.utilizationConfig
        });

        const projectType = mappingService.determineProjectType({
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig
        });

        const settings = await this.loadWeightSettings();
        const taskWeights = this.convertSettingsToTaskWeights(settings);
        const inputWeights = settings?.defaultWeights || configDefaults.defaultWeights;

        const metrics = calculationService.calculate({
            inputs,
            weights: inputWeights,
            projectType,
            teamSize: project.businessUnderstanding?.teamSize,
            taskWeights
        });

        await this.createProjectPlanFromMetrics(String(id), metrics);

        return {
            success: true,
            message: 'Projektplan erfolgreich neu berechnet',
            projectId: id,
            metrics
        };
    }


    /**
     * Erstellt den Projektplan basierend auf den berechneten Metriken.
     * Löscht existierende Pläne, um saubere Neuberechnungen zu garantieren.
     */
    async createProjectPlanFromMetrics(projectId: string, metrics: ProjectMetrics) {
        const id = this.parseId(projectId, 'Projekt-ID');

        // 1. Projekt prüfen
        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true, wizardCompleted: true }
        });

        if (!project) {
            throw new Error(`Projekt mit ID ${id} nicht gefunden`);
        }

        // 2. Existierenden Plan bereinigen (Zombie-Fix)
        const existingPlan = await prisma.projectPlan.findUnique({
            where: { projectId: id }
        });

        if (existingPlan) {
            console.log(`♻️  ProjectPlan existiert bereits für Projekt ${id}. Lösche alten Plan für saubere Neuberechnung...`);
            await prisma.projectPlan.delete({
                where: { projectId: id }
            });
            console.log(`✅ Alter ProjectPlan gelöscht.`);
        }

        // 3. ProjectPlan Header erstellen
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

        console.log(`✅ ProjectPlan ${projectPlan.id} erstellt`);

        // 4. Phasen mit Tasks erstellen
        for (const [index, phase] of metrics.phases.entries()) {
            // Dauer in Tagen für Gantt-Chart
            const durationInDays = Math.round(phase.durationWeeks * 7);

            const projectPhase = await prisma.projectPhase.create({
                data: {
                    projectPlanId: projectPlan.id,
                    name: phase.name,
                    phaseType: this.mapPhaseNameToType(phase.name),
                    description: `${phase.name} - ${Math.round(phase.percentage * 100)}% des Gesamtaufwands`,
                    orderIndex: index + 1,
                    estimatedDuration: durationInDays,
                    estimatedEffort: phase.effortPersonWeeks,
                    baseEffort: phase.baseEffort,
                    bufferEffort: phase.bufferEffort,
                    baseDuration: phase.baseDuration,
                    bufferDuration: phase.bufferDuration
                }
            });

            console.log(`  📊 Phase ${index + 1}/${metrics.phases.length}: ${phase.name} (${phase.effortPersonWeeks} PW)`);

            // ✅ Tasks direkt aus calculationService verwenden
            await this.createTasksForPhase(
                projectPlan.id,
                projectPhase.id,
                phase.tasks  // ← Berechnete Tasks vom calculationService
            );
        }

        console.log(`✅ ProjectPlan komplett erstellt mit allen Phasen und Tasks`);
    }



    // ======================================================
    // Task-Generierung
    // ======================================================

    /**
     * Erstellt Tasks für eine Phase basierend auf den berechneten Tasks
     * vom calculationService (Single Source of Truth)
     */
    private async createTasksForPhase(
        projectPlanId: number,
        phaseId: number,
        calculatedTasks: CalculatedTask[]
    ) {
        console.log(`🔧 Erstelle ${calculatedTasks.length} Tasks für Phase ${phaseId}`);

        for (const task of calculatedTasks) {
            // Konvertierung: Person-Wochen → Arbeitstage (1 PW = 5 Arbeitstage)
            const estimatedDuration = Math.round(task.effortPersonWeeks * 5 * 10) / 10; // Auf 1 Dezimalstelle runden

            await prisma.phaseSteps.create({
                data: {
                    projectPlanId: projectPlanId,
                    phaseId: phaseId,
                    taskType: task.id,
                    title: task.name,
                    estimatedDuration: estimatedDuration,
                    status: 'TODO'
                }
            });

            console.log(`  ✅ Task: ${task.name} (${task.effortPersonWeeks} PW = ${estimatedDuration} Tage)`);
        }
    }

    // ======================================================
    // Private Helpers
    // ======================================================


    private async loadWeightSettings() {
        try {
            const settingsService = new SettingsService();
            return await settingsService.getWeightsSettings(1);
        } catch (error) {
            console.error('Fehler beim Laden der Settings:', error);
            //Fallback auf null → completeWizard() nutzt dann configDefaults
            return null;
        }
    }

    /**
     * Konvertiert DB-Settings in TaskWeightConfig (OHNE Utilization)
     */
    private convertSettingsToTaskWeights(settings: any): TaskWeightConfig | undefined {
        if (!settings) return undefined;

        const taskWeights: TaskWeightConfig = {};

        // Business Understanding
        if (settings.businessTasks) {
            taskWeights['Business Understanding'] = {
                'ASSESS_SITUATION': settings.businessTasks.assess_situation,
                'COMPOSE_PROJECT_TEAM': settings.businessTasks.compose_team,
                'SET_BUSINESS_OBJECTIVES': settings.businessTasks.set_criteria_objectives,
                'DERIVE_DATA_SCIENCE_TARGETS': settings.businessTasks.derive_targets,
                'CREATE_PROJECT_PLAN': settings.businessTasks.create_project_plan
            };
        }

        // Data Collection, Exploration & Preparation
        if (settings.dataTasks) {
            taskWeights['Data Collection, Exploration & Preparation'] = {
                'IDENTIFY_DATA_SOURCES': settings.dataTasks.identify_sources,
                'ACQUIRE_DATA': settings.dataTasks.acquire_data,
                'DESCRIBE_DATA': settings.dataTasks.describe_data,
                'EXPLORE_DATA': settings.dataTasks.explore_data,
                'ASSESS_DATA_QUALITY': settings.dataTasks.asses_data_quality,
                'PREPARE_DATA': settings.dataTasks.prepare_data,
                'DEVELOP_DATA_PIPELINE': settings.dataTasks.develop_pipeline
            };
        }

        // Analysis
        if (settings.analysisTasks) {
            taskWeights['Analysis'] = {
                'DEFINE_HYPOTHESIS': settings.analysisTasks.define_hypothesis,
                'SELECT_ANALYTICAL_MODEL': settings.analysisTasks.select_model,
                'DESIGN_TEST_FOR_ANALYTICAL_MODEL': settings.analysisTasks.design_test,
                'DEVELOP_ANALYTICAL_MODEL': settings.analysisTasks.develop_model,
                'ASSESS_ANALYTICAL_MODEL': settings.analysisTasks.assess_model,
                'DEVELOP_ANALYTICAL_PIPELINE': settings.analysisTasks.develop_pipeline
            };
        }

        // Evaluation
        if (settings.evaluationTasks) {
            taskWeights['Evaluation'] = {
                'ASSESS_ANALYTICAL_RESULTS': settings.evaluationTasks.assess_results,
                'EVALUATE_PROCESS': settings.evaluationTasks.evaluate_process
                // PERFORM_CHECKPOINT_DECISION fehlt im Schema - wird auf Default-Weight zurückfallen
            };
        }

        // Deployment
        if (settings.deploymentTasks) {
            taskWeights['Deployment'] = {
                'PERFORM_IMPACT_ASSESSMENT': settings.deploymentTasks.perform_assessment,
                'PLAN_DEPLOYMENT': settings.deploymentTasks.plan_deployment,
                'PLAN_MONITORING_AND_MAINTENANCE': settings.deploymentTasks.plan_monitoring_maintenance,
                'TEST_DEPLOYMENT': settings.deploymentTasks.test_deployment,
                'PERFORM_BUSINESS_INTEGRATION': settings.deploymentTasks.perform_integration,
                'FINALIZE_PROJECT': settings.deploymentTasks.finalize_project
            };
        }

        // Utilization wird NICHT gemappt (bleibt auf Default-Weights)

        return taskWeights;
    }

    private mapPhaseNameToType(phaseName: string): any {
        const nameLower = phaseName.toLowerCase();

        if (nameLower.includes('business') || nameLower.includes('understanding')) {
            return 'BUSINESS_UNDERSTANDING';
        }
        if (nameLower.includes('data') &&
            (nameLower.includes('collection') || nameLower.includes('exploration') || nameLower.includes('preparation'))) {
            return 'DATA_COLLECTION_EXPLORATION_PREPARATION';
        }
        if (nameLower.includes('analysis') || nameLower.includes('modeling')) {
            return 'ANALYSIS_MODELING';
        }
        if (nameLower.includes('evaluation') || nameLower.includes('testing')) {
            return 'EVALUATION';
        }
        if (nameLower.includes('deployment')) {
            return 'DEPLOYMENT';
        }
        if (nameLower.includes('utilization') || nameLower.includes('monitoring')) {
            return 'UTILIZATION';
        }

        return 'BUSINESS_UNDERSTANDING'; // Fallback
    }

    private async initializeTemplatePhases(projectId: number) {
        await prisma.businessUnderstanding.create({ data: { projectId, status: 'DRAFT' } });
        await prisma.dataCharacteristics.create({ data: { projectId, status: 'BLOCKED' } });
        await prisma.analysisConfig.create({ data: { projectId, status: 'BLOCKED' } });
        await prisma.deploymentConfig.create({ data: { projectId, status: 'BLOCKED' } });
        await prisma.utilizationConfig.create({ data: { projectId, status: 'BLOCKED' } });
    }

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

    private async unlockNextPhase(
        projectId: number,
        phase: 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig'
    ) {
        const updateData = { status: 'READY' };

        if (phase === 'dataCharacteristics') {
            await prisma.dataCharacteristics.update({
                where: { projectId },
                data: updateData as any
            });
        }
        if (phase === 'analysisConfig') {
            await prisma.analysisConfig.update({
                where: { projectId },
                data: updateData as any
            });
        }
        if (phase === 'deploymentConfig') {
            await prisma.deploymentConfig.update({
                where: { projectId },
                data: updateData as any
            });
        }
        if (phase === 'utilizationConfig') {
            await prisma.utilizationConfig.update({
                where: { projectId },
                data: updateData as any
            });
        }
    }

    private parseId(value: string, fieldName: string): number {
        const id = parseInt(value, 10);
        if (isNaN(id) || id <= 0) {
            throw new Error(`Ungültige ${fieldName}: ${value}`);
        }
        return id;
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