// api/index.ts
import axios, { AxiosError } from 'axios';
import type {
  ApiResponse,
  Project,
  CreateProjectRequest,
  UpdateBusinessUnderstandingRequest,
  UpdateDataCharacteristicsRequest,
  UpdateAnalysisConfigRequest,
  UpdateDeploymentConfigRequest,
  UpdateUtilizationConfigRequest,
  FullProject,
  BusinessUnderstandingResponse,
  DataCharacteristicsResponse,
  AnalysisConfigResponse,
  DeploymentConfigResponse,
  UtilizationConfigResponse,
  CompleteWizardResponse,
  DashboardData,
  BackendProjectPlan,
  defaultWeights,
  BusinessUnderstandingTask,
  DataTasks,
  AnalysisTask,
  EvaluationTask,
  DeploymentTask,
  ProjectListItem,
} from '@/types';

// ============================================================================
// API KONFIGURATION & INTERCEPTOREN
// ============================================================================

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fängt globale Fehler ab, bevor sie die eigentliche Funktion erreichen,
// um zentrales Logging sicherzustellen.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

// ============================================================================
// STARTSEITE (HOMEVIEW)
// ============================================================================

/**
 * Ruft die aggregierte Liste aller Projekte ab.
 * Das Backend liefert hierbei oft noch Zusatzdaten (Statistiken),
 * wir extrahieren für diese Funktion jedoch nur das reine Projekt-Array.
 */
async function getProjektListe(): Promise<ProjectListItem[]> {
  try {
    const response = await apiClient.get('/homeview');
    return response.data.projects || [];
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden der Projekte');
  }
}

/**
 * Lädt aggregierte Statistiken (z. B. Anzahl der Projekte nach Status) für die Übersicht.
 */
async function getStatistiken(): Promise<any> {
  try {
    const response = await apiClient.get('/homeview/statistics');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden der Statistiken');
  }
}

/**
 * Liefert eine Liste der Projekte zurück, an denen der Nutzer zuletzt gearbeitet hat.
 */
async function getZuletztBearbeitet(): Promise<Project[]> {
  try {
    const response = await apiClient.get('/homeview/recent-projects');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden der zuletzt bearbeiteten Projekte');
  }
}

// ============================================================================
// DASHBOARD & PROJEKT-VERWALTUNG
// ============================================================================

/**
 * Lädt das vollständige Datenmodell eines spezifischen Projekts inkl. aller Relationen.
 */
async function getProjektById(id: number): Promise<FullProject> {
  try {
    const response = await apiClient.get(`/dashboard/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden des Projekts');
  }
}

/**
 * Lädt den aggregierten Datensatz für das Projekt-Dashboard.
 */
async function getDashboardData(id: number): Promise<DashboardData> {
  try {
    const response = await apiClient.get<ApiResponse<DashboardData>>(`/dashboard/${id}`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden des Dashboards');
  }
}

/**
 * Lädt die chronologische Abfolge und Abhängigkeiten der Projektphasen (für Gantt-Charts).
 */
async function getTimeline(id: number): Promise<BackendProjectPlan> {
  try {
    const response = await apiClient.get(`/dashboard/${id}/timeline`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden der Timeline');
  }
}

async function updateProjectDetails(id: number, data: { title?: string; domain?: string }): Promise<any> {
  try {
    const response = await apiClient.patch(`/dashboard/${id}/details`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Ändern der Projektdetails');
  }
}

async function postEvaluation(id: number): Promise<any> {
  try {
    const response = await apiClient.post(`/dashboard/${id}/evaluations`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Posten der Evaluation');
  }
}

/**
 * Ändert den übergeordneten Status eines Projekts (z. B. DRAFT, IN_PROGRESS, DONE).
 */
async function patchProjektStatus(id: number, status: string): Promise<any> {
  try {
    const response = await apiClient.patch(`/dashboard/${id}/status`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Ändern des Projektstatus');
  }
}

/**
 * Aktualisiert den Bearbeitungsstatus einer einzelnen Aufgabe innerhalb des Projektplans.
 */
async function patchTaskStatus(id: number, status: string): Promise<any> {
  try {
    const response = await apiClient.patch(`/dashboard/tasks/${id}/status`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Ändern des Taskstatus');
  }
}

/**
 * Aktualisiert den Fortschrittsstatus einer Template-Konfigurationsphase.
 */
async function patchTemplatePhase(id: number, phase: string): Promise<any> {
  try {
    const response = await apiClient.patch(`/dashboard/${id}/template-phase/${phase}/status`, { phase: id });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Fehler beim Anpassen der Template-Phase');
  }
}

/**
 * Erlaubt die nachträgliche Anpassung einzelner Konfigurationsbereiche über das Dashboard.
 */
async function updateProjectConfig(
  id: number,
  configType:
    | 'businessUnderstanding'
    | 'dataCharacteristics'
    | 'analysisConfig'
    | 'deploymentConfig'
    | 'utilizationConfig',
  data: any,
): Promise<any> {
  try {
    const response = await apiClient.patch(`/dashboard/${id}/config/${configType}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, `Fehler beim Update der Konfiguration: ${configType}`);
  }
}

async function deleteProjekt(id: number): Promise<void> {
  try {
    await apiClient.delete(`/projects/${id}`);
  } catch (error) {
    handleApiError(error, 'Fehler beim Löschen des Projekts');
  }
}

/**
 * Stößt die serverseitige Neuberechnung des Projektplans an.
 * Dies ist nötig, wenn grundlegende Rahmenbedingungen nachträglich geändert wurden.
 */
async function recalculateProjectPlan(id: number): Promise<void> {
  try {
    await apiClient.post(`/dashboard/${id}/recalculate`);
  } catch (error) {
    handleApiError(error, 'Fehler bei der Neuberechnung des Projektplans');
  }
}

// ============================================================================
// WIZARD (PROJEKTANLAGE & KONFIGURATION)
// ============================================================================

async function createProjekt(projektData: CreateProjectRequest): Promise<Project> {
  try {
    const response = await apiClient.post<ApiResponse<Project>>('/projects/create', projektData);
    const project = unwrapResponse(response);

    if (!project.id) {
      throw new Error('Ungültige Response: Keine Projekt-ID vorhanden');
    }
    return project;
  } catch (error) {
    handleApiError(error, 'Fehler beim Erstellen des Projekts');
  }
}

async function updateProjekt(id: number, data: { title?: string; domain?: string }): Promise<Project> {
  try {
    const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Aktualisieren des Projekts');
  }
}

async function patchBusinessUnderstanding(id: number, data: UpdateBusinessUnderstandingRequest): Promise<BusinessUnderstandingResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<BusinessUnderstandingResponse>>(`/projects/${id}/business-understanding`, data);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Speichern von Business Understanding');
  }
}

async function patchDataCharacteristics(id: number, data: UpdateDataCharacteristicsRequest): Promise<DataCharacteristicsResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<DataCharacteristicsResponse>>(`/projects/${id}/data-characteristics`, data);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Speichern von Data Characteristics');
  }
}

async function patchAnalysisConfig(id: number, data: UpdateAnalysisConfigRequest): Promise<AnalysisConfigResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<AnalysisConfigResponse>>(`/projects/${id}/analysis-config`, data);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Speichern der Analysis Config');
  }
}

async function patchDeploymentConfig(id: number, data: UpdateDeploymentConfigRequest): Promise<DeploymentConfigResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<DeploymentConfigResponse>>(`/projects/${id}/deployment-config`, data);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Speichern der Deployment Config');
  }
}

async function patchUtilizationConfig(id: number, data: UpdateUtilizationConfigRequest): Promise<UtilizationConfigResponse> {
  try {
    const response = await apiClient.patch<ApiResponse<UtilizationConfigResponse>>(`/projects/${id}/utilization-config`, data);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Speichern der Utilization Config');
  }
}

/**
 * Signalisiert dem Backend, dass der Setup-Prozess beendet ist.
 * Dies triggert die erste initiale Aufwandsberechnung.
 */
async function completeWizard(id: number): Promise<CompleteWizardResponse> {
  try {
    const response = await apiClient.post<ApiResponse<CompleteWizardResponse>>(`/projects/${id}/complete-wizard`);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Abschließen des Wizards');
  }
}

// ============================================================================
// EINSTELLUNGEN (SETTINGS & WEIGHTS)
// ============================================================================

interface WeightsPayload {
  defaultWeights: defaultWeights;
  businessTasks: BusinessUnderstandingTask;
  dataTasks: DataTasks;
  analysisTasks: AnalysisTask;
  evaluationTasks: EvaluationTask;
  deploymentTasks: DeploymentTask;
  productivity?: { productivity: number };
  cost?: { hourly_rate: number };
}

/**
 * Lädt die systemweiten Standard-Gewichtungen für den Berechnungsalgorithmus.
 */
async function getWeights(): Promise<WeightsPayload> {
  try {
    const response = await apiClient.get<{ success: boolean; data: WeightsPayload }>('/settings');
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Laden der Gewichtungen');
  }
}

/**
 * Speichert modifizierte Gewichtungen.
 * Entfernt vor dem Versand datenbankspezifische IDs, da diese nicht geupdatet werden dürfen.
 */
async function patchWeights(data: WeightsPayload): Promise<WeightsPayload> {
  try {
    const cleanData = {
      defaultWeights: removeIds(data.defaultWeights),
      businessTasks: removeIds(data.businessTasks),
      dataTasks: removeIds(data.dataTasks),
      analysisTasks: removeIds(data.analysisTasks),
      evaluationTasks: removeIds(data.evaluationTasks),
      deploymentTasks: removeIds(data.deploymentTasks),
      productivity: removeIds(data.productivity),
      cost: removeIds(data.cost),
    };

    const response = await apiClient.patch<{ success: boolean; data: WeightsPayload }>(`/settings`, cleanData);
    return unwrapResponse(response);
  } catch (error) {
    handleApiError(error, 'Fehler beim Speichern der Gewichtungen');
  }
}

// ============================================================================
// HILFSMETHODEN (HELPERS)
// ============================================================================

/**
 * Standardisierte Fehlerbehandlung für API-Aufrufe.
 * Versucht die genaue Ursache aus dem Backend-Payload zu extrahieren.
 */
function handleApiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    const backendError = error.response?.data?.error || error.response?.data?.message;
    const validationErrors = error.response?.data?.errors;

    // Behandelt Array-basierte Validierungsfehler vom Backend
    if (validationErrors && Array.isArray(validationErrors)) {
      throw new Error(validationErrors.map((e: any) => e.msg).join(', '));
    }

    throw new Error(backendError || fallbackMessage);
  }

  // Tritt ein, wenn der Fehler nicht von Axios (Netzwerk) kam
  throw error instanceof Error ? error : new Error(fallbackMessage);
}

/**
 * Entfernt Prisma-spezifische Felder (wie Datenbank-IDs) aus einem Payload-Objekt,
 * bevor es für ein Update an das Backend geschickt wird.
 */
function removeIds(obj: any) {
  if (!obj) return obj;
  const { id, settingsId, ...rest } = obj;
  return rest;
}

/**
 * Löst den API-Response-Wrapper auf.
 * Wirft einen Fehler, falls der Request zwar technisch erfolgreich war (HTTP 200),
 * das Backend aber fachlich einen Fehler meldet (success: false).
 */
function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message || 'Die API-Anfrage war fachlich nicht erfolgreich.');
  }
  return response.data.data;
}

export default {
  getProjektListe,
  getStatistiken,
  getZuletztBearbeitet,

  getProjektById,
  updateProjectDetails,
  getTimeline,
  updateProjectConfig,
  postEvaluation,
  patchProjektStatus,
  patchTaskStatus,
  patchTemplatePhase,
  getDashboardData,
  deleteProjekt,
  recalculateProjectPlan,

  createProjekt,
  updateProjekt,
  patchBusinessUnderstanding,
  patchDataCharacteristics,
  patchAnalysisConfig,
  patchDeploymentConfig,
  patchUtilizationConfig,
  completeWizard,

  getWeights,
  patchWeights,
};
