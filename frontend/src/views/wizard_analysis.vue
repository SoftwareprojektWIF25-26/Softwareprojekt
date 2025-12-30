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
  'RANKING',
  'OTHER'
];

// Deutsche Labels für bessere UX
const analyticsLabels: Record<AnalyticsType, string> = {
  CLASSIFICATION: 'Classification (Klassifizierung)',
  REGRESSION: 'Regression (Vorhersage kontinuierlicher Werte)',
  CLUSTERING: 'Clustering (Gruppierung)',
  ANOMALY_DETECTION: 'Anomaly Detection (Ausreißererkennung)',
  TIME_SERIES_FORECASTING: 'Time Series Forecasting (Zeitreihenprognose)',
  RECOMMENDATION: 'Recommendation (Empfehlungssystem)',
  RANKING: 'Ranking (Rangfolge)',
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
        <h1>Projekt anlegen – Analysis & Modeling</h1>
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
          <p class="card-subtitle">
            Definiere die analytischen Ziele und Metriken für dein Projekt.
          </p>

          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>3. Analysis & Modeling</h3>
                <p class="section-description">
                  Data Science Ziele, Analytics-Typ, Metriken und Tools.
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
                  Kommagetrennt. Welche Metriken werden zur Bewertung des Modells verwendet?
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
/* Alle deine vorhandenen Styles */

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

.required {
  color: #ff4444;
  margin-left: 0.25rem;
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
}
</style>
