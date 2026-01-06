<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import type { ProjectMetrics } from '@/types'
import { mapBackendToMetrics } from '@/utils/mappingGANT'
import api from '@/api'
import router from '@/router'

const props = defineProps<{ id: string }>()
const projectId = Number(props.id)
const phases = ref<any[]>([])
const containerWidth = ref(800)
const timelineContainer = ref<HTMLDivElement | null>(null)
const labelWidth = 220
const containerPadding = 40

function exportToCSV() {
  const headers = [
    'Phase',
    'Start (Woche)',
    'Ende (Woche)',
    'Dauer (Wochen)',
    'Basis (PW)',
    'Puffer (PW)',
    'Gesamt-Aufwand (PW)',
  ]

  const rows = phases.value.map((p) => [
    p.name,
    (p.startWeek + 1).toFixed(0),
    (p.startWeek + p.totalDurationWeeks + 1).toFixed(0),
    p.totalDurationWeeks.toFixed(1),
    p.baseEffort.toFixed(1).replace('.', ','),
    p.bufferEffort.toFixed(1).replace('.', ','),
    p.effortPersonWeeks.toFixed(1).replace('.', ','),
  ])

  const csvContent = '\uFEFF' + [headers, ...rows].map((r) => r.join(';')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'project-gantt.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Gesamtanzahl der Wochen basierend auf tatsächlicher Dauer
const totalWeeks = computed(() => {
  if (!phases.value.length) return 0
  return Math.max(...phases.value.map((p) => p.startWeek + p.durationWeeks))
})

const totalEffort = computed(() => {
  if (!phases.value || !phases.value.length) return 0
  return phases.value.reduce((sum, p) => sum + (p.effortPersonWeeks ?? 0), 0)
})

const baseEffortTotal = computed(() => {
  const base = phases.value.reduce((sum, p) => sum + (p.baseEffort ?? 0), 0)
  return base.toFixed(1)
})

const pufferTotal = computed(() => {
  const buffer = phases.value.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0)
  return buffer > 0 ? `${buffer.toFixed(1)} PW` : '–'
})

const totalEffortFormatted = computed(() => {
  return totalEffort.value.toFixed(1)
})

const updateContainerWidth = () => {
  if (timelineContainer.value) {
    containerWidth.value = timelineContainer.value.clientWidth - labelWidth - containerPadding * 2
  }
}

function goBack() {
  router.push({ name: 'dashboard' })
}

// Header anpassen an Anzahl der Wochen
const headerUnit = computed(() => {
  const weeks = totalWeeks.value || 1

  if (weeks <= 8) return { label: 'W', step: 1 }
  if (weeks <= 16) return { label: 'W', step: 2 }
  if (weeks <= 52) return { label: 'M', step: 4 }
  if (weeks <= 104) return { label: 'M', step: 8 }
  if (weeks <= 156) return { label: 'M', step: 12 }
  return { label: 'M', step: 24 }
})

// Erstelle eine Spalte pro Woche
const weekColumns = computed(() => {
  const weeks = Math.ceil(totalWeeks.value) || 1
  const label = headerUnit.value.label
  const columns: Array<{ weekNumber: number; label: string }> = []

  for (let i = 0; i < weeks; i++) {
    let displayLabel = ''

    if (label === 'W') {
      // Wochen: zeige jede Wochennummer
      displayLabel = `${i + 1}W`
    } else {
      // Monate: zeige Wochennummer oder Monatsnummer
      // Bei vielen Wochen könnten wir auch Monate gruppieren
      if (weeks <= 52) {
        displayLabel = `${i + 1}W`
      } else {
        // Bei sehr vielen Wochen: zeige Monat
        displayLabel = `${Math.floor(i / 4) + 1}M`
      }
    }

    columns.push({
      weekNumber: i,
      label: displayLabel,
    })
  }

  return columns
})

// Daten laden
onMounted(async () => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
  await nextTick()
  if (timelineContainer.value) {
    containerWidth.value = timelineContainer.value.clientWidth - 220
  }

  try {
    const backendGantt = await api.getTimeline(projectId)
    const metrics: ProjectMetrics = mapBackendToMetrics(backendGantt)

    let currentWeek = 0
    phases.value = metrics.phases.map((p) => {
      console.log('Phase:', p.name, {
        baseEffort: p.baseEffort,
        bufferEffort: p.bufferEffort,
        baseDuration: p.baseDuration,
        bufferDuration: p.bufferDuration,
        durationWeeks: p.durationWeeks,
      })

      // Backend liefert baseDuration und bufferDuration bereits in Wochen
      const baseDurationWeeks = p.baseDuration ?? 0
      const bufferDurationWeeks = p.bufferDuration ?? 0
      const totalDurationWeeks = p.durationWeeks ?? baseDurationWeeks + bufferDurationWeeks

      const phase = {
        ...p,
        startWeek: currentWeek,
        baseDurationWeeks,
        bufferDurationWeeks,
        totalDurationWeeks,
        durationWeeks: p.durationWeeks ?? 1,
        effortPersonWeeks: p.effortPersonWeeks ?? 0,
        baseEffort: p.baseEffort ?? 0,
        bufferEffort: p.bufferEffort ?? 0,
      }

      // Nächste Phase beginnt nach der tatsächlichen durationWeeks
      currentWeek += phase.durationWeeks
      return phase
    })
  } catch (e) {
    console.error('Timeline konnte nicht geladen werden', e)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
})
</script>

<template>
  <div style="padding: 40px">
    <h1>Projekt-Gantt-Chart</h1>
    <div class="action-bar">
      <button class="btn-primary" @click="goBack">← Zurück</button>
      <button class="btn-secondary" @click="exportToCSV">Download CSV</button>
    </div>
    <div class="form-card">
      <div
        style="
          margin-top: 16px;
          display: flex;
          gap: 20px;
          align-items: center;
          font-size: 14px;
          flex-wrap: wrap;
        "
      >
        <div style="display: flex; align-items: center; gap: 6px">
          <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 3px"></div>
          <span style="color: #111827; font-weight: 500">Basisdauer</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px">
          <div style="width: 16px; height: 16px; background: #10b981; border-radius: 3px"></div>
          <span style="color: #111827; font-weight: 500">Pufferdauer (zeitlich)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px">
          <div
            style="
              width: 20px;
              height: 20px;
              background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 8px;
              font-weight: bold;
              border: 2px solid #e5e7eb;
            "
          >
            0.1
          </div>
          <span style="color: #111827; font-weight: 500">Puffer-Aufwand (PW)</span>
        </div>
        <div style="color: #6b7280; font-size: 12px; font-style: italic">
          Tipp: Bewege die Maus über Balken für Details
        </div>
      </div>
    </div>

    <!-- Timeline Container -->
    <div class="timeline-scroll" ref="timelineContainer">
      <!-- Header -->
      <div class="timeline-header">
        <div class="timeline-label">Phase</div>
        <div v-if="phases.length" class="timeline-weeks">
          <div v-for="col in weekColumns" :key="col.weekNumber" class="week-column">
            {{ col.label }}
          </div>
        </div>
      </div>

      <!-- Rows -->
      <div v-for="(phase, i) in phases" :key="i" class="timeline-row">
        <!-- Label -->
        <div class="timeline-label">
          <div class="phase-name">{{ phase.name }}</div>
          <div class="phase-info">
            <span class="phase-duration">{{ phase.durationWeeks.toFixed(1) }}w</span>
            <span class="phase-effort">{{ phase.effortPersonWeeks.toFixed(1) }} PW</span>
          </div>
        </div>
        <!-- Timeline -->
        <div class="timeline-body">
          <!-- Grid -->
          <div class="grid">
            <div v-for="col in weekColumns" :key="col.weekNumber" class="grid-column"></div>
          </div>

          <!-- Phase Bars: Basis + Puffer (ZEITBASIERT) -->
          <!-- Basis-Balken (blau) -->
          <div
            v-if="phase.baseDurationWeeks > 0"
            class="GanttBalken basis"
            :style="{
              left: (phase.startWeek / totalWeeks) * 100 + '%',
              width: (phase.baseDurationWeeks / totalWeeks) * 100 + '%',
            }"
            :title="`${phase.name}: ${phase.baseEffort.toFixed(1)} PW Basis-Aufwand, ${phase.baseDurationWeeks.toFixed(1)} Wochen`"
          >
            <span class="balken-text">{{ phase.name }}</span>
            <span class="balken-effort">
              {{ phase.baseEffort.toFixed(1) }} PW
              <span v-if="phase.bufferEffort > 0" style="opacity: 0.8">
                +{{ phase.bufferEffort.toFixed(1) }}</span
              >
            </span>
          </div>

          <!-- Puffer-Balken (grün) - nur wenn zeitlich groß genug -->
          <div
            v-if="phase.bufferDurationWeeks > 0 && phase.bufferDurationWeeks >= 0.05"
            class="GanttBalken puffer"
            :style="{
              left: ((phase.startWeek + phase.baseDurationWeeks) / totalWeeks) * 100 + '%',
              width: Math.max((phase.bufferDurationWeeks / totalWeeks) * 100, 1) + '%',
            }"
            :title="`Puffer: ${phase.bufferEffort.toFixed(1)} PW, ${phase.bufferDurationWeeks.toFixed(2)} Wochen`"
          >
            <span class="balken-text" style="font-size: 10px">Puffer</span>
            <span class="balken-effort" style="font-size: 9px"
              >{{ phase.bufferEffort.toFixed(1) }} PW</span
            >
          </div>

          <!-- Puffer-Badge (für Puffer mit Aufwand aber ohne/wenig Zeitdauer) -->
          <div
            v-if="
              phase.bufferEffort > 0 &&
              (!phase.bufferDurationWeeks || phase.bufferDurationWeeks < 0.05)
            "
            class="puffer-badge"
            :style="{
              left: ((phase.startWeek + phase.baseDurationWeeks) / totalWeeks) * 100 + '%',
            }"
            :title="`Puffer: ${phase.bufferEffort.toFixed(1)} PW${phase.bufferDurationWeeks ? ', ' + phase.bufferDurationWeeks.toFixed(2) + ' Wochen' : ''}`"
          >
            <div class="puffer-badge-icon">
              <span style="font-size: 10px; font-weight: bold">{{
                phase.bufferEffort.toFixed(1)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-card">
      <h2>Projekt-Zusammenfassung</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">Gesamtdauer</div>
          <div class="summary-value">{{ totalWeeks.toFixed(1) }} Wochen</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Gesamtaufwand</div>
          <div class="summary-value">{{ totalEffortFormatted }} PW</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Basisaufwand</div>
          <div class="summary-value basis">{{ baseEffortTotal }} PW</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Puffer</div>
          <div class="summary-value puffer">{{ pufferTotal }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-card + .timeline-scroll {
  margin-top: 40px;
  margin-bottom: 64px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.summary-label {
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 600;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #111827;
}

.summary-value.basis {
  color: #1e40af;
}

.summary-value.puffer {
  color: #047857;
}

.timeline-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.timeline-scroll > * {
  min-width: fit-content;
}

/* Scrollbar nur anzeigen wenn nötig - Webkit Browser (Chrome, Safari, Edge) */
.timeline-scroll::-webkit-scrollbar {
  height: 8px;
}

.timeline-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.timeline-scroll::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.timeline-scroll::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Firefox - moderne scrollbar-* Properties */
.timeline-scroll {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

/* Header */
.timeline-header {
  display: flex;
  border-bottom: 1px solid #ccc;
  background: #d1d5db;
  font-weight: bold;
  color: #111827;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.timeline-label {
  width: 220px;
  padding: 8px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.phase-name {
  font-weight: bold;
  font-size: 14px;
  line-height: 1.2;
  margin-bottom: 4px;
  color: #111827;
}

.phase-info {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-weight: normal;
}

.phase-duration {
  color: #1e40af;
  font-weight: 600;
}

.phase-effort {
  color: #374151;
  font-weight: 600;
}

.timeline-weeks {
  flex-grow: 1;
  display: flex;
  width: 100%;
}

.week-column {
  border-left: 1px solid #fff;
  text-align: center;
  padding: 4px 0;
  flex: 1 1 0;
  color: #111827;
  font-size: 13px;
}

/* Rows */
.timeline-row {
  display: flex;
  border-bottom: 1px solid #eee;
  height: 60px;
  position: relative;
  background: #fff;
}

.timeline-body {
  flex: 1;
  position: relative;
  height: 100%;
}

/* Grid */
.grid {
  display: flex;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.grid-column {
  border-left: 1px solid #f0f0f0;
  box-sizing: border-box;
  flex: 1 1 0;
}

/* Phase Balken */
.GanttBalken {
  top: 6px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  position: absolute;
  padding: 0 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
  font-size: 13px;
  font-weight: 500;
  cursor: help;
  transition: all 0.2s ease;
}

.GanttBalken:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
  transform: translateY(-1px);
  z-index: 10;
}

.balken-text {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  text-align: center;
  line-height: 1.2;
}

.balken-effort {
  font-size: 10px;
  opacity: 0.9;
  margin-top: 2px;
}

.GanttBalken.basis {
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
}

.GanttBalken.puffer {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

/* Puffer-Badge für Puffer ohne/mit wenig Zeitdauer */
.puffer-badge {
  position: absolute;
  top: 2px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  z-index: 15;
  transform: translateX(-14px);
}

.puffer-badge-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
  border: 2px solid white;
  transition: all 0.2s ease;
}

.puffer-badge:hover .puffer-badge-icon {
  transform: scale(1.2);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.6);
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
</style>
