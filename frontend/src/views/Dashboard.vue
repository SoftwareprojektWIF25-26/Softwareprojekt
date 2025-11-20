<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import {getProjectById} from '@/api/index.ts';
import {Projekt} from "@/types";


const props = defineProps<{id: string}>()

const projektDetails = reactive<Projekt>({
  ID: "",
  Titel: "",
  Teamrollen: [],
  Zeitrahmen: "",
  Datenzugriff: [],
  Datenquellen: [],
  Datenvorbereitungsschritte: "",
  Bewertungsmetriken: [],
  Projektprobleme: [],
})
;
/*
onMounted(async () => {
    projektDetails.value = await getProjectById(props.id);
})
*/

</script>

<template>

<h1>{{projektDetails.Titel}}</h1>

  <div class="grauer Kasten">

    <h2> Projektdetails</h2>

  <h3>Geschäftsverständnis</h3>
  <div class="space-y-2 text-gray-700">
    <p><span class="font-semibold">Geschäftsziel:</span> {{ projektDetails.Geschaeftsziel  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Form des finalen Produkts:</span> {{ projektDetails.FormFinaleProdukt  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Teamrollen:</span> {{ projektDetails.Teamrollen  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Teamgröße:</span> {{ projektDetails.Teamgroesses  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Zeitrahmen:</span> {{ projektDetails.Zeitrahmen  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Kosten:</span> {{ projektDetails.Kosten  || '– keine Angabe –'  }}</p>
  </div>

  <h3>Datensammlung, -erforschung, -vorbereitung</h3>
  <div class="space-y-2 text-gray-700">
    <p><span class="font-semibold">Datenzugriff:</span> {{ projektDetails.Datenzugriff  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datenverfügbarkeit:</span> {{ projektDetails.Datenverfuegbarkeit  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datenquellen:</span> {{ projektDetails.Datenquellen  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datensicherheit:</span> {{ projektDetails.Datensicherhiet  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datengeschwindigkeit:</span> {{ projektDetails.Datengeschwindigkeit  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datenqualität:</span> {{ projektDetails.Datenqualitaet  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datenvielfalt:</span> {{ projektDetails.Datenvielfalt  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datenumfang:</span> {{ projektDetails.Datenumfang  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Datenvariabilität:</span> {{ projektDetails.Datenvariabilitaet  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Vorbereitungsschritte:</span> {{ projektDetails.Datenvorbereitungsschritte  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Tools:</span> {{ projektDetails.Datentools  || '– keine Angabe –'  }}</p>
  </div>

  <h3>Analyse</h3>
  <div class="space-y-2 text-gray-700">
    <p><span class="font-semibold">Data Science Ziele:</span> {{ projektDetails.DataScienceZiele  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Typ:</span> {{ projektDetails.Analysetyp  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Zeitrahmen:</span> {{ projektDetails.Analysezeitrahmen  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Tools:</span> {{ projektDetails.Analysetools  || '– keine Angabe –'  }}</p>
  </div>

  <h3>Deployment</h3>
  <div class="space-y-2 text-gray-700">
    <p><span class="font-semibold">Zeitrahmen:</span> {{ projektDetails.Analysezeitrahmen  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Zielgruppe:</span> {{ projektDetails.Zielgruppe  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Tests:</span> {{ projektDetails.Tests  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Projektprobleme:</span> {{ projektDetails.Projektprobleme  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Tools:</span> {{ projektDetails.DeploymentTools  || '– keine Angabe –'  }}</p>
  </div>

  <h3>Verwendung</h3>
  <div class="space-y-2 text-gray-700">
    <p><span class="font-semibold">Überwachung:</span> {{ projektDetails.Ueberwachung  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Wartung:</span> {{ projektDetails.Wartung  || '– keine Angabe –'  }}</p>
    <p><span class="font-semibold">Tools:</span> {{ projektDetails.Verwendungstools  || '– keine Angabe –'  }}</p>
  </div>

  </div>
</template>

<style scoped>

</style>
