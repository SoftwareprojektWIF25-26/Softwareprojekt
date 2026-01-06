// src/constants.ts

// --- 1. Business Understanding ---
export const FORM_OF_PRODUCT_OPTIONS = ['REPORT', 'APPLICATION_SOFTWARE', 'AUTOMATED_DECISION_SYSTEM', 'INSIGHT_DOCUMENT', 'OTHER'] as const;
export const FORM_LABELS: Record<string, string> = {
  REPORT: 'Report / Documentation',
  APPLICATION_SOFTWARE: 'Software Application',
  AUTOMATED_DECISION_SYSTEM: 'Automated Decision System',
  INSIGHT_DOCUMENT: 'Insight Document',
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
