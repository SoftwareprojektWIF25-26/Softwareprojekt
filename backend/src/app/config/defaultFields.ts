// src/app/config/defaultFields.ts

export const defaultFields = [
    // Readiness
    {
        id: 'data_access',
        label: 'Datenzugriff vorhanden',
        type: 'boolean',
        value: false,
        category: 'readiness'
    },
    {
        id: 'data_availability',
        label: 'Datenverfügbarkeit (%)',
        type: 'percentage',
        value: 70,
        category: 'readiness'
    },
    {
        id: 'stakeholder_support',
        label: 'Stakeholder-Unterstützung',
        type: 'select',
        value: 'mittel',
        category: 'readiness',
        options: ['niedrig', 'mittel', 'hoch']
    },
    {
        id: 'tools_available',
        label: 'Tools & Infrastruktur',
        type: 'boolean',
        value: true,
        category: 'readiness'
    },

    // Complexity
    {
        id: 'data_variety',
        label: 'Datenvielfalt (1-10)',
        type: 'number',
        value: 5,
        category: 'complexity',
        isNegative: true,
        min: 1,
        max: 10
    },
    {
        id: 'data_velocity',
        label: 'Datengeschwindigkeit',
        type: 'select',
        value: 'batch',
        category: 'complexity',
        options: ['batch', 'near-realtime', 'streaming']
    },
    {
        id: 'num_sources',
        label: 'Anzahl Datenquellen',
        type: 'number',
        value: 3,
        category: 'complexity',
        isNegative: true,
        min: 1,
        max: 20
    },
    {
        id: 'analytics_type',
        label: 'Art der Analytik',
        type: 'select',
        value: 'descriptive',
        category: 'complexity',
        options: ['descriptive', 'diagnostic', 'predictive', 'prescriptive']
    },

    // Uncertainty
    {
        id: 'data_quality',
        label: 'Datenqualität (%)',
        type: 'percentage',
        value: 75,
        category: 'uncertainty'
    },
    {
        id: 'privacy_concerns',
        label: 'Datenschutz-Bedenken',
        type: 'select',
        value: 'mittel',
        category: 'uncertainty',
        isNegative: true,
        options: ['niedrig', 'mittel', 'hoch', 'kritisch']
    },
    {
        id: 'missing_data',
        label: 'Fehlende Daten (%)',
        type: 'percentage',
        value: 15,
        category: 'uncertainty',
        isNegative: true
    },
    {
        id: 'goal_clarity',
        label: 'Zielsetzung klar',
        type: 'boolean',
        value: true,
        category: 'uncertainty'
    }
];
