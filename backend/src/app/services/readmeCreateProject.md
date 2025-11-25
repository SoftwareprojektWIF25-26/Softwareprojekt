**Phase 1: Projekt Erstellung**

POST /api/projects  
→ Erstellt minimales Projekt (title + domain)  
→ Initialisiert alle Template-Phasen:
- BusinessUnderstanding: DRAFT (sofort editierbar)
- DataCharacteristics: BLOCKED
- AnalysisConfig: BLOCKED
- DeploymentConfig: BLOCKED
- UtilizationConfig: BLOCKED

-------------

**Phase 2: Wizard Durchlauf**

PATCH /api/projects/:id/business-understanding  
→ Speichert Phase-Daten  
→ wizardStep = 1  
→ Schaltet DataCharacteristics frei (BLOCKED → READY)  

PATCH /api/projects/:id/data-characteristics  
→ Speichert Phase-Daten  
→ wizardStep = 2  
→ Schaltet AnalysisConfig frei

[etc. für alle 5 Template-Phasen]

-----------------------------------------------

**Phase 3: Wizard Abschluss**

POST /api/projects/:id/complete-wizard  
→ Validiert: BusinessUnderstanding + DataCharacteristics vorhanden  
→ wizardCompleted = true  
→ wizardStep = 6  
→ status = IN_PROGRESS  
→ Projekt bereit für Berechnung

------------------------------

**Phase 4: Plan Generierung**

POST /api/projects/:id/plan  
Body: { metrics: ProjectMetrics }  
→ createProjectPlanFromMetrics()  

→ Erstellt:
- ProjectPlan (mit Metriken)  
- 5 ProjectPhases (CRISP-DM)  
- ~20 PhaseSteps (Standard-Tasks)  


-------------------


1. User erstellt Projekt  
   POST /api/projects  

2. User füllt Template-Phasen aus (Wizard)  
   PATCH /api/projects/:id/business-understanding  
   PATCH /api/projects/:id/data-characteristics  
  
3. User schließt Wizard ab  
   POST /api/projects/:id/complete-wizard

4. Frontend berechnet Metriken  
   POST /api/estimation/calculate  
   → CalcService

5. Frontend speichert Plan  
   POST /api/projects/:id/plan  
   → ProjectService.createProjectPlanFromMetrics()  
   → Erstellt ProjectPlan + Phases + Tasks  

6. User sieht Gantt/Timeline  
   GET /api/dashboard/:id/timeline  
   → DashboardService


