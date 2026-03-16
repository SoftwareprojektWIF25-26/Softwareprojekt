<!-- views/ProjektErstellenDataView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import { useToast } from "vue-toastification";

// Importiere alle Konstanten zentral
import {
  DATA_ACCESS_OPTIONS,
  DATA_ACCESS_LABELS,
  VELOCITY_OPTIONS,
  VELOCITY_LABELS,
  VERACITY_OPTIONS,
  VERACITY_LABELS,
  VARIETY_OPTIONS,
  VARIETY_LABELS,
  VARIABILITY_OPTIONS,
  VARIABILITY_LABELS,
  VOLUME_UNITS,
  PREPARATION_STEPS,
  PREPARATION_LABELS
} from "@/utils/constants";
import Projekt_erstellen from '@/views/projekt_erstellen.vue'

// ============================================================================
// INITIALISIERUNG & STATE
// ============================================================================

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

const progress = computed(() => draft.dataProgress);
const totalFields = 11;
const attemptedSubmit = ref(false);

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

/**
 * Konvertiert das Array der Datenquellen in einen kommagetrennten String
 * für das Textfeld und parst die Benutzereingabe zurück in ein bereinigtes Array.
 */
const dataSourcesText = computed({
  get() {
    if (!draft.dataCharacteristics.dataSources) return "";
    return draft.dataCharacteristics.dataSources.join(", ");
  },
  set(val: string) {
    // Teilt am Komma, entfernt Leerzeichen und filtert leere Einträge heraus
    draft.dataCharacteristics.dataSources = val
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
});

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  draft.loadDraft();

  // Sicherheitsprüfung: Nutzer darf nicht mitten in den Wizard springen
  if (!draft.id) {
    toast.error("Kein aktives Projekt gefunden. Bitte starte von vorne.");
    router.push({ name: "projekt-erstellen" });
  }
});

// ============================================================================
// NAVIGATION & AKTIONEN
// ============================================================================

function goBack() {
  router.push({ name: "projekt-erstellen-business" });
}

/**
 * Speichert die aktuelle Konfiguration am Backend und navigiert zum nächsten Schritt.
 */
async function goNext() {
  attemptedSubmit.value = true;

  if (!draft.id) {
    toast.error("Systemfehler: Keine Projekt-ID gefunden.");
    return;
  }

  try {
    // API-Aufruf an das Backend
    await api.patchDataCharacteristics(draft.id, draft.dataCharacteristics);

    // Lokales Backup im Store aktualisieren
    draft.saveDraft();

    // Weiter zur Analysis View
    router.push({ name: "projekt-erstellen-analysis" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern der Data Characteristics:", error);

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
        <p class="wizard-step">Projekt-Wizard · Schritt 2 von 5</p>
        <h1>{{ draft.title || 'Projekt' }} – Data Collection, Exploration & Preparation</h1>
        <p class="wizard-subtitle">
          Beschreibe deine Datenquellen, deren Qualität, Umfang und Vorbereitungsschritte.
          <span v-if="draft.lastSaved" class="auto-save-indicator">
            💾 Gespeichert: {{ draft.lastSavedFormatted }}
          </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Projekt-Erstellung</li>
          <li class="is-done">Business Understanding</li>
          <li class="is-active">Data Collection, Exploration & Preparation</li>
          <li>Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <!-- HAUPTBEREICH (Formular & Vorschau) -->
      <section class="wizard-main">

        <!-- Form Tag ermöglicht das Abschicken mit Enter -->
        <form class="form-card" @submit.prevent="goNext">
          <h2>Data Collection, Exploration and Preparation </h2>

          <div class="form-section">
            <header class="section-header">
              <div>
                <p class="section-description">
                  Fülle die Informationen zu deinen Daten aus: Datenquellen, Qualität, Umfang und Vorbereitungsschritte.
                </p>
              </div>
              <div>
                <span class="section-status">{{ progress }}/{{ totalFields }} Felder</span>
              </div>
            </header>

            <div class="section-grid">

              <!-- Data Sources -->
              <div class="field field-full">
                <label for="data-sources">Datenquellen</label>
                <textarea
                  id="data-sources"
                  rows="2"
                  v-model="dataSourcesText"
                  placeholder="z.B. PostgreSQL Datenbank, CSV Files, REST API, IoT Sensors"
                />
                <p class="field-help">Datenquellen durch Komma trennen</p>
              </div>

              <!-- Data Access (Multi-Select) -->
              <div class="field field-full">
                <label>Datenzugriff</label>

                <div class="multi-select-grid">
                  <label
                    v-for="type in DATA_ACCESS_OPTIONS"
                    :key="type"
                    class="select-card"
                    :class="{ selected: draft.dataCharacteristics.dataAccess?.includes(type) }"
                  >
                    <input
                      type="checkbox"
                      :value="type"
                      v-model="draft.dataCharacteristics.dataAccess"
                    />
                    <span>{{ DATA_ACCESS_LABELS[type] }}</span>
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
                    v-for="option in VELOCITY_OPTIONS"
                    :key="option"
                    :value="option"
                  >
                    {{ VELOCITY_LABELS[option] }}
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
                    v-for="option in VERACITY_OPTIONS"
                    :key="option"
                    :value="option"
                  >
                    {{ VERACITY_LABELS[option] }}
                    {{ String(option).toLowerCase() === 'poor' ? '(Niedrig) - Viele Fehler, Bereinigung nötig' : '' }}
                    {{ String(option).toLowerCase() === 'medium' ? '(Mittel) - Lücken/Rauschen, Vorverarbeitung nötig' : '' }}
                    {{ String(option).toLowerCase() === 'good' ? '(Hoch) - Sehr konsistent, kaum Bereinigung' : '' }}
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
                    v-for="option in VARIETY_OPTIONS"
                    :key="option"
                    :value="option"
                  >
                    {{ VARIETY_LABELS[option] }}
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
                      v-for="unit in VOLUME_UNITS"
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
                    v-for="option in VARIABILITY_OPTIONS"
                    :key="option"
                    :value="option"
                  >
                    {{ VARIABILITY_LABELS[option] }}
                  </option>
                </select>
              </div>

              <!-- Data Preparation Steps (Multi-Select) -->
              <div class="field field-full">
                <label>Data Preparation Steps</label>

                <div class="multi-select-grid">
                  <label
                    v-for="step in PREPARATION_STEPS"
                    :key="step"
                    class="select-card"
                    :class="{ selected: Array.isArray(draft.dataCharacteristics.dataPreparationSteps) && draft.dataCharacteristics.dataPreparationSteps.includes(step) }"
                  >
                    <input
                      type="checkbox"
                      :value="step"
                      v-model="draft.dataCharacteristics.dataPreparationSteps"
                    />
                    <span>{{ PREPARATION_LABELS[step] }}</span>
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
        </form>

        <!-- SEITENLEISTE (Vorschau) -->
        <aside class="preview-card">
          <h2>Data Collection, Exploration and Preparation  – Vorschau</h2>
          <p class="card-subtitle">

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
              <ul>
                <li v-for="access in draft.dataCharacteristics.dataAccess" :key="access">
                  {{ DATA_ACCESS_LABELS[access] }}
                </li>
              </ul>
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
              <p>{{ VELOCITY_LABELS[draft.dataCharacteristics.velocity] }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.veracity">
              <strong>Datenqualität:</strong>
              <p>{{ VERACITY_LABELS[draft.dataCharacteristics.veracity] }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.variety">
              <strong>Variety:</strong>
              <p>{{ VARIETY_LABELS[draft.dataCharacteristics.variety] }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.variability">
              <strong>Variabilität:</strong>
              <p>{{ VARIABILITY_LABELS[draft.dataCharacteristics.variability] }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.dataPreparationSteps?.length">
              <strong>Vorbereitung:</strong>
              <ul>
                <li v-for="preparation in draft.dataCharacteristics.dataPreparationSteps" :key="preparation">
                  {{ PREPARATION_LABELS[preparation] }}
                </li>
              </ul>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.dataSecurityConstraints">
              <strong>Datensicherheit:</strong>
              <p>{{ draft.dataCharacteristics.dataSecurityConstraints }}</p>
            </div>

            <div class="preview-item" v-if="draft.dataCharacteristics.toolsData">
              <strong>Tools:</strong>
              <p>{{ draft.dataCharacteristics.toolsData }}</p>
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
