<!-- views/ProjektErstellenDeploymentView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import type { TimelinessLevel, ProjectIssueType } from "@/types";
import { useToast } from "vue-toastification";

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

// Computed für den Fortschritt
const progress = computed(() => draft.deploymentProgress);
const totalFields = 5;

// Timeliness Level Optionen
const timelinessLevels: TimelinessLevel[] = ['BATCH', 'DAILY', 'NEARREALTIME', 'REALTIME'];

// Project Issues Typen
const projectIssueTypes: ProjectIssueType[] = [
  'DATA_ACCESS',
  'DATA_QUALITY',
  'INSUFFICIENT_RESOURCES',
  'UNCLEAR_REQUIREMENTS',
  'TECHNICAL_COMPLEXITY',
  'TIMELINE_CONSTRAINTS',
  'TEAM_COORDINATION'
];

// Deutsche Labels
const timelinessLabels: Record<TimelinessLevel, string> = {
  BATCH: 'Batch (einmalig/periodisch)',
  DAILY: 'Daily (täglich)',
  NEARREALTIME: 'Near-Realtime (nahezu in Echtzeit)',
  REALTIME: 'Realtime (Echtzeit)'
};

const issueLabels: Record<ProjectIssueType, string> = {
  DATA_ACCESS: 'Datenzugriff',
  DATA_QUALITY: 'Datenqualität',
  INSUFFICIENT_RESOURCES: 'Unzureichende Ressourcen',
  UNCLEAR_REQUIREMENTS: 'Unklare Anforderungen',
  TECHNICAL_COMPLEXITY: 'Technische Komplexität',
  TIMELINE_CONSTRAINTS: 'Zeitliche Einschränkungen',
  TEAM_COORDINATION: 'Team-Koordination'
};

// Helper für Fehlerbehandlung
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.errors?.[0]?.msg
      || error.response?.data?.message
      || error.message
      || "Netzwerkfehler beim Speichern";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unbekannter Fehler";
}

function goBack() {
  router.push({ name: "projekt-erstellen-analysis" });
}

async function goNext() {
  // Validierung
  if (!draft.id) {
    toast.error("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
    router.push({ name: "projekt-erstellen" });
    return;
  }

  try {
    // Deployment Config speichern
    await api.patchDeploymentConfig(
      draft.id,
      draft.deploymentConfig
    );

    console.log("Deployment Config gespeichert");

    // Entwurf speichern
    draft.saveDraft();

    // Weiter zur letzten Seite
    router.push({ name: "projekt-erstellen-utilization" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(`Speichern fehlgeschlagen: ${errorMessage}`);
  }
}

onMounted(() => {
  // ERST laden...
  draft.loadDraft();

  // DANN validieren!
  if (!draft.id) {
    console.warn("⚠️ Keine Projekt-ID! Zurück zu Schritt 0");
    router.push({ name: "projekt-erstellen" });
    return;
  }

  console.log("✅ Draft geladen, Projekt-ID:", draft.id);
});



</script>

<template>
  <div class="wizard-page">
    <main class="wizard-container">
      <section class="wizard-header">
        <p class="wizard-step">Projekt-Wizard · Schritt 4 von 5</p>
        <h1>Projekt anlegen – Deployment</h1>
        <p class="wizard-subtitle">
          Beschreibe die Umsetzungsphase: Aktualität, Nutzer, Tests, Issues und Tools.
          <!-- Auto-Save Indicator in JEDER View -->
          <span v-if="draft.lastSaved" class="auto-save-indicator">
      💾 Gespeichert: {{ draft.lastSavedFormatted }}
    </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Business Understanding</li>
          <li class="is-done">Data Collection, Exploration & Preparation</li>
          <li class="is-done">Analysis</li>
          <li class="is-active">Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <section class="wizard-main">
        <div class="form-card">
          <h2>Deployment Configuration</h2>
          <p class="card-subtitle">
            Definiere wie und an wen die Analytics-Ergebnisse bereitgestellt werden.
          </p>

          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>4. Deployment</h3>
                <p class="section-description">
                  Aktualität, Zielgruppe, Tests, Issues und Deployment-Tools.
                </p>
              </div>
              <div>
                <span class="section-status">{{ progress }}/{{ totalFields }} Felder</span>
              </div>
            </header>

            <div class="section-grid">
              <!-- Timeliness of Analytics -->
              <div class="field field-full">
                <label for="timeliness">Timeliness of Analytics</label>
                <select
                  id="timeliness"
                  v-model="draft.deploymentConfig.timelinessOfAnalytics"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="level in timelinessLevels"
                    :key="level"
                    :value="level"
                  >
                    {{ timelinessLabels[level] }}
                  </option>
                </select>
                <p class="field-help">
                  Wie schnell müssen die Analytics-Ergebnisse verfügbar sein?
                </p>
              </div>

              <!-- Addressed Users -->
              <div class="field field-full">
                <label for="users">Addressed Users</label>
                <textarea
                  id="users"
                  rows="2"
                  v-model="draft.deploymentConfig.addressedUsers"
                  placeholder="z.B. System Operators, Management, Data Scientists, End-User, Kunden..."
                />
                <p class="field-help">
                  Wer sind die Zielnutzer der Analyse-Ergebnisse?
                </p>
              </div>

              <!-- Tests -->
              <div class="field field-full">
                <label for="tests">Tests</label>
                <textarea
                  id="tests"
                  rows="3"
                  v-model="draft.deploymentConfig.tests"
                  placeholder="z.B. Integration Tests, Unit Tests, A/B Testing, User Acceptance Tests, Performance Tests, Monitoring Setup..."
                />
                <p class="field-help">
                  Welche Tests/Validierungen sind für das Deployment geplant?
                </p>
              </div>

              <!-- Project Issues (Multi-Select) -->
              <div class="field field-full">
                <label>Project Issues</label>
                <div class="checkbox-grid">
                  <label
                    v-for="issue in projectIssueTypes"
                    :key="issue"
                    class="checkbox-label"
                  >
                    <input
                      type="checkbox"
                      :value="issue"
                      v-model="draft.deploymentConfig.projectIssues"
                    />
                    <span>{{ issueLabels[issue] }}</span>
                  </label>
                </div>
                <p class="field-help">
                  Welche Herausforderungen/Probleme sind im Projekt bekannt?
                </p>
              </div>

              <!-- Tools Deployment -->
              <div class="field field-full">
                <label for="tools-deployment">Tools (Deployment)</label>
                <input
                  id="tools-deployment"
                  type="text"
                  v-model="draft.deploymentConfig.toolsDeployment"
                  placeholder="z.B. Docker, Kubernetes, Jenkins, GitLab CI/CD, AWS, Azure, Terraform"
                />
                <p class="field-help">
                  Welche Tools/Plattformen werden für das Deployment genutzt?
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside class="preview-card">
          <h2>Deployment Config – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.deploymentConfig.timelinessOfAnalytics">
              <strong>Timeliness:</strong>
              <p>{{ timelinessLabels[draft.deploymentConfig.timelinessOfAnalytics] }}</p>
            </div>

            <div class="preview-item" v-if="draft.deploymentConfig.addressedUsers">
              <strong>Zielnutzer:</strong>
              <p>{{ draft.deploymentConfig.addressedUsers }}</p>
            </div>

            <div class="preview-item" v-if="draft.deploymentConfig.tests">
              <strong>Geplante Tests:</strong>
              <p>{{ draft.deploymentConfig.tests }}</p>
            </div>

            <div class="preview-item" v-if="draft.deploymentConfig.projectIssues?.length">
              <strong>Project Issues:</strong>
              <ul>
                <li v-for="issue in draft.deploymentConfig.projectIssues" :key="issue">
                  {{ issueLabels[issue] }}
                </li>
              </ul>
            </div>

            <div class="preview-item" v-if="draft.deploymentConfig.toolsDeployment">
              <strong>Deployment Tools:</strong>
              <p>{{ draft.deploymentConfig.toolsDeployment }}</p>
            </div>
          </div>
        </aside>
      </section>

      <section class="wizard-footer">
        <button type="button" class="btn-secondary" @click="goBack">
          Zurück
        </button>
        <div class="footer-actions">

          <button type="button" class="btn-primary" @click="goNext">
            Speichern & Weiter
          </button>
        </div>
      </section>
    </main>
  </div>
</template>



<style scoped>

</style>
