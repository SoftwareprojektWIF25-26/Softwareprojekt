# Der Lebenszyklus der Testumgebung (E2E-Flow)
- Wenn deine Tests über den Befehl **npm run test:e2e** startest, passiert eine orchestrierte Kettenreaktion:

## 1. Docker startet (docker-compose.test.yml):
Ein spezieller Test-Container für PostgreSQL wird hochgefahren. Das Besondere: Anstatt die Daten auf der Festplatte zu speichern,
nutzt er den Arbeitsspeicher (**tmpfs**). Das garantiert, dass nach dem Testlauf keine Datenreste übrig bleiben.

## 2. Prisma baut die Struktur (migrate deploy):
Über die **.env.test-Datei** verbindet sich Prisma mit der Testdatenbank **ds-project-db-test** und 
baut anhand der schema.prisma-Datei alle Tabellen exakt so auf, wie sie im Live-Betrieb aussehen.

## 3. Die Datenbank wird befüllt (seed.ts):
Grunddaten werden benötigt, also füllt die **Seed-Datei** die Testdatenbank. 

## 4. Die Tests laufen (Vitest & Supertest):
Vitest startet. Über Supertest werden HTTP-Anfragen (z.B. GET /api/projects) an deine Express-App gesendet.
Die App nutzt den Prisma-Client, der in der Testdatenbank liest und schreibt. 
Da alle Komponenten (Router, Service, Datenbank) auch im Live-Betrieb verwendet werden, 
handelt es sich um vollwertige Integrationstests.


## 5. Clean-up (test:cleanup):
Nach den Tests (oder durch einen manuellen Befehl) wird der Docker-Test-Container einfach heruntergefahren 
