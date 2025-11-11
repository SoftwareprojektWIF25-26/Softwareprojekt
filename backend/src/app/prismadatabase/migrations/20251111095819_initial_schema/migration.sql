-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FormOfFinalProduct" AS ENUM ('REPORT', 'APPLICATION_SOFTWARE', 'AUTOMATED_DECISION_SYSTEM', 'INSIGHT_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TimelineUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('DATA_SCIENTIST', 'DATA_ENGINEER', 'PROJECT_MANAGER', 'DOMAIN_EXPERT', 'BUSINESS_ANALYST', 'IT_INFRASTRUCTURE', 'ML_ENGINEER');

-- CreateEnum
CREATE TYPE "DataVariability" AS ENUM ('NEVER', 'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY');

-- CreateEnum
CREATE TYPE "DataVeracity" AS ENUM ('POOR', 'MEDIUM', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "DataAccessType" AS ENUM ('INTERNAL', 'EXTERNAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "DataVelocity" AS ENUM ('BATCH', 'DAILY', 'HOURLY', 'CONTINUOUS');

-- CreateEnum
CREATE TYPE "DataVariety" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "VolumeUnit" AS ENUM ('RECORDS', 'GB', 'TB', 'PB');

-- CreateEnum
CREATE TYPE "DataPreparationStep" AS ENUM ('JOINS', 'DEDUPLICATION', 'OUTLIER_DETECTION', 'NORMALIZATION', 'MISSING_VALUE_IMPUTATION', 'FEATURE_ENGINEERING', 'ONE_HOT_ENCODING', 'DATA_CLEANING', 'TRANSFORMATION');

-- CreateEnum
CREATE TYPE "AnalyticsType" AS ENUM ('CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'ANOMALY_DETECTION', 'TIME_SERIES_FORECASTING', 'RECOMMENDATION', 'RANKING', 'OTHER');

-- CreateEnum
CREATE TYPE "TimelinessLevel" AS ENUM ('BATCH', 'DAILY', 'NEARREALTIME', 'REALTIME');

-- CreateEnum
CREATE TYPE "ProjectIssueType" AS ENUM ('DATA_ACCESS', 'DATA_QUALITY', 'INSUFFICIENT_RESOURCES', 'UNCLEAR_REQUIREMENTS', 'TECHNICAL_COMPLEXITY', 'TIMELINE_CONSTRAINTS', 'TEAM_COORDINATION');

-- CreateEnum
CREATE TYPE "TemplatePhaseStatus" AS ENUM ('BLOCKED', 'READY', 'DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('BUSINESS_UNDERSTANDING', 'DATA_COLLECTION_EXPLORATION_PREPARATION', 'ANALYSIS_MODELING', 'EVALUATION', 'DEPLOYMENT', 'UTILIZATION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "StandardTaskType" AS ENUM ('DEFINE_TITLE', 'DEFINE_DOMAIN', 'DEFINE_BUSINESS_GOAL', 'DEFINE_FINAL_PRODUCT_FORM', 'IDENTIFY_PROJECT_TEAM_ROLES', 'DETERMINE_TEAM_SIZE', 'PLAN_TIMELINE', 'ESTIMATE_COST', 'SELECT_TOOLS_BUSINESS_UNDERSTANDING', 'DETERMINE_DATA_ACCESS', 'VERIFY_DATA_AVAILABILITY', 'IDENTIFY_DATA_SOURCES', 'ASSESS_DATA_SECURITY_PRIVACY', 'EVALUATE_DATA_VELOCITY', 'ASSESS_DATA_VERACITY', 'DETERMINE_DATA_VARIETY', 'ESTIMATE_DATA_VOLUME', 'ASSESS_DATA_VARIABILITY', 'DEFINE_DATA_PREPARATION_STEPS', 'SELECT_DATA_TOOLS', 'DEFINE_DATA_SCIENCE_GOALS', 'DETERMINE_ANALYTICS_TYPE', 'SELECT_EVALUATION_METRICS', 'SELECT_ANALYSIS_TOOLS', 'DEFINE_TIMELINESS_REQUIREMENTS', 'IDENTIFY_ADDRESSED_USERS', 'PLAN_TESTING_STRATEGY', 'DOCUMENT_PROJECT_ISSUES', 'SELECT_DEPLOYMENT_TOOLS', 'PLAN_MONITORING_ACTIVITIES', 'PLAN_MAINTENANCE_STRATEGY', 'SELECT_UTILIZATION_TOOLS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

-- CreateTable
CREATE TABLE "local_workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Workspace',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "domain" TEXT,
    "wizardStep" INTEGER NOT NULL DEFAULT 0,
    "wizardCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_understanding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "businessGoal" TEXT,
    "formOfFinalProduct" "FormOfFinalProduct",
    "projectTeamRoles" "TeamRole"[],
    "teamSize" INTEGER,
    "timelineValue" INTEGER,
    "timelineUnit" "TimelineUnit" NOT NULL DEFAULT 'WEEKS',
    "estimatedCost" DOUBLE PRECISION,
    "toolsBusinessUnderstanding" TEXT,
    "status" "TemplatePhaseStatus" NOT NULL DEFAULT 'DRAFT',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "business_understanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_characteristics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dataAccess" "DataAccessType"[],
    "dataAvailability" BOOLEAN,
    "dataSources" TEXT[],
    "dataSecurityConstraints" TEXT,
    "velocity" "DataVelocity",
    "veracity" "DataVeracity",
    "variety" "DataVariety",
    "volumeValue" DOUBLE PRECISION,
    "volumeUnit" "VolumeUnit" NOT NULL DEFAULT 'RECORDS',
    "variability" "DataVariability" NOT NULL,
    "dataPreparationSteps" "DataPreparationStep" NOT NULL,
    "toolsData" TEXT,
    "status" "TemplatePhaseStatus" NOT NULL DEFAULT 'BLOCKED',
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_config" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dataScienceGoals" TEXT,
    "typeOfAnalytics" "AnalyticsType",
    "evaluationMetrics" TEXT[],
    "toolsAnalysis" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TemplatePhaseStatus" NOT NULL DEFAULT 'BLOCKED',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "analysis_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_config" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "timelinessOfAnalytics" "TimelinessLevel",
    "addressedUsers" TEXT,
    "tests" TEXT,
    "projectIssues" "ProjectIssueType"[],
    "toolsDeployment" TEXT,
    "status" "TemplatePhaseStatus" NOT NULL DEFAULT 'BLOCKED',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "deployment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilization_config" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "monitoring" TEXT,
    "maintenance" TEXT,
    "toolsUtilization" TEXT,
    "status" "TemplatePhaseStatus" NOT NULL DEFAULT 'BLOCKED',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "utilization_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_evaluations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_plans" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "estimatedDuration" INTEGER,
    "estimatedEffort" DOUBLE PRECISION,
    "calculatedComplexity" DOUBLE PRECISION,
    "bufferPercentage" INTEGER NOT NULL DEFAULT 15,
    "phaseWeights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phases" (
    "id" TEXT NOT NULL,
    "projectPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phaseType" "PhaseType" NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "estimatedDuration" INTEGER,
    "estimatedEffort" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "projectPlanId" TEXT NOT NULL,
    "phaseId" TEXT,
    "taskType" "StandardTaskType" NOT NULL,
    "customTitle" TEXT,
    "title" TEXT,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "estimatedDuration" INTEGER,
    "estimatedEffort" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "projectPlanId" TEXT NOT NULL,
    "fromTaskId" TEXT NOT NULL,
    "toTaskId" TEXT NOT NULL,
    "dependencyType" "DependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
    "lag" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_workspaceId_status_idx" ON "projects"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "business_understanding_projectId_key" ON "business_understanding"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "data_characteristics_projectId_key" ON "data_characteristics"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_config_projectId_key" ON "analysis_config"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_config_projectId_key" ON "deployment_config"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "utilization_config_projectId_key" ON "utilization_config"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_plans_projectId_key" ON "project_plans"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_phases_projectPlanId_orderIndex_key" ON "project_phases"("projectPlanId", "orderIndex");

-- CreateIndex
CREATE INDEX "tasks_projectPlanId_taskType_idx" ON "tasks"("projectPlanId", "taskType");

-- CreateIndex
CREATE INDEX "tasks_phaseId_idx" ON "tasks"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_fromTaskId_toTaskId_key" ON "task_dependencies"("fromTaskId", "toTaskId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "local_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_understanding" ADD CONSTRAINT "business_understanding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_characteristics" ADD CONSTRAINT "data_characteristics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_config" ADD CONSTRAINT "analysis_config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_config" ADD CONSTRAINT "deployment_config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilization_config" ADD CONSTRAINT "utilization_config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_evaluations" ADD CONSTRAINT "project_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plans" ADD CONSTRAINT "project_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_projectPlanId_fkey" FOREIGN KEY ("projectPlanId") REFERENCES "project_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectPlanId_fkey" FOREIGN KEY ("projectPlanId") REFERENCES "project_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_projectPlanId_fkey" FOREIGN KEY ("projectPlanId") REFERENCES "project_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
