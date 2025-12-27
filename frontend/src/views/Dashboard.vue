<script setup lang="ts">

import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import api from "@/api";
import type { DashboardData } from "@/types";

const route = useRoute();
const dashboard = ref<DashboardData | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Computed für einfachere Zugriffe
const project = computed(() => dashboard.value?.project);
const configs = computed(() => dashboard.value?.configurations);
const progress = computed(() => dashboard.value?.projectPlanProgress);

onMounted(async () => {
  try {
    const projektId = Number(route.params.id);
    dashboard.value = await api.getDashboardData(projektId);
  } catch (err) {
    console.error("Fehler beim Laden des Dashboards:", err);
    error.value = "Dashboard konnte nicht geladen werden.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading" class="loading">
    <p>Lade Dashboard...</p>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="error">
    <p>❌ {{ error }}</p>
  </div>

  <!-- Dashboard -->
  <div v-else-if="dashboard" class="dashboard">

    <!-- Header -->
    <header class="dashboard-header">
      <div>
        <h1>{{ project?.title }}</h1>
        <p class="domain">{{ project?.domain }}</p>
      </div>
      <div class="status-badge" :class="`status-${project?.status.toLowerCase()}`">
        {{ project?.status }}
      </div>
    </header>

    <!-- Progress Overview -->
    <section class="progress-section">
      <div class="progress-card">
        <h3>Wizard-Fortschritt</h3>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: dashboard.wizardProgress.percentage + '%' }"
          />
        </div>
        <p>{{ dashboard.wizardProgress.currentStep }} / {{ dashboard.wizardProgress.totalSteps }} Schritte</p>
      </div>

      <div class="progress-card" v-if="progress">
        <h3>Projektplan</h3>
        <div class="progress-bar">
          <div
            class="progress-fill completed"
            :style="{ width: progress.percentage + '%' }"
          />
        </div>
        <p>{{ progress.completedTasks }} / {{ progress.totalTasks }} Tasks erledigt</p>
      </div>
    </section>

    <!-- Configurations -->
    <section class="config-section">
      <h2>Projektkonfiguration</h2>

      <!-- Business Understanding -->
      <details class="config-card" open>
        <summary>
          <h3>Business Understanding</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[0].status.toLowerCase()">
            {{ dashboard.templatePhases[0].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.businessUnderstanding">
          <div class="field">
            <strong>Geschäftsziel:</strong>
            <p>{{ configs.businessUnderstanding.businessGoal || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Form des Produkts:</strong>
            <p>{{ configs.businessUnderstanding.formOfFinalProduct || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Team-Rollen:</strong>
            <p>{{ configs.businessUnderstanding.projectTeamRoles?.join(', ') || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Teamgröße:</strong>
            <p>{{ configs.businessUnderstanding.teamSize || '– keine Angabe –' }}</p>
          </div>
        </div>
      </details>

      <!-- Data Characteristics -->
      <details class="config-card">
        <summary>
          <h3>Data Collection & Preparation</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[1].status.toLowerCase()">
            {{ dashboard.templatePhases[1].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.dataCharacteristics">
          <div class="field">
            <strong>Datenzugriff:</strong>
            <p>{{ configs.dataCharacteristics.dataAccess?.join(', ') || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Datenquellen:</strong>
            <p>{{ configs.dataCharacteristics.dataSources?.join(', ') || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Velocity:</strong>
            <p>{{ configs.dataCharacteristics.velocity || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Veracity:</strong>
            <p>{{ configs.dataCharacteristics.veracity || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Volume:</strong>
            <p>{{ configs.dataCharacteristics.volumeValue }} {{ configs.dataCharacteristics.volumeUnit }}</p>
          </div>
        </div>
      </details>

      <!-- Analysis Config -->
      <details class="config-card">
        <summary>
          <h3>Analysis & Modeling</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[2].status.toLowerCase()">
            {{ dashboard.templatePhases[2].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.analysisConfig">
          <div class="field">
            <strong>Data Science Ziele:</strong>
            <p>{{ configs.analysisConfig.dataScienceGoals || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Analytics Type:</strong>
            <p>{{ configs.analysisConfig.typeOfAnalytics || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Evaluation Metrics:</strong>
            <p>{{ configs.analysisConfig.evaluationMetrics?.join(', ') || '– keine Angabe –' }}</p>
          </div>
        </div>
      </details>

      <!-- Deployment Config -->
      <details class="config-card">
        <summary>
          <h3>Deployment</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[3].status.toLowerCase()">
            {{ dashboard.templatePhases[3].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.deploymentConfig">
          <div class="field">
            <strong>Timeliness:</strong>
            <p>{{ configs.deploymentConfig.timelinessOfAnalytics || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Zielnutzer:</strong>
            <p>{{ configs.deploymentConfig.addressedUsers || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Tests:</strong>
            <p>{{ configs.deploymentConfig.tests || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Projekt-Issues:</strong>
            <p>{{ configs.deploymentConfig.projectIssues?.join(', ') || '– keine Angabe –' }}</p>
          </div>
        </div>
      </details>

      <!-- Utilization Config -->
      <details class="config-card">
        <summary>
          <h3>Utilization & Monitoring</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[4].status.toLowerCase()">
            {{ dashboard.templatePhases[4].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.utilizationConfig">
          <div class="field">
            <strong>Monitoring:</strong>
            <p>{{ configs.utilizationConfig.monitoring || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Wartung:</strong>
            <p>{{ configs.utilizationConfig.maintenance || '– keine Angabe –' }}</p>
          </div>
          <div class="field">
            <strong>Tools:</strong>
            <p>{{ configs.utilizationConfig.toolsUtilization || '– keine Angabe –' }}</p>
          </div>
        </div>
      </details>
    </section>

  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  color: #0070c9;
  margin: 0 0 0.5rem 0;
}

.domain {
  color: #888;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-draft { background: #f0f0f0; color: #666; }
.status-active { background: #e3f2fd; color: #1976d2; }
.status-completed { background: #e8f5e9; color: #2e7d32; }

.progress-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-card {
  background: #f8f8f8;
  padding: 1.5rem;
  border-radius: 12px;
}

.progress-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.progress-bar {
  height: 8px;
  background: #ddd;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #0070c9;
  transition: width 0.3s;
}

.progress-fill.completed {
  background: #4caf50;
}

.config-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.config-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.config-card summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  background: #fafafa;
}

.config-card summary:hover {
  background: #f5f5f5;
}

.config-card h3 {
  margin: 0;
  font-size: 1.1rem;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-indicator.todo { background: #f0f0f0; color: #666; }
.status-indicator.in_progress { background: #fff3cd; color: #856404; }
.status-indicator.completed { background: #d4edda; color: #155724; }
.status-indicator.blocked { background: #f8d7da; color: #721c24; }

.config-content {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.field strong {
  display: block;
  color: #0070c9;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.field p {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

.loading, .error {
  text-align: center;
  padding: 4rem 2rem;
  font-size: 1.1rem;
}

.error {
  color: #d32f2f;
}
</style>
