/*
  Warnings:

  - The values [RANKING] on the enum `AnalyticsType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AnalyticsType_new" AS ENUM ('CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'ANOMALY_DETECTION', 'TIME_SERIES_FORECASTING', 'RECOMMENDATION', 'ASSOCIATION_RULE_LEARNING', 'OTHER');
ALTER TABLE "analysis_config" ALTER COLUMN "typeOfAnalytics" TYPE "AnalyticsType_new" USING ("typeOfAnalytics"::text::"AnalyticsType_new");
ALTER TYPE "AnalyticsType" RENAME TO "AnalyticsType_old";
ALTER TYPE "AnalyticsType_new" RENAME TO "AnalyticsType";
DROP TYPE "public"."AnalyticsType_old";
COMMIT;
