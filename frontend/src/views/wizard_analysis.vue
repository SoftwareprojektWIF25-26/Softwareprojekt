<!-- views/ProjektErstellenAnalysisView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import type { AnalyticsType } from "@/types";
import { useToast } from "vue-toastification";

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

// Computed für den Fortschritt
const progress = computed(() => draft.analysisProgress);
const totalFields = 4;

// Analytics Type Optionen
const analyticsTypes: AnalyticsType[] = [
  'CLASSIFICATION',
  'REGRESSION',
  'CLUSTERING',
  'ANOMALY_DETECTION',
  'TIME_SERIES_FORECASTING',
  'RECOMMENDATION',
  'ASSOCIATION_RULE_LEARNING',
  'OTHER'
];


const analyticsLabels: Record<AnalyticsType, string> = {
  CLASSIFICATION: 'Classification ',
  REGRESSION: 'Regression ',
  CLUSTERING: 'Clustering ',
  ANOMALY_DETECTION: 'Anomaly Detection ',
  TIME_SERIES_FORECASTING: 'Time Series Forecasting ',
  RECOMMENDATION: 'Recommendation ',
  ASSOCIATION_RULE_LEARNING: 'Assoziationsanalyse',
  OTHER: 'Andere'
};

// Computed für Evaluation Metrics (kommagetrennt)
const metricsText = computed({
  get() {
    return (draft.analysisConfig.evaluationMetrics || []).join(", ");
  },
  set(val: string) {
    draft.analysisConfig.evaluationMetrics = val
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
});

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
  router.push({ name: "projekt-erstellen-data" });
}

async function goNext() {
  // Validierung
  if (!draft.id) {
    toast.error("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
    router.push({ name: "projekt-erstellen" });
    return;
  }


  try {
    // Analysis Config speichern
    await api.patchAnalysisConfig(
      draft.id,
      draft.analysisConfig
    );

    console.log("Analysis Config gespeichert");

    // Entwurf speichern
    draft.saveDraft();

    // Weiter zur nächsten Seite
    router.push({ name: "projekt-erstellen-deployment" });

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

      <section class="wizard-main">
        <div class="form-card">
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
                <label for="ds-goals">
                  Data Science Goals <span class=" "></span>
                </label>
                <textarea
                  id="ds-goals"
                  rows="4"
                  v-model="draft.analysisConfig.dataScienceGoals"
                  placeholder="Was soll das Modell erreichen? z.B. Vorhersage von Kundenabwanderung, Klassifikation von Produktkategorien, Anomalieerkennung in Transaktionen..."
                  required
                />
                <p class="field-help">
                  Beschreibe konkret, was mit den Daten analysiert/vorhergesagt werden soll.
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
                    v-for="type in analyticsTypes"
                    :key="type"
                    :value="type"
                  >
                    {{ analyticsLabels[type] }}
                  </option>
                </select>
                <p class="field-help">
                  Welche Art von Machine Learning / Analytics wird angewendet?
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
                  placeholder="z.B. scikit-learn, TensorFlow, PyTorch, XGBoost, R, Apache Spark MLlib"
                />
                <p class="field-help">
                  Welche Tools/Frameworks werden für die Analyse und Modellierung genutzt?
                </p>
              </div>
            </div>
          </div>
        </div>

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
              <p>{{ analyticsLabels[draft.analysisConfig.typeOfAnalytics] }}</p>
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
