<script setup lang="ts">
import { useProjectDraftStore } from "@/stores/projektDraft";
import { useRouter } from "vue-router";
import api from "@/api"; // API importieren
import ProjektSteckbrief from "@/components/ProjektSteckbrief.vue";

const draft = useProjectDraftStore();
const router = useRouter();

async function goNext() {
  // 0. Einfache Validierung
  if (!draft.projekt.Titel) {
    alert("Bitte gib einen Projekttitel ein.");
    return;
  }

  try {
    // ---------------------------------------------------------
    // SCHRITT 1a: Projekt initial anlegen (POST /create)
    // ---------------------------------------------------------
    // Wir senden hier erst mal nur Titel & Domain, um die ID zu bekommen.
    const createResponse = await api.createProjekt({
      title: draft.projekt.Titel,
      domain: draft.projekt.Domain
    });

    const newProjectId = createResponse.data.id;
    console.log("Projekt erstellt mit ID:", newProjectId);

    // WICHTIG: ID im Store speichern für die nächsten Schritte!
    // Falls dein 'Projekt'-Interface im Frontend keine ID hat,
    // füge sie in 'types/index.ts' hinzu oder nutze 'any' als Workaround.
    (draft.projekt as any).id = newProjectId;


    // ---------------------------------------------------------
    // SCHRITT 1b: Details speichern (PATCH /business-understanding)
    // ---------------------------------------------------------
    // Wir mappen die deutschen Frontend-Felder auf die englischen Backend-Felder
    const businessData = {
      businessGoal: draft.projekt.Geschaeftsziel,
      formOfFinalProduct: draft.projekt.FormFinaleProdukt,
      teamSize: draft.projekt.Teamgroesse,
      timelineValue: draft.projekt.Zeitraum ? 12 : undefined, // Beispiel! Backend erwartet Zahl?
      timelineUnit: 'MONTHS', // Hartcodiert oder auch aus Formular
      estimatedCost: draft.projekt.Kosten,
      // toolsBusinessUnderstanding: ... falls du das Feld hast
    };

    await api.patchBusinessUnderstanding(newProjectId, businessData);
    console.log("Business Understanding gespeichert.");


    // ---------------------------------------------------------
    // SCHRITT 2: Weiterleiten
    // ---------------------------------------------------------
    router.push({ name: "projekt-erstellen-data" });

  } catch (error: any) {
    console.error("Fehler beim Speichern:", error);
    const msg = error.response?.data?.errors?.[0]?.msg || "Unbekannter Fehler";
    alert("Speichern fehlgeschlagen: " + msg);
  }
}
</script>


<template>
  <div class="wizard-page">
    <main class="wizard-container">
      <!-- HEADER / STEP INFO -->
      <section class="wizard-header">
        <p class="wizard-step">Projekt-Wizard · Schritt 1 von 5</p>
        <h1>Projekt anlegen – Business Understanding</h1>
        <p class="wizard-subtitle">
          Fülle die wichtigsten Infos zu deinem Data-Science-Projekt aus. Rechts siehst du eine Live-Vorschau.
        </p>

        <ol class="wizard-steps">
          <li class="is-active">Business Understanding</li>
          <li>Data Collection, Exploration &amp; Preparation</li>
          <li>Analysis</li>
          <li>Deployment</li>
          <li>Utilization</li>
        </ol>
      </section>

      <!-- MAIN: LINKS FORM, RECHTS VORSCHAU -->
      <section class="wizard-main">
        <!-- LINKE KARTE: FORM -->
        <div class="form-card">
          <h2>Projekt-Steckbrief</h2>
          <p class="card-subtitle">
            Beschreibe dein Projekt in mehreren Kategorien. Die Vorschau aktualisiert sich automatisch.
          </p>

          <!-- 1. Business Understanding -->
          <div class="form-section">
            <header class="section-header">
              <div>
                <h3>1. Business Understanding</h3>
                <p class="section-description">
                  Basisinfos zu Domain, Ziel und Team.
                </p>
              </div>
              <div>
                <span class="section-status">0/8 Felder</span>
              </div>
            </header>

            <div class="section-grid">
              <!-- Titel -->
              <div class="field field-full">
                <label for="title">Projekt-Titel</label>
                <input
                  id="title"
                  type="text"
                  v-model="draft.projekt.Titel"
                  placeholder="z. B. Vorhersage von Parkplatzauslastung in Split"
                />
                <p class="field-help">Max. 100 Zeichen.</p>
              </div>

              <!-- Domain -->
              <div class="field">
                <label for="domain">Domain</label>
                <select id="domain" v-model="draft.projekt.Domain">
                  <option value="">Bitte wählen</option>
                  <option>Public Services</option>
                  <option>Manufacturing</option>
                  <option>Healthcare</option>
                  <option>Finance</option>
                  <option>Retail</option>
                </select>
                <p class="field-help">Wähle die fachliche Domäne des Projekts.</p>
              </div>

              <!-- Teamgröße -->
              <div class="field">
                <label for="team-size">Teamgröße</label>
                <input
                  id="team-size"
                  type="number"
                  min="1"
                  max="20"
                  v-model.number="draft.projekt.Teamgroesse"
                />
              </div>

              <!-- Zeithorizont -->
              <div class="field">
                <label for="timeline">Zeithorizont</label>
                <select id="timeline" v-model="draft.projekt.Zeitraum">
                  <option value="">Bitte wählen</option>
                  <option>&lt; 3 Monate</option>
                  <option>3–6 Monate</option>
                  <option>&gt; 6 Monate</option>
                </select>
              </div>

              <!-- Form des finalen Produkts -->
              <div class="field">
                <label for="final-product">Form des finalen Produkts</label>
                <select id="final-product" v-model="draft.projekt.FormFinaleProdukt">
                  <option value="">Bitte wählen</option>
                  <option>Dashboard</option>
                  <option>Report</option>
                  <option>API</option>
                  <option>Anwendung / Service</option>
                </select>
              </div>

              <!-- Kosten -->
              <div class="field">
                <label for="costs">Kosten (geschätzt)</label>
                <div class="input-inline">
                  <input
                    id="costs"
                    type="number"
                    min="0"
                    v-model.number="draft.projekt.Kosten"
                  />
                  <span class="suffix">€</span>
                </div>
                <p class="field-help">Kann grob geschätzt werden; optional.</p>
              </div>

              <!-- Geschäftsziel -->
              <div class="field field-full">
                <label for="goal">Geschäftsziel</label>
                <textarea
                  id="goal"
                  rows="3"
                  v-model="draft.projekt.Geschaeftsziel"
                  placeholder="Wie verbessert das Projekt einen Geschäftsprozess oder eine Kennzahl?"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- RECHTE KARTE: VORSCHAU -->
        <aside class="preview-card">
          <h2>Projektsteckbrief – Vorschau</h2>
          <p class="card-subtitle">Aktualisiert sich automatisch während du tippst.</p>
          <ProjektSteckbrief :projekt="draft.projekt" />
        </aside>
      </section>

      <!-- FOOTER BUTTONS -->
      <section class="wizard-footer">
        <button type="button" class=""  > </button>
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
