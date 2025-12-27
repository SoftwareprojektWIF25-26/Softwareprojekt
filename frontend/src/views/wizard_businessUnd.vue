<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import type { FormOfFinalProduct, TeamRole, TimelineUnit } from "@/types";

const draft = useProjectDraftStore();
const router = useRouter();

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
    alert("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
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
    alert(`Speichern fehlgeschlagen: ${errorMessage}`);
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
          <p class="card-subtitle">
            Fülle die Basisinformationen aus. Die Vorschau aktualisiert sich automatisch.
          </p>

          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>1. Business Understanding</h3>
                <p class="section-description">
                  Geschäftsziel, Produktform, Team und Budget.
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
/* === VOLLSTÄNDIGE BREITE NUTZEN === */
.wizard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #f5f5f5;
  padding: 0;
}

.wizard-container {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2.5rem) clamp(1rem, 4vw, 3rem);
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

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

@keyframes fadeInSave {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Wizard Header */
.wizard-step {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  color: #888;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.wizard-header h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.wizard-subtitle {
  margin-bottom: 1.5rem;
  color: #aaa;
  font-size: clamp(0.85rem, 2vw, 1rem);
  line-height: 1.6;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

/* Progress Stepper */
.wizard-steps {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.5rem, 2vw, 1rem);
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  font-size: clamp(0.75rem, 1.8vw, 0.9rem);
}

.wizard-steps li {
  position: relative;
  padding-left: 1.5rem;
  color: #555;
  transition: color 0.3s ease;
}

.wizard-steps li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.45rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  border: 2px solid #444;
  background: transparent;
  transition: all 0.3s ease;
}

.wizard-steps li.is-done {
  color: #0070c9;
}

.wizard-steps li.is-done::before {
  border-color: #0070c9;
  background: #0070c9;
  box-shadow: 0 0 8px rgba(0, 112, 201, 0.4);
}

.wizard-steps li.is-active {
  color: #fff;
  font-weight: 600;
}

.wizard-steps li.is-active::before {
  border-color: #00a8ff;
  background: #00a8ff;
  box-shadow: 0 0 12px rgba(0, 168, 255, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Main Grid */
.wizard-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: start;
}

@media (min-width: 1024px) {
  .wizard-main {
    grid-template-columns: 1.8fr 1fr;
  }
}

@media (min-width: 1400px) {
  .wizard-main {
    grid-template-columns: 2fr 1fr;
  }
}

@media (min-width: 1600px) {
  .wizard-main {
    grid-template-columns: 2.2fr 1fr;
  }
}

/* Cards */
.form-card,
.preview-card {
  background: rgba(24, 24, 24, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: clamp(1.25rem, 3vw, 2rem);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.form-card:hover,
.preview-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.form-card h2,
.preview-card h2 {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

.card-subtitle {
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: #888;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

/* Section Header */
.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

@media (min-width: 640px) {
  .section-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
  }
}

.section-header h3 {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  margin-bottom: 0.15rem;
  color: #fff;
  font-weight: 600;
}

.section-description {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  color: #888;
}

.section-status {
  font-size: clamp(0.7rem, 1.8vw, 0.8rem);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #222 0%, #2a2a2a 100%);
  color: #0070c9;
  font-weight: 600;
  border: 1px solid rgba(0, 112, 201, 0.2);
  white-space: nowrap;
}

/* Form Grid */
.section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .section-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.5rem;
  }
}

.field-full {
  grid-column: 1 / -1;
}

/* Form Fields */
.field label {
  display: block;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  margin-bottom: 0.5rem;
  color: #ccc;
  font-weight: 500;
}

.required {
  color: #ff6b6b;
  margin-left: 0.25rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(16, 16, 16, 0.8);
  color: #f5f5f5;
  padding: 0.75rem 1rem;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  transition: all 0.3s ease;
  font-family: inherit;
}

.field input:hover,
.field select:hover,
.field textarea:hover {
  border-color: rgba(0, 112, 201, 0.3);
  background: rgba(16, 16, 16, 0.95);
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #0070c9;
  background: rgba(16, 16, 16, 1);
  box-shadow:
    0 0 0 3px rgba(0, 112, 201, 0.15),
    0 4px 12px rgba(0, 112, 201, 0.1);
}

.field textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

.field-help {
  font-size: clamp(0.7rem, 1.8vw, 0.75rem);
  color: #666;
  margin-top: 0.4rem;
  line-height: 1.3;
}

/* Checkboxes */
.checkbox-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .checkbox-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}

.checkbox-label:hover {
  background: rgba(0, 112, 201, 0.1);
  border-color: rgba(0, 112, 201, 0.3);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
  accent-color: #0070c9;
}

/* Input Groups */
.input-group {
  display: flex;
  gap: 0.75rem;
}

.input-with-select {
  flex: 1;
}

.unit-select {
  flex: 0 0 clamp(100px, 20vw, 130px);
}

/* Preview Content */
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.preview-item {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border-left: 3px solid #0070c9;
}

.preview-item strong {
  display: block;
  color: #00a8ff;
  margin-bottom: 0.5rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  font-weight: 600;
}

.preview-item p {
  color: #ccc;
  margin: 0;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  line-height: 1.6;
}

.preview-item ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #ccc;
}

.preview-item ul li {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  margin-bottom: 0.35rem;
  line-height: 1.4;
}

/* Footer */
.wizard-footer {
  margin-top: clamp(2rem, 5vw, 3rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-ghost {
  border-radius: 999px;
  padding: clamp(0.65rem, 2vw, 0.85rem) clamp(1.25rem, 3vw, 1.75rem);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-secondary {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #f5f5f5;
}

.btn-secondary:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 112, 201, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 112, 201, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-ghost {
  background: transparent;
  color: #aaa;
  border: 1px solid transparent;
}

.btn-ghost:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Responsive Adjustments */
@media (max-width: 1023px) {
  .wizard-main {
    grid-template-columns: 1fr;
  }

  .preview-card {
    order: -1;
  }
}

@media (max-width: 639px) {
  .wizard-steps {
    font-size: 0.7rem;
  }

  .wizard-steps li {
    padding-left: 1.2rem;
  }

  .wizard-steps li::before {
    width: 0.5rem;
    height: 0.5rem;
    top: 0.4rem;
  }
}
</style>
