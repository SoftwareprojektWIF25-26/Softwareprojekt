<script setup lang="ts">
import {onMounted, watch} from "vue";
import {useRouter} from "vue-router";
import api from "@/api";
import {Projekt} from "@/types";

const status =ref("")
const projects = ref<Projekt[]>([]);
const router = useRouter()

async function getfilteredProjekte(){
  const res = await api.getZuletztBearbeitet({status: status.value})
  projects.value = res.data ?? [];
}

watch(status,()=>{getfilteredProjekte()})
function goToDashboard(id) {
  router.push({ name: 'dashboard', params: { id } })

}

onMounted(async () => {
  const project = await api.getProjektListe()
  projects.value = project.data
})
</script>

<template>
  <section class="w-full max-w-6xl p-8 mx-auto">
    <div class="grauer-kasten">

      <h1>
        Meine Projekte
      </h1>

      <div v-if="projects.length === 0"
           class="flex items-center justify-center min-h-[200px]">
        <span >
          Noch keine Projekte vorhanden
        </span>
      </div>

      <div v-else
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <select v-model="status">
            <option value="">Alle</option>
            <option value="PLANNING">In Planung</option>
            <option value="IN_PROGRESS">In Bearbeitung</option>
            <option value="COMPLETED">Abgeschlossen</option>
            <option value="CANCELLED">Abgebrochen</option>
            <option value="ON-HOLD">Pausiert</option>

          </select>
        </div>
        <div
          v-for="project in projects"
          :key="project.ID"
          class="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer"
          @click="goToDashboard(project.ID)">
          <h2>{{ project.Titel}}</h2>
          <p> {{project.Teamgroesse}}</p>
          <p>{{project.Status}}</p>
          </div>
      </div>

    </div>
  </section>
</template>


