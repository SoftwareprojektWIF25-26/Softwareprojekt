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

/**
 * Internes Interface, das Phasen-Anpassungsfaktoren und Risikogewichte bündelt,
 * bevor sie über die Projektzeitleiste verteilt werden.
 */
interface PhaseMetrics {
    name: string;
    tasks: PhaseTask[];
    adjustmentFactor: number;
    riskWeight: number;
}

export class ProjectCalculationService {

    /**
     * Normalisiert Benutzereingaben auf eine Skala von 0.0 bis 1.0.
     * Bei negativen Indikatoren wird die Skala umgekehrt, sodass ein höherer Wert
     * immer "besser" oder "mehr" bedeutet.
     */
    public normalizeInputs(inputs: InputField[]): NormalizedValue[] {
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

    /**
     * Verteilt die relativen Gewichte auf die normalisierten Werte.
     * Stellt sicher, dass alle Gewichte in ihrem Kontext exakt 1.0 ergeben.
     */
    public applyWeights(
        normalizedValues: NormalizedValue[],
        weights: WeightConfig
    ): NormalizedValue[] {
        const rawWeights = normalizedValues.map(nv => weights[nv.fieldId] ?? 1.0);
        const weightSum = rawWeights.reduce((sum, w) => sum + w, 0);

        return normalizedValues.map((nv, idx) => ({
            ...nv,
            weight: weightSum > 0 ? rawWeights[idx] / weightSum : 0
        }));
    }

    public calculateCategoryScores(
        weightedValues: NormalizedValue[],
        inputs: InputField[]
    ): CategoryScore {
        const inputsByCategory = this.groupInputsByCategory(inputs);
        const scores: Partial<CategoryScore> = {};
        const categories = ['readiness', 'complexity', 'uncertainty'] as const;

        categories.forEach(category => {
            const categoryInputs = inputsByCategory[category] || [];

            if (categoryInputs.length === 0) {
                // Standardmäßig neutraler Mittelwert, wenn keine Eingaben für diese Kategorie vorhanden sind
                scores[category] = 0.5;
                return;
            }

            const categoryValues = weightedValues.filter(wv =>
                categoryInputs.some(ci => ci.id === wv.fieldId)
            );

            const weightSum = categoryValues.reduce((sum, cv) => sum + cv.weight, 0);
            const weightedSum = categoryValues.reduce((sum, cv) => sum + cv.normalized * cv.weight, 0);

            scores[category] = weightSum > 0 ? weightedSum / weightSum : 0.5;
        });

        return scores as CategoryScore;
    }

    public calculateOverallScore(categoryScores: CategoryScore): number {
        // Ein höherer Gesamtscore signalisiert einen günstigen Projektzustand (hohe Readiness, geringe Komplexität/Unsicherheit)
        return (
            categoryScores.readiness * 0.4 +
            (1 - categoryScores.complexity) * 0.3 +
            (1 - categoryScores.uncertainty) * 0.3
        );
    }

    public estimateEffort(
        projectType: ProjectType,
        categoryScores: CategoryScore,
        includeRiskBuffer = true
    ): number {
        const baseEffort = BASE_EFFORT[projectType];

        // Kernskalierung des Aufwands basierend auf den Kategoriebewertungen
        const readinessFactor = 1 + (0.5 - categoryScores.readiness);
        const complexityFactor = 1 + (categoryScores.complexity * 0.8);
        const uncertaintyFactor = 1 + (categoryScores.uncertainty * 0.6);
        const readinessPenalty = categoryScores.readiness < 0.3 ? 1.2 : 1.0;

        let effort = baseEffort * readinessFactor * complexityFactor * uncertaintyFactor * readinessPenalty;

        if (includeRiskBuffer) {
            const riskLevel = (categoryScores.complexity + categoryScores.uncertainty) / 2;
            effort *= (1 + riskLevel * 0.15);
        }

        return this.round(effort);
    }

    public estimateDuration(
        effortPersonWeeks: number,
        teamSize: number,
        productivityFactor = 0.6
    ): number {
        return Math.ceil(effortPersonWeeks / (teamSize * productivityFactor));
    }

    public classifyProjectSize(effortPersonWeeks: number): ProjectSize {
        const threshold = PROJECT_SIZE_THRESHOLDS.find(t => effortPersonWeeks <= t.max);
        return threshold ? threshold.size : ProjectSize.XL;
    }

    public calculateBacklog(
        effortPersonWeeks: number,
        velocityPerSprint = 20
    ): { storyPoints: number; sprintCount: number } {
        const storyPoints = Math.round(effortPersonWeeks * 8);
        const sprintCount = Math.ceil(storyPoints / velocityPerSprint);
        return { storyPoints, sprintCount };
    }

    public generatePhases(
        effortPersonWeeks: number,
        durationWeeks: number,
        categoryScores: CategoryScore,
        riskBufferTotal: number = 0,
        taskWeights?: TaskWeightConfig
    ): ProjectPhase[] {
        const baseEffort = effortPersonWeeks - riskBufferTotal;
        const phaseMetrics = this.calculatePhaseMetrics(categoryScores);
        const normalizedPhases = this.normalizePhaseMetrics(phaseMetrics);
        const bufferDistribution = this.distributeBuffer(normalizedPhases, riskBufferTotal);

        return this.buildPhasesWithPreciseDuration(
            normalizedPhases,
            baseEffort,
            durationWeeks,
            bufferDistribution,
            taskWeights
        );
    }

    public validateRequest(request: CalculationRequest): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!request.inputs || request.inputs.length === 0) {
            errors.push("Keine Eingabewerte vorhanden.");
        }

        if (!request.projectType) {
            errors.push("Projekttyp muss angegeben werden.");
        }

        if (request.teamSize < 1) {
            errors.push("Teamgröße muss mindestens 1 sein.");
        }

        if (request.productivityFactor && (request.productivityFactor <= 0 || request.productivityFactor > 1)) {
            errors.push("Produktivitätsfaktor muss zwischen 0 und 1 liegen.");
        }

        if (request.velocityPerSprint && request.velocityPerSprint <= 0) {
            errors.push("Velocity pro Sprint muss größer als 0 sein.");
        }

        if (request.taskWeights) {
            this.checkTaskWeightNormalization(request.taskWeights);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public calculate(request: CalculationRequest): ProjectMetrics {
        const validation = this.validateRequest(request);
        if (!validation.isValid) {
            throw new Error(`Ungültige Eingaben: ${validation.errors.join(' ')}`);
        }

        const {
            inputs,
            weights,
            projectType,
            teamSize,
            productivityFactor = 0.6,
            velocityPerSprint = 20,
            taskWeights,
            includeRiskBuffer = true
        } = request;

        const normalized = this.normalizeInputs(inputs);
        const weighted = this.applyWeights(normalized, weights);
        const categoryScores = this.calculateCategoryScores(weighted, inputs);

        const effortWithoutBuffer = this.estimateEffort(projectType, categoryScores, false);
        const riskLevel = (categoryScores.complexity + categoryScores.uncertainty) / 2;
        const bufferPercentage = includeRiskBuffer ? riskLevel * 0.15 : 0;
        const riskBufferTotal = effortWithoutBuffer * bufferPercentage;
        const effortPersonWeeks = effortWithoutBuffer + riskBufferTotal;

        const durationWeeks = this.estimateDuration(effortPersonWeeks, teamSize, productivityFactor);

        return {
            categoryScores,
            overallScore: this.calculateOverallScore(categoryScores),
            effortPersonWeeks,
            durationWeeks,
            projectSize: this.classifyProjectSize(effortPersonWeeks),
            ...this.calculateBacklog(effortPersonWeeks, velocityPerSprint),
            phases: this.generatePhases(effortPersonWeeks, durationWeeks, categoryScores, riskBufferTotal, taskWeights),
            effortBreakdown: {
                baseEffort: effortWithoutBuffer,
                bufferEffort: riskBufferTotal,
                bufferPercentage,
                riskLevel
            }
        };
    }

    // ============================================================================
    // PRIVATE HILFSMETHODEN
    // ============================================================================

    private round(value: number, decimals: number = 1): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
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

    private groupInputsByCategory(inputs: InputField[]): Record<string, InputField[]> {
        return inputs.reduce((acc, input) => {
            if (!acc[input.category]) acc[input.category] = [];
            acc[input.category].push(input);
            return acc;
        }, {} as Record<string, InputField[]>);
    }

    private normalizeTaskWeights(
        phaseTasks: PhaseTask[],
        customWeights?: { [taskId: string]: number }
    ): { [taskId: string]: number } {
        const weights: Record<string, number> = {};

        phaseTasks.forEach(task => {
            weights[task.id] = customWeights?.[task.id] ?? task.defaultWeight;
        });

        const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);

        return Object.keys(weights).reduce((acc, taskId) => {
            acc[taskId] = sum > 0 ? weights[taskId] / sum : 0;
            return acc;
        }, {} as Record<string, number>);
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

            return {
                id: task.id,
                name: task.name,
                weight: this.round(weight, 3),
                effortPersonWeeks: this.round(taskBaseEffort + taskBufferEffort),
                baseEffort: this.round(taskBaseEffort),
                bufferEffort: this.round(taskBufferEffort)
            };
        });
    }

    /**
     * Ordnet DSLC-Phasen (Data Science Lifecycle) kontextspezifischen Risiko-
     * und Anpassungsfaktoren zu. Verschiedene Phasen reagieren unterschiedlich
     * auf Readiness, Komplexität und Unsicherheit des Projekts.
     */
    private calculatePhaseMetrics(categoryScores: CategoryScore): PhaseMetrics[] {
        const { readiness, complexity, uncertainty } = categoryScores;
        const readinessDeficit = 1 - readiness;

        return DSLC_PHASES_WITH_TASKS.map(phase => {
            const nameLower = phase.name.toLowerCase();
            let adjustmentFactor = 1;
            let riskWeight = 0;

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

    private normalizePhaseMetrics(phaseMetrics: PhaseMetrics[]) {
        const totalAdjusted = phaseMetrics.reduce((sum, p) => {
            const basePct = DSLC_PHASES_WITH_TASKS.find(d => d.name === p.name)?.basePercentage || 0;
            return sum + (p.adjustmentFactor * basePct);
        }, 0);

        return phaseMetrics.map(p => {
            const basePercentage = DSLC_PHASES_WITH_TASKS.find(d => d.name === p.name)?.basePercentage || 0;
            return {
                name: p.name,
                tasks: p.tasks,
                percentage: totalAdjusted > 0 ? (p.adjustmentFactor * basePercentage) / totalAdjusted : 0,
                riskWeight: p.riskWeight
            };
        });
    }

    private distributeBuffer(
        normalizedPhases: { name: string; riskWeight: number }[],
        riskBufferTotal: number
    ): Record<string, number> {
        const totalRiskWeight = normalizedPhases.reduce((sum, p) => sum + p.riskWeight, 0);

        return normalizedPhases.reduce((acc, phase) => {
            acc[phase.name] = totalRiskWeight > 0 ? (phase.riskWeight / totalRiskWeight) * riskBufferTotal : 0;
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Iteriert durch die normalisierten Phasen und berechnet den finalen Aufwand
     * sowie die Dauer für jede Phase. Die letzte Phase dient als Puffer für
     * Gleitkomma-Ungenauigkeiten und stellt sicher, dass die Gesamtdauer exakt
     * mit der Projektschätzung übereinstimmt.
     */
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

            let phaseDuration = idx === normalizedPhases.length - 1
                ? this.round(Math.max(0.1, remainingDuration))
                : this.round(Math.max(0.1, durationWeeks * phase.percentage));

            if (idx !== normalizedPhases.length - 1) {
                remainingDuration -= phaseDuration;
            }

            const effortRatio = phaseTotalEffort > 0 ? phaseBaseEffort / phaseTotalEffort : 1;
            const baseDuration = Math.max(phaseDuration < 1 ? 0 : 0.1, phaseDuration * effortRatio);
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

    private checkTaskWeightNormalization(taskWeights: TaskWeightConfig): void {
        Object.entries(taskWeights).forEach(([phaseName, weights]) => {
            const sum = Object.values(weights as Record<string, number>).reduce((acc, w) => acc + w, 0);
            if (Math.abs(sum - 1.0) > 0.01) {
                console.warn(`Task-Gewichtungen für Phase "${phaseName}" summieren sich auf ${sum}. Sie werden automatisch normalisiert.`);
            }
        });
    }
}

export const calculationService = new ProjectCalculationService();
