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

// Download Funktion
function exportToCSV() {
  const headers = ['Phase', 'Start (Woche)', 'Dauer (Wochen)', 'Gesamt-Aufwand (PW)']
  const rows = phases.value.map((p) => [
    p.name,
    p.startWeek + 1,
    p.totalDurationWeeks.toFixed(1),
    p.effortPersonWeeks.toFixed(1).replace('.', ','),
  ])
  const csvContent =
    '\uFEFF' + // UTF-8 BOM für Excel
    [headers, ...rows]
      .map((r) => r.join(';')) // Semikolon!
      .join('\n')
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
  return Math.max(...phases.value.map((p) => p.startWeek + p.totalDurationWeeks))
})
computed(() => {
  if (!phases.value || !phases.value.length) return 0
  return phases.value.reduce((sum, p) => sum + (p.effortPersonWeeks ?? 0), 0)
})
//Gesamtaufwand - Puffer + Basisaufwand
const baseandpuffer = computed(() => {
  const base = phases.value.reduce((sum, p) => sum + (p.baseEffort ?? 0), 0)
  const buffer = phases.value.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0)
  return (base + buffer).toFixed(1)
})
//Gesamtbasisaufwand
const baseEffortTotal = computed(() => {
  const base = phases.value.reduce((sum, p) => sum + (p.baseEffort ?? 0), 0)
  return base.toFixed(1)
})
// Anzahl Pufferwochen
const pufferWeeks = computed(() => {
  const buffer = phases.value.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0)
  return buffer > 0 ? `${buffer.toFixed(1)} PW` : '–'
})

const updateContainerWidth = () => {
  if (timelineContainer.value) {
    containerWidth.value = timelineContainer.value.clientWidth - labelWidth - containerPadding * 2
  }
}

function goBack() {
  router.push({ name: 'dashboard' })
}

//header anpassen an Anzahl der Wochen
const headerUnit = computed(() => {
  const weeks = totalWeeks.value || 1

  if (weeks <= 8) return { label: 'W', step: 1 } // jede Woche (bis 2 Monate)
  if (weeks <= 16) return { label: 'W', step: 2 } // jede 2 Wochen (bis 4 Monate)
  if (weeks <= 52) return { label: 'M', step: 4 } // monatlich (bis 1 Jahr)
  if (weeks <= 104) return { label: 'M', step: 8 } // alle 2 Monate (bis 2 Jahre)
  if (weeks <= 156) return { label: 'M', step: 12 } // vierteljährlich (bis 3 Jahre)
  return { label: 'M', step: 24 } // halbjährlich (über 3 Jahre)
})

const headerSteps = computed(() => {
  const step = headerUnit.value.step
  const steps: number[] = []
  for (let i = 0; i < totalWeeks.value; i += step) {
    steps.push(i)
  }
  return steps
})

// Daten laden
onMounted(async () => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
  await nextTick()
  if (timelineContainer.value) {
    containerWidth.value = timelineContainer.value.clientWidth - 220 // 220px für Phase-Label
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
      })

      // Konvertiere Dauer von Tagen in Wochen
      const baseDurationWeeks = (p.baseDuration ?? 0) / 7
      const bufferDurationWeeks = (p.bufferDuration ?? 0) / 7
      const totalDurationWeeks = baseDurationWeeks + bufferDurationWeeks

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

      // Nächste Phase beginnt nach Basis + Puffer Aufwand
      currentWeek += phase.baseEffort + phase.bufferEffort
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
      <button class="btn-secondary" @click="exportToCSV">Download</button>
    </div>
    <div class="form-card">
      <div style="margin-top: 16px; display: flex; gap: 20px; align-items: center; font-size: 14px">
        <div style="display: flex; align-items: center; gap: 6px">
          <div style="width: 16px; height: 16px; background: #3b82f6; border-radius: 3px"></div>
          <span>Basisaufwand</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px">
          <div style="width: 16px; height: 16px; background: #10b981; border-radius: 3px"></div>
          <span>Pufferzeit</span>
        </div>
      </div>
    </div>

    <!-- Timeline Container -->
    <div class="timeline-scroll" ref="timelineContainer">
      <!-- Header -->
      <div class="timeline-header">
        <div class="timeline-label">Phase</div>
        <div v-if="phases.length" class="timeline-weeks">
          <div
            v-for="w in headerSteps"
            :key="w"
            class="week-column"
            :style="{ width: (headerUnit.step / totalWeeks) * 100 + '%' }"
          >
            {{ w + 1 }} {{ headerUnit.label }}
          </div>
        </div>
      </div>

      <!-- Rows -->
      <div v-for="(phase, i) in phases" :key="i" class="timeline-row">
        <!-- Label -->
        <div class="timeline-label">
          <div class="phase-name">{{ phase.name }}</div>
          <div class="phase-pw">{{ phase.effortPersonWeeks.toFixed(1) }} PW</div>
        </div>
        <!-- Timeline -->
        <div class="timeline-body">
          <!-- Grid -->
          <div class="grid">
            <div
              v-for="w in headerSteps"
              :key="w"
              class="grid-column"
              :style="{ width: (headerUnit.step / totalWeeks) * 100 + '%' }"
            ></div>
          </div>

          <!-- Phase Bars: Basis + Puffer -->
          <!-- Basis-Balken (blau) -->
          <div
            v-if="phase.baseEffort > 0"
            class="GanttBalken basis"
            :style="{
              left: (phase.startWeek / totalWeeks) * 100 + '%',
              width: (phase.baseEffort / totalWeeks) * 100 + '%',
            }"
          >
            {{ phase.name }}
          </div>

          <!-- Puffer-Balken (grün) - direkt nach Basis -->
          <div
            v-if="phase.bufferEffort > 0"
            class="GanttBalken puffer"
            :style="{
              left: ((phase.startWeek + phase.baseEffort) / totalWeeks) * 100 + '%',
              width: (phase.bufferEffort / totalWeeks) * 100 + '%',
            }"
          >
            Puffer
          </div>
        </div>
      </div>
    </div>

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
        <div>{{ baseandpuffer }} PW</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-card + .timeline-scroll {
  margin-top: 40px;
  margin-bottom: 64px;
}

.weeks {
  display: flex;
  justify-content: space-around;
  width: 100%;
}
.labels {
  font-weight: bold;
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 4px;
}

.weeks div {
  flex: 1;
  text-align: center;
  padding: 4px 0;
  font-size: 20px;
  font-weight: bold;
}
.weeks .basis {
  color: #3b82f6;
}
.weeks .puffer {
  color: #10b981;
}
.labels div {
  flex: 1;
  text-align: center;
  padding: 4px 0;
}

.timeline-scroll {
  overflow-x: auto; /* scroll bei Überlauf */
}

/* Header */
.timeline-header {
  display: flex;
  border-bottom: 1px solid #ccc;
  background: #e5e5e5;
  font-weight: bold;
  min-width: max-content;
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
}

.phase-pw {
  font-size: 12px;
  font-weight: normal;
  color: #6b7280; /* dezentes Grau */
  margin-top: 2px;
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
  flex: 0 0 auto;
  flex-grow: 1;
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
}

.grid-column {
  border-left: 1px solid #f0f0f0;
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  flex-grow: 1;
}

/* Phase Balken */
.GanttBalken {
  top: 6px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  position: absolute;
  padding: 0 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
  font-size: 13px;
  font-weight: 500;
}

.GanttBalken.basis {
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
}

.GanttBalken.puffer {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px; /* ← DAS ist der Abstand */
}
</style>
