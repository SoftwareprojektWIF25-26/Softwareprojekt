<script setup lang="ts">
import { defaultWeights, BusinessUnderstandingTask, AnalysisTask, DeploymentTask, EvaluationTask, DataTasks } from '@/types'
import { reactive, onMounted, computed } from 'vue'
import api from '@/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

function save(){
  const payload = {
    defaultWeights: { ...weights },
    businessTasks: { ...businessWeights },
    dataTasks: { ...dataTasks },
    analysisTasks: { ...analysisTasks },
    evaluationTasks: { ...evaluationTasks },
    deploymentTasks: { ...deploymentTasks },
  }

  api.patchWeights(payload)
    .then(() => {
      console.log('✅ Gewichtungen gespeichert')
    })
    .catch(err => {
      console.error('❌ Fehler beim Speichern der Gewichtungen:', err)
      toast.error(err.message|| 'Fehler beim Speichern der Gewichtungen')
    })}

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
const totalbusinessweights = computed(() =>
  businessWeights.assess_situation
  +businessWeights.compose_team
  +businessWeights.create_project_plan
  +businessWeights.derive_targets
  +businessWeights.set_criteria_objectives)

const remaining_business_weights = (current: number) => {
  return Number((1-(totalbusinessweights.value-current)).toFixed(2))
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

const totalDataTasks = computed(() =>
  dataTasks.identify_sources +
  dataTasks.acquire_data +
  dataTasks.describe_data +
  dataTasks.explore_data +
  dataTasks.asses_data_quality +
  dataTasks.prepare_data +
  dataTasks.develop_pipeline
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

const totalAnalysisTasks = computed(() =>
  analysisTasks.define_hypothesis +
  analysisTasks.select_model +
  analysisTasks.design_test +
  analysisTasks.develop_model +
  analysisTasks.assess_model +
  analysisTasks.develop_pipeline
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

const totalEvaluationTasks = computed(() =>
  evaluationTasks.assess_results +
  evaluationTasks.evaluate_process
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

const totalDeploymentTasks = computed(() =>
  deploymentTasks.perform_assessment +
  deploymentTasks.plan_deployment +
  deploymentTasks.plan_monitoring_maintenance +
  deploymentTasks.test_deployment +
  deploymentTasks.perform_integration +
  deploymentTasks.finalize_project
)

const remainingDeploymentTasks = (current: number) =>
  Number((1 - (totalDeploymentTasks.value - current)).toFixed(2))

const isSaveDisabled = computed(() =>
  totalbusinessweights.value > 1 ||
  totalAnalysisTasks.value > 1 ||
  totalEvaluationTasks.value > 1 ||
  totalDeploymentTasks.value > 1
);
onMounted(async () => {
  try {
    const data = await api.getWeights()

    // Default weights
    Object.assign(weights, data.defaultWeights)

    // Business Tasks
    Object.assign(businessWeights, data.businessTasks)

    // Data Tasks
    Object.assign(dataTasks, data.dataTasks)

    // Analysis Tasks
    Object.assign(analysisTasks, data.analysisTasks)

    // Evaluation Tasks
    Object.assign(evaluationTasks, data.evaluationTasks)

    // Deployment Tasks
    Object.assign(deploymentTasks, data.deploymentTasks)

    console.log('✅ Weights erfolgreich geladen')
  } catch (err) {
    console.error('❌ Fehler beim Laden der Gewichtungen:', err)
    toast.error(err.message|| 'Fehler beim Laden der Gewichtungen')
  }
})
</script>

<template>
    <div class="page-container">
      <aside class="sidebar">
        <h2>Navigation</h2>
        <ul>
          <li><a href="#default-weights">Default </a></li>
          <li><a href="#business-understanding">Business Understanding</a></li>
          <li><a href="#data-tasks">Data Collection, Exploration, Preparation</a></li>
          <li><a href="#analysis-tasks">Analysis </a></li>
          <li><a href="#evaluation-tasks">Evaluation </a></li>
          <li><a href="#deployment-tasks">Deployment </a></li>
        </ul>
        <div class="sidebar-footer">
        <button class="btn-primary" :disabled="isSaveDisabled" @click="save">
          Speichern
        </button>
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
  <h1> Task Gewichtung</h1>
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
      <div class="field"><label>Datenquellen identifizieren</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.identify_sources)"
               v-model.number="dataTasks.identify_sources" />
      </div>

      <div class="field"><label>Daten beschaffen</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.acquire_data)"
               v-model.number="dataTasks.acquire_data" />
      </div>

      <div class="field"><label>Daten beschreiben</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.describe_data)"
               v-model.number="dataTasks.describe_data" />
      </div>

      <div class="field"><label>Daten explorieren</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.explore_data)"
               v-model.number="dataTasks.explore_data" />
      </div>

      <div class="field"><label>Datenqualität prüfen</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.asses_data_quality)"
               v-model.number="dataTasks.asses_data_quality" />
      </div>

      <div class="field"><label>Daten vorbereiten</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.prepare_data)"
               v-model.number="dataTasks.prepare_data" />
      </div>

      <div class="field"><label>Datenpipeline entwickeln</label>
        <input type="number" min="0" step="0.01"
               :max="remainingDataTasks(dataTasks.develop_pipeline)"
               v-model.number="dataTasks.develop_pipeline" />
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
}
.wizard-header {
  margin-bottom: 2rem;
}
.form-card {
  margin-bottom: 1.5rem;
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
  border-right: 1px solid var(--color-border);  padding: 1rem;
  box-shadow: 2px 0 10px rgba(0,0,0,0.05);
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
  background-color: transparent;
}

.sidebar a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}
.sidebar li a{
  background-color: transparent;
}
.sidebar li a:hover {
  color: var(--color-primary);
  cursor: pointer;
  background-color: transparent;
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

html {
  scroll-behavior: smooth;
}
.sidebar-footer {
  margin-top: auto;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0; /* Footer bleibt unten fixiert */
}
.sidebar-footer .btn-primary{
  width: 100%;
}
</style>
