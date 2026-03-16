<!-- views/ProjektErstellenUtilizationView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import { useToast } from "vue-toastification";

// ============================================================================
// INITIALISIERUNG & STATE
// ============================================================================

const draft = useProjectDraftStore();
const router = useRouter();
const toast = useToast();

const progress = computed(() => draft.utilizationProgress);
const totalFields = 3;

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
  router.push({ name: "projekt-erstellen-deployment" });
}

/**
 * Speichert die letzte Konfiguration (Utilization), schließt den Wizard ab,
 * triggert die Backend-Berechnung und leitet den Nutzer zum Dashboard weiter.
 */
async function finishWizard() {
  if (!draft.id) {
    toast.error("Systemfehler: Keine Projekt-ID gefunden.");
    return;
  }

  // WICHTIG: Projekt-ID sichern, bevor der Draft nach Abschluss geleert wird!
  const projectId: number = draft.id;

  try {
    // 1. Utilization Config speichern
    await api.patchUtilizationConfig(projectId, draft.utilizationConfig);

    // 2. Dem Backend signalisieren, dass der Wizard beendet ist (Startet die Gantt-Berechnung)
    await api.completeWizard(projectId);

    // 3. Draft aus dem LocalStorage und Store löschen (Aufräumen)
    draft.clearDraft();

    toast.success("Projekt erfolgreich erstellt und berechnet!");

    // 4. Navigation zum Projekt-Dashboard
    router.push({
      name: "dashboard",
      params: { id: String(projectId) }
    });

  } catch (error: unknown) {
    console.error("Fehler beim Abschließen des Projekts:", error);

    // Die API-Ebene wirft standardisierte Error-Objekte
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Systemfehler";
    toast.error(`Projekt konnte nicht abgeschlossen werden: ${errorMessage}`);
  }
}
</script>

<template>
  <div class="wizard-page">
    <main class="wizard-container">

      <!-- HEADER -->
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
          <li class="is-done">Projekt-Erstellung</li>
          <li class="is-done">Business Understanding</li>
          <li class="is-done">Data Collection, Exploration & Preparation</li>
          <li class="is-done">Analysis</li>
          <li class="is-done">Deployment</li>
          <li class="is-active">Utilization</li>
        </ol>
      </section>

      <!-- HAUPTBEREICH (Formular & Vorschau) -->
      <section class="wizard-main">

        <!-- Nutzung von <form>, damit Enter-Taste den Submit auslöst -->
        <form class="form-card" @submit.prevent="finishWizard">
          <h2>Utilization </h2>

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
                  placeholder="z.B. Model Drift Detection, Performance Monitoring, Data Quality Checks, Alerts bei Anomalien, KPI-Tracking..."
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
                  placeholder="z.B. Retraining-Zyklen (monatlich), Modell-Updates, Feature Engineering Updates, Datenpflege..."
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
        </form>

        <!-- SEITENLEISTE (Vorschau) -->
        <aside class="preview-card">
          <h2>Utilization  – Vorschau</h2>
          <p class="card-subtitle">

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

      <!-- FOOTER -->
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

