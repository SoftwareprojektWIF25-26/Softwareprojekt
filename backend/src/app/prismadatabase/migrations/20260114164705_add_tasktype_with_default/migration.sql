/*
  Warnings:

  - Made the column `taskType` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "taskType" SET NOT NULL,
ALTER COLUMN "taskType" SET DEFAULT 'CUSTOM';
