<script setup lang="ts">
import {
  defaultWeights,
  BusinessUnderstandingTask,
  AnalysisTask,
  DeploymentTask,
  EvaluationTask,
  DataTasks,
  CategoryPayload,
} from '@/types'
import { reactive, onMounted, computed, ref } from 'vue' // 'ref' hinzugefügt
import api from '@/api'
import { useToast } from 'vue-toastification'

// --- KATEGORIEN ---
const categories = ref<CategoryPayload[]>([]);

// State für die Erstellung einer neuen Kategorie (Standardfarbe z.B. Blau)
const newCategory = reactive({
  name: '',
  color: '#3b82f6'
});

async function addCategory() {
  if (!newCategory.name.trim()) {
    toast.warning('Bitte gib einen Namen für die Kategorie ein.');
    return;
  }

  try {
    await api.saveCategory({ name: newCategory.name, color: newCategory.color });
    toast.success('Kategorie erfolgreich erstellt');
    // Zurücksetzen
    newCategory.name = '';
    // Reload
    categories.value = await api.getCategories();
  } catch (err) {
    toast.error('Fehler beim Erstellen der Kategorie');
  }
}

async function removeCategory(id?: number) {
  if (!id) return;

  try {
    await api.deleteCategory(id);
    toast.success('Kategorie gelöscht');
    // Reload
    categories.value = await api.getCategories();
  } catch (err) {
    toast.error('Fehler beim Löschen der Kategorie');
  }
}

// --- RESTLICHE LOGIK ---
const toast = useToast()
const productivity = reactive({
  productivity: 0,
})

const cost = reactive({
  hourly_rate: 0,
})

function save() {
  const payload = {
    defaultWeights: { ...weights },
    businessTasks: { ...businessWeights },
    dataTasks: { ...dataTasks },
    analysisTasks: { ...analysisTasks },
    evaluationTasks: { ...evaluationTasks },
    deploymentTasks: { ...deploymentTasks },
    productivity: { ...productivity },
    cost: { ...cost },
  }

  api
    .patchWeights(payload)
    .then(() => {
      console.log('Gewichtungen gespeichert')
      toast.success('Gewichtungen erfolgreich gespeichert')
    })
    .catch((err) => {
      console.error('Fehler beim Speichern der Gewichtungen:', err)
      toast.error(err.message || 'Fehler beim Speichern der Gewichtungen')
    })
}

const weights = reactive<defaultWeights>({
  data_access: 0,
  data_availability: 0,
  stakeholder_support: 0,
  tools_available: 0,
  data_variety: 0,
  data_velocity: 0,
  num_sources: 0,
  analytics_type: 0,
  data_quality: 0,
  privacy_concerns: 0,
  missing_data: 0,
  goal_clarity: 0,
})
const businessWeights = reactive<BusinessUnderstandingTask>({
  assess_situation: 0,
  derive_targets: 0,
  compose_team: 0,
  create_project_plan: 0,
  set_criteria_objectives: 0,
})
const totalbusinessweights = computed(
  () =>
    businessWeights.assess_situation +
    businessWeights.compose_team +
    businessWeights.create_project_plan +
    businessWeights.derive_targets +
    businessWeights.set_criteria_objectives,
)

const remaining_business_weights = (current: number) => {
  return Number((1 - (totalbusinessweights.value - current)).toFixed(2))
}
/* --------------------------------------------------
   DATA TASKS
-------------------------------------------------- */
const dataTasks = reactive<DataTasks>({
  identify_sources: 0,
  acquire_data: 0,
  describe_data: 0,
  explore_data: 0,
  asses_data_quality: 0,
  prepare_data: 0,
  develop_pipeline: 0,
})

const totalDataTasks = computed(
  () =>
    dataTasks.identify_sources +
    dataTasks.acquire_data +
    dataTasks.describe_data +
    dataTasks.explore_data +
    dataTasks.asses_data_quality +
    dataTasks.prepare_data +
    dataTasks.develop_pipeline,
)

const remainingDataTasks = (current: number) =>
  Number((1 - (totalDataTasks.value - current)).toFixed(2))

/* --------------------------------------------------
   ANALYSIS TASKS
-------------------------------------------------- */
const analysisTasks = reactive<AnalysisTask>({
  define_hypothesis: 0,
  select_model: 0,
  design_test: 0,
  develop_model: 0,
  assess_model: 0,
  develop_pipeline: 0,
})

const totalAnalysisTasks = computed(
  () =>
    analysisTasks.define_hypothesis +
    analysisTasks.select_model +
    analysisTasks.design_test +
    analysisTasks.develop_model +
    analysisTasks.assess_model +
    analysisTasks.develop_pipeline,
)

const remainingAnalysisTasks = (current: number) =>
  Number((1 - (totalAnalysisTasks.value - current)).toFixed(2))

/* --------------------------------------------------
   EVALUATION TASKS
-------------------------------------------------- */
const evaluationTasks = reactive<EvaluationTask>({
  assess_results: 0,
  evaluate_process: 0,
})

const totalEvaluationTasks = computed(
  () => evaluationTasks.assess_results + evaluationTasks.evaluate_process,
)

const remainingEvaluationTasks = (current: number) =>
  Number((1 - (totalEvaluationTasks.value - current)).toFixed(2))

/* --------------------------------------------------
   DEPLOYMENT TASKS
-------------------------------------------------- */
const deploymentTasks = reactive<DeploymentTask>({
  perform_assessment: 0,
  plan_deployment: 0,
  plan_monitoring_maintenance: 0,
  test_deployment: 0,
  perform_integration: 0,
  finalize_project: 0,
})

const totalDeploymentTasks = computed(
  () =>
    deploymentTasks.perform_assessment +
    deploymentTasks.plan_deployment +
    deploymentTasks.plan_monitoring_maintenance +
    deploymentTasks.test_deployment +
    deploymentTasks.perform_integration +
    deploymentTasks.finalize_project,
)

const remainingDeploymentTasks = (current: number) =>
  Number((1 - (totalDeploymentTasks.value - current)).toFixed(2))

const isSaveDisabled = computed(
  () =>
    totalbusinessweights.value > 1 ||
    totalAnalysisTasks.value > 1 ||
    totalEvaluationTasks.value > 1 ||
    totalDeploymentTasks.value > 1,
)

onMounted(async () => {
  try {
    const data = await api.getWeights()

    Object.assign(weights, data.defaultWeights)
    Object.assign(businessWeights, data.businessTasks)
    Object.assign(dataTasks, data.dataTasks)
    Object.assign(analysisTasks, data.analysisTasks)
    Object.assign(evaluationTasks, data.evaluationTasks)
    Object.assign(deploymentTasks, data.deploymentTasks)
    if (data.productivity) Object.assign(productivity, data.productivity)
    if (data.cost) Object.assign(cost, data.cost)

    console.log('✅ Weights erfolgreich geladen')

    // Projektkategorien laden
    try {
      const catData = await api.getCategories();
      categories.value = catData;
    } catch (catErr) {
      console.error('Fehler beim Laden der Kategorien', catErr);
    }

  } catch (err: any) {
    console.error('❌ Fehler beim Laden der Gewichtungen:', err)
    toast.error(err.message || 'Fehler beim Laden der Gewichtungen')
  }
})

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (!element) return

  const headerOffset = 100
  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset
  const startPosition = window.pageYOffset
  const distance = offsetPosition - startPosition
  const duration = 750 //(1500 = 1.5 Sekunden)

  let start: number | null = null

  function step(currentTime: number) {
    if (!start) start = currentTime
    const elapsed = currentTime - start
    const progress = Math.min(elapsed / duration, 1)

    const easeProgress =
      progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

    window.scrollTo(0, startPosition + distance * easeProgress)

    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}
</script>


<template>
  <div class="page-container">
    <aside class="sidebar">
      <h2>Navigation</h2>
      <ul>
        <li><a @click.prevent="scrollToSection('default-weights')">Default</a></li>
        <li>
          <a @click.prevent="scrollToSection('business-understanding')">Business Understanding</a>
        </li>
        <li>
          <a @click.prevent="scrollToSection('data-tasks')"
            >Data Collection, Exploration, Preparation</a
          >
        </li>
        <li><a @click.prevent="scrollToSection('analysis-tasks')">Analysis</a></li>
        <li><a @click.prevent="scrollToSection('evaluation-tasks')">Evaluation</a></li>
        <li><a @click.prevent="scrollToSection('deployment-tasks')">Deployment</a></li>
        <li><a @click.prevent="scrollToSection('productivity')">Produktivität</a></li>
        <li><a @click.prevent="scrollToSection('cost')">Personalkosten</a></li>
        <li><a @click.prevent="scrollToSection('categories')">Projekt-Kategorien</a></li>
      </ul>
      <div class="sidebar-footer">
        <button class="btn-primary" :disabled="isSaveDisabled" @click="save">Speichern</button>
      </div>
    </aside>

    <main class="main-content">
      <section class="wizard-header" id="default-weights">
        <h1>Default Gewichtung</h1>
      </section>
      <div class="form-card">
        <h2>Eingaben</h2>
        <div class="section-grid">
          <div class="field">
            <label for="data_access">Datenzugang</label>
            <input
              id="data_access"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.data_access"
            />
          </div>

          <div class="field">
            <label for="data_availability">Datenverfügbarkeit</label>
            <input
              id="data_availability"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.data_availability"
            />
          </div>

          <div class="field">
            <label for="data_variety">Datenvielfalt</label>
            <input
              id="data_variety"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.data_variety"
            />
          </div>

          <div class="field">
            <label for="data_velocity">Datengeschwindigkeit</label>
            <input
              id="data_velocity"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.data_velocity"
            />
          </div>

          <div class="field">
            <label for="data_quality">Datenqualität</label>
            <input
              id="data_quality"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.data_quality"
            />
          </div>

          <div class="field">
            <label for="num_sources">Anzahl Datenquellen</label>
            <input
              id="num_sources"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.num_sources"
            />
          </div>

          <div class="field">
            <label for="analytics_type">Analyseart</label>
            <input
              id="analytics_type"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.analytics_type"
            />
          </div>

          <div class="field">
            <label for="privacy_concerns">Datenschutzbedenken</label>
            <input
              id="privacy_concerns"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.privacy_concerns"
            />
          </div>

          <div class="field">
            <label for="missing_data">Fehlende Daten</label>
            <input
              id="missing_data"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.missing_data"
            />
          </div>

          <div class="field">
            <label for="goal_clarity">Klarheit über das Ziel</label>
            <input
              id="goal_clarity"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.goal_clarity"
            />
          </div>

          <div class="field">
            <label for="stakeholder_support">Stakeholder-Unterstützung</label>
            <input
              id="stakeholder_support"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.stakeholder_support"
            />
          </div>

          <div class="field">
            <label for="tools_available">Verfügbare Tools</label>
            <input
              id="tools_available"
              type="number"
              min="0"
              max="5"
              step="0.1"
              v-model.number="weights.tools_available"
            />
          </div>
        </div>
      </div>
      <div class="wizard-header">
        <h1>Task Gewichtung</h1>
      </div>
      <div class="form-card" id="business-understanding">
        <h2>Business Understanding Tasks – Gewichtung</h2>
        <p>Summe: {{ totalbusinessweights.toFixed(2) }} / 1</p>
        <div class="section-grid">
          <div class="field">
            <label>Situation analysieren</label>
            <input
              type="number"
              step="0.01"
              min="0"
              :max="remaining_business_weights(businessWeights.assess_situation)"
              v-model.number="businessWeights.assess_situation"
            />
          </div>

          <div class="field">
            <label>Projektteam zusammenstellen</label>
            <input
              type="number"
              step="0.01"
              min="0"
              :max="remaining_business_weights(businessWeights.compose_team)"
              v-model.number="businessWeights.compose_team"
            />
          </div>

          <div class="field">
            <label>Geschäftsziele & Erfolgskriterien festlegen</label>
            <input
              type="number"
              step="0.01"
              min="0"
              :max="remaining_business_weights(businessWeights.set_criteria_objectives)"
              v-model.number="businessWeights.set_criteria_objectives"
            />
          </div>

          <div class="field">
            <label>Data Science Ziele ableiten</label>
            <input
              type="number"
              step="0.01"
              min="0"
              :max="remaining_business_weights(businessWeights.derive_targets)"
              v-model.number="businessWeights.derive_targets"
            />
          </div>

          <div class="field">
            <label>Projektplan erstellen</label>
            <input
              type="number"
              step="0.01"
              min="0"
              :max="remaining_business_weights(businessWeights.create_project_plan)"
              v-model.number="businessWeights.create_project_plan"
            />
          </div>

          <p v-if="totalbusinessweights > 1" class="field-error">
            Die Summe darf 1 nicht überschreiten.
          </p>
        </div>
      </div>
      <!-- ==================================================
       DATA TASKS
  ================================================== -->
      <div class="form-card" id="data-tasks">
        <h2>Data Collection, Exploration, Preparation Tasks – Gewichtung</h2>
        <p>Summe: {{ totalDataTasks.toFixed(2) }} / 1</p>

        <div class="section-grid">
          <div class="field">
            <label>Datenquellen identifizieren</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.identify_sources)"
              v-model.number="dataTasks.identify_sources"
            />
          </div>

          <div class="field">
            <label>Daten beschaffen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.acquire_data)"
              v-model.number="dataTasks.acquire_data"
            />
          </div>

          <div class="field">
            <label>Daten beschreiben</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.describe_data)"
              v-model.number="dataTasks.describe_data"
            />
          </div>

          <div class="field">
            <label>Daten explorieren</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.explore_data)"
              v-model.number="dataTasks.explore_data"
            />
          </div>

          <div class="field">
            <label>Datenqualität prüfen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.asses_data_quality)"
              v-model.number="dataTasks.asses_data_quality"
            />
          </div>

          <div class="field">
            <label>Daten vorbereiten</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.prepare_data)"
              v-model.number="dataTasks.prepare_data"
            />
          </div>

          <div class="field">
            <label>Datenpipeline entwickeln</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDataTasks(dataTasks.develop_pipeline)"
              v-model.number="dataTasks.develop_pipeline"
            />
          </div>
        </div>
      </div>

      <!-- ==================================================
       ANALYSIS / EVALUATION / DEPLOYMENT
  ================================================== -->
      <div class="form-card" id="analysis-tasks">
        <h2>Analysis Tasks – Gewichtung</h2>
        <p>Summe: {{ totalAnalysisTasks.toFixed(2) }} / 1</p>

        <div class="section-grid">
          <div class="field">
            <label>Hypothese definieren</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingAnalysisTasks(analysisTasks.define_hypothesis)"
              v-model.number="analysisTasks.define_hypothesis"
            />
          </div>

          <div class="field">
            <label>Modell auswählen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingAnalysisTasks(analysisTasks.select_model)"
              v-model.number="analysisTasks.select_model"
            />
          </div>

          <div class="field">
            <label>Testdesign erstellen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingAnalysisTasks(analysisTasks.design_test)"
              v-model.number="analysisTasks.design_test"
            />
          </div>

          <div class="field">
            <label>Modell entwickeln</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingAnalysisTasks(analysisTasks.develop_model)"
              v-model.number="analysisTasks.develop_model"
            />
          </div>

          <div class="field">
            <label>Modell bewerten</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingAnalysisTasks(analysisTasks.assess_model)"
              v-model.number="analysisTasks.assess_model"
            />
          </div>

          <div class="field">
            <label>Analyse-Pipeline entwickeln</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingAnalysisTasks(analysisTasks.develop_pipeline)"
              v-model.number="analysisTasks.develop_pipeline"
            />
          </div>
        </div>

        <p v-if="totalAnalysisTasks > 1" class="field-error">
          Die Summe darf 1 nicht überschreiten.
        </p>
      </div>

      <div class="form-card" id="evaluation-tasks">
        <h2>Evaluation Tasks – Gewichtung</h2>
        <p>Summe: {{ totalEvaluationTasks.toFixed(2) }} / 1</p>

        <div class="section-grid">
          <div class="field">
            <label>Ergebnisse bewerten</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingEvaluationTasks(evaluationTasks.assess_results)"
              v-model.number="evaluationTasks.assess_results"
            />
          </div>

          <div class="field">
            <label>Prozess evaluieren</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingEvaluationTasks(evaluationTasks.evaluate_process)"
              v-model.number="evaluationTasks.evaluate_process"
            />
          </div>
        </div>

        <p v-if="totalEvaluationTasks > 1" class="field-error">
          Die Summe darf 1 nicht überschreiten.
        </p>
      </div>

      <div class="form-card" id="deployment-tasks">
        <h2>Deployment Tasks – Gewichtung</h2>
        <p>Summe: {{ totalDeploymentTasks.toFixed(2) }} / 1</p>

        <div class="section-grid">
          <div class="field">
            <label>Deployment-Bewertung durchführen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDeploymentTasks(deploymentTasks.perform_assessment)"
              v-model.number="deploymentTasks.perform_assessment"
            />
          </div>

          <div class="field">
            <label>Deployment planen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDeploymentTasks(deploymentTasks.plan_deployment)"
              v-model.number="deploymentTasks.plan_deployment"
            />
          </div>

          <div class="field">
            <label>Monitoring & Wartung planen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDeploymentTasks(deploymentTasks.plan_monitoring_maintenance)"
              v-model.number="deploymentTasks.plan_monitoring_maintenance"
            />
          </div>

          <div class="field">
            <label>Deployment testen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDeploymentTasks(deploymentTasks.test_deployment)"
              v-model.number="deploymentTasks.test_deployment"
            />
          </div>

          <div class="field">
            <label>Integration durchführen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDeploymentTasks(deploymentTasks.perform_integration)"
              v-model.number="deploymentTasks.perform_integration"
            />
          </div>

          <div class="field">
            <label>Projekt abschließen</label>
            <input
              type="number"
              min="0"
              step="0.01"
              :max="remainingDeploymentTasks(deploymentTasks.finalize_project)"
              v-model.number="deploymentTasks.finalize_project"
            />
          </div>
        </div>

        <p v-if="totalDeploymentTasks > 1" class="field-error">
          Die Summe darf 1 nicht überschreiten.
        </p>
      </div>
      <div class="wizard-header">
        <h1>Sonstiges</h1>
      </div>
      <div class="form-card" id="productivity">
        <h2>Produktivität</h2>
        <div class="section-grid">
          <div class="field">
            <label>Produktivitätsfaktor</label>
            <input
              type="number"
              min="0"
              max="3"
              step="0.1"
              v-model.number="productivity.productivity"
            />
          </div>
        </div>
      </div>
      <div class="form-card" id="cost">
        <h2>Personalkosten</h2>
        <div class="section-grid">
          <div class="field">
            <label>Stundenlohn</label>
            <input type="number" min="0" max="120" step="0.5" v-model.number="cost.hourly_rate" />
          </div>
        </div>
      </div>

      <div class="form-card" id="categories">
        <h2>Projekt-Kategorien</h2>

        <!-- Neue Kategorie erstellen (im gleichen Grid-Layout wie der Rest) -->
        <div class="section-grid" style="margin-bottom: 2.5rem;">
          <!-- Feld 1: Farbe -->
          <div class="field" style="max-width: 40px;">
            <label>Farbe</label>
            <input
              type="color"
              v-model="newCategory.color"
              style="width: 100%; height: 38px; padding: 2px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px;"
            />
          </div>

          <!-- Feld 2: Name & Button zusammen -->
          <div class="field" style="grid-column: span 2;">
            <label>Kategorie</label>
            <div style="display: flex; gap: 0.5rem;">
              <input
                type="text"
                v-model="newCategory.name"
                class="form-input"
                @keyup.enter="addCategory"
              />
              <button
                class="btn-primary"
                @click="addCategory"
                :disabled="!newCategory.name.trim()"
                style="white-space: nowrap;"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>

        <!-- Vorhandene Kategorien -->
        <div class="field">
          <label>Vorhandene Kategorien ({{ categories.length }})</label>

          <div v-if="categories.length === 0" style="color: #888; font-style: italic; margin-top: 0.5rem;">

          </div>

          <div v-else class="category-list" style="margin-top: 0.5rem;">
            <div v-for="cat in categories" :key="cat.id" class="category-list-item">
              <div class="category-info">
                <div class="category-color-dot" :style="{ backgroundColor: cat.color }"></div>
                <span class="category-name">{{ cat.name }}</span>
              </div>
              <button class="btn-delete-icon" @click="removeCategory(cat.id)" title="Kategorie löschen">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>



    </main>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  gap: 2rem;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-left: 260px;
  margin-right: 40px;
  scroll-behavior: smooth; /* Nur einmal hier */
}

.wizard-header {
  margin-bottom: 2rem;
  scroll-margin-top: 100px; /* Scroll-Offset */
}

.form-card {
  margin-bottom: 1.5rem;
  scroll-margin-top: 100px; /* Scroll-Offset */
}

@media (min-width: 1200px) {
  .section-grid {
    grid-template-columns: repeat(4, 1fr);
    align-items: start;
  }
}

.sidebar {
  position: fixed;
  top: 1rem;
  width: 220px;
  background: whitesmoke;
  border-right: 1px solid var(--color-border);
  padding: 1rem;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  height: 100vh;
  justify-content: flex-start;
  display: flex;
  flex-direction: column;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin-bottom: 0.75rem;
}

.sidebar a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  background-color: transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  display: block; /* Wichtig! */
  text-align: left;
  line-height: 1.4;
  padding: 0.25rem 0; /* Etwas Padding für bessere Klickfläche */
}

.sidebar a:hover {
  color: var(--color-primary);
}

.sidebar h2 {
  margin-bottom: 1rem;
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  margin-top: 3rem;
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  background: linear-gradient(135deg, #0070c9 0%, #00a8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-footer {
  margin-top: auto;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sidebar-footer .btn-primary {
  width: 100%;
}

/* Global smooth scrolling */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 100px; /* Offset für fixierte Header/Sidebar */
}

/* Styling für die neue Kategorie-Liste */
.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.category-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.category-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  border-color: #bbb;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); /* leichter Rand für sehr helle Farben */
}

.category-name {
  font-weight: 500;
  color: #333;
}

.btn-delete-icon {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

.btn-delete-icon:hover {
  color: #e53935;
  background-color: #ffebee;
}

.btn-success:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

</style>
