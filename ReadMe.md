## Aufbau API Aufrufe im Backend/api
├── /projects
│   ├── POST    /                              → Projekt erstellen
│   ├── GET     /:id                           → Projekt abrufen
│   ├── PATCH   /:id                           → Projekt aktualisieren
│   ├── DELETE  /:id                           → Projekt löschen
│   ├── PATCH   /:id/business-understanding    → Phase 1 speichern
│   ├── PATCH   /:id/data-characteristics      → Phase 2 speichern
│   ├── POST    /:id/complete-wizard           → Wizard abschließen
│   └── POST    /:id/plan                      → Plan manuell erstellen
│
├── /dashboard
│   ├── GET     /:id                           → Dashboard-Daten
│   ├── GET     /:id/timeline                  → Timeline/Gantt
│   ├── PATCH   /tasks/:id/status              → Task-Status
│   ├── PATCH   /:id/status                    → Projekt-Status
│   └── POST    /:id/evaluations               → Evaluation hinzufügen
│
├── /startpage
│   ├── GET     /                              → Projektliste
│   ├── GET     /statistics                    → Statistiken
│   └── GET     /recent-projects               → Zuletzt bearbeitet
│
├── /calculation
│   ├── POST    /estimate                      → Berechnung (ohne DB)
│   └── POST    /validate-weights              → Gewichte validieren
│
└── /config
    ├── GET     /fields/default                → Default-Felder
    └── GET     /weights/default               → Default-Gewichte
