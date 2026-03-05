<!-- src/components/ProjektSteckbrief.vue -->
<script setup lang="ts">
import type { Projekt } from '@/types';

/**
 * Definiert die Eingabeparameter (Props) der Komponente.
 * Diese Komponente ist rein präsentativ (Dumb Component).
 */
defineProps<{
  projekt: Projekt
}>();

/**
 * Prüft einen Wert auf Gültigkeit und liefert einen Platzhalter,
 * falls der Wert leer, null, undefined oder ein leeres Array ist.
 */
const formatValue = (value: string | string[] | null | undefined): string | string[] => {
  if (value === null || value === undefined || value === '') {
    return '– keine Angabe –';
  }

  if (Array.isArray(value) && value.length === 0) {
    return '– keine Angabe –';
  }

  // Wenn es ein Array mit Inhalt ist, verbinden wir es für eine saubere Darstellung
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
};
</script>

<template>
  <div class="steckbrief-container">
    <h1 class="text-2xl font-bold mb-4">{{ projekt.Titel }}</h1>
    <h2 class="text-xl font-semibold mb-6 border-b pb-2">Projektdetails</h2>

    <!-- ============================= -->
    <!--     Geschäftsverständnis      -->
    <!-- ============================= -->
    <section class="mb-6">
      <h3 class="text-lg font-medium mb-3 text-slate-800">Geschäftsverständnis</h3>
      <div class="space-y-2 text-gray-700">
        <p><span class="font-semibold text-slate-900">Geschäftsziel:</span> {{ formatValue(projekt.Geschaeftsziel) }}</p>
        <p><span class="font-semibold text-slate-900">Form des finalen Produkts:</span> {{ formatValue(projekt.FormFinaleProdukt) }}</p>
        <p><span class="font-semibold text-slate-900">Teamrollen:</span> {{ formatValue(projekt.Teamrollen) }}</p>
        <p><span class="font-semibold text-slate-900">Teamprozess:</span> {{ formatValue(projekt.Teamprocesses) }}</p>
        <p><span class="font-semibold text-slate-900">Zeitrahmen:</span> {{ formatValue(projekt.Zeitrahmen) }}</p>
        <p><span class="font-semibold text-slate-900">Kosten:</span> {{ formatValue(projekt.Kosten) }}</p>
      </div>
    </section>

    <!-- ============================= -->
    <!--    Daten & Vorbereitung       -->
    <!-- ============================= -->
    <section class="mb-6">
      <h3 class="text-lg font-medium mb-3 text-slate-800">Datensammlung, -forschung, -vorbereitung</h3>
      <div class="space-y-2 text-gray-700">
        <p><span class="font-semibold text-slate-900">Datenzugriff:</span> {{ formatValue(projekt.Datenzugriff) }}</p>
        <p><span class="font-semibold text-slate-900">Datenverfügbarkeit:</span> {{ formatValue(projekt.Datenverfuegbarkeit) }}</p>
        <p><span class="font-semibold text-slate-900">Datenquellen:</span> {{ formatValue(projekt.Datenquellen) }}</p>
        <p><span class="font-semibold text-slate-900">Datensicherheit:</span> {{ formatValue(projekt.Datensicherheit) }}</p>
        <p><span class="font-semibold text-slate-900">Datenqualität:</span> {{ formatValue(projekt.Datenqualitaet) }}</p>
        <p><span class="font-semibold text-slate-900">Datengeschwindigkeit:</span> {{ formatValue(projekt.Datengeschwindigkeit) }}</p>
        <p><span class="font-semibold text-slate-900">Datenvariabilität:</span> {{ formatValue(projekt.Datenvariabilitaet) }}</p>
        <p><span class="font-semibold text-slate-900">Datenumfang:</span> {{ formatValue(projekt.Datenumfang) }}</p>
        <p><span class="font-semibold text-slate-900">Vorbereitungsschritte:</span> {{ formatValue(projekt.Datenvorbereitungsschritte) }}</p>
        <p><span class="font-semibold text-slate-900">Tools:</span> {{ formatValue(projekt.Datentools) }}</p>
      </div>
    </section>

    <!-- ============================= -->
    <!--             Analyse           -->
    <!-- ============================= -->
    <section class="mb-6">
      <h3 class="text-lg font-medium mb-3 text-slate-800">Analyse</h3>
      <div class="space-y-2 text-gray-700">
        <p><span class="font-semibold text-slate-900">Data Science Ziele:</span> {{ formatValue(projekt.DataScienceZiele) }}</p>
        <p><span class="font-semibold text-slate-900">Analysetyp:</span> {{ formatValue(projekt.Analysetyp) }}</p>
        <p><span class="font-semibold text-slate-900">Analyserahmen:</span> {{ formatValue(projekt.Analysezeitrahmen) }}</p>
        <p><span class="font-semibold text-slate-900">Tools:</span> {{ formatValue(projekt.Analyesetools) }}</p>
      </div>
    </section>

    <!-- ============================= -->
    <!--            Deployment         -->
    <!-- ============================= -->
    <section class="mb-6">
      <h3 class="text-lg font-medium mb-3 text-slate-800">Deployment</h3>
      <div class="space-y-2 text-gray-700">
        <p><span class="font-semibold text-slate-900">Zeitrahmen:</span> {{ formatValue(projekt.Analysezeitrahmen) }}</p>
        <p><span class="font-semibold text-slate-900">Zielgruppe:</span> {{ formatValue(projekt.Zielgruppe) }}</p>
        <p><span class="font-semibold text-slate-900">Tests:</span> {{ formatValue(projekt.Tests) }}</p>
        <p><span class="font-semibold text-slate-900">Projektprobleme:</span> {{ formatValue(projekt.Projektprobleme) }}</p>
        <p><span class="font-semibold text-slate-900">Tools:</span> {{ formatValue(projekt.DeploymentTools) }}</p>
      </div>
    </section>

    <!-- ============================= -->
    <!--           Verwendung          -->
    <!-- ============================= -->
    <section>
      <h3 class="text-lg font-medium mb-3 text-slate-800">Verwendung</h3>
      <div class="space-y-2 text-gray-700">
        <p><span class="font-semibold text-slate-900">Überwachung:</span> {{ formatValue(projekt.Ueberwachung) }}</p>
        <p><span class="font-semibold text-slate-900">Wartung:</span> {{ formatValue(projekt.Wartung) }}</p>
        <p><span class="font-semibold text-slate-900">Tools:</span> {{ formatValue(projekt.Verwendungstools) }}</p>
      </div>
    </section>

  </div>
</template>

<style scoped>
.steckbrief-container {
  background-color: #f8fafc; /* tailwind slate-50 equivalent */
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/*
  Spezifische Farbzuweisungen wurden durch Utility-Classes von Tailwind
  im Template oben ersetzt (text-slate-800, text-gray-700 etc.),
  was eine konsistentere Wartung ermöglicht.
*/
</style>
