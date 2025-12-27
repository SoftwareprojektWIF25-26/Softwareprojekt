<!-- views/ProjektErstellenDataView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import type {
  DataAccessType,
  DataVelocity,
  DataVeracity,
  DataVariety,
  DataVariability,
  VolumeUnit,
  DataPreparationStep
} from "@/types";

const draft = useProjectDraftStore();
const router = useRouter();

// Computed für den Fortschritt
const progress = computed(() => draft.dataProgress);
const totalFields = 11;

// Enums für die Dropdowns
const dataAccessTypes: DataAccessType[] = ['INTERNAL', 'EXTERNAL', 'HYBRID'];
const velocityOptions: DataVelocity[] = ['BATCH', 'DAILY', 'HOURLY', 'CONTINUOUS'];
const veracityOptions: DataVeracity[] = ['POOR', 'MEDIUM', 'GOOD', 'EXCELLENT'];
const varietyOptions: DataVariety[] = ['LOW', 'MEDIUM', 'HIGH'];
const variabilityOptions: DataVariability[] = ['NEVER', 'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY'];
const volumeUnits: VolumeUnit[] = ['RECORDS', 'GB', 'TB', 'PB','MB', 'KB'];
const preparationSteps: DataPreparationStep[] = [
  'JOINS',
  'DEDUPLICATION',
  'OUTLIER_DETECTION',
  'NORMALIZATION',
  'MISSING_VALUE_IMPUTATION',
  'FEATURE_ENGINEERING',
  'ONE_HOT_ENCODING',
  'DATA_CLEANING',
  'TRANSFORMATION'
];

// Labels für bessere UX
const velocityLabels: Record<DataVelocity, string> = {
  BATCH: 'Batch (keine Echtzeit)',
  DAILY: 'Täglich',
  HOURLY: 'Stündlich',
  CONTINUOUS: 'Continuous (Echtzeit/Streaming)'
};

const veracityLabels: Record<DataVeracity, string> = {
  POOR: 'Schlecht',
  MEDIUM: 'Mittel',
  GOOD: 'Gut',
  EXCELLENT: 'Exzellent'
};

const varietyLabels: Record<DataVariety, string> = {
  LOW: 'Niedrig (ein Datentyp)',
  MEDIUM: 'Mittel (zwei Datentypen)',
  HIGH: 'Hoch (strukturiert, semi-strukturiert, unstrukturiert)'
};

const variabilityLabels: Record<DataVariability, string> = {
  NEVER: 'Nie',
  YEARLY: 'Jährlich',
  MONTHLY: 'Monatlich',
  WEEKLY: 'Wöchentlich',
  DAILY: 'Täglich',
  HOURLY: 'Stündlich'
};

const preparationLabels: Record<DataPreparationStep, string> = {
  JOINS: 'Joins',
  DEDUPLICATION: 'Deduplizierung',
  OUTLIER_DETECTION: 'Ausreißer-Erkennung',
  NORMALIZATION: 'Normalisierung',
  MISSING_VALUE_IMPUTATION: 'Fehlende Werte ersetzen',
  FEATURE_ENGINEERING: 'Feature Engineering',
  ONE_HOT_ENCODING: 'One-Hot Encoding',
  DATA_CLEANING: 'Datenbereinigung',
  TRANSFORMATION: 'Transformation'
};

// Computed für Data Sources (kommagetrennt)
const dataSourcesText = computed({
  get() {
    return (draft.dataCharacteristics.dataSources || []).join(", ");
  },
  set(val: string) {
    draft.dataCharacteristics.dataSources = val
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
  router.push({ name: "projekt-erstellen-business" });
}

async function goNext() {
  // Validierung
  if (!draft.id) {
    alert("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
    router.push({ name: "projekt-erstellen" });
    return;
  }

  if (!draft.dataCharacteristics.dataSources?.length) {
    alert("Bitte gib mindestens eine Datenquelle an.");
    return;
  }

  try {
    // Data Characteristics speichern
    await api.patchDataCharacteristics(
      draft.id,
      draft.dataCharacteristics
    );

    console.log("Data Characteristics gespeichert");

    // Entwurf speichern
    draft.saveDraft();

    // Weiter zur nächsten Seite
    router.push({ name: "projekt-erstellen-analysis" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern:", error);
    const errorMessage = getErrorMessage(error);
    alert(`Speichern fehlgeschlagen: ${errorMessage}`);
  }
}

// hier wird aktueller Stataus des Wizard geladen
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
        <p class="wizard-step">Projekt-Wizard · Schritt 2 von 5</p>
        <h1>Projekt anlegen – Data Collection, Exploration & Preparation</h1>
        <p class="wizard-subtitle">
          Beschreibe deine Datenquellen, deren Qualität, Umfang und Vorbereitungsschritte.
          <span v-if="draft.lastSaved" class="auto-save-indicator">
            💾 Gespeichert: {{ draft.lastSavedFormatted }}
          </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Business Understanding</li>
          <li class="is-active">Data Collection, Exploration & Preparation</li>
          <li>Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <section class="wizard-main">
        <div class="form-card">
          <h2>Data Characteristics</h2>
          <p class="card-subtitle">
            Fülle die Informationen zu deinen Daten aus. Die Vorschau aktualisiert sich automatisch.
          </p>

          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>2. Data Collection, Exploration & Preparation</h3>
                <p class="section-description">
                  Datenquellen, Qualität, Umfang und Vorbereitungsschritte.
                </p>
              </div>
              <div>
                <span class="section-status">{{ progress }}/{{ totalFields }} Felder</span>
              </div>
            </header>

            <div class="section-grid">
              <!-- Data Sources -->
              <div class="field field-full">
                <label for="data-sources">
                  Datenquellen <span class="required">*</span>
                </label>
                <textarea
                  id="data-sources"
                  rows="2"
                  v-model="dataSourcesText"
                  placeholder="z.B. PostgreSQL Datenbank, CSV Files, REST API, IoT Sensors"
                  required
                />
                <p class="field-help">Kommagetrennt. Mindestens eine Quelle erforderlich.</p>
              </div>

              <!-- Data Access (Multi-Select) -->
              <div class="field field-full">
                <label>Datenzugriff</label>
                <div class="checkbox-group">
                  <label
                    v-for="type in dataAccessTypes"
                    :key="type"
                    class="checkbox-label"
                  >
                    <input
                      type="checkbox"
                      :value="type"
                      v-model="draft.dataCharacteristics.dataAccess"
                    />
                    <span>{{ type }}</span>
                  </label>
                </div>
              </div>

              <!-- Data Availability -->
              <div class="field">
                <label for="data-availability">Datenverfügbarkeit</label>
                <select
                  id="data-availability"
                  v-model="draft.dataCharacteristics.dataAvailability"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option :value="true">Verfügbar</option>
                  <option :value="false">Nicht verfügbar</option>
                </select>
              </div>

              <!-- Velocity -->
              <div class="field">
                <label for="velocity">Velocity (Datengeschwindigkeit)</label>
                <select
                  id="velocity"
                  v-model="draft.dataCharacteristics.velocity"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="option in velocityOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ velocityLabels[option] }}
                  </option>
                </select>
              </div>

              <!-- Veracity (Data Quality) -->
              <div class="field">
                <label for="veracity">Veracity (Datenqualität)</label>
                <select
                  id="veracity"
                  v-model="draft.dataCharacteristics.veracity"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="option in veracityOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ veracityLabels[option] }}
                  </option>
                </select>
              </div>

              <!-- Variety -->
              <div class="field">
                <label for="variety">Variety (Datenvielfalt)</label>
                <select
                  id="variety"
                  v-model="draft.dataCharacteristics.variety"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="option in varietyOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ varietyLabels[option] }}
                  </option>
                </select>
              </div>

              <!-- Volume -->
              <div class="field">
                <label for="volume-value">Volume (Datenumfang)</label>
                <div class="input-group">
                  <input
                    id="volume-value"
                    type="number"
                    min="0"
                    v-model.number="draft.dataCharacteristics.volumeValue"
                    placeholder="z.B. 1000000"
                    class="input-with-select"
                  />
                  <select
                    v-model="draft.dataCharacteristics.volumeUnit"
                    class="unit-select"
                  >
                    <option
                      v-for="unit in volumeUnits"
                      :key="unit"
                      :value="unit"
                    >
                      {{ unit }}
                    </option>
                  </select>
                </div>
                <p class="field-help">Geschätzter Datenumfang</p>
              </div>

              <!-- Variability -->
              <div class="field">
                <label for="variability">Variability (Änderungshäufigkeit)</label>
                <select
                  id="variability"
                  v-model="draft.dataCharacteristics.variability"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="option in variabilityOptions"
                    :key="option"
                    :value="option"
                  >
                    {{ variabilityLabels[option] }}
                  </option>
                </select>
              </div>

              <!-- Data Preparation Steps -->
              <div class="field field-full">
                <label for="prep-steps">Data Preparation Steps</label>
                <select
                  id="prep-steps"
                  v-model="draft.dataCharacteristics.dataPreparationSteps"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="step in preparationSteps"
                    :key="step"
                    :value="step"
                  >
                    {{ preparationLabels[step] }}
                  </option>
                </select>
                <p class="field-help">
                  Hauptschritt der Datenaufbereitung (weitere können später ergänzt werden)
                </p>
              </div>

              <!-- Data Security Constraints -->
              <div class="field field-full">
                <label for="security">Datensicherheit & Privacy</label>
                <textarea
                  id="security"
                  rows="2"
                  v-model="draft.dataCharacteristics.dataSecurityConstraints"
                  placeholder="z.B. GDPR-konform, Pseudonymisierung erforderlich, Anonymisierung..."
                />
              </div>

              <!-- Tools Data -->
              <div class="field field-full">
                <label for="tools-data">Tools (Data)</label>
                <input
                  id="tools-data"
                  type="text"
                  v-model="draft.dataCharacteristics.toolsData"
                  placeholder="z.B. Pandas, SQL, Apache Spark, Airflow"
                />
              </div>
            </div>
          </div>
        </div>

        <aside class="preview-card">
          <h2>Data Characteristics – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.dataCharacteristics.dataSources?.length">
              <strong>Datenquellen:</strong>
              <ul>
                <li v-for="source in draft.dataCharacteristics.dataSources" :key="source">
                  {{ source }}
                </li>
              </ul>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.dataAccess?.length">
              <strong>Datenzugriff:</strong>
              <p>{{ draft.dataCharacteristics.dataAccess.join(', ') }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.dataAvailability !== undefined">
              <strong>Verfügbarkeit:</strong>
              <p>{{ draft.dataCharacteristics.dataAvailability ? 'Verfügbar' : 'Nicht verfügbar' }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.volumeValue">
              <strong>Datenumfang:</strong>
              <p>
                {{ draft.dataCharacteristics.volumeValue.toLocaleString('de-DE') }}
                {{ draft.dataCharacteristics.volumeUnit }}
              </p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.velocity">
              <strong>Velocity:</strong>
              <p>{{ velocityLabels[draft.dataCharacteristics.velocity] }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.veracity">
              <strong>Datenqualität:</strong>
              <p>{{ veracityLabels[draft.dataCharacteristics.veracity] }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.variety">
              <strong>Variety:</strong>
              <p>{{ varietyLabels[draft.dataCharacteristics.variety] }}</p>
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

.required {
  color: #ff4444;
  margin-left: 0.25rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-with-select {
  flex: 1;
}

.unit-select {
  flex: 0 0 120px;
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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
}

.preview-item ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #ccc;
}

.preview-item ul li {
  font-size: 0.9rem;
}

/* Alle deine vorhandenen Styles aus der ursprünglichen Datei hier einfügen */
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
