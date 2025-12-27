import axios from 'axios';
import {
  Project,
  CreateProjectRequest,
  UpdateBusinessUnderstandingRequest,
  UpdateDataCharacteristicsRequest,
  UpdateAnalysisConfigRequest,
  UpdateDeploymentConfigRequest,
  UpdateUtilizationConfigRequest,
  FullProject
} from '@/types';

// STARTSEITE
function getProjektListe(): Promise<Project[]> {
  return axios.get('/api/startpage').then(res => res.data);
}

function getStatistiken() {
  return axios.get('/api/startpage/statistics').then(res => res.data);
}

function getZuletztBearbeitet(): Promise<Project[]> {
  return axios.get('/api/startpage/recent-projects').then(res => res.data);
}

// DASHBOARD
function getProjektById(id: number): Promise<FullProject> {
  return axios.get(`/api/dashboard/${id}`).then(res => res.data);
}

function getTimeline(id: number) {
  return axios.get(`/api/dashboard/${id}/timeline`).then(res => res.data);
}

function postEvaluation(id: number) {
  return axios.post(`/api/dashboard/${id}/evaluations`).then(res => res.data);
}

function patchProjektStatus(id: number, status: string) {
  return axios.patch(`/api/dashboard/${id}/status`, { status }).then(res => res.data);
}

function patchTaskStatus(id: number, status: string) {
  return axios.patch(`/api/dashboard/tasks/${id}/status`, { status }).then(res => res.data);
}

function patchTemplatePhase(id: number, phase: string) {
  return axios.patch(`/api/dashboard/${id}/template-phase/${phase}/status`, { phase: id }).then(res => res.data);
}

// === WIZARD FUNKTIONEN ===

function createProjekt(projektData: CreateProjectRequest): Promise<{ success: boolean; data: { id: number } }> {
  return axios.post('/api/projects/create', projektData).then(res => res.data);
}

function patchBusinessUnderstanding(id: number, data: UpdateBusinessUnderstandingRequest) {
  return axios.patch(`/api/projects/${id}/business-understanding`, data).then(res => res.data);
}

function patchDataCharacteristics(id: number, data: UpdateDataCharacteristicsRequest) {
  return axios.patch(`/api/projects/${id}/data-characteristics`, data).then(res => res.data);
}

function patchAnalysisConfig(id: number, data: UpdateAnalysisConfigRequest) {
  return axios.patch(`/api/projects/${id}/analysis-config`, data).then(res => res.data);
}

function patchDeploymentConfig(id: number, data: UpdateDeploymentConfigRequest) {
  return axios.patch(`/api/projects/${id}/deployment-config`, data).then(res => res.data);
}

function patchUtilizationConfig(id: number, data: UpdateUtilizationConfigRequest) {
  return axios.patch(`/api/projects/${id}/utilization-config`, data).then(res => res.data);
}

function completeWizard(id: number) {
  return axios.post(`/api/projects/${id}/complete-wizard`).then(res => res.data);
}

export default {
  getProjektListe,
  getProjektById,
  getStatistiken,
  postEvaluation,
  getTimeline,
  getZuletztBearbeitet,
  patchProjektStatus,
  patchTaskStatus,
  patchTemplatePhase,
  createProjekt,
  patchBusinessUnderstanding,
  patchDataCharacteristics,
  patchAnalysisConfig,
  patchDeploymentConfig,
  patchUtilizationConfig,
  completeWizard
};
