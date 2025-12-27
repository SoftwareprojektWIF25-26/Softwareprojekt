// ============================================
// PROJEKT BASIS
// ============================================

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
  dataPreparationSteps?: DataPreparationStep;
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
