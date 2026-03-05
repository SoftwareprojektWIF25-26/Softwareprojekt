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

const STORAGE_KEY = "projectDraft";
const AUTOSAVE_DELAY_MS = 1000;

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
      return countValidFields([
        state.businessUnderstanding.businessGoal,
        state.businessUnderstanding.formOfFinalProduct,
        state.businessUnderstanding.teamSize,
        state.businessUnderstanding.timelineValue,
        state.businessUnderstanding.estimatedCost
      ]);
    },

    dataProgress(state): number {
      return countValidFields([
        state.dataCharacteristics.dataAvailability,
        state.dataCharacteristics.dataSources?.length,
        state.dataCharacteristics.velocity,
        state.dataCharacteristics.veracity,
        state.dataCharacteristics.volumeValue,
        state.dataCharacteristics.variability
      ]);
    },

    analysisProgress(state): number {
      return countValidFields([
        state.analysisConfig.dataScienceGoals,
        state.analysisConfig.typeOfAnalytics,
        state.analysisConfig.evaluationMetrics?.length,
        state.analysisConfig.toolsAnalysis
      ]);
    },

    deploymentProgress(state): number {
      return countValidFields([
        state.deploymentConfig.timelinessOfAnalytics,
        state.deploymentConfig.addressedUsers,
        state.deploymentConfig.tests,
        state.deploymentConfig.projectIssues?.length,
        state.deploymentConfig.toolsDeployment
      ]);
    },

    utilizationProgress(state): number {
      return countValidFields([
        state.utilizationConfig.monitoring,
        state.utilizationConfig.maintenance,
        state.utilizationConfig.toolsUtilization
      ]);
    },

    /**
     * Formatiert den Zeitstempel der letzten Speicherung für die UI.
     */
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
    setId(id: number) {
      this.id = id;
    },

    reset() {
      this.$reset();
    },

    /**
     * Sichert den aktuellen Zustand des Stores im LocalStorage.
     * Dient als Backup, falls der Nutzer die Seite neu lädt oder schließt.
     */
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      this.lastSaved = draft.savedAt;

      console.log("💾 Auto-Save durchgeführt:", this.lastSavedFormatted);
    },

    /**
     * Lädt einen zuvor gespeicherten Entwurf aus dem LocalStorage.
     * @returns Den Zeitpunkt der Speicherung oder null, falls kein Entwurf existiert.
     */
    loadDraft(): string | null {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return null;

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

        console.log("📂 Draft erfolgreich geladen:", this.lastSavedFormatted);
        return draft.savedAt;
      } catch (error) {
        console.error("Fehler beim Parsen des Drafts aus dem LocalStorage:", error);
        return null;
      }
    },

    /**
     * Löscht den lokal gespeicherten Entwurf und setzt den Store zurück.
     * Wird normalerweise aufgerufen, wenn der Wizard erfolgreich abgeschlossen wurde.
     */
    clearDraft() {
      localStorage.removeItem(STORAGE_KEY);
      this.reset();
      console.log("🗑️ Draft aus LocalStorage gelöscht");
    },

    toggleAutoSave() {
      this.autoSaveEnabled = !this.autoSaveEnabled;
      console.log(`Auto-Save wurde ${this.autoSaveEnabled ? 'aktiviert' : 'deaktiviert'}`);
    }
  }
});

// ============================================================================
// HILFSMETHODEN
// ============================================================================

/**
 * Prüft ein Array von Feldern und zählt, wie viele davon einen gültigen Wert haben.
 * Nützlich zur Berechnung von Fortschrittsbalken.
 */
function countValidFields(fields: any[]): number {
  return fields.filter(f => f !== undefined && f !== null && f !== "" && f !== 0).length;
}

// ============================================================================
// AUTO-SAVE SETUP
// ============================================================================

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialisiert einen Watcher, der auf Änderungen im Store reagiert
 * und diese nach einer kurzen Verzögerung (Debounce) automatisch speichert.
 * Muss einmalig im Root-Level (z. B. in App.vue oder Router) aufgerufen werden.
 */
export function setupAutoSave() {
  const store = useProjectDraftStore();

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
      if (!store.autoSaveEnabled) return;

      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      autoSaveTimeout = setTimeout(() => {
        store.saveDraft();
      }, AUTOSAVE_DELAY_MS);
    },
    { deep: true }
  );

  console.log(`✅ Auto-Save aktiviert (${AUTOSAVE_DELAY_MS}ms Debounce)`);
}
