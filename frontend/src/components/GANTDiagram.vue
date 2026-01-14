<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import type { ProjectMetrics } from '@/types'
import { mapBackendToMetrics } from '@/utils/mappingGANT'
import api from '@/api'
import router from '@/router/PathRouting'
import { TASK_LABELS } from '@/utils/constants'

const props = defineProps<{ id: string }>()
const projectId = Number(props.id)
const phases = ref<any[]>([])
const containerWidth = ref(800)
const timelineContainer = ref<HTMLDivElement | null>(null)
const labelWidth = 220
const containerPadding = 40

// Modal State
const showTaskModal = ref(false)
const selectedPhase = ref<any | null>(null)

// Task-Titel aus Constants holen
function getTaskTitle(taskType: string): string {
  return TASK_LABELS[taskType] || taskType.replace(/_/g, ' ')
}

// Task Modal öffnen
function openTaskModal(phase: any) {
  console.log('📊 Opening modal for phase:', {
    name: phase.name,
    tasks: phase.tasks,
    tasksLength: phase.tasks?.length,
    effortPersonWeeks: phase.effortPersonWeeks
  })

  selectedPhase.value = phase
  showTaskModal.value = true
}

// Task Modal schließen
function closeTaskModal() {
  showTaskModal.value = false
  selectedPhase.value = null
}

// Task Status Badge Farbe
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'TODO': '#9ca3af',
    'IN_PROGRESS': '#3b82f6',
    'BLOCKED': '#ef4444',
    'DONE': '#10b981'
  }
  return colors[status] || '#6b7280'
}

// Task Status Label
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'TODO': 'Offen',
    'IN_PROGRESS': 'In Bearbeitung',
    'BLOCKED': 'Blockiert',
    'DONE': 'Fertig'
  }
  return labels[status] || status
}

// Dauer formatieren
function formatDuration(days: number | null): string {
  if (!days) return '–'
  if (days === 1) return '1 Tag'
  if (days < 7) return `${days} Tage`
  const weeks = (days / 7).toFixed(1)
  return `${weeks} Wochen (${days} Tage)`
}

// Download Funktion
function exportToCSV() {
  const headers = ['Phase', 'Start (Woche)', 'Dauer (Wochen)', 'Gesamt-Aufwand (PW)']
  const rows = phases.value.map((p) => [
    p.name,
    p.startWeek + 1,
    (p.baseEffort + p.bufferEffort).toFixed(1),
    p.effortPersonWeeks.toFixed(1).replace('.', ','),
  ])
  const csvContent =
    '\uFEFF' + // UTF-8 BOM für Excel
    [headers, ...rows]
      .map((r) => r.join(';'))
      .join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'project-gantt.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Gesamtanzahl der Wochen
const totalWeeks = computed(() => {
  if (!phases.value.length) return 0
  return Math.max(...phases.value.map((p) => p.startWeek + p.baseEffort + p.bufferEffort))
})

// Gesamtaufwand - Basis + Puffer
const baseandpuffer = computed(() => {
  const base = phases.value.reduce((sum, p) => sum + (p.baseEffort ?? 0), 0)
  const buffer = phases.value.reduce((sum, p) => sum + (p.bufferEffort ?? 0), 0)
  return (base + buffer).toFixed(1)
})

// Gesamtbasisaufwand
const baseEffortTotal = computed(() => {
  const base = phases.value.reduce((sum, p) => sum + (p.baseEffort ?? 0), 0)
  return base.toFixed(1)
})

// Pufferwochen
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
  router.push({ name: 'dashboard', params: { id: props.id } })
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
    containerWidth.value = timelineContainer.value.clientWidth - 220
  }

  try {
    const backendGantt = await api.getTimeline(projectId)
    const metrics: ProjectMetrics = mapBackendToMetrics(backendGantt)

    // Direktes Mapping ohne doppelte Berechnung
    phases.value = metrics.phases.map((p) => ({
      ...p,
      startWeek: p.startWeek ?? 0,
      baseEffort: p.baseEffort ?? 0,
      bufferEffort: p.bufferEffort ?? 0,
      effortPersonWeeks: p.effortPersonWeeks ?? 0,
      tasks: p.tasks || []
    }))

    console.log('📊 Gantt Phases loaded:', phases.value)
  } catch (e) {
    console.error('❌ Timeline konnte nicht geladen werden', e)
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

          <!-- Basis-Balken (blau) - Clickable -->
          <div
            v-if="phase.baseEffort > 0"
            class="GanttBalken basis clickable"
            :style="{
              left: (phase.startWeek / totalWeeks) * 100 + '%',
              width: (phase.baseEffort / totalWeeks) * 100 + '%',
            }"
            @click="openTaskModal(phase)"
            :title="`Klicken für Task-Details`"
          >
            {{ phase.name }}
          </div>

          <!-- Puffer-Balken (grün) -->
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

    <!-- Aufwands-Zusammenfassung -->
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

    <!-- TASK DETAILS MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTaskModal && selectedPhase" class="modal-overlay" @click="closeTaskModal">
          <div class="modal-container" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <h2>{{ selectedPhase.name || 'Phase Details' }}</h2>
              <button class="modal-close" @click="closeTaskModal">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <!-- Phase Info -->
              <div class="phase-info">
                <div class="info-item">
                  <span class="info-label">Gesamt-Aufwand:</span>
                  <span class="info-value">
                {{ selectedPhase.effortPersonWeeks ? selectedPhase.effortPersonWeeks.toFixed(1) : '0.0' }} PW
              </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Anzahl Tasks:</span>
                  <span class="info-value">
                {{ (selectedPhase.tasks && Array.isArray(selectedPhase.tasks)) ? selectedPhase.tasks.length : 0 }}
              </span>
                </div>
              </div>

              <!-- Task Liste -->
              <div v-if="selectedPhase.tasks && selectedPhase.tasks.length > 0" class="task-list">
                <h3>Projekt-Tasks</h3>
                <div
                  v-for="task in selectedPhase.tasks"
                  :key="task.id"
                  class="task-item"
                >
                  <div class="task-header">
                    <span class="task-title">{{ task.title || getTaskTitle(task.taskType) }}</span>
                    <span
                      class="task-status-badge"
                      :style="{ backgroundColor: getStatusColor(task.status) }"
                    >
                  {{ getStatusLabel(task.status) }}
                </span>
                  </div>
                  <div class="task-details">
                    <div class="task-detail-item">
                      <span class="detail-icon">⏱️</span>
                      <span>{{ task.estimatedDuration }}</span>
                    </div>
                    <div v-if="task.taskType && task.taskType !== 'CUSTOM'" class="task-detail-item">
                      <span class="detail-icon">🏷️</span>
                      <span class="task-type">{{ task.taskType.replace(/_/g, ' ') }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Keine Tasks -->
              <div v-else class="no-tasks">
                <p>📋 Keine Tasks für diese Phase vorhanden.</p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeTaskModal">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  overflow-x: auto;
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
  color: #6b7280;
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
  font-size: 13px;
  font-weight: 500;
}

.GanttBalken.basis {
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
}

.GanttBalken.puffer {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

/* Clickable Balken */
.GanttBalken.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.GanttBalken.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
  filter: brightness(1.1);
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.phase-info {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.task-list h3 {
  margin-bottom: 1rem;
  font-size: 1.125rem;
  color: #374151;
}

.task-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.task-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.task-status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-details {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.task-detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-icon {
  font-size: 1rem;
}

.task-type {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: capitalize;
}

.no-tasks {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.no-tasks p {
  margin: 0;
  font-size: 1rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }

  .phase-info {
    flex-direction: column;
    gap: 1rem;
  }

  .task-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
