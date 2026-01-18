// src/app/services/mapping/mapping.service.ts

import { InputField, ProjectType } from '../../types.js';

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
}

export const mappingService = new MappingService();