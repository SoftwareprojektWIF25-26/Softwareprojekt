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

/* Auto-Save Indicator */
.auto-save-indicator {
  display: inline-block;
  margin-left: 1rem;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 200, 100, 0.15);
  border: 1px solid rgba(0, 200, 100, 0.3);
  border-radius: 999px;
  font-size: 0.75rem;
  color: #00c864;
  animation: fadeInSave 0.3s ease-in;
}

/* Alle deine vorhandenen Styles */
.wizard-page {
  min-height: 100vh;
  background: #111;
  color: #f5f5f5;
  padding: 32px 24px 48px;
}

.wizard-container {
  width: min(1400px, 100%);
  margin: 0 auto;
}

.wizard-step {
  font-size: 0.85rem;
  color: #aaaaaa;
  margin-bottom: 0.25rem;
}

.wizard-header h1 {
  font-size: 2.2rem;
  color: #0070c9;
  margin-bottom: 0.5rem;
}

.wizard-subtitle {
  margin-bottom: 1rem;
  color: #c0c0c0;
}

.wizard-steps {
  display: flex;
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  font-size: 0.9rem;
}

.wizard-steps li {
  position: relative;
  padding-left: 1.5rem;
  color: #777;
}

.wizard-steps li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.45rem;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  border: 2px solid #555;
  background: transparent;
}

.wizard-steps li.is-done::before {
  border-color: #0070c9;
  background: #0070c9;
}

.wizard-steps li.is-active {
  color: #fff;
  font-weight: 600;
}

.wizard-steps li.is-active::before {
  border-color: #0070c9;
  background: #0070c9;
}

.wizard-main {
  display: grid;
  grid-template-columns: 2fr 1.4fr;
  gap: 2rem;
  align-items: flex-start;
}

.form-card,
.preview-card {
  background: #181818;
  border-radius: 14px;
  padding: 1.75rem 1.75rem 2rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.form-card h2,
.preview-card h2 {
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
  color: #0070c9;
}

.card-subtitle {
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 1.5rem;
}

.form-section {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.05rem;
  margin-bottom: 0.15rem;
}

.section-description {
  font-size: 0.85rem;
  color: #aaa;
}

.section-status {
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: #222;
  color: #ccc;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #333;
  background: #101010;
  color: #f5f5f5;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #0070c9;
  box-shadow: 0 0 0 1px rgba(0, 112, 201, 0.35);
}

.field textarea {
  resize: vertical;
}

.field-help {
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.25rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid #333;
}

.checkbox-label:hover {
  background: #222;
  border-color: #444;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-label span {
  font-size: 0.85rem;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-item strong {
  display: block;
  color: #0070c9;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.preview-item p {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.preview-item ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #ccc;
}

.preview-item ul li {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.wizard-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-primary,
.btn-secondary,
.btn-ghost {
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #555;
  color: #f5f5f5;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #777;
  background: #1a1a1a;
}

.btn-primary {
  background: #0070c9;
  color: white;
}

.btn-primary:hover {
  background: #0077d4;
}

.btn-ghost {
  background: transparent;
  color: #ccc;
}

.btn-ghost:hover {
  color: #fff;
  background: #222;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 960px) {
  .wizard-main {
    grid-template-columns: 1fr;
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
  }
}
</style>
