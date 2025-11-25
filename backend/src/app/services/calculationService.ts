// calculationService.ts - Kern-Berechnungslogik

import {
    InputField,
    WeightConfig,
    NormalizedValue,
    CategoryScore,
    ProjectMetrics,
    ProjectPhase,
    ProjectType,
    ProjectSize,
    BASE_EFFORT,
    PROJECT_SIZE_THRESHOLDS,
    BASE_PHASE_DISTRIBUTION,
    CalculationRequest
} from '../types.js';

export class ProjectCalculationService {

    // Schritt 1: Normierung der Eingabewerte
    normalizeInputs(inputs: InputField[]): NormalizedValue[] {
        return inputs.map(input => {
            let normalized = 0;

            switch (input.type) {
                case 'boolean':
                    normalized = input.value ? 1 : 0;
                    break;

                case 'percentage':
                    normalized = input.value / 100;
                    break;

                case 'number':
                    const min = input.min ?? 0;
                    const max = input.max ?? 100;
                    normalized = (input.value - min) / (max - min);
                    break;

                case 'select':
                    // Annahme: Options sind sortiert von schlecht zu gut
                    const idx = input.options?.indexOf(input.value) ?? 0;
                    const optCount = (input.options?.length ?? 1) - 1;
                    normalized = optCount > 0 ? idx / optCount : 0;
                    break;
            }

            // Bei negativen Faktoren invertieren
            if (input.isNegative) {
                normalized = 1 - normalized;
            }

            // Sicherstellen: 0 <= normalized <= 1
            normalized = Math.max(0, Math.min(1, normalized));

            return {
                fieldId: input.id,
                normalized,
                weight: 0 // wird in Schritt 2 gesetzt
            };
        });
    }

    // Schritt 2: Gewichtung der Parameter
    applyWeights(
        normalizedValues: NormalizedValue[],
        weights: WeightConfig,
        inputs: InputField[]
    ): NormalizedValue[] {
        // Rohgewichte holen
        const rawWeights = normalizedValues.map(nv =>
            weights[nv.fieldId] ?? 1.0
        );

        // Summe berechnen
        const weightSum = rawWeights.reduce((sum, w) => sum + w, 0);

        // Normalisieren
        return normalizedValues.map((nv, idx) => ({
            ...nv,
            weight: rawWeights[idx] / weightSum
        }));
    }

    // Schritt 3: Berechnung thematischer Teil-Scores
    calculateCategoryScores(
        weightedValues: NormalizedValue[],
        inputs: InputField[]
    ): CategoryScore {
        const categories = ['readiness', 'complexity', 'uncertainty'] as const;
        const scores: any = {};

        categories.forEach(category => {
            // Alle Werte dieser Kategorie filtern
            const categoryInputs = inputs.filter(inp => inp.category === category);
            const categoryValues = weightedValues.filter(wv =>
                categoryInputs.some(ci => ci.id === wv.fieldId)
            );

            if (categoryValues.length === 0) {
                scores[category] = 0.5; // Neutral
                return;
            }

            // Gewichtete Summe bilden
            const weightSum = categoryValues.reduce((sum, cv) => sum + cv.weight, 0);
            const weightedSum = categoryValues.reduce(
                (sum, cv) => sum + cv.normalized * cv.weight,
                0
            );

            // Normalisieren auf Kategorie-Ebene
            scores[category] = weightSum > 0 ? weightedSum / weightSum : 0.5;
        });

        return scores as CategoryScore;
    }

    // Schritt 4: Gesamt-Score (optional)
    calculateOverallScore(
        categoryScores: CategoryScore,
        categoryWeights = { readiness: 0.4, complexity: 0.3, uncertainty: 0.3 }
    ): number {
        return (
            categoryScores.readiness * categoryWeights.readiness +
            (1 - categoryScores.complexity) * categoryWeights.complexity +
            (1 - categoryScores.uncertainty) * categoryWeights.uncertainty
        );
    }

    // Schritt 5: Aufwandsschätzung
    estimateEffort(
        projectType: ProjectType,
        categoryScores: CategoryScore
    ): number {
        const baseEffort = BASE_EFFORT[projectType];

        // Skalierungsfaktoren
        const readinessFactor = 1 + (0.5 - categoryScores.readiness); // R niedrig → +50%
        const complexityFactor = 1 + (categoryScores.complexity * 0.8); // C hoch → +80%
        const uncertaintyFactor = 1 + (categoryScores.uncertainty * 0.6); // U hoch → +60%

        // Bonus bei sehr schlechter Readiness
        const readinessBonus = categoryScores.readiness < 0.3 ? 1.2 : 1.0;

        const effort = baseEffort *
            readinessFactor *
            complexityFactor *
            uncertaintyFactor *
            readinessBonus;

        return Math.round(effort * 10) / 10; // Auf 1 Dezimale runden
    }

    // Schritt 6: Dauerabschätzung
    estimateDuration(
        effortPersonWeeks: number,
        teamSize: number,
        productivityFactor = 0.6
    ): number {
        const duration = effortPersonWeeks / (teamSize * productivityFactor);
        return Math.ceil(duration); // Auf ganze Wochen aufrunden
    }

    // Schritt 7: Projektgröße klassifizieren
    classifyProjectSize(effortPersonWeeks: number): ProjectSize {
        for (const threshold of PROJECT_SIZE_THRESHOLDS) {
            if (effortPersonWeeks <= threshold.max) {
                return threshold.size;
            }
        }
        return ProjectSize.XL;
    }

    // Backlog-Berechnung
    calculateBacklog(
        effortPersonWeeks: number,
        velocityPerSprint = 20
    ): { storyPoints: number; sprintCount: number } {
        const storyPoints = Math.round(effortPersonWeeks * 8); // ~8 SP pro PW
        const sprintCount = Math.ceil(storyPoints / velocityPerSprint);

        return { storyPoints, sprintCount };
    }

    // Gantt-Phasen generieren
    generatePhases(
        effortPersonWeeks: number,
        durationWeeks: number,
        categoryScores: CategoryScore
    ): ProjectPhase[] {
        const phases: ProjectPhase[] = [];
        let currentWeek = 0;

        BASE_PHASE_DISTRIBUTION.forEach((phase, idx) => {
            // Anpassung der Phasengewichtung basierend auf Scores
            let adjustedPercentage = phase.percentage;

            // Beispiel: Bei schlechter Datenqualität mehr Zeit für Aufbereitung
            if (phase.name.includes('Datenaufbereitung') && categoryScores.uncertainty > 0.6) {
                adjustedPercentage *= 1.3;
            }

            // Bei hoher Komplexität mehr Modellierungszeit
            if (phase.name.includes('Modellierung') && categoryScores.complexity > 0.6) {
                adjustedPercentage *= 1.2;
            }

            const phaseEffort = effortPersonWeeks * adjustedPercentage;
            const phaseDuration = Math.max(1, Math.round(durationWeeks * adjustedPercentage));

            phases.push({
                name: phase.name,
                startWeek: currentWeek,
                durationWeeks: phaseDuration,
                effortPersonWeeks: Math.round(phaseEffort * 10) / 10,
                percentage: adjustedPercentage
            });

            currentWeek += phaseDuration;
        });

        // Normalisieren, damit Gesamtdauer passt
        const totalCalculatedWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
        if (totalCalculatedWeeks !== durationWeeks) {
            const scaleFactor = durationWeeks / totalCalculatedWeeks;
            let adjustedTotal = 0;

            phases.forEach((phase, idx) => {
                if (idx < phases.length - 1) {
                    phase.durationWeeks = Math.max(1, Math.round(phase.durationWeeks * scaleFactor));
                    adjustedTotal += phase.durationWeeks;
                } else {
                    // Letzte Phase bekommt den Rest
                    phase.durationWeeks = durationWeeks - adjustedTotal;
                }
            });

            // Start-Wochen neu berechnen
            currentWeek = 0;
            phases.forEach(phase => {
                phase.startWeek = currentWeek;
                currentWeek += phase.durationWeeks;
            });
        }

        return phases;
    }

    // Hauptmethode: Vollständige Berechnung
    calculate(request: CalculationRequest): ProjectMetrics {
        const {
            inputs,
            weights,
            projectType,
            teamSize,
            productivityFactor = 0.6,
            velocityPerSprint = 20
        } = request;

        // Schritt 1-2: Normierung & Gewichtung
        const normalized = this.normalizeInputs(inputs);
        const weighted = this.applyWeights(normalized, weights, inputs);

        // Schritt 3-4: Scores berechnen
        const categoryScores = this.calculateCategoryScores(weighted, inputs);
        const overallScore = this.calculateOverallScore(categoryScores);

        // Schritt 5-6: Aufwand & Dauer
        const effortPersonWeeks = this.estimateEffort(projectType, categoryScores);
        const durationWeeks = this.estimateDuration(
            effortPersonWeeks,
            teamSize,
            productivityFactor
        );

        // Schritt 7: Klassifizierung
        const projectSize = this.classifyProjectSize(effortPersonWeeks);

        // Backlog & Gantt
        const { storyPoints, sprintCount } = this.calculateBacklog(
            effortPersonWeeks,
            velocityPerSprint
        );
        const phases = this.generatePhases(
            effortPersonWeeks,
            durationWeeks,
            categoryScores
        );

        return {
            categoryScores,
            overallScore,
            effortPersonWeeks,
            durationWeeks,
            projectSize,
            storyPoints,
            sprintCount,
            phases
        };
    }
}

export const calculationService = new ProjectCalculationService();