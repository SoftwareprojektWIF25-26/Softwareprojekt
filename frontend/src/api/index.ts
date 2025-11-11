import axios from 'axios'
import {Projekt} from "@/types";

function getProjektListe(){
  return axios.get('/api/projektliste').then(res => res.data)

}


function getProjektById(id: number): Promise<Projekt> {
  return axios.get(`/api/projekte/${id}`).then(res => res.data)
}

export default {
  getProjektListe,
  getProjektById
}
