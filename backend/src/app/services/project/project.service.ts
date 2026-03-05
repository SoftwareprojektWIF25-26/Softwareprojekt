// src/app/services/ProjectService.ts
import { ProjectMetrics, CalculatedTask, TaskWeightConfig } from "../../types.ts";
import { mappingService } from '../mapping/mapping.service.js';
import { calculationService } from '../calculation/calculationService.ts';
import { PrismaClient, ProjectStatus, TeamRole, TaskType } from '@prisma/client';
import { defaultWeights as configDefaults } from '../../config/defaultWeights.ts';
import { SettingsService } from "../settings/settings.service.ts";

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

export type UnlockablePhase = 'dataCharacteristics' | 'analysisConfig' | 'deploymentConfig' | 'utilizationConfig';

// ======================================================
// Service Class
// ======================================================

export class ProjectService {

    /**
     * Initialisiert ein neues Projekt mitsamt den zugehörigen Konfigurationsphasen,
     * die zunächst für die Bearbeitung blockiert sind.
     */
    public async createProject(data: CreateProjectRequest) {
        const project = await prisma.project.create({
            data: {
                title: data.title,
                domain: data.domain,
                wizardStep: 0,
                wizardCompleted: false,
                status: 'PLANNING'
            }
        });

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
     * Lädt das Projekt mit allen relationalen Abhängigkeiten für die Detailansicht.
     */
    public async getProjectById(projectId: string) {
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
                            include: { tasks: true },
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

        const templatePhases = [
            { phase: 'businessUnderstanding', name: 'Business Understanding', status: project.businessUnderstanding?.status || 'BLOCKED', data: project.businessUnderstanding },
            { phase: 'dataCharacteristics', name: 'Data Characteristics', status: project.dataCharacteristics?.status || 'BLOCKED', data: project.dataCharacteristics },
            { phase: 'analysisConfig', name: 'Analysis Configuration', status: project.analysisConfig?.status || 'BLOCKED', data: project.analysisConfig },
            { phase: 'deploymentConfig', name: 'Deployment Configuration', status: project.deploymentConfig?.status || 'BLOCKED', data: project.deploymentConfig },
            { phase: 'utilizationConfig', name: 'Utilization Configuration', status: project.utilizationConfig?.status || 'BLOCKED', data: project.utilizationConfig }
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
            wizardProgress: {
                currentStep: project.wizardStep,
                totalSteps: 6,
                completed: project.wizardCompleted,
                percentage: Math.round((project.wizardStep / 6) * 100)
            },
            templatePhases,
            projectPlan: project.projectPlan,
            evaluations: project.evaluations
        };
    }

    public async updateProject(projectId: string, data: UpdateProjectRequest) {
        const id = this.parseId(projectId, 'Projekt-ID');
        await this.ensureProjectExists(id);

        return prisma.project.update({
            where: { id },
            data: { ...data, updatedAt: new Date() },
            select: {
                id: true,
                title: true,
                domain: true,
                status: true,
                startDate: true,
                endDate: true,
                wizardStep: true,
                wizardCompleted: true,
                updatedAt: true
            }
        });
    }

    public async deleteProject(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');
        await this.ensureProjectExists(id);

        await prisma.project.delete({ where: { id } });

        return {
            success: true,
            message: `Projekt ${id} erfolgreich gelöscht`
        };
    }

    // ======================================================
    // Wizard Steps (Phasen-Konfiguration)
    // ======================================================

    public async updateBusinessUnderstanding(projectId: string, data: UpdateBusinessUnderstandingRequest) {
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

    public async updateDataCharacteristics(projectId: string, data: UpdateDataCharacteristicsRequest) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const safeData = {
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
            status: 'DRAFT',
            ...(Array.isArray(data.dataSources) && { dataSources: data.dataSources }),
            ...(Array.isArray(data.dataAccess) && { dataAccess: data.dataAccess })
        };

        const dataCharacteristics = await prisma.dataCharacteristics.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        await this.advanceWizardStep(id, 2);
        await this.unlockNextPhase(id, 'analysisConfig');

        return dataCharacteristics;
    }

    public async updateAnalysisConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const safeData = {
            dataScienceGoals: data.dataScienceGoals,
            typeOfAnalytics: data.typeOfAnalytics,
            toolsAnalysis: data.toolsAnalysis,
            status: 'DRAFT',
            ...(Array.isArray(data.evaluationMetrics) && { evaluationMetrics: data.evaluationMetrics })
        };

        const analysisConfig = await prisma.analysisConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        await this.advanceWizardStep(id, 3);
        await this.unlockNextPhase(id, 'deploymentConfig');

        return analysisConfig;
    }

    public async updateDeploymentConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        const safeData = {
            timelinessOfAnalytics: data.timelinessOfAnalytics,
            addressedUsers: data.addressedUsers,
            tests: data.tests,
            toolsDeployment: data.toolsDeployment,
            status: 'DRAFT',
            ...(Array.isArray(data.projectIssues) && { projectIssues: data.projectIssues })
        };

        const deploymentConfig = await prisma.deploymentConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...safeData },
            update: safeData
        });

        await this.advanceWizardStep(id, 4);
        await this.unlockNextPhase(id, 'utilizationConfig');

        return deploymentConfig;
    }

    public async updateUtilizationConfig(projectId: string, data: any) {
        const id = this.parseId(projectId, 'Projekt-ID');

        return prisma.utilizationConfig.upsert({
            where: { projectId: id },
            create: { projectId: id, ...data, status: 'COMPLETED' },
            update: { ...data, status: 'COMPLETED' }
        });
    }

    // ======================================================
    // Kalkulation & Projektplan-Erstellung
    // ======================================================

    /**
     * Schließt den Setup-Wizard ab, berechnet den Aufwand und überführt
     * das Projekt in den Status 'IN_PROGRESS'.
     */
    public async completeWizard(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');
        const metrics = await this.processAndCalculateMetrics(id);

        await prisma.project.update({
            where: { id },
            data: {
                wizardCompleted: true,
                wizardStep: 6,
                status: 'IN_PROGRESS'
            }
        });

        await this.createProjectPlanFromMetrics(id, metrics);

        return {
            success: true,
            message: 'Wizard abgeschlossen & Berechnung durchgeführt',
            projectId: id,
            metrics
        };
    }

    /**
     * Verwirft den bestehenden Projektplan und erstellt basierend auf
     * aktualisierten Konfigurationen eine komplett neue Schätzung.
     */
    public async recalculateProjectPlan(projectId: string) {
        const id = this.parseId(projectId, 'Projekt-ID');
        const metrics = await this.processAndCalculateMetrics(id);

        await this.createProjectPlanFromMetrics(id, metrics);

        return {
            success: true,
            message: 'Projektplan erfolgreich neu berechnet',
            projectId: id,
            metrics
        };
    }

    /**
     * Überführt die berechneten Metriken in eine Datenbank-Struktur.
     * Eventuell bestehende alte Pläne ("Zombie-Pläne") werden vorab bereinigt.
     */
    private async createProjectPlanFromMetrics(projectId: number, metrics: ProjectMetrics) {
        await this.ensureProjectExists(projectId);

        const existingPlan = await prisma.projectPlan.findUnique({
            where: { projectId }
        });

        if (existingPlan) {
            console.log(`♻️ ProjectPlan existiert bereits für Projekt ${projectId}. Lösche alten Plan für saubere Neuberechnung...`);
            await prisma.projectPlan.delete({ where: { projectId } });
        }

        const projectPlan = await prisma.projectPlan.create({
            data: {
                projectId,
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

            await this.createTasksForPhase(projectPlan.id, projectPhase.id, phase.tasks);
        }
    }

    private async createTasksForPhase(projectPlanId: number, phaseId: number, calculatedTasks: CalculatedTask[]) {
        for (const task of calculatedTasks) {
            // Umrechnung: 1 Personenwoche (PW) entspricht 5 Arbeitstagen
            const estimatedDuration = Math.round(task.effortPersonWeeks * 5 * 10) / 10;

            await prisma.phaseSteps.create({
                data: {
                    projectPlanId,
                    phaseId,
                    taskType: task.id,
                    title: task.name,
                    estimatedDuration,
                    status: 'TODO'
                }
            });
        }
    }

    // ======================================================
    // Private Hilfsmethoden
    // ======================================================

    /**
     * Kapselt die Extraktion der Projektkonfigurationen und die Ausführung
     * des Calculation-Services. Wird beim initialen Berechnen und bei Neuberechnungen genutzt.
     */
    private async processAndCalculateMetrics(projectId: number): Promise<ProjectMetrics> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                businessUnderstanding: true,
                dataCharacteristics: true,
                analysisConfig: true,
                deploymentConfig: true,
                utilizationConfig: true
            }
        });

        if (!project) throw new Error(`Projekt ${projectId} nicht gefunden`);

        const configData = {
            businessUnderstanding: project.businessUnderstanding,
            dataCharacteristics: project.dataCharacteristics,
            analysisConfig: project.analysisConfig,
            deploymentConfig: project.deploymentConfig,
            utilizationConfig: project.utilizationConfig
        };

        const inputs = mappingService.mapToCalculationInputs(configData);
        const projectType = mappingService.determineProjectType(configData);

        const settings = await this.loadWeightSettings();
        const taskWeights = this.convertSettingsToTaskWeights(settings);
        const inputWeights = settings?.defaultWeights || configDefaults.defaultWeights;

        return calculationService.calculate({
            inputs,
            weights: inputWeights,
            projectType,
            teamSize: project.businessUnderstanding?.teamSize || 3,
            taskWeights
        });
    }

    private async ensureProjectExists(projectId: number) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new Error(`Projekt mit ID ${projectId} nicht gefunden`);
        return project;
    }

    private parseId(value: string, fieldName: string): number {
        const id = parseInt(value, 10);
        if (isNaN(id) || id <= 0) {
            throw new Error(`Ungültige ${fieldName}: ${value}`);
        }
        return id;
    }

    private async initializeTemplatePhases(projectId: number) {
        await Promise.all([
            prisma.businessUnderstanding.create({ data: { projectId, status: 'DRAFT' } }),
            prisma.dataCharacteristics.create({ data: { projectId, status: 'BLOCKED' } }),
            prisma.analysisConfig.create({ data: { projectId, status: 'BLOCKED' } }),
            prisma.deploymentConfig.create({ data: { projectId, status: 'BLOCKED' } }),
            prisma.utilizationConfig.create({ data: { projectId, status: 'BLOCKED' } })
        ]);
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

    /**
     * Schaltet dynamisch die nachfolgende Projektphase im Wizard frei.
     */
    private async unlockNextPhase(projectId: number, phase: UnlockablePhase) {
        const delegateMap: Record<UnlockablePhase, any> = {
            dataCharacteristics: prisma.dataCharacteristics,
            analysisConfig: prisma.analysisConfig,
            deploymentConfig: prisma.deploymentConfig,
            utilizationConfig: prisma.utilizationConfig
        };

        await delegateMap[phase].update({
            where: { projectId },
            data: { status: 'READY' }
        });
    }

    private async loadWeightSettings() {
        try {
            const settingsService = new SettingsService();
            return await settingsService.getWeightsSettings(1);
        } catch (error) {
            console.error('Fehler beim Laden der Settings. Verwende Standardwerte.', error);
            return null;
        }
    }

    private convertSettingsToTaskWeights(settings: any): TaskWeightConfig | undefined {
        if (!settings) return undefined;

        const taskWeights: TaskWeightConfig = {};

        if (settings.businessTasks) {
            taskWeights['Business Understanding'] = {
                'ASSESS_SITUATION': settings.businessTasks.assess_situation,
                'COMPOSE_PROJECT_TEAM': settings.businessTasks.compose_team,
                'SET_BUSINESS_OBJECTIVES': settings.businessTasks.set_criteria_objectives,
                'DERIVE_DATA_SCIENCE_TARGETS': settings.businessTasks.derive_targets,
                'CREATE_PROJECT_PLAN': settings.businessTasks.create_project_plan
            };
        }

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

        if (settings.evaluationTasks) {
            taskWeights['Evaluation'] = {
                'ASSESS_ANALYTICAL_RESULTS': settings.evaluationTasks.assess_results,
                'EVALUATE_PROCESS': settings.evaluationTasks.evaluate_process
            };
        }

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

        return taskWeights;
    }

    private mapPhaseNameToType(phaseName: string): any {
        const nameLower = phaseName.toLowerCase();

        if (nameLower.includes('business') || nameLower.includes('understanding')) return 'BUSINESS_UNDERSTANDING';
        if (nameLower.includes('data') && (nameLower.includes('collection') || nameLower.includes('exploration') || nameLower.includes('preparation'))) return 'DATA_COLLECTION_EXPLORATION_PREPARATION';
        if (nameLower.includes('analysis') || nameLower.includes('modeling')) return 'ANALYSIS_MODELING';
        if (nameLower.includes('evaluation') || nameLower.includes('testing')) return 'EVALUATION';
        if (nameLower.includes('deployment')) return 'DEPLOYMENT';
        if (nameLower.includes('utilization') || nameLower.includes('monitoring')) return 'UTILIZATION';

        return 'BUSINESS_UNDERSTANDING';
    }

    public async debugBusinessUnderstanding() {
        const rows = await prisma.businessUnderstanding.findMany({
            select: { id: true, projectTeamRoles: true }
        });
        console.log('DEBUG business_understanding:', rows);
    }
}
