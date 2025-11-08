<script setup lang="ts">
import Projektliste from '@/components/Projektliste.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function gotToProjekt_erstellen(){
  router.push({ name: 'Projekt_erstellen' })
}
</script>

<template>
  <Projektliste />
<button
  class="btn btn-primary"
  type="button"
  @click ="gotToProjekt_erstellen">
  Neues Projekt erstellen
  </button>
</template>
