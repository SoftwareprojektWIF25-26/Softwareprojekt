import { PrismaClient } from '@prisma/client';
import { defaultWeights } from '../../config/defaultWeights.ts';
import { UpdateWeightsSettingsDto } from "../../types.ts";

const prisma = new PrismaClient();

// Zentralisiertes Include-Objekt, um Redundanzen bei Queries zu vermeiden
const SETTINGS_INCLUDES = {
    defaultWeights: true,
    businessTasks: true,
    dataTasks: true,
    analysisTasks: true,
    evaluationTasks: true,
    deploymentTasks: true,
    productivity: true,
    cost: true,
};

export class SettingsService {

    /**
     * Ruft die Gewichtungseinstellungen für eine bestimmte Konfiguration ab.
     * Nutzt das Pattern "Lazy Initialization": Existieren noch keine Settings,
     * werden diese automatisch mit systemweiten Standardwerten angelegt.
     */
    public async getWeightsSettings(settingsId: number) {
        let settings = await prisma.weightsSettings.findUnique({
            where: { id: settingsId },
            include: SETTINGS_INCLUDES,
        });

        if (!settings) {
            settings = await prisma.weightsSettings.create({
                data: {
                    id: settingsId,
                    defaultWeights: { create: defaultWeights.defaultWeights },
                    businessTasks: { create: defaultWeights.businessTasks },
                    dataTasks: { create: defaultWeights.dataTasks },
                    analysisTasks: { create: defaultWeights.analysisTasks },
                    evaluationTasks: { create: defaultWeights.evaluationTasks },
                    deploymentTasks: { create: defaultWeights.deploymentTasks },
                    // Initiale Annahmen für Produktivität und Kosten
                    productivity: { create: { productivity: 1.0 } },
                    cost: { create: { hourly_rate: 30.0 } },
                },
                include: SETTINGS_INCLUDES,
            });
        }

        return settings;
    }

    /**
     * Führt ein partielles Update der Gewichtungseinstellungen durch.
     * Nutzt eine interaktive Datenbank-Transaktion, um sicherzustellen, dass
     * entweder alle übergebenen Werte aktualisiert werden oder gar keine (All-or-Nothing).
     */
    public async patchWeightsSettings(settingsId: number, data: UpdateWeightsSettingsDto) {
        return prisma.$transaction(async (tx) => {

            // Führe Updates nur für die Relationen aus, die im Payload existieren
            if (data.defaultWeights) {
                await tx.defaultWeights.update({
                    where: { settingsId },
                    data: data.defaultWeights,
                });
            }

            if (data.businessTasks) {
                await tx.businessUnderstandingTask.update({
                    where: { settingsId },
                    data: data.businessTasks,
                });
            }

            if (data.dataTasks) {
                await tx.dataTasks.update({
                    where: { settingsId },
                    data: data.dataTasks,
                });
            }

            if (data.analysisTasks) {
                await tx.analysisTask.update({
                    where: { settingsId },
                    data: data.analysisTasks,
                });
            }

            if (data.evaluationTasks) {
                await tx.evaluationTask.update({
                    where: { settingsId },
                    data: data.evaluationTasks,
                });
            }

            if (data.deploymentTasks) {
                await tx.deploymentTask.update({
                    where: { settingsId },
                    data: data.deploymentTasks,
                });
            }

            if (data.productivity) {
                await tx.productivity.update({
                    where: { settingsId },
                    data: { productivity: data.productivity.productivity },
                });
            }

            if (data.cost) {
                await tx.cost.update({
                    where: { settingsId },
                    data: { hourly_rate: data.cost.hourly_rate },
                });
            }

            // Den aktualisierten Datensatz direkt aus der Transaktion (tx) zurückgeben
            // Dies garantiert Datenkonsistenz vor dem finalen Commit.
            return tx.weightsSettings.findUnique({
                where: { id: settingsId },
                include: SETTINGS_INCLUDES,
            });
        });
    }
}
