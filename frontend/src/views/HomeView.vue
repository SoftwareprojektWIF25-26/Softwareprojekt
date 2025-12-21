<script setup lang="ts">
import Projektliste from "@/components/Projektliste.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goToProjektErstellen() {
  router.push({ name: "projekt-erstellen" }); // <-- muss exakt Router-Name sein
  // alternativ: router.push("/projekt/erstellen");
}
</script>

<template>
  <Projektliste />

  <button class="btn btn-primary" type="button" @click="goToProjektErstellen">
    Neues Projekt erstellen
  </button>
</template>
