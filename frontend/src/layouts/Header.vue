<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();

const titles: Record<string, string> = {
  home: "Startseite",
  dashboard: "Dashboard",
  "projekt-erstellen": "Projekt erstellen",
  "business-understanding": "Geschäftsverständnis",
  "data-collection": "Datensammlung",
  "analysis": "Analyse & Modellierung",
  "deployment": "Deployment",
  "utilization": "Nutzung & Monitoring"
};

const title = computed(() => titles[route.name as string] || "");
</script>

<template>
  <header class="header">
    <nav class="header-left">
      <a href="/">
        <img
          src="@/assets/Signet_FIN_1.jpeg"
          alt="Otto von Guericke Universität Magdeburg"
          class="logo"
        >
      </a>
    </nav>
    <div class="header-center">
      <p>{{ title }}</p>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--color-primary);
  color: white;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  height: 60px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left .logo {
  width: auto;
  height: 40px;
  cursor: pointer;
  transition: transform 0.2s;
}

.header-left .logo:hover {
  transform: scale(1.05);
}

.header-center p {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  letter-spacing: 0.5px;
  font-size: 1.5rem;
  margin: 0;
}

.logo {
  display: block;
}
</style>
