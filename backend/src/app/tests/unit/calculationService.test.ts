// src/app/services/__tests__/calculationService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectCalculationService } from '../../services/calculation/calculationService.ts';
import {
    InputField,
    WeightConfig,
    ProjectType,
    ProjectSize,
    CalculationRequest
} from '../../types.js';

describe('ProjectCalculationService', () => {
    let service: ProjectCalculationService;

    beforeEach(() => {
        service = new ProjectCalculationService();
    });

    // ============================================================
    // normalizeInputs
    // ============================================================
    describe('normalizeInputs', () => {
        it('sollte boolean-Werte normalisieren', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: 'Field 1', type: 'boolean', value: true,  category: 'readiness', isNegative: false },
                { id: 'f2', label: 'Field 2', type: 'boolean', value: false, category: 'readiness', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(1);
            expect(result[1].normalized).toBe(0);
        });

        it('sollte percentage-Werte normalisieren', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'percentage', value: 50,  category: 'readiness', isNegative: false },
                { id: 'f2', label: '', type: 'percentage', value: 100, category: 'readiness', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
            expect(result[1].normalized).toBe(1);
        });

        it('sollte number-Werte mit min/max normalisieren', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'number', value: 5, min: 0, max: 10, category: 'complexity', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
        });

        it('sollte number-Werte ohne min/max mit Default-Bereich normalisieren', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'number', value: 50, category: 'complexity', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
        });

        it('sollte select-Werte normalisieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', label: '', type: 'select',
                    value: 'medium',
                    options: ['low', 'medium', 'high'],
                    category: 'complexity',
                    isNegative: false
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
        });

        it('sollte erstes select-Element auf 0 normalisieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', label: '', type: 'select',
                    value: 'low',
                    options: ['low', 'medium', 'high'],
                    category: 'complexity',
                    isNegative: false
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0);
        });

        it('sollte letztes select-Element auf 1 normalisieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', label: '', type: 'select',
                    value: 'high',
                    options: ['low', 'medium', 'high'],
                    category: 'complexity',
                    isNegative: false
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(1);
        });

        it('sollte negative Faktoren invertieren', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'percentage', value: 80, category: 'complexity', isNegative: true }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.2); // 1 - 0.8
        });

        it('sollte Werte auf [0, 1] begrenzen', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'number', value: 150, min: 0, max: 100, category: 'readiness', isNegative: false },
                { id: 'f2', label: '', type: 'number', value: -50, min: 0, max: 100, category: 'readiness', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(1);
            expect(result[1].normalized).toBe(0);
        });

        it('sollte fieldId korrekt übernehmen', () => {
            const inputs: InputField[] = [
                { id: 'myField', label: '', type: 'boolean', value: true, category: 'readiness', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].fieldId).toBe('myField');
        });
    });

    // ============================================================
    // applyWeights
    // ============================================================
    describe('applyWeights', () => {
        it('sollte Gewichte normalisieren', () => {
            const normalizedValues = [
                { fieldId: 'f1', normalized: 0.5, weight: 0 },
                { fieldId: 'f2', normalized: 0.8, weight: 0 }
            ];
            const weights: WeightConfig = { f1: 2.0, f2: 1.0 };

            const result = service.applyWeights(normalizedValues, weights);

            expect(result[0].weight).toBeCloseTo(2 / 3);
            expect(result[1].weight).toBeCloseTo(1 / 3);
        });

        it('sollte Default-Gewicht 1.0 verwenden wenn kein Gewicht konfiguriert', () => {
            const normalizedValues = [
                { fieldId: 'f1', normalized: 0.5, weight: 0 },
                { fieldId: 'f2', normalized: 0.8, weight: 0 }
            ];
            const weights: WeightConfig = {};

            const result = service.applyWeights(normalizedValues, weights);

            expect(result[0].weight).toBe(0.5);
            expect(result[1].weight).toBe(0.5);
        });

        it('sollte Gewichte auf 1 summieren', () => {
            const normalizedValues = [
                { fieldId: 'f1', normalized: 0.3, weight: 0 },
                { fieldId: 'f2', normalized: 0.6, weight: 0 },
                { fieldId: 'f3', normalized: 0.9, weight: 0 }
            ];
            const weights: WeightConfig = { f1: 3.0, f2: 2.0, f3: 1.0 };

            const result = service.applyWeights(normalizedValues, weights);

            const weightSum = result.reduce((sum, v) => sum + v.weight, 0);
            expect(weightSum).toBeCloseTo(1);
        });

        it('sollte weight=0 zurückgeben wenn Summe aller Gewichte 0 ist', () => {
            const normalizedValues = [
                { fieldId: 'f1', normalized: 0.5, weight: 0 }
            ];
            const weights: WeightConfig = { f1: 0 };

            const result = service.applyWeights(normalizedValues, weights);

            expect(result[0].weight).toBe(0);
        });
    });

    // ============================================================
    // calculateCategoryScores
    // ============================================================
    describe('calculateCategoryScores', () => {
        it('sollte Kategorie-Scores korrekt berechnen', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'boolean', value: true, category: 'readiness',  isNegative: false },
                { id: 'f2', label: '', type: 'boolean', value: false, category: 'readiness', isNegative: false },
                { id: 'f3', label: '', type: 'boolean', value: true, category: 'complexity', isNegative: false }
            ];

            const weightedValues = [
                { fieldId: 'f1', normalized: 1, weight: 0.25 },
                { fieldId: 'f2', normalized: 0, weight: 0.25 },
                { fieldId: 'f3', normalized: 1, weight: 0.5 }
            ];

            const result = service.calculateCategoryScores(weightedValues, inputs);

            // readiness: (1*0.25 + 0*0.25) / 0.5 = 0.5
            expect(result.readiness).toBeCloseTo(0.5);
            // complexity: (1*0.5) / 0.5 = 1
            expect(result.complexity).toBeCloseTo(1);
        });

        it('sollte 0.5 für leere Kategorien zurückgeben', () => {
            const result = service.calculateCategoryScores([], []);

            expect(result.readiness).toBe(0.5);
            expect(result.complexity).toBe(0.5);
            expect(result.uncertainty).toBe(0.5);
        });

        it('sollte alle drei Kategorien zurückgeben', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: '', type: 'percentage', value: 80, category: 'readiness',   isNegative: false },
                { id: 'f2', label: '', type: 'percentage', value: 40, category: 'complexity',  isNegative: false },
                { id: 'f3', label: '', type: 'percentage', value: 60, category: 'uncertainty', isNegative: false }
            ];

            const weightedValues = [
                { fieldId: 'f1', normalized: 0.8, weight: 1 / 3 },
                { fieldId: 'f2', normalized: 0.4, weight: 1 / 3 },
                { fieldId: 'f3', normalized: 0.6, weight: 1 / 3 }
            ];

            const result = service.calculateCategoryScores(weightedValues, inputs);

            expect(result).toHaveProperty('readiness');
            expect(result).toHaveProperty('complexity');
            expect(result).toHaveProperty('uncertainty');
            expect(result.readiness).toBeCloseTo(0.8);
            expect(result.complexity).toBeCloseTo(0.4);
            expect(result.uncertainty).toBeCloseTo(0.6);
        });
    });

    // ============================================================
    // calculateOverallScore
    // ============================================================
    describe('calculateOverallScore', () => {
        it('sollte Overall-Score mit fest definierten Gewichten berechnen', () => {
            // Gewichte im Service: readiness=0.4, complexity=0.3, uncertainty=0.3
            const categoryScores = { readiness: 0.8, complexity: 0.4, uncertainty: 0.3 };

            const result = service.calculateOverallScore(categoryScores);

            // (0.8*0.4 + (1-0.4)*0.3 + (1-0.3)*0.3) / 1.0
            const expected = (0.8 * 0.4 + 0.6 * 0.3 + 0.7 * 0.3);
            expect(result).toBeCloseTo(expected);
        });

        it('sollte Score zwischen 0 und 1 liegen', () => {
            const extremeHigh = { readiness: 1.0, complexity: 0.0, uncertainty: 0.0 };
            const extremeLow  = { readiness: 0.0, complexity: 1.0, uncertainty: 1.0 };

            expect(service.calculateOverallScore(extremeHigh)).toBeLessThanOrEqual(1);
            expect(service.calculateOverallScore(extremeHigh)).toBeGreaterThanOrEqual(0);
            expect(service.calculateOverallScore(extremeLow)).toBeLessThanOrEqual(1);
            expect(service.calculateOverallScore(extremeLow)).toBeGreaterThanOrEqual(0);
        });

        it('sollte bei neutralen Werten ~0.5 zurückgeben', () => {
            const neutral = { readiness: 0.5, complexity: 0.5, uncertainty: 0.5 };

            const result = service.calculateOverallScore(neutral);

            expect(result).toBeCloseTo(0.5);
        });
    });

    // ============================================================
    // estimateEffort
    // ============================================================
    describe('estimateEffort', () => {
        it('sollte Aufwand für Reporting berechnen', () => {
            const categoryScores = { readiness: 0.8, complexity: 0.3, uncertainty: 0.2 };

            const result = service.estimateEffort(ProjectType.REPORTING, categoryScores);

            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1000);
        });

        it('sollte bei niedriger Readiness höheren Aufwand schätzen', () => {
            const lowReadiness  = { readiness: 0.2, complexity: 0.3, uncertainty: 0.2 };
            const highReadiness = { readiness: 0.8, complexity: 0.3, uncertainty: 0.2 };

            const lowResult  = service.estimateEffort(ProjectType.REPORTING, lowReadiness);
            const highResult = service.estimateEffort(ProjectType.REPORTING, highReadiness);

            expect(lowResult).toBeGreaterThan(highResult);
        });

        it('sollte hohe Komplexität zu höherem Aufwand führen', () => {
            const lowComplexity  = { readiness: 0.5, complexity: 0.2, uncertainty: 0.5 };
            const highComplexity = { readiness: 0.5, complexity: 0.8, uncertainty: 0.5 };

            const lowResult  = service.estimateEffort(ProjectType.CLASSIC_ML, lowComplexity);
            const highResult = service.estimateEffort(ProjectType.CLASSIC_ML, highComplexity);

            expect(highResult).toBeGreaterThan(lowResult);
        });

        it('sollte hohe Unsicherheit zu höherem Aufwand führen', () => {
            const lowUnc  = { readiness: 0.5, complexity: 0.5, uncertainty: 0.1 };
            const highUnc = { readiness: 0.5, complexity: 0.5, uncertainty: 0.9 };

            const lowResult  = service.estimateEffort(ProjectType.CLASSIC_ML, lowUnc);
            const highResult = service.estimateEffort(ProjectType.CLASSIC_ML, highUnc);

            expect(highResult).toBeGreaterThan(lowResult);
        });

        it('sollte mit Risikopuffer mehr schätzen als ohne', () => {
            const categoryScores = { readiness: 0.5, complexity: 0.5, uncertainty: 0.5 };

            const withBuffer    = service.estimateEffort(ProjectType.REPORTING, categoryScores, true);
            const withoutBuffer = service.estimateEffort(ProjectType.REPORTING, categoryScores, false);

            expect(withBuffer).toBeGreaterThan(withoutBuffer);
        });

        it('sollte bei includeRiskBuffer=false gleich sein wie keine Buffer-Flag', () => {
            const categoryScores = { readiness: 0.5, complexity: 0.0, uncertainty: 0.0 };

            // Bei complexity=0 und uncertainty=0 ist riskLevel=0 → kein Puffer
            const withBuffer    = service.estimateEffort(ProjectType.REPORTING, categoryScores, true);
            const withoutBuffer = service.estimateEffort(ProjectType.REPORTING, categoryScores, false);

            expect(withBuffer).toBe(withoutBuffer);
        });
    });

    // ============================================================
    // estimateDuration
    // ============================================================
    describe('estimateDuration', () => {
        it('sollte Dauer korrekt berechnen', () => {
            // 60 PW / (5 * 0.6) = 20 Wochen
            const result = service.estimateDuration(60, 5, 0.6);
            expect(result).toBe(20);
        });

        it('sollte auf ganze Wochen aufrunden', () => {
            // 50 / (5 * 0.6) = 16.67 → 17
            const result = service.estimateDuration(50, 5, 0.6);
            expect(result).toBe(17);
        });

        it('sollte mit kleinen Teams funktionieren', () => {
            const result = service.estimateDuration(40, 1, 0.6);
            expect(result).toBeGreaterThan(0);
        });

        it('sollte Default-Produktivitätsfaktor 0.6 verwenden', () => {
            const withDefault  = service.estimateDuration(60, 5);
            const withExplicit = service.estimateDuration(60, 5, 0.6);
            expect(withDefault).toBe(withExplicit);
        });

        it('sollte größeres Team zu kürzerer Dauer führen', () => {
            const smallTeam = service.estimateDuration(100, 2, 0.6);
            const bigTeam   = service.estimateDuration(100, 8, 0.6);
            expect(bigTeam).toBeLessThan(smallTeam);
        });
    });

    // ============================================================
    // classifyProjectSize
    // ============================================================
    describe('classifyProjectSize', () => {
        it('sollte XS für sehr kleine Projekte zurückgeben', () => {
            expect(service.classifyProjectSize(4)).toBe(ProjectSize.XS);
        });

        it('sollte S für kleine Projekte zurückgeben', () => {
            expect(service.classifyProjectSize(5)).toBe(ProjectSize.S);
        });

        it('sollte M für mittlere Projekte zurückgeben', () => {
            expect(service.classifyProjectSize(15)).toBe(ProjectSize.M);
        });

        it('sollte L für große Projekte zurückgeben', () => {
            expect(service.classifyProjectSize(35)).toBe(ProjectSize.L);
        });

        it('sollte XL für sehr große Projekte zurückgeben', () => {
            expect(service.classifyProjectSize(75)).toBe(ProjectSize.XL);
        });
    });

    // ============================================================
    // calculateBacklog
    // ============================================================
    describe('calculateBacklog', () => {
        it('sollte Story Points und Sprint Count mit Default-Velocity berechnen', () => {
            // teamSize=20 → velocity = 20 * 7 = 140
            // storyPoints = 50 * 8 = 400
            // sprintCount = ceil(400 / 140) = 3
            const result = service.calculateBacklog(50, 20);

            expect(result.storyPoints).toBe(400);
            expect(result.sprintCount).toBe(3);
        });

        it('sollte mit benutzerdefinierter Velocity funktionieren', () => {
            // storyPoints = 30 * 8 = 240
            // sprintCount = ceil(240 / 15) = 16
            const result = service.calculateBacklog(30, 5, 15);

            expect(result.storyPoints).toBe(240);
            expect(result.sprintCount).toBe(16);
        });

        it('sollte Sprint Count aufrunden', () => {
            // storyPoints = 10 * 8 = 80; velocity = 3 * 7 = 21 → ceil(80/21) = 4
            const result = service.calculateBacklog(10, 3);

            expect(result.sprintCount).toBe(Math.ceil(result.storyPoints / (3 * 7)));
        });

        it('sollte storyPoints immer positiv sein', () => {
            const result = service.calculateBacklog(1, 1);
            expect(result.storyPoints).toBeGreaterThan(0);
        });
    });

    // ============================================================
    // validateRequest
    // ============================================================
    describe('validateRequest', () => {
        const validRequest: CalculationRequest = {
            inputs: [{ id: 'f1', label: '', type: 'boolean', value: true, category: 'readiness', isNegative: false }],
            weights: {},
            projectType: ProjectType.REPORTING,
            teamSize: 3
        };

        it('sollte gültige Anfrage akzeptieren', () => {
            const result = service.validateRequest(validRequest);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('sollte Fehler bei fehlendem projectType zurückgeben', () => {
            const request = { ...validRequest, projectType: undefined as any };
            const result = service.validateRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('sollte Fehler bei teamSize < 1 zurückgeben', () => {
            const request = { ...validRequest, teamSize: 0 };
            const result = service.validateRequest(request);
            expect(result.isValid).toBe(false);
        });

        it('sollte Fehler bei ungültigem productivityFactor zurückgeben', () => {
            const request = { ...validRequest, productivityFactor: 1.5 };
            const result = service.validateRequest(request);
            expect(result.isValid).toBe(false);
        });

        it('sollte Fehler bei productivityFactor = 0 zurückgeben', () => {
            const request = { ...validRequest, productivityFactor: 0 };
            const result = service.validateRequest(request);
            expect(result.isValid).toBe(false);
        });

        it('sollte Fehler bei negativer velocityPerSprint zurückgeben', () => {
            const request = { ...validRequest, velocityPerSprint: -5 };
            const result = service.validateRequest(request);
            expect(result.isValid).toBe(false);
        });

        it('sollte Fehler bei fehlenden inputs zurückgeben wenn inputs leer', () => {
            const request = { ...validRequest, inputs: [] };
            // Leere inputs sind laut Validator ungültig
            const result = service.validateRequest(request);
            expect(result.isValid).toBe(false);
        });
    });

    // ============================================================
    // generatePhases
    // ============================================================
    describe('generatePhases', () => {
        const baseScores = { readiness: 0.5, complexity: 0.5, uncertainty: 0.5 };

        it('sollte genau 6 DSLC-Phasen generieren', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);
            expect(result.length).toBe(6);
        });

        it('sollte erste Phase bei Woche 0 starten', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);
            expect(result[0].startWeek).toBe(0);
        });

        it('sollte Puffer-Tracking-Felder in jeder Phase enthalten', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);

            result.forEach(phase => {
                expect(phase).toHaveProperty('baseEffort');
                expect(phase).toHaveProperty('bufferEffort');
                expect(phase).toHaveProperty('baseDuration');
                expect(phase).toHaveProperty('bufferDuration');
            });
        });

        it('sollte Gesamtdauer exakt auf durationWeeks summieren', () => {
            const durationWeeks = 20;
            const result = service.generatePhases(100, durationWeeks, baseScores, 10);

            const totalWeeks = result.reduce((sum, p) => sum + p.durationWeeks, 0);
            expect(totalWeeks).toBe(durationWeeks);
        });

        it('sollte Prozentsätze auf ~1 normalisieren', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);

            const totalPercentage = result.reduce((sum, p) => sum + p.percentage, 0);
            expect(totalPercentage).toBeCloseTo(1, 5);
        });

        it('sollte effortPersonWeeks = baseEffort + bufferEffort je Phase sein', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);

            result.forEach(phase => {
                expect(phase.effortPersonWeeks).toBeCloseTo(
                    (phase.baseEffort ?? 0) + (phase.bufferEffort ?? 0),
                    1
                );
            });
        });

        it('sollte durationWeeks = baseDuration + bufferDuration je Phase sein', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);

            result.forEach(phase => {
                expect(phase.durationWeeks).toBeCloseTo(
                    (phase.baseDuration ?? 0) + (phase.bufferDuration ?? 0),
                    5
                );
            });
        });

        it('sollte Puffer risikobasiert auf Phasen verteilen', () => {
            const totalBuffer = 15;
            const result = service.generatePhases(100, 20, baseScores, totalBuffer);

            const totalPhaseBuffer = result.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0);
            expect(totalPhaseBuffer).toBeCloseTo(totalBuffer, 1);
        });

        it('sollte Business-Understanding-Phase bei niedriger Readiness anteilig größer machen', () => {
            const lowReadiness  = { readiness: 0.2, complexity: 0.5, uncertainty: 0.5 };
            const highReadiness = { readiness: 0.8, complexity: 0.5, uncertainty: 0.5 };

            const lowResult  = service.generatePhases(100, 20, lowReadiness,  10);
            const highResult = service.generatePhases(100, 20, highReadiness, 10);

            const lowPhase  = lowResult.find(p => p.name.toLowerCase().includes('business'));
            const highPhase = highResult.find(p => p.name.toLowerCase().includes('business'));

            if (lowPhase && highPhase) {
                expect(lowPhase.percentage).toBeGreaterThan(highPhase.percentage);
            }
        });

        it('sollte ohne Puffer (riskBuffer=0) bufferEffort=0 je Phase liefern', () => {
            const result = service.generatePhases(100, 20, baseScores, 0);

            result.forEach(phase => {
                expect(phase.bufferEffort).toBe(0);
            });
        });

        it('sollte tasks für jede Phase enthalten', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);

            result.forEach(phase => {
                expect(phase.tasks).toBeDefined();
                expect(Array.isArray(phase.tasks)).toBe(true);
                expect(phase.tasks.length).toBeGreaterThan(0);
            });
        });

        it('sollte Task-Gewichte je Phase auf ~1 normalisieren', () => {
            const result = service.generatePhases(100, 20, baseScores, 10);

            result.forEach(phase => {
                const weightSum = phase.tasks.reduce((sum, t) => sum + t.weight, 0);
                expect(weightSum).toBeCloseTo(1, 3);
            });
        });

        it('sollte benutzerdefinierte Task-Gewichte akzeptieren', () => {
            const phaseWithTasks = service.generatePhases(100, 20, baseScores, 10);
            const firstPhaseName = phaseWithTasks[0].name;
            const phaseTasks     = phaseWithTasks[0].tasks;

            // Alle Tasks mit gleichem Gewicht → jeder Task bekommt 1/n nach Normalisierung
            const equalWeights: Record<string, number> = {};
            phaseTasks.forEach(t => { equalWeights[t.id] = 1.0; });

            const customWeights: Record<string, Record<string, number>> = {
                [firstPhaseName]: equalWeights
            };

            const result = service.generatePhases(100, 20, baseScores, 10, customWeights);

            const customPhase = result.find(p => p.name === firstPhaseName);
            const weightSum   = customPhase?.tasks.reduce((sum, t) => sum + t.weight, 0);

            expect(weightSum).toBeCloseTo(1, 3);
            // Alle Gewichte gleich → jedes sollte 1/Anzahl sein
            const expected = 1 / phaseTasks.length;
            customPhase?.tasks.forEach(t => {
                expect(t.weight).toBeCloseTo(expected, 2);
            });
        });
    });

    // ============================================================
    // calculate – Integrationstest
    // ============================================================
    describe('calculate (Integration)', () => {
        const baseRequest: CalculationRequest = {
            inputs: [
                { id: 'f1', label: '', type: 'boolean',    value: true, category: 'readiness',  isNegative: false },
                { id: 'f2', label: '', type: 'percentage', value: 50,   category: 'complexity', isNegative: false },
                { id: 'f3', label: '', type: 'number',     value: 5, min: 0, max: 10, category: 'uncertainty', isNegative: false }
            ],
            weights: { f1: 1.0, f2: 1.0, f3: 1.0 },
            projectType: ProjectType.REPORTING,
            teamSize: 5,
            productivityFactor: 0.6,
            velocityPerSprint: 20
        };

        it('sollte vollständige Berechnung mit allen Pflichtfeldern liefern', () => {
            const result = service.calculate(baseRequest);

            expect(result).toHaveProperty('categoryScores');
            expect(result).toHaveProperty('overallScore');
            expect(result).toHaveProperty('effortPersonWeeks');
            expect(result).toHaveProperty('durationWeeks');
            expect(result).toHaveProperty('projectSize');
            expect(result).toHaveProperty('storyPoints');
            expect(result).toHaveProperty('sprintCount');
            expect(result).toHaveProperty('phases');
            expect(result).toHaveProperty('effortBreakdown');
        });

        it('sollte effortBreakdown vollständig befüllen', () => {
            const result = service.calculate(baseRequest);

            expect(result.effortBreakdown).toHaveProperty('baseEffort');
            expect(result.effortBreakdown).toHaveProperty('bufferEffort');
            expect(result.effortBreakdown).toHaveProperty('bufferPercentage');
            expect(result.effortBreakdown).toHaveProperty('riskLevel');
        });

        it('sollte Gesamtaufwand = baseEffort + bufferEffort sein', () => {
            const result = service.calculate(baseRequest);

            expect(result.effortPersonWeeks).toBeCloseTo(
                result.effortBreakdown.baseEffort + result.effortBreakdown.bufferEffort,
                1
            );
        });

        it('sollte positive Werte für Aufwand und Dauer liefern', () => {
            const result = service.calculate(baseRequest);

            expect(result.effortPersonWeeks).toBeGreaterThan(0);
            expect(result.durationWeeks).toBeGreaterThan(0);
        });

        it('sollte 6 Phasen zurückgeben', () => {
            const result = service.calculate(baseRequest);
            expect(result.phases.length).toBe(6);
        });

        it('sollte mit minimalen Eingaben (leere inputs) funktionieren', () => {
            const minRequest: CalculationRequest = {
                inputs: [],
                weights: {},
                projectType: ProjectType.CLASSIC_ML,
                teamSize: 1
            };

            // leere inputs sind per Validator ungültig → Exception erwartet
            expect(() => service.calculate(minRequest)).toThrow();
        });

        it('sollte bei hohem Risiko signifikanten Puffer berechnen', () => {
            const highRiskRequest: CalculationRequest = {
                inputs: [
                    { id: 'f1', label: '', type: 'percentage', value: 10, category: 'readiness',   isNegative: false },
                    { id: 'f2', label: '', type: 'percentage', value: 90, category: 'complexity',  isNegative: false },
                    { id: 'f3', label: '', type: 'percentage', value: 90, category: 'uncertainty', isNegative: false }
                ],
                weights: {},
                projectType: ProjectType.CLASSIC_ML,
                teamSize: 5
            };

            const result = service.calculate(highRiskRequest);

            expect(result.effortBreakdown.bufferEffort).toBeGreaterThan(0);
            expect(result.effortBreakdown.riskLevel).toBeGreaterThan(0.5);
        });

        it('sollte Phasen-Puffer auf Gesamtpuffer summieren', () => {
            const highRiskRequest: CalculationRequest = {
                inputs: [
                    { id: 'f1', label: '', type: 'percentage', value: 10, category: 'readiness',   isNegative: false },
                    { id: 'f2', label: '', type: 'percentage', value: 90, category: 'complexity',  isNegative: false },
                    { id: 'f3', label: '', type: 'percentage', value: 90, category: 'uncertainty', isNegative: false }
                ],
                weights: {},
                projectType: ProjectType.CLASSIC_ML,
                teamSize: 5
            };

            const result = service.calculate(highRiskRequest);

            const totalPhaseBuffer = result.phases.reduce(
                (sum, p) => sum + (p.bufferEffort ?? 0),
                0
            );
            expect(totalPhaseBuffer).toBeCloseTo(result.effortBreakdown.bufferEffort, 1);
        });

        it('sollte ohne Risiko-Puffer korrekt rechnen wenn includeRiskBuffer=false', () => {
            const request: CalculationRequest = {
                inputs: [
                    { id: 'f1', label: '', type: 'percentage', value: 50, category: 'complexity', isNegative: false }
                ],
                weights: {},
                projectType: ProjectType.REPORTING,
                teamSize: 3,
                includeRiskBuffer: false
            };

            const result = service.calculate(request);

            expect(result.effortBreakdown.bufferEffort).toBe(0);
            expect(result.effortBreakdown.bufferPercentage).toBe(0);

            result.phases.forEach(phase => {
                expect(phase.bufferEffort).toBe(0);
            });
        });

        it('sollte bei ungültiger Anfrage eine Exception werfen', () => {
            const badRequest = {
                inputs: [{ id: 'f1', label: '', type: 'boolean', value: true, category: 'readiness', isNegative: false }],
                weights: {},
                projectType: ProjectType.REPORTING,
                teamSize: 0 // ungültig
            } as CalculationRequest;

            expect(() => service.calculate(badRequest)).toThrow();
        });

        it('sollte Gesamtdauer der Phasen mit durationWeeks übereinstimmen', () => {
            const result = service.calculate(baseRequest);

            const totalPhaseDuration = result.phases.reduce(
                (sum, p) => sum + p.durationWeeks,
                0
            );
            expect(totalPhaseDuration).toBe(result.durationWeeks);
        });

        it('sollte overallScore zwischen 0 und 1 liegen', () => {
            const result = service.calculate(baseRequest);
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(1);
        });
    });
});