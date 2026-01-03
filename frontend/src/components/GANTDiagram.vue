<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ProjectMetrics, Phase } from '@/types'
import { mapBackendToMetrics } from '@/utils/mappingGANT'
import { Download, Users, Info, Calendar, Clock } from 'lucide-vue-next'
import api from '@/api'

const props = defineProps<{ projectId: number }>()

const metrics = ref<ProjectMetrics | null>(null)
const hoveredPhase = ref<number | null>(null)

const weekWidth = 50
const rowHeight = 50

const totalWeeks = computed(() =>
  metrics.value
    ? Math.max(...metrics.value.phases.map(p => (p.startWeek || 0) + (p.durationWeeks || 1)))
    : 0
)

function exportToCSV() {
  if (!metrics.value) return

  const headers = ['Phase', 'Start (Woche)', 'Dauer (Wochen)', 'Gesamt-Aufwand (PW)']
  const rows = metrics.value.phases.map(p => [
    p.name,
    (p.startWeek || 0) + 1,
    p.durationWeeks,
    p.effortPersonWeeks.toFixed(1)
  ])

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'project-gantt.csv'
  a.click()
}

onMounted(async () => {
  try {
    const backendGantt = await api.getTimeline(props.projectId)
    metrics.value = mapBackendToMetrics(backendGantt)

    // TEMP: Wenn startWeek = 0 für alle Phasen, Balken nebeneinander anzeigen
    metrics.value.phases.forEach((phase, idx) => {
      if (!phase.startWeek || phase.startWeek === 0) {
        phase.startWeek = idx // jede Phase startet nach der vorherigen
      }
    })

    console.log('Phases:', metrics.value.phases)
  } catch (e) {
    console.error('Timeline konnte nicht geladen werden', e)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div v-if="!metrics" class="text-center text-gray-500 p-10">
      Lade Projekt-Timeline …
    </div>

    <div v-else class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold">Projekt-Gantt-Chart</h1>
            <p class="text-gray-600">Data Science Lifecycle</p>
          </div>
          <button @click="exportToCSV" class="btn-secondary flex items-center gap-2">
            <Download :size="18" />
            CSV Export
          </button>
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-4 gap-4 border-t pt-4">
          <div class="flex items-center gap-3">
            <Calendar class="text-blue-600" :size="20" />
            <div>
              <div class="text-sm text-gray-600">Dauer</div>
              <div class="font-semibold">{{ metrics.durationWeeks }} Wochen</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Clock class="text-green-600" :size="20" />
            <div>
              <div class="text-sm text-gray-600">Aufwand</div>
              <div class="font-semibold">{{ metrics.effortPersonWeeks }} PW</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Users class="text-purple-600" :size="20" />
            <div>
              <div class="text-sm text-gray-600">Story Points</div>
              <div class="font-semibold">{{ metrics.storyPoints }} SP</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Info class="text-orange-600" :size="20" />
            <div>
              <div class="text-sm text-gray-600">Projektgröße</div>
              <div class="font-semibold">{{ metrics.projectSize }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gantt -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Header -->
        <div class="flex border-b bg-gray-50">
          <div class="w-72 p-3 font-semibold border-r">Phase</div>
          <div class="flex-1 overflow-x-auto">
            <div class="flex" :style="{ minWidth: totalWeeks * weekWidth + 'px' }">
              <div
                v-for="i in totalWeeks"
                :key="i"
                class="border-r text-xs text-center py-3"
                :style="{ width: weekWidth + 'px' }"
              >
                W{{ i }}
              </div>
            </div>
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="(phase, idx) in metrics.phases"
          :key="idx"
          class="flex border-b hover:bg-gray-50 h-12 relative"
          @mouseenter="hoveredPhase = idx"
          @mouseleave="hoveredPhase = null"
        >
          <!-- Phase label -->
          <div class="w-72 p-3 border-r">
            <div class="font-medium text-sm">{{ phase.name }}</div>
            <div class="text-xs text-gray-500">
              {{ phase.effortPersonWeeks.toFixed(1) }} PW
            </div>
          </div>

          <!-- Timeline -->
          <div class="flex-1 overflow-x-auto">
            <div
              class="relative"
              :style="{ minWidth: totalWeeks * weekWidth + 'px', height: rowHeight + 'px' }"
            >
              <!-- Balken -->
              <div
                class="absolute bg-blue-500 text-white text-xs font-semibold flex items-center justify-center rounded"
                :style="{
                  left: phase.startWeek * weekWidth + 'px',
                  width: phase.durationWeeks * weekWidth + 'px',
                  height: rowHeight - 8 + 'px'
                }"
              >
                {{ phase.effortPersonWeeks.toFixed(1) }} PW
              </div>

              <!-- Tooltip -->
              <div
                v-if="hoveredPhase === idx"
                class="absolute bg-gray-900 text-white text-xs rounded-lg p-3 z-10"
                :style="{ left: phase.startWeek * weekWidth + 'px', top: '-110px', width: '220px' }"
              >
                <div class="font-semibold mb-1">{{ phase.name }}</div>
                <div>Start: Woche {{ phase.startWeek + 1 }}</div>
                <div>Dauer: {{ phase.durationWeeks }} Wochen</div>
                <div class="mt-1 border-t border-gray-700 pt-1">
                  Gesamt: {{ phase.effortPersonWeeks.toFixed(1) }} PW
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Optional: Tooltip über allen anderen Elementen sichtbar */
</style>
