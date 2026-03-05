<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import { useToast } from "vue-toastification";

// Importiere die Konstanten zentral
import {
  FORM_OF_PRODUCT_OPTIONS,
  FORM_LABELS,
  TEAM_ROLE_OPTIONS,
  TEAM_ROLE_LABELS,
  TIMELINE_UNITS,
  UNIT_LABELS
} from "@/utils/constants";

// ============================================================================
// INITIALISIERUNG & STATE
// ============================================================================

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

const progress = computed(() => draft.businessProgress);
const totalFields = 7; // businessGoal, formOfFinalProduct, teamRoles, teamSize, timeline, cost, tools

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
  router.push({ name: "projekt-erstellen" });
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
    await api.patchBusinessUnderstanding(draft.id, draft.businessUnderstanding);

    // Lokales Backup im Store/LocalStorage aktualisieren
    draft.saveDraft();

    // Weiter zur Data Collection View
    router.push({ name: "projekt-erstellen-data" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern des Business Understandings:", error);

    // Die API-Ebene wirft standardisierte Error-Objekte
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
        <p class="wizard-step">Projekt-Wizard · Schritt 1 von 5</p>
        <h1>{{ draft.title || 'Projekt' }} – Business Understanding</h1>
        <p class="wizard-subtitle">
          Beschreibe Geschäftsziel, Team, Zeitrahmen und erwartete Kosten.
          <span v-if="draft.lastSaved" class="auto-save-indicator">
            💾 Automatisch gespeichert: {{ draft.lastSavedFormatted }}
          </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Projekt-Erstellung</li>
          <li class="is-active">Business Understanding</li>
          <li>Data Collection, Exploration & Preparation</li>
          <li>Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <!-- HAUPTBEREICH (Formular & Vorschau) -->
      <section class="wizard-main">

        <!-- Nutzung von <form>, damit Enter-Taste den Submit auslöst -->
        <form class="form-card" @submit.prevent="goNext">
          <h2>Business Understanding</h2>

          <div class="form-section">
            <header class="section-header">
              <div>
                <p class="section-description">
                  Fülle die Basisinformationen aus: Geschäftsziel, Produktform, Team und Budget.
                </p>
              </div>
              <div>
                <span class="section-status">{{ progress }}/{{ totalFields }} Felder</span>
              </div>
            </header>

            <div class="section-grid">

              <!-- Business Goal -->
              <div class="field field-full">
                <label for="business-goal">Geschäftsziel</label>
                <textarea
                  id="business-goal"
                  rows="3"
                  v-model="draft.businessUnderstanding.businessGoal"
                  placeholder="z.B. Reduzierung der Kundenabwanderung um 20%, Optimierung der Lieferkette..."
                />
                <p class="field-help">
                  Was soll das Projekt aus Business-Perspektive erreichen?
                </p>
              </div>

              <!-- Form of Final Product -->
              <div class="field field-full">
                <label for="form-product">Form des finalen Produkts</label>
                <select
                  id="form-product"
                  v-model="draft.businessUnderstanding.formOfFinalProduct"
                >
                  <option :value="undefined">Bitte wählen</option>
                  <option
                    v-for="form in FORM_OF_PRODUCT_OPTIONS"
                    :key="form"
                    :value="form"
                  >
                    {{ FORM_LABELS[form] }}
                  </option>
                </select>
                <p class="field-help">
                  Welche Form hat das finale Produkt (Report, Software, etc.)?
                </p>
              </div>

              <!-- Team Roles (Multi-Checkbox) -->
              <div class="field field-full">
                <label>Team-Rollen</label>

                <div class="multi-select-grid">
                  <label
                    v-for="role in TEAM_ROLE_OPTIONS"
                    :key="role"
                    class="select-card"
                    :class="{ selected: draft.businessUnderstanding.projectTeamRoles?.includes(role) }"
                  >
                    <input
                      type="checkbox"
                      :value="role"
                      v-model="draft.businessUnderstanding.projectTeamRoles"
                    />
                    <span>{{ TEAM_ROLE_LABELS[role] }}</span>
                  </label>
                </div>

                <p class="field-help">
                  Welche Rollen sind im Projektteam vertreten?
                </p>
              </div>

              <!-- Team Size -->
              <div class="field">
                <label for="team-size">Teamgröße</label>
                <input
                  id="team-size"
                  type="number"
                  min="1"
                  max="100"
                  v-model.number="draft.businessUnderstanding.teamSize"
                  placeholder="z.B. 5"
                />
                <p class="field-help">
                  Wie viele Personen arbeiten am Projekt?
                </p>
              </div>

              <!-- Timeline (Value + Unit) -->
              <div class="field">
                <label for="timeline">Projektdauer</label>
                <div class="input-group">
                  <input
                    id="timeline"
                    type="number"
                    min="1"
                    v-model.number="draft.businessUnderstanding.timelineValue"
                    placeholder="z.B. 12"
                    class="input-with-select"
                  />
                  <select
                    v-model="draft.businessUnderstanding.timelineUnit"
                    class="unit-select"
                  >
                    <option
                      v-for="unit in TIMELINE_UNITS"
                      :key="unit"
                      :value="unit"
                    >
                      {{ UNIT_LABELS[unit] }}
                    </option>
                  </select>
                </div>
                <p class="field-help">
                  Wie lange soll das Projekt dauern?
                </p>
              </div>

              <!-- Estimated Cost -->
              <div class="field field-full">
                <label for="cost">Geschätzte Kosten (€)</label>
                <input
                  id="cost"
                  type="number"
                  min="0"
                  step="100"
                  v-model.number="draft.businessUnderstanding.estimatedCost"
                  placeholder="z.B. 50000"
                />
                <p class="field-help">
                  Grobe Kostenschätzung für das gesamte Projekt.
                </p>
              </div>

              <!-- Tools Business Understanding -->
              <div class="field field-full">
                <label for="tools">Tools (Business Understanding)</label>
                <input
                  id="tools"
                  type="text"
                  v-model="draft.businessUnderstanding.toolsBusinessUnderstanding"
                  placeholder="z.B. Jira, Confluence, MS Project, Miro"
                />
                <p class="field-help">
                  Welche Tools werden für Planung und Dokumentation verwendet?
                </p>
              </div>
            </div>
          </div>
        </form>

        <!-- SEITENLEISTE (Vorschau) -->
        <aside class="preview-card">
          <h2>Business Understanding – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.businessUnderstanding.businessGoal">
              <strong>Geschäftsziel:</strong>
              <p>{{ draft.businessUnderstanding.businessGoal }}</p>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.formOfFinalProduct">
              <strong>Produktform:</strong>
              <p>{{ FORM_LABELS[draft.businessUnderstanding.formOfFinalProduct] }}</p>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.projectTeamRoles?.length">
              <strong>Team-Rollen:</strong>
              <ul>
                <li v-for="role in draft.businessUnderstanding.projectTeamRoles" :key="role">
                  {{ TEAM_ROLE_LABELS[role] }}
                </li>
              </ul>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.teamSize">
              <strong>Teamgröße:</strong>
              <p>{{ draft.businessUnderstanding.teamSize }} Personen</p>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.timelineValue">
              <strong>Projektdauer:</strong>
              <p>
                {{ draft.businessUnderstanding.timelineValue }}
                {{ UNIT_LABELS[draft.businessUnderstanding.timelineUnit || 'WEEKS'] }}
              </p>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.estimatedCost">
              <strong>Geschätzte Kosten:</strong>
              <p>{{ draft.businessUnderstanding.estimatedCost.toLocaleString('de-DE') }} €</p>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.toolsBusinessUnderstanding">
              <strong>Tools:</strong>
              <p>{{ draft.businessUnderstanding.toolsBusinessUnderstanding }}</p>
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


