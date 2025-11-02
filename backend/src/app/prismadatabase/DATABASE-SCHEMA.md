# Datenbankschema: DS-Projektplanungstool (PostgreSQL)

## 1. User & Authentication

### User
| Feld           | Typ         | Beschreibung/Relation                     |
|----------------|-------------|-------------------------------------------|
| id             | String      | @id @default(cuid())                       |
| email          | String      | @unique                                    |
| name           | String?     |                                           |
| passwordHash   | String      | (bcrypt)                                   |
| createdAt      | DateTime    | @default(now())                            |
| updatedAt      | DateTime    | @updatedAt                                 |
| workspaces     | WorkspaceMember[] | Relation zu Workspaces                |
| ownedProjects  | Project[]   | Relation zu Projekten (als Owner)         |
| assignedTasks  | Task[]      | Relation zu Aufgaben (als Assignee)       |
| artifactReviews| ArtifactReview[] | Relation zu Artefakt-Reviews         |

---

## 2. Workspace (Arbeitsbereiche)

### Workspace
| Feld         | Typ         | Beschreibung/Relation                     |
|--------------|-------------|-------------------------------------------|
| id           | String      | @id @default(cuid())                       |
| name         | String      |                                           |
| description  | String?     |                                           |
| createdAt    | DateTime    | @default(now())                            |
| updatedAt    | DateTime    | @updatedAt                                 |
| members      | WorkspaceMember[] | Relation zu Mitgliedern               |
| projects     | Project[]   | Relation zu Projekten                     |

### WorkspaceMember
| Feld         | Typ         | Beschreibung/Relation                     |
|--------------|-------------|-------------------------------------------|
| id           | String      | @id @default(cuid())                       |
| role         | Role        | @default(VIEWER)                           |
| workspaceId  | String      | Relation zu Workspace                      |
| workspace    | Workspace   | Relation zu Workspace                      |
| userId       | String      | Relation zu User                           |
| user         | User        | Relation zu User                           |
| createdAt    | DateTime    | @default(now())                            |

**Enum: Role**
- OWNER
- VIEWER

---

## 3. Project (Projekte)

### Project
| Feld         | Typ         | Beschreibung/Relation                     |
|--------------|-------------|-------------------------------------------|
| id           | String      | @id @default(cuid())                       |
| name         | String      |                                           |
| description  | String?     |                                           |
| status       | ProjectStatus | @default(PLANNING)                      |
| startDate    | DateTime?   |                                           |
| endDate      | DateTime?   |                                           |
| workspaceId  | String      | Relation zu Workspace                     |
| workspace    | Workspace   | Relation zu Workspace                     |
| ownerId      | String      | Relation zu User (Owner)                  |
| owner        | User        | Relation zu User (Owner)                  |
| createdAt    | DateTime    | @default(now())                            |
| updatedAt    | DateTime    | @updatedAt                                 |
| profile      | ProjectProfile? | Relation zu Projektprofil             |
| phases       | Phase[]     | Relation zu Phasen                        |
| tasks        | Task[]      | Relation zu Aufgaben                      |
| milestones   | Milestone[] | Relation zu Meilensteinen                 |
| risks        | Risk[]      | Relation zu Risiken                       |

**Enum: ProjectStatus**
- PLANNING
- IN_PROGRESS
- ON_HOLD
- COMPLETED
- CANCELLED

---

## 4. Project Profile (Projekt-Steckbrief)

### ProjectProfile
| Feld                | Typ         | Beschreibung/Relation                     |
|---------------------|-------------|-------------------------------------------|
| id                  | String      | @id @default(cuid())                       |
| projectId           | String      | Relation zu Project                        |
| project             | Project     | Relation zu Project                        |
| analyticsType       | String?     | z.B. "Classification", "Regression"       |
| dataVolume          | DataScale?  |                                           |
| dataVariety         | DataScale?  |                                           |
| dataVelocity        | DataScale?  |                                           |
| dataVeracity        | DataScale?  |                                           |
| targetMetrics       | String?     | Ziel-Metriken (JSON Array)                 |
| teamSize            | Int?        |                                           |
| hasDeadline         | Boolean     | @default(false)                            |
| iterationCount      | Int         | @default(1)                                |
| phasingWeights      | Json?       | Gewichtung der Phasen (JSON Object)       |
| bufferPercentage    | Int         | @default(15)                               |
| createdAt           | DateTime    | @default(now())                            |
| updatedAt           | DateTime    | @updatedAt                                 |

**Enum: DataScale**
- LOW
- MEDIUM
- HIGH
- VERY_HIGH

---

## 5. Phase (DS-Lifecycle Phasen)

### Phase
| Feld         | Typ         | Beschreibung/Relation                     |
|--------------|-------------|-------------------------------------------|
| id           | String      | @id @default(cuid())                       |
| name         | String      |                                           |
| type         | PhaseType   |                                           |
| orderIndex   | Int         | Reihenfolge (1-6)                         |
| startDate    | DateTime?   |                                           |
| endDate      | DateTime?   |                                           |
| duration     | Int?        | Tage                                      |
| projectId    | String      | Relation zu Project                       |
| project      | Project     | Relation zu Project                       |
| createdAt    | DateTime    | @default(now())                            |
| updatedAt    | DateTime    | @updatedAt                                 |
| tasks        | Task[]      | Relation zu Aufgaben                      |
| artifacts    | Artifact[]  | Relation zu Artefakten                    |
| milestones   | Milestone[] | Relation zu Meilensteinen                 |

**Enum: PhaseType**
- BUSINESS_UNDERSTANDING
- DATA_COLLECTION
- DATA_EXPLORATION
- DATA_PREPARATION
- ANALYSIS_MODELING
- EVALUATION
- DEPLOYMENT_UTILIZATION

---

## 6. Task (Aufgaben)

### Task
| Feld         | Typ         | Beschreibung/Relation                     |
|--------------|-------------|-------------------------------------------|
| id           | String      | @id @default(cuid())                       |
| title        | String      |                                           |
| description  | String?     |                                           |
| status       | TaskStatus  | @default(TODO)                             |
| startDate    | DateTime?   |                                           |
| endDate      | DateTime?   |                                           |
| duration     | Int?        | Tage                                      |
| projectId    | String      | Relation zu Project                       |
| project      | Project     | Relation zu Project                       |
| phaseId      | String      | Relation zu Phase                         |
| phase        | Phase       | Relation zu Phase                         |
| assigneeId   | String?     | Relation zu User (Assignee)                |
| assignee     | User?       | Relation zu User (Assignee)                |
| createdAt    | DateTime    | @default(now())                            |
| updatedAt    | DateTime    | @updatedAt                                 |
| dependencies | Dependency[]| Relation zu Abhängigkeiten (als Vorgänger)|
| dependents   | Dependency[]| Relation zu Abhängigkeiten (als Nachfolger)|

**Enum: TaskStatus**
- TODO
- IN_PROGRESS
- BLOCKED
- DONE

---

## 7. Dependency (Abhängigkeiten)

### Dependency
| Feld            | Typ              | Beschreibung/Relation                     |
|-----------------|------------------|-------------------------------------------|
| id              | String           | @id @default(cuid())                       |
| type            | DependencyType   | @default(FINISH_TO_START)                  |
| predecessorId   | String           | Relation zu Task (Vorgänger)               |
| predecessor     | Task             | Relation zu Task (Vorgänger)               |
| dependentId     | String           | Relation zu Task (Nachfolger)              |
| dependent       | Task             | Relation zu Task (Nachfolger)              |
| lag             | Int              | @default(0) (Verzögerung in Tagen)        |
| createdAt       | DateTime         | @default(now())                            |

**Enum: DependencyType**
- FINISH_TO_START
- START_TO_START
- FINISH_TO_FINISH

---

## 8. Milestone (Gates)

### Milestone
| Feld         | Typ             | Beschreibung/Relation                     |
|--------------|-----------------|-------------------------------------------|
| id           | String          | @id @default(cuid())                       |
| name         | String          |                                           |
| type         | MilestoneType   |                                           |
| dueDate      | DateTime?       |                                           |
| status       | MilestoneStatus | @default(PENDING)                         |
| projectId    | String          | Relation zu Project                       |
| project      | Project         | Relation zu Project                       |
| phaseId      | String          | Relation zu Phase                         |
| phase        | Phase           | Relation zu Phase                         |
| createdAt    | DateTime        | @default(now())                            |
| updatedAt    | DateTime        | @updatedAt                                 |

**Enum: MilestoneType**
- PHASE_GATE
- ITERATION_REVIEW
- FINAL_DELIVERY

**Enum: MilestoneStatus**
- PENDING
- APPROVED
- REJECTED
- ON_HOLD

---

## 9. Artifact (Artefakte/Dokumente)

### Artifact
| Feld         | Typ             | Beschreibung/Relation                     |
|--------------|-----------------|-------------------------------------------|
| id           | String          | @id @default(cuid())                       |
| name         | String          |                                           |
| description  | String?         |                                           |
| type         | ArtifactType    |                                           |
| isMandatory  | Boolean         | @default(false)                            |
| fileUrl      | String?         | Cloud Storage URL                         |
| fileName     | String?         |                                           |
| fileSize     | Int?            | Bytes                                     |
| status       | ArtifactStatus  | @default(DRAFT)                            |
| phaseId      | String          | Relation zu Phase                         |
| phase        | Phase           | Relation zu Phase                         |
| createdAt    | DateTime        | @default(now())                            |
| updatedAt    | DateTime        | @updatedAt                                 |
| reviews      | ArtifactReview[]| Relation zu Reviews                        |

**Enum: ArtifactType**
- PROBLEM_STATEMENT
- DATA_PROFILE
- DATA_SOURCES_CATALOGUE
- DATA_QUALITY_REPORT
- FEATURE_SPECIFICATION
- MODEL_DOCUMENTATION
- EVALUATION_REPORT
- DEPLOYMENT_PLAN
- MONITORING_PLAN
- OTHER

**Enum: ArtifactStatus**
- DRAFT
- SUBMITTED
- APPROVED
- REJECTED

---

## 10. Artifact Review (Freigabe)

### ArtifactReview
| Feld         | Typ             | Beschreibung/Relation                     |
|--------------|-----------------|-------------------------------------------|
| id           | String          | @id @default(cuid())                       |
| decision     | ReviewDecision  |                                           |
| comment      | String?         |                                           |
| artifactId   | String          | Relation zu Artifact                      |
| artifact     | Artifact        | Relation zu Artifact                      |
| reviewerId   | String          | Relation zu User (Reviewer)                |
| reviewer     | User            | Relation zu User (Reviewer)                |
| createdAt    | DateTime        | @default(now())                            |

**Enum: ReviewDecision**
- APPROVED
- REJECTED
- NEEDS_REVISION

---

## 11. Risk (Risiko-Hinweise)

### Risk
| Feld         | Typ             | Beschreibung/Relation                     |
|--------------|-----------------|-------------------------------------------|
| id           | String          | @id @default(cuid())                       |
| title        | String          |                                           |
| description  | String          |                                           |
| category     | RiskCategory    |                                           |
| severity     | RiskSeverity    |                                           |
| status       | RiskStatus      | @default(OPEN)                            |
| projectId    | String          | Relation zu Project                       |
| project      | Project         | Relation zu Project                       |
| createdAt    | DateTime        | @default(now())                            |
| updatedAt    | DateTime        | @updatedAt                                 |

**Enum: RiskCategory**
- DATA_QUALITY
- DATA_AVAILABILITY
- TECHNICAL_COMPLEXITY
- RESOURCE_CONSTRAINT
- TIMELINE
- OTHER

**Enum: RiskSeverity**
- LOW
- MEDIUM
- HIGH
- CRITICAL

**Enum: RiskStatus**
- OPEN
- MITIGATED
- ACCEPTED
- RESOLVED
