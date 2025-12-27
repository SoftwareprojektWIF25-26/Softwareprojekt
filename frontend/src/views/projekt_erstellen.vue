<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";

const draft = useProjectDraftStore();
const router = useRouter();

// Computed für Validierung
const canProceed = computed(() => draft.title.trim().length > 0);

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

async function createProject() {
  if (!canProceed.value) {
    alert("Bitte gib einen Projektnamen ein.");
    return;
  }

  try {
    console.log("📤 CREATE Request:", {
      title: draft.title.trim(),
      domain: draft.domain.trim() || undefined
    });

    // api.createProjekt gibt DIREKT Project zurück (unwrapResponse macht die Validierung!)
    const project = await api.createProjekt({
      title: draft.title.trim(),
      domain: draft.domain.trim() || undefined
    });

    // ✅ Direkt mit project arbeiten
    console.log("📥 Projekt erstellt:", project);

    const id = project.id;

    if (!id || typeof id !== 'number') {
      console.error("❌ Ungültige Projekt-ID:", project);
      throw new Error(`Ungültige Projekt-ID: ${id}`);
    }

    draft.setid(id);
    console.log("✅ Projekt erstellt mit ID:", id);

    // Draft speichern vor Navigation
    draft.saveDraft();

    // Kurz warten, damit der Store aktualisiert ist
    await new Promise(resolve => setTimeout(resolve, 100));

    // Weiterleiten
    router.push({ name: "projekt-erstellen-business" });

  } catch (error: unknown) {
    console.error("❌ Fehler beim Erstellen:", error);

    if (axios.isAxiosError(error)) {
      console.error("Response Status:", error.response?.status);
      console.error("Response Data:", error.response?.data);
      console.error("Request URL:", error.config?.url);
      console.error("Request Method:", error.config?.method);
    }

    alert(`Projekt konnte nicht erstellt werden: ${getErrorMessage(error)}`);
  }
}

onMounted(() => {
  // WICHTIG: Neues Projekt → Draft löschen!
  console.log("🆕 Neues Projekt - Draft wird gelöscht");
  draft.clearDraft();
});



</script>

<template>
  <div class="wizard-page">
    <main class="wizard-container">
      <section class="wizard-header">
        <p class="wizard-step">Projekt-Wizard · Schritt 0 von 5</p>
        <h1>Neues Projekt erstellen</h1>
        <p class="wizard-subtitle">
          Beginne mit einem Projektnamen und optional einer Domain.
          <span v-if="draft.lastSaved" class="auto-save-indicator">
            💾 Automatisch gespeichert: {{ draft.lastSavedFormatted }}
          </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-active">Projekt-Erstellung</li>
          <li>Business Understanding</li>
          <li>Data Collection, Exploration & Preparation</li>
          <li>Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <section class="wizard-main">
        <div class="form-card">
          <h2>Projekt-Informationen</h2>
          <p class="card-subtitle">
            Gib deinem Projekt einen Namen und wähle optional eine Domain.
          </p>

          <div class="form-section">
            <div class="section-grid">
              <!-- Projektname (PFLICHT) -->
              <div class="field field-full">
                <label for="project-title">
                  Projektname <span class="required">*</span>
                </label>
                <input
                  id="project-title"
                  type="text"
                  v-model="draft.title"
                  placeholder="z.B. Customer Churn Prediction, Sales Forecasting, Fraud Detection"
                  required
                  autofocus
                />
                <p class="field-help">
                  Ein aussagekräftiger Name, der das Projekt beschreibt.
                </p>
              </div>

              <!-- Domain (OPTIONAL) -->
              <div class="field field-full">
                <label for="project-domain">Domain / Branche</label>
                <input
                  id="project-domain"
                  type="text"
                  v-model="draft.domain"
                  placeholder="z.B. Retail, Finance, Healthcare, Public Services, Manufacturing"
                />
                <p class="field-help">
                  In welcher Branche oder Domäne ist das Projekt angesiedelt?
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside class="preview-card">
          <h2>Projekt – Vorschau</h2>
          <p class="card-subtitle">
            So wird dein Projekt angelegt.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.title">
              <strong>📋 Projektname:</strong>
              <p>{{ draft.title }}</p>
            </div>

            <div class="preview-item" v-if="draft.domain">
              <strong>🏢 Domain:</strong>
              <p>{{ draft.domain }}</p>
            </div>

            <div class="preview-summary">
              <h3>📝 Nächster Schritt</h3>
              <p>
                Nach dem Erstellen des Projekts kannst du im nächsten Schritt
                das <strong>Business Understanding</strong> ausfüllen: Geschäftsziel,
                Team, Budget und Zeitplan.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section class="wizard-footer">
        <div></div>
        <div class="footer-actions">
          <button
            type="button"
            class="btn-primary"
            @click="createProject"
            :disabled="!canProceed"
          >
            Projekt erstellen & Weiter →
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

/* Alle Styles wie vorher - gleicher Look & Feel */
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

/* Header */
.wizard-step {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  color: #888;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.wizard-header h1 {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
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
  line-height: 1.5;
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
  gap: 2rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .wizard-main {
    grid-template-columns: 1.5fr 1fr;
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

/* Checkboxes & Radio */
.checkbox-group,
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

.preview-summary {
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(0, 112, 201, 0.1) 0%, rgba(0, 168, 255, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 112, 201, 0.2);
}

.preview-summary h3 {
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  margin: 0 0 0.75rem;
  color: #00a8ff;
  font-weight: 600;
}

.preview-summary p {
  margin: 0;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: #aaa;
  line-height: 1.5;
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
    order: -1; /* Preview oben auf Mobile */
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

