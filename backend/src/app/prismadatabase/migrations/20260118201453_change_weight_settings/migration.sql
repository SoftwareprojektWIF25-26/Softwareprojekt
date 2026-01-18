-- CreateTable
CREATE TABLE "WeightsSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultWeights" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "data_access" DOUBLE PRECISION NOT NULL,
    "data_availability" DOUBLE PRECISION NOT NULL,
    "stakeholder_support" DOUBLE PRECISION NOT NULL,
    "tools_available" DOUBLE PRECISION NOT NULL,
    "data_variety" DOUBLE PRECISION NOT NULL,
    "data_velocity" DOUBLE PRECISION NOT NULL,
    "num_sources" DOUBLE PRECISION NOT NULL,
    "analytics_type" DOUBLE PRECISION NOT NULL,
    "data_quality" DOUBLE PRECISION NOT NULL,
    "privacy_concerns" DOUBLE PRECISION NOT NULL,
    "missing_data" DOUBLE PRECISION NOT NULL,
    "goal_clarity" DOUBLE PRECISION NOT NULL,
    "data_volume_complexity" DOUBLE PRECISION NOT NULL,
    "data_prep_complexity" DOUBLE PRECISION NOT NULL,
    "product_complexity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DefaultWeights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUnderstandingTask" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "assess_situation" DOUBLE PRECISION NOT NULL,
    "create_project_plan" DOUBLE PRECISION NOT NULL,
    "compose_team" DOUBLE PRECISION NOT NULL,
    "set_criteria_objectives" DOUBLE PRECISION NOT NULL,
    "derive_targets" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BusinessUnderstandingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataTasks" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "identify_sources" DOUBLE PRECISION NOT NULL,
    "acquire_data" DOUBLE PRECISION NOT NULL,
    "describe_data" DOUBLE PRECISION NOT NULL,
    "explore_data" DOUBLE PRECISION NOT NULL,
    "asses_data_quality" DOUBLE PRECISION NOT NULL,
    "prepare_data" DOUBLE PRECISION NOT NULL,
    "develop_pipeline" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DataTasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisTask" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "define_hypothesis" DOUBLE PRECISION NOT NULL,
    "select_model" DOUBLE PRECISION NOT NULL,
    "design_test" DOUBLE PRECISION NOT NULL,
    "develop_model" DOUBLE PRECISION NOT NULL,
    "assess_model" DOUBLE PRECISION NOT NULL,
    "develop_pipeline" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AnalysisTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationTask" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "assess_results" DOUBLE PRECISION NOT NULL,
    "evaluate_process" DOUBLE PRECISION NOT NULL,
    "perform_checkpoint_decision" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EvaluationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentTask" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "perform_assessment" DOUBLE PRECISION NOT NULL,
    "plan_deployment" DOUBLE PRECISION NOT NULL,
    "plan_monitoring_maintenance" DOUBLE PRECISION NOT NULL,
    "test_deployment" DOUBLE PRECISION NOT NULL,
    "perform_integration" DOUBLE PRECISION NOT NULL,
    "finalize_project" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DeploymentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productivity" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "productivity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Productivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cost" (
    "id" SERIAL NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "hourly_rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultWeights_settingsId_key" ON "DefaultWeights"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnderstandingTask_settingsId_key" ON "BusinessUnderstandingTask"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "DataTasks_settingsId_key" ON "DataTasks"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisTask_settingsId_key" ON "AnalysisTask"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationTask_settingsId_key" ON "EvaluationTask"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentTask_settingsId_key" ON "DeploymentTask"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "Productivity_settingsId_key" ON "Productivity"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "Cost_settingsId_key" ON "Cost"("settingsId");

-- AddForeignKey
ALTER TABLE "DefaultWeights" ADD CONSTRAINT "DefaultWeights_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUnderstandingTask" ADD CONSTRAINT "BusinessUnderstandingTask_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTasks" ADD CONSTRAINT "DataTasks_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisTask" ADD CONSTRAINT "AnalysisTask_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTask" ADD CONSTRAINT "EvaluationTask_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentTask" ADD CONSTRAINT "DeploymentTask_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productivity" ADD CONSTRAINT "Productivity_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WeightsSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
