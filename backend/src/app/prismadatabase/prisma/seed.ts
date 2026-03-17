// prisma/seed.ts
import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    //
    // Wir nutzen hier die exakten Tabellennamen, wie sie im schema.prisma
    // in den @@map("...") Anweisungen oder als Standardnamen definiert sind.
    const tablenames = [
        'task_dependencies',
        'tasks',
        'project_phases',
        'project_plans',
        'project_evaluations',
        'utilization_config',
        'deployment_config',
        'analysis_config',
        'data_characteristics',
        'business_understanding',
        // Folgende Settings-Tabellen wurden hinzugefügt:
        'Cost',
        'Productivity',
        'DeploymentTask',
        'EvaluationTask',
        'AnalysisTask',
        'DataTasks',
        'BusinessUnderstandingTask',
        'DefaultWeights',
        'WeightsSettings',
        'ProjectCategory',
        'projects' // Haupttabelle zuletzt leeren
    ];

    console.log('🗑️  Bereinige Datenbank...');
    for (const tableName of tablenames) {
        // Ignoriert Tabellen, die evtl. nicht existieren, um Abstürze zu vermeiden
        try {
            // "TRUNCATE" ist schneller als deleteMany und setzt IDs zurück
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        } catch (error) {
            console.warn(`Warnung: Konnte Tabelle ${tableName} nicht leeren (existiert sie vielleicht noch nicht?).`);
        }
    }

    console.log('🌱 Starte Seeding...');

    // 2. Settings seeden (notwendig für ProjectPlan/Calculation)
    await prisma.weightsSettings.create({
        data: {
            defaultWeights: {
                create: {
                    data_access: 1.0, data_availability: 1.0, stakeholder_support: 1.0,
                    tools_available: 1.0, data_variety: 1.0, data_velocity: 1.0,
                    num_sources: 1.0, analytics_type: 1.0, data_quality: 1.0,
                    privacy_concerns: 1.0, missing_data: 1.0, goal_clarity: 1.0,
                    data_volume_complexity: 1.0, data_prep_complexity: 1.0, product_complexity: 1.0
                }
            },
            productivity: { create: { productivity: 0.8 } },
            cost: { create: { hourly_rate: 100 } }
        }
    });

    // 3. Create a Test Project (damit Dashboard-Routen was finden)
    await prisma.project.create({
        data: {
            title: 'Integration Test Project',
            domain: 'Test Domain',
            status: ProjectStatus.PLANNING,
            wizardStep: 1,
            businessUnderstanding: {
                create: {
                    businessGoal: 'Test Goal',
                    status: 'DRAFT',
                }
            }
        },
    });

    console.log('✅ Test Database erfolgreich geseedet');
}

main()
    .catch((e) => {
        console.error('❌ Fehler beim Seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
