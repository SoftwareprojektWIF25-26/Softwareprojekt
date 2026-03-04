<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import type { ProjectMetrics } from '@/types'
import { mapBackendToMetrics } from '@/utils/mappingGANT'
import api from '@/api'
import router from '@/router/PathRouting'
import { TASK_LABELS } from '@/utils/constants'
import {
  addDays,
  format,
  isWeekend,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  differenceInDays,
  startOfMonth,
  startOfYear
} from 'date-fns'
import { de } from 'date-fns/locale'

// ============================================================================
// 1. PROPS & STATE-MANAGEMENT
// ============================================================================
const props = defineProps<{ id: string; startDate?: string | Date }>()
const projectId = Number(props.id)

const phases = ref<any[]>([])
const containerWidth = ref(800)
const timelineContainer = ref<HTMLDivElement | null>(null)

// Konstanten für das Layout
const LABEL_WIDTH = 220
const CONTAINER_PADDING = 40

// Modal State für Task-Details
const showTaskModal = ref(false)
const selectedPhase = ref<any | null>(null)
const showHours = ref(false) // Toggle für Stunden/Tage-Anzeige im Modal

// ============================================================================
// 2. ZOOM-STEUERUNG
// ============================================================================
type ZoomLevel = 'days' | 'weeks' | 'months' | 'years'
const zoom = ref<ZoomLevel>('weeks')

const zoomLabels: Record<ZoomLevel, string> = {
  days: 'Tage',
  weeks: 'Wochen',
  months: 'Monate',
  years: 'Jahre',
}

// ============================================================================
// 3. COMPUTED PROPERTIES (BEREchnungen)
// ============================================================================

/** Ermittelt das Startdatum des Projekts (aus Props, erster Phase oder heute) */
const projectStartDate = computed(() => {
  if (props.startDate) return new Date(props.startDate)
  if (phases.value.length > 0 && phases.value[0].startDate) {
    return new Date(phases.value[0].startDate)
  }
  return new Date()
})

/** Berechnet die Gesamtdauer des Projekts in Arbeitstagen */
const totalDays = computed(() => {
  if (!phases.value.length) return 0
  return phases.value.reduce((sum, p) => sum + (p.durationDays ?? (p.baseEffort + p.bufferEffort) * 7), 0)
})

/** Berechnet die dynamische Mindestbreite des Containers für horizontales Scrollen */
const timelineMinWidth = computed(() => {
  const days = totalDays.value || 1

  switch (zoom.value) {
    case 'days':
      // Bei Tagen: Wochenenden abziehen (grob 5/7) und 60px pro Tag reservieren
      const workDaysCount = Math.ceil(days * (5 / 7))
      return `${workDaysCount * 60}px`
    case 'weeks': return `${(days / 7) * 200}px`
    case 'months': return `${(days / 30) * 300}px`
    case 'years': return `${(days / 365) * 400}px`
    default: return '100%'
  }
})

// --- Aufwands-Zusammenfassung (Summen) ---
const baseEffortTotal = computed(() =>
  phases.value.reduce((sum, p) => sum + (p.baseEffort ?? 0), 0).toFixed(1)
)

const pufferWeeks = computed(() => {
  const buffer = phases.value.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0)
  return buffer > 0 ? `${buffer.toFixed(1)} PW` : '–'
})

const baseAndPufferTotal = computed(() => {
  const base = parseFloat(baseEffortTotal.value)
  const buffer = phases.value.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0)
  return (base + buffer).toFixed(1)
})

// ============================================================================
// 4. TIMELINE-GRID & HEADER BERECHNUNG
// ============================================================================

/** Generiert die zweistufigen Header (Obere Zeile: grob, Untere Zeile: fein) basierend auf dem Zoom */
const timelineHeaders = computed(() => {
  const days = totalDays.value || 1
  const start = projectStartDate.value
  const end = addDays(start, days)

  // Hilfsfunktion: Berechnet die X-Position in Prozent
  const pct = (date: Date) => `${(Math.max(0, differenceInDays(date, start)) / days) * 100}%`

  if (zoom.value === 'years') {
    return {
      upper: [],
      lower: eachYearOfInterval({ start, end }).map(date => ({
        label: format(date, 'yyyy'),
        left: pct(date),
        width: `${(365 / days) * 100}%`,
      }))
    }
  }

  if (zoom.value === 'months') {
    return {
      upper: eachYearOfInterval({ start: startOfYear(start), end }).map(date => ({
        label: format(date, 'yyyy'),
        left: pct(date),
      })),
      lower: eachMonthOfInterval({ start, end }).map(date => ({
        label: format(date, 'MMM', { locale: de }),
        left: pct(date),
        width: 'auto',
      }))
    }
  }

  if (zoom.value === 'weeks') {
    return {
      upper: eachMonthOfInterval({ start: startOfMonth(start), end }).map(date => ({
        label: format(date, 'MMM yyyy', { locale: de }),
        left: pct(date),
      })),
      lower: eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(date => ({
        label: `KW ${format(date, 'ww', { locale: de })}`,
        left: pct(date),
        width: `${(7 / days) * 100}%`,
      }))
    }
  }

  // Fallback: zoom === 'days'
  // Filtere Wochenenden (Samstag/Sonntag) für eine saubere Darstellung heraus
  const allDays = eachDayOfInterval({ start, end })
  const workDays = allDays.filter(date => !isWeekend(date))

  return {
    upper: eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(date => ({
      label: `${format(date, 'MMM', { locale: de })} · KW${format(date, 'ww', { locale: de })}`,
      left: pct(date),
    })),
    lower: workDays.map((date, index) => ({
      label: format(date, 'EEE dd', { locale: de }), // z.B. "Mo 03"
      left: `${(index / workDays.length) * 100}%`,   // Basiert auf Arbeitstagen statt Kalendertagen
      width: `${(1 / workDays.length) * 100}%`,
    }))
  }
})

// Hilfsfunktionen zur Platzierung der Gantt-Balken
const barLeft = (startDay: number): string => `${(startDay / totalDays.value) * 100}%`
const barWidth = (durationDays: number): string => `${(durationDays / totalDays.value) * 100}%`

// ============================================================================
// 5. EVENT HANDLER & AKTIONEN
// ============================================================================

/** Lädt die Projektdaten vom Backend und konvertiert sie für das Frontend */
onMounted(async () => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
  await nextTick()

  if (timelineContainer.value) {
    containerWidth.value = timelineContainer.value.clientWidth - LABEL_WIDTH
  }

  try {
    const backendGantt = await api.getTimeline(projectId)
    const metrics: ProjectMetrics = mapBackendToMetrics(backendGantt)

    phases.value = metrics.phases.map((p: any) => ({
      ...p,
      startDay: p.startDay ?? 0,
      baseEffort: p.baseEffort ?? 0,
      bufferEffort: p.bufferEffort ?? 0,
      baseDurationDays: p.baseDurationDays ?? (p.baseEffort ?? 0) * 7,
      bufferDurationDays: p.bufferDurationDays ?? (p.bufferEffort ?? 0) * 7,
      durationDays: p.durationDays ?? (p.baseEffort + p.bufferEffort) * 7,
      effortPersonWeeks: p.effortPersonWeeks ?? 0,
      tasks: p.tasks || [],
    }))
  } catch (e) {
    console.error('❌ Timeline konnte nicht geladen werden', e)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
})

const updateContainerWidth = () => {
  if (timelineContainer.value) {
    containerWidth.value = timelineContainer.value.clientWidth - LABEL_WIDTH - CONTAINER_PADDING * 2
  }
}

const goBack = () => router.push({ name: 'dashboard', params: { id: props.id } })
const toggleUnit = () => showHours.value = !showHours.value

// Modal Steuerung
const openTaskModal = (phase: any) => {
  selectedPhase.value = phase
  showTaskModal.value = true
}
const closeTaskModal = () => {
  showTaskModal.value = false
  selectedPhase.value = null
}

// Helfer für UI-Anzeige
const getTaskTitle = (taskType: string) => TASK_LABELS[taskType] || taskType.replace(/_/g, ' ')
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = { TODO: '#9ca3af', IN_PROGRESS: '#3b82f6', BLOCKED: '#ef4444', DONE: '#10b981' }
  return colors[status] || '#6b7280'
}
const formatDuration = (days: number | null): string => {
  if (!days) return '–'
  return showHours.value
    ? `${Math.ceil(days * 8)} Std.`
    : `${Number.isInteger(days) ? days : days.toFixed(1).replace('.', ',')} ${days === 1 ? 'Tag' : 'Tage'}`
}

/** Exportiert die Gantt-Daten als CSV-Datei */
const exportToCSV = () => {
  const headers = ['Phase', 'Start', 'Ende', 'Basisaufwand (Wochen)', 'Puffer (Wochen)', 'Gesamtdauer (Wochen)', 'Aufwand (PW)', 'Anzahl Tasks']

  const rows = phases.value.map((p) => {
    const phaseStart = addDays(projectStartDate.value, p.startDay ?? p.startWeek * 7)
    const phaseEnd = addDays(phaseStart, p.durationDays ?? (p.baseEffort + p.bufferEffort) * 7)
    return [
      p.name,
      format(phaseStart, 'dd.MM.yyyy', { locale: de }),
      format(phaseEnd, 'dd.MM.yyyy', { locale: de }),
      p.baseEffort.toFixed(1).replace('.', ','),
      p.bufferEffort.toFixed(1).replace('.', ','),
      (p.baseEffort + p.bufferEffort).toFixed(1).replace('.', ','),
      p.effortPersonWeeks.toFixed(1).replace('.', ','),
      (p.tasks?.length || 0).toString(),
    ]
  })

  const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(';')).join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `projekt-gantt-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div style="padding: 40px">
    <h1>Projekt-Gantt-Chart</h1>

    <!-- Aktionsleiste -->
    <div class="action-bar">
      <button class="btn-primary" @click="goBack">← Zurück</button>
      <button class="btn-secondary" @click="exportToCSV">Download CSV</button>
    </div>

    <!-- Legende & Zoom-Einstellungen -->
    <div class="form-card">
      <div style="margin-top: 16px; display: flex; gap: 20px; align-items: center; font-size: 14px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 6px">
          <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 3px"></div>
          <span>Basisaufwand</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px">
          <div style="width: 16px; height: 16px; background: #10b981; border-radius: 3px"></div>
          <span>Pufferzeit</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px">
          <span>Personenwoche (PW) = 5 Tage á 8 h</span>
        </div>

        <div class="zoom-toggle" style="margin-left: auto">
          <button
            v-for="level in (['days', 'weeks', 'months', 'years'] as ZoomLevel[])"
            :key="level"
            :class="['zoom-btn', { active: zoom === level }]"
            @click="zoom = level"
          >
            {{ zoomLabels[level] }}
          </button>
        </div>
      </div>
    </div>

    <!-- Gantt Chart Container -->
    <div class="timeline-scroll" ref="timelineContainer">
      <div :style="{ minWidth: timelineMinWidth }">

        <!-- Timeline Header (Daten / Kalenderwochen) -->
        <div class="timeline-header">
          <div class="timeline-label" style="color: transparent">Phase</div>
          <div class="timeline-weeks" style="position: relative; display: flex; flex-direction: column;">

            <!-- Obere Zeile (Monate / Jahre) -->
            <div v-if="timelineHeaders.upper.length" style="position: relative; height: 20px; border-bottom: 1px solid #d1d5db;">
              <div v-for="(h, i) in timelineHeaders.upper" :key="'u'+i" class="header-upper-item" :style="{ left: h.left }">
                {{ h.label }}
              </div>
            </div>

            <!-- Untere Zeile (Tage / Wochen) -->
            <div style="position: relative; height: 24px; flex: 1;">
              <div v-for="(h, i) in timelineHeaders.lower" :key="'l'+i" class="week-column"
                   :style="{ position: 'absolute', left: h.left, width: h.width || 'auto' }">
                {{ h.label }}
              </div>
            </div>
          </div>
        </div>

        <!-- Phasen (Zeilen im Diagramm) -->
        <div v-for="(phase, i) in phases" :key="i" class="timeline-row">

          <!-- Linke Spalte: Name & Aufwand -->
          <div class="timeline-label">
            <div class="phase-name">{{ phase.name }}</div>
            <div class="phase-pw">{{ phase.effortPersonWeeks.toFixed(1) }} PW</div>
          </div>

          <!-- Rechte Spalte: Balken-Bereich -->
          <div class="timeline-body">
            <!-- Grid-Hintergrundlinien -->
            <div class="grid">
              <div v-for="(h, i) in timelineHeaders.lower" :key="i" class="grid-column"
                   :style="{ position: 'absolute', left: h.left, width: h.width || '1px', height: '100%' }">
              </div>
            </div>

            <!-- Basisaufwand-Balken -->
            <div v-if="phase.baseDurationDays > 0"
                 class="GanttBalken basis clickable"
                 :style="{ left: barLeft(phase.startDay), width: barWidth(phase.baseDurationDays) }"
                 @click="openTaskModal(phase)"
                 title="Klicken für Task-Details">
              {{ phase.name }}
            </div>

            <!-- Puffer-Balken -->
            <div v-if="phase.bufferDurationDays > 0"
                 class="GanttBalken puffer"
                 :style="{ left: barLeft(phase.startDay + phase.baseDurationDays), width: barWidth(phase.bufferDurationDays) }">
              Puffer
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zusammenfassung -->
    <div class="form-card">
      <h2>Aufwands-Zusammenfassung</h2>
      <div class="labels">
        <div>Basisaufwand</div>
        <div>Puffer</div>
        <div>Gesamtaufwand</div>
      </div>
      <div class="weeks">
        <div class="basis">{{ baseEffortTotal }} PW</div>
        <div class="puffer">{{ pufferWeeks }}</div>
        <div>{{ baseAndPufferTotal }} PW</div>
      </div>
    </div>

    <!-- Task Details Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTaskModal && selectedPhase" class="modal-overlay" @click="closeTaskModal">
          <div class="modal-container" @click.stop>

            <div class="modal-header">
              <h2>{{ selectedPhase.name || 'Phase Details' }}</h2>
              <button class="modal-close" @click="closeTaskModal">✕</button>
            </div>

            <div class="modal-body">
              <!-- Phasen-Metriken -->
              <div class="phase-info">
                <div class="info-item">
                  <span class="info-label">Gesamt-Aufwand:</span>
                  <span class="info-value">{{ selectedPhase.effortPersonWeeks?.toFixed(1) || '0.0' }} PW</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Anzahl Tasks:</span>
                  <span class="info-value">{{ selectedPhase.tasks?.length || 0 }}</span>
                </div>
                <div class="info-item clickable-toggle">
                  <span class="info-label">Anzeige in:</span>
                  <button class="btn-secondary" @click="toggleUnit">
                    {{ showHours ? 'In Tagen anzeigen' : 'In Stunden anzeigen' }}
                  </button>
                </div>
              </div>

              <!-- Task-Liste -->
              <div v-if="selectedPhase.tasks?.length" class="task-list">
                <h3>Projekt-Tasks</h3>
                <div v-for="task in selectedPhase.tasks" :key="task.id" class="task-item">
                  <div class="task-header">
                    <span class="task-title">{{ task.title || getTaskTitle(task.taskType) }}</span>
                    <span class="task-status-badge" :style="{ backgroundColor: getStatusColor(task.status) }"></span>
                  </div>
                  <div class="task-details">
                    <div class="task-detail-item">
                      <span class="detail-icon">⏱️</span>
                      <span>{{ formatDuration(task.estimatedDuration) }}</span>
                    </div>
                    <div v-if="task.taskType && task.taskType !== 'CUSTOM'" class="task-detail-item">
                      <span class="detail-icon">🏷️</span>
                      <span class="task-type">{{ task.taskType.replace(/_/g, ' ') }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-tasks">
                <p>📋 Keine Tasks für diese Phase vorhanden.</p>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeTaskModal">Schließen</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ========================================================================== */
/* BASIS LAYOUT                                                               */
/* ========================================================================== */
.form-card + .timeline-scroll {
  margin-top: 40px;
  margin-bottom: 64px;
}
.action-bar { display: flex; gap: 12px; margin-bottom: 24px; }

/* ========================================================================== */
/* ZOOM TOGGLE BUTTONS                                                        */
/* ========================================================================== */
.zoom-toggle {
  display: flex; gap: 4px; background: #f3f4f6; border-radius: 8px; padding: 4px;
}
.zoom-btn {
  padding: 6px 16px; border: none; border-radius: 6px; background: transparent;
  font-size: 13px; cursor: pointer; color: #6b7280; transition: all 0.15s; font-weight: 500;
}
.zoom-btn.active {
  background: white; color: #1f2937; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.zoom-btn:hover:not(.active) { color: #374151; background: #e5e7eb; }

/* ========================================================================== */
/* GANTT TIMELINE & SCROLLBAR                                                 */
/* ========================================================================== */
.timeline-scroll { overflow-x: auto; width: 100%; }

/* Scrollbar Styling */
.timeline-scroll { scrollbar-width: auto; scrollbar-color: #3b82f6 #e5e7eb; }
.timeline-scroll::-webkit-scrollbar { height: 12px; }
.timeline-scroll::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 8px; margin: 0 4px; }
.timeline-scroll::-webkit-scrollbar-thumb { background-color: #9ca3af; border-radius: 8px; border: 3px solid #f3f4f6; }
.timeline-scroll::-webkit-scrollbar-thumb:hover { background-color: #3b82f6; }

/* Header & Grid */
.timeline-header {
  display: flex; border-bottom: 1px solid #ccc; background: #e5e5e5;
  font-weight: bold; border-top-left-radius: 20px; border-top-right-radius: 20px;
}
.timeline-weeks { flex-grow: 1; width: 100%; }
.header-upper-item {
  position: absolute; font-size: 11px; color: #6b7280; font-weight: 600;
  padding-left: 4px; border-left: 1px dashed #d1d5db; white-space: nowrap; line-height: 20px;
}
.week-column {
  border-left: 1px solid #fff; text-align: left; padding-left: 4px; border-left: 1px solid #ccc;
  height: 100%; font-size: 11px; white-space: nowrap;
}

/* Fixierte linke Spalte (Sticky) */
.timeline-label {
  width: 220px; padding: 8px; flex-shrink: 0; display: flex; flex-direction: column;
  justify-content: center; overflow: hidden; min-width: 220px; background: white;
  position: sticky; left: 0; z-index: 10; border-right: 1px solid #e5e7eb;
}
.timeline-header .timeline-label { background: #e5e5e5; z-index: 20; }
.phase-name { font-weight: bold; font-size: 14px; line-height: 1.2; }
.phase-pw { font-size: 12px; color: #6b7280; margin-top: 2px; }

/* Zeilen & Balken */
.timeline-row { display: flex; border-bottom: 1px solid #eee; height: 60px; position: relative; background: #fff; }
.timeline-body { flex: 1; position: relative; height: 100%; }
.grid { display: flex; position: absolute; inset: 0; width: 100%; }
.grid-column { border-left: 1px solid #f0f0f0; flex: 0 0 auto; box-sizing: border-box; }

.GanttBalken {
  top: 6px; height: 40px; line-height: 40px; text-align: center; color: white;
  border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); position: absolute;
  padding: 0 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  font-size: 13px; font-weight: 500;
}
.GanttBalken.basis { background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%); }
.GanttBalken.puffer { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
.GanttBalken.clickable { cursor: pointer; transition: all 0.2s ease; }
.GanttBalken.clickable:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.25); filter: brightness(1.1); }

/* ========================================================================== */
/* AUFWANDS-ZUSAMMENFASSUNG (FOOTER)                                          */
/* ========================================================================== */
.weeks, .labels { display: flex; justify-content: space-around; width: 100%; }
.labels { font-weight: bold; margin-bottom: 4px; }
.weeks div { flex: 1; text-align: center; padding: 4px 0; font-size: 20px; font-weight: bold; }
.weeks .basis { color: #3b82f6; }
.weeks .puffer { color: #10b981; }
.labels div { flex: 1; text-align: center; padding: 4px 0; }

/* ========================================================================== */
/* MODAL STYLING                                                              */
/* ========================================================================== */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
.modal-container {
  background: white; border-radius: 12px; width: 90%; max-width: 700px; max-height: 85vh;
  display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: modalSlideIn 0.3s ease;
}
@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
.modal-header h2 { margin: 0; font-size: 1.5rem; color: #1f2937; }
.modal-close { background: none; border: none; font-size: 1.5rem; color: #9ca3af; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 4px; transition: all 0.2s; }
.modal-close:hover { background: #f3f4f6; color: #374151; }
.modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
.phase-info { display: flex; gap: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 1.5rem; }
.info-item { display: flex; flex-direction: column; gap: 0.25rem; }
.info-label { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
.info-value { font-size: 1.125rem; font-weight: 600; color: #1f2937; }
.task-list h3 { margin-bottom: 1rem; font-size: 1.125rem; color: #374151; }
.task-item { padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 0.75rem; transition: all 0.2s; }
.task-item:hover { border-color: #3b82f6; background: #eff6ff; box-shadow: 0 2px 4px rgba(59,130,246,0.1); }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.task-title { font-weight: 600; color: #1f2937; font-size: 1rem; }
.task-status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: white; text-transform: uppercase; }
.task-details { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.task-detail-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6b7280; }
.task-type { font-family: 'Courier New', monospace; font-size: 0.75rem; color: #6b7280; text-transform: capitalize; }
.no-tasks { text-align: center; padding: 3rem 1rem; color: #9ca3af; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; }
.modal-fade-enter-active .modal-container, .modal-fade-leave-active .modal-container { transition: transform 0.3s ease; }
.modal-fade-enter-from .modal-container, .modal-fade-leave-to .modal-container { transform: translateY(-20px) scale(0.95); }

@media (max-width: 768px) {
  .modal-container { width: 95%; max-height: 90vh; }
  .phase-info { flex-direction: column; gap: 1rem; }
  .task-details { flex-direction: column; gap: 0.5rem; }
}
</style>
