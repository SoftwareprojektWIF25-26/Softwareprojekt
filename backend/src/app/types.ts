// types.ts - Typdefinitionen für das Projektschätzungssystem mit Task-basierter Berechnung

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

// NEU: Task-Definition
export interface PhaseTask {
    id: string;
    name: string;
    defaultWeight: number;  // Standardgewichtung (summiert sich auf 1 pro Phase)
    description?: string;
}

// NEU: Task mit berechneten Werten
export interface CalculatedTask {
    id: string;
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
    productivityFactor?: number; // Standard: 0.6
    velocityPerSprint?: number; // Standard: 20 SP
    includeRiskBuffer?: boolean; // Standard: true
    taskWeights?: TaskWeightConfig;  // NEU: Optionale Task-Gewichtungen
}

export interface CalculationResponse {
    success: boolean;
    metrics?: ProjectMetrics;
    error?: string;
}

// NEU: Task-Gewichtungen pro Phase
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

// NEU: DSLC Phasen mit Tasks
export const DSLC_PHASES_WITH_TASKS: {
    name: string;
    basePercentage: number;
    tasks: PhaseTask[];
}[] = [
    {
        name: 'Business Understanding',
        basePercentage: 0.10,
        tasks: [
            {
                id: 'assess-situation',
                name: 'Assess Situation',
                defaultWeight: 0.20,
                description: 'Analyse der aktuellen Situation und Rahmenbedingungen'
            },
            {
                id: 'compose-team',
                name: 'Compose Project Team',
                defaultWeight: 0.15,
                description: 'Zusammenstellung des Projektteams'
            },
            {
                id: 'business-objectives',
                name: 'Set Business Objectives and Success Criteria',
                defaultWeight: 0.25,
                description: 'Definition von Geschäftszielen und Erfolgskriterien'
            },
            {
                id: 'data-science-targets',
                name: 'Derive Data Science Targets',
                defaultWeight: 0.20,
                description: 'Ableitung von Data Science Zielen'
            },
            {
                id: 'project-plan',
                name: 'Create Project Plan',
                defaultWeight: 0.20,
                description: 'Erstellung des Projektplans'
            }
        ]
    },
    {
        name: 'Data Collection, Exploration & Preparation',
        basePercentage: 0.25,
        tasks: [
            {
                id: 'identify-sources',
                name: 'Identify Data Sources',
                defaultWeight: 0.10,
                description: 'Identifikation relevanter Datenquellen'
            },
            {
                id: 'acquire-data',
                name: 'Acquire Data',
                defaultWeight: 0.15,
                description: 'Beschaffung der Daten'
            },
            {
                id: 'describe-data',
                name: 'Describe Data',
                defaultWeight: 0.10,
                description: 'Beschreibung der Datenstruktur'
            },
            {
                id: 'explore-data',
                name: 'Explore Data',
                defaultWeight: 0.15,
                description: 'Explorative Datenanalyse'
            },
            {
                id: 'assess-quality',
                name: 'Assess Data Quality',
                defaultWeight: 0.15,
                description: 'Bewertung der Datenqualität'
            },
            {
                id: 'prepare-data',
                name: 'Prepare Data',
                defaultWeight: 0.20,
                description: 'Datenaufbereitung und -transformation'
            },
            {
                id: 'data-pipeline',
                name: 'Develop Data Pipeline',
                defaultWeight: 0.15,
                description: 'Entwicklung der Datenpipeline'
            }
        ]
    },
    {
        name: 'Analysis',
        basePercentage: 0.30,
        tasks: [
            {
                id: 'define-hypothesis',
                name: 'Define Hypothesis',
                defaultWeight: 0.10,
                description: 'Definition von Hypothesen'
            },
            {
                id: 'select-model',
                name: 'Select Analytical Model',
                defaultWeight: 0.15,
                description: 'Auswahl des analytischen Modells'
            },
            {
                id: 'design-test',
                name: 'Design Test for Analytical Model',
                defaultWeight: 0.10,
                description: 'Design des Testverfahrens'
            },
            {
                id: 'develop-model',
                name: 'Develop Analytical Model',
                defaultWeight: 0.35,
                description: 'Entwicklung des analytischen Modells'
            },
            {
                id: 'assess-model',
                name: 'Assess Analytical Model',
                defaultWeight: 0.15,
                description: 'Bewertung des Modells'
            },
            {
                id: 'analytical-pipeline',
                name: 'Develop Analytical Pipeline',
                defaultWeight: 0.15,
                description: 'Entwicklung der Analyse-Pipeline'
            }
        ]
    },
    {
        name: 'Evaluation',
        basePercentage: 0.15,
        tasks: [
            {
                id: 'assess-results',
                name: 'Assess Analytical Results',
                defaultWeight: 0.60,
                description: 'Bewertung der analytischen Ergebnisse'
            },
            {
                id: 'evaluate-process',
                name: 'Evaluate Process and Perform Checkpoint Decision',
                defaultWeight: 0.40,
                description: 'Prozessevaluation und Checkpoint-Entscheidung'
            }
        ]
    },
    {
        name: 'Deployment',
        basePercentage: 0.10,
        tasks: [
            {
                id: 'impact-assessment',
                name: 'Perform Impact Assessment',
                defaultWeight: 0.15,
                description: 'Durchführung der Impact-Analyse'
            },
            {
                id: 'plan-deployment',
                name: 'Plan Deployment',
                defaultWeight: 0.20,
                description: 'Planung des Deployments'
            },
            {
                id: 'plan-monitoring',
                name: 'Plan Monitoring and Maintenance',
                defaultWeight: 0.15,
                description: 'Planung von Monitoring und Wartung'
            },
            {
                id: 'test-deployment',
                name: 'Test Deployment',
                defaultWeight: 0.20,
                description: 'Test des Deployments'
            },
            {
                id: 'business-integration',
                name: 'Perform Business Integration',
                defaultWeight: 0.20,
                description: 'Integration in Geschäftsprozesse'
            },
            {
                id: 'finalize-project',
                name: 'Finalize Project',
                defaultWeight: 0.10,
                description: 'Projektabschluss'
            }
        ]
    },
    {
        name: 'Utilization',
        basePercentage: 0.10,
        tasks: [
            {
                id: 'create-value',
                name: 'Create Value',
                defaultWeight: 0.30,
                description: 'Wertschöpfung aus dem System'
            },
            {
                id: 'monitor-system',
                name: 'Monitor System',
                defaultWeight: 0.25,
                description: 'System-Monitoring'
            },
            {
                id: 'support-user',
                name: 'Support User',
                defaultWeight: 0.20,
                description: 'Benutzer-Support'
            },
            {
                id: 'infrastructure-management',
                name: 'Perform Infrastructure Management',
                defaultWeight: 0.15,
                description: 'Infrastruktur-Management'
            },
            {
                id: 'perform-maintenance',
                name: 'Perform Maintenance',
                defaultWeight: 0.10,
                description: 'Wartung und Updates'
            }
        ]
    }
];

// Für Abwärtskompatibilität
export const BASE_PHASE_DISTRIBUTION = DSLC_PHASES_WITH_TASKS.map(phase => ({
    name: phase.name,
    percentage: phase.basePercentage
}));

// Deutschen Namen für UI -> optional falls wir das brauchen
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
    businessUnderstanding: BusinessUnderstandingTask
    dataTasks: DataTasks
    analysisTasks: AnalysisTask
    evaluationTasks: EvaluationTask
    deploymentTasks: DeploymentTask
}
