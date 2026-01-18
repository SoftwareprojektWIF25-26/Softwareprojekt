// src/app/config/defaultWeights.ts

export const defaultWeights = {
    defaultWeights: {
        data_access: 1.5,         // Besonders wichtig
        data_availability: 1.2,
        stakeholder_support: 1.0,
        tools_available: 0.8,
        data_variety: 1.0,
        data_velocity: 1.0,
        num_sources: 1.0,
        analytics_type: 1.3,
        data_quality: 1.5,        // Sehr wichtig
        privacy_concerns: 1.2,
        missing_data: 1.1,
        goal_clarity: 1.4
    },
    businessTasks: {
        assess_situation: 0.2,
        create_project_plan: 0.2,
        compose_team: 0.2,
        set_criteria_objectives: 0.2,
        derive_targets: 0.2,
    },
    dataTasks: {
        identify_sources: 0.15,
        acquire_data: 0.15,
        describe_data: 0.15,
        explore_data: 0.15,
        asses_data_quality: 0.15,
        prepare_data: 0.15,
        develop_pipeline: 0.1,
    },
    analysisTasks: {
        define_hypothesis: 0.2,
        select_model: 0.2,
        design_test: 0.15,
        develop_model: 0.2,
        assess_model: 0.15,
        develop_pipeline: 0.1,
    },
    evaluationTasks: {
        assess_results: 0.5,
        evaluate_process: 0.5,
    },
    deploymentTasks: {
        perform_assessment: 0.15,
        plan_deployment: 0.2,
        plan_monitoring_maintenance: 0.15,
        test_deployment: 0.15,
        perform_integration: 0.2,
        finalize_project: 0.15,
    },
    productivityFactor: 1.2
};
