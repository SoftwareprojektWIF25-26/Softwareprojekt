import axios from 'axios'
import {Projekt} from "@/types";

// STARTSEITE
function getProjektListe(){
  return axios.get('/api/startpage').then(res => res.data)
}
function getStatistiken(){
  return axios.get('/api/startpage/statistics').then(res => res.data)
}
function getZuletztBearbeitet(){
  return axios.get('/api/startpage/recent-projects').then(res => res.data)
}

// DASHBOARD
function getProjektById(id: number): Promise<Projekt> {
  return axios.get(`/api/dashboard/${id}`).then(res => res.data)
}
function getTimeline(id: number){
  return axios.get(`/api/dashboard/${id}/timeline`).then(res => res.data)
}
function postEvaluation(id: number){
  return axios.post(`/api/dashboard/${id}/evaluations`).then(res =>res.data)
}
function patchProjektStatus(id: number, status: string){
  return axios.patch(`/api/dashboard/${id}/status`, {status: status}).then(res => res.data)
}
function patchTaskStatus(id: number, status: string){
  return axios.patch(`/api/dashboard/tasks/${id}/status`, {status: status}).then(res => res.data)
}
function patchTemplatePhase(id: number, phase: string){
  return axios.patch(`/api/dashboard/${id}/template-phase/${phase}/status`, {phase: id}).then(res => res.data)
}

// --- NEU: PROJEKT ERSTELLEN ---
// Nimmt die Daten aus dem Formular und sendet sie ans Backend.
// Das Backend sollte daraufhin das neue Projekt mit seiner ID zurückgeben.
function createProjekt(projektData: Projekt): Promise<{ id: number }> {
  // WICHTIG: Der Pfad '/api/projekte' ist nur ein Beispiel.
  // Passe ihn an deine tatsächliche Backend-Route an.
  return axios.post('/api/projekte', projektData).then(res => res.data);
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
  createProjekt // <--- hier die neue Funktion exportieren
}
