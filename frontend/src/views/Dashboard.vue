<script setup lang="ts" >
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router"; // useRouter hinzu
import api from "@/api";
import type { DashboardData } from "@/types";
import { useToast } from "vue-toastification";

// Importiere die zentralen Konstanten & Labels
import {
  FORM_OF_PRODUCT_OPTIONS, FORM_LABELS,
  TEAM_ROLE_OPTIONS, TEAM_ROLE_LABELS,
  TIMELINE_UNITS, UNIT_LABELS,
  DATA_ACCESS_OPTIONS, DATA_ACCESS_LABELS,
  VELOCITY_OPTIONS, VELOCITY_LABELS,
  VERACITY_OPTIONS, VERACITY_LABELS,
  VARIETY_OPTIONS, VARIETY_LABELS,
  VARIABILITY_OPTIONS, VARIABILITY_LABELS,
  VOLUME_UNITS,
  PREPARATION_STEPS, PREPARATION_LABELS,
  ANALYTICS_TYPES, ANALYTICS_LABELS,
  TIMELINESS_LEVELS, TIMELINESS_LABELS,
  PROJECT_ISSUE_TYPES, ISSUE_LABELS
} from "@/utils/constants";

const toast = useToast();
const route = useRoute();
const router = useRouter(); // Router Instanz
const dashboard = ref<DashboardData | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const editableStatus = ref<string | null>(null);

// Edit Mode State
const isEditing = ref(false);
const localConfigs = ref<any>(null); // Lokale Kopie zum Bearbeiten

// Computed Properties
const project = computed(() => dashboard.value?.project);
const configs = computed(() => dashboard.value?.configurations);
const progress = computed(() => dashboard.value?.projectPlanProgress);

// --- Navigation ---
function goBack() { router.push({ name: 'home' }); }
function gotoGant() { router.push({ name: 'Gant' }); }


// --- Edit Mode Funktionen ---
function startEditing() {
  if (!dashboard.value?.configurations) return;
  // Deep Copy der Configurations
  localConfigs.value = JSON.parse(JSON.stringify(dashboard.value.configurations));


  localConfigs.value.project = {
    title: dashboard.value.project.title,
    domain: dashboard.value.project.domain
  };

  // 1. Für Data Access
  if (!localConfigs.value.dataCharacteristics.dataAccess) {
    localConfigs.value.dataCharacteristics.dataAccess = [];
  }

  // 2. Data Preparation Steps
  if (!Array.isArray(localConfigs.value.dataCharacteristics.dataPreparationSteps)) {
    // Falls es null ist oder aus irgendeinem Grund ein String -> Array machen
    localConfigs.value.dataCharacteristics.dataPreparationSteps = [];
  }

  // 3. Für Team Roles
  if (!localConfigs.value.businessUnderstanding.projectTeamRoles) {
    localConfigs.value.businessUnderstanding.projectTeamRoles = [];
  }

  // 4. Für Issues
  if (!localConfigs.value.deploymentConfig.projectIssues) {
    localConfigs.value.deploymentConfig.projectIssues = [];
  }


  isEditing.value = true;
}

function cancelEditing() {
  localConfigs.value = null;
  isEditing.value = false;
}

async function saveChanges() {
  if (!localConfigs.value || !dashboard.value) return;

  isLoading.value = true;

  try {
    const projectId = dashboard.value.project.id;

    // Projekt-Details (Titel & Domain) aktualisieren
    if (localConfigs.value.project) {
      await api.updateProjectDetails(projectId, {
        title: localConfigs.value.project.title,
        domain: localConfigs.value.project.domain
      });
    }

    // Konfigurationen aktualisieren
    if (localConfigs.value.businessUnderstanding) {
      await api.updateProjectConfig(projectId, 'businessUnderstanding', localConfigs.value.businessUnderstanding);
    }

    if (localConfigs.value.dataCharacteristics) {
      await api.updateProjectConfig(projectId, 'dataCharacteristics', localConfigs.value.dataCharacteristics);
    }

    if (localConfigs.value.analysisConfig) {
      await api.updateProjectConfig(projectId, 'analysisConfig', localConfigs.value.analysisConfig);
    }

    if (localConfigs.value.deploymentConfig) {
      await api.updateProjectConfig(projectId, 'deploymentConfig', localConfigs.value.deploymentConfig);
    }

    if (localConfigs.value.utilizationConfig) {
      await api.updateProjectConfig(projectId, 'utilizationConfig', localConfigs.value.utilizationConfig);
    }

    // Dashboard neu laden
    dashboard.value = await api.getDashboardData(projectId);

    isEditing.value = false;
    localConfigs.value = null;

    toast.success('Änderungen erfolgreich gespeichert');

  } catch (err) {
    console.error('Fehler beim Speichern der Änderungen:', err);
    error.value = 'Änderungen konnten nicht gespeichert werden.';
    toast.error('Änderungen konnten nicht gespeichert werden.');
  } finally {
    isLoading.value = false;
  }
}



const statusOptions = [
  { value: 'PLANNING', label: 'Planung' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'ON_HOLD', label: 'Pausiert' },
  { value: 'CANCELLED', label: 'Abgebrochen' }
];
const dropdownOpen = ref(false);

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function selectStatus(value: string) {
  editableStatus.value = value;
  patchProjectStatus(value);
  dropdownOpen.value = false;
}

async function patchProjectStatus(newStatus: string) {
  if (!dashboard.value) return;

  const oldStatus = dashboard.value.project.status;

  // Optimistic UI Update
  dashboard.value.project.status = newStatus;

  try {
    await api.patchProjektStatus(
      Number(route.params.id),
       newStatus
    );
  } catch (err) {
    console.error("Status-Update fehlgeschlagen:", err);
    dashboard.value.project.status = oldStatus; // Rollback
    editableStatus.value = oldStatus;
    toast.error("Status konnte nicht geändert werden.");
  }
}


// --- Lifecycle ---
onMounted(async () => {
  try {
    const projektId = Number(route.params.id);
    dashboard.value = await api.getDashboardData(projektId);
    editableStatus.value = dashboard.value.project.status;
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
    <p>Lade Daten...</p>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="error">
    <p>❌ {{ error }}</p>
    <button class="btn-secondary" @click="goBack">Zurück zur Übersicht</button>
  </div>

  <!-- Dashboard Content -->
  <div v-else-if="dashboard" class="dashboard">

    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack" title="Zurück zur Übersicht">
          ← Startseite
        </button>

        <div class="title-group">
          <!-- View Mode (wenn NICHT bearbeitet wird) -->
          <template v-if="!isEditing">
            <h1>{{ project?.title }}</h1>
            <p class="domain">{{ project?.domain || 'Keine Domain' }}</p>
          </template>

          <!-- Edit Mode (Eingabefelder) -->
          <template v-else>
            <input
              type="text"
              v-model="localConfigs.project.title"
              class="edit-title-input"
              placeholder="Projektname"
            />
            <input
              type="text"
              v-model="localConfigs.project.domain"
              class="edit-domain-input"
              placeholder="Domaine (z.B. Finance)"
            />
          </template>
        </div>
      </div>

      <!-- Projektstatus -->
      <div class="status-control">
        <div class="custom-select-wrapper">
          <select
            v-model="editableStatus"
            @change="patchProjectStatus(editableStatus!)"
            :class="`status-${editableStatus}`"
            class="custom-select"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <span class="custom-arrow">▾</span>
        </div>

      </div>

    </header>


    <!-- Progress Overview -->
    <section class="progress-section">
      <div class="progress-card">
        <h3>Wizard-Fortschritt</h3>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: dashboard.wizardProgress.percentage + '%' }" />
        </div>
        <p>{{ dashboard.wizardProgress.currentStep }} / {{ dashboard.wizardProgress.totalSteps }} Schritte</p>
      </div>

      <div class="progress-card" v-if="progress">
        <h3>Projektplan</h3>
        <div class="progress-bar">
          <div class="progress-fill completed" :style="{ width: progress.percentage + '%' }" />
        </div>
        <p>{{ progress.completedTasks }} / {{ progress.totalTasks }} Tasks erledigt</p>
      </div>
    </section>

    <!-- Configurations Section -->
    <section class="config-section">
      <div class="header-row">
        <h2>Projektkonfiguration</h2>
        <div class="action-buttons">
          <button @click="gotoGant" class="btn-primary">Gantt Diagramm</button>

          <!-- Edit Controls -->
          <button v-if="!isEditing" @click="startEditing" class="btn-secondary ml-2">
            ✏️ Bearbeiten
          </button>
          <template v-else>
            <button @click="cancelEditing" class="btn-secondary ml-2">Abbrechen</button>
            <button @click="saveChanges" class="btn-success ml-2">💾 Speichern</button>
          </template>
        </div>
      </div>

      <!-- 1. Business Understanding -->
      <details class="config-card" open>
        <summary>
          <h3>Business Understanding</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[0].status.toLowerCase()">
            {{ dashboard.templatePhases[0].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.businessUnderstanding">
          <div class="field-grid">

            <!-- Geschäftsziel -->
            <div class="field">
              <strong>Geschäftsziel</strong>
              <p v-if="!isEditing">{{ configs.businessUnderstanding.businessGoal || '–' }}</p>
              <textarea v-else v-model="localConfigs.businessUnderstanding.businessGoal" class="form-input"></textarea>
            </div>

            <!-- Produkt-Form -->
            <div class="field">
              <strong>Produkt-Form</strong>
              <p v-if="!isEditing">{{ configs.businessUnderstanding.formOfFinalProduct ? FORM_LABELS[configs.businessUnderstanding.formOfFinalProduct] : '–' }}</p>
              <select v-else v-model="localConfigs.businessUnderstanding.formOfFinalProduct" class="form-select">
                <option v-for="opt in FORM_OF_PRODUCT_OPTIONS" :key="opt" :value="opt">{{ FORM_LABELS[opt] }}</option>
              </select>
            </div>

            <!-- Team Größe -->
            <div class="field">
              <strong>Teamgröße</strong>
              <p v-if="!isEditing">{{ configs.businessUnderstanding.teamSize || '–' }} Personen</p>
              <input v-else type="number" v-model.number="localConfigs.businessUnderstanding.teamSize" class="form-input" />
            </div>

            <!-- Geschätzte Kosten -->
            <div class="field">
              <strong>Geschätzte Kosten</strong>
              <p v-if="!isEditing">{{ configs.businessUnderstanding.estimatedCost ? configs.businessUnderstanding.estimatedCost + ' €' : '–' }}</p>
              <input v-else type="number" v-model.number="localConfigs.businessUnderstanding.estimatedCost" class="form-input" />
            </div>

            <!-- Timeline -->
            <div class="field">
              <strong>Projektdauer</strong>
              <p v-if="!isEditing">
                {{ configs.businessUnderstanding.timelineValue || '–' }}
                {{ configs.businessUnderstanding.timelineUnit ? UNIT_LABELS[configs.businessUnderstanding.timelineUnit] : '' }}
              </p>
              <div v-else class="flex-row">
                <input type="number" v-model.number="localConfigs.businessUnderstanding.timelineValue" class="form-input small" placeholder="Wert" />
                <select v-model="localConfigs.businessUnderstanding.timelineUnit" class="form-select small">
                  <option v-for="u in TIMELINE_UNITS" :key="u" :value="u">{{ UNIT_LABELS[u] }}</option>
                </select>
              </div>
            </div>

            <!-- Tools -->
            <div class="field full-width">
              <strong>Tools</strong>
              <p v-if="!isEditing">{{ configs.businessUnderstanding.toolsBusinessUnderstanding || '–' }}</p>
              <input v-else type="text" v-model="localConfigs.businessUnderstanding.toolsBusinessUnderstanding" class="form-input" />
            </div>

            <!-- Team-Rollen -->
            <div class="field full-width">
              <strong>Team Roles</strong>

              <!-- 1. Ansichts-Modus: Tags anzeigen -->
              <div v-if="!isEditing" class="tags">
                <template v-if="configs.businessUnderstanding.projectTeamRoles?.length">
                  <span v-for="role in configs.businessUnderstanding.projectTeamRoles" :key="role" class="tag">
                    {{ TEAM_ROLE_LABELS[role] || role }}
                  </span>
                </template>
                <span v-else>–</span>
              </div>

              <!-- 2. Bearbeitungs-Modus: Checkboxen -->
              <div v-else class="checkbox-group">
                <label v-for="role in TEAM_ROLE_OPTIONS" :key="role" class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="role"
                    v-model="localConfigs.businessUnderstanding.projectTeamRoles"
                  >
                  {{ TEAM_ROLE_LABELS[role] }}
                </label>
              </div>
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

            <!-- Data Access -->
            <div class="field full-width">
              <strong>Datenzugriff</strong>
              <div v-if="!isEditing" class="tags">
                <span v-for="acc in configs.dataCharacteristics.dataAccess" :key="acc" class="tag">
                  {{ DATA_ACCESS_LABELS[acc] || acc }}
                </span>
                <span v-if="!configs.dataCharacteristics.dataAccess?.length">–</span>
              </div>
              <!-- Checkbox Group für Data Access -->
              <div v-else class="checkbox-group">
                <label v-for="opt in DATA_ACCESS_OPTIONS" :key="opt" class="checkbox-label">
                  <input type="checkbox" :value="opt" v-model="localConfigs.dataCharacteristics.dataAccess">
                  {{ DATA_ACCESS_LABELS[opt] }}
                </label>
              </div>
            </div>

            <!-- Zeile 1: Verfügbarkeit, Velocity, Volumen -->
            <div class="field">
              <strong>Datenverfügbarkeit</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.dataAvailability ? 'Ja' : 'Nein' }}</p>
              <select v-else v-model="localConfigs.dataCharacteristics.dataAvailability" class="form-select">
                <option :value="true">Ja</option>
                <option :value="false">Nein</option>
              </select>
            </div>

            <div class="field">
              <strong>Velocity</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.velocity ? VELOCITY_LABELS[configs.dataCharacteristics.velocity] : '–' }}</p>
              <select v-else v-model="localConfigs.dataCharacteristics.velocity" class="form-select">
                <option v-for="opt in VELOCITY_OPTIONS" :key="opt" :value="opt">{{ VELOCITY_LABELS[opt] }}</option>
              </select>
            </div>

            <div class="field">
              <strong>Volumen</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.volumeValue }} {{ configs.dataCharacteristics.volumeUnit }}</p>
              <div v-else class="flex-row nowrap"> <!-- class nowrap verhindert Umbruch von Input/Select -->
                <input type="number" v-model.number="localConfigs.dataCharacteristics.volumeValue" class="form-input small" style="width: 80px;" />
                <select v-model="localConfigs.dataCharacteristics.volumeUnit" class="form-select small" style="flex: 1;">
                  <option v-for="u in VOLUME_UNITS" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>
            </div>

            <!-- Zeile 2: Veracity, Variety, Variability -->
            <div class="field">
              <strong>Veracity (Qualität)</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.veracity ? VERACITY_LABELS[configs.dataCharacteristics.veracity] : '–' }}</p>
              <select v-else v-model="localConfigs.dataCharacteristics.veracity" class="form-select">
                <option v-for="opt in VERACITY_OPTIONS" :key="opt" :value="opt">{{ VERACITY_LABELS[opt] }}</option>
              </select>
            </div>

            <div class="field">
              <strong>Variety</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.variety ? VARIETY_LABELS[configs.dataCharacteristics.variety] : '–' }}</p>
              <select v-else v-model="localConfigs.dataCharacteristics.variety" class="form-select">
                <option v-for="opt in VARIETY_OPTIONS" :key="opt" :value="opt">{{ VARIETY_LABELS[opt] }}</option>
              </select>
            </div>

            <div class="field">
              <strong>Variability</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.variability ? VARIABILITY_LABELS[configs.dataCharacteristics.variability] : '–' }}</p>
              <select v-else v-model="localConfigs.dataCharacteristics.variability" class="form-select">
                <option v-for="opt in VARIABILITY_OPTIONS" :key="opt" :value="opt">{{ VARIABILITY_LABELS[opt] }}</option>
              </select>
            </div>

            <!-- Data Prep Steps (Volle Breite, unter den Dropdowns) -->
            <div class="field full-width">
              <strong>Data Prep Steps</strong>
              <div v-if="!isEditing" class="tags">
                <template v-if="Array.isArray(configs.dataCharacteristics.dataPreparationSteps)">
                    <span v-for="step in configs.dataCharacteristics.dataPreparationSteps" :key="step" class="tag">
                        {{ PREPARATION_LABELS[step] || step }}
                    </span>
                </template>
                <span v-else class="tag">
                    {{ PREPARATION_LABELS[configs.dataCharacteristics.dataPreparationSteps] || configs.dataCharacteristics.dataPreparationSteps || '–' }}
                 </span>
                <span v-if="!configs.dataCharacteristics.dataPreparationSteps || (Array.isArray(configs.dataCharacteristics.dataPreparationSteps) && configs.dataCharacteristics.dataPreparationSteps.length === 0)">–</span>
              </div>

              <!-- Edit Mode: Multi-Select -->
              <div v-else class="checkbox-group">
                <label v-for="step in PREPARATION_STEPS" :key="step" class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="step"
                    v-model="localConfigs.dataCharacteristics.dataPreparationSteps"
                  >
                  {{ PREPARATION_LABELS[step] }}
                </label>
              </div>
            </div>

            <!-- Tools -->
            <div class="field full-width">
              <strong>Tools</strong>
              <p v-if="!isEditing">{{ configs.dataCharacteristics.toolsData || '–' }}</p>
              <input v-else type="text" v-model="localConfigs.dataCharacteristics.toolsData" class="form-input" />
            </div>

          </div>
        </div>
      </details>


        <!-- 3. Analysis Config -->
      <details class="config-card">
        <summary>
          <h3>Analysis & Modeling</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[2].status.toLowerCase()">
            {{ dashboard.templatePhases[2].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.analysisConfig">
          <div class="field-grid">

            <!-- Analytics Typ -->
            <div class="field">
              <strong>Analytics Typ</strong>
              <p v-if="!isEditing">{{ configs.analysisConfig.typeOfAnalytics ? ANALYTICS_LABELS[configs.analysisConfig.typeOfAnalytics] : '–' }}</p>
              <select v-else v-model="localConfigs.analysisConfig.typeOfAnalytics" class="form-select">
                <option v-for="opt in ANALYTICS_TYPES" :key="opt" :value="opt">{{ ANALYTICS_LABELS[opt] }}</option>
              </select>
            </div>

            <!-- Ziele -->
            <div class="field full-width">
              <strong>Data Science Ziele</strong>
              <p v-if="!isEditing">{{ configs.analysisConfig.dataScienceGoals || '–' }}</p>
              <textarea v-else v-model="localConfigs.analysisConfig.dataScienceGoals" class="form-input"></textarea>
            </div>

            <!-- Tools -->
            <div class="field full-width">
              <strong>Tools</strong>
              <p v-if="!isEditing">{{ configs.analysisConfig.toolsAnalysis || '–' }}</p>
              <input v-else type="text" v-model="localConfigs.analysisConfig.toolsAnalysis" class="form-input" />
            </div>

          </div>
        </div>
      </details>

      <!-- 4. Deployment Config -->
      <details class="config-card">
        <summary>
          <h3>Deployment</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[3].status.toLowerCase()">
            {{ dashboard.templatePhases[3].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.deploymentConfig">
          <div class="field-grid">

            <!-- Timeliness -->
            <div class="field">
              <strong>Timeliness</strong>
              <p v-if="!isEditing">{{ configs.deploymentConfig.timelinessOfAnalytics ? TIMELINESS_LABELS[configs.deploymentConfig.timelinessOfAnalytics] : '–' }}</p>
              <select v-else v-model="localConfigs.deploymentConfig.timelinessOfAnalytics" class="form-select">
                <option v-for="opt in TIMELINESS_LEVELS" :key="opt" :value="opt">{{ TIMELINESS_LABELS[opt] }}</option>
              </select>
            </div>

            <!-- Nutzergruppe -->
            <div class="field">
              <strong>Nutzergruppe</strong>
              <p v-if="!isEditing">{{ configs.deploymentConfig.addressedUsers || '–' }}</p>
              <input v-else type="text" v-model="localConfigs.deploymentConfig.addressedUsers" class="form-input" />
            </div>

            <!-- Herausforderungen -->
            <div class="field full-width">
              <strong>Herausforderungen</strong>
              <div v-if="!isEditing" class="tags">
                 <span v-for="issue in configs.deploymentConfig.projectIssues" :key="issue" class="tag error-tag">
                    {{ ISSUE_LABELS[issue] || issue }}
                 </span>
                <span v-if="!configs.deploymentConfig.projectIssues?.length">–</span>
              </div>
              <div v-else class="checkbox-group">
                <label v-for="type in PROJECT_ISSUE_TYPES" :key="type" class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="type"
                    v-model="localConfigs.deploymentConfig.projectIssues"
                  >
                  {{ ISSUE_LABELS[type] }}
                </label>
              </div>
            </div>

            <!-- Tools -->
            <div class="field full-width">
              <strong>Tools</strong>
              <p v-if="!isEditing">{{ configs.deploymentConfig.toolsDeployment || '–' }}</p>
              <input v-else type="text" v-model="localConfigs.deploymentConfig.toolsDeployment" class="form-input" />
            </div>

          </div>
        </div>
      </details>

      <!-- 5. Utilization Config -->
      <details class="config-card">
        <summary>
          <h3>Utilization & Monitoring</h3>
          <span class="status-indicator" :class="dashboard.templatePhases[4].status.toLowerCase()">
            {{ dashboard.templatePhases[4].status }}
          </span>
        </summary>
        <div class="config-content" v-if="configs?.utilizationConfig">
          <div class="field-grid">
            <!-- Monitoring -->
            <div class="field full-width">
              <strong>Monitoring Strategie</strong>
              <p v-if="!isEditing">{{ configs.utilizationConfig.monitoring || '–' }}</p>
              <textarea v-else v-model="localConfigs.utilizationConfig.monitoring" class="form-input"></textarea>
            </div>

            <!-- Maintenance -->
            <div class="field full-width">
              <strong>Wartung</strong>
              <p v-if="!isEditing">{{ configs.utilizationConfig.maintenance || '–' }}</p>
              <textarea v-else v-model="localConfigs.utilizationConfig.maintenance" class="form-input"></textarea>
            </div>

            <!-- Tools -->
            <div class="field full-width">
              <strong>Tools</strong>
              <p v-if="!isEditing">{{ configs.utilizationConfig.toolsUtilization || '–' }}</p>
              <input v-else type="text" v-model="localConfigs.utilizationConfig.toolsUtilization" class="form-input" />
            </div>
          </div>
        </div>
      </details>

    </section>

  </div>
</template>

<style scoped>
/* Bestehende Styles bleiben erhalten */

.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.title-group h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #0056b3;
}

.domain {
  margin: 0.2rem 0 0;
  color: #666;
  font-size: 0.95rem;

}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.status-PLANNING { background: #e3f2fd; color: #0d47a1; }
.status-IN_PROGRESS { background: #fff3e0; color: #e65100; }
.status-COMPLETED { background: #e8f5e9; color: #1b5e20; }
.status-ON_HOLD { background: #f3e5f5; color: #4a148c; }

/* Progress Section */
.progress-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.progress-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.progress-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  margin: 1rem 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0056b3;
  transition: width 0.5s ease;
}

.progress-fill.completed {
  background: #28a745;
}

/* Config Section */
.config-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.ml-2 {
  margin-left: 0.5rem;
}

.config-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.config-card summary {
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  font-weight: 600;
  list-style: none; /* Hide default triangle in some browsers */
}

.config-card summary::-webkit-details-marker {
  display: none;
}

.config-card[open] summary {
  border-bottom: 1px solid #eee;
}

.config-content {
  padding: 1.5rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field strong {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #777;
  letter-spacing: 0.5px;
}

.field p {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

/* Form Styles für Edit Mode */
.form-input, .form-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
}

.form-input.small, .form-select.small {
  width: auto;
  display: inline-block;
  margin-right: 0.5rem;
}

.flex-row {
  display: flex;
  align-items: center;
}

.flex-row.nowrap {
  flex-wrap: nowrap;
  gap: 0.5rem;
}

textarea.form-input {
  min-height: 80px;
  resize: vertical;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  color: #495057;
}

.error-tag {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

/* Buttons */
.btn-primary {
  background: #0056b3;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: white;
  border: 1px solid #ccc;
  color: #333;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-success {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}
.status-indicator.draft { background: #eee; color: #666; }
.status-indicator.blocked { background: #ffebee; color: #c62828; }
.status-indicator.completed { background: #e8f5e9; color: #1b5e20; }

.loading, .error {
  text-align: center;
  margin-top: 4rem;
}
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0056b3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.error {
  text-align: center;
  padding: 4rem;
  color: var(--color-error);
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}


.selected {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Farben */
.status-PLANNING { background-color: #2196F3; }
.status-IN_PROGRESS { background-color: #FF9800; }
.status-COMPLETED { background-color: #4CAF50; }
.status-ON_HOLD { background-color: #F44336; }
.status-CANCELLED { background-color: grey; }


.custom-arrow {
    position: absolute;
    right: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 1rem;
    color: white;
}
.custom-select {
  width: 100%;
  padding: 0.5rem 1.5rem 0.5rem 0.8rem;
  border-radius: 50px;
  appearance: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  height: 45px;
  text-align: center;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  border: 1px solid transparent;
  outline: none;
}
.status-control {
  width: 200px;
}

.custom-select-wrapper {
  position: relative;
  width: 100%;
}
.custom-select option {
  text-align: left;
  border-radius: 20px;
  background-color: white !important;
  color: black !important;
}

.custom-select:focus {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
