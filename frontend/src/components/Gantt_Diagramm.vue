<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ProjectMetrics } from '@/types'
import { mapBackendToMetrics } from '@/utils/mapping'
import { Download, Users, Info, Calendar, Clock } from 'lucide-vue-next'
import api from '@/api'

const props = defineProps<{ projectId: number }>()
const metrics = ref<ProjectMetrics | null>(null)

const hoveredPhase = ref<number | null>(null)

const weekWidth = 50
const rowHeight = 50

const totalWeeks = computed(() =>
  metrics.value ? Math.max(...metrics.value.phases.map(p => p.startWeek + p.durationWeeks)) : 0
)

// CSV Export
function exportToCSV() {
  if (!metrics.value) return

  const headers = ['Phase', 'Start (Woche)', 'Dauer (Wochen)', 'Gesamt-Aufwand (PW)']
  const rows = metrics.value.phases.map(p => [
    p.name,
    p.startWeek + 1,
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
  const backendGantt = await api.getTimeline(props.projectId)
  metrics.value = mapBackendToMetrics(backendGantt)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Projekt-Gantt-Chart</h1>
            <p class="text-gray-600 mt-1">Data Science Lifecycle mit Risikopuffer</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="exportToCSV"
              class=btn-secondary
            >
              <Download size={18} />
              CSV Export
            </button>
          </div>
        </div>

        {/* Project Metadata */}
        <div class="grid grid-cols-4 gap-4 pt-4 border-t">
          <div class="flex items-center gap-3">
            <Calendar class="text-blue-600" size={20} />
            <div>
              <div class="text-sm text-gray-600">Dauer</div>
              <div class="font-semibold">{{ metrics.value.durationWeeks }} Wochen</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Clock class="text-green-600" size={20} />
            <div>
              <div class="text-sm text-gray-600">Aufwand</div>
              <div class="font-semibold">{{ metrics.value.effortPersonWeeks }} PW</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Users className="text-purple-600" size={20} />
            <div>
              <div class="text-sm text-gray-600">Story Points</div>
              <div class="font-semibold">{{ metrics.value.storyPoints }}SP</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Info class="text-orange-600" size={20} />
            <div>
              <div class="text-sm text-gray-600">Projektgröße</div>
              <div class="font-semibold">{{ metrics.value.projectSize }}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Buffer Info Card */}
      <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <Info class="text-yellow-600 mt-1 flex-shrink-0" size={20} />
          <div class="flex-1">
            <p class="font-semibold text-yellow-900">Risikopuffer eingerechnet</p>
            <p class="text-sm text-yellow-800 mt-1">
              Basierend auf dem Risiko-Level von {{ (metrics.value.effortBreakdown.riskLevel * 100).toFixed(0) }}%
              (Komplexität: {{ (metrics.value.categoryScores.complexity * 100).toFixed(0) }}%,
              Unsicherheit: {{ (metrics.value.categoryScores.uncertainty * 100).toFixed(0) }}%)
              wurde ein Puffer von <span
              class="font-semibold">{{ metrics.value.effortBreakdown.bufferEffort.toFixed(1) }} PW</span>
              ({{ (metrics.value.effortBreakdown.bufferPercentage * 100).toFixed(1) }}%) hinzugefügt.
            </p>
          </div>
        </div>
      </div>

      {/* Effort Breakdown Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Basis-Aufwand */}
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-600 mb-2">Basis-Aufwand</div>
          <div class="text-3xl font-bold text-blue-600">
            {{ metrics.value.effortBreakdown.baseEffort.toFixed(1) }} PW
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Geplante Arbeit ohne Puffer
          </div>
          <div class="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500"
              :style="{ width: '100%' }"
            />
          </div>
        </div>

        {/* Card 2: Risikopuffer */}
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-600 mb-2">Risikopuffer</div>
          <div class="text-3xl font-bold text-yellow-600">
            +{{ metrics.value.effortBreakdown.bufferEffort.toFixed(1) }} PW
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ (metrics.value.effortBreakdown.bufferPercentage * 100).toFixed(1) }}% Reserve
          </div>
          <div class="mt-3 h-2 bg-yellow-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-yellow-500"
              :style="{ width: `${metrics.value.effortBreakdown.bufferPercentage * 100}%` }"
            />
          </div>
        </div>

        {/* Card 3: Gesamt */}
        <div class="bg-white p-6 rounded-lg shadow border-2 border-green-500">
          <div class="text-sm text-gray-600 mb-2">Gesamt-Aufwand</div>
          <div class="text-3xl font-bold text-gray-900">
            {{ metrics.value.effortPersonWeeks.toFixed(1) }} PW
          </div>
          <div class="text-xs text-green-600 mt-1 font-medium">
            Empfohlene Schätzung
          </div>
          <div class="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full flex">
              <div
                class="bg-blue-500"
                :style="{ width: `${(metrics.value.effortBreakdown.baseEffort / metrics.value.effortPersonWeeks) * 100}%` }"
              />
              <div
                class="bg-yellow-400"
                :style="{ width: `${(metrics.value.effortBreakdown.bufferEffort / metrics.value.effortPersonWeeks) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div class="bg-white p-4 rounded-lg shadow flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="w-6 h-4 bg-blue-500 rounded"></div>
          <span class="text-sm text-gray-700">Basis-Aufwand</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-4 bg-yellow-400 rounded"></div>
          <span class="text-sm text-gray-700">Risikopuffer</span>
        </div>
        <div class="ml-auto text-sm text-gray-600">
          Gesamt: {totalWeeks} Wochen
        </div>
      </div>

      {/* Gantt Chart */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        {/* Timeline Header */}
        <div class="flex border-b border-gray-200 bg-gray-50">
          <div class="w-72 p-3 font-semibold text-gray-700 border-r border-gray-200">
            Phase
          </div>
          <div class="flex-1 relative overflow-x-auto">
            <div class="flex"
                 :style="{ minWidth: totalWeeks * weekWidth }">
              {Array.from({ length: totalWeeks }).map((_, i) => (
              <div
                key={i}
                class="border-r border-gray-200 text-center text-xs text-gray-600 py-3"
                :style="{ width: weekWidth, minWidth: weekWidth }"
              >
                W{i + 1}
              </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Rows */}
        {metrics.phases.map((phase, idx) => (
        <div
          key={idx}
          class="flex border-b border-gray-200 hover:bg-gray-50 transition-colors relative h-12"
          @mouseenter="hoveredPhase = idx"
          @mouseleave="hoveredPhase = null">
          <div
            v-for="(phase, idx) in metrics.phases"
            :key="idx"
            class="flex border-b border-gray-200 hover:bg-gray-50 transition-colors relative h-12"
            @mouseenter="hoveredPhase = idx"
            @mouseleave="hoveredPhase = null">

            <div class="w-72 p-3 border-r border-gray-200 flex flex-col justify-center">
              <div class="font-medium text-gray-800 text-sm">
                {{ phase.name }}
              </div>
              <div class="text-xs text-gray-500 mt-1 space-y-0.5">
                <div>Gesamt: {{ phase.effortPersonWeeks.toFixed(1) }} PW</div>
                <div
                  v-if="phase.bufferEffort && phase.bufferEffort > 0"
                  class="text-yellow-600">
                  Puffer: +{{ phase.bufferEffort.toFixed(1) }} PW
                </div>
              </div>
            </div>


            <div class="flex-1 relative overflow-x-auto">
              <div
                class="absolute inset-0"
                :style="{ minWidth: totalWeeks * weekWidth + 'px' }">
                <div class="absolute inset-0 flex">
                  <div
                    v-for="i in totalWeeks"
                    :key="i"
                    class="border-r border-gray-100"
                    :style="{ width: weekWidth + 'px', minWidth: weekWidth + 'px' }" />
                </div>

                <div
                  v-if="phase.baseDuration && phase.baseDuration > 0"
                  class="absolute top-2 bg-blue-500 rounded-l-md shadow-sm flex items-center justify-center text-white text-xs font-semibold"
                  :style="{
          left: phase.startWeek * weekWidth + 'px',
          width: phase.baseDuration * weekWidth + 'px',
          height: rowHeight - 16 + 'px'}">
                  {{ phase.baseEffort?.toFixed(1) }} PW
                </div>

                <div
                  v-if="phase.bufferDuration && phase.bufferDuration > 0"
                  class="absolute top-2 bg-yellow-400 rounded-r-md shadow-sm flex items-center justify-center text-gray-800 text-xs font-semibold"
                  :style="{
          left: (phase.startWeek + (phase.baseDuration || 0)) * weekWidth + 'px',
          width: phase.bufferDuration * weekWidth + 'px',
          height: rowHeight - 16 + 'px' }">
                  +{{ phase.bufferEffort?.toFixed(1) }}
                </div>

                <div
                  v-if="hoveredPhase === idx"
                  class="absolute bg-gray-900 text-white text-xs rounded-lg p-3 pointer-events-none z-10 shadow-xl"
                  :style="{
          left: Math.min(phase.startWeek * weekWidth, (totalWeeks - 5) * weekWidth) + 'px',
          top: '-120px',
          width: '250px'}">
                  <div class="font-semibold mb-2 text-sm">{{ phase.name }}</div>

                  <div class="space-y-1">
                    <div class="flex justify-between">
                      <span class="text-gray-300">Start:</span>
                      <span>Woche {{ phase.startWeek + 1 }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-300">Dauer:</span>
                      <span>{{ phase.durationWeeks }} Wochen</span>
                    </div>

                    <div class="border-t border-gray-700 my-1"></div>

                    <div class="flex justify-between">
                      <span class="text-gray-300">Basis:</span>
                      <span class="text-blue-300">
              {{ phase.baseEffort?.toFixed(1) }} PW ({{ phase.baseDuration }}w)
            </span>
                    </div>

                    <div
                      v-if="phase.bufferEffort && phase.bufferEffort > 0"
                      class="flex justify-between">
                      <span class="text-gray-300">Puffer:</span>
                      <span class="text-yellow-300">
              +{{ phase.bufferEffort.toFixed(1) }} PW ({{ phase.bufferDuration }}w)
            </span>
                    </div>

                    <div class="border-t border-gray-700 my-1"></div>

                    <div class="flex justify-between font-semibold">
                      <span class="text-gray-300">Gesamt:</span>
                      <span>{{ phase.effortPersonWeeks.toFixed(1) }} PW</span>
                    </div>
                  </div>

                  <div class="absolute left-4 -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            </div>
          </div>

          <tbody class="divide-y divide-gray-200">
          <tr
            v-for="(phase, idx) in metrics.phases"
            :key="idx"
            class="hover:bg-gray-50"
          >
            <td class="px-4 py-3 text-sm">{{ phase.name }}</td>
            <td class="px-4 py-3 text-sm text-right">W{{ phase.startWeek + 1 }}</td>
            <td class="px-4 py-3 text-sm text-right">{{ phase.durationWeeks }}w</td>
            <td class="px-4 py-3 text-sm text-blue-600 text-right">
              {{ phase.baseEffort?.toFixed(1) ?? '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-yellow-600 text-right">
              {{ phase.bufferEffort ? `+${phase.bufferEffort.toFixed(1)}` : '-' }}
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-right">
              {{ phase.effortPersonWeeks.toFixed(1) }}
            </td>
            <td class="px-4 py-3 text-sm text-right">
              {{
                phase.bufferEffort
                  ? ((phase.bufferEffort / phase.effortPersonWeeks) * 100).toFixed(1) + '%'
                  : '0%'
              }}
            </td>
          </tr>
          </tbody>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
