<!-- views/ProjektErstellenUtilizationView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import { useToast } from "vue-toastification";

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

// Computed für den Fortschritt
const progress = computed(() => draft.utilizationProgress);
const totalFields = 3;

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
  router.push({ name: "projekt-erstellen-deployment" });
}

async function finishWizard() {
  // Validierung
  if (!draft.id) {
    toast.error("Fehler: Kein Projekt gefunden. Bitte starte von Schritt 1.");
    router.push({ name: "projekt-erstellen" });
    return;
  }

  // ✅ WICHTIG: ID sichern BEVOR draft gelöscht wird!
  const id = draft.id;

  try {
    // 1. Utilization Config speichern
    await api.patchUtilizationConfig(
      id,  // ✅ Lokale Variable verwenden
      draft.utilizationConfig
    );

    console.log("✅ Utilization Config gespeichert");

    // 2. Wizard abschließen & Berechnung durchführen
    const result = await api.completeWizard(id);  // ✅ Lokale Variable

    console.log("✅ Wizard abgeschlossen!", result);
    console.log("📊 Projektplan erstellt:", result.metrics);

    // 3. JETZT erst Draft löschen
    draft.clearDraft();

    // 4. Navigation mit gesicherter ID
    router.push({
      name: "dashboard",
      params: { id: String(id) }  // ✅ Lokale Variable (als String!)
    });

  } catch (error: unknown) {
    console.error("❌ Fehler beim Abschließen:", error);
    const errorMessage = getErrorMessage(error);
    toast.error(`Projekt konnte nicht abgeschlossen werden: ${errorMessage}`);
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
        <p class="wizard-step">Projekt-Wizard · Schritt 5 von 5</p>
        <h1>Projekt anlegen – Utilization & Monitoring</h1>
        <p class="wizard-subtitle">
          Beschreibe, wie das Projekt im Betrieb überwacht, gewartet und optimiert wird.
          <span v-if="draft.lastSaved" class="auto-save-indicator">
            💾 Gespeichert: {{ draft.lastSavedFormatted }}
          </span>
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Business Understanding</li>
          <li class="is-done">Data Collection, Exploration & Preparation</li>
          <li class="is-done">Analysis</li>
          <li class="is-done">Deployment</li>
          <li class="is-active">Utilization</li>
        </ol>
      </section>

      <section class="wizard-main">
        <div class="form-card">
          <h2>Utilization Configuration</h2>
          <p class="card-subtitle">
            Definiere, wie das System nach dem Go-Live betrieben wird.
          </p>

          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>5. Utilization & Monitoring</h3>
                <p class="section-description">
                  Monitoring, Wartung und Tools für den laufenden Betrieb.
                </p>
              </div>
              <div>
                <span class="section-status">{{ progress }}/{{ totalFields }} Felder</span>
              </div>
            </header>

            <div class="section-grid">
              <!-- Monitoring -->
              <div class="field field-full">
                <label for="monitoring">Monitoring</label>
                <textarea
                  id="monitoring"
                  rows="4"
                  v-model="draft.utilizationConfig.monitoring"
                  placeholder="z.B. Model Drift Detection, Performance Monitoring, Data Quality Checks, Alerts bei Anomalien, KPI-Tracking, Log-Analyse..."
                />
                <p class="field-help">
                  Wie wird das System überwacht? Welche Metriken werden getrackt?
                </p>
              </div>

              <!-- Maintenance -->
              <div class="field field-full">
                <label for="maintenance">Maintenance</label>
                <textarea
                  id="maintenance"
                  rows="4"
                  v-model="draft.utilizationConfig.maintenance"
                  placeholder="z.B. Retraining-Zyklen (monatlich), Modell-Updates, Feature Engineering Updates, Datenpflege, Performance-Optimierung..."
                />
                <p class="field-help">
                  Wie wird das System gewartet? Wie oft wird das Modell aktualisiert?
                </p>
              </div>

              <!-- Tools Utilization -->
              <div class="field field-full">
                <label for="tools-utilization">Tools (Utilization & Monitoring)</label>
                <input
                  id="tools-utilization"
                  type="text"
                  v-model="draft.utilizationConfig.toolsUtilization"
                  placeholder="z.B. Grafana, Prometheus, MLflow, Datadog, ELK Stack, Azure Monitor, CloudWatch"
                />
                <p class="field-help">
                  Welche Tools werden für Monitoring und Wartung eingesetzt?
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside class="preview-card">
          <h2>Utilization Config – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.utilizationConfig.monitoring">
              <strong>Monitoring:</strong>
              <p>{{ draft.utilizationConfig.monitoring }}</p>
            </div>

            <div class="preview-item" v-if="draft.utilizationConfig.maintenance">
              <strong>Wartung:</strong>
              <p>{{ draft.utilizationConfig.maintenance }}</p>
            </div>

            <div class="preview-item" v-if="draft.utilizationConfig.toolsUtilization">
              <strong>Utilization Tools:</strong>
              <p>{{ draft.utilizationConfig.toolsUtilization }}</p>
            </div>

            <div class="preview-summary">
              <h3>🎉 Wizard fast abgeschlossen!</h3>
              <p>
                Klicke auf "Abschließen", um dein Projekt zu speichern und zum Dashboard zu gelangen.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section class="wizard-footer">
        <button type="button" class="btn-secondary" @click="goBack">
          Zurück
        </button>
        <div class="footer-actions">

          <button type="button" class="btn-primary" @click="finishWizard">
            🚀 Abschließen
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



/* Alle deine vorhandenen Styles */
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

.preview-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #222;
  border-radius: 8px;
  border-left: 3px solid #0070c9;
}

.preview-summary h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
  color: #0070c9;
}

.preview-summary p {
  margin: 0;
  font-size: 0.85rem;
  color: #aaa;
  line-height: 1.4;
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
  font-weight: 500;
}

.btn-primary:hover {
  background: #0077d4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 112, 201, 0.4);
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
