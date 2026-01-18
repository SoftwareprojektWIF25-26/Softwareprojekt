// Kern-Berechnungslogik für Projektschätzung mit Task-Level-Berechnung

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
    DSLC_PHASES_WITH_TASKS,
    CalculationRequest,
    TaskWeightConfig,
    CalculatedTask,
    PhaseTask
} from '../../types.ts';

// Hilfs-Interface für Phase-Metriken (vereint Faktor + Risiko-Gewicht)
interface PhaseMetrics {
    name: string;
    tasks: PhaseTask[];
    adjustmentFactor: number;
    riskWeight: number;
}

export class ProjectCalculationService {

    // UTILITY
    // ============================================================================

    private round(value: number, decimals: number = 1): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    // NORMIERUNG & GEWICHTUNG
    // ============================================================================

    normalizeInputs(inputs: InputField[]): NormalizedValue[] {
        return inputs.map(input => {
            let normalized = this.getNormalizedValue(input);

            if (input.isNegative) {
                normalized = 1 - normalized;
            }

            return {
                fieldId: input.id,
                normalized: Math.max(0, Math.min(1, this.round(normalized, 2))),
                weight: 0
            };
        });
    }

    private getNormalizedValue(input: InputField): number {
        switch (input.type) {
            case 'boolean':
                return input.value ? 1 : 0;

            case 'percentage':
                return input.value / 100;

            case 'number': {
                const min = input.min ?? 0;
                const max = input.max ?? 100;
                return (input.value - min) / (max - min || 1);
            }

            case 'select': {
                const idx = input.options?.indexOf(input.value) ?? 0;
                const optCount = (input.options?.length ?? 1) - 1;
                return optCount > 0 ? idx / optCount : 0;
            }
        }
    }

    applyWeights(
        normalizedValues: NormalizedValue[],
        weights: WeightConfig
    ): NormalizedValue[] {
        const rawWeights = normalizedValues.map(nv => weights[nv.fieldId] ?? 1.0);
        const weightSum = rawWeights.reduce((sum: number, w: number) => sum + w, 0);

        return normalizedValues.map((nv, idx) => ({
            ...nv,
            weight: rawWeights[idx] / weightSum
        }));
    }

    // SCORES
    calculateCategoryScores(
        weightedValues: NormalizedValue[],
        inputs: InputField[]
    ): CategoryScore {
        // Einmal durchlaufen und gruppieren
        const inputsByCategory = inputs.reduce((acc, input) => {
            if (!acc[input.category]) acc[input.category] = [];
            acc[input.category].push(input);
            return acc;
        }, {} as Record<string, InputField[]>);

        const scores: Partial<CategoryScore> = {};
        const categories = ['readiness', 'complexity', 'uncertainty'] as const;

        categories.forEach(category => {
            const categoryInputs = inputsByCategory[category] || [];

            if (categoryInputs.length === 0) {
                scores[category] = 0.5;
                return;
            }

            const categoryValues = weightedValues.filter(wv =>
                categoryInputs.some(ci => ci.id === wv.fieldId)
            );

            const weightSum = categoryValues.reduce((sum: number, cv) => sum + cv.weight, 0);
            const weightedSum = categoryValues.reduce(
                (sum: number, cv) => sum + cv.normalized * cv.weight,
                0
            );

            scores[category] = weightSum > 0 ? weightedSum / weightSum : 0.5;
        });

        return scores as CategoryScore;
    }

    calculateOverallScore(categoryScores: CategoryScore): number {
        return (
            categoryScores.readiness * 0.4 +
            (1 - categoryScores.complexity) * 0.3 +
            (1 - categoryScores.uncertainty) * 0.3
        );
    }

    // ============================================================================
    // AUFWAND & DAUER
    // ============================================================================

    estimateEffort(
        projectType: ProjectType,
        categoryScores: CategoryScore,
        includeRiskBuffer = true
    ): number {
        const baseEffort = BASE_EFFORT[projectType];

        const readinessFactor = 1 + (0.5 - categoryScores.readiness);
        const complexityFactor = 1 + (categoryScores.complexity * 0.8);
        const uncertaintyFactor = 1 + (categoryScores.uncertainty * 0.6);
        const readinessBonus = categoryScores.readiness < 0.3 ? 1.2 : 1.0;

        let effort = baseEffort * readinessFactor * complexityFactor * uncertaintyFactor * readinessBonus;

        if (includeRiskBuffer) {
            const riskLevel = (categoryScores.complexity + categoryScores.uncertainty) / 2;
            effort *= (1 + riskLevel * 0.15);
        }

        return this.round(effort);
    }

    estimateDuration(
        effortPersonWeeks: number,
        teamSize: number,
        productivityFactor = 0.6
    ): number {
        return Math.ceil(effortPersonWeeks / (teamSize * productivityFactor));
    }

    classifyProjectSize(effortPersonWeeks: number): ProjectSize {
        for (const threshold of PROJECT_SIZE_THRESHOLDS) {
            if (effortPersonWeeks <= threshold.max) {
                return threshold.size;
            }
        }
        return ProjectSize.XL;
    }

    calculateBacklog(
        effortPersonWeeks: number,
        velocityPerSprint = 20
    ): { storyPoints: number; sprintCount: number } {
        const storyPoints = Math.round(effortPersonWeeks * 8);
        const sprintCount = Math.ceil(storyPoints / velocityPerSprint);
        return { storyPoints, sprintCount };
    }

    // ============================================================================
    // TASK-BERECHNUNG (KERN-LOGIK)
    // ============================================================================

    private normalizeTaskWeights(
        phaseTasks: PhaseTask[],
        customWeights?: { [taskId: string]: number }
    ): { [taskId: string]: number } {
        const weights: { [taskId: string]: number } = {};

        phaseTasks.forEach(task => {
            weights[task.id] = customWeights?.[task.id] ?? task.defaultWeight;
        });

        const sum = Object.values(weights).reduce((acc: number, w: number) => acc + w, 0);

        const normalized: { [taskId: string]: number } = {};
        Object.keys(weights).forEach(taskId => {
            normalized[taskId] = weights[taskId] / sum;
        });

        return normalized;
    }

    private calculatePhaseTasks(
        phaseTasks: PhaseTask[],
        phaseBaseEffort: number,
        phaseBufferEffort: number,
        customWeights?: { [taskId: string]: number }
    ): CalculatedTask[] {
        const normalizedWeights = this.normalizeTaskWeights(phaseTasks, customWeights);

        return phaseTasks.map(task => {
            const weight = normalizedWeights[task.id];
            const taskBaseEffort = phaseBaseEffort * weight;
            const taskBufferEffort = phaseBufferEffort * weight;
            const taskTotalEffort = taskBaseEffort + taskBufferEffort;

            return {
                id: task.id,
                name: task.name,
                weight: this.round(weight, 3),
                effortPersonWeeks: this.round(taskTotalEffort),
                baseEffort: this.round(taskBaseEffort),
                bufferEffort: this.round(taskBufferEffort)
            };
        });
    }

    // PHASEN-GENERIERUNG
    // ============================================================================

    generatePhases(
        effortPersonWeeks: number,
        durationWeeks: number,
        categoryScores: CategoryScore,
        riskBufferTotal: number = 0,
        taskWeights?: TaskWeightConfig
    ): ProjectPhase[] {
        const baseEffort = effortPersonWeeks - riskBufferTotal;

        // OPTIMIERT: Faktor UND Risiko-Gewicht in EINEM Durchlauf
        const phaseMetrics = this.calculatePhaseMetrics(categoryScores);

        // OPTIMIERT: Direkt mit Normalisierung in EINEM Durchlauf
        const normalizedPhases = this.normalizePhaseMetrics(phaseMetrics);

        // Puffer verteilen
        const bufferDistribution = this.distributeBuffer(normalizedPhases, riskBufferTotal);

        // Phasen mit präziser Dauer-Berechnung (keine nachträgliche Korrektur nötig)
        return this.buildPhasesWithPreciseDuration(
            normalizedPhases,
            baseEffort,
            durationWeeks,
            bufferDistribution,
            taskWeights
        );
    }

    // OPTIMIERT: Faktor + Risiko in EINER Berechnung (keine Redundanz)
    private calculatePhaseMetrics(categoryScores: CategoryScore): PhaseMetrics[] {
        const { readiness, complexity, uncertainty } = categoryScores;
        const readinessDeficit = 1 - readiness;

        return DSLC_PHASES_WITH_TASKS.map(phase => {
            const nameLower = phase.name.toLowerCase();

            let adjustmentFactor = 1;
            let riskWeight = 0;

            // Beide Metriken gleichzeitig berechnen (keine doppelte Arbeit)
            if (nameLower.includes('business') || nameLower.includes('understanding')) {
                adjustmentFactor += readinessDeficit * 0.7 + uncertainty * 0.3;
                riskWeight = readinessDeficit * 0.7 + uncertainty * 0.3;
            } else if (nameLower.includes('data') &&
                (nameLower.includes('collection') || nameLower.includes('exploration') || nameLower.includes('preparation'))) {
                adjustmentFactor += uncertainty * 0.6 + readinessDeficit * 0.4;
                riskWeight = uncertainty * 0.8 + readinessDeficit * 0.2;
            } else if (nameLower.includes('analysis') || nameLower.includes('modeling')) {
                adjustmentFactor += complexity * 0.7 + uncertainty * 0.3;
                riskWeight = complexity * 0.6 + uncertainty * 0.4;
            } else if (nameLower.includes('evaluation') || nameLower.includes('testing')) {
                adjustmentFactor += complexity * 0.5 + uncertainty * 0.5;
                riskWeight = complexity * 0.7 + uncertainty * 0.3;
            } else if (nameLower.includes('deployment')) {
                adjustmentFactor += readinessDeficit * 0.4 + complexity * 0.4;
                riskWeight = readinessDeficit * 0.5 + complexity * 0.5;
            } else if (nameLower.includes('utilization') || nameLower.includes('monitoring')) {
                adjustmentFactor += complexity * 0.5 + uncertainty * 0.5;
                riskWeight = complexity * 0.6 + uncertainty * 0.4;
            } else {
                const avgFactor = (complexity + uncertainty + readinessDeficit) / 3;
                adjustmentFactor += avgFactor * 0.5;
                riskWeight = avgFactor;
            }

            return {
                name: phase.name,
                tasks: phase.tasks,
                adjustmentFactor: Math.max(0.5, Math.min(2.0, adjustmentFactor)),
                riskWeight: Math.max(0, Math.min(1, riskWeight))
            };
        });
    }

    // OPTIMIERT: Normalisierung in EINEM Durchlauf (statt zweimal)
    private normalizePhaseMetrics(phaseMetrics: PhaseMetrics[]) {
        const totalAdjusted = phaseMetrics.reduce(
            (sum: number, p) => sum + (p.adjustmentFactor * DSLC_PHASES_WITH_TASKS.find(d => d.name === p.name)!.basePercentage),
            0
        );

        return phaseMetrics.map(p => {
            const basePercentage = DSLC_PHASES_WITH_TASKS.find(d => d.name === p.name)!.basePercentage;
            return {
                name: p.name,
                tasks: p.tasks,
                percentage: (p.adjustmentFactor * basePercentage) / totalAdjusted,
                riskWeight: p.riskWeight
            };
        });
    }

    private distributeBuffer(
        normalizedPhases: { name: string; riskWeight: number }[],
        riskBufferTotal: number
    ): Record<string, number> {
        const totalRiskWeight = normalizedPhases.reduce(
            (sum: number, p) => sum + p.riskWeight,
            0
        );

        const bufferDistribution: Record<string, number> = {};
        normalizedPhases.forEach(phase => {
            bufferDistribution[phase.name] = (phase.riskWeight / totalRiskWeight) * riskBufferTotal;
        });

        return bufferDistribution;
    }

    // OPTIMIERT: Präzise Dauer-Berechnung (keine nachträgliche Korrektur)
    private buildPhasesWithPreciseDuration(
        normalizedPhases: any[],
        baseEffort: number,
        durationWeeks: number,
        bufferDistribution: Record<string, number>,
        taskWeights?: TaskWeightConfig
    ): ProjectPhase[] {
        const phases: ProjectPhase[] = [];
        let remainingDuration = durationWeeks;
        let currentWeek = 0;

        normalizedPhases.forEach((phase, idx) => {
            const phaseBaseEffort = baseEffort * phase.percentage;
            const phaseBufferEffort = bufferDistribution[phase.name] || 0;
            const phaseTotalEffort = phaseBaseEffort + phaseBufferEffort;

            const calculatedTasks = this.calculatePhaseTasks(
                phase.tasks,
                phaseBaseEffort,
                phaseBufferEffort,
                taskWeights?.[phase.name]
            );

            // OPTIMIERT: Letzte Phase bekommt Rest, keine nachträgliche Normalisierung
            let phaseDuration: number;
            if (idx === normalizedPhases.length - 1) {
                phaseDuration = this.round(Math.max(0.1, remainingDuration));
            } else {
                phaseDuration = this.round(Math.max(0.1, durationWeeks * phase.percentage));
                remainingDuration -= phaseDuration;
            }

            const effortRatio = phaseTotalEffort > 0 ? phaseBaseEffort / phaseTotalEffort : 1;
            const baseDuration = phaseDuration < 1
                ? Math.max(0, phaseDuration * effortRatio)
                : Math.max(0.1, phaseDuration * effortRatio);
            const bufferDuration = phaseDuration - baseDuration;

            phases.push({
                name: phase.name,
                startWeek: this.round(currentWeek),
                durationWeeks: phaseDuration,
                effortPersonWeeks: this.round(phaseTotalEffort),
                percentage: phase.percentage,
                baseEffort: this.round(phaseBaseEffort),
                bufferEffort: this.round(phaseBufferEffort),
                baseDuration: this.round(baseDuration),
                bufferDuration: this.round(Math.max(0, bufferDuration)),
                tasks: calculatedTasks
            });

            currentWeek += phaseDuration;
        });

        return phases;
    }

    // VALIDIERUNG
    // ============================================================================

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

        if (request.productivityFactor && (request.productivityFactor <= 0 || request.productivityFactor > 1)) {
            errors.push("Produktivitätsfaktor muss zwischen 0 und 1 liegen");
        }

        if (request.velocityPerSprint && request.velocityPerSprint <= 0) {
            errors.push("Velocity pro Sprint muss größer als 0 sein");
        }

        // Nur Warnung, keine Validierungs-Fehler (wird automatisch normalisiert)
        if (request.taskWeights) {
            Object.entries(request.taskWeights).forEach(([phaseName, weights]) => {
                const sum = Object.values(weights as Record<string, number>).reduce(
                    (acc: number, w: number) => acc + w,
                    0
                );
                if (Math.abs(sum - 1.0) > 0.01) {
                    console.warn(`Task-Gewichtungen für Phase "${phaseName}" summieren sich auf ${sum} (werden normalisiert)`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // HAUPT-BERECHNUNG
    // ============================================================================

    calculate(request: CalculationRequest): ProjectMetrics {
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
            velocityPerSprint = 20,
            taskWeights
        } = request;

        const includeRiskBuffer = request.includeRiskBuffer ?? true;

        const normalized = this.normalizeInputs(inputs);
        const weighted = this.applyWeights(normalized, weights);
        const categoryScores = this.calculateCategoryScores(weighted, inputs);
        const overallScore = this.calculateOverallScore(categoryScores);

        const effortWithoutBuffer = this.estimateEffort(projectType, categoryScores, false);
        const riskLevel = (categoryScores.complexity + categoryScores.uncertainty) / 2;
        const bufferPercentage = includeRiskBuffer ? riskLevel * 0.15 : 0;
        const riskBufferTotal = effortWithoutBuffer * bufferPercentage;
        const effortPersonWeeks = effortWithoutBuffer + riskBufferTotal;

        const durationWeeks = this.estimateDuration(effortPersonWeeks, teamSize, productivityFactor);
        const projectSize = this.classifyProjectSize(effortPersonWeeks);
        const { storyPoints, sprintCount } = this.calculateBacklog(effortPersonWeeks, velocityPerSprint);

        const phases = this.generatePhases(
            effortPersonWeeks,
            durationWeeks,
            categoryScores,
            riskBufferTotal,
            taskWeights
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
            effortBreakdown: {
                baseEffort: effortWithoutBuffer,
                bufferEffort: riskBufferTotal,
                bufferPercentage,
                riskLevel
            }
        };
    }
}

export const calculationService = new ProjectCalculationService();