<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import { useToast } from "vue-toastification";

const toast = useToast();
const draft = useProjectDraftStore();
const router = useRouter();

// ============================================================================
// VALIDIERUNG & STATE
// ============================================================================

const attemptedSubmit = ref(false);

const canProceed = computed(() => draft.title.trim().length > 0);

const titleError = computed(() =>
  attemptedSubmit.value && !canProceed.value
    ? "Projektname ist erforderlich."
    : ""
);

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  if (!draft.id) {
    // Neues Projekt: Store bereinigen, um alte Ghost-Daten zu vermeiden
    draft.clearDraft();
  }
});

// ============================================================================
// METHODEN
// ============================================================================

/**
 * Erstellt ein neues Projekt oder aktualisiert ein bestehendes
 * und navigiert anschließend zum nächsten Wizard-Schritt.
 */
async function saveProjectAndProceed() {
  attemptedSubmit.value = true;

  if (!canProceed.value) {
    toast.error("Bitte gib einen Projektnamen ein.");
    return;
  }

  try {
    const payload = {
      title: draft.title.trim(),
      domain: draft.domain.trim() || undefined
    };

    if (draft.id) {
      // === UPDATE FALL ===
      await api.updateProjekt(draft.id, payload);
    } else {
      // === CREATE FALL ===
      const project = await api.createProjekt(payload);

      if (!project.id || typeof project.id !== 'number') {
        throw new Error("Fehlerhafte Antwort vom Server: Keine gültige Projekt-ID zurückgegeben.");
      }

      // Neue ID im Store für alle weiteren Wizard-Schritte sichern
      draft.setId(project.id);
    }

    // Fortschritt lokal speichern und zum nächsten Schritt navigieren
    draft.saveDraft();
    router.push({ name: "projekt-erstellen-business" });

  } catch (error: unknown) {
    console.error("Fehler beim Speichern des Projekts:", error);

    // Fallback-Fehlermeldung extrahieren (falls die API den Fehler bereits wirft, ist es ein Error-Objekt)
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Systemfehler";
    toast.error(errorMessage);
  }
}
</script>

<template>
  <div class="wizard-page">
    <main class="wizard-container">

      <!-- HEADER -->
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

      <!-- HAUPTBEREICH (Formular & Vorschau) -->
      <section class="wizard-main">

        <!-- Nutzung von <form>, damit Enter-Taste den Submit auslöst -->
        <form class="form-card" @submit.prevent="saveProjectAndProceed">
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
                  :class="{'has-error': titleError}"
                />
                <p v-if="titleError" class="field-error">
                  {{ titleError }}
                </p>
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
                  placeholder="z.B. Retail, Finance, Healthcare, Public Services"
                />
                <p class="field-help">
                  In welcher Branche oder Domäne ist das Projekt angesiedelt?
                </p>
              </div>
            </div>
          </div>
        </form>

        <!-- SEITENLEISTE (Vorschau) -->
        <aside class="preview-card">
          <h2>Projekt – Vorschau</h2>
          <p class="card-subtitle">
            So wird dein Projekt angelegt.
          </p>
          <div class="preview-content">
            <div class="preview-item" v-if="draft.title">
              <strong>📋 Projektname:</strong>
              <span>{{ draft.title }}</span>
            </div>

            <div class="preview-item" v-if="draft.domain">
              <strong>🏢 Domain:</strong>
              <span>{{ draft.domain }}</span>
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

      <!-- FOOTER -->
      <section class="wizard-footer">
        <div></div> <!-- Leerer Platzhalter für linke Seite (z.B. Zurück-Button) -->
        <div class="footer-actions">
          <button
            type="button"
            class="btn-primary"
            @click="saveProjectAndProceed"
          >
            Projekt erstellen & Weiter →
          </button>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>

</style>
