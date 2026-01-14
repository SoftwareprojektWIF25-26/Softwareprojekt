import type { BackendProjectPlan, ProjectMetrics, PhaseMetrics } from '@/types'

export function mapBackendToMetrics(backend: BackendProjectPlan): ProjectMetrics {
  let currentWeek = 0

  const phases: PhaseMetrics[] = backend.phases.map((phase) => {
    // Aufwand (Person-Wochen)
    const baseEffort = phase.baseEffort ?? phase.estimatedEffort ?? 1
    const bufferEffort = phase.bufferEffort ?? 0

    // Dauer (Kalender-Wochen) - von Tagen konvertieren
    const baseDurationWeeks = (phase.baseDuration ?? 0) / 7
    const bufferDurationWeeks = (phase.bufferDuration ?? 0) / 7
    const totalDurationWeeks = baseDurationWeeks + bufferDurationWeeks

    const phaseData = {
      name: phase.name,
      startWeek: currentWeek,
      durationWeeks: totalDurationWeeks,
      effortPersonWeeks: baseEffort + bufferEffort,
      percentage: 0,
      baseEffort: baseEffort,
      bufferEffort: bufferEffort,
      baseDuration: baseDurationWeeks,
      bufferDuration: bufferDurationWeeks,

      // NEU: Tasks durchreichen
      tasks: phase.tasks || [],
      phaseId: phase.id
    }

    // ✅ WICHTIG: Nutze DAUER (nicht Aufwand) für Timeline!
    // Alternative: Wenn ihr Aufwand als Timeline wollt, dann so:
    currentWeek += baseEffort + bufferEffort  // Aufwand-basiert (wie vorher)
    // ODER für echte Kalender-Timeline:
    // currentWeek += totalDurationWeeks  // Dauer-basiert

    return phaseData
  })

  const totalEffort = phases.reduce((sum, p) => sum + p.effortPersonWeeks, 0)
  const totalDuration = Math.max(...phases.map((p) => p.startWeek + p.durationWeeks))

  return {
    categoryScores: {
      readiness: 0,
      complexity: 0,
      uncertainty: 0,
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
      riskLevel: 0,
    },
  }
}
