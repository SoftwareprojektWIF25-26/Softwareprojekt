<script setup lang="ts">
import {onMounted, reactive} from "vue";
import {Projekt} from "@/types";
import Gantt from "frappe-gantt";
import api from "@/api";


const props = defineProps<{
  id: string
  phases: {
    name: string;
    startWeek: number;
    durationWeeks: number;
  }[];
}>();

const chartElement = ref<HTMLElement | null>(null);

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

function projektdetailsaendern() {
  router.push({name: 'Projekt_bearbeiten'})
}

function createGantt() {
  if (!chartElement.value) return;

  const tasks = props.phases.map(p => {
    const start = new Date(virtualStart);
    start.setDate(start.getDate() + p.startWeek * 7);

    const end = new Date(virtualStart);
    end.setDate(end.getDate() + (p.startWeek + p.durationWeeks) * 7);

    return {
      id: p.name,
      name: p.name,
      start,
      end,
      progress: 0
    };
  });

    new Gantt(chartElement.value, tasks, {
      view_mode: 'Week',
      language: 'de'
    });

  }

const CollapsibleSection = {
  props: ['title'],
  data() {
    return { open: false }
  },
  template: `
    <div class="border rounded-lg bg-white shadow-sm mb-4">
      <button @click="open = !open"
              class="h3 bg-transparent border-none p-0 flex justify-between items-center">
        <span>{{ title }}</span>
        <span>{{ open ? '-' : '+' }}</span>
      </button>
      <div v-show="open" class="pl-6 pr-4">
        <slot></slot>
      </div>
    </div>
  `
}

  onMounted(async () => {
    projektDetails.value = await api.getProjektById(props.id);
    createGantt()
  })


</script>

<template>

  <h1>{{ projektDetails.Titel }}</h1>
  <div ref="chartElement"></div>

  <div class="grauer Kasten">

    <h2> Projektdetails</h2>

    <CollapsibleSection title="Geschäftsverständnis">
    <div class="space-y-2 text-gray-700">
      <p><span class="font-semibold">Geschäftsziel:</span>
        {{ projektDetails.Geschaeftsziel || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Form des finalen Produkts:</span>
        {{ projektDetails.FormFinaleProdukt || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Teamrollen:</span>
        {{ projektDetails.Teamrollen || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Teamgröße:</span>
        {{ projektDetails.Teamgroesses || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Zeitrahmen:</span>
        {{ projektDetails.Zeitrahmen || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Kosten:</span> {{
          projektDetails.Kosten || '– keine Angabe –'
        }}</p>
    </div>
    </CollapsibleSection>

    <CollapsibleSection title="Datensammlung, -erforschung, -vorbereitung">
    <div class="space-y-2 text-gray-700">
      <p><span class="font-semibold">Datenzugriff:</span>
        {{ projektDetails.Datenzugriff || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datenverfügbarkeit:</span>
        {{ projektDetails.Datenverfuegbarkeit || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datenquellen:</span>
        {{ projektDetails.Datenquellen || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datensicherheit:</span>
        {{ projektDetails.Datensicherhiet || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datengeschwindigkeit:</span>
        {{ projektDetails.Datengeschwindigkeit || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datenqualität:</span>
        {{ projektDetails.Datenqualitaet || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datenvielfalt:</span>
        {{ projektDetails.Datenvielfalt || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datenumfang:</span>
        {{ projektDetails.Datenumfang || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Datenvariabilität:</span>
        {{ projektDetails.Datenvariabilitaet || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Vorbereitungsschritte:</span>
        {{ projektDetails.Datenvorbereitungsschritte || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Tools:</span>
        {{ projektDetails.Datentools || '– keine Angabe –' }}</p>
    </div>
    </CollapsibleSection>

    <CollapsibleSection title="Analyse">
    <div class="space-y-2 text-gray-700">
      <p><span class="font-semibold">Data Science Ziele:</span>
        {{ projektDetails.DataScienceZiele || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Typ:</span> {{
          projektDetails.Analysetyp || '– keine Angabe –'
        }}</p>
      <p><span class="font-semibold">Zeitrahmen:</span>
        {{ projektDetails.Analysezeitrahmen || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Tools:</span>
        {{ projektDetails.Analysetools || '– keine Angabe –' }}</p>
    </div>
    </CollapsibleSection>

    <CollapsibleSection title="Deployment">
    <div class="space-y-2 text-gray-700">
      <p><span class="font-semibold">Zeitrahmen:</span>
        {{ projektDetails.Analysezeitrahmen || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Zielgruppe:</span>
        {{ projektDetails.Zielgruppe || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Tests:</span> {{ projektDetails.Tests || '– keine Angabe –' }}
      </p>
      <p><span class="font-semibold">Projektprobleme:</span>
        {{ projektDetails.Projektprobleme || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Tools:</span>
        {{ projektDetails.DeploymentTools || '– keine Angabe –' }}</p>
    </div>
    </CollapsibleSection>

    <CollapsibleSection title="Verwendung">
    <div class="space-y-2 text-gray-700">
      <p><span class="font-semibold">Überwachung:</span>
        {{ projektDetails.Ueberwachung || '– keine Angabe –' }}</p>
      <p><span class="font-semibold">Wartung:</span> {{
          projektDetails.Wartung || '– keine Angabe –'
        }}</p>
      <p><span class="font-semibold">Tools:</span>
        {{ projektDetails.Verwendungstools || '– keine Angabe –' }}</p>
    </div>
    </CollapsibleSection>


    <button
      class="btn btn-primary"
      type="button"
      @click="projektdetailsaendern">
      Projektdetails ändern
    </button>

  </div>
</template>

<style scoped>

</style>
