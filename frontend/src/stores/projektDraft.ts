import { defineStore } from "pinia";

export const useProjectDraftStore = defineStore("projectDraft", {
  state: () => ({
    projekt: {
      // 1) Business Understanding
      Titel: "",
      Domain: "",
      Geschaeftsziel: "",
      FormFinaleProdukt: "",
      Teamgroesse: 0,
      Zeitraum: "",
      Kosten: 0,

      // 2) Data Collection, Exploration & Preparation
      Datenzugriff: "",
      Datenverfuegbarkeit: false,
      Datenquellen: "",
      Datensicherheit: "",
      Datenqualitaet: "",
      Datengeschwindigkeit: "",
      Datenvariabilitaet: "",
      Datenumfang: 0,
      Datenvorbereitungsschritte: "",
      Datentools: "",

      // 3) Analysis
      DataScienceZiele: "",
      Analysetyp: "",
      Analysezeitrahmen: "",
      Analysetools: "",
      Bewertungskriterien: [] as string[],

      // 4) Deployment
      TimelinessOfAnalytics: "",
      Tests: "",
      Zielgruppe: "",
      Projektprobleme: [] as string[],
      DeploymentTools: "",

      // 5) Utilization
      Wartung: "",
      Verwendungstools: "",
      Ueberwachung: "",
    },
  }),

  actions: {
    reset() {
      this.$reset();
    },
  },
});
