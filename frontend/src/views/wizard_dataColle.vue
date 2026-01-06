<!-- views/ProjektErstellenDataView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
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
import { useToast } from "vue-toastification";

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

// Computed für den Fortschritt
const progress = computed(() => draft.dataProgress);
const totalFields = 11;



// Enums für die Dropdowns
const dataAccessOptions: DataAccessType[] = ['INTERNAL', 'EXTERNAL', 'HYBRID'];
const velocityOptions: DataVelocity[] = ['BATCH', 'DAILY', 'HOURLY', 'CONTINUOUS'];
const veracityOptions: DataVeracity[] = ['POOR', 'MEDIUM', 'GOOD', 'EXCELLENT'];
const varietyOptions: DataVariety[] = ['LOW', 'MEDIUM', 'HIGH'];
const variabilityOptions: DataVariability[] = ['NEVER', 'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'HOURLY'];
const volumeUnits: VolumeUnit[] = ['RECORDS', 'KB','MB', 'GB', 'TB', 'PB'];
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
const dataAccessLabels: Record<DataAccessType, string> = {
  INTERNAL: "intern",
  EXTERNAL: "extern",
  HYBRID: "hybrid",
}
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


// State für den Klick auf "Weiter"
const attemptedSubmit = ref(false);

// State für den Klick auf "Weiter"
const dataSourcesText = computed({
  get() {
    if (!draft.dataCharacteristics.dataSources) return "";

    return draft.dataCharacteristics.dataSources.join(",");
  },
  set(val: string) {
    draft.dataCharacteristics.dataSources = val.split(",");
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
  attemptedSubmit.value = true;
  if (!draft.id) {
    toast.error("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
    router.push({ name: "projekt-erstellen" });
    return;
  }
  if (draft.dataCharacteristics.dataSources) {
    draft.dataCharacteristics.dataSources = draft.dataCharacteristics.dataSources
      .map(s => s.trim())
      .filter(s => s.length > 0);

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
    toast.error(`Speichern fehlgeschlagen: ${errorMessage}`);
  }
}

// hier wird aktueller Stataus des Wizard geladen
onMounted(() => {

  draft.loadDraft();


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
        <h1>{{ draft.title || 'Projekt' }} – Data Collection, Exploration & Preparation</h1>
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

          <div class="form-section">
            <header class="section-header">
              <div>

                <p class="section-description">
                  Fülle die Informationen zu deinen Daten aus:Datenquellen, Qualität, Umfang und Vorbereitungsschritte.
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
                  Datenquellen
                </label>
                <textarea
                  id="data-sources"
                  rows="2"
                  v-model="dataSourcesText"
                  placeholder="z.B. PostgreSQL Datenbank, CSV Files, REST API, IoT Sensors"

                />


                <p class="field-help"> Datenquellen durch Komma trennen </p>

            </div>


              <!-- Data Access (Multi-Select - UPDATED) -->
              <div class="field field-full">
                <label>Datenzugriff</label>

                <div class="multi-select-grid">
                  <label
                    v-for="type in dataAccessOptions"
                    :key="type"
                    class="select-card"
                    :class="{ selected: draft.dataCharacteristics.dataAccess?.includes(type) }"
                  >
                    <input
                      type="checkbox"
                      :value="type"
                      v-model="draft.dataCharacteristics.dataAccess"
                    />
                    <span>{{ dataAccessLabels[type] }}</span>
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

              <!-- Data Preparation Steps (Multi-Select Update) -->
              <div class="field field-full">
                <label>Data Preparation Steps</label>

                <!-- NEUE KLASSEN: .multi-select-grid statt .checkbox-grid -->
                <div class="multi-select-grid">
                  <label
                    v-for="step in preparationSteps"
                    :key="step"
                    class="select-card"
                    :class="{ selected: Array.isArray(draft.dataCharacteristics.dataPreparationSteps)
              && draft.dataCharacteristics.dataPreparationSteps.includes(step) }"
                  >
                    <input
                      type="checkbox"
                      :value="step"
                      v-model="draft.dataCharacteristics.dataPreparationSteps"
                    />
                    <!-- KEIN .label-text mehr nötig, span reicht -->
                    <span>{{ preparationLabels[step] }}</span>
                  </label>
                </div>

                <p class="field-help">
                  Wählen Sie alle notwendigen Schritte der Datenaufbereitung aus.
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
              <p>
                {{ draft.dataCharacteristics.dataAccess
                .map((type: DataAccessType) => dataAccessLabels[type])
                .join(', ') }}
              </p>
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

            <!-- Neu: Variabilität -->
            <div class="preview-item" v-if="draft.dataCharacteristics.variability">
              <strong>Variabilität:</strong>
              <p>{{ variabilityLabels[draft.dataCharacteristics.variability] }}</p>
            </div>

            <!-- Neu: Vorbereitungsschritte -->
            <div class="preview-item" v-if="draft.dataCharacteristics.dataPreparationSteps">
              <strong>Vorbereitung:</strong>
              <!-- Annahme: Es ist ein einzelner Wert (Enum), kein Array. Falls Array, Logik anpassen wie bei dataAccess -->
              <p>{{ preparationLabels[draft.dataCharacteristics.dataPreparationSteps] }}</p>
            </div>

            <!-- Neu: Datensicherheit -->
            <div class="preview-item" v-if="draft.dataCharacteristics.dataSecurityConstraints">
              <strong>Datensicherheit:</strong>
              <p>{{ draft.dataCharacteristics.dataSecurityConstraints }}</p>
            </div>

            <!-- Neu: Tools -->
            <div class="preview-item" v-if="draft.dataCharacteristics.toolsData">
              <strong>Tools:</strong>
              <p>{{ draft.dataCharacteristics.toolsData }}</p>
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
