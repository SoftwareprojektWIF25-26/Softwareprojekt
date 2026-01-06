// stores/projektDraft.ts
import { defineStore } from "pinia";
import { watch } from "vue";
import type {
  BusinessUnderstandingData,
  DataCharacteristicsData,
  AnalysisConfigData,
  DeploymentConfigData,
  UtilizationConfigData
} from "@/types";

interface ProjectDraftState {
  id: number | null;
  title: string;
  domain: string;


  lastSaved: string | null;
  autoSaveEnabled: boolean;

  businessUnderstanding: BusinessUnderstandingData;
  dataCharacteristics: DataCharacteristicsData;
  analysisConfig: AnalysisConfigData;
  deploymentConfig: DeploymentConfigData;
  utilizationConfig: UtilizationConfigData;
}

export const useProjectDraftStore = defineStore("projectDraft", {
  state: (): ProjectDraftState => ({
    id: null,
    title: "",
    domain: "",

    // NEU
    lastSaved: null,
    autoSaveEnabled: true,

    businessUnderstanding: {
      businessGoal: "",
      formOfFinalProduct: undefined,
      projectTeamRoles: [],
      teamSize: undefined,
      timelineValue: undefined,
      timelineUnit: "WEEKS",
      estimatedCost: undefined,
      toolsBusinessUnderstanding: ""
    },

    dataCharacteristics: {
      dataAccess: [],
      dataAvailability: undefined,
      dataSources: [],
      dataSecurityConstraints: "",
      velocity: undefined,
      veracity: undefined,
      variety: undefined,
      volumeValue: undefined,
      volumeUnit: "RECORDS",
      variability: undefined,
      dataPreparationSteps: [],
      toolsData: ""
    },

    analysisConfig: {
      dataScienceGoals: "",
      typeOfAnalytics: undefined,
      evaluationMetrics: [],
      toolsAnalysis: ""
    },

    deploymentConfig: {
      timelinessOfAnalytics: undefined,
      addressedUsers: "",
      tests: "",
      projectIssues: [],
      toolsDeployment: ""
    },

    utilizationConfig: {
      monitoring: "",
      maintenance: "",
      toolsUtilization: ""
    }
  }),

  getters: {
    canProceedToBusinessUnderstanding(state): boolean {
      return !!state.title.trim();
    },

    businessProgress(state): number {
      const fields = [
        state.businessUnderstanding.businessGoal,
        state.businessUnderstanding.formOfFinalProduct,
        state.businessUnderstanding.teamSize,
        state.businessUnderstanding.timelineValue,
        state.businessUnderstanding.estimatedCost
      ];
      return fields.filter(f => f !== undefined && f !== "").length;
    },

    dataProgress(state): number {
      const fields = [
        state.dataCharacteristics.dataAvailability,
        state.dataCharacteristics.dataSources?.length,
        state.dataCharacteristics.velocity,
        state.dataCharacteristics.veracity,
        state.dataCharacteristics.volumeValue,
        state.dataCharacteristics.variability
      ];
      return fields.filter(f => f !== undefined && f !== "" && f !== 0).length;
    },

    analysisProgress(state): number {
      const fields = [
        state.analysisConfig.dataScienceGoals,
        state.analysisConfig.typeOfAnalytics,
        state.analysisConfig.evaluationMetrics?.length,
        state.analysisConfig.toolsAnalysis
      ];
      return fields.filter(f => f !== undefined && f !== "" && f !== 0).length;
    },

    deploymentProgress(state): number {
      const fields = [
        state.deploymentConfig.timelinessOfAnalytics,
        state.deploymentConfig.addressedUsers,
        state.deploymentConfig.tests,
        state.deploymentConfig.projectIssues?.length,
        state.deploymentConfig.toolsDeployment
      ];
      return fields.filter(f => f !== undefined && f !== "" && f !== 0).length;
    },

    utilizationProgress(state): number {
      const fields = [
        state.utilizationConfig.monitoring,
        state.utilizationConfig.maintenance,
        state.utilizationConfig.toolsUtilization
      ];
      return fields.filter(f => f !== undefined && f !== "").length;
    },

    // NEU: Formatierte letzte Speicherzeit
    lastSavedFormatted(state): string {
      if (!state.lastSaved) return "";
      const date = new Date(state.lastSaved);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  actions: {
    setid(id: number) {
      this.id = id;
    },

    reset() {
      this.$reset();
    },

    // Entwurf in localStorage speichern
    saveDraft() {
      const draft = {
        id: this.id,
        title: this.title,
        domain: this.domain,
        businessUnderstanding: this.businessUnderstanding,
        dataCharacteristics: this.dataCharacteristics,
        analysisConfig: this.analysisConfig,
        deploymentConfig: this.deploymentConfig,
        utilizationConfig: this.utilizationConfig,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem("projectDraft", JSON.stringify(draft));
      this.lastSaved = draft.savedAt;

      console.log("💾 Auto-Save:", this.lastSavedFormatted);
    },

    // Entwurf aus localStorage laden
    loadDraft() {
      const saved = localStorage.getItem("projectDraft");
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          this.id = draft.id;
          this.title = draft.title || "";
          this.domain = draft.domain || "";
          this.businessUnderstanding = draft.businessUnderstanding || this.businessUnderstanding;
          this.dataCharacteristics = draft.dataCharacteristics || this.dataCharacteristics;
          this.analysisConfig = draft.analysisConfig || this.analysisConfig;
          this.deploymentConfig = draft.deploymentConfig || this.deploymentConfig;
          this.utilizationConfig = draft.utilizationConfig || this.utilizationConfig;
          this.lastSaved = draft.savedAt;

          console.log("📂 Draft geladen:", this.lastSavedFormatted);
          return draft.savedAt;
        } catch (error) {
          console.error("Fehler beim Laden des Drafts:", error);
          return null;
        }
      }
      return null;
    },

    // Entwurf löschen
    clearDraft() {
      localStorage.removeItem("projectDraft");
      this.reset();
      console.log("🗑️ Draft gelöscht");
    },

    // NEU: Auto-Save aktivieren/deaktivieren
    toggleAutoSave() {
      this.autoSaveEnabled = !this.autoSaveEnabled;
      console.log(`Auto-Save ${this.autoSaveEnabled ? 'aktiviert' : 'deaktiviert'}`);
    }
  }
});

// ===== AUTO-SAVE SETUP =====
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function setupAutoSave() {
  const store = useProjectDraftStore();

  // Watch auf den gesamten State (deep watching)
  watch(
    () => ({
      title: store.title,
      domain: store.domain,
      business: store.businessUnderstanding,
      data: store.dataCharacteristics,
      analysis: store.analysisConfig,
      deployment: store.deploymentConfig,
      utilization: store.utilizationConfig
    }),
    () => {
      // Nur speichern wenn Auto-Save aktiviert
      if (!store.autoSaveEnabled) return;

      // Debounce: Nur speichern nach 1 Sekunde Inaktivität
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      autoSaveTimeout = setTimeout(() => {
        store.saveDraft();
      }, 1000); // 1 Sekunde Wartezeit
    },
    { deep: true } // Deep watching für nested objects
  );

  console.log("✅ Auto-Save aktiviert (1s Debounce)");
}
