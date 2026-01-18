// ============================================
// PROJEKT BASIS
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ProjectResponse {
  id: number;
  title: string;
  domain?: string;
  wizardStep: number;
  wizardCompleted: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  domain?: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  wizardStep: number;
  wizardCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

// ============================================
// WIZARD SCHRITT 1: BUSINESS UNDERSTANDING
// ============================================

export interface BusinessUnderstandingData {
  projectTitle?: string;
  projectDomain?: string;
  businessGoal?: string;
  formOfFinalProduct?: FormOfFinalProduct;
  projectTeamRoles?: TeamRole[];
  teamSize?: number;
  timelineValue?: number;
  timelineUnit?: TimelineUnit;
  estimatedCost?: number;
  toolsBusinessUnderstanding?: string;
}

export type FormOfFinalProduct =
  | 'REPORT'
  | 'APPLICATION_SOFTWARE'
  | 'AUTOMATED_DECISION_SYSTEM'
  | 'INSIGHT_DOCUMENT'
  | 'OTHER';

export type TeamRole =
  | 'DATA_SCIENTIST'
  | 'DATA_ENGINEER'
  | 'PROJECT_MANAGER'
  | 'DOMAIN_EXPERT'
  | 'BUSINESS_ANALYST'
  | 'IT_INFRASTRUCTURE'
  | 'ML_ENGINEER';

export type TimelineUnit = 'DAYS' | 'WEEKS' | 'MONTHS';

// ============================================
// WIZARD SCHRITT 2: DATA CHARACTERISTICS
// ============================================

export interface DataCharacteristicsData {
  dataAccess?: DataAccessType[];
  dataAvailability?: boolean;
  dataSources?: string[];
  dataSecurityConstraints?: string;
  velocity?: DataVelocity;
  veracity?: DataVeracity;
  variety?: DataVariety;
  volumeValue?: number;
  volumeUnit?: VolumeUnit;
  variability?: DataVariability;
  dataPreparationSteps?: DataPreparationStep[];
  toolsData?: string;
}

export type DataAccessType = 'INTERNAL' | 'EXTERNAL' | 'HYBRID';
export type DataVelocity = 'BATCH' | 'DAILY' | 'HOURLY' | 'CONTINUOUS';
export type DataVeracity = 'POOR' | 'MEDIUM' | 'GOOD' | 'EXCELLENT';
export type DataVariety = 'LOW' | 'MEDIUM' | 'HIGH';
export type VolumeUnit = 'RECORDS' | 'GB' | 'TB' | 'PB';
export type DataVariability = 'NEVER' | 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY';
export type DataPreparationStep =
  | 'JOINS'
  | 'DEDUPLICATION'
  | 'OUTLIER_DETECTION'
  | 'NORMALIZATION'
  | 'MISSING_VALUE_IMPUTATION'
  | 'FEATURE_ENGINEERING'
  | 'ONE_HOT_ENCODING'
  | 'DATA_CLEANING'
  | 'TRANSFORMATION';

// ============================================
// WIZARD SCHRITT 3: ANALYSIS CONFIG
// ============================================

export interface AnalysisConfigData {
  dataScienceGoals?: string;
  typeOfAnalytics?: AnalyticsType;
  evaluationMetrics?: string[];
  toolsAnalysis?: string;
}

export type AnalyticsType =
  | 'CLASSIFICATION'
  | 'REGRESSION'
  | 'CLUSTERING'
  | 'ANOMALY_DETECTION'
  | 'TIME_SERIES_FORECASTING'
  | 'RECOMMENDATION'
  | 'RANKING'
  | 'OTHER';

// ============================================
// WIZARD SCHRITT 4: DEPLOYMENT CONFIG
// ============================================

export interface DeploymentConfigData {
  timelinessOfAnalytics?: TimelinessLevel;
  addressedUsers?: string;
  tests?: string;
  projectIssues?: ProjectIssueType[];
  toolsDeployment?: string;
}

export type TimelinessLevel = 'BATCH' | 'DAILY' | 'NEARREALTIME' | 'REALTIME';
export type ProjectIssueType =
  | 'DATA_ACCESS'
  | 'DATA_QUALITY'
  | 'INSUFFICIENT_RESOURCES'
  | 'UNCLEAR_REQUIREMENTS'
  | 'TECHNICAL_COMPLEXITY'
  | 'TIMELINE_CONSTRAINTS'
  | 'TEAM_COORDINATION';

// ============================================
// WIZARD SCHRITT 5: UTILIZATION CONFIG
// ============================================

export interface UtilizationConfigData {
  monitoring?: string;
  maintenance?: string;
  toolsUtilization?: string;
}

// ============================================
// REQUEST TYPES (für API Calls)
// ============================================

export interface CreateProjectRequest {
  title: string;
  domain?: string;
}

export type UpdateBusinessUnderstandingRequest = BusinessUnderstandingData;
export type UpdateDataCharacteristicsRequest = DataCharacteristicsData;
export type UpdateAnalysisConfigRequest = AnalysisConfigData;
export type UpdateDeploymentConfigRequest = DeploymentConfigData;
export type UpdateUtilizationConfigRequest = UtilizationConfigData;

// ============================================
// VOLLSTÄNDIGES PROJEKT (mit allen Phasen)
// ============================================

export interface FullProject extends Project {
  businessUnderstanding?: BusinessUnderstandingData;
  dataCharacteristics?: DataCharacteristicsData;
  analysisConfig?: AnalysisConfigData;
  deploymentConfig?: DeploymentConfigData;
  utilizationConfig?: UtilizationConfigData;
}


// types/PathRouting.ts - ERGÄNZUNGEN am Ende

// ============================================
// RESPONSE TYPES (mit Utility Types)
// ============================================

// Helper Type für Backend-Responses (fügt id,  timestamps hinzu)
export interface DatabaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Jetzt einfach die vorhandenen Types erweitern!
export type BusinessUnderstandingResponse = BusinessUnderstandingData & DatabaseEntity;
export type DataCharacteristicsResponse = DataCharacteristicsData & DatabaseEntity;
export type AnalysisConfigResponse = AnalysisConfigData & DatabaseEntity;
export type DeploymentConfigResponse = DeploymentConfigData & DatabaseEntity;
export type UtilizationConfigResponse = UtilizationConfigData & DatabaseEntity;

// Complete Wizard Response
export interface CompleteWizardResponse {
  success: boolean;
  message: string;
  metrics: ProjectMetrics;
}

export interface ProjectMetrics {
  categoryScores: {
    readiness: number;
    complexity: number;
    uncertainty: number;
  };
  overallScore: number;
  effortPersonWeeks: number;
  durationWeeks: number;
  projectSize: string;
  storyPoints: number;
  sprintCount: number;
  phases: PhaseMetrics[];
  effortBreakdown: {
    baseEffort: number;
    bufferEffort: number;
    bufferPercentage: number;
    riskLevel: number;
  };
}

export interface PhaseMetrics {
  name: string;
  startWeek: number;
  durationWeeks: number;
  effortPersonWeeks: number;
  percentage: number;
  baseEffort: number;
  bufferEffort: number;
  baseDuration: number;
  bufferDuration: number;
  tasks?: PhaseTask[];
  phaseId?: number;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardData {
  project: {
    id: number;
    title: string;
    domain: string;
    status: ProjectStatus;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  wizardProgress: {
    currentStep: number;
    totalSteps: number;
    completed: boolean;
    percentage: number;
  };

  templatePhases: TemplatePhase[];
  templateProgress: number;

  projectPlanProgress: ProjectPlanProgress | null;
  ganttData: GanttPhase[];

  team: TeamInfo | null;

  configurations: {
    businessUnderstanding: BusinessUnderstandingResponse | null;
    dataCharacteristics: DataCharacteristicsResponse | null;
    analysisConfig: AnalysisConfigResponse | null;
    deploymentConfig: DeploymentConfigResponse | null;
    utilizationConfig: UtilizationConfigResponse | null;
  };

  evaluations: ProjectEvaluation[];
}

export interface TemplatePhase {
  name: string;
  status: TemplatePhaseStatus;
  completedAt: Date | null;
}

export interface ProjectPlanProgress {
  totalPhases: number;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  estimatedDuration: number;
  estimatedEffort: number;
  calculatedComplexity: number;
}
export interface BackendProjectPlan {
  projectPlanId: number;
  estimatedDuration: number | null;
  estimatedEffort: number | null;
  phases: BackendPhase[];
}
export interface GanttPhase {
  id: number;
  name: string;
  phaseType: string;
  description: string | null;
  orderIndex: number;
  startDate: Date | null;
  endDate: Date | null;
  estimatedDuration: number;
  estimatedEffort: number;
  tasks: GanttTask[];
}

export interface GanttTask {
  id: number;
  title: string;
  taskType: string;
  status: TaskStatus;
  estimatedDuration: number;
  startDate: Date | null;
  endDate: Date | null;
  dependencies:{
    toTaskId: number;
    totalTaskTitle: string;
    type: string;
  }
}

export interface TeamInfo {
  roles: string[];
  teamSize: number | null;
  timeline: {
    value: number | null;
    unit: TimelineUnit;
  };
  estimatedCost: number | null;
}

export interface ProjectEvaluation {
  id: number;
  category: string;
  rating: number;
  notes: string | null;
  createdAt: Date;
}

export type TaskType =
// ========== BUSINESS UNDERSTANDING ==========
  | 'ASSESS_SITUATION'
  | 'COMPOSE_PROJECT_TEAM'
  | 'SET_BUSINESS_OBJECTIVES'
  | 'DERIVE_DATA_SCIENCE_TARGETS'
  | 'CREATE_PROJECT_PLAN'

  // ========== DATA COLLECTION, EXPLORATION & PREPARATION ==========
  | 'IDENTIFY_DATA_SOURCES'
  | 'ACQUIRE_DATA'
  | 'DESCRIBE_DATA'
  | 'EXPLORE_DATA'
  | 'ASSESS_DATA_QUALITY'
  | 'PREPARE_DATA'
  | 'DEVELOP_DATA_PIPELINE'

  // ========== MODELING/ANALYSIS ==========
  | 'DEFINE_HYPOTHESIS'
  | 'SELECT_ANALYTICAL_MODEL'
  | 'DESIGN_TEST_FOR_ANALYTICAL_MODEL'
  | 'DEVELOP_ANALYTICAL_MODEL'
  | 'ASSESS_ANALYTICAL_MODEL'
  | 'DEVELOP_ANALYTICAL_PIPELINE'

  // ========== EVALUATION ==========
  | 'ASSESS_ANALYTICAL_RESULTS'
  | 'EVALUATE_PROCESS'
  | 'PERFORM_CHECKPOINT_DECISION'

  // ========== DEPLOYMENT ==========
  | 'PERFORM_IMPACT_ASSESSMENT'
  | 'PLAN_DEPLOYMENT'
  | 'PLAN_MONITORING_AND_MAINTENANCE'
  | 'TEST_DEPLOYMENT'
  | 'PERFORM_BUSINESS_INTEGRATION'
  | 'FINALIZE_PROJECT'

  // ========== UTILIZATION ==========
  | 'MONITOR_MODEL_PERFORMANCE'
  | 'MAINTAIN_DATA_PIPELINE'
  | 'UPDATE_MODEL'

  // Legacy
  | 'CUSTOM';


// Enums
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
export type TemplatePhaseStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

// ============================================
// STARTSEITE / PROJEKT LISTE
// ============================================

export interface ProjectListItem {
  id: number;
  title: string;
  domain: string;
  status: ProjectStatus;
  wizardStep: number;
  wizardCompleted: boolean;
  wizardProgress: number;
  taskProgress: {
    completed: number;
    total: number;
    percentage: number;
  } | null;
  teamRoles: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  startDate: Date | string | null;
  endDate: Date | string | null;
}

export interface StartPageData {
  projects: ProjectListItem[];
  statistics: ProjectStatistics;
  totalCount: number;
}

export interface ProjectStatistics {
  totalProjects: number;
  PLANNING: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  ON_HOLD: number;
  CANCELLED: number;
}

export interface defaultWeights{
  data_access: number;
  data_availability: number;
  stakeholder_support: number;
  tools_available: number;
  data_variety: number;
  data_velocity: number;
  num_sources: number;
  analytics_type: number;
  data_quality: number;
  privacy_concerns: number;
  missing_data: number;
  goal_clarity: number;
}

export interface BusinessUnderstandingTask{
  assess_situation: number;
  create_project_plan: number;
  compose_team: number;
  set_criteria_objectives: number;
  derive_targets: number;
}
export interface DataTasks {
  identify_sources: number;
  acquire_data: number;
  describe_data: number;
  explore_data: number;
  asses_data_quality: number;
  prepare_data: number;
  develop_pipeline: number;
}

export interface AnalysisTask {
  define_hypothesis: number;
  select_model: number;
  design_test: number;
  develop_model: number;
  assess_model: number;
  develop_pipeline: number;
}
export interface EvaluationTask{
  assess_results: number;
  evaluate_process: number;
}
export interface DeploymentTask {
  perform_assessment: number;
  plan_deployment: number;
  plan_monitoring_maintenance: number;
  test_deployment: number;
  perform_integration: number;
  finalize_project: number;
}

export interface PhaseTask {
  id: number;
  title: string;
  taskType: string;
  status: TaskStatus;
  estimatedDuration: number;
  startDate: Date | null;
  endDate: Date | null;
}

// BackendPhase erweitern (falls noch nicht komplett):
export interface BackendPhase {
  id: number;
  name: string;
  phaseType: string;
  orderIndex: number;
  startDate: Date | null;
  endDate: Date | null;
  estimatedDuration: number;
  estimatedEffort: number;
  baseEffort: number | null;
  bufferEffort: number | null;
  baseDuration: number | null;
  bufferDuration: number | null;
  tasks: PhaseTask[]; // ← Tasks sind enthalten!
}




