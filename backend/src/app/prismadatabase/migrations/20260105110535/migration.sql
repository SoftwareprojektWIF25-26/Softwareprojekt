-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VolumeUnit" ADD VALUE 'MB';
ALTER TYPE "VolumeUnit" ADD VALUE 'KB';

-- AlterTable
ALTER TABLE "project_phases" ADD COLUMN     "baseDuration" INTEGER,
ADD COLUMN     "baseEffort" DOUBLE PRECISION,
ADD COLUMN     "bufferDuration" INTEGER,
ADD COLUMN     "bufferEffort" DOUBLE PRECISION;
