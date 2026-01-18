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

        // VERBESSERT: Stakeholder Support basierend auf projectTeamRoles
        if (businessUnderstanding?.projectTeamRoles) {
            const roleCount = Array.isArray(businessUnderstanding.projectTeamRoles)
                ? businessUnderstanding.projectTeamRoles.length
                : 0;

            const support = roleCount >= 4 ? 'hoch' :
                roleCount >= 2 ? 'mittel' : 'niedrig';

            inputs.push({
                id: 'stakeholder_support',
                label: 'Stakeholder-Unterstützung',
                type: 'select',
                value: support,
                category: 'readiness',
                options: ['niedrig', 'mittel', 'hoch']
            });
        }

        // VERBESSERT: Tools Available - Anzahl der ausgefüllten Tool-Felder
        const toolFields = [
            businessUnderstanding?.toolsBusinessUnderstanding,
            dataCharacteristics?.toolsData,
            analysisConfig?.toolsAnalysis,
            templateData.deploymentConfig?.toolsDeployment,
            templateData.utilizationConfig?.toolsUtilization
        ].filter(Boolean);

        if (toolFields.length > 0) {
            inputs.push({
                id: 'tools_available',
                label: 'Tools & Infrastruktur',
                type: 'boolean',
                value: toolFields.length >= 2, // Mindestens 2 Tool-Kategorien
                category: 'readiness'
            });
        }

        // === COMPLEXITY FACTORS ===

        //VERBESSERT: Data Variety - Nutzt das variety Enum direkt
        if (dataCharacteristics?.variety) {
            const varietyMap: Record<string, number> = {
                'LOW': 3,      // Nur ein Datentyp
                'MEDIUM': 6,   // Zwei Datentypen
                'HIGH': 10     // Alle Datentypen
            };

            inputs.push({
                id: 'data_variety',
                label: 'Datenvielfalt (1-10)',
                type: 'number',
                value: varietyMap[dataCharacteristics.variety] || 5,
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

// Data Volume Complexity – Engineering-Aufwand / Projektlänge
        if (dataCharacteristics?.volumeValue != null && dataCharacteristics?.volumeUnit) {
            const { volumeValue, volumeUnit } = dataCharacteristics;

            // 1. Volumen grob auf "GB" normalisieren
            // Annahme: 1 Record ≈ 1 KB (kannst du bei Bedarf anpassen)
            let gbEstimate: number;

            switch (volumeUnit) {
                case 'RECORDS':
                    gbEstimate = (volumeValue * 1 /* KB */) / (1024 * 1024); // ≈ GB
                    break;
                case 'KB':
                    gbEstimate = volumeValue / (1024 * 1024);
                    break;
                case 'MB':
                    gbEstimate = volumeValue / 1024;
                    break;
                case 'GB':
                    gbEstimate = volumeValue;
                    break;
                case 'TB':
                    gbEstimate = volumeValue * 1024;
                    break;
                case 'PB':
                    gbEstimate = volumeValue * 1024 * 1024;
                    break;
                default:
                    gbEstimate = 0;
            }

            // 2. Logarithmische Skala auf 1–10 mappen
            // Idee:
            //  - < 1 GB  →  Score 1–3  (kaum Impact)
            //  - 1–10 GB →  Score 3–5  (normales DS-Projekt)
            //  - 10–100 GB → Score 5–7 (spürbar langsamer, evtl. Server nötig)
            //  - 100 GB–10 TB → Score 7–9 (Big Data, Cluster/Cloud)
            //  - > 10 TB → Score 9–10 (sehr hoher Engineering-Aufwand)
            const rawScore = Math.log10(gbEstimate + 1) * 3 + 1;
            const volumeComplexity = Math.max(1, Math.min(10, Math.round(rawScore)));

            inputs.push({
                id: 'data_volume_complexity',
                label: 'Datenvolumen-Komplexität',
                type: 'number',
                value: volumeComplexity,
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 10
            });
        }


        //Data Preparation Complexity
        if (dataCharacteristics?.dataPreparationSteps?.length) {
            const prepComplexity = Math.min(10, dataCharacteristics.dataPreparationSteps.length);

            inputs.push({
                id: 'data_prep_complexity',
                label: 'Datenaufbereitungs-Komplexität',
                type: 'number',
                value: prepComplexity,
                category: 'complexity',
                isNegative: true,
                min: 0,
                max: 10
            });
        }

        //Form of Final Product Complexity
        if (businessUnderstanding?.formOfFinalProduct) {
            const productComplexityMap: Record<string, number> = {
                'REPORT': 2,                        // Einfach: Nur Dokumentation
                'INSIGHT_DOCUMENT': 2,              // Einfach: Nur Insights
                'APPLICATION_SOFTWARE': 7,          // Komplex: Software-Entwicklung
                'AUTOMATED_DECISION_SYSTEM': 9,     // Sehr komplex: Autonomes System
                'OTHER': 5                          // Mittel: Unbekannt
            };

            inputs.push({
                id: 'product_complexity',
                label: 'Produkt-Komplexität',
                type: 'number',
                value: productComplexityMap[businessUnderstanding.formOfFinalProduct] || 5,
                category: 'complexity',
                isNegative: true,
                min: 1,
                max: 10
            });
        }

        // Data Velocity
        if (dataCharacteristics?.velocity) {
            const velocityMap: Record<string, string> = {
                'BATCH': 'batch',
                'DAILY': 'near-realtime',
                'HOURLY': 'near-realtime',
                'CONTINUOUS': 'streaming'
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
        if (analysisConfig?.typeOfAnalytics) {
            const typeMap: Record<string, string> = {
                'CLASSIFICATION': 'predictive',
                'REGRESSION': 'predictive',
                'CLUSTERING': 'diagnostic',
                'ANOMALY_DETECTION': 'diagnostic',
                'TIME_SERIES_FORECASTING': 'predictive',
                'RECOMMENDATION': 'prescriptive',
                'ASSOCIATION_RULE_LEARNING': 'diagnostic',
                'OTHER': 'descriptive'
            };
            inputs.push({
                id: 'analytics_type',
                label: 'Art der Analytik',
                type: 'select',
                value: typeMap[analysisConfig.typeOfAnalytics] || 'descriptive',
                category: 'complexity',
                options: ['descriptive', 'diagnostic', 'predictive', 'prescriptive']
            });
        }

        // === UNCERTAINTY FACTORS ===

        // Data Quality (aus Veracity)
        if (dataCharacteristics?.veracity) {
            const qualityMap: Record<string, number> = {
                'POOR': 40,
                'MEDIUM': 70,
                'GOOD': 85,
                'EXCELLENT': 95
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
        if (dataCharacteristics?.dataSecurityConstraints !== undefined) {
            const hasConcerns = typeof dataCharacteristics.dataSecurityConstraints === 'string'
                && dataCharacteristics.dataSecurityConstraints.length > 0;
            const level = hasConcerns ? 'hoch' : 'niedrig';
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
                'YEARLY': 10,
                'MONTHLY': 15,
                'WEEKLY': 25,
                'DAILY': 35,
                'HOURLY': 50
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

        //VERBESSERT aber Optional: Goal Clarity - Längere Beschreibung = klarere Ziele
        if (businessUnderstanding?.businessGoal) {
            const goalLength = businessUnderstanding.businessGoal?.length || 0;
            const hasGoal = goalLength > 50; // Mindestens 50 Zeichen für klare Beschreibung

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
        if (analysisConfig?.typeOfAnalytics) {
            const type = analysisConfig.typeOfAnalytics;

            // Deep Learning: Komplexe Modelle
            if (type === 'TIME_SERIES_FORECASTING' || type === 'RECOMMENDATION') {
                return ProjectType.DEEP_LEARNING;
            }

            // Classic ML: Standard ML-Aufgaben
            if (type === 'CLASSIFICATION' || type === 'REGRESSION' || type === 'CLUSTERING') {
                return ProjectType.CLASSIC_ML;
            }

            // Reporting: Deskriptive Analytik
            if (type === 'ANOMALY_DETECTION' || type === 'ASSOCIATION_RULE_LEARNING') {
                return ProjectType.CLASSIC_ML;
            }
        }

        // Fallback: Classic ML
        return ProjectType.CLASSIC_ML;
    }
}

export const mappingService = new MappingService();