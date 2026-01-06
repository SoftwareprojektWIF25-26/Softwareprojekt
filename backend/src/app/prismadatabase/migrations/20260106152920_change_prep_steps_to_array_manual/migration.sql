-- 1. Spalte umwandeln: Von Einzelwert zu Array
ALTER TABLE "data_characteristics"
ALTER COLUMN "dataPreparationSteps"
TYPE "DataPreparationStep"[]
USING ARRAY["dataPreparationSteps"];

-- 2. Standardwert setzen (optional, aber sauber: leeres Array statt NULL)
ALTER TABLE "data_characteristics"
    ALTER COLUMN "dataPreparationSteps"
        SET DEFAULT ARRAY[]::"DataPreparationStep"[];
