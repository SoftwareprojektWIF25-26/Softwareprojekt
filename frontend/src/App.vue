<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from "@/layouts/Header.vue";
import { onMounted } from 'vue';
import { setupAutoSave } from '@/stores/projektDraft';

onMounted(() => {
  setupAutoSave();
});
</script>

<template>
  <div class="app-container">
    <Header />

    <!-- Main Content mit Abstand vom Header -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* CSS-Imports für Schriftarten und Variablen */
@import '@/assets/Schriftarten/Schriftart.css';
@import '@/assets/styles/variables.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: #ffffff;
  color: var(--color-text);
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  margin-top: 60px; /* Höhe des Headers */
  flex: 1;
  width: 100%;
}
</style>
