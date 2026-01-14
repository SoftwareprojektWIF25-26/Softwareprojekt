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
    dataPreparationSteps?: any[];
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

        // 4. Berechnung durchführen
        const metrics = calculationService.calculate({
            inputs,
            weights: {}, // defaultWeights
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


        await this.createProjectPlanFromMetrics(String(id), metrics);

        return {
            success: true,
            message: 'Wizard abgeschlossen & Berechnung durchgeführt',
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

        /* Optional: Wizard-Check deaktivieren, falls man später neu berechnen will
        if (!project.wizardCompleted) {
            throw new Error('Wizard muss zuerst abgeschlossen werden');
        }
        */

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

        console.log(`✅ ProjectPlan ${projectPlan.id} created`);

        // 4. Phasen mit Tasks erstellen
        for (const [index, phase] of metrics.phases.entries()) {
            // Berechne Dauer der Phase in Tagen für Task-Verteilung
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

            console.log(`  📊 Phase ${index + 1}/${metrics.phases.length}: ${phase.name} (${durationInDays} Tage)`);

            // ✅ Tasks generieren mit projectPlan.id, projectPhase.id UND Dauer
            await this.createTasksForPhase(
                projectPlan.id,
                projectPhase.id,
                phase.name,
                durationInDays // <-- WICHTIG: Dauer übergeben!
            );
        }

        console.log(`🎉 ProjectPlan completed with ${metrics.phases.length} phases`);

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
// NEU: Task-Generierung mit CRISP-DM TaskTypes
// ======================================================

    /**
     * Erstellt Tasks für eine Phase basierend auf dem Phasennamen
     */
    private async createTasksForPhase(
        projectPlanId: number,
        phaseId: number,
        phaseName: string,
        phaseDuration: number // ✅ NEUER PARAMETER
    ) {
        console.log(`🔧 Generating tasks for phase: ${phaseName} (${phaseDuration} days)`);

        const phaseType = this.getPhaseTypeFromName(phaseName);

        // ✅ Dauer an Mapping-Service übergeben
        const taskSteps = mappingService.generatePhaseSteps(phaseType, phaseDuration);

        console.log(`  ✅ Generated ${taskSteps.length} tasks for ${phaseType}`);

        for (const taskData of taskSteps) {
            await prisma.phaseSteps.create({
                data: {
                    projectPlanId: projectPlanId,
                    phaseId: phaseId,
                    taskType: taskData.taskType as any,
                    title: taskData.title,
                    estimatedDuration: taskData.estimatedDuration,
                    status: taskData.status as any
                }
            });
        }
    }


    // ======================================================
    // Private Helpers
    // ======================================================

    /**
     * Helper: Phasenname → PhaseType für Task-Generierung
     */
    /**
     * Helper: Phasenname → PhaseType für Task-Generierung
     */
    private getPhaseTypeFromName(phaseName: string): string {
        const mapping: Record<string, string> = {
            'Business Understanding': 'BUSINESS_UNDERSTANDING',
            'Data Collection, Exploration & Preparation': 'DATA_COLLECTION_EXPLORATION_PREPARATION',
            'Analysis': 'ANALYSIS_MODELING',
            'Evaluation': 'EVALUATION',
            'Deployment': 'DEPLOYMENT',
            'Utilization': 'UTILIZATION'
        };

        return mapping[phaseName] || 'BUSINESS_UNDERSTANDING';
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
        await prisma.businessUnderstanding.create({ data: { projectId, status: 'DRAFT'} });
        await prisma.dataCharacteristics.create({
            data: { projectId, status: 'BLOCKED'}
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
