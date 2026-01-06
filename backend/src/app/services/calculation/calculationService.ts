// src/app/services/calculationService.ts
// Kern-Berechnungslogik für Projektschätzung

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
} from '../../types.ts';

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

                case 'number': {
                    const min = input.min ?? 0;
                    const max = input.max ?? 100;
                    normalized = (input.value - min) / (max - min || 1);
                    break;
                }

                case 'select': {
                    // Annahme: Options sind sortiert von schlecht zu gut
                    const idx = input.options?.indexOf(input.value) ?? 0;
                    const optCount = (input.options?.length ?? 1) - 1;
                    normalized = optCount > 0 ? idx / optCount : 0;
                    break;
                }
            }

            // Bei negativen Faktoren invertieren (hoher Wert = schlechter, da mehr Aufwand benötigt...)
            if (input.isNegative) {
                normalized = 1 - normalized;
            }
            normalized = Math.round(normalized * 100) / 100; // auf 2 Nachkommastellen runden
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
        _inputs: InputField[]
    ): NormalizedValue[] {
        // Rohgewichte holen (Default 1.0, falls nichts angegeben)
        const rawWeights = normalizedValues.map(nv =>
            weights[nv.fieldId] ?? 1.0
        );

        // Summe berechnen
        const weightSum = rawWeights.reduce((sum, w) => sum + w, 0) || 1;

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
            const weightSum = categoryValues.reduce((sum, cv) => sum + cv.weight, 0) || 1;
            const weightedSum = categoryValues.reduce(
                (sum, cv) => sum + cv.normalized * cv.weight,
                0
            );

            // Normalisieren auf Kategorie-Ebene
            scores[category] = weightedSum / weightSum;
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

    // Schritt 5: Aufwandsschätzung mit optionalem Risiko-Puffer
    estimateEffort(
        projectType: ProjectType,
        categoryScores: CategoryScore,
        includeRiskBuffer = true
    ): number {
        const baseEffort = BASE_EFFORT[projectType];

        // Skalierungsfaktoren
        const readinessFactor = 1 + (0.5 - categoryScores.readiness); // R niedrig → +50%
        const complexityFactor = 1 + (categoryScores.complexity * 0.8); // C hoch → +80%
        const uncertaintyFactor = 1 + (categoryScores.uncertainty * 0.6); // U hoch → +60%

        // Bonus bei sehr schlechter Readiness
        const readinessBonus = categoryScores.readiness < 0.3 ? 1.2 : 1.0;

        let effort = baseEffort *
            readinessFactor *
            complexityFactor *
            uncertaintyFactor *
            readinessBonus;

        // Risiko-Puffer hinzufügen
        if (includeRiskBuffer) {
            const riskLevel = (categoryScores.complexity + categoryScores.uncertainty) / 2;
            const buffer = 1 + (riskLevel * 0.15); // bis zu +15% Puffer
            effort *= buffer;
        }

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

    // Gantt-Phasen generieren (KORRIGIERT: 6 Phasen nach DSLC mit Puffer-Tracking)
    generatePhases(
        effortPersonWeeks: number,
        durationWeeks: number,
        categoryScores: CategoryScore,
        riskBufferTotal: number = 0  // NEU: Gesamt-Puffer in PW
    ): ProjectPhase[] {
        const phases: ProjectPhase[] = [];
        let currentWeek = 0;

        const { readiness, complexity, uncertainty } = categoryScores;

        // Basis-Aufwand (ohne Puffer)
        const baseEffort = effortPersonWeeks - riskBufferTotal;

        // 1) Basisverteilung holen und Anpassungsfaktoren berechnen
        const phaseWithFactors = BASE_PHASE_DISTRIBUTION.map((phase) => {
            const nameLower = phase.name.toLowerCase();
            let factor = 1;

            // Readiness-Defizit: 0 = sehr gut vorbereitet, 1 = sehr schlecht
            const readinessDeficit = 1 - readiness;

            const c = complexity;
            const u = uncertainty;

            /*
            * BASE_PHASE_DISTRIBUTION basiert auf DSLC (6 Phasen):
            * [
            *   { name: 'Business Understanding', percentage: 0.10 },
            *   { name: 'Data Collection, Exploration & Preparation', percentage: 0.25 },
            *   { name: 'Analysis', percentage: 0.30 },
            *   { name: 'Evaluation', percentage: 0.15 },
            *   { name: 'Deployment', percentage: 0.10 },
            *   { name: 'Utilization', percentage: 0.10 }
            * ]
            */

            // Business Understanding
            if (nameLower.includes('business') || nameLower.includes('understanding')) {
                // Frühe Phase: stark von Readiness und Uncertainty abhängig
                factor += readinessDeficit * 0.7 + u * 0.3;
            }
            // Data Collection, Exploration & Preparation
            else if (nameLower.includes('data') &&
                (nameLower.includes('collection') ||
                    nameLower.includes('exploration') ||
                    nameLower.includes('preparation'))) {
                // Datenphase: stark von Uncertainty und Readiness abhängig
                factor += u * 0.6 + readinessDeficit * 0.4;
            }
            // Analysis / Modeling
            else if (nameLower.includes('analysis') || nameLower.includes('modeling')) {
                // Modellierung: vor allem von Complexity, etwas von Uncertainty
                factor += c * 0.7 + u * 0.3;
            }
            // Evaluation
            else if (nameLower.includes('evaluation') || nameLower.includes('testing')) {
                // Evaluation: von Complexity und Uncertainty
                factor += c * 0.5 + u * 0.5;
            }
            // Deployment
            else if (nameLower.includes('deployment')) {
                // Deployment: von Readiness und Complexity
                factor += readinessDeficit * 0.4 + c * 0.4;
            }
            // Utilization / Monitoring & Maintenance
            else if (nameLower.includes('utilization') ||
                nameLower.includes('monitoring') ||
                nameLower.includes('maintenance')) {
                // Betriebsphase: von Complexity und Uncertainty abhängig
                // Komplexe/unsichere Modelle brauchen mehr Monitoring
                factor += c * 0.5 + u * 0.5;
            }
            // Fallback für neue/sonstige Phasen
            else {
                factor += (c + u + readinessDeficit) / 3 * 0.5;
            }

            // Faktor begrenzen, damit nichts explodiert
            factor = Math.max(0.5, Math.min(2.0, factor));

            return {
                ...phase,
                factor,
                adjustedBase: phase.percentage * factor
            };
        });

        // 2) Prozentwerte auf Summe = 1 normalisieren
        const totalAdjustedBase = phaseWithFactors
            .reduce((sum, p) => sum + p.adjustedBase, 0) || 1;

        const normalizedPhases = phaseWithFactors.map((p) => {
            const normalizedPercentage = p.adjustedBase / totalAdjustedBase;

            return {
                name: p.name,
                percentage: normalizedPercentage
            };
        });

        // 2.5) NEU: Risiko-Gewichte pro Phase berechnen für Puffer-Verteilung
        const phaseRiskWeights = normalizedPhases.map(phase => {
            const riskWeight = this.calculatePhaseRiskWeight(phase.name, categoryScores);
            return {
                name: phase.name,
                percentage: phase.percentage,
                riskWeight
            };
        });

        const totalRiskWeight = phaseRiskWeights.reduce((sum, p) => sum + p.riskWeight, 0) || 1;

        // Puffer auf Phasen verteilen
        const bufferDistribution: Record<string, number> = {};
        phaseRiskWeights.forEach(phase => {
            const phaseBufferRatio = phase.riskWeight / totalRiskWeight;
            bufferDistribution[phase.name] = riskBufferTotal * phaseBufferRatio;
        });

        // 3) Aus den normalisierten Prozenten Aufwand & Dauer pro Phase berechnen
        normalizedPhases.forEach((phase) => {
            // Basis-Aufwand für diese Phase
            const phaseBaseEffort = baseEffort * phase.percentage;

            // Puffer für diese Phase
            const phaseBufferEffort = bufferDistribution[phase.name] || 0;

            // Gesamt-Aufwand = Basis + Puffer
            const phaseTotalEffort = phaseBaseEffort + phaseBufferEffort;

            // Dauer berechnen (proportional zum Gesamt-Aufwand) und SOFORT runden
            const phaseDuration = Math.round(Math.max(
                0.1,  // Mindestens 0.1 Wochen statt 1
                durationWeeks * phase.percentage
            ) * 10) / 10;  // ← WICHTIG: Rundung HIER, nicht später!

            // KORRIGIERT: Dauer-Aufteilung basierend auf Aufwandsverhältnis
            // Nutze die GERUNDETE phaseDuration für Konsistenz
            let baseDuration: number;
            let bufferDuration: number;

            if (phaseDuration < 1) {
                // Bei sehr kurzen Phasen: proportional aufteilen
                const effortRatio = phaseTotalEffort > 0
                    ? phaseBaseEffort / phaseTotalEffort
                    : 1;
                baseDuration = Math.max(0, phaseDuration * effortRatio);
                bufferDuration = Math.max(0, phaseDuration - baseDuration);
            } else {
                // Bei längeren Phasen: erlauben Dezimalstellen
                const effortRatio = phaseTotalEffort > 0
                    ? phaseBaseEffort / phaseTotalEffort
                    : 1;
                baseDuration = Math.max(0.1, phaseDuration * effortRatio);
                bufferDuration = Math.max(0, phaseDuration - baseDuration);
            }

            phases.push({
                name: phase.name,
                startWeek: currentWeek,
                durationWeeks: phaseDuration,  // Bereits gerundet
                effortPersonWeeks: Math.round(phaseTotalEffort * 10) / 10,
                percentage: phase.percentage,

                // NEU: Aufschlüsselung für Gantt-Visualisierung (in Wochen!)
                baseEffort: Math.round(phaseBaseEffort * 10) / 10,
                bufferEffort: Math.round(phaseBufferEffort * 10) / 10,
                baseDuration: Math.round(baseDuration * 10) / 10,  // in Wochen
                bufferDuration: Math.round(bufferDuration * 10) / 10  // in Wochen
            });

            currentWeek += phaseDuration;  // Bereits gerundet
        });

        // 4) Dauer normalisieren, damit Summe der Wochen = durationWeeks ist
        const totalCalculatedWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
        if (Math.abs(totalCalculatedWeeks - durationWeeks) > 0.1) {  // Toleranz von 0.1 Wochen
            const scaleFactor = durationWeeks / totalCalculatedWeeks;
            let adjustedTotal = 0;

            phases.forEach((phase, idx) => {
                if (idx < phases.length - 1) {
                    const oldDuration = phase.durationWeeks;
                    const newDuration = Math.max(
                        0.1,
                        Math.round(phase.durationWeeks * scaleFactor * 10) / 10
                    );
                    phase.durationWeeks = newDuration;

                    // Basis- und Puffer-Dauer auch skalieren
                    if (phase.baseDuration !== undefined && phase.bufferDuration !== undefined) {
                        const durationScale = newDuration / oldDuration;
                        phase.baseDuration = Math.max(0, Math.round(phase.baseDuration * durationScale * 10) / 10);
                        phase.bufferDuration = Math.max(0, Math.round(phase.bufferDuration * durationScale * 10) / 10);

                        // Sicherstellen dass baseDuration + bufferDuration = durationWeeks
                        const sum = phase.baseDuration + phase.bufferDuration;
                        if (Math.abs(sum - newDuration) > 0.01) {
                            phase.bufferDuration = Math.max(0, Math.round((newDuration - phase.baseDuration) * 10) / 10);
                        }
                    }

                    adjustedTotal += phase.durationWeeks;
                } else {
                    // Letzte Phase bekommt den Rest
                    const oldDuration = phase.durationWeeks;
                    const newDuration = Math.max(0.1, Math.round((durationWeeks - adjustedTotal) * 10) / 10);
                    phase.durationWeeks = newDuration;

                    // Basis- und Puffer-Dauer auch anpassen
                    if (phase.baseDuration !== undefined && phase.bufferDuration !== undefined) {
                        const durationScale = newDuration / oldDuration;
                        phase.baseDuration = Math.max(0, Math.round(phase.baseDuration * durationScale * 10) / 10);
                        phase.bufferDuration = Math.max(0, Math.round(phase.bufferDuration * durationScale * 10) / 10);

                        // Sicherstellen dass baseDuration + bufferDuration = durationWeeks
                        const sum = phase.baseDuration + phase.bufferDuration;
                        if (Math.abs(sum - newDuration) > 0.01) {
                            phase.bufferDuration = Math.max(0, Math.round((newDuration - phase.baseDuration) * 10) / 10);
                        }
                    }
                }
            });

            // Start-Wochen neu berechnen
            currentWeek = 0;
            phases.forEach((phase) => {
                phase.startWeek = Math.round(currentWeek * 10) / 10;
                currentWeek += phase.durationWeeks;
            });
        }

        return phases;
    }

    // NEU: Hilfsmethode für Phase-Risiko-Gewicht
    private calculatePhaseRiskWeight(
        phaseName: string,
        categoryScores: CategoryScore
    ): number {
        const nameLower = phaseName.toLowerCase();
        const { readiness, complexity, uncertainty } = categoryScores;
        const readinessDeficit = 1 - readiness;

        let riskWeight = 0;

        // Business Understanding: Risiko bei schlechter Readiness
        if (nameLower.includes('business') || nameLower.includes('understanding')) {
            riskWeight = readinessDeficit * 0.7 + uncertainty * 0.3;
        }
        // Data Collection: Risiko bei hoher Uncertainty
        else if (nameLower.includes('data') &&
            (nameLower.includes('collection') ||
                nameLower.includes('exploration') ||
                nameLower.includes('preparation'))) {
            riskWeight = uncertainty * 0.8 + readinessDeficit * 0.2;
        }
        // Analysis/Modeling: Risiko bei Complexity + Uncertainty
        else if (nameLower.includes('analysis') || nameLower.includes('modeling')) {
            riskWeight = complexity * 0.6 + uncertainty * 0.4;
        }
        // Evaluation: Risiko bei Complexity
        else if (nameLower.includes('evaluation') || nameLower.includes('testing')) {
            riskWeight = complexity * 0.7 + uncertainty * 0.3;
        }
        // Deployment: Risiko bei Readiness-Defizit
        else if (nameLower.includes('deployment')) {
            riskWeight = readinessDeficit * 0.5 + complexity * 0.5;
        }
        // Utilization: Risiko bei Complexity
        else if (nameLower.includes('utilization') ||
            nameLower.includes('monitoring')) {
            riskWeight = complexity * 0.6 + uncertainty * 0.4;
        }
        else {
            riskWeight = (complexity + uncertainty + readinessDeficit) / 3;
        }

        return Math.max(0, Math.min(1, riskWeight));
    }

    // Request-Validierung
    validateRequest(request: CalculationRequest): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!request.inputs || request.inputs.length === 0) {
            errors.push("Keine Eingabewerte vorhanden");
        }

        if (!request.projectType) {
            errors.push("Projekttyp muss angegeben werden");
        }

        if (request.teamSize < 1) {
            errors.push("Teamgröße muss mindestens 1 sein");
        }

        if (request.productivityFactor &&
            (request.productivityFactor <= 0 || request.productivityFactor > 1)) {
            errors.push("Produktivitätsfaktor muss zwischen 0 und 1 liegen");
        }

        if (request.velocityPerSprint && request.velocityPerSprint <= 0) {
            errors.push("Velocity pro Sprint muss größer als 0 sein");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Hauptmethode: Vollständige Berechnung
    calculate(request: CalculationRequest): ProjectMetrics {
        // Validierung
        const validation = this.validateRequest(request);
        if (!validation.isValid) {
            throw new Error(`Ungültige Eingaben: ${validation.errors.join(', ')}`);
        }

        const {
            inputs,
            weights,
            projectType,
            teamSize,
            productivityFactor = 0.6,
            velocityPerSprint = 20
        } = request;

        // Risiko-Puffer standardmäßig aktiviert
        const includeRiskBuffer = (request as any).includeRiskBuffer ?? true;

        // Schritt 1–2: Normierung & Gewichtung
        const normalized = this.normalizeInputs(inputs);
        const weighted = this.applyWeights(normalized, weights, inputs);

        // Schritt 3–4: Scores berechnen
        const categoryScores = this.calculateCategoryScores(weighted, inputs);
        const overallScore = this.calculateOverallScore(categoryScores);

        // Schritt 5: Aufwand OHNE Puffer berechnen
        const effortWithoutBuffer = this.estimateEffort(
            projectType,
            categoryScores,
            false  // Ohne Puffer
        );

        // Risiko-Puffer separat berechnen
        const riskLevel = (categoryScores.complexity + categoryScores.uncertainty) / 2;
        const bufferPercentage = includeRiskBuffer ? riskLevel * 0.15 : 0;
        const riskBufferTotal = effortWithoutBuffer * bufferPercentage;
        const effortPersonWeeks = effortWithoutBuffer + riskBufferTotal;

        // Schritt 6: Dauer
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

        // Phasen mit Puffer-Tracking
        const phases = this.generatePhases(
            effortPersonWeeks,
            durationWeeks,
            categoryScores,
            riskBufferTotal  // Puffer-Info für Verteilung
        );

        return {
            categoryScores,
            overallScore,
            effortPersonWeeks,
            durationWeeks,
            projectSize,
            storyPoints,
            sprintCount,
            phases,
            // NEU: Aufschlüsselung für transparente Darstellung
            effortBreakdown: {
                baseEffort: effortWithoutBuffer,
                bufferEffort: riskBufferTotal,
                bufferPercentage: bufferPercentage,
                riskLevel: riskLevel
            }
        };
    }
}

export const calculationService = new ProjectCalculationService();