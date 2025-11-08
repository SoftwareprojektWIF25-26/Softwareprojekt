<script setup lang="ts">
import {onMounted} from "vue";
import {ref} from "vue";
import {useRouter} from "vue-router";

const projects = ref([])
const router = useRouter()

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
    <!-- Grauer Kasten um Überschrift + Projektliste -->
    <div class="bg-gray-200 rounded-3xl p-8 shadow-lg border border-gray-300">

      <!-- Überschrift -->
      <h1 class="text-2xl font-bold mb-6 text-center text-primary">
        Meine Projekte
      </h1>

      <!-- Projektliste -->
      <div v-if="projects.length === 0"
           class="flex items-center justify-center min-h-[200px]">
        <span class="bg-gray-400 text-white text-lg font-semibold px-8 py-6 rounded-3xl shadow-lg border border-gray-500">
          Noch keine Projekte vorhanden
        </span>
      </div>

      <div v-else
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projects"
          :key="project.id"
          class="p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer"
          @click="goToDashboard(project.id)">
          <h2>{{ project.name }}</h2>
        </div>
      </div>

    </div>
  </section>
</template>


