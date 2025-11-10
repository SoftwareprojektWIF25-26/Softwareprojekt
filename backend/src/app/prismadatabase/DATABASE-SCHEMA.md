# Datenbankschema: DS-Projektplanungstool (PostgreSQL)

#  LocalWorkspace (Arbeitsbereich)
| Feld      | Typ      | Beschreibung                                            | Schlüssel   |
| --------- | -------- | ------------------------------------------------------- | ----------- |
| id        | String   | Eindeutiger Identifikator (CUID)                        | Primary Key |
| name      | String   | Name des Arbeitsbereichs (Default: "Default Workspace") |             |
| createdAt | DateTime | Zeitstempel der Erstellung                              |             |
| updatedAt | DateTime | Zeitstempel der letzten Aktualisierung                  |             |
---
# Relationen:
projects → Project[] (1:n)



### Project
| Feld            | Typ           | Beschreibung                 | Schlüssel   |
| --------------- | ------------- | ---------------------------- | ----------- |
| id              | String        | Eindeutiger Identifikator    | Primary Key |
| workspaceId     | String        | Fremdschlüssel zum Workspace | Foreign Key |
| title           | String        | Titel des Projekts           |             |
| domain          | String?       | Fachliche Domäne             |             |
| wizardStep      | Int           | Wizard-Schritt (0-6)         |             |
| wizardCompleted | Boolean       | Wizard abgeschlossen?        |             |
| status          | ProjectStatus | Projektstatus                |             |
| startDate       | DateTime?     | Startdatum                   |             |
| endDate         | DateTime?     | Enddatum                     |             |
| createdAt       | DateTime      | Erstellungszeitpunkt         |             |
| updatedAt       | DateTime      | Letzte Aktualisierung        |             |

**Relationen:**

workspace → LocalWorkspace

businessUnderstanding → BusinessUnderstanding? (1:1)

dataCharacteristics → DataCharacteristics? (1:1)

analysisConfig → AnalysisConfig? (1:1)

deploymentConfig → DeploymentConfig? (1:1)

utilizationConfig → UtilizationConfig? (1:1)

projectPlan → ProjectPlan? (1:1)

evaluations → ProjectEvaluation[] (1:n)

**Enum: ProjectStatus**

PLANNING

IN_PROGRESS

ON_HOLD

COMPLETED

CANCELLED

---

##  ProjectPhasen incoming:

### 1. BusinessUnderstanding  (Template 1.x)
| Feld                       | Typ                 | Beschreibung               | Schlüssel           |
| -------------------------- | ------------------- | -------------------------- | ------------------- |
| id                         | String              | Eindeutiger Identifikator  | Primary Key         |
| projectId                  | String              | Fremdschlüssel zum Projekt | Unique, Foreign Key |
| businessGoal               | String?             | 1.1 Geschäftsziel          |                     |
| formOfFinalProduct         | FormOfFinalProduct? | 1.2 Form des Endprodukts   |                     |
| projectTeamRoles           | TeamRole[]          | 1.3 Teamrollen             |                     |
| teamSize                   | Int?                | 1.4 Teamgröße              |                     |
| timelineValue              | Int?                | 1.5 Zeitrahmen (Wert)      |                     |
| timelineUnit               | TimelineUnit        | 1.5 Zeiteinheit            |                     |
| estimatedCost              | Float?              | 1.6 Geschätzte Kosten      |                     |
| toolsBusinessUnderstanding | String?             | 1.7 Verwendete Tools       |                     |
| status                     | TemplatePhaseStatus | Phasenstatus               |                     |
| completedAt                | DateTime?           | Abschlusszeitpunkt         |                     |


**Enum: FormOfFinalProduct**

REPORT (Bericht/Dashboard)

APPLICATION_SOFTWARE (ML-Anwendung)

AUTOMATED_DECISION_SYSTEM (Automatisiertes System)

INSIGHT_DOCUMENT (Insights/Erkenntnisse)

OTHER

**Enum: TimelineUnit**

DAYS

WEEKS

MONTHS

**Enum: TeamRole**

DATA_SCIENTIST

DATA_ENGINEER

PROJECT_MANAGER

DOMAIN_EXPERT

BUSINESS_ANALYST

IT_INFRASTRUCTURE

ML_ENGINEER



### 2. DataCharacteristics (Template 2.x) 
| Feld                    | Typ                 | Beschreibung                 | Schlüssel           |
| ----------------------- | ------------------- | ---------------------------- | ------------------- |
| id                      | String              | Eindeutiger Identifikator    | Primary Key         |
| projectId               | String              | Fremdschlüssel zum Projekt   | Unique, Foreign Key |
| dataAccess              | DataAccessType[]    | 2.1 Datenzugriff             |                     |
| dataAvailability        | Boolean?            | 2.2 Datenverfügbarkeit       |                     |
| dataSources             | String[]            | 2.3 Datenquellen             |                     |
| dataSecurityConstraints | String?             | 2.4 Sicherheit & Datenschutz |                     |
| velocity                | DataVelocity?       | 2.5 Geschwindigkeit          |                     |
| veracity                | DataVeracity?       | 2.6 Datenqualität            |                     |
| variety                 | DataVariety?        | 2.7 Datenvielfalt            |                     |
| volumeValue             | Float?              | 2.8 Datenvolumen (Wert)      |                     |
| volumeUnit              | VolumeUnit          | 2.8 Volumeneinheit           |                     |
| variability             | DataVariability     | 2.9 Veränderlichkeit         |                     |
| dataPreparationSteps    | DataPreparationStep | 2.10 Datenaufbereitung       |                     |
| toolsData               | String?             | 2.11 Verwendete Tools        |                     |
| status                  | TemplatePhaseStatus | Phasenstatus                 |                     |
| completedAt             | DateTime?           | Abschlusszeitpunkt           |                     |
| updatedAt               | DateTime            | Letzte Aktualisierung        |                     |
**Enums:**

DataAccessType: INTERNAL, EXTERNAL, HYBRID

DataVelocity: BATCH, DAILY, HOURLY, CONTINUOUS

DataVeracity: POOR, MEDIUM, GOOD, EXCELLENT

DataVariety: LOW, MEDIUM, HIGH

VolumeUnit: RECORDS, GB, TB, PB

DataVariability: NEVER, YEARLY, MONTHLY, WEEKLY, DAILY, HOURLY

DataPreparationStep: JOINS, DEDUPLICATION, OUTLIER_DETECTION, NORMALIZATION, MISSING_VALUE_IMPUTATION, FEATURE_ENGINEERING, ONE_HOT_ENCODING, DATA_CLEANING, TRANSFORMATION

---



### 3. AnalysisConfig (Template 3.x)
| Feld              | Typ                 | Beschreibung               | Schlüssel           |
| ----------------- | ------------------- | -------------------------- | ------------------- |
| id                | String              | Eindeutiger Identifikator  | Primary Key         |
| projectId         | String              | Fremdschlüssel zum Projekt | Unique, Foreign Key |
| dataScienceGoals  | String?             | 3.1 Data Science Ziele     |                     |
| typeOfAnalytics   | AnalyticsType?      | 3.2 Typ der Analytik       |                     |
| evaluationMetrics | String[]            | 3.3 Evaluationsmetriken    |                     |
| toolsAnalysis     | String?             | 3.4 Verwendete Tools       |                     |
| status            | TemplatePhaseStatus | Phasenstatus               |                     |
| completedAt       | DateTime?           | Abschlusszeitpunkt         |                     |
| updatedAt         | DateTime            | Letzte Aktualisierung      |                     |

**Enum: AnalyticsType**

CLASSIFICATION

REGRESSION

CLUSTERING

ANOMALY_DETECTION

TIME_SERIES_FORECASTING

RECOMMENDATION

RANKING

OTHER




### 4. DeploymentConfig (Template 4.x)
| Feld                  | Typ                 | Beschreibung                | Schlüssel           |
| --------------------- | ------------------- | --------------------------- | ------------------- |
| id                    | String              | Eindeutiger Identifikator   | Primary Key         |
| projectId             | String              | Fremdschlüssel zum Projekt  | Unique, Foreign Key |
| timelinessOfAnalytics | TimelinessLevel?    | 4.1 Aktualität der Analytik |                     |
| addressedUsers        | String?             | 4.2 Adressierte Nutzer      |                     |
| tests                 | String?             | 4.3 Durchgeführte Tests     |                     |
| projectIssues         | ProjectIssueType[]  | 4.4 Projektprobleme         |                     |
| toolsDeployment       | String?             | 4.5 Verwendete Tools        |                     |
| status                | TemplatePhaseStatus | Phasenstatus                |                     |
| completedAt           | DateTime?           | Abschlusszeitpunkt          |                     |

**Enum: TimelinessLevel**

BATCH

DAILY

NEARREALTIME

REALTIME

**Enum: ProjectIssueType**

DATA_ACCESS

DATA_QUALITY

INSUFFICIENT_RESOURCES

UNCLEAR_REQUIREMENTS

TECHNICAL_COMPLEXITY

TIMELINE_CONSTRAINTS

TEAM_COORDINATION



### 5. UtilizationConfig (Template 5.x)
| Feld             | Typ                 | Beschreibung               | Schlüssel           |
| ---------------- | ------------------- | -------------------------- | ------------------- |
| id               | String              | Eindeutiger Identifikator  | Primary Key         |
| projectId        | String              | Fremdschlüssel zum Projekt | Unique, Foreign Key |
| monitoring       | String?             | 5.1 Monitoring-Strategie   |                     |
| maintenance      | String?             | 5.2 Wartungsstrategie      |                     |
| toolsUtilization | String?             | 5.3 Verwendete Tools       |                     |
| status           | TemplatePhaseStatus | Phasenstatus               |                     |
| completedAt      | DateTime?           | Abschlusszeitpunkt         |                     |





### ProjectEvaluation
| Feld      | Typ      | Beschreibung               | Schlüssel   |
| --------- | -------- | -------------------------- | ----------- |
| id        | String   | Eindeutiger Identifikator  | Primary Key |
| projectId | String   | Fremdschlüssel zum Projekt | Foreign Key |
| category  | String   | Bewertungskategorie        |             |
| rating    | Int      | Bewertung (1-5 Skala)      |             |
| notes     | String?  | Notizen                    |             |
| createdAt | DateTime | Erstellungszeitpunkt       |             |




### ProjectPlan (Planning Engine Output)
| Feld                 | Typ      | Beschreibung                  | Schlüssel           |
| -------------------- | -------- | ----------------------------- | ------------------- |
| id                   | String   | Eindeutiger Identifikator     | Primary Key         |
| projectId            | String   | Fremdschlüssel zum Projekt    | Unique, Foreign Key |
| estimatedDuration    | Int?     | Gesamtdauer in Tagen          |                     |
| estimatedEffort      | Float?   | Gesamtaufwand in Person-Tagen |                     |
| calculatedComplexity | Float?   | Komplexitätsscore (0-100)     |                     |
| bufferPercentage     | Int      | Puffer-Prozentsatz            |                     |
| phaseWeights         | Json?    | Phasengewichtung              |                     |
| createdAt            | DateTime | Erstellungszeitpunkt          |                     |
| updatedAt            | DateTime | Letzte Aktualisierung         |                     |

**Relationen:**

phases → ProjectPhase[] (1:n)

tasks → PhaseTask[] (1:n)

dependencies → TaskDependency[] (1:n)


### ProjectPhase (CRISP-DM/DSLC)
| Feld              | Typ       | Beschreibung                      | Schlüssel   |
| ----------------- | --------- | --------------------------------- | ----------- |
| id                | String    | Eindeutiger Identifikator         | Primary Key |
| projectPlanId     | String    | Fremdschlüssel zum Projektplan    | Foreign Key |
| name              | String    | Phasenname                        |             |
| phaseType         | PhaseType | Phasentyp                         |             |
| description       | String?   | Beschreibung                      |             |
| orderIndex        | Int       | Reihenfolge                       |             |
| estimatedDuration | Int?      | Geschätzte Dauer (Tage)           |             |
| estimatedEffort   | Float?    | Geschätzter Aufwand (Person-Tage) |             |
| startDate         | DateTime? | Startdatum                        |             |
| endDate           | DateTime? | Enddatum                          |             |
| createdAt         | DateTime  | Erstellungszeitpunkt              |             |

**Relationen:**

tasks → PhaseTask[] (1:n)

**Enum: PhaseType**

BUSINESS_UNDERSTANDING

DATA_COLLECTION_EXPLORATION_PREPARATION

ANALYSIS_MODELING

EVALUATION

DEPLOYMENT

UTILIZATION

**Enum: TemplatePhaseStatus**

BLOCKED

READY

DRAFT

COMPLETED

## PhaseTask (Tasks)

| Feld              | Typ              | Beschreibung                      | Schlüssel   |
| ----------------- | ---------------- | --------------------------------- | ----------- |
| id                | String           | Eindeutiger Identifikator         | Primary Key |
| projectPlanId     | String           | Fremdschlüssel zum Projektplan    | Foreign Key |
| phaseId           | String?          | Fremdschlüssel zur Phase          | Foreign Key |
| taskType          | StandardTaskType | Aufgabentyp                       |             |
| customTitle       | String?          | Benutzerdefinierter Titel         |             |
| title             | String?          | Titel                             |             |
| description       | String?          | Beschreibung                      |             |
| status            | TaskStatus       | Status                            |             |
| estimatedDuration | Int?             | Geschätzte Dauer (Tage)           |             |
| estimatedEffort   | Float?           | Geschätzter Aufwand (Person-Tage) |             |
| startDate         | DateTime?        | Startdatum                        |             |
| endDate           | DateTime?        | Enddatum                          |             |
| createdAt         | DateTime         | Erstellungszeitpunkt              |             |
| updatedAt         | DateTime         | Letzte Aktualisierung             |             |

**Relationen:**

dependenciesFrom → TaskDependency[] (1:n)

dependenciesTo → TaskDependency[] (1:n)

**Enum: TaskStatus**

TODO

IN_PROGRESS

BLOCKED

DONE

**Enum: StandardTaskType (Auszug)**

... (siehe vollständige Liste im Template bzw. Schema)

CUSTOM

## PhaseTaskDependency (Aufgabenabhängigkeiten)

| Feld           | Typ            | Beschreibung                   | Schlüssel   |
| -------------- | -------------- | ------------------------------ | ----------- |
| id             | String         | Eindeutiger Identifikator      | Primary Key |
| projectPlanId  | String         | Fremdschlüssel zum Projektplan | Foreign Key |
| fromTaskId     | String         | Quell-Aufgabe                  | Foreign Key |
| toTaskId       | String         | Ziel-Aufgabe                   | Foreign Key |
| dependencyType | DependencyType | Typ der Abhängigkeit           |             |
| lag            | Int            | Verzögerung                    |             |
| createdAt      | DateTime       | Erstellungszeitpunkt           |             |

**Enum: DependencyType**

FINISH_TO_START

START_TO_START

FINISH_TO_FINISH

START_TO_FINISH