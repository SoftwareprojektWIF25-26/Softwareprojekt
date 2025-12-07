export interface Projekt {
  ID: string;
  Titel: string;
  Domain?: string;
  Beschreibung?: string;
  Geschaeftsziel?: string;
  Teamrolle?: string[];
  Teamgrosse?: number;
  Kosten?: number;
  Zeitraum?: string;
  FormFinaleProdukt?: string;
  WerkzeugeGeschaeftsverstaendnis?: string;

  Datenzugriff?: string[];
  Datenverfuegbarkeit?: boolean;
  Datenquellen: string[];
  Datensicherheit?: string;
  Datenqualitaet?: string;
  Datengeschwindigkeit?: string;
  Datenumfang?: number;
  Datenvielfalt?: string;
  Datenvariabilitaet?: string;
  Datenvorbereitungsschritte?: string;
  Datentools?: string;

  Analysetools?: string;
  DataScienceZiele?: string;
  Analysetyp?: string;
  Bewertungsmetriken: string[];
  Analysezeitrahmen?: string;
  Tests?: string;
  Zielgruppe?: string;
  Projektprobleme?: string[];
  DeploymentTools?: string;

  Wartung?: string;
  Verwendungstools?: string;
  Ueberwachung?: string;
}
