<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router"; // useRouter hinzu
import api from "@/api";
import type { DashboardData } from "@/types";

const route = useRoute();
const router = useRouter(); // Router Instanz
const dashboard = ref<DashboardData | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Computed für einfachere Zugriffe
const project = computed(() => dashboard.value?.project);
const configs = computed(() => dashboard.value?.configurations);
const progress = computed(() => dashboard.value?.projectPlanProgress);

// Navigation zurück zur Startseite
function goBack() {
  router.push({ name: 'home' });
}

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
    <div class="spinner"></div>
    <p>Lade Dashboard...</p>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="error">
    <p>❌ {{ error }}</p>
    <button class="btn-secondary" @click="goBack">Zurück zur Übersicht</button>
  </div>

  <!-- Dashboard -->
  <div v-else-if="dashboard" class="dashboard">

    <!-- Header mit Back-Button -->
    <header class="dashboard-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack" title="Zurück zur Übersicht">
          ← Übersicht
        </button>
        <div class="title-group">
          <h1>{{ project?.title }}</h1>
          <p class="domain">{{ project?.domain || 'Keine Domain' }}</p>
        </div>
      </div>

      <div class="status-badge" :class="`status-${project?.status}`">
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
          <div class="field-grid">
            <div class="field">
              <strong>Geschäftsziel</strong>
              <p>{{ configs.businessUnderstanding.businessGoal || '–' }}</p>
            </div>
            <div class="field">
              <strong>Produkt-Form</strong>
              <p>{{ configs.businessUnderstanding.formOfFinalProduct || '–' }}</p>
            </div>
            <div class="field">
              <strong>Team-Rollen</strong>
              <div class="tags">
                <span v-for="role in configs.businessUnderstanding.projectTeamRoles" :key="role" class="tag">{{ role }}</span>
                <span v-if="!configs.businessUnderstanding.projectTeamRoles?.length">–</span>
              </div>
            </div>
            <div class="field">
              <strong>Teamgröße</strong>
              <p>{{ configs.businessUnderstanding.teamSize || '–' }} Personen</p>
            </div>
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
          <div class="field-grid">
            <div class="field">
              <strong>Datenzugriff</strong>
              <div class="tags">
                <span v-for="acc in configs.dataCharacteristics.dataAccess" :key="acc" class="tag">{{ acc }}</span>
              </div>
            </div>
            <div class="field">
              <strong>Velocity</strong>
              <p>{{ configs.dataCharacteristics.velocity || '–' }}</p>
            </div>
            <div class="field">
              <strong>Volumen</strong>
              <p>{{ configs.dataCharacteristics.volumeValue }} {{ configs.dataCharacteristics.volumeUnit }}</p>
            </div>
            <div class="field">
              <strong>Datenquellen</strong>
              <p>{{ configs.dataCharacteristics.dataSources?.join(', ') || '–' }}</p>
            </div>
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
          <div class="field-grid">
            <div class="field">
              <strong>Analytics Typ</strong>
              <p>{{ configs.analysisConfig.typeOfAnalytics || '–' }}</p>
            </div>
            <div class="field full-width">
              <strong>Data Science Ziele</strong>
              <p>{{ configs.analysisConfig.dataScienceGoals || '–' }}</p>
            </div>
            <div class="field full-width">
              <strong>Metriken</strong>
              <div class="tags">
                <span v-for="m in configs.analysisConfig.evaluationMetrics" :key="m" class="tag">{{ m }}</span>
              </div>
            </div>
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
          <div class="field-grid">
            <div class="field">
              <strong>Timeliness</strong>
              <p>{{ configs.deploymentConfig.timelinessOfAnalytics || '–' }}</p>
            </div>
            <div class="field">
              <strong>Nutzergruppe</strong>
              <p>{{ configs.deploymentConfig.addressedUsers || '–' }}</p>
            </div>
            <div class="field full-width">
              <strong>Herausforderungen</strong>
              <div class="tags">
                <span v-for="issue in configs.deploymentConfig.projectIssues" :key="issue" class="tag error-tag">{{ issue }}</span>
              </div>
            </div>
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
          <div class="field-grid">
            <div class="field full-width">
              <strong>Monitoring Strategie</strong>
              <p>{{ configs.utilizationConfig.monitoring || '–' }}</p>
            </div>
            <div class="field full-width">
              <strong>Wartung</strong>
              <p>{{ configs.utilizationConfig.maintenance || '–' }}</p>
            </div>
          </div>
        </div>
      </details>

    </section>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  padding-top: 80px; /* Header Offset */
}

/* HEADER */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-light);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-background-soft);
}

.title-group h1 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--color-primary);
}

.domain {
  margin: 0;
  color: var(--color-text-light);
  font-size: 1rem;
}

/* BADGES */
.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-PLANNING { background: var(--color-info); color: white; }
.status-IN_PROGRESS { background: var(--color-warning); color: white; }
.status-COMPLETED { background: var(--color-success); color: white; }
.status-ON_HOLD { background: var(--color-error); color: white; }
.status-CANCELLED { background: grey; color: white; }

/* PROGRESS */
.progress-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.progress-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.progress-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--color-text);
}

.progress-bar {
  height: 8px;
  background: var(--color-background-mute);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.5s ease-out;
}

.progress-fill.completed {
  background: var(--color-success);
}

/* CONFIGURATION DETAILS */
.config-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-primary);
}

.config-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.config-card[open] {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.config-card summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  background: var(--color-background-soft);
  list-style: none; /* Remove default triangle in some browsers */
}

.config-card summary::-webkit-details-marker {
  display: none;
}

.config-card summary:hover {
  background: #f0f0f0;
}

.config-card h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

/* STATUS INDICATORS IN CARDS */
.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.status-indicator.draft { background: #e0e0e0; color: #666; }
.status-indicator.in_progress { background: #fff3cd; color: #856404; }
.status-indicator.completed { background: #d4edda; color: #155724; }

/* FIELD GRID */
.config-content {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field strong {
  display: block;
  color: var(--color-text-light);
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field p {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.5;
}

/* TAGS */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--color-background-mute);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid var(--color-border);
}

.tag.error-tag {
  background: #fff5f5;
  color: #c62828;
  border-color: #ffcdd2;
}

/* LOADING */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: var(--color-text-light);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 4rem;
  color: var(--color-error);
}
</style>
