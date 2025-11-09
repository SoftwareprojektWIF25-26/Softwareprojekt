import {PrismaClient, Prisma, LocalWorkspace} from '@prisma/client';


/*
Bindeglied zwischen routes und datenbank, da hier auf die db zugegriffen wird um den workspace, also den
Arbeitsbereih zu laden.
 */

const prisma = new PrismaClient();

//  Automatisch generierter Type basierend auf dem include
type ProjectWithPhases = Prisma.ProjectGetPayload<{
    include: {
        businessUnderstanding: true;
        dataCharacteristics: true;
        analysisConfig: true;
        deploymentConfig: true;
        utilizationConfig: true;
    };
}>;

export class DashboardService {
    async getDashboardData(workspaceId?: string) {

        let workspace: LocalWorkspace; //  Expliziter Type für workspace

        if (workspaceId) {
            // Spezifischen Workspace laden
            const foundWorkspace = await prisma.localWorkspace.findUnique({
                where: { id: workspaceId }
            });

            // Wenn Workspace nicht gefunden, Fehler werfen
            if (!foundWorkspace) {
                throw new Error(`Workspace mit ID ${workspaceId} nicht gefunden`);
            }
            workspace = foundWorkspace;

        } else {
            // Ersten verfügbaren Workspace nehmen
            const foundWorkspace = await prisma.localWorkspace.findFirst();

            if (foundWorkspace) {
                // Default Workspace gefunden
                workspace = foundWorkspace;
            } else {
                // Falls keiner existiert, Default erstellen
                workspace = await prisma.localWorkspace.create({
                    data: { name: 'Default Workspace' }
                });
            }
        }


        const projects = await prisma.project.findMany({
            where: {workspaceId: workspace.id},
            include: {
                businessUnderstanding: true,
                dataCharacteristics: true,
                analysisConfig: true,
                deploymentConfig: true,
                utilizationConfig: true
            },
            orderBy: {updatedAt: 'desc'}
        });

        // .map() geht durch jedes einzelne "project" im "projects"-Array...
        // ... und erstellt für jedes ein NEUES, kleineres Objekt
        // mit nur den Feldern, die wir an das Frontend senden wollen.
        const enrichedProjects = projects.map((project: ProjectWithPhases) => ({
            id: project.id,
            title: project.title,
            domain: project.domain,
            status: project.status,
            wizardStep: project.wizardStep,
            wizardCompleted: project.wizardCompleted,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        }));

        // Wir nehmen wieder das Original-Array 'projects' von Prisma
        // .filter() geht durch das Array und erstellt ein NEUES Array,
        // das nur die Projekte enthält, die die Bedingung erfüllen.
        const statistics = {
            totalProjects: projects.length,
            planning: projects.filter((p: ProjectWithPhases) => p.status === 'PLANNING').length,
            inProgress: projects.filter((p: ProjectWithPhases) => p.status === 'IN_PROGRESS').length,
            completed: projects.filter((p: ProjectWithPhases) => p.status === 'COMPLETED').length,
            onHold: projects.filter((p: ProjectWithPhases) => p.status === 'ON_HOLD').length,
            cancelled: projects.filter((p: ProjectWithPhases) => p.status === 'CANCELLED').length
        };

        return {
            workspace
        }
    }
}
