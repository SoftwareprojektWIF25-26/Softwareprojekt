import axios from 'axios'
import {Projekt} from "@/types";

//Startseite
function getProjektListe(){
  return axios.get('/api/startpage').then(res => res.data)
}

function getStatistiken(){
  return axios.get('/api/startpage/statistics').then(res => res.data)
}

function getZuletztBearbeitet(){
  return axios.get('/api/startpage/recent-projects').then(res => res.data)
}

//Dashboard
function getProjektById(id: number): Promise<Projekt> {
  return axios.get(`/api/dashboard/${id}`).then(res => res.data)
}
function getTimeline(id: number){
  return axios.get(`/api/dashboard/${id}/timeline`).then(res => res.data)
}

function postEvaluation(id: number){
   axios.post(`/api/dashboard/${id}/evaluations`).then(res =>res.data )
}

function patchProjektStatus(id: number, status: string){
   axios.patch(`/api/dashboard/${id}/status`, {status: status}).then(res => res.data)
}

function patchTaskStatus(id: number, status: string){
  axios.patch(`/api/dashboard/tasks/${id}/status`, {status: status}).then(res => res.data)
}

function patchTemplatePhase(id: number, phase: string){
  axios.patch(`/api/dashboard/${id}/template-phase/${phase}/status`, {phase: id}).then(res => res.data)
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
  patchTemplatePhase
}
