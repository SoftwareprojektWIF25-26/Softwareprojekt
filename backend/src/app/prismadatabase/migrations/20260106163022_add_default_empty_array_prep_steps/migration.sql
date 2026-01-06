-- AlterTable
ALTER TABLE "data_characteristics" ALTER COLUMN "variability" DROP NOT NULL,
ALTER COLUMN "dataPreparationSteps" SET DEFAULT ARRAY[]::"DataPreparationStep"[];
