// prisma/seed.ts
import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Clean up: Reihenfolge ist wichtig wegen Foreign Keys!
    // Lösche Child-Tabellen zuerst
    const tablenames = [
        'task_dependencies', 'tasks', 'project_phases', 'project_plans',
        'project_evaluations', 'utilization_config', 'deployment_config',
        'analysis_config', 'data_characteristics', 'business_understanding',
        'projects', 'local_workspaces'
    ];

    for (const tableName of tablenames) {
        // "TRUNCATE" ist schneller als deleteMany und setzt IDs zurück
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
    }



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

    console.log('🌱 Test Database seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
