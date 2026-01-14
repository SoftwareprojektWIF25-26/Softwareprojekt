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

// mapping.service.ts - AM ENDE DER KLASSE hinzufügen (vor dem letzten "}")

    // backend/src/services/mapping/mapping.service.ts

    generatePhaseSteps(phaseType: string, phaseDurationDays: number): any[] {
        const tasksByPhaseType: Record<string, string[]> = {
            'BUSINESS_UNDERSTANDING': [
                'ASSESS_SITUATION',
                'COMPOSE_PROJECT_TEAM',
                'SET_BUSINESS_OBJECTIVES',
                'DERIVE_DATA_SCIENCE_TARGETS',
                'CREATE_PROJECT_PLAN'
            ],
            'DATA_COLLECTION_EXPLORATION_PREPARATION': [  // ← Achtung: Im Schema heißt es 'DATA_COLLECTION_EXPLORATION_PREPARATION'!
                'IDENTIFY_DATA_SOURCES',
                'ACQUIRE_DATA',
                'DESCRIBE_DATA',
                'EXPLORE_DATA',
                'ASSESS_DATA_QUALITY',
                'PREPARE_DATA',
                'DEVELOP_DATA_PIPELINE'
            ],
            'ANALYSIS_MODELING': [  // ← Im Schema: 'ANALYSIS_MODELING'!
                'DEFINE_HYPOTHESIS',
                'SELECT_ANALYTICAL_MODEL',
                'DESIGN_TEST_FOR_ANALYTICAL_MODEL',
                'DEVELOP_ANALYTICAL_MODEL',
                'ASSESS_ANALYTICAL_MODEL',
                'DEVELOP_ANALYTICAL_PIPELINE'
            ],
            'EVALUATION': [
                'ASSESS_ANALYTICAL_RESULTS',
                'EVALUATE_PROCESS',
                'PERFORM_CHECKPOINT_DECISION'
            ],
            'DEPLOYMENT': [
                'PERFORM_IMPACT_ASSESSMENT',
                'PLAN_DEPLOYMENT',
                'PLAN_MONITORING_AND_MAINTENANCE',
                'TEST_DEPLOYMENT',
                'PERFORM_BUSINESS_INTEGRATION',
                'FINALIZE_PROJECT'
            ],
            'UTILIZATION': [
                'MONITOR_MODEL_PERFORMANCE',
                'MAINTAIN_DATA_PIPELINE',
                'UPDATE_MODEL'
            ]
        };

        const taskTypes = tasksByPhaseType[phaseType] || [];
        if (taskTypes.length === 0) return [];

        // 1. Basis-Gewichte holen (relative Komplexität der Tasks zueinander)
        const taskWeights = taskTypes.map(t => ({
            type: t,
            weight: this.getTaskWeight(t)
        }));

        // 2. Gesamtgewicht berechnen
        const totalWeight = taskWeights.reduce((sum, t) => sum + t.weight, 0);

        // 3. Dauer proportional verteilen
        let distributedDays = 0;

        return taskWeights.map((task, index) => {
            // Proportionale Dauer berechnen
            let duration = Math.round((task.weight / totalWeight) * phaseDurationDays);

            // Mindestens 1 Tag pro Task
            duration = Math.max(1, duration);

            // Letzter Task bekommt den Rest (Rundungsdifferenz ausgleichen)
            if (index === taskWeights.length - 1) {
                duration = Math.max(1, phaseDurationDays - distributedDays);
            }

            distributedDays += duration;

            return {
                taskType: task.type,
                title: null,
                estimatedDuration: duration, // ✅ Dynamisch berechnet!
                status: 'TODO'
            };
        });
    }


    /**
     * Gibt das relative Gewicht (Komplexität) eines Tasks zurück.
     * Dient als Basis für die prozentuale Verteilung.
     */
    private getTaskWeight(taskType: string): number {
        const weights: Record<string, number> = {
            // Business Understanding
            'ASSESS_SITUATION': 2,
            'COMPOSE_PROJECT_TEAM': 1,
            'SET_BUSINESS_OBJECTIVES': 3,
            'DERIVE_DATA_SCIENCE_TARGETS': 2,
            'CREATE_PROJECT_PLAN': 2,

            // Data Collection
            'IDENTIFY_DATA_SOURCES': 2,
            'ACQUIRE_DATA': 5,
            'DESCRIBE_DATA': 2,
            'EXPLORE_DATA': 5,
            'ASSESS_DATA_QUALITY': 3,
            'PREPARE_DATA': 8,
            'DEVELOP_DATA_PIPELINE': 5,

            // Modeling
            'DEFINE_HYPOTHESIS': 2,
            'SELECT_ANALYTICAL_MODEL': 3,
            'DESIGN_TEST_FOR_ANALYTICAL_MODEL': 2,
            'DEVELOP_ANALYTICAL_MODEL': 10,
            'ASSESS_ANALYTICAL_MODEL': 5,
            'DEVELOP_ANALYTICAL_PIPELINE': 8,

            // Evaluation
            'ASSESS_ANALYTICAL_RESULTS': 3,
            'EVALUATE_PROCESS': 2,
            'PERFORM_CHECKPOINT_DECISION': 1,

            // Deployment
            'PERFORM_IMPACT_ASSESSMENT': 2,
            'PLAN_DEPLOYMENT': 3,
            'PLAN_MONITORING_AND_MAINTENANCE': 2,
            'TEST_DEPLOYMENT': 5,
            'PERFORM_BUSINESS_INTEGRATION': 3,
            'FINALIZE_PROJECT': 2,

            // Utilization
            'MONITOR_MODEL_PERFORMANCE': 2,
            'MAINTAIN_DATA_PIPELINE': 2,
            'UPDATE_MODEL': 5
        };

        return weights[taskType] || 2; // Default Gewicht
    }



}

export const mappingService = new MappingService();