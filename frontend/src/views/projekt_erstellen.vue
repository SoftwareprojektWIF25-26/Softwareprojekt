<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import api from "@/api";
import axios from "axios";
import { useToast } from "vue-toastification";

const toast = useToast();
const draft = useProjectDraftStore();
const router = useRouter();


// Computed für Validierung
const canProceed = computed(() => draft.title.trim().length > 0);
const titleError = computed(() =>
  attemptedSubmit.value && draft.title.trim().length === 0
    ? "Projektname ist erforderlich."
    : ""
);
const attemptedSubmit = ref(false);

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
  attemptedSubmit.value = true;

  if (!canProceed.value) {
    toast.error("Bitte gib einen Projektnamen ein.");
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

    toast.error(`Projekt konnte nicht erstellt werden: ${getErrorMessage(error)}`);
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

      <section class="wizard-footer">
        <div></div>
        <div class="footer-actions">
          <button
            type="button"
            class="btn-primary"
            @click="createProject"
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

