<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";
import type { ProjectListItem, ProjectStatistics } from "@/types";

// ====================================
// INITIALISIERUNG & STATE
// ===============================

const router = useRouter();

const projects = ref<ProjectListItem[]>([]);
const statistics = ref<ProjectStatistics | null>(null);

const isLoading = ref(true);
const error = ref<string | null>(null);

const selectedStatuses = ref<string[]>([]);
const isFilterOpen = ref(false);

const searchQuery = ref<string>('');

// =========================================
// KONFIGURATION & MAPPINGS
// ============================================================================

const STATUS_CONFIG = [
  { value: 'PLANNING', label: 'Planung', badgeClass: 'badge-planning' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung', badgeClass: 'badge-in-progress' },
  { value: 'COMPLETED', label: 'Abgeschlossen', badgeClass: 'badge-completed' },
  { value: 'ON_HOLD', label: 'Pausiert', badgeClass: 'badge-on-hold' },
  { value: 'CANCELLED', label: 'Abgebrochen', badgeClass: 'badge-cancelled' }
] as const;

// ============================================================================
// COMPUTED PROPERTIES
// ===============================================

/**
 * Filtert die angezeigten Projekte basierend auf den ausgewählten Status-Checkboxen.
 * Wenn nichts ausgewählt ist, werden alle Projekte angezeigt.
 */
const filteredProjects = computed(() => {
  let result = projects.value;

  // 1. Textsuche anwenden (Titel und Domain)
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(project =>
      project.title.toLowerCase().includes(query) ||
      (project.domain && project.domain.toLowerCase().includes(query))
    );
  }

  // 2. Status-Filter anwenden
  if (selectedStatuses.value.length > 0) {
    result = result.filter(project => selectedStatuses.value.includes(project.status));
  }

  return result;
});

/**
 * Berechnet die Anzahl der Projekte pro Status lokal,
 * falls die API keine expliziten Statistiken liefert.
 */
const localStatistics = computed(() => {
  const counts: Record<string, number> = {};

  // Initialisiere alle Zähler mit 0
  STATUS_CONFIG.forEach(option => {
    counts[option.value] = 0;
  });

  // Zähle die Projekte
  projects.value.forEach(project => {
    if (counts[project.status] !== undefined) {
      counts[project.status]++;
    }
  });

  return counts;
});

// ============================================================================
// LIFECYCLE & DATEN LADEN
// ===========================================

onMounted(async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Führe beide API-Aufrufe parallel aus (Performance Boost).
    // allSettled garantiert, dass die Projekte auch geladen werden,
    // wenn der Statistik-Aufruf fehlschlägt.
    const [projectsResult, statsResult] = await Promise.allSettled([
      api.getProjektListe(),
      api.getStatistiken()
    ]);

    if (projectsResult.status === 'fulfilled') {
      projects.value = projectsResult.value;
    } else {
      throw new Error("Fehler beim Laden der Projektliste.");
    }

    if (statsResult.status === 'fulfilled') {
      statistics.value = statsResult.value;
    } else {
      console.warn("Statistiken konnten nicht vom Server geladen werden. Verwende lokale Berechnung.");
    }

  } catch (err) {
    console.error("Daten-Ladefehler:", err);
    error.value = "Projekte konnten nicht geladen werden.";
  } finally {
    isLoading.value = false;
  }
});

// ==============================================
// METHODEN (UI INTERAKTION & NAVIGATION)
// ============================================================================

function toggleFilter() {
  isFilterOpen.value = !isFilterOpen.value;
}

function toggleStatus(status: string) {
  const index = selectedStatuses.value.indexOf(status);
  if (index > -1) {
    selectedStatuses.value.splice(index, 1);
  } else {
    selectedStatuses.value.push(status);
  }
}

function goToProjektErstellen() {
  router.push({ name: "projekt-erstellen" });
}

function openDashboard(projectId: number) {
  router.push({ name: "dashboard", params: { id: String(projectId) } });
}

// ============================================================================
// HILFSMETHODEN (FORMATIERUNG)
// ============================================================================

function getStatusLabel(status: string): string {
  return STATUS_CONFIG.find(o => o.value === status)?.label || status;
}

function getStatusBadgeClass(status: string): string {
  return STATUS_CONFIG.find(o => o.value === status)?.badgeClass || 'badge-planning';
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}
</script>


<template>
  <div class="home-container">

    <!-- LINKER BEREICH: PROJEKTLISTE & FILTER -->
    <aside class="sidebar-list">

      <div class="sidebar-header">
        <h2>Projekte</h2>

          <!-- Suchfeld -->
          <div style="margin-bottom: 1rem;">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Nach Titel oder Domain suchen..."
              class="form-input"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;"
            >
          </div>

            <div class="filter-wrapper">
          <button class="filter-toggle-btn" @click="toggleFilter" :class="{ active: isFilterOpen }">
            <span class="icon">🔽</span> Filter
            <span v-if="selectedStatuses.length" class="filter-count">{{ selectedStatuses.length }}</span>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isFilterOpen" class="filter-dropdown">
            <div
              v-for="option in STATUS_CONFIG"
              :key="option.value"
              class="filter-option"
              @click="toggleStatus(option.value)"
            >
              <input
                type="checkbox"
                :checked="selectedStatuses.includes(option.value)"
                @click.stop="toggleStatus(option.value)"
              >
              <span>{{ option.label }}</span>

              <!-- Anzahl anzeigen (aus Statistik oder berechnet) -->
              <span class="count-badge" v-if="statistics">
                 {{ localStatistics[option.value] || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrollbare Liste -->
      <div class="project-scroll-area">
        <div v-if="isLoading" class="state-msg">
          <div class="spinner"></div> Lade Projekte...
        </div>

        <div v-else-if="error" class="state-msg error">{{ error }}</div>

        <div v-else-if="filteredProjects.length === 0" class="state-msg">
          Keine Projekte gefunden
        </div>

        <div
          v-else
          v-for="project in filteredProjects"
          :key="project.id"
          class="list-item-card"
          @click="openDashboard(project.id)"
        >
          <div class="item-header">
            <h3 class="item-title">{{ project.title }}</h3>
            <span :class="['status-dot', getStatusBadgeClass(project.status)]" :title="getStatusLabel(project.status)"></span>
          </div>

          <p class="item-domain">{{ project.domain || 'Keine Domain angegeben' }}</p>

          <div class="item-meta">
            <span>{{ getStatusLabel(project.status) }}</span>
            <span>🕒 {{ formatDate(project.updatedAt) }}</span>
          </div>

          <!-- Wizard Progress Bar -->
          <div class="mini-progress-bar">
            <div class="progress-fill" :style="{ width: project.wizardProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Button unten fest -->
      <div class="sidebar-footer">
        <button class="btn-primary full-width" @click="goToProjektErstellen">
          + Neues Projekt
        </button>
      </div>
    </aside>

    <!-- RECHTER BEREICH: PREVIEW / WILLKOMMEN -->
    <main class="main-preview">
      <div class="welcome-screen">
        <div class="welcome-content">
          <h1>Willkommen im Data Science Lab</h1>
          <p>Wähle ein Projekt aus oder erstelle ein neues</p>
          <img src="@/assets/Signet_FIN_1.jpeg" alt="Uni Magdeburg Logo" class="watermark-logo">
        </div>
      </div>
    </main>

  </div>
</template>

<style scoped>
/* LAYOUT GRID */
.home-container {
  display: grid;
  grid-template-columns: 380px 1fr;
  /* KORREKTUR: Kein margin-top, da App.vue das bereits übernimmt.
     Höhe wird explizit auf den verbleibenden Viewport begrenzt. */
  height: calc(100vh - 60px);
  width: 100%;
  overflow: hidden; /* Verhindert Scrollen der gesamten Seite */
  background-color: var(--color-background-soft);
}

/* SIDEBAR STYLES */
.sidebar-list {
  background: white;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100%; /* Füllt die volle Höhe des Containers */
  box-shadow: 2px 0 10px rgba(0,0,0,0.05);
  z-index: 10;
  overflow: hidden; /* Wichtig: Verhindert, dass die Sidebar selbst scrollt */
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: white;
  flex-shrink: 0; /* Header darf nicht schrumpfen */
}

.sidebar-header h2 {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
}

/* FILTER DROPDOWN */
.filter-wrapper {
  position: relative;
}

.filter-toggle-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Barlow', sans-serif;
  transition: all 0.2s;
}

.filter-toggle-btn:hover {
  border-color: var(--color-primary);
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-top: 5px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 0.5rem;
  z-index: 100;
}

.filter-option {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
}

.filter-option:hover {
  background: var(--color-background-soft);
}

.filter-count {
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.count-badge {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--color-text-light);
  background: var(--color-background-soft);
  padding: 2px 6px;
  border-radius: 4px;
}

/* LISTE - SCROLLBEREICH */
.project-scroll-area {
  flex: 1; /* Nimmt den gesamten restlichen Platz ein */
  overflow-y: auto; /* NUR hier wird gescrollt */
  padding: 1rem;
  /* Optional: Scrollbar-Styling für bessere Optik */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.list-item-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.list-item-card:hover {
  transform: translateX(4px);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-left-color: var(--color-primary);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.item-domain {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-bottom: 0.75rem;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

/* MINI PROGRESS BAR */
.mini-progress-bar {
  height: 4px;
  background: var(--color-background-mute);
  border-radius: 2px;
  margin-top: 0.75rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

/* STATUS DOTS */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.badge-planning { background-color: var(--color-info); }
.badge-in-progress { background-color: var(--color-warning); }
.badge-on-hold { background-color: var(--color-error); }
.badge-completed { background-color: var(--color-success); }
.badge-cancelled { background-color: grey; }

/* FOOTER */
.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  background: white;
  flex-shrink: 0; /* Footer bleibt unten fixiert */
}

.full-width {
  width: 100%;
  justify-content: center;
}

/* MAIN CONTENT RECHTS */
.main-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  position: relative;
  height: 100%; /* Füllt die rechte Seite komplett aus */
  overflow: hidden; /* Kein Scrollen im rechten Bereich */
}

.welcome-content {
  text-align: center;
  color: var(--color-text-light);
  z-index: 2;
}

.welcome-content h1 {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.watermark-logo {
  margin-top: 3rem;
  opacity: 0.1;
  max-width: 300px;
  filter: grayscale(100%);
}

.state-msg {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
}

.state-msg.error {
  color: var(--color-error);
}

/* Loading Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 10px;
  vertical-align: middle;
}


@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

