<!-- views/ProjektErstellenAnalysisView.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectDraftStore } from '@/stores/projektDraft'
import api from '@/api'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { ANALYTICS_LABELS, ANALYTICS_TYPES } from '@/utils/constants'


// ============================================================================
// INITIALISIERUNG & STATE
// ============================================================================

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

const progress = computed(() => draft.analysisProgress);
const totalFields = 4;

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

/**
 * Wandelt das Array der Metriken in einen kommagetrennten String um (fürs Textfeld)
 * und parst die Eingabe des Nutzers wieder zurück in ein sauberes Array.
 */
const metricsText = computed({
  get() {
    return (draft.analysisConfig.evaluationMetrics || []).join(", ");
  },
  set(val: string) {
    draft.analysisConfig.evaluationMetrics = val
      .split(",")
      .map(s => s.trim())
      .filter(Boolean); // Entfernt leere Einträge
  }
});

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
  router.push({ name: "projekt-erstellen-data" });
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
    await api.patchAnalysisConfig(draft.id, draft.analysisConfig);

    // Lokales Backup aktualisieren
    draft.saveDraft();

    // Weiter zum nächsten Schritt
    router.push({ name: "projekt-erstellen-deployment" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern der Analysis Config:", error);

    // Fallback-Fehlermeldung extrahieren (falls die API den Fehler bereits wirft, ist es ein Error-Objekt)
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
        <p class="wizard-step">Projekt-Wizard · Schritt 3 von 5</p>
        <h1>{{ draft.title || 'Projekt' }} – Analysis & Modeling</h1>
        <p class="wizard-subtitle">
          Beschreibe die Data Science Ziele, den Analytics-Typ und die Bewertungsmetriken.
          <span v-if="draft.lastSaved" class="auto-save-indicator">
            💾 Gespeichert: {{ draft.lastSavedFormatted }}
          </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Business Understanding</li>
          <li class="is-done">Data Collection, Exploration & Preparation</li>
          <li class="is-active">Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <!-- HAUPTBEREICH (Formular & Vorschau) -->
      <section class="wizard-main">

        <!-- Nutzung von <form>, damit Enter-Taste den Submit auslöst -->
        <form class="form-card" @submit.prevent="goNext">
          <h2>Analysis Configuration</h2>

          <div class="form-section">
            <header class="section-header">
              <div>
                <p class="section-description">
                  Definiere die analytischen Ziele und Metriken für dein Projekt: Data Science Ziele, Analytics-Typ, Metriken und Tools.
                </p>
              </div>
              <div>
                <span class="section-status">{{ progress }}/{{ totalFields }} Felder</span>
              </div>
            </header>

            <div class="section-grid">
              <!-- Data Science Goals -->
              <div class="field field-full">
                <label for="ds-goals">Data Science Goals</label>
                <textarea
                  id="ds-goals"
                  rows="4"
                  v-model="draft.analysisConfig.dataScienceGoals"
                  placeholder="Was soll das Modell erreichen? z.B. Vorhersage von Kundenabwanderung, Klassifikation von Produktkategorien..."
                  required
                />
                <p class="field-help">
                  Beschreibe konkret, was mit den Daten analysiert oder vorhergesagt werden soll.
                </p>
              </div>

              <!-- Type of Analytics -->
              <div class="field field-full">
                <label for="analytics-type">Type of Analytics</label>
                <select
                  id="analytics-type"
                  v-model="draft.analysisConfig.typeOfAnalytics"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="type in ANALYTICS_TYPES"
                    :key="type"
                    :value="type"
                  >
                    {{ ANALYTICS_LABELS[type] }}
                  </option>
                </select>
                <p class="field-help">
                  Welche Art von Machine Learning / Analytics wird primär angewendet?
                </p>
              </div>

              <!-- Evaluation Metrics -->
              <div class="field field-full">
                <label for="metrics">Evaluation Metrics</label>
                <textarea
                  id="metrics"
                  rows="2"
                  v-model="metricsText"
                  placeholder="z.B. Accuracy, Precision, Recall, F1-Score, RMSE, MAE, AUC-ROC"
                />
                <p class="field-help">
                  Welche Metriken werden zur Bewertung des Modells verwendet? (Kommagetrennt)
                </p>
              </div>

              <!-- Tools Analysis -->
              <div class="field field-full">
                <label for="tools-analysis">Tools (Analysis & Modeling)</label>
                <input
                  id="tools-analysis"
                  type="text"
                  v-model="draft.analysisConfig.toolsAnalysis"
                  placeholder="z.B. scikit-learn, TensorFlow, PyTorch, XGBoost, R"
                />
                <p class="field-help">
                  Welche Tools oder Frameworks werden für die Analyse und Modellierung genutzt?
                </p>
              </div>
            </div>
          </div>
        </form>

        <!-- SEITENLEISTE (Vorschau) -->
        <aside class="preview-card">
          <h2>Analysis Config – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.analysisConfig.dataScienceGoals">
              <strong>Data Science Ziele:</strong>
              <p>{{ draft.analysisConfig.dataScienceGoals }}</p>
            </div>

            <div class="preview-item" v-if="draft.analysisConfig.typeOfAnalytics">
              <strong>Analytics Type:</strong>
              <p>{{ ANALYTICS_LABELS[draft.analysisConfig.typeOfAnalytics] }}</p>
            </div>

            <div class="preview-item" v-if="draft.analysisConfig.evaluationMetrics?.length">
              <strong>Evaluation Metrics:</strong>
              <ul>
                <li v-for="metric in draft.analysisConfig.evaluationMetrics" :key="metric">
                  {{ metric }}
                </li>
              </ul>
            </div>

            <div class="preview-item" v-if="draft.analysisConfig.toolsAnalysis">
              <strong>Analysis Tools:</strong>
              <p>{{ draft.analysisConfig.toolsAnalysis }}</p>
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

<style scoped>

</style>
