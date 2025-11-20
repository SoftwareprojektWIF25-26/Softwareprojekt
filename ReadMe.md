## Startseite:
- Liste von Projekten mit Titel, Id → Link zum Dashboard der Projekte
- Button um neues Projekt anzulegen → Link zu Wizard Steckbrief
- **ggf** vielleicht Liste mit Meilensteinen in den nächsten 7 Tagen 

## Wizard Steckbrief:
- Eingabe der Daten + Button speichern → Link zu Dashboard


## Dashboard:
- Liste der Projektdetails
- Button zum Ändern der Projektdetails 
- **ggf** Gantt Diagramm
- **ggf** Notizfeld

## Fragen:
- _Gewichtung_: 
  - Bereich, in dem Gewichtung der einzelnen Punkte angepasst werden kann auf Extra seite 
  - oder bei Projektdaten ändern?
- _Projektdaten ändern_: 
  - verwenden von Wizard Steckbrief, aber wie Umgang mit Feldern, die nicht mehr bearbeitet werden dürfen? 
  - oder lieber extra Formular zum Ändern der Projektdaten?

## neue API Endpunkte implementiert (12.11):
Startpage (3 Endpunkte):

GET /api/startpage - Projektliste mit Filtern

GET /api/startpage/statistics - Statistiken

GET /api/startpage/recent-projects - Zuletzt bearbeitet

Dashboard (6 Endpunkte):

GET /api/dashboard/:projectId - Projekt-Dashboard

GET /api/dashboard/:projectId/timeline - Timeline/Gantt

PATCH /api/dashboard/tasks/:taskId/status - Task-Status

PATCH /api/dashboard/:projectId/status - Projekt-Status

PATCH /api/dashboard/:projectId/template-phase/:phase/status - Template-Phase

POST /api/dashboard/:projectId/evaluations - Evaluierung
