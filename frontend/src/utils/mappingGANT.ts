import type { BackendProjectPlan, ProjectMetrics, PhaseMetrics } from '@/types'

export function mapBackendToMetrics(
  backend: BackendProjectPlan
): ProjectMetrics {

  let currentWeek = 0

  const phases: PhaseMetrics[] = backend.phases.map((phase) => {
   const baseEffort = phase.estimatedDuration ?? 1

    const startWeek = currentWeek
const effortPersonWeeks = baseEffort
    currentWeek = startWeek + effortPersonWeeks
const durationWeeks= Math.max(1, effortPersonWeeks)
    console.log(`[mapBackendToMetrics] Phase ${phase.name}`, { startWeek, durationWeeks, baseEffort, startDate: phase.startDate, endDate: phase.endDate })

    return {
      name: phase.name,
      startWeek,
      durationWeeks,
      effortPersonWeeks,
      percentage: 0,
      baseEffort,
      bufferEffort: 0,
      baseDuration: durationWeeks,
      bufferDuration: 0
    }
  })

  const totalEffort = phases.reduce((sum, p) => sum + p.effortPersonWeeks, 0)
  const totalDuration = Math.max(...phases.map((p) => p.startWeek + p.durationWeeks))

  return {
    categoryScores: {
      readiness: 0,
      complexity: 0,
      uncertainty: 0
    },
    overallScore: 0,
    effortPersonWeeks: totalEffort,
    durationWeeks: totalDuration,
    projectSize: 'M',
    storyPoints: 0,
    sprintCount: Math.ceil(totalDuration / 2),
    phases,
    effortBreakdown: {
      baseEffort: totalEffort,
      bufferEffort: 0,
      bufferPercentage: 0,
      riskLevel: 0
    }
  }
}
