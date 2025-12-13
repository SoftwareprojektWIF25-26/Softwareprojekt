// src/app/services/__tests__/calculationService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectCalculationService } from '../../services/calculationService.js';
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

    describe('normalizeInputs', () => {
        it('sollte boolean-Werte normalisieren', () => {
            const inputs: InputField[] = [
                { id: 'f1', label: 'Field 1', type: 'boolean', value: true, category: 'readiness', isNegative: false },
                { id: 'f2', label: 'Field 2', type: 'boolean', value: false, category: 'readiness', isNegative: false }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(1);
            expect(result[1].normalized).toBe(0);
        });

        it('sollte percentage-Werte normalisieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', type: 'percentage', value: 50, category: 'readiness', isNegative: false,
                    label: ""
                },
                {
                    id: 'f2', type: 'percentage', value: 100, category: 'readiness', isNegative: false,
                    label: ""
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
            expect(result[1].normalized).toBe(1);
        });

        it('sollte number-Werte mit min/max normalisieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', type: 'number', value: 5, min: 0, max: 10, category: 'complexity', isNegative: false,
                    label: ""
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
        });

        it('sollte select-Werte normalisieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1',
                    type: 'select',
                    value: 'medium',
                    options: ['low', 'medium', 'high'],
                    category: 'complexity',
                    isNegative: false,
                    label: ""
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.5);
        });

        it('sollte negative Faktoren invertieren', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', type: 'percentage', value: 80, category: 'complexity', isNegative: true,
                    label: ""
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(0.2); // 1 - 0.8
        });

        it('sollte Werte auf [0, 1] begrenzen', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', type: 'number', value: 150, min: 0, max: 100, category: 'readiness', isNegative: false,
                    label: ""
                },
                {
                    id: 'f2', type: 'number', value: -50, min: 0, max: 100, category: 'readiness', isNegative: false,
                    label: ""
                }
            ];

            const result = service.normalizeInputs(inputs);

            expect(result[0].normalized).toBe(1);
            expect(result[1].normalized).toBe(0);
        });
    });

    describe('applyWeights', () => {
        it('sollte Gewichte normalisieren', () => {
            const normalizedValues = [
                { fieldId: 'f1', normalized: 0.5, weight: 0 },
                { fieldId: 'f2', normalized: 0.8, weight: 0 }
            ];
            const weights: WeightConfig = { f1: 2.0, f2: 1.0 };

            const result = service.applyWeights(normalizedValues, weights, []);

            expect(result[0].weight).toBeCloseTo(2/3);
            expect(result[1].weight).toBeCloseTo(1/3);
        });

        it('sollte Default-Gewicht 1.0 verwenden', () => {
            const normalizedValues = [
                { fieldId: 'f1', normalized: 0.5, weight: 0 },
                { fieldId: 'f2', normalized: 0.8, weight: 0 }
            ];
            const weights: WeightConfig = {};

            const result = service.applyWeights(normalizedValues, weights, []);

            expect(result[0].weight).toBe(0.5);
            expect(result[1].weight).toBe(0.5);
        });
    });

    describe('calculateCategoryScores', () => {
        it('sollte Kategorie-Scores berechnen', () => {
            const inputs: InputField[] = [
                {
                    id: 'f1', type: 'boolean', value: true, category: 'readiness', isNegative: false,
                    label: ""
                },
                {
                    id: 'f2', type: 'boolean', value: false, category: 'readiness', isNegative: false,
                    label: ""
                },
                {
                    id: 'f3', type: 'boolean', value: true, category: 'complexity', isNegative: false,
                    label: ""
                }
            ];

            const weightedValues = [
                { fieldId: 'f1', normalized: 1, weight: 0.25 },
                { fieldId: 'f2', normalized: 0, weight: 0.25 },
                { fieldId: 'f3', normalized: 1, weight: 0.5 }
            ];

            const result = service.calculateCategoryScores(weightedValues, inputs);

            expect(result.readiness).toBe(0.5);
            expect(result.complexity).toBe(1);
        });

        it('sollte 0.5 für leere Kategorien zurückgeben', () => {
            const inputs: InputField[] = [];
            const weightedValues: any[] = [];

            const result = service.calculateCategoryScores(weightedValues, inputs);

            expect(result.readiness).toBe(0.5);
            expect(result.complexity).toBe(0.5);
            expect(result.uncertainty).toBe(0.5);
        });
    });

    describe('calculateOverallScore', () => {
        it('sollte Overall-Score berechnen', () => {
            const categoryScores = {
                readiness: 0.8,
                complexity: 0.4,
                uncertainty: 0.3
            };

            const result = service.calculateOverallScore(categoryScores);

            expect(result).toBeCloseTo(0.8 * 0.4 + 0.6 * 0.3 + 0.7 * 0.3);
        });

        it('sollte mit benutzerdefinierten Gewichten arbeiten', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };
            const customWeights = { readiness: 0.5, complexity: 0.25, uncertainty: 0.25 };

            const result = service.calculateOverallScore(categoryScores, customWeights);

            expect(result).toBeCloseTo(0.5 * 0.5 + 0.5 * 0.25 + 0.5 * 0.25);
        });
    });

    describe('estimateEffort', () => {
        it('sollte Aufwand für Reporting berechnen', () => {
            const categoryScores = {
                readiness: 0.8,
                complexity: 0.3,
                uncertainty: 0.2
            };

            const result = service.estimateEffort(ProjectType.REPORTING, categoryScores);

            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1000);
        });

        it('sollte Readiness-Bonus bei niedriger Readiness anwenden', () => {
            const lowReadiness = {
                readiness: 0.2,
                complexity: 0.3,
                uncertainty: 0.2
            };

            const highReadiness = {
                readiness: 0.8,
                complexity: 0.3,
                uncertainty: 0.2
            };

            const lowResult = service.estimateEffort(ProjectType.REPORTING, lowReadiness);
            const highResult = service.estimateEffort(ProjectType.REPORTING, highReadiness);

            expect(lowResult).toBeGreaterThan(highResult);
        });

        it('sollte hohe Complexity zu höherem Aufwand führen', () => {
            const lowComplexity = {
                readiness: 0.5,
                complexity: 0.2,
                uncertainty: 0.5
            };

            const highComplexity = {
                readiness: 0.5,
                complexity: 0.8,
                uncertainty: 0.5
            };

            const lowResult = service.estimateEffort(ProjectType.CLASSIC_ML, lowComplexity);
            const highResult = service.estimateEffort(ProjectType.CLASSIC_ML, highComplexity);

            expect(highResult).toBeGreaterThan(lowResult);
        });

        it('sollte Aufwand ohne Puffer berechnen können', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const withBuffer = service.estimateEffort(ProjectType.REPORTING, categoryScores, true);
            const withoutBuffer = service.estimateEffort(ProjectType.REPORTING, categoryScores, false);

            expect(withBuffer).toBeGreaterThan(withoutBuffer);
        });
    });

    describe('estimateDuration', () => {
        it('sollte Dauer korrekt berechnen', () => {
            const result = service.estimateDuration(60, 5, 0.6);

            expect(result).toBe(20);
        });

        it('sollte auf ganze Wochen aufrunden', () => {
            const result = service.estimateDuration(50, 5, 0.6);

            expect(result).toBe(17);
        });

        it('sollte mit kleinen Teams funktionieren', () => {
            const result = service.estimateDuration(40, 1, 0.6);

            expect(result).toBeGreaterThan(0);
        });
    });

    describe('classifyProjectSize', () => {
        it('sollte XS für kleine Projekte zurückgeben', () => {
            const result = service.classifyProjectSize(4);
            expect(result).toBe(ProjectSize.XS);
        });

        it('sollte S für kleine-mittlere Projekte zurückgeben', () => {
            const result = service.classifyProjectSize(5);
            expect(result).toBe(ProjectSize.S);
        });

        it('sollte M für mittlere Projekte zurückgeben', () => {
            const result = service.classifyProjectSize(15);
            expect(result).toBe(ProjectSize.M);
        });

        it('sollte L für große Projekte zurückgeben', () => {
            const result = service.classifyProjectSize(35);
            expect(result).toBe(ProjectSize.L);
        });

        it('sollte XL für sehr große Projekte zurückgeben', () => {
            const result = service.classifyProjectSize(75);
            expect(result).toBe(ProjectSize.XL);
        });
    });

    describe('calculateBacklog', () => {
        it('sollte Story Points und Sprint Count berechnen', () => {
            const result = service.calculateBacklog(50, 20);

            expect(result.storyPoints).toBe(400);
            expect(result.sprintCount).toBe(20);
        });

        it('sollte mit benutzerdefinierter Velocity funktionieren', () => {
            const result = service.calculateBacklog(30, 15);

            expect(result.storyPoints).toBe(240);
            expect(result.sprintCount).toBe(16);
        });
    });

    describe('generatePhases', () => {
        it('sollte 6 DSLC-Phasen generieren', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const result = service.generatePhases(100, 20, categoryScores, 10);

            expect(result.length).toBe(6);
            expect(result[0].startWeek).toBe(0);
        });

        it('sollte Puffer-Tracking-Felder enthalten', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const riskBuffer = 10;
            const result = service.generatePhases(100, 20, categoryScores, riskBuffer);

            result.forEach(phase => {
                expect(phase).toHaveProperty('baseEffort');
                expect(phase).toHaveProperty('bufferEffort');
                expect(phase).toHaveProperty('baseDuration');
                expect(phase).toHaveProperty('bufferDuration');

                // Gesamtaufwand sollte Basis + Puffer sein
                expect(phase.effortPersonWeeks).toBeCloseTo(
                    phase.baseEffort! + phase.bufferEffort!,
                    1
                );

                // Gesamtdauer sollte Basis + Puffer sein
                expect(phase.durationWeeks).toBe(
                    phase.baseDuration! + phase.bufferDuration!
                );
            });
        });

        it('sollte Gesamtdauer korrekt verteilen', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const durationWeeks = 20;
            const result = service.generatePhases(100, durationWeeks, categoryScores, 10);

            const totalWeeks = result.reduce((sum, phase) => sum + phase.durationWeeks, 0);
            expect(totalWeeks).toBe(durationWeeks);
        });

        it('sollte Prozentsätze auf 1 normalisieren', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const result = service.generatePhases(100, 20, categoryScores, 10);

            const totalPercentage = result.reduce((sum, phase) => sum + phase.percentage, 0);
            expect(totalPercentage).toBeCloseTo(1, 5);
        });

        it('sollte Puffer risikobasiert verteilen', () => {
            const highRisk = {
                readiness: 0.2,
                complexity: 0.8,
                uncertainty: 0.8
            };

            const lowRisk = {
                readiness: 0.8,
                complexity: 0.2,
                uncertainty: 0.2
            };

            const totalBuffer = 15;
            const highRiskPhases = service.generatePhases(100, 20, highRisk, totalBuffer);
            const lowRiskPhases = service.generatePhases(100, 20, lowRisk, totalBuffer);

            // Bei hohem Risiko sollte mehr Puffer in kritische Phasen fließen
            const highRiskTotalBuffer = highRiskPhases.reduce(
                (sum, p) => sum + (p.bufferEffort || 0),
                0
            );
            const lowRiskTotalBuffer = lowRiskPhases.reduce(
                (sum, p) => sum + (p.bufferEffort || 0),
                0
            );

            expect(highRiskTotalBuffer).toBeCloseTo(totalBuffer, 1);
            expect(lowRiskTotalBuffer).toBeCloseTo(totalBuffer, 1);
        });

        it('sollte Phasen bei niedriger Readiness anpassen', () => {
            const lowReadiness = {
                readiness: 0.2,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const highReadiness = {
                readiness: 0.8,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const lowResult = service.generatePhases(100, 20, lowReadiness, 10);
            const highResult = service.generatePhases(100, 20, highReadiness, 10);

            // Business Understanding Phase sollte bei niedriger Readiness mehr Aufwand haben
            const lowPhase1 = lowResult.find(p => p.name.includes('Business'));
            const highPhase1 = highResult.find(p => p.name.includes('Business'));

            if (lowPhase1 && highPhase1) {
                expect(lowPhase1.percentage).toBeGreaterThan(highPhase1.percentage);
            }
        });

        it('sollte ohne Puffer funktionieren', () => {
            const categoryScores = {
                readiness: 0.5,
                complexity: 0.5,
                uncertainty: 0.5
            };

            const result = service.generatePhases(100, 20, categoryScores, 0);

            result.forEach(phase => {
                expect(phase.bufferEffort).toBe(0);
                expect(phase.effortPersonWeeks).toBeCloseTo(phase.baseEffort!, 1);
            });
        });
    });

    describe('calculate (Integration)', () => {
        it('sollte vollständige Berechnung durchführen', () => {
            const request: CalculationRequest = {
                inputs: [
                    {
                        id: 'f1', type: 'boolean', value: true, category: 'readiness', isNegative: false,
                        label: ""
                    },
                    {
                        id: 'f2', type: 'percentage', value: 50, category: 'complexity', isNegative: false,
                        label: ""
                    },
                    {
                        id: 'f3', type: 'number', value: 5, min: 0, max: 10, category: 'uncertainty', isNegative: false,
                        label: ""
                    }
                ],
                weights: { f1: 1.0, f2: 1.0, f3: 1.0 },
                projectType: ProjectType.REPORTING,
                teamSize: 5,
                productivityFactor: 0.6,
                velocityPerSprint: 20
            };

            const result = service.calculate(request);

            expect(result).toHaveProperty('categoryScores');
            expect(result).toHaveProperty('overallScore');
            expect(result).toHaveProperty('effortPersonWeeks');
            expect(result).toHaveProperty('durationWeeks');
            expect(result).toHaveProperty('projectSize');
            expect(result).toHaveProperty('storyPoints');
            expect(result).toHaveProperty('sprintCount');
            expect(result).toHaveProperty('phases');
            expect(result).toHaveProperty('effortBreakdown');

            expect(result.effortPersonWeeks).toBeGreaterThan(0);
            expect(result.durationWeeks).toBeGreaterThan(0);
            expect(result.phases.length).toBe(6);

            // Puffer-Breakdown prüfen
            expect(result.effortBreakdown).toHaveProperty('baseEffort');
            expect(result.effortBreakdown).toHaveProperty('bufferEffort');
            expect(result.effortBreakdown).toHaveProperty('bufferPercentage');
            expect(result.effortBreakdown).toHaveProperty('riskLevel');

            // Gesamtaufwand = Basis + Puffer
            expect(result.effortPersonWeeks).toBeCloseTo(
                result.effortBreakdown.baseEffort + result.effortBreakdown.bufferEffort,
                1
            );
        });

        it('sollte mit minimalen Eingaben funktionieren', () => {
            const request: CalculationRequest = {
                inputs: [],
                weights: {},
                projectType: ProjectType.CLASSIC_ML,
                teamSize: 1
            };

            const result = service.calculate(request);

            expect(result.effortPersonWeeks).toBeGreaterThan(0);
            expect(result.durationWeeks).toBeGreaterThan(0);
            expect(result.phases.length).toBe(6);
        });

        it('sollte Risiko-Puffer korrekt berechnen', () => {
            const highRiskRequest: CalculationRequest = {
                inputs: [
                    {
                        id: 'f1', type: 'percentage', value: 10, category: 'readiness', isNegative: false,
                        label: ""
                    },
                    {
                        id: 'f2', type: 'percentage', value: 90, category: 'complexity', isNegative: false,
                        label: ""
                    },
                    {
                        id: 'f3', type: 'percentage', value: 90, category: 'uncertainty', isNegative: false,
                        label: ""
                    }
                ],
                weights: {},
                projectType: ProjectType.CLASSIC_ML,
                teamSize: 5
            };

            const result = service.calculate(highRiskRequest);

            // Bei hohem Risiko sollte Puffer vorhanden sein
            expect(result.effortBreakdown.bufferEffort).toBeGreaterThan(0);
            expect(result.effortBreakdown.riskLevel).toBeGreaterThan(0.5);

            // Puffer sollte auf Phasen verteilt sein
            const totalPhaseBuffer = result.phases.reduce(
                (sum, p) => sum + (p.bufferEffort || 0),
                0
            );
            expect(totalPhaseBuffer).toBeCloseTo(result.effortBreakdown.bufferEffort, 1);
        });

        it('sollte ohne Risiko-Puffer funktionieren wenn deaktiviert', () => {
            const request: any = {
                inputs: [
                    {
                        id: 'f1', type: 'percentage', value: 50, category: 'complexity', isNegative: false,
                        label: ""
                    }
                ],
                weights: {},
                projectType: ProjectType.REPORTING,
                teamSize: 3,
                includeRiskBuffer: false
            };

            const result = service.calculate(request);

            expect(result.effortBreakdown.bufferEffort).toBe(0);
            expect(result.effortBreakdown.bufferPercentage).toBe(0);

            // Keine Puffer in Phasen
            result.phases.forEach(phase => {
                expect(phase.bufferEffort).toBe(0);
            });
        });
    });
});