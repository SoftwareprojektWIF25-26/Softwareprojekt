<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useProjectDraftStore } from "@/stores/projektDraft";
import ProjektSteckbrief from "@/components/ProjektSteckbrief.vue";

const draft = useProjectDraftStore();
const router = useRouter();

function goBack() {
  router.push({ name: "projekt-erstellen-data" });
}

function goNext() {
  router.push({ name: "projekt-erstellen-deployment" });
}

const bewertungText = computed({
  get() {
    return (draft.projekt.Bewertungskriterien ?? []).join(", ");
  },
  set(val: string) {
    draft.projekt.Bewertungskriterien = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  },
});
</script>

<template>
  <div class="wizard-page">
    <main class="wizard-container">
      <section class="wizard-header">
        <p class="wizard-step">Projekt-Wizard · Schritt 3 von 5</p>
        <h1>Projekt anlegen – Analysis</h1>
        <p class="wizard-subtitle">
          Beschreibe Ziele, Analytik-Typ und Bewertungsmetriken. Rechts siehst du die Live-Vorschau.
        </p>

        <ol class="wizard-steps">
          <li class="is-done">Business Understanding</li>
          <li class="is-done">Data Collection, Exploration &amp; Preparation</li>
          <li class="is-active">Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <section class="wizard-main">
        <div class="form-card">
          <h2>Projekt-Steckbrief</h2>
          <p class="card-subtitle">
            Fülle die Analyse-Infos aus. Die Vorschau aktualisiert sich automatisch.
          </p>

          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>3. Analysis</h3>
                <p class="section-description">
                  Ziele, Analytik-Typ, Zeitraum, Tools und Bewertung.
                </p>
              </div>
              <div>
                <span class="section-status">0/5 Felder</span>
              </div>
            </header>

            <div class="section-grid">
              <div class="field field-full">
                <label for="ds-goals">Data Science Goals</label>
                <textarea
                  id="ds-goals"
                  rows="3"
                  v-model="draft.projekt.DataScienceZiele"
                  placeholder="Was soll vorhergesagt/klassifiziert/optimiert werden?"
                />
              </div>

              <div class="field">
                <label for="atype">Type of Analytics</label>
                <select id="atype" v-model="draft.projekt.Analysetyp">
                  <option value="">Bitte wählen</option>
                  <option>Descriptive</option>
                  <option>Diagnostic</option>
                  <option>Predictive</option>
                  <option>Prescriptive</option>
                </select>
              </div>

              <div class="field">
                <label for="atime">Timelines of Analytics</label>
                <select id="atime" v-model="draft.projekt.Analysezeitrahmen">
                  <option value="">Bitte wählen</option>
                  <option>Einmalig / ad-hoc</option>
                  <option>Täglich</option>
                  <option>Wöchentlich</option>
                  <option>Monatlich</option>
                  <option>Continuous Streaming</option>
                </select>
              </div>

              <div class="field field-full">
                <label for="atools">Tools Analysis</label>
                <input
                  id="atools"
                  type="text"
                  v-model="draft.projekt.Analysetools"
                  placeholder="z.B. scikit-learn, PyTorch, R, Power BI"
                />
              </div>

              <div class="field field-full">
                <label for="metrics">Evaluation Metrics</label>
                <textarea
                  id="metrics"
                  rows="2"
                  v-model="bewertungText"
                  placeholder="Kommagetrennt, z.B. RMSE, Accuracy, Recall, F1"
                />
                <p class="field-help">Tipp: einfach mit Komma trennen.</p>
              </div>
            </div>
          </div>
        </div>

        <aside class="preview-card">
          <h2>Projektsteckbrief – Vorschau</h2>
          <p class="card-subtitle">
            Aktualisiert sich automatisch während du tippst.
          </p>
          <ProjektSteckbrief :projekt="draft.projekt" />
        </aside>
      </section>

      <section class="wizard-footer">
        <button type="button" class="btn-secondary" @click="goBack">
          Zurück
        </button>
        <div class="footer-actions">
          <button type="button" class="btn-ghost">Entwurf speichern</button>
          <button type="button" class="btn-primary" @click="goNext">
            Speichern &amp; Weiter
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
<style scoped>
/* Layout */
.wizard-page {
  min-height: 100vh;
  background: #111;
  color: #f5f5f5;
  padding: 32px 24px 48px;   /* wie am Anfang: etwas Rand links/rechts */
}

.wizard-container {
  width: min(1400px, 100%);  /* maximale Breite 1400px, sonst 100% */
  margin: 0 auto;           /* zentrieren */
}



/* Header */
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

/* Stepper */
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
.wizard-steps li.is-active {
  color: #fff;
  font-weight: 600;
}
.wizard-steps li.is-active::before {
  border-color: #0070c9;
  background: #0070c9;
}

/* Main */
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

/* Form Section */
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

/* Grid */
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}
.field-full {
  grid-column: 1 / -1;
}

/* Fields */
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

/* Input mit Suffix */
.input-inline {
  display: flex;
  align-items: center;
}
.input-inline .suffix {
  margin-left: 0.4rem;
  font-size: 0.85rem;
}

/* Footer */
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
}
.btn-secondary {
  background: transparent;
  border: 1px solid #555;
  color: #f5f5f5;
}
.btn-primary {
  background: #0070c9;
  color: white;
}
.btn-ghost {
  background: transparent;
  color: #ccc;
}
.footer-actions {
  display: flex;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 960px) {
  .wizard-main {
    grid-template-columns: 1fr;
  }
}
</style>
