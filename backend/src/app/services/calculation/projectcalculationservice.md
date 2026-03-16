# Berechnungslogik und mathematischer Hintergrund der CalculationService.ts

Hinweis: Im folgenden wird der allgemeine mathematische und prozessuale Weg der Datenverarbeitung beschrieben. Für die konkrete technische Umsetzung bitte die ProjectCalculationServices_Dokumentation.docx beachten.
---

## Schritt 1: Eingaben normalisieren

Am Anfang stehen rohe Benutzereingaben in sehr unterschiedlichen Formaten: ein Ja/Nein-Wert, ein Prozentwert, eine Zahl in einem bestimmten Bereich oder eine Auswahl aus einer Liste. Damit man diese Werte überhaupt miteinander verrechnen kann, werden sie zunächst auf eine einheitliche Skala von 0,0 bis 1,0 gebracht.

Ein Ja entspricht dabei einer 1, ein Nein einer 0. Ein Prozentwert von 75 % wird zu 0,75. Eine Zahl innerhalb eines definierten Bereichs wird so skaliert, dass das Minimum zu 0 und das Maximum zu 1 wird. Bei einer Auswahlliste entspricht die erste Option einer 0 und die letzte einer 1, alle anderen verteilen sich gleichmäßig dazwischen.

Besonders wichtig ist die Behandlung sogenannter **negativer Indikatoren**. Manche Eingaben bedeuten: je höher der Wert, desto schlechter für das Projekt – zum Beispiel hohe Datenkomplexität. In diesem Fall wird der normalisierte Wert einfach umgekehrt (1 minus Wert), sodass ein hoher Rohwert zu einem niedrigen normalisierten Wert wird. Damit zeigt nach der Normalisierung immer eine höhere Zahl in Richtung "günstiger für das Projekt".

Das Ergebnis dieses Schritts ist eine Liste von Zahlenwerten zwischen 0 und 1, die alle auf derselben Skala vergleichbar sind.

---

## Schritt 2: Gewichtung der Eingaben

Nicht alle Eingaben sind gleich wichtig. Deshalb bekommt jede normalisierte Zahl ein Gewicht, das angibt, wie stark sie in spätere Berechnungen einfließen soll. Damit die Gewichte untereinander fair verglichen werden können, werden sie normalisiert: Jedes einzelne Gewicht wird durch die Summe aller Gewichte geteilt. Das stellt sicher, dass sich alle Gewichte zusammen exakt zu 1 addieren, unabhängig davon, wie groß die ursprünglichen Gewichtswerte waren.

---

## Schritt 3: Kategoriebewertungen berechnen

Die gewichteten Eingaben werden nun drei Kategorien zugeordnet:

- **Readiness** – wie gut ist das Projekt vorbereitet?
- **Complexity** – wie komplex sind die fachlichen und technischen Anforderungen?
- **Uncertainty** – wie viel Unbekanntes steckt noch im Projekt?

Für jede Kategorie wird ein gewichteter Durchschnitt berechnet: Jeder Eingabewert wird mit seinem Gewicht multipliziert, und diese Produkte werden aufsummiert. Anschließend wird durch die Summe aller Gewichte in dieser Kategorie geteilt. Das Ergebnis ist eine Zahl zwischen 0 und 1 pro Kategorie, die den jeweiligen Zustand des Projekts in diesem Bereich beschreibt.

Diese drei Werte bilden das Herzstück aller weiteren Berechnungen.

---

## Schritt 4: Gesamtscore berechnen

Aus den drei Kategoriescores wird ein einziger Gesamtscore berechnet, der den Gesundheitszustand des Projekts zusammenfasst. Die Formel lautet:

```
Gesamtscore = Readiness × 0,4 + (1 – Complexity) × 0,3 + (1 – Uncertainty) × 0,3
```

Die Readiness geht direkt ein – je mehr Vorbereitung, desto besser. Complexity und Uncertainty werden hingegen invertiert, da hohe Werte dort schlecht für das Projekt sind. Die Gewichtung von 40 % für Readiness und je 30 % für die anderen beiden Kategorien spiegelt die Annahme wider, dass die Projektreife der wichtigste Einzelfaktor ist.

---

## Schritt 5: Aufwandsschätzung

Jetzt wird der eigentliche Aufwand in Personenwochen berechnet. Als Ausgangspunkt dient ein fester Basisaufwand, der je nach Projekttyp unterschiedlich ist – ein kleines Analyseprojekt hat einen anderen Ausgangswert als ein großes ML-System.

Dieser Basisaufwand wird mit drei Faktoren multipliziert, die jeweils aus den Kategoriescores abgeleitet werden:

- Der Readiness-Faktor erhöht den Aufwand, wenn die Vorbereitung schlecht ist (Formel: 1 + (0,5 – Readiness), begrenzt auf [0,8 – 1,5]). Bei sehr schlechter Vorbereitung unter 30 % greift zusätzlich ein gleitender Strafaufschlag von bis zu 20 %:
  Je näher die Readiness an 0 liegt, desto höher der Aufschlag – bei Readiness = 0 beträgt er die vollen 20 %, bei Readiness = 0,15 etwa 10 %, und ab 30 % entfällt er vollständig.
- Der **Complexity-Faktor** skaliert mit der Projektkomplexität (Formel: `1 + Complexity × 0,8`).
- Der **Uncertainty-Faktor** skaliert mit der Unsicherheit (Formel: `1 + Uncertainty × 0,6`).

Alle drei Faktoren werden miteinander multipliziert, nicht addiert – das hat zur Folge, dass sich schlechte Werte in mehreren Kategorien gegenseitig verstärken und nicht bloß aufsummieren.

Optional wird ein Risikopuffer addiert: Dessen Höhe hängt vom Durchschnitt aus Complexity und Uncertainty ab und beträgt maximal 15 % des bereits skalierten Aufwands.

Das Ergebnis ist eine Schätzung in Personenwochen, die beschreibt, wie viel Gesamtarbeitszeit das Projekt voraussichtlich verschlingen wird.

---

## Schritt 6: Projektdauer und -größe

Aus dem Aufwand in Personenwochen wird die kalendarische Dauer berechnet. Der Gesamtaufwand wird berechnet, indem Gesamtaufwand dividiert wird durch das Produkt von Teamgröße und Produktivitätsfaktor. Der Produktivitätsfaktor liegt standardmäßig bei 0,6 – das bedeutet, dass ein Teammitglied in der Praxis nur 60 % seiner Zeit direkt produktiv am Projekt arbeitet, der Rest fällt für Meetings, Abstimmungen und andere Tätigkeiten an. Das Ergebnis wird aufgerundet, da eine Projektwoche immer eine ganze Woche ist.

Parallel dazu wird der Aufwand in Story Points umgerechnet (1 Personenwoche entspricht 8 Story Points), die dann auf Sprints verteilt werden. Das liefert eine Einschätzung, wie viele Sprints das Projekt voraussichtlich umfassen wird.

---

## Schritt 7: Phasenberechnung

Abschließend wird der Gesamtaufwand auf die einzelnen Projektphasen aufgeteilt. Diese folgen dem sogenannten **Data Science Lifecycle**, also einer standardisierten Abfolge von Phasen wie Business Understanding, Datenerhebung, Modellierung, Evaluation, Deployment und so weiter.

Jede Phase hat zunächst einen festgelegten Basisanteil am Gesamtaufwand. Dieser Anteil wird dann durch zwei projektspezifische Kennzahlen angepasst:

Der **Anpassungsfaktor** verändert den Aufwandsanteil einer Phase: Die Business-Understanding-Phase etwa wächst vor allem dann, wenn die Projektvorbereitung schlecht ist oder viel Unsicherheit herrscht. Datenphasen reagieren stark auf Unsicherheit. Modellierungs- und Analysephasen werden durch hohe Komplexität in die Länge gezogen. Jede Phase hat also ihre eigene Empfindlichkeit gegenüber den Kategoriescores.

Der **Risikogewichtungswert** bestimmt, welcher Anteil des globalen Risikopuffers auf diese Phase entfällt. Auch hier unterscheiden sich die Phasen: Die Modellierungsphase trägt zum Beispiel mehr vom Risiko als die Deployment-Phase.

Nach der Berechnung beider Kennzahlen für alle Phasen werden die Anteile so normalisiert, dass sie sich wieder zu 100 % addieren. Der Risikopuffer wird entsprechend der Risikogewichte auf die Phasen verteilt.

Jede Phase erhält am Ende eine Startzeit, eine Dauer in Wochen, einen Aufwand in Personenwochen sowie eine Aufschlüsselung in Basis- und Pufferanteil. Innerhalb jeder Phase werden die enthaltenen Aufgaben ebenfalls nach dem gleichen Prinzip mit Gewichten versehen und anteilig berechnet – so entsteht ein vollständiger, hierarchischer Projektplan.
