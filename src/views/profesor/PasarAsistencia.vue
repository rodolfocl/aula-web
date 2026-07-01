<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" :to="{ name: 'ProfesorDashboard' }" class="q-mr-sm" />
      <div>
        <div class="text-h6 text-weight-bold text-primary">Pasar Asistencia</div>
        <div class="text-caption text-grey-6">{{ curso?.nombre }} · {{ fechaHoy }}</div>
      </div>
    </div>

    <q-card flat bordered>
      <q-list separator>
        <q-item v-for="alumno in alumnos" :key="alumno.id">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ alumno.nombre.charAt(0) }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ alumno.nombre }}</q-item-label>
            <q-item-label caption>Asistencia acumulada: {{ alumno.asistenciaAcumulada }}%</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn
                round
                dense
                :color="alumno.estado === 'presente' ? 'positive' : 'grey-4'"
                :text-color="alumno.estado === 'presente' ? 'white' : 'grey-7'"
                icon="check"
                size="sm"
                @click="marcar(alumno, 'presente')"
              />
              <q-btn
                round
                dense
                :color="alumno.estado === 'ausente' ? 'negative' : 'grey-4'"
                :text-color="alumno.estado === 'ausente' ? 'white' : 'grey-7'"
                icon="close"
                size="sm"
                @click="marcar(alumno, 'ausente')"
              />
              <q-btn
                round
                dense
                :color="alumno.estado === 'justificado' ? 'warning' : 'grey-4'"
                :text-color="alumno.estado === 'justificado' ? 'white' : 'grey-7'"
                icon="description"
                size="sm"
                @click="marcar(alumno, 'justificado')"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <div class="q-mt-md row justify-end">
      <q-btn
        color="primary"
        icon="save"
        label="Guardar asistencia"
        unelevated
        :loading="guardando"
        @click="guardar"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

const route = useRoute()
const $q = useQuasar()
const guardando = ref(false)

const fechaHoy = computed(() => new Date().toLocaleDateString('es-CL', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
}))

const MOCK_CURSOS = {
  1: { id: 1, nombre: 'Teología Bíblica II' },
  2: { id: 2, nombre: 'Hermenéutica Avanzada' },
}

const curso = computed(() => MOCK_CURSOS[route.params.id])

const alumnos = ref([
  { id: 1, nombre: 'María González', asistenciaAcumulada: 68, estado: null },
  { id: 2, nombre: 'Juan Pérez', asistenciaAcumulada: 95, estado: null },
  { id: 3, nombre: 'Laura Díaz', asistenciaAcumulada: 80, estado: null },
])

function marcar(alumno, estado) {
  alumno.estado = alumno.estado === estado ? null : estado
}

async function guardar() {
  guardando.value = true
  await new Promise(r => setTimeout(r, 800))
  guardando.value = false
  $q.notify({ type: 'positive', message: 'Asistencia guardada correctamente.' })
}
</script>