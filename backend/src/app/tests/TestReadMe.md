## Testkonzept
**Testpyramide nach Mike Cohn**

1. Unit-Tests (ca. 70 % aller Tests)
2. Komponenten/ API Tests
3. Integration Tests
4. UI Tests


**1. Unit Tests**

- Service-Methoden (ohne DB)
- Hilfsfunktionen wie parseId()
- Validierungslogik
- Datenaufbereitung

**2. Komponenten/ API Tests**
- HTTP-Endpoints isoliert (ohne DB, mit Mocks) (Request & Response)
- Error Handling

**3. Integration Tests**
- Services mit echter Test-Datenbank z.B.: Dashboard Service Integration Tests
- Berechnungen (Fortschritt, Phasen Einordnung)

**4. E2E / UI Tests**
- Komplettes User-Journeys vom Frontend bis zur DB (Tools: Cypress)
- Startseite öffnen, Wizard starten, Projekt anlegen, GANT erzeugen lassen, Projekt bearbeiten, Status ändern etc..


### Test-Coverage Ziele

| Test-Typ | Coverage-Ziel | Priorität |
|----------|---------------|-----------|
| Unit Tests | 80-90% | Hoch |
| Component/API Tests | 70-80% | Hoch |
| Integration Tests | 60-70% | Mittel |
| E2E Tests | 40-50% (kritische Flows) | Mittel |

***