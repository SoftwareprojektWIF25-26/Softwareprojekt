<script setup lang="ts">
import Projektliste from '@/components/Projektliste.vue'
import { useRouter } from 'vue-router'
import {Projekt} from "@/types";
import {onMounted} from "vue";
import api from "@/api";

const letzteProjekte = ref<Projekt[]>([]);

function goToDashboard(id) {
  router.push({ name: 'dashboard', params: { id } })

}

const router = useRouter()

function gotToProjekt_erstellen(){
  router.push({ name: 'Projekt_erstellen' })
}
onMounted(async () => {
  const project = await api.getZuletztBearbeitet()
  letzteProjekte.value = project.data
})
</script>

<template>
  <Projektliste />
<button
  class="btn btn-primary"
  type="button"
  @click ="gotToProjekt_erstellen">
  Neues Projekt erstellen
  </button>

  <h2> Zuletzt bearbeitet</h2>
  <div v-if="letzteProjekte.length === 0"
       class="flex items-center justify-center min-h-[200px]">
        <span >
          Noch keine Projekte vorhanden
        </span>
  </div>
    <div v-else
      v-for="projekt in letzteProjekte"
      :key="projekt.ID"
      @click="goToDashboard(projekt.ID)">
    >
      <h3>{{ projekt.Titel }}</h3>
      <p>
        Letzte Bearbeitung: {{ projekt.zuletzt_bearbeitet }}
      </p>
    </div>
</template>
