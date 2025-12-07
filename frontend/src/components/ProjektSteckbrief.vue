<!-- src/components/ProjektSteckbrief.vue -->
<script setup lang="ts">
/**
 * Diese Komponente ist eine reine Präsentations-Komponente.
 * Sie bekommt ein Projekt-Objekt über Props und zeigt es nur an.
 */

import type { Projekt } from '@/types'   // unser großes Projekt-Interface

// Prop-Definition: Das Dashboard übergibt uns ein Projekt
const props = defineProps<{
  projekt: Projekt
}>()

/**
 * Kleine Hilfsfunktion:
 * Wenn etwas leer, null oder [] ist → Zeige "- keine Angabe -"
 */
const fallback = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)
    ? '– keine Angabe –'
    : value
</script>

<template>
  <div class="grauer Kasten">
    <!-- Titel -->
    <h1>{{ props.projekt.Titel }}</h1>

    <h2>Projektdetails</h2>

    <!-- ============================= -->
    <!--     Geschäftsverständnis      -->
    <!-- ============================= -->
    <h3>Geschäftsverständnis</h3>
    <div class="space-y-2 text-gray-700">

      <p><span class="font-semibold">Geschäftsziel:</span>
        {{ fallback(props.projekt.Geschaeftsziel) }}
      </p>

      <p><span class="font-semibold">Form des finalen Produkts:</span>
        {{ fallback(props.projekt.FormFinaleProdukt) }}
      </p>

      <p><span class="font-semibold">Teamrollen:</span>
        {{ fallback(props.projekt.Teamrollen) }}
      </p>

      <p><span class="font-semibold">Teamprozess:</span>
        {{ fallback(props.projekt.Teamprocesses) }}
      </p>

      <p><span class="font-semibold">Zeitrahmen:</span>
        {{ fallback(props.projekt.Zeitrahmen) }}
      </p>

      <p><span class="font-semibold">Kosten:</span>
        {{ fallback(props.projekt.Kosten) }}
      </p>
    </div>

    <!-- ============================= -->
    <!--     Datensammlung / etc.      -->
    <!-- ============================= -->

    <h3>Datensammlung, -forschung, -vorbereitung</h3>
    <div class="space-y-2 text-gray-700">

      <p><span class="font-semibold">Datenzugriff:</span>
        {{ fallback(props.projekt.Datenzugriff) }}
      </p>

      <p><span class="font-semibold">Datenverfügbarkeit:</span>
        {{ fallback(props.projekt.Datenverfuegbarkeit) }}
      </p>

      <p><span class="font-semibold">Datenquellen:</span>
        {{ fallback(props.projekt.Datenquellen) }}
      </p>

      <p><span class="font-semibold">Datensicherheit:</span>
        {{ fallback(props.projekt.Datensicherheit) }}
      </p>

      <p><span class="font-semibold">Datenqualität:</span>
        {{ fallback(props.projekt.Datenqualitaet) }}
      </p>

      <p><span class="font-semibold">Datengeschwindigkeit:</span>
        {{ fallback(props.projekt.Datengeschwindigkeit) }}
      </p>

      <p><span class="font-semibold">Datenvariabilität:</span>
        {{ fallback(props.projekt.Datenvariabilitaet) }}
      </p>

      <p><span class="font-semibold">Datenumfang:</span>
        {{ fallback(props.projekt.Datenumfang) }}
      </p>

      <p><span class="font-semibold">Vorbereitungsschritte:</span>
        {{ fallback(props.projekt.Datenvorbereitungsschritte) }}
      </p>

      <p><span class="font-semibold">Tools:</span>
        {{ fallback(props.projekt.Datentools) }}
      </p>
    </div>

    <!-- ============================= -->
    <!--             Analyse           -->
    <!-- ============================= -->
    <h3>Analyse</h3>
    <div class="space-y-2 text-gray-700">

      <p><span class="font-semibold">Data Science Ziele:</span>
        {{ fallback(props.projekt.DataScienceZiele) }}
      </p>

      <p><span class="font-semibold">Analysetyp:</span>
        {{ fallback(props.projekt.Analysetyp) }}
      </p>

      <p><span class="font-semibold">Analyserahmen:</span>
        {{ fallback(props.projekt.Analysezeitrahmen) }}
      </p>

      <p><span class="font-semibold">Tools:</span>
        {{ fallback(props.projekt.Analyesetools) }}
      </p>
    </div>

    <!-- ============================= -->
    <!--            Deployment         -->
    <!-- ============================= -->
    <h3>Deployment</h3>
    <div class="space-y-2 text-gray-700">

      <p><span class="font-semibold">Zeitrahmen:</span>
        {{ fallback(props.projekt.Analysezeitrahmen) }}
      </p>

      <p><span class="font-semibold">Zielgruppe:</span>
        {{ fallback(props.projekt.Zielgruppe) }}
      </p>

      <p><span class="font-semibold">Tests:</span>
        {{ fallback(props.projekt.Tests) }}
      </p>

      <p><span class="font-semibold">Projektprobleme:</span>
        {{ fallback(props.projekt.Projektprobleme) }}
      </p>

      <p><span class="font-semibold">Tools:</span>
        {{ fallback(props.projekt.DeploymentTools) }}
      </p>
    </div>

    <!-- ============================= -->
    <!--           Verwendung          -->
    <!-- ============================= -->
    <h3>Verwendung</h3>
    <div class="space-y-2 text-gray-700">

      <p><span class="font-semibold">Überwachung:</span>
        {{ fallback(props.projekt.Ueberwachung) }}
      </p>

      <p><span class="font-semibold">Wartung:</span>
        {{ fallback(props.projekt.Wartung) }}
      </p>

      <p><span class="font-semibold">Tools:</span>
        {{ fallback(props.projekt.Verwendungstools) }}
      </p>
    </div>

  </div>
</template>

<style scoped>
.grauer {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
}

/* Text nicht zu hell machen */
h1, h2, h3, p, li, span {
  color: #0f172a; /* dunkles Grau/Blau */
}

.muted {
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>

