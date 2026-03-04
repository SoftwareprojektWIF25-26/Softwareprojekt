import type { BackendProjectPlan, ProjectMetrics } from '@/types'

/**
 * Mappt die Backend-Antwort (BackendProjectPlan) in das vom Frontend
 * erwartete Format (ProjectMetrics) für die Darstellung im Gantt-Chart.
 *
 * @param backend - Die rohen Projektdaten vom Server
 * @returns Ein formatiertes Metrik-Objekt inklusive berechneter Phasenlängen
 */
export function mapBackendToMetrics(backend: BackendProjectPlan): ProjectMetrics {
  // --- KONSTANTEN ---
  const WORKDAYS_PER_WEEK = 5 // 1 Personenwoche (PW) = 5 Arbeitstage (Wochenenden exklusive)
  const DAYS_PER_SPRINT = 10  // 1 Sprint = 2 Arbeitswochen = 10 Arbeitstage
  const DAYS_PER_WEEK = 7     // Kalendertage für Wochen-Berechnungen

  let currentDayOffset = 0 // Verfolgt den Startpunkt (in Tagen) für die jeweils nächste Phase

  // --- 1. PHASEN BERECHNEN ---
  const phases = backend.phases.map((phase) => {
    // a) Aufwandswerte in Personenwochen (PW) sichern (Fallback: estimatedEffort oder 1)
    const baseEffortPW = phase.baseEffort ?? phase.estimatedEffort ?? 1
    const bufferEffortPW = phase.bufferEffort ?? 0
    const totalEffortPW = baseEffortPW + bufferEffortPW

    // b) Dauer (in Arbeitstagen) strikt aus dem Aufwand berechnen.
    // Wir ignorieren die "Duration"-Felder des Backends, um UI-Inkonsistenzen zu vermeiden.
    const baseDurationDays = Math.round(baseEffortPW * WORKDAYS_PER_WEEK)
    const bufferDurationDays = Math.round(bufferEffortPW * WORKDAYS_PER_WEEK)
    const totalDurationDays = baseDurationDays + bufferDurationDays

    // c) Phasen-Objekt für das UI zusammenbauen
    const phaseData = {
      phaseId: phase.id,
      name: phase.name,
      tasks: phase.tasks || [],
      percentage: 0, // Platzhalter für zukünftigen Fortschritt

      // Aufwände (in PW)
      baseEffort: baseEffortPW,
      bufferEffort: bufferEffortPW,
      effortPersonWeeks: totalEffortPW,

      // Dauer (in Tagen)
      startDay: currentDayOffset,
      baseDurationDays,
      bufferDurationDays,
      durationDays: totalDurationDays,

      // Dauer & Startpunkt umgerechnet in Kalender-Wochen für das Wochen-Grid
      startWeek: currentDayOffset / DAYS_PER_WEEK,
      baseDuration: baseDurationDays / DAYS_PER_WEEK,
      bufferDuration: bufferDurationDays / DAYS_PER_WEEK,
      durationWeeks: totalDurationDays / DAYS_PER_WEEK,
    }

    // Offset für die Folgephase erhöhen
    currentDayOffset += totalDurationDays

    return phaseData
  })

  // --- 2. GESAMTMETRIKEN AGGREGIEREN ---
  const projectTotalEffortPW = phases.reduce((sum, p) => sum + p.effortPersonWeeks, 0)
  const projectBaseEffortPW = phases.reduce((sum, p) => sum + p.baseEffort, 0)
  const projectBufferEffortPW = phases.reduce((sum, p) => sum + p.bufferEffort, 0)
  const projectTotalDays = phases.reduce((sum, p) => sum + p.durationDays, 0)

  // Buffer-Anteil in Prozent (Sicherheitscheck gegen Division durch 0)
  const bufferPercentage = projectTotalEffortPW > 0
    ? (projectBufferEffortPW / projectTotalEffortPW) * 100
    : 0

  // --- 3. RETURN RESPONSE ---
  return {
    phases,
    projectSize: 'M', // Statischer Default, falls später dynamisch benötigt
    storyPoints: 0,
    overallScore: 0,

    // Aggregierte Zeit- und Aufwandsmetriken
    effortPersonWeeks: projectTotalEffortPW,
    durationWeeks: projectTotalDays / DAYS_PER_WEEK,
    sprintCount: Math.ceil(projectTotalDays / DAYS_PER_SPRINT),

    // Standardwerte für Platzhalter-Metriken
    categoryScores: {
      readiness: 0,
      complexity: 0,
      uncertainty: 0
    },

    // Detaillierter Aufwands-Split
    effortBreakdown: {
      baseEffort: projectBaseEffortPW,
      bufferEffort: projectBufferEffortPW,
      bufferPercentage,
      riskLevel: 0,
    },
  }
}
