import { PrismaClient, Prisma, ProjectStatus } from '@prisma/client';
import { defaultWeights } from '@/app/config/defaultWeights';

const prisma = new PrismaClient();

export class SettingsService {

    async getWeightsSettings(settingsId: number){
        let settings = await prisma.weightsSettings.findUnique({
            where: { id: settingsId },
            include: {
                defaultWeights: true,
                businessUnderstanding: true,
                dataTasks: true,
                analysisTasks: true,
                evaluationTasks: true,
                deploymentTasks: true,
                productivity: true,
                cost: true,
            },
        })
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
                    productivity: { create: { productivity: 1.0 } },
                    cost: { create: { hourly_rate: 30.0 } },
                },
                include: {
                    defaultWeights: true,
                    businessTasks: true,
                    dataTasks: true,
                    analysisTasks: true,
                    evaluationTasks: true,
                    deploymentTasks: true,
                    productivity: true,
                    cost: true,
                },
            });
        }
        return settings;
    }
    async patchWeightsSettings(settingsId: number, data: UpdateWeightsSettingsDto){
        {
            return prisma.$transaction(async (prisma) => {
                await prisma.defaultWeights.update({
                    where: { settingsId },
                    data: data.defaultWeights,
                })

                await prisma.businessUnderstandingTask.update({
                    where: { settingsId },
                    data: data.businessUnderstanding,
                })

                await prisma.dataTasks.update({
                    where: { settingsId },
                    data: data.dataTasks,
                })

                await prisma.analysisTask.update({
                    where: { settingsId },
                    data: data.analysisTasks,
                })

                await prisma.evaluationTask.update({
                    where: { settingsId },
                    data: data.evaluationTasks,
                })

                await prisma.deploymentTask.update({
                    where: { settingsId },
                    data: data.deploymentTasks,
                })

                if (data.productivity) {
                    await prisma.productivity.update({
                        where: { settingsId },
                        data: { productivity: data.productivity.productivity },
                    });
                }
                if (data.cost) {
                    await prisma.cost.update({
                        where: { settingsId },
                        data: { hourly_rate: data.cost.hourly_rate },
                    });}

                return getWeightsSettings(settingsId)
            })
        }
    }
}
