// types.ts - Typdefinitionen für das Projektschätzungssystem mit Task-basierter Berechnung

import type {
    DefaultWeights,
    BusinessUnderstandingTask,
    DataTasks,
    AnalysisTask,
    EvaluationTask,
    DeploymentTask,
    Productivity,
    Cost,
    TaskType
} from '@prisma/client';

export interface UpdateWeightsSettingsDto {
    defaultWeights: Omit<DefaultWeights, 'id' | 'settingsId'>;
    businessTasks: Omit<BusinessUnderstandingTask, 'id' | 'settingsId'>;
    dataTasks: Omit<DataTasks, 'id' | 'settingsId'>;
    analysisTasks: Omit<AnalysisTask, 'id' | 'settingsId'>;
    evaluationTasks: Omit<EvaluationTask, 'id' | 'settingsId'>;
    deploymentTasks: Omit<DeploymentTask, 'id' | 'settingsId'>;
    productivity: Omit<Productivity, 'id' | 'settingsId'>;
    cost: Omit<Cost, 'id' | 'settingsId'>;
}

export interface InputField {
    id: string;
    label: string;
    type: 'boolean' | 'percentage' | 'number' | 'select';
    value: any;
    category: 'readiness' | 'complexity' | 'uncertainty';
    isNegative?: boolean; // true wenn höherer Wert schlechter ist
    min?: number;
    max?: number;
    options?: string[];
}

export interface WeightConfig {
    [fieldId: string]: number;
}

export interface NormalizedValue {
    fieldId: string;
    normalized: number;
    weight: number;
}

export interface CategoryScore {
    readiness: number;
    complexity: number;
    uncertainty: number;
}

export enum ProjectType {
    REPORTING = 'REPORTING',
    CLASSIC_ML = 'CLASSIC_ML',
    DEEP_LEARNING = 'DEEP_LEARNING'
}

export enum ProjectSize {
    XS = 'XS',
    S = 'S',
    M = 'M',
    L = 'L',
    XL = 'XL'
}

//VEREINFACHT: Verwendet direkt TaskType aus Prisma
export interface PhaseTask {
    id: TaskType;  //Direkt Prisma Enum - kein String mehr!
    name: string;
    defaultWeight: number;
    description?: string;
}

//VEREINFACHT: Verwendet direkt TaskType
export interface CalculatedTask {
    id: TaskType;  // Direkt Prisma Enum
    name: string;
    weight: number;
    effortPersonWeeks: number;
    baseEffort: number;
    bufferEffort: number;
}

export interface ProjectPhase {
    name: string;
    startWeek: number;
    durationWeeks: number;
    effortPersonWeeks: number;
    percentage: number;

    // NEU: Aufschlüsselung für Visualisierung
    baseEffort?: number;           // Basis-Aufwand ohne Puffer
    bufferEffort?: number;         // Nur der Puffer
    baseDuration?: number;         // Basis-Dauer in Wochen
    bufferDuration?: number;       // Puffer-Dauer in Wochen
    tasks: CalculatedTask[];       // NEU: Tasks mit Aufwand
}

export interface ProjectMetrics {
    // Scores
    categoryScores: CategoryScore;
    overallScore?: number; // Optional: Gesamtscore

    // Aufwand & Dauer
    effortPersonWeeks: number;
    durationWeeks: number;

    // Aufwands-Aufschlüsselung
    effortBreakdown: {
        baseEffort: number;             // Basis-Aufwand ohne Puffer
        bufferEffort: number;           // Nur der Puffer
        bufferPercentage: number;       // Puffer in % (z.B. 0.15 = 15%)
        riskLevel: number;              // 0-1 (Basis für Puffer-Berechnung)
    };

    // Klassifizierung
    projectSize: ProjectSize;

    // Backlog
    storyPoints: number;
    sprintCount: number;

    // Gantt-Phasen
    phases: ProjectPhase[];
}

export interface CalculationRequest {
    inputs: InputField[];
    weights: WeightConfig;
    projectType: ProjectType;
    teamSize: number;
    productivityFactor?: number;
    velocityPerSprint?: number;
    includeRiskBuffer?: boolean;
    taskWeights?: TaskWeightConfig;
}

export interface CalculationResponse {
    success: boolean;
    metrics?: ProjectMetrics;
    error?: string;
}

//Task-Gewichtungen pro Phase
export interface TaskWeightConfig {
    [phaseName: string]: {
        [taskId: string]: number;
    };
}

// Konfiguration für Basis-Aufwand je Projekttyp
export const BASE_EFFORT: Record<ProjectType, number> = {
    [ProjectType.REPORTING]: 8,
    [ProjectType.CLASSIC_ML]: 16,
    [ProjectType.DEEP_LEARNING]: 36
};

// Konfiguration für Projektgrößen
export const PROJECT_SIZE_THRESHOLDS = [
    { size: ProjectSize.XS, max: 4 },
    { size: ProjectSize.S, max: 12 },
    { size: ProjectSize.M, max: 24 },
    { size: ProjectSize.L, max: 48 },
    { size: ProjectSize.XL, max: Infinity }
];

// Alle IDs sind jetzt TaskType Enums (UPPER_SNAKE_CASE)
export const DSLC_PHASES_WITH_TASKS: {
    name: string;
    basePercentage: number;
    tasks: PhaseTask[];
}[] = [
    {
        name: 'Business Understanding',
        basePercentage: 0.10,
        tasks: [
            { id: 'ASSESS_SITUATION' as TaskType, name: 'Assess Situation', defaultWeight: 0.20, description: 'Analyse der aktuellen Situation' },
            { id: 'COMPOSE_PROJECT_TEAM' as TaskType, name: 'Compose Project Team', defaultWeight: 0.15, description: 'Zusammenstellung des Teams' },
            { id: 'SET_BUSINESS_OBJECTIVES' as TaskType, name: 'Set Business Objectives', defaultWeight: 0.25, description: 'Definition von Geschäftszielen' },
            { id: 'DERIVE_DATA_SCIENCE_TARGETS' as TaskType, name: 'Derive Data Science Targets', defaultWeight: 0.20, description: 'Ableitung von DS-Zielen' },
            { id: 'CREATE_PROJECT_PLAN' as TaskType, name: 'Create Project Plan', defaultWeight: 0.20, description: 'Erstellung des Projektplans' }
        ]
    },
    {
        name: 'Data Collection, Exploration & Preparation',
        basePercentage: 0.25,
        tasks: [
            { id: 'IDENTIFY_DATA_SOURCES' as TaskType, name: 'Identify Data Sources', defaultWeight: 0.10 },
            { id: 'ACQUIRE_DATA' as TaskType, name: 'Acquire Data', defaultWeight: 0.15 },
            { id: 'DESCRIBE_DATA' as TaskType, name: 'Describe Data', defaultWeight: 0.10 },
            { id: 'EXPLORE_DATA' as TaskType, name: 'Explore Data', defaultWeight: 0.15 },
            { id: 'ASSESS_DATA_QUALITY' as TaskType, name: 'Assess Data Quality', defaultWeight: 0.15 },
            { id: 'PREPARE_DATA' as TaskType, name: 'Prepare Data', defaultWeight: 0.20 },
            { id: 'DEVELOP_DATA_PIPELINE' as TaskType, name: 'Develop Data Pipeline', defaultWeight: 0.15 }
        ]
    },
    {
        name: 'Analysis',
        basePercentage: 0.30,
        tasks: [
            { id: 'DEFINE_HYPOTHESIS' as TaskType, name: 'Define Hypothesis', defaultWeight: 0.10 },
            { id: 'SELECT_ANALYTICAL_MODEL' as TaskType, name: 'Select Analytical Model', defaultWeight: 0.15 },
            { id: 'DESIGN_TEST_FOR_ANALYTICAL_MODEL' as TaskType, name: 'Design Test for Analytical Model', defaultWeight: 0.10 },
            { id: 'DEVELOP_ANALYTICAL_MODEL' as TaskType, name: 'Develop Analytical Model', defaultWeight: 0.35 },
            { id: 'ASSESS_ANALYTICAL_MODEL' as TaskType, name: 'Assess Analytical Model', defaultWeight: 0.15 },
            { id: 'DEVELOP_ANALYTICAL_PIPELINE' as TaskType, name: 'Develop Analytical Pipeline', defaultWeight: 0.15 }
        ]
    },
    {
        name: 'Evaluation',
        basePercentage: 0.15,
        tasks: [
            { id: 'ASSESS_ANALYTICAL_RESULTS' as TaskType, name: 'Assess Analytical Results', defaultWeight: 0.60 },
            { id: 'EVALUATE_PROCESS' as TaskType, name: 'Evaluate Process', defaultWeight: 0.25 },
            { id: 'PERFORM_CHECKPOINT_DECISION' as TaskType, name: 'Perform Checkpoint Decision', defaultWeight: 0.15 }
        ]
    },
    {
        name: 'Deployment',
        basePercentage: 0.10,
        tasks: [
            { id: 'PERFORM_IMPACT_ASSESSMENT' as TaskType, name: 'Perform Impact Assessment', defaultWeight: 0.15 },
            { id: 'PLAN_DEPLOYMENT' as TaskType, name: 'Plan Deployment', defaultWeight: 0.20 },
            { id: 'PLAN_MONITORING_AND_MAINTENANCE' as TaskType, name: 'Plan Monitoring and Maintenance', defaultWeight: 0.15 },
            { id: 'TEST_DEPLOYMENT' as TaskType, name: 'Test Deployment', defaultWeight: 0.20 },
            { id: 'PERFORM_BUSINESS_INTEGRATION' as TaskType, name: 'Perform Business Integration', defaultWeight: 0.20 },
            { id: 'FINALIZE_PROJECT' as TaskType, name: 'Finalize Project', defaultWeight: 0.10 }
        ]
    },
    {
        name: 'Utilization',
        basePercentage: 0.10,
        tasks: [
            { id: 'MONITOR_MODEL_PERFORMANCE' as TaskType, name: 'Monitor Model Performance', defaultWeight: 0.40 },
            { id: 'MAINTAIN_DATA_PIPELINE' as TaskType, name: 'Maintain Data Pipeline', defaultWeight: 0.30 },
            { id: 'UPDATE_MODEL' as TaskType, name: 'Update Model', defaultWeight: 0.30 }
        ]
    }
];

export const BASE_PHASE_DISTRIBUTION = DSLC_PHASES_WITH_TASKS.map(phase => ({
    name: phase.name,
    percentage: phase.basePercentage
}));

export const PHASE_TRANSLATIONS: Record<string, string> = {
    'Business Understanding': 'Geschäftsverständnis',
    'Data Collection, Exploration & Preparation': 'Datenerfassung & -aufbereitung',
    'Analysis': 'Analyse & Modellierung',
    'Evaluation': 'Evaluation & Testing',
    'Deployment': 'Deployment',
    'Utilization': 'Betrieb & Monitoring'
};

export interface UpdateWeightsSettingsDto {
    defaultWeights: DefaultWeights
    businessTasks: BusinessUnderstandingTask
    dataTasks: DataTasks
    analysisTasks: AnalysisTask
    evaluationTasks: EvaluationTask
    deploymentTasks: DeploymentTask
    productivity: Productivity
    cost: Cost
}