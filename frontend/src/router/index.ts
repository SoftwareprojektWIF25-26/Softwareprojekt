// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

import HomeView from "@/views/HomeView.vue";
import Dashboard from "@/views/Dashboard.vue";

import ProjektErstellen from "@/views/Projekt_erstellen.vue";
import ProjektData from "@/views/projekt_data.vue";
import ProjektAnalysis from "@/views/projekt_analysis.vue";
import ProjektDeployment from "@/views/projekt_deployment.vue";
import ProjektUtilization from "@/views/projekt_utilization.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },

    { path: "/dashboard/:id", name: "dashboard", component: Dashboard, props: true },

    // Wizard (Basis + Steps)
    { path: "/projekt/erstellen", name: "projekt-erstellen", component: ProjektErstellen },
    { path: "/projekt/erstellen/data", name: "projekt-erstellen-data", component: ProjektData },
    { path: "/projekt/erstellen/analysis", name: "projekt-erstellen-analysis", component: ProjektAnalysis },
    { path: "/projekt/erstellen/deployment", name: "projekt-erstellen-deployment", component: ProjektDeployment },
    { path: "/projekt/erstellen/utilization", name: "projekt-erstellen-utilization", component: ProjektUtilization },

    // Optional: alter Link-Fallback (falls du irgendwo noch /projekt-erstellen benutzt hast)
    { path: "/projekt-erstellen", redirect: { name: "projekt-erstellen" } },

    // Optional NotFound:
    // { path: "/:pathMatch(.*)*", name: "not-found", component: () => import("@/views/NotFound.vue") },
  ],
});

export default router;
