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
        <h1>{{ draft.title || 'Projekt' }} – Utilization & Monitoring</h1>
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

          <div class="form-section">
            <header class="section-header">
              <div>
                <p class="section-description">
                  Definiere, wie das System nach dem Go-Live betrieben wird: Monitoring, Wartung und Tools für den laufenden Betrieb.
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
              <h3> Wizard fast abgeschlossen!</h3>
              <p>
                Klicke auf "Abschließen", um dein Projekt zu speichern und zum Dashboard zu gelangen.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section class="wizard-footer">
        <button type="button" class="btn-secondary" @click="goBack">
          ← Zurück
        </button>
        <div class="footer-actions">

          <button type="button" class="btn-primary" @click="finishWizard">
             Abschließen
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>

</style>
