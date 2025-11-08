import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Dashboard from "@/views/Dashboard.vue";
import Projekt_erstellen from "@/views/Projekt_erstellen.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/dashboard/:id',
      name: 'dashboard',
      component: Dashboard,
      props: true},
    {
      path: '/Projekt_erstellen',
      name: 'Projekt_erstellen',
      component: Projekt_erstellen,
    }
  ],
})

export default router
