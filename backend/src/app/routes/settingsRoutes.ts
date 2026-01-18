import { Router } from 'express';

const router = Router();

// GET /api/settings - Standard-Gewichtungen abrufen
router.get('/', (req, res) => {
    try {
        // Default-Gewichtungen (später aus DB laden)
        const weights = {
            defaultWeights: {
                data_access: 1.0,
                data_availability: 1.0,
                stakeholder_support: 1.0,
                tools_available: 1.0,
                data_variety: 1.5,
                data_velocity: 1.0,
                num_sources: 1.0,
                analytics_type: 1.3,
                data_quality: 1.5,
                privacy_concerns: 1.0,
                missing_data: 1.2,
                goal_clarity: 1.0,
            },
            businessTasks: {
                assess_situation: 0.2,
                derive_targets: 0.2,
                compose_team: 0.2,
                create_project_plan: 0.2,
                set_criteria_objectives: 0.2,
            },
            dataTasks: {
                identify_sources: 0.15,
                acquire_data: 0.15,
                describe_data: 0.1,
                explore_data: 0.15,
                asses_data_quality: 0.15,
                prepare_data: 0.2,
                develop_pipeline: 0.1,
            },
            analysisTasks: {
                define_hypothesis: 0.15,
                select_model: 0.2,
                design_test: 0.15,
                develop_model: 0.25,
                assess_model: 0.15,
                develop_pipeline: 0.1,
            },
            evaluationTasks: {
                assess_results: 0.6,
                evaluate_process: 0.4,
            },
            deploymentTasks: {
                perform_assessment: 0.15,
                plan_deployment: 0.2,
                plan_monitoring_maintenance: 0.15,
                test_deployment: 0.2,
                perform_integration: 0.2,
                finalize_project: 0.1,
            },
        };

        res.json({
            success: true,
            data: weights,
        });
    } catch (error) {
        console.error('Settings GET Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Gewichtungen',
        });
    }
});

// PATCH /api/settings - Gewichtungen aktualisieren
router.patch('/', (req, res) => {
    try {
        const {
            defaultWeights,
            businessTasks,
            dataTasks,
            analysisTasks,
            evaluationTasks,
            deploymentTasks,
        } = req.body;

        // TODO: In Datenbank speichern
        console.log('Settings updated:', req.body);

        res.json({
            success: true,
            data: {
                defaultWeights,
                businessTasks,
                dataTasks,
                analysisTasks,
                evaluationTasks,
                deploymentTasks,
            },
            message: 'Gewichtungen erfolgreich gespeichert',
        });
    } catch (error) {
        console.error('Settings PATCH Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Speichern der Gewichtungen',
        });
    }
});

export default router;