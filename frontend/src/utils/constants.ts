// src/constants.ts

// --- 1. Business Understanding ---
export const FORM_OF_PRODUCT_OPTIONS =
  ['REPORT', 'APPLICATION_SOFTWARE', 'OTHER'] as const;
export const FORM_LABELS: Record<string, string> = {
  REPORT: 'Report / Documentation',
  APPLICATION_SOFTWARE: 'Software Application',
  OTHER: 'Other'
};

export const TEAM_ROLE_OPTIONS = [
  'DATA_SCIENTIST',
  'DATA_ENGINEER',
  'PROJECT_MANAGER',
  'DOMAIN_EXPERT',
  'BUSINESS_ANALYST',
  'IT_INFRASTRUCTURE',
  'ML_ENGINEER'
] as const;

export const TEAM_ROLE_LABELS: Record<string, string> = {
  DATA_SCIENTIST: 'Data Scientist',
  DATA_ENGINEER: 'Data Engineer',
  PROJECT_MANAGER: 'Project Manager',
  DOMAIN_EXPERT: 'Domain Expert',
  BUSINESS_ANALYST: 'Business Analyst',
  IT_INFRASTRUCTURE: 'IT Infrastructure',
  ML_ENGINEER: 'ML Engineer'
};

export const TIMELINE_UNITS = ['DAYS', 'WEEKS', 'MONTHS'] as const;
export const UNIT_LABELS: Record<string, string> = { DAYS: 'Days', WEEKS: 'Weeks', MONTHS: 'Months' };

// --- 2. Data Characteristics ---
export const DATA_ACCESS_OPTIONS = ['INTERNAL', 'EXTERNAL', 'HYBRID'] as const;
export const DATA_ACCESS_LABELS: Record<string, string> = { INTERNAL: "Internal", EXTERNAL: "External", HYBRID: "Hybrid" };

export const VELOCITY_OPTIONS = ['BATCH', 'DAILY', 'HOURLY', 'CONTINUOUS'] as const;
export const VELOCITY_LABELS: Record<string, string> = {
  BATCH: 'Batch (Non-Real-time)',
  DAILY: 'Daily',
  HOURLY: 'Hourly',
  CONTINUOUS: 'Continuous (Real-time/Streaming)'
};

export const VERACITY_OPTIONS = ['POOR', 'MEDIUM', 'GOOD', 'EXCELLENT'] as const;
export const VERACITY_LABELS: Record<string, string> = { POOR: 'Poor', MEDIUM: 'Medium', GOOD: 'Good', EXCELLENT: 'Excellent' };

export const VARIETY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const VARIETY_LABELS: Record<string, string> = {
  LOW: 'Low (Single Data Type)',
  MEDIUM: 'Medium (Two Data Types)',
  HIGH: 'High (Structured, Semi-Structured, Unstructured)'
};

export const VARIABILITY_OPTIONS = ['NEVER', 'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY'] as const;
export const VARIABILITY_LABELS: Record<string, string> = {
  NEVER: 'Never',
  YEARLY: 'Yearly',
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  HOURLY: 'Hourly'
};

export const VOLUME_UNITS = ['RECORDS', 'GB', 'TB', 'PB','MB', 'KB'] as const;

export const PREPARATION_STEPS = [
  'JOINS', 'DEDUPLICATION', 'OUTLIER_DETECTION', 'NORMALIZATION', 'MISSING_VALUE_IMPUTATION',
  'FEATURE_ENGINEERING', 'ONE_HOT_ENCODING', 'DATA_CLEANING', 'TRANSFORMATION'] as const;

export const PREPARATION_LABELS: Record<string, string> = {
  JOINS: 'Joins',
  DEDUPLICATION: 'Deduplication',
  OUTLIER_DETECTION: 'Outlier Detection',
  NORMALIZATION: 'Normalization',
  MISSING_VALUE_IMPUTATION: 'Missing Value Imputation',
  FEATURE_ENGINEERING: 'Feature Engineering',
  ONE_HOT_ENCODING: 'One-Hot Encoding',
  DATA_CLEANING: 'Data Cleaning',
  TRANSFORMATION: 'Transformation'
};

// --- 3. Analysis ---
export const ANALYTICS_TYPES = ['CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'ANOMALY_DETECTION', 'TIME_SERIES_FORECASTING', 'RECOMMENDATION', 'RANKING', 'OTHER'] as const;
export const ANALYTICS_LABELS: Record<string, string> = {
  CLASSIFICATION: 'Classification',
  REGRESSION: 'Regression (Predicting Continuous Values)',
  CLUSTERING: 'Clustering',
  ANOMALY_DETECTION: 'Anomaly Detection',
  TIME_SERIES_FORECASTING: 'Time Series Forecasting',
  RECOMMENDATION: 'Recommendation System',
  RANKING: 'Ranking',
  OTHER: 'Other'
};

// --- 4. Deployment ---
export const TIMELINESS_LEVELS = ['BATCH', 'DAILY', 'NEARREALTIME', 'REALTIME'] as const;
export const TIMELINESS_LABELS: Record<string, string> = {
  BATCH: 'Batch (Once/Periodic)',
  DAILY: 'Daily',
  NEARREALTIME: 'Near-Realtime',
  REALTIME: 'Realtime'
};

export const PROJECT_ISSUE_TYPES = ['DATA_ACCESS', 'DATA_QUALITY', 'INSUFFICIENT_RESOURCES', 'UNCLEAR_REQUIREMENTS',
  'TECHNICAL_COMPLEXITY', 'TIMELINE_CONSTRAINTS', 'TEAM_COORDINATION'] as const;
export const ISSUE_LABELS: Record<string, string> = {
  DATA_ACCESS: 'Data Access',
  DATA_QUALITY: 'Data Quality',
  INSUFFICIENT_RESOURCES: 'Insufficient Resources',
  UNCLEAR_REQUIREMENTS: 'Unclear Requirements',
  TECHNICAL_COMPLEXITY: 'Technical Complexity',
  TIMELINE_CONSTRAINTS: 'Timeline Constraints',
  TEAM_COORDINATION: 'Team Coordination'
};

export const TASK_LABELS: Record<string, string> = {
  // ========== BUSINESS UNDERSTANDING ==========
  'ASSESS_SITUATION': 'Assess Situation',
  'COMPOSE_PROJECT_TEAM': 'Compose Project Team',
  'SET_BUSINESS_OBJECTIVES': 'Set Business Objectives and Success Criteria',
  'DERIVE_DATA_SCIENCE_TARGETS': 'Derive Data Science Targets',
  'CREATE_PROJECT_PLAN': 'Create Project Plan',

  // ========== DATA COLLECTION, EXPLORATION & PREPARATION ==========
  'IDENTIFY_DATA_SOURCES': 'Identify Data Sources',
  'ACQUIRE_DATA': 'Acquire Data',
  'DESCRIBE_DATA': 'Describe Data',
  'EXPLORE_DATA': 'Explore Data',
  'ASSESS_DATA_QUALITY': 'Assess Data Quality',
  'PREPARE_DATA': 'Prepare Data',
  'DEVELOP_DATA_PIPELINE': 'Develop Data Pipeline',

  // ========== MODELING/ANALYSIS ==========
  'DEFINE_HYPOTHESIS': 'Define Hypothesis',
  'SELECT_ANALYTICAL_MODEL': 'Select Analytical Model',
  'DESIGN_TEST_FOR_ANALYTICAL_MODEL': 'Design Test for Analytical Model',
  'DEVELOP_ANALYTICAL_MODEL': 'Develop Analytical Model',
  'ASSESS_ANALYTICAL_MODEL': 'Assess Analytical Model',
  'DEVELOP_ANALYTICAL_PIPELINE': 'Develop Analytical Pipeline',

  // ========== EVALUATION ==========
  'ASSESS_ANALYTICAL_RESULTS': 'Assess Analytical Results',
  'EVALUATE_PROCESS': 'Evaluate Process and Perform Checkpoint Decision',
  'PERFORM_CHECKPOINT_DECISION': 'Perform Checkpoint Decision',

  // ========== DEPLOYMENT ==========
  'PERFORM_IMPACT_ASSESSMENT': 'Perform Impact Assessment',
  'PLAN_DEPLOYMENT': 'Plan Deployment',
  'PLAN_MONITORING_AND_MAINTENANCE': 'Plan Monitoring and Maintenance',
  'TEST_DEPLOYMENT': 'Test Deployment',
  'PERFORM_BUSINESS_INTEGRATION': 'Perform Business Integration',
  'FINALIZE_PROJECT': 'Finalize Project',

  // ========== UTILIZATION ==========
  'MONITOR_MODEL_PERFORMANCE': 'Monitor Model Performance',
  'MAINTAIN_DATA_PIPELINE': 'Maintain Data Pipeline',
  'UPDATE_MODEL': 'Update Model',

  // Legacy
  'CUSTOM': 'Custom Task'
};

// Mapping: Phase -> Task Types
export const PHASE_TASKS: Record<string, TaskType[]> = {
  'BUSINESS_UNDERSTANDING': [
    'ASSESS_SITUATION',
    'COMPOSE_PROJECT_TEAM',
    'SET_BUSINESS_OBJECTIVES',
    'DERIVE_DATA_SCIENCE_TARGETS',
    'CREATE_PROJECT_PLAN'
  ],
  'DATA_COLLECTION': [
    'IDENTIFY_DATA_SOURCES',
    'ACQUIRE_DATA',
    'DESCRIBE_DATA',
    'EXPLORE_DATA',
    'ASSESS_DATA_QUALITY',
    'PREPARE_DATA',
    'DEVELOP_DATA_PIPELINE'
  ],
  'ANALYSIS': [
    'DEFINE_HYPOTHESIS',
    'SELECT_ANALYTICAL_MODEL',
    'DESIGN_TEST_FOR_ANALYTICAL_MODEL',
    'DEVELOP_ANALYTICAL_MODEL',
    'ASSESS_ANALYTICAL_MODEL',
    'DEVELOP_ANALYTICAL_PIPELINE'
  ],
  'EVALUATION': [
    'ASSESS_ANALYTICAL_RESULTS',
    'EVALUATE_PROCESS',
    'PERFORM_CHECKPOINT_DECISION'
  ],
  'DEPLOYMENT': [
    'PERFORM_IMPACT_ASSESSMENT',
    'PLAN_DEPLOYMENT',
    'PLAN_MONITORING_AND_MAINTENANCE',
    'TEST_DEPLOYMENT',
    'PERFORM_BUSINESS_INTEGRATION',
    'FINALIZE_PROJECT'
  ],
  'UTILIZATION': [
    'MONITOR_MODEL_PERFORMANCE',
    'MAINTAIN_DATA_PIPELINE',
    'UPDATE_MODEL'
  ]
};

