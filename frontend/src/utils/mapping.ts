import type { BackendProjectPlan, ProjectMetrics, ProjectPhase } from '@/types'

export function mapBackendToMetrics(
  backend: BackendProjectPlan,
  projectStartDate: string
): ProjectMetrics {
  const projectStart = new Date(projectStartDate)

  const weeksBetween = (start: Date, end: Date) => {
    const msPerWeek = 1000 * 60 * 60 * 24 * 7
    return Math.ceil((end.getTime() - start.getTime()) / msPerWeek)
  }

  const phases: ProjectPhase[] = backend.phases.map(phase => {
    const start = new Date(phase.startDate)
    const end = new Date(phase.endDate)
    const durationWeeks = weeksBetween(start, end)
    const startWeek = weeksBetween(projectStart, start)

    const baseEffort = phase.estimatedDuration || phase.estimatedEffort
    const bufferEffort = 0 // Optional, falls du Puffer berechnest
    const baseDuration = durationWeeks // Standard-Duration

    return {
      name: phase.name,
      startWeek,
      durationWeeks,
      effortPersonWeeks: phase.estimatedEffort,
      percentage: 0, // optional berechnen
      baseEffort,
      bufferEffort,
      baseDuration,
      bufferDuration: 0
    }
  })

  const totalEffort = phases.reduce((sum, p) => sum + p.effortPersonWeeks, 0)
  const totalDuration = Math.max(...phases.map(p => p.startWeek + p.durationWeeks))

  return {
    categoryScores: { readiness: 0, complexity: 0, uncertainty: 0 },
    effortPersonWeeks: totalEffort,
    durationWeeks: totalDuration,
    effortBreakdown: { baseEffort: totalEffort, bufferEffort: 0, bufferPercentage: 0, riskLevel: 0 },
    projectSize: 'M',
    storyPoints: 0,
    sprintCount: 0,
    phases
  }
}
