export interface Projekt{
  ID: string;
  Titel: string;
  Domain?: string;
  Beschreibung?: string;

  Geschaeftsziel?: string;
  Teamrollen: string[];
  Teamgroesse?: number;
  Kosten?: number;
  Zeitrahmen: string;
  FormFinaleProdukt?: string;
  WerkzeugeGeschaeftsverstaendnis?: string;

  Datenzugriff: string[];
  Datenverfuegbarkeit?: boolean;
  Datenquellen: string[];
  Datensicherhiet?: string;
  Datenqualitaet?: string;
  Datengeschwindigkeit?: string;
  Datenumfang?: number;
  Datenvielfalt?: string;
  Datenvariabilitaet?: string;
  Datenvorbereitungsschritte: string;
  Datentools?: string;

  Analysetools?: string;
  DataScienceZiele?: string;
  Analysetyp?: string;
  Bewertungsmetriken: string[];

  Analysezeitrahmen?: string;
  Tests?: string;
  Zielgruppe?: string;
  Projektprobleme: string[];
  DeploymentTools?: string;

  Wartung?: string;
  Verwendungstools?: string;
  Ueberwachung?: string;

}

export interface CategoryScore {
  readiness: number;
  complexity: number;
  uncertainty: number;
}

export interface ProjectPhase {
  name: string;
  startWeek: number;
  durationWeeks: number;
  effortPersonWeeks: number;
  percentage: number;
  baseEffort?: number;
  bufferEffort?: number;
  baseDuration?: number;
  bufferDuration?: number;
}

export interface ProjectMetrics {
  categoryScores: CategoryScore;
  overallScore?: number;
  effortPersonWeeks: number;
  durationWeeks: number;
  effortBreakdown: {
    baseEffort: number;
    bufferEffort: number;
    bufferPercentage: number;
    riskLevel: number;
  };
  projectSize: string;
  storyPoints: number;
  sprintCount: number;
  phases: ProjectPhase[];
}

export interface BackendProjectPlan {
  projectPlanId: number;
  estimatedDuration: number;
  estimatedEffort: number;
  phases: {
    id: number;
    name: string;
    phaseType: string;
    orderIndex: number;
    startDate: string;
    endDate: string;
    estimatedDuration: number;
    tasks: {
      id: number;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
      dependencies: {
        toTaskId: number;
        toTaskTitle: string;
        type: string;
      }[];
    }[];
  }[];
}
