import type { BackendProjectPlan, ProjectMetrics, PhaseMetrics } from '@/types'

export function mapBackendToMetrics(
  backend: BackendProjectPlan
): ProjectMetrics {

  const projectStart = new Date(
    Math.min(
      ...backend.phases.map(p => new Date(p.startDate).getTime())
    )
  )

  const msPerWeek = 1000 * 60 * 60 * 24 * 7

  const weeksBetween = (start: Date, end: Date) =>
    Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerWeek))

  const phases: PhaseMetrics[] = backend.phases.map(phase => {
    const start = new Date(phase.startDate)
    const end = new Date(phase.endDate)

    const durationWeeks = weeksBetween(start, end)
    const startWeek = weeksBetween(projectStart, start) - 1

    const baseEffort = phase.estimatedDuration ?? durationWeeks

    return {
      name: phase.name,
      startWeek,
      durationWeeks,
      effortPersonWeeks: baseEffort,
      percentage: 0,
      baseEffort,
      bufferEffort: 0,
      baseDuration: durationWeeks,
      bufferDuration: 0
    }
  })

  const totalEffort = phases.reduce((sum, p) => sum + p.effortPersonWeeks, 0)
  const totalDuration = Math.max(
    ...phases.map(p => p.startWeek + p.durationWeeks)
  )

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
