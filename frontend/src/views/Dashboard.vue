<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "@/api"; // API-Service importieren
import type { Projekt } from "@/types"; // Projekt-Typ importieren

const route = useRoute();
const projektDetails = ref<Projekt | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Diese Funktion wird automatisch aufgerufen, wenn die Komponente geladen wird.
onMounted(async () => {
  try {
    // 1. Die Projekt-ID aus der URL auslesen (z.B. /dashboard/42)
    const projektId = Number(route.params.id);

    // 2. Die Daten vom Backend für genau diese ID anfordern
    projektDetails.value = await api.getProjektById(projektId);

  } catch (err) {
    console.error("Fehler beim Laden des Projekts:", err);
    error.value = "Projektdaten konnten nicht geladen werden.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <!-- 1. WIRD ANGEZEIGT WÄHREND DEM LADEN -->
  <div v-if="isLoading" class="p-8 text-center text-gray-500">
    <p>Lade Projektdaten...</p>
  </div>

  <!-- 2. WIRD ANGEZEIGT BEI FEHLER -->
  <div v-else-if="error" class="p-8 text-center text-red-500">
    <p>Fehler: {{ error }}</p>
  </div>

  <!-- 3. WIRD ANGEZEIGT WENN DATEN DA SIND (Dein eigentlicher Inhalt) -->
  <div v-else-if="projektDetails" class="p-8">

    <h1 class="text-3xl font-bold mb-6 text-blue-600">{{ projektDetails.Titel }}</h1>

    <div class="grauer Kasten bg-gray-50 p-6 rounded-lg shadow-sm">
      <h2 class="text-xl font-bold mb-4 border-b pb-2">Projektdetails</h2>

      <!-- Geschäftsverständnis -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-800">Geschäftsverständnis</h3>
        <div class="space-y-2 text-gray-700 ml-4">
          <p><span class="font-semibold">Geschäftsziel:</span> {{ projektDetails.Geschaeftsziel || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Form des finalen Produkts:</span> {{ projektDetails.FormFinaleProdukt || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Teamrollen:</span> {{ projektDetails.Teamrollen || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Teamgröße:</span> {{ projektDetails.Teamgroesse || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Zeitrahmen:</span> {{ projektDetails.Zeitrahmen || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Kosten:</span> {{ projektDetails.Kosten || '– keine Angabe –' }}</p>
        </div>
      </div>

      <!-- Datensammlung -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-800">Datensammlung, -erforschung, -vorbereitung</h3>
        <div class="space-y-2 text-gray-700 ml-4">
          <p><span class="font-semibold">Datenzugriff:</span> {{ projektDetails.Datenzugriff || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datenverfügbarkeit:</span> {{ projektDetails.Datenverfuegbarkeit ? 'Ja' : 'Nein/Unbekannt' }}</p>
          <p><span class="font-semibold">Datenquellen:</span> {{ projektDetails.Datenquellen || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datensicherheit:</span> {{ projektDetails.Datensicherhiet || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datengeschwindigkeit:</span> {{ projektDetails.Datengeschwindigkeit || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datenqualität:</span> {{ projektDetails.Datenqualitaet || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datenvielfalt:</span> {{ projektDetails.Datenvielfalt || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datenumfang:</span> {{ projektDetails.Datenumfang || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Datenvariabilität:</span> {{ projektDetails.Datenvariabilitaet || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Vorbereitungsschritte:</span> {{ projektDetails.Datenvorbereitungsschritte || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Tools:</span> {{ projektDetails.Datentools || '– keine Angabe –' }}</p>
        </div>
      </div>

      <!-- Analyse -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-800">Analyse</h3>
        <div class="space-y-2 text-gray-700 ml-4">
          <p><span class="font-semibold">Data Science Ziele:</span> {{ projektDetails.DataScienceZiele || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Typ:</span> {{ projektDetails.Analysetyp || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Zeitrahmen:</span> {{ projektDetails.Analysezeitrahmen || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Tools:</span> {{ projektDetails.Analysetools || '– keine Angabe –' }}</p>
        </div>
      </div>

      <!-- Deployment -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-800">Deployment</h3>
        <div class="space-y-2 text-gray-700 ml-4">
          <p><span class="font-semibold">Zeitrahmen:</span> {{ projektDetails.Analysezeitrahmen || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Zielgruppe:</span> {{ projektDetails.Zielgruppe || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Tests:</span> {{ projektDetails.Tests || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Projektprobleme:</span> {{ projektDetails.Projektprobleme?.join(', ') || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Tools:</span> {{ projektDetails.DeploymentTools || '– keine Angabe –' }}</p>
        </div>
      </div>

      <!-- Verwendung -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-800">Verwendung</h3>
        <div class="space-y-2 text-gray-700 ml-4">
          <p><span class="font-semibold">Überwachung:</span> {{ projektDetails.Ueberwachung || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Wartung:</span> {{ projektDetails.Wartung || '– keine Angabe –' }}</p>
          <p><span class="font-semibold">Tools:</span> {{ projektDetails.Verwendungstools || '– keine Angabe –' }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>

</style>
