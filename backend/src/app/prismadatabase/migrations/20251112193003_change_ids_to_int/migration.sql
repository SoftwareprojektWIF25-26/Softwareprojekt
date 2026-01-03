/*
  Warnings:

  - The primary key for the `analysis_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `analysis_config` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `business_understanding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `business_understanding` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `data_characteristics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `data_characteristics` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `deployment_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `deployment_config` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `local_workspaces` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `local_workspaces` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `project_evaluations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `project_evaluations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `project_phases` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `project_phases` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `project_plans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `project_plans` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `task_dependencies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `task_dependencies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phaseId` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `utilization_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `utilization_config` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `projectId` on the `analysis_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectId` on the `business_understanding` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectId` on the `data_characteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectId` on the `deployment_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectId` on the `project_evaluations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectPlanId` on the `project_phases` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectId` on the `project_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `workspaceId` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectPlanId` on the `task_dependencies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fromTaskId` on the `task_dependencies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `toTaskId` on the `task_dependencies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectPlanId` on the `tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projectId` on the `utilization_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."analysis_config" DROP CONSTRAINT "analysis_config_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."business_understanding" DROP CONSTRAINT "business_understanding_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."data_characteristics" DROP CONSTRAINT "data_characteristics_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."deployment_config" DROP CONSTRAINT "deployment_config_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_evaluations" DROP CONSTRAINT "project_evaluations_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_phases" DROP CONSTRAINT "project_phases_projectPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_plans" DROP CONSTRAINT "project_plans_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task_dependencies" DROP CONSTRAINT "task_dependencies_fromTaskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task_dependencies" DROP CONSTRAINT "task_dependencies_projectPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task_dependencies" DROP CONSTRAINT "task_dependencies_toTaskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_phaseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_projectPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."utilization_config" DROP CONSTRAINT "utilization_config_projectId_fkey";

-- AlterTable
ALTER TABLE "analysis_config" DROP CONSTRAINT "analysis_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "analysis_config_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "business_understanding" DROP CONSTRAINT "business_understanding_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "business_understanding_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "data_characteristics" DROP CONSTRAINT "data_characteristics_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "data_characteristics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "deployment_config" DROP CONSTRAINT "deployment_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "deployment_config_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "local_workspaces" DROP CONSTRAINT "local_workspaces_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "local_workspaces_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_evaluations" DROP CONSTRAINT "project_evaluations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "project_evaluations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_phases" DROP CONSTRAINT "project_phases_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectPlanId",
ADD COLUMN     "projectPlanId" INTEGER NOT NULL,
ADD CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "project_plans" DROP CONSTRAINT "project_plans_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "project_plans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "workspaceId",
ADD COLUMN     "workspaceId" INTEGER NOT NULL,
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectPlanId",
ADD COLUMN     "projectPlanId" INTEGER NOT NULL,
DROP COLUMN "fromTaskId",
ADD COLUMN     "fromTaskId" INTEGER NOT NULL,
DROP COLUMN "toTaskId",
ADD COLUMN     "toTaskId" INTEGER NOT NULL,
ADD CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectPlanId",
ADD COLUMN     "projectPlanId" INTEGER NOT NULL,
DROP COLUMN "phaseId",
ADD COLUMN     "phaseId" SERIAL NOT NULL,
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "utilization_config" DROP CONSTRAINT "utilization_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "projectId",
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD CONSTRAINT "utilization_config_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_config_projectId_key" ON "analysis_config"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "business_understanding_projectId_key" ON "business_understanding"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "data_characteristics_projectId_key" ON "data_characteristics"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_config_projectId_key" ON "deployment_config"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_phases_projectPlanId_orderIndex_key" ON "project_phases"("projectPlanId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "project_plans_projectId_key" ON "project_plans"("projectId");

-- CreateIndex
CREATE INDEX "projects_workspaceId_status_idx" ON "projects"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_fromTaskId_toTaskId_key" ON "task_dependencies"("fromTaskId", "toTaskId");

-- CreateIndex
CREATE INDEX "tasks_projectPlanId_taskType_idx" ON "tasks"("projectPlanId", "taskType");

-- CreateIndex
CREATE INDEX "tasks_phaseId_idx" ON "tasks"("phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "utilization_config_projectId_key" ON "utilization_config"("projectId");

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
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "project_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_projectPlanId_fkey" FOREIGN KEY ("projectPlanId") REFERENCES "project_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
