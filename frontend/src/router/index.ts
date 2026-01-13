// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

import HomeView from "@/views/HomeView.vue";
import Dashboard from "@/views/Dashboard.vue";
import Settings from "@/views/Settings.vue";
import projekt_erstellen from '@/views/projekt_erstellen.vue'
import WizardBusinessUnd from "@/views/wizard_businessUnd.vue";
import WizardDataColle from "@/views/wizard_dataColle.vue";
import WizardAnalysis from "@/views/wizard_analysis.vue";
import WizardDeployment from "@/views/wizard_deployment.vue";
import WizardUtilization from "@/views/wizard_utilization.vue";
import GANTDiagram from '@/components/GANTDiagram.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },

    { path: "/dashboard/:id", name: "dashboard", component: Dashboard, props: true },
    {path: "/dashboard/:id/Gant", name: "Gant", component: GANTDiagram, props: true },
    // Wizard (Basis + Steps)
    { path: "/projekt/erstellen", name: "projekt-erstellen", component: projekt_erstellen },
    { path: '/projekt/erstellen/business-understanding', name: 'projekt-erstellen-business',component: WizardBusinessUnd},
    { path: "/projekt/erstellen/data", name: "projekt-erstellen-data", component: WizardDataColle },
    { path: "/projekt/erstellen/analysis", name: "projekt-erstellen-analysis", component: WizardAnalysis },
    { path: "/projekt/erstellen/deployment", name: "projekt-erstellen-deployment", component: WizardDeployment },
    { path: "/projekt/erstellen/utilization", name: "projekt-erstellen-utilization", component: WizardUtilization },
    {path: "/settings", name: "settings", component: Settings}

  ],
});

export default router;
