// src/app/services/mapping/mapping.service.ts

import { InputField, ProjectType } from '../../types.js';
import { mappingService } from '../mapping/mapping.service.js';

interface TemplateData {
    businessUnderstanding: any;
    dataCharacteristics: any;
    analysisConfig: any;
    deploymentConfig?: any;
    utilizationConfig?: any;
}

export class MappingService {

    /**
     * Konvertiert Template-Daten in Calculation-Inputs
     */
    mapToCalculationInputs(templateData: TemplateData): InputField[] {
        const inputs: InputField[] = [];

        const { businessUnderstanding, dataCharacteristics, analysisConfig } = templateData;

        // === READINESS FACTORS ===

        // Data Access/Availability
        if (dataCharacteristics?.dataAvailability !== undefined) {
            inputs.push({
                id: 'data_availability',
                label: 'Datenverfügbarkeit',
                type: 'percentage',
                value: dataCharacteristics.dataAvailability ? 90 : 50,
                category: 'readiness'
            });
        }

        // Data Access (aus dataAccess Array)
        if (dataCharacteristics?.dataAccess) {
            const hasAccess = Array.isArray(dataCharacteristics.dataAccess)
                && dataCharacteristics.dataAccess.length > 0;
            inputs.push({
                id: 'data_access',
                label: 'Datenzugriff vorhanden',
                type: 'boolean',
                value: hasAccess,
                category: 'readiness'
            });
        }

        // Stakeholder Support (aus Team-Daten ableiten)
        if (businessUnderstanding?.teamSize) {
            const support = businessUnderstanding.teamSize >= 3 ? 'hoch' :
                businessUnderstanding.teamSize >= 2 ? 'mittel' : 'niedrig';
            inputs.push({
                id: 'stakeholder_support',
                label: 'Stakeholder-Unterstützung',
                type: 'select',
                value: support,
                category: 'readiness',
                options: ['niedrig', 'mittel', 'hoch']
            });
        }

        // Tools Available (aus toolsData ableiten)
        if (dataCharacteristics?.toolsData || businessUnderstanding?.toolsBusinessUnderstanding) {
            inputs.push({
                id: 'tools_available',
                label: 'Tools & Infrastruktur',
                type: 'boolean',
                value: true,
                category: 'readiness'
            });
        }

        // === COMPLEXITY FACTORS ===

        // Data Variety (Anzahl Datenquellen)
        if (dataCharacteristics?.dataSources) {
            const variety = Array.isArray(dataCharacteristics.dataSources)
                ? Math.min(10, dataCharacteristics.dataSources.length)
                : 3;
            inputs.push({
                id: 'data_variety',
                label: 'Datenvielfalt (1-10)',
                type: 'number',
                value: variety,
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 10
            });
        }

        // Number of Sources
        if (dataCharacteristics?.dataSources) {
            const numSources = Array.isArray(dataCharacteristics.dataSources)
                ? dataCharacteristics.dataSources.length
                : 1;
            inputs.push({
                id: 'num_sources',
                label: 'Anzahl Datenquellen',
                type: 'number',
                value: numSources,
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 20
            });
        }

        // Data Velocity
        if (dataCharacteristics?.velocity) {
            const velocityMap: Record<string, string> = {
                'BATCH': 'batch',
                'NEAR_REALTIME': 'near-realtime',
                'STREAMING': 'streaming'
            };
            inputs.push({
                id: 'data_velocity',
                label: 'Datengeschwindigkeit',
                type: 'select',
                value: velocityMap[dataCharacteristics.velocity] || 'batch',
                category: 'complexity',
                options: ['batch', 'near-realtime', 'streaming']
            });
        }

        // Analytics Type
        if (analysisConfig?.analyticsType) {
            const typeMap: Record<string, string> = {
                'DESCRIPTIVE': 'descriptive',
                'DIAGNOSTIC': 'diagnostic',
                'PREDICTIVE': 'predictive',
                'PRESCRIPTIVE': 'prescriptive'
            };
            inputs.push({
                id: 'analytics_type',
                label: 'Art der Analytik',
                type: 'select',
                value: typeMap[analysisConfig.analyticsType] || 'descriptive',
                category: 'complexity',
                options: ['descriptive', 'diagnostic', 'predictive', 'prescriptive']
            });
        }

        // === UNCERTAINTY FACTORS ===

        // Data Quality (aus Veracity)
        if (dataCharacteristics?.veracity) {
            const qualityMap: Record<string, number> = {
                'LOW': 40,
                'MEDIUM': 70,
                'HIGH': 90
            };
            inputs.push({
                id: 'data_quality',
                label: 'Datenqualität (%)',
                type: 'percentage',
                value: qualityMap[dataCharacteristics.veracity] || 70,
                category: 'uncertainty'
            });
        }

        // Privacy Concerns (aus Security Constraints)
        if (dataCharacteristics?.dataSecurityConstraints) {
            const hasConcerns = dataCharacteristics.dataSecurityConstraints?.length > 0;
            const level = hasConcerns ? 'hoch' : 'mittel';
            inputs.push({
                id: 'privacy_concerns',
                label: 'Datenschutz-Bedenken',
                type: 'select',
                value: level,
                category: 'uncertainty',
                isNegative: true,
                options: ['niedrig', 'mittel', 'hoch', 'kritisch']
            });
        }

        // Missing Data (aus Variability ableiten)
        if (dataCharacteristics?.variability) {
            const missingMap: Record<string, number> = {
                'NEVER': 5,
                'SOMETIMES': 15,
                'OFTEN': 30,
                'ALWAYS': 50
            };
            inputs.push({
                id: 'missing_data',
                label: 'Fehlende Daten (%)',
                type: 'percentage',
                value: missingMap[dataCharacteristics.variability] || 15,
                category: 'uncertainty',
                isNegative: true
            });
        }

        // Goal Clarity (aus Business Goal ableiten)
        if (businessUnderstanding?.businessGoal) {
            const hasGoal = businessUnderstanding.businessGoal?.length > 10;
            inputs.push({
                id: 'goal_clarity',
                label: 'Zielsetzung klar',
                type: 'boolean',
                value: hasGoal,
                category: 'uncertainty'
            });
        }

        return inputs;
    }

    /**
     * Bestimmt den Projekttyp basierend auf Template-Daten
     */
    determineProjectType(templateData: TemplateData): ProjectType {
        const { analysisConfig } = templateData;

        // Basierend auf Analytics Type
        if (analysisConfig?.analyticsType) {
            const type = analysisConfig.analyticsType;

            // Deep Learning: Prescriptive oder sehr komplexe Predictive
            if (type === 'PRESCRIPTIVE') {
                return ProjectType.DEEP_LEARNING;
            }

            // Classic ML: Predictive oder Diagnostic
            if (type === 'PREDICTIVE' || type === 'DIAGNOSTIC') {
                return ProjectType.CLASSIC_ML;
            }

            // Reporting: Descriptive
            if (type === 'DESCRIPTIVE') {
                return ProjectType.REPORTING;
            }
        }

        // Fallback: Classic ML
        return ProjectType.CLASSIC_ML;
    }

    /**
     *  Berechnet Tasks basierend auf Person-Wochen (PW)
     * Rechnet intern in Stunden (1 PW = 40h) und gibt Tage (8h = 1 Tag) zurück.
     *
     * @param phaseType Der Typ der Phase
     * @param phaseEffortPW Der Aufwand der Phase in Person-Wochen (z.B. 3.4)
     */

    /**
     * Berechnet Tasks basierend auf Person-Wochen (PW)
     * Fix: Berechnet Tage direkt und verteilt den Rest auf den letzten Task,
     * damit Summe(Tasks) == PhaseDuration ist.
     */
    /**
     * Berechnet Tasks basierend auf Person-Wochen (PW) mit Gewichtung.
     * Fix: Verteilt die exakten Tage proportional und gleicht Rundungsfehler
     * beim letzten Task aus.
     */
    generatePhaseSteps(phaseType: string, phaseEffortPW: number): any[] {
        const taskTypes = this.getTasksForPhase(phaseType);
        if (taskTypes.length === 0) return [];

        // 1. Gesamtdauer in Tagen (1 PW = 40h, 8h = 1 Tag)
        const totalHours = Math.max(0.1, phaseEffortPW) * 40;
        const totalDays = totalHours / 8;

        // 2. Gesamtgewichtung der Phase berechnen
        const weights = taskTypes.map(t => this.getTaskWeight(t));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        let distributedDays = 0;

        return taskTypes.map((taskType, index) => {
            let durationInDays: number;

            // Gewichtung für diesen Task
            const weight = weights[index];

            if (index === taskTypes.length - 1) {
                // 3. Letzter Task nimmt den verbleibenden Rest (Fix für die Summen-Differenz)
                durationInDays = totalDays - distributedDays;
            } else {
                // Proportionale Verteilung: (TaskWeight / TotalWeight) * TotalDays
                const rawDuration = (weight / totalWeight) * totalDays;
                // Wir runden auf 2 Nachkommastellen für saubere Werte im Frontend
                durationInDays = Number(rawDuration.toFixed(2));
            }

            // Negative Werte verhindern (falls Rundung größer als Rest war)
            if (durationInDays < 0) durationInDays = 0;

            // Rundungs-Ungesicherheiten beim letzten Task glätten (z.B. 4.00000001 -> 4.0)
            durationInDays = Number(durationInDays.toFixed(2));

            distributedDays += durationInDays;

            return {
                taskType,
                title: null, // Title wird im Frontend aus Constants geladen
                estimatedDuration: durationInDays,
                status: 'TODO',
            };
        });
    }

    /**
     * Gibt die Gewichtung (relative Dauer) für einen Task-Typ zurück.
     * Werte basieren auf dem Screenshot-Beispiel (z.B. Develop Model ist aufwendig).
     */
    private getTaskWeight(taskType: string): number {
        const weights: Record<string, number> = {
            // Business Understanding
            'ASSESS_SITUATION': 2,
            'COMPOSE_PROJECT_TEAM': 1,
            'SET_BUSINESS_OBJECTIVES': 2,
            'DERIVE_DATA_SCIENCE_TARGETS': 2,
            'CREATE_PROJECT_PLAN': 3,

            // Data Understanding & Prep
            'IDENTIFY_DATA_SOURCES': 2,
            'ACQUIRE_DATA': 4,
            'DESCRIBE_DATA': 3,
            'EXPLORE_DATA': 5,
            'ASSESS_DATA_QUALITY': 3,
            'PREPARE_DATA': 6,
            'DEVELOP_DATA_PIPELINE': 8,

            // Modeling (Werte aus Ihrem Beispiel angepasst)
            'DEFINE_HYPOTHESIS': 2,
            'SELECT_ANALYTICAL_MODEL': 3,
            'DESIGN_TEST_FOR_ANALYTICAL_MODEL': 2,
            'DEVELOP_ANALYTICAL_MODEL': 11, // Hoher Aufwand
            'ASSESS_ANALYTICAL_MODEL': 5,
            'DEVELOP_ANALYTICAL_PIPELINE': 9, // Hoher Aufwand

            // Evaluation
            'ASSESS_ANALYTICAL_RESULTS': 3,
            'EVALUATE_PROCESS': 2,
            'PERFORM_CHECKPOINT_DECISION': 1,

            // Deployment
            'PERFORM_IMPACT_ASSESSMENT': 2,
            'PLAN_DEPLOYMENT': 4,
            'PLAN_MONITORING_AND_MAINTENANCE': 3,
            'TEST_DEPLOYMENT': 4,
            'PERFORM_BUSINESS_INTEGRATION': 5,
            'FINALIZE_PROJECT': 2
        };

        return weights[taskType] || 3; // Fallback-Gewicht
    }


    private getTasksForPhase(phaseType: string): string[] {
        const tasksByPhaseType: Record<string, string[]> = {
            'BUSINESS_UNDERSTANDING': [
                'ASSESS_SITUATION', 'COMPOSE_PROJECT_TEAM', 'SET_BUSINESS_OBJECTIVES', 'DERIVE_DATA_SCIENCE_TARGETS', 'CREATE_PROJECT_PLAN'
            ],
            'DATA_COLLECTION_EXPLORATION_PREPARATION': [
                'IDENTIFY_DATA_SOURCES', 'ACQUIRE_DATA', 'DESCRIBE_DATA', 'EXPLORE_DATA', 'ASSESS_DATA_QUALITY', 'PREPARE_DATA', 'DEVELOP_DATA_PIPELINE'
            ],
            'ANALYSIS_MODELING': [
                'DEFINE_HYPOTHESIS', 'SELECT_ANALYTICAL_MODEL', 'DESIGN_TEST_FOR_ANALYTICAL_MODEL', 'DEVELOP_ANALYTICAL_MODEL', 'ASSESS_ANALYTICAL_MODEL', 'DEVELOP_ANALYTICAL_PIPELINE'
            ],
            'EVALUATION': [
                'ASSESS_ANALYTICAL_RESULTS', 'EVALUATE_PROCESS', 'PERFORM_CHECKPOINT_DECISION'
            ],
            'DEPLOYMENT': [
                'PERFORM_IMPACT_ASSESSMENT', 'PLAN_DEPLOYMENT', 'PLAN_MONITORING_AND_MAINTENANCE', 'TEST_DEPLOYMENT', 'PERFORM_BUSINESS_INTEGRATION', 'FINALIZE_PROJECT'
            ],
            'UTILIZATION': [
                'MONITOR_MODEL_PERFORMANCE', 'MAINTAIN_DATA_PIPELINE', 'UPDATE_MODEL'
            ]
        };
        return tasksByPhaseType[phaseType] || [];
    }



}

export const mappingService = new MappingService();