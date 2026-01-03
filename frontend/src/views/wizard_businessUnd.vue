<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import type { FormOfFinalProduct, TeamRole, TimelineUnit } from "@/types";
import { useToast } from "vue-toastification";

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

const progress = computed(() => draft.businessProgress);
const totalFields = 7; // businessGoal, formOfFinalProduct, teamRoles, teamSize, timeline, cost, tools

// Form of Final Product Options
const formOfProductOptions: FormOfFinalProduct[] = [
  'REPORT',
  'APPLICATION_SOFTWARE',
  'AUTOMATED_DECISION_SYSTEM',
  'INSIGHT_DOCUMENT',
  'OTHER'
];

const formLabels: Record<FormOfFinalProduct, string> = {
  REPORT: 'Report / Dokumentation',
  APPLICATION_SOFTWARE: 'Software-Anwendung',
  AUTOMATED_DECISION_SYSTEM: 'Automatisiertes Entscheidungssystem',
  INSIGHT_DOCUMENT: 'Insight-Dokument',
  OTHER: 'Andere'
};

// Team Roles
const teamRoleOptions: TeamRole[] = [
  'DATA_SCIENTIST',
  'DATA_ENGINEER',
  'PROJECT_MANAGER',
  'DOMAIN_EXPERT',
  'BUSINESS_ANALYST',
  'IT_INFRASTRUCTURE',
  'ML_ENGINEER'
];

const roleLabels: Record<TeamRole, string> = {
  DATA_SCIENTIST: 'Data Scientist',
  DATA_ENGINEER: 'Data Engineer',
  PROJECT_MANAGER: 'Project Manager',
  DOMAIN_EXPERT: 'Domain Expert',
  BUSINESS_ANALYST: 'Business Analyst',
  IT_INFRASTRUCTURE: 'IT Infrastructure',
  ML_ENGINEER: 'ML Engineer'
};

// Timeline Units
const timelineUnits: TimelineUnit[] = ['DAYS', 'WEEKS', 'MONTHS'];

const unitLabels: Record<TimelineUnit, string> = {
  DAYS: 'Tage',
  WEEKS: 'Wochen',
  MONTHS: 'Monate'
};

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
  router.push({ name: "projekt-erstellen" });
}

async function goNext() {
  // Validierung: Projekt muss existieren
  if (!draft.id) {
    toast.error("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
    router.push({ name: "projekt-erstellen-data" });
    return;
  }

  try {
    // Business Understanding speichern
    await api.patchBusinessUnderstanding(
      draft.id,
      draft.businessUnderstanding
    );

    console.log("✅ Business Understanding gespeichert");
    draft.saveDraft();
    router.push({ name: "projekt-erstellen-data" });

  } catch (error: unknown) {
    console.error("❌ Fehler beim Speichern:", error);
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

      <section class="wizard-main">
        <div class="form-card">
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
                  placeholder="z.B. Reduzierung der Kundenabwanderung um 20%, Optimierung der Lieferkette, Automatisierung der Dokumentenverarbeitung..."
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
                    v-for="form in formOfProductOptions"
                    :key="form"
                    :value="form"
                  >
                    {{ formLabels[form] }}
                  </option>
                </select>
                <p class="field-help">
                  Welche Form hat das finale Produkt (Report, Software, etc.)?
                </p>
              </div>

              <!-- Team Roles (Multi-Checkbox) -->
              <div class="field field-full">
                <label>Team-Rollen</label>
                <div class="checkbox-grid">
                  <label
                    v-for="role in teamRoleOptions"
                    :key="role"
                    class="checkbox-label"
                  >
                    <input
                      type="checkbox"
                      :value="role"
                      v-model="draft.businessUnderstanding.projectTeamRoles"
                    />
                    <span>{{ roleLabels[role] }}</span>
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
                      v-for="unit in timelineUnits"
                      :key="unit"
                      :value="unit"
                    >
                      {{ unitLabels[unit] }}
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
        </div>

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
              <p>{{ formLabels[draft.businessUnderstanding.formOfFinalProduct] }}</p>
            </div>

            <div class="preview-item" v-if="draft.businessUnderstanding.projectTeamRoles?.length">
              <strong>Team-Rollen:</strong>
              <ul>
                <li v-for="role in draft.businessUnderstanding.projectTeamRoles" :key="role">
                  {{ roleLabels[role] }}
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
                {{ unitLabels[draft.businessUnderstanding.timelineUnit || 'WEEKS'] }}
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
