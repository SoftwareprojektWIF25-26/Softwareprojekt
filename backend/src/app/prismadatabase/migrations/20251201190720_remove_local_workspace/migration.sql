/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `local_workspaces` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_workspaceId_fkey";

-- DropIndex
DROP INDEX "public"."projects_workspaceId_status_idx";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "workspaceId";

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "phaseId" DROP DEFAULT;
DROP SEQUENCE "tasks_phaseId_seq";

-- DropTable
DROP TABLE "public"."local_workspaces";

-- CreateIndex
CREATE INDEX "projects_updatedAt_idx" ON "projects"("updatedAt");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");
