// api/index.ts
import axios, { AxiosError } from 'axios';
import {
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
} from '@/types'


// Axios Instance mit Base-Config
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response Interceptor für besseres Error-Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);



// ===== STARTSEITE =====

/**
 * Holt alle Projekte für die Startseite
 */
async function getProjektListe(): Promise<ProjectListItem[]> {
  try {
    console.log('📤 GET Projekt Liste');

    // Backend liefert { projects, statistics, totalCount }
    const response = await apiClient.get('/homeview');

    console.log('📥 Projekt Liste Response:', response.data);

    // Extrahiere nur projects-Array
    const projects = response.data.projects || [];

    console.log('✅ Projekt Liste geladen:', projects.length, 'Projekte');

    return projects;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Projekt Liste Error:', error.response?.data);
      throw new Error('Fehler beim Laden der Projekte');
    }
    throw error;
  }
}

function getStatistiken() {
  return apiClient.get('/homeview/statistics').then(res => res.data);
}

function getZuletztBearbeitet(): Promise<Project[]> {
  return apiClient.get('/homeview/recent-projects').then(res => res.data);
}

// ===== DASHBOARD =====

function getProjektById(id: number): Promise<FullProject> {
  return apiClient.get(`/dashboard/${id}`).then(res => res.data);
}

async function getTimeline(id: number): Promise<BackendProjectPlan> {
  try {
    console.log('📤 GET Timeline Liste', id);

    // Backend liefert { projects, statistics, totalCount }
    const response = await apiClient.get(`/dashboard/${id}/timeline`)

    console.log('📥 Timeline Response:', response.data);

    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Timeline Error:', error.response?.data);
      throw new Error('Fehler beim Laden der Timeline');
    }
    throw error;
  }
}

function postEvaluation(id: number) {
  return apiClient.post(`/dashboard/${id}/evaluations`).then(res => res.data);
}

function patchProjektStatus(id: number, status: string) {
  return apiClient.patch(`/dashboard/${id}/status`, { status }).then(res => res.data);
}

function patchTaskStatus(id: number, status: string) {
  return apiClient.patch(`/dashboard/tasks/${id}/status`, { status }).then(res => res.data);
}

function patchTemplatePhase(id: number, phase: string) {
  return apiClient.patch(`/dashboard/${id}/template-phase/${phase}/status`, { phase: id }).then(res => res.data);
}

// ===== WIZARD FUNKTIONEN =====

/**
 * Erstellt ein neues Projekt
 * @param projektData - Projekt-Daten (title, domain)
 * @returns Promise mit dem erstellten Projekt (inkl. ID)
 */
async function createProjekt(projektData: CreateProjectRequest): Promise<Project> {
  try {
    console.log('📤 CREATE Projekt Request:', projektData);

    const response = await apiClient.post<ApiResponse<Project>>(
      '/projects/create',
      projektData
    );

    console.log('📥 CREATE Projekt Response:', response.data);

    // unwrapResponse validiert success und extrahiert data
    const project = unwrapResponse(response);

    if (!project.id) {
      throw new Error('Ungültige Response: Keine Projekt-ID vorhanden');
    }

    console.log('✅ Projekt erfolgreich erstellt mit ID:', project.id);

    return project;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Axios Error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });

      // Extrahiere Fehlermeldung aus Backend-Response
      const backendError = error.response?.data?.error || error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;

      if (validationErrors && Array.isArray(validationErrors)) {
        throw new Error(validationErrors.map((e: any) => e.msg).join(', '));
      }

      throw new Error(backendError || error.message || 'Netzwerkfehler beim Erstellen');
    }

    throw error;
  }
}
/**
 * Aktualisiert ein bestehendes Projekt (Basisdaten wie Titel, Domain)
 * @param id - Projekt-ID
 * @param data - Zu aktualisierende Daten
 */
async function updateProjekt(id: number, data: { title?: string, domain?: string }): Promise<Project> {
  try {
    console.log(`📤 UPDATE Projekt Request (ID: ${id}):`, data);

    const response = await apiClient.patch<ApiResponse<Project>>(
      `/projects/${id}`, // Entspricht deiner Backend-Route: PATCH /api/projects/:id
      data
    );

    console.log('📥 UPDATE Projekt Response:', response.data);

    // unwrapResponse validiert success und extrahiert data
    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Update Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Aktualisieren des Projekts');
    }
    throw error;
  }
}


/**
 * Aktualisiert Business Understanding eines Projekts
 */
async function patchBusinessUnderstanding(
  id: number,
  data: UpdateBusinessUnderstandingRequest
): Promise<BusinessUnderstandingResponse> {
  try {
    console.log(`📤 PATCH Business Understanding (ID: ${id}):`, data);

    const response = await apiClient.patch<ApiResponse<BusinessUnderstandingResponse>>(
      `/projects/${id}/business-understanding`,
      data
    );

    console.log('📥 Business Understanding Response:', response.data);
    console.log('✅ Business Understanding gespeichert');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Business Understanding Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Speichern von Business Understanding');
    }
    throw error;
  }
}

/**
 * Aktualisiert Data Characteristics eines Projekts
 */
async function patchDataCharacteristics(
  id: number,
  data: UpdateDataCharacteristicsRequest
): Promise<DataCharacteristicsResponse> {
  try {
    console.log(`📤 PATCH Data Characteristics (ID: ${id}):`, data);

    const response = await apiClient.patch<ApiResponse<DataCharacteristicsResponse>>(
      `/projects/${id}/data-characteristics`,
      data
    );

    console.log('📥 Data Characteristics Response:', response.data);
    console.log('✅ Data Characteristics gespeichert');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Data Characteristics Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Speichern von Data Characteristics');
    }
    throw error;
  }
}

/**
 * Aktualisiert Analysis Config eines Projekts
 */
async function patchAnalysisConfig(
  id: number,
  data: UpdateAnalysisConfigRequest
): Promise<AnalysisConfigResponse> {
  try {
    console.log(`📤 PATCH Analysis Config (ID: ${id}):`, data);

    const response = await apiClient.patch<ApiResponse<AnalysisConfigResponse>>(
      `/projects/${id}/analysis-config`,
      data
    );

    console.log('📥 Analysis Config Response:', response.data);
    console.log('✅ Analysis Config gespeichert');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Analysis Config Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Speichern von Analysis Config');
    }
    throw error;
  }
}

/**
 * Aktualisiert Deployment Config eines Projekts
 */
async function patchDeploymentConfig(
  id: number,
  data: UpdateDeploymentConfigRequest
): Promise<DeploymentConfigResponse> {
  try {
    console.log(`📤 PATCH Deployment Config (ID: ${id}):`, data);

    const response = await apiClient.patch<ApiResponse<DeploymentConfigResponse>>(
      `/projects/${id}/deployment-config`,
      data
    );

    console.log('📥 Deployment Config Response:', response.data);
    console.log('✅ Deployment Config gespeichert');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Deployment Config Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Speichern von Deployment Config');
    }
    throw error;
  }
}

/**
 * Aktualisiert Utilization Config eines Projekts
 */
async function patchUtilizationConfig(
  id: number,
  data: UpdateUtilizationConfigRequest
): Promise<UtilizationConfigResponse> {
  try {
    console.log(`📤 PATCH Utilization Config (ID: ${id}):`, data);

    const response = await apiClient.patch<ApiResponse<UtilizationConfigResponse>>(
      `/projects/${id}/utilization-config`,
      data
    );

    console.log('📥 Utilization Config Response:', response.data);
    console.log('✅ Utilization Config gespeichert');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Utilization Config Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Speichern von Utilization Config');
    }
    throw error;
  }
}

/**
 * Schließt den Wizard ab und startet die Projektplan-Berechnung
 */
async function completeWizard(id: number): Promise<CompleteWizardResponse> {
  try {
    console.log(`📤 POST Complete Wizard (ID: ${id})`);

    const response = await apiClient.post<ApiResponse<CompleteWizardResponse>>(
      `/projects/${id}/complete-wizard`
    );

    console.log('📥 Complete Wizard Response:', response.data);
    console.log('✅ Wizard abgeschlossen & Projektplan erstellt');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Complete Wizard Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Abschließen des Wizards');
    }
    throw error;
  }
}



/**
 * Holt vollständige Dashboard-Daten für ein Projekt
 */
async function getDashboardData(id: number): Promise<DashboardData> {
  try {
    console.log(`📤 GET Dashboard Data (ID: ${id})`);

    const response = await apiClient.get<ApiResponse<DashboardData>>(
      `/dashboard/${id}`
    );

    console.log('📥 Dashboard Data Response:', response.data);
    console.log('✅ Dashboard geladen');

    return unwrapResponse(response);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Dashboard Error:', error.response?.data);
      const backendError = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendError || 'Fehler beim Laden des Dashboards');
    }
    throw error;
  }
}
// ===== HELPER FUNCTIONS =====

/**
 * Extrahiert Daten aus der Backend-Response-Struktur
 * Wirft einen Error wenn success = false
 * @param response - Axios Response mit ApiResponse<T> Struktur
 * @returns Die unwrapped Daten vom Typ T
 */
function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message || 'API Request fehlgeschlagen');
  }
  return response.data.data;
}


export default {
  // Startseite
  getProjektListe,
  getStatistiken,
  getZuletztBearbeitet,

  // Dashboard
  getProjektById,
  getTimeline,
  postEvaluation,
  patchProjektStatus,
  patchTaskStatus,
  patchTemplatePhase,
  getDashboardData,

  // Wizard
  createProjekt,
  updateProjekt,
  patchBusinessUnderstanding,
  patchDataCharacteristics,
  patchAnalysisConfig,
  patchDeploymentConfig,
  patchUtilizationConfig,
  completeWizard

};
