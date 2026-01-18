// types.ts - Typdefinitionen für das Projektschätzungssystem

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
    [fieldId: string]: number; // Rohgewichtung (Standard = 1.0)
}

export interface NormalizedValue {
    fieldId: string;
    normalized: number; // 0-1
    weight: number; // normalisierte Gewichtung
}

export interface CategoryScore {
    readiness: number; // R
    complexity: number; // C
    uncertainty: number; // U
}

export interface ProjectMetrics {
    // Scores
    categoryScores: CategoryScore;
    overallScore?: number; // Optional: Gesamtscore

    // Aufwand & Dauer
    effortPersonWeeks: number;
    durationWeeks: number;

    //Aufwands-Aufschlüsselung
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
}

export interface CalculationRequest {
    inputs: InputField[];
    weights: WeightConfig;
    projectType: ProjectType;
    teamSize: number;
    productivityFactor?: number; // Standard: 0.6
    velocityPerSprint?: number; // Standard: 20 SP
    includeRiskBuffer?: boolean; // NEU: Standard: true
}

export interface CalculationResponse {
    success: boolean;
    metrics?: ProjectMetrics;
    error?: string;
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

// Phasenverteilung nach DSLC (Data Science Lifecycle) - 6 Phasen
// Entspricht dem Standard aus der Literatur und CRISP-DM
export const BASE_PHASE_DISTRIBUTION = [
    { name: 'Business Understanding', percentage: 0.10 },
    { name: 'Data Collection, Exploration & Preparation', percentage: 0.25 },
    { name: 'Analysis', percentage: 0.30 },
    { name: 'Evaluation', percentage: 0.15 },
    { name: 'Deployment', percentage: 0.10 },
    { name: 'Utilization', percentage: 0.10 }
];


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
