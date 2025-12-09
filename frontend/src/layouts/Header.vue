<script setup lang="ts">
import {useRoute} from "vue-router";
import {computed} from "vue";

const route = useRoute();
const titles: Record<String, String>={
  home: "Startseite",
  dashboard: "Dashboard",
  Projekt_erstellen: "Projekt erstellen",
}
const title = computed(() => titles[route.name as string]|| "");
</script>

<template>
<header class="header">
  <nav class="header-left">
    <a href="/">
    <img src="@/assets/Signet_FIN_1.jpeg"
         alt="Logo"
         class="logo"
         >
    </a>
  </nav>
  <div class="header-center">
    <p> {{title}}</p>
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
  height: 40px;
}
.header-left .logo {
  width: auto;
  height: 40px;
}
.header-center p{
  position: absolute;
  left: 50%;
  font-weight: 500;
  letter-spacing: 0.5px;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
}
.logo {
  display: block;
  margin: 0 auto;
}
</style>
