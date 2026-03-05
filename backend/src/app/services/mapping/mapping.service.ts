// src/app/services/mapping/mapping.service.ts

import { InputField, ProjectType } from '../../types.js';

interface TemplateData {
    businessUnderstanding: any;
    dataCharacteristics: any;
    analysisConfig: any;
    deploymentConfig?: any;
    utilizationConfig?: any;
}

// ============================================================================
// KONSTANTEN & MAPPINGS
// ============================================================================

const VARIETY_MAP: Record<string, number> = {
    'LOW': 3,
    'MEDIUM': 6,
    'HIGH': 10
};

const GB_CONVERSION_FACTORS: Record<string, number> = {
    'RECORDS': 1 / (1024 * 1024), // Annahme: 1 Record ≈ 1 KB
    'KB': 1 / (1024 * 1024),
    'MB': 1 / 1024,
    'GB': 1,
    'TB': 1024,
    'PB': 1024 * 1024
};

const PRODUCT_COMPLEXITY_MAP: Record<string, number> = {
    'REPORT': 2,
    'INSIGHT_DOCUMENT': 2,
    'APPLICATION_SOFTWARE': 7,
    'AUTOMATED_DECISION_SYSTEM': 9,
    'OTHER': 5
};

const VELOCITY_MAP: Record<string, string> = {
    'BATCH': 'batch',
    'DAILY': 'near-realtime',
    'HOURLY': 'near-realtime',
    'CONTINUOUS': 'streaming'
};

const ANALYTICS_TYPE_MAP: Record<string, string> = {
    'CLASSIFICATION': 'predictive',
    'REGRESSION': 'predictive',
    'CLUSTERING': 'diagnostic',
    'ANOMALY_DETECTION': 'diagnostic',
    'TIME_SERIES_FORECASTING': 'predictive',
    'RECOMMENDATION': 'prescriptive',
    'ASSOCIATION_RULE_LEARNING': 'diagnostic',
    'OTHER': 'descriptive'
};

const DATA_QUALITY_MAP: Record<string, number> = {
    'POOR': 40,
    'MEDIUM': 70,
    'GOOD': 85,
    'EXCELLENT': 95
};

const MISSING_DATA_MAP: Record<string, number> = {
    'NEVER': 5,
    'YEARLY': 10,
    'MONTHLY': 15,
    'WEEKLY': 25,
    'DAILY': 35,
    'HOURLY': 50
};

export class MappingService {

    /**
     * Konvertiert rohe Template-Daten aus dem System in normalisierte
     * Eingabefelder für den Berechnungsalgorithmus der Projektschätzung.
     */
    public mapToCalculationInputs(templateData: TemplateData): InputField[] {
        const inputs: InputField[] = [];

        this.mapReadinessFactors(templateData, inputs);
        this.mapComplexityFactors(templateData, inputs);
        this.mapUncertaintyFactors(templateData, inputs);

        return inputs;
    }

    /**
     * Analysiert den fachlichen Ansatz des Projekts, um das grundlegende
     * Schätzmodell (z.B. Deep Learning vs. Classic ML) zu ermitteln.
     */
    public determineProjectType(templateData: TemplateData): ProjectType {
        const type = templateData.analysisConfig?.typeOfAnalytics;

        if (!type) {
            return ProjectType.CLASSIC_ML;
        }

        if (['TIME_SERIES_FORECASTING', 'RECOMMENDATION'].includes(type)) {
            return ProjectType.DEEP_LEARNING;
        }

        return ProjectType.CLASSIC_ML;
    }

    // ============================================================================
    // PRIVATE MAPPING-METHODEN
    // ============================================================================

    /**
     * Extrahiert Indikatoren für die Projektbereitschaft (Readiness), wie
     * Datenzugriff, Infrastruktur und Stakeholder-Rückhalt.
     */
    private mapReadinessFactors(data: TemplateData, inputs: InputField[]): void {
        const { businessUnderstanding, dataCharacteristics, analysisConfig } = data;

        if (dataCharacteristics?.dataAvailability !== undefined) {
            inputs.push({
                id: 'data_availability',
                label: 'Datenverfügbarkeit',
                type: 'percentage',
                value: dataCharacteristics.dataAvailability ? 90 : 50,
                category: 'readiness'
            });
        }

        if (dataCharacteristics?.dataAccess) {
            const hasAccess = Array.isArray(dataCharacteristics.dataAccess) && dataCharacteristics.dataAccess.length > 0;
            inputs.push({
                id: 'data_access',
                label: 'Datenzugriff vorhanden',
                type: 'boolean',
                value: hasAccess,
                category: 'readiness'
            });
        }

        // Ein breiteres Team impliziert höheren Rückhalt im Unternehmen
        if (businessUnderstanding?.projectTeamRoles) {
            const roleCount = Array.isArray(businessUnderstanding.projectTeamRoles)
                ? businessUnderstanding.projectTeamRoles.length
                : 0;

            const support = roleCount >= 4 ? 'hoch' : roleCount >= 2 ? 'mittel' : 'niedrig';

            inputs.push({
                id: 'stakeholder_support',
                label: 'Stakeholder-Unterstützung',
                type: 'select',
                value: support,
                category: 'readiness',
                options: ['niedrig', 'mittel', 'hoch']
            });
        }

        // Prüft phasenübergreifend, ob ausreichend Werkzeuge definiert wurden
        const toolFields = [
            businessUnderstanding?.toolsBusinessUnderstanding,
            dataCharacteristics?.toolsData,
            analysisConfig?.toolsAnalysis,
            data.deploymentConfig?.toolsDeployment,
            data.utilizationConfig?.toolsUtilization
        ].filter(field => typeof field === 'string' && field.trim().length > 0);

        inputs.push({
            id: 'tools_available',
            label: 'Tools & Infrastruktur',
            type: 'boolean',
            value: toolFields.length >= 2,
            category: 'readiness'
        });
    }

    /**
     * Bewertet technische und fachliche Hürden (Complexity), wie
     * Datenmengen, Anzahl der Quellen und das finale Softwareprodukt.
     */
    private mapComplexityFactors(data: TemplateData, inputs: InputField[]): void {
        const { businessUnderstanding, dataCharacteristics, analysisConfig } = data;

        if (dataCharacteristics?.variety) {
            inputs.push({
                id: 'data_variety',
                label: 'Datenvielfalt (1-10)',
                type: 'number',
                value: VARIETY_MAP[dataCharacteristics.variety] || 5,
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 10
            });
        }

        if (dataCharacteristics?.dataSources) {
            const numSources = Array.isArray(dataCharacteristics.dataSources) ? dataCharacteristics.dataSources.length : 1;
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

        // Skaliert die Datenmenge logarithmisch, um Big-Data-Szenarien exponentiell stärker zu wichten
        if (dataCharacteristics?.volumeValue != null && dataCharacteristics?.volumeUnit) {
            const gbEstimate = dataCharacteristics.volumeValue * (GB_CONVERSION_FACTORS[dataCharacteristics.volumeUnit] || 0);
            const rawScore = Math.log10(gbEstimate + 1) * 3 + 1;

            inputs.push({
                id: 'data_volume_complexity',
                label: 'Datenvolumen-Komplexität',
                type: 'number',
                value: Math.max(1, Math.min(10, Math.round(rawScore))),
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 10
            });
        }

        if (dataCharacteristics?.dataPreparationSteps?.length) {
            inputs.push({
                id: 'data_prep_complexity',
                label: 'Datenaufbereitungs-Komplexität',
                type: 'number',
                value: Math.min(10, dataCharacteristics.dataPreparationSteps.length),
                category: 'complexity',
                isNegative: true,
                min: 0,
                max: 10
            });
        }

        if (businessUnderstanding?.formOfFinalProduct) {
            inputs.push({
                id: 'product_complexity',
                label: 'Produkt-Komplexität',
                type: 'number',
                value: PRODUCT_COMPLEXITY_MAP[businessUnderstanding.formOfFinalProduct] || 5,
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 10
            });
        }

        if (dataCharacteristics?.velocity) {
            inputs.push({
                id: 'data_velocity',
                label: 'Datengeschwindigkeit',
                type: 'select',
                value: VELOCITY_MAP[dataCharacteristics.velocity] || 'batch',
                category: 'complexity',
                options: ['batch', 'near-realtime', 'streaming']
            });
        }

        if (analysisConfig?.typeOfAnalytics) {
            inputs.push({
                id: 'analytics_type',
                label: 'Art der Analytik',
                type: 'select',
                value: ANALYTICS_TYPE_MAP[analysisConfig.typeOfAnalytics] || 'descriptive',
                category: 'complexity',
                options: ['descriptive', 'diagnostic', 'predictive', 'prescriptive']
            });
        }
    }

    /**
     * Evaluiert Risiken und Unklarheiten (Uncertainty), wie
     * schwammige Zielvorgaben, Datenschutzbedenken oder fehlende Daten.
     */
    private mapUncertaintyFactors(data: TemplateData, inputs: InputField[]): void {
        const { businessUnderstanding, dataCharacteristics } = data;

        if (dataCharacteristics?.veracity) {
            inputs.push({
                id: 'data_quality',
                label: 'Datenqualität (%)',
                type: 'percentage',
                value: DATA_QUALITY_MAP[dataCharacteristics.veracity] || 70,
                category: 'uncertainty'
            });
        }

        if (dataCharacteristics?.dataSecurityConstraints !== undefined) {
            const hasConcerns = typeof dataCharacteristics.dataSecurityConstraints === 'string' &&
                dataCharacteristics.dataSecurityConstraints.length > 0;
            inputs.push({
                id: 'privacy_concerns',
                label: 'Datenschutz-Bedenken',
                type: 'select',
                value: hasConcerns ? 'hoch' : 'niedrig',
                category: 'uncertainty',
                isNegative: true,
                options: ['niedrig', 'mittel', 'hoch', 'kritisch']
            });
        }

        if (dataCharacteristics?.variability) {
            inputs.push({
                id: 'missing_data',
                label: 'Fehlende Daten (%)',
                type: 'percentage',
                value: MISSING_DATA_MAP[dataCharacteristics.variability] || 15,
                category: 'uncertainty',
                isNegative: true
            });
        }

        // Geht davon aus, dass eine längere fachliche Beschreibung eine fundiertere Zielsetzung bedeutet
        if (businessUnderstanding?.businessGoal) {
            const hasClearGoal = (businessUnderstanding.businessGoal.length || 0) > 50;

            inputs.push({
                id: 'goal_clarity',
                label: 'Zielsetzung klar',
                type: 'boolean',
                value: hasClearGoal,
                category: 'uncertainty'
            });
        }
    }
}

export const mappingService = new MappingService();
