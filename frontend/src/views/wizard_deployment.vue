<!-- views/DeploymentView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import { useToast } from "vue-toastification";

// Importiere alle Konstanten zentral
import {
  TIMELINESS_LEVELS,
  TIMELINESS_LABELS,
  PROJECT_ISSUE_TYPES,
  ISSUE_LABELS
} from "@/utils/constants";

// ============================================================================
// INITIALISIERUNG & STATE
// ============================================================================

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

const progress = computed(() => draft.deploymentProgress);
const totalFields = 5;

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  draft.loadDraft();

  // Sicherheitsprüfung: Ein Nutzer darf nicht mitten in den Wizard einsteigen.
  if (!draft.id) {
    toast.error("Kein aktives Projekt gefunden. Bitte starte von vorne.");
    router.push({ name: "projekt-erstellen" });
  }
});

// ============================================================================
// NAVIGATION & AKTIONEN
// ============================================================================

function goBack() {
  router.push({ name: "projekt-erstellen-analysis" });
}

/**
 * Speichert die aktuelle Konfiguration am Backend und navigiert zum nächsten Schritt.
 */
async function goNext() {
  if (!draft.id) {
    toast.error("Systemfehler: Keine Projekt-ID gefunden.");
    return;
  }

  try {
    // API-Aufruf an das Backend
    await api.patchDeploymentConfig(draft.id, draft.deploymentConfig);

    // Lokales Backup im Store aktualisieren
    draft.saveDraft();

    // Weiter zur letzten Seite (Utilization)
    router.push({ name: "projekt-erstellen-utilization" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern der Deployment Config:", error);

    // Standardisiertes Error-Handling (API wirft echte Error-Objekte)
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Systemfehler";
    toast.error(`Speichern fehlgeschlagen: ${errorMessage}`);
  }
}
</script>

<template>
  <div class="wizard-page">
    <main class="wizard-container">

      <!-- HEADER -->
      <section class="wizard-header">
        <p class="wizard-step">Projekt-Wizard · Schritt 4 von 5</p>
        <h1>{{ draft.title || 'Projekt' }} – Deployment</h1>
        <p class="wizard-subtitle">
          Beschreibe die Umsetzungsphase: Aktualität, Nutzer, Tests, Issues und Tools.
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

      <!-- HAUPTBEREICH (Formular & Vorschau) -->
      <section class="wizard-main">

        <!-- Nutzung von <form>, damit Enter-Taste den Submit auslöst -->
        <form class="form-card" @submit.prevent="goNext">
          <h2>Deployment Configuration</h2>

          <div class="form-section">
            <header class="section-header">
              <div>
                <p class="section-description">
                  Definiere wie und an wen die Analytics-Ergebnisse bereitgestellt werden: Aktualität, Zielgruppe, Tests, Issues und Deployment-Tools.
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
                    v-for="level in TIMELINESS_LEVELS"
                    :key="level"
                    :value="level"
                  >
                    {{ TIMELINESS_LABELS[level] }}
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

                <div class="multi-select-grid">
                  <label
                    v-for="issue in PROJECT_ISSUE_TYPES"
                    :key="issue"
                    class="select-card"
                    :class="{ selected: draft.deploymentConfig.projectIssues?.includes(issue) }"
                  >
                    <input
                      type="checkbox"
                      :value="issue"
                      v-model="draft.deploymentConfig.projectIssues"
                    />
                    <span>{{ ISSUE_LABELS[issue] }}</span>
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
        </form>

        <!-- SEITENLEISTE (Vorschau) -->
        <aside class="preview-card">
          <h2>Deployment Config – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.deploymentConfig.timelinessOfAnalytics">
              <strong>Timeliness:</strong>
              <p>{{ TIMELINESS_LABELS[draft.deploymentConfig.timelinessOfAnalytics] }}</p>
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
                  {{ ISSUE_LABELS[issue] }}
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

      <!-- FOOTER -->
      <section class="wizard-footer">
        <button type="button" class="btn-secondary" @click="goBack">
          ← Zurück
        </button>
        <div class="footer-actions">
          <button type="button" class="btn-primary" @click="goNext">
            Speichern & Weiter →
          </button>
        </div>
      </section>

    </main>
  </div>
</template>
