<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <!-- Cabecera -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        :to="{ name: 'ProfesorDashboard' }"
        style="color: #0D1B3E;"
        class="q-mr-sm"
      />
      <div>
        <div class="text-h6 text-weight-bold" style="color: #0D1B3E;">Pasar Asistencia</div>
        <div class="text-caption q-mt-xs" style="color: #8B7355;">
          {{ curso?.nombre }} · {{ fechaHoy }}
        </div>
      </div>
    </div>

    <!-- Lista de alumnos -->
    <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
      <q-list separator>
        <q-item
          v-for="alumno in alumnos"
          :key="alumno.id"
          style="padding: 14px 16px;"
        >
          <q-item-section avatar style="min-width: 44px;">
            <q-avatar
              size="40px"
              style="background: #1A2F6B; color: white; font-size: 14px; font-weight: 700;"
            >
              {{ iniciales(alumno.nombre) }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium" style="color: #0D1B3E; font-size: 14px;">
              {{ alumno.nombre }}
            </q-item-label>
            <q-item-label caption style="color: #8B7355;">
              Asistencia acumulada: {{ alumno.asistenciaAcumulada }}%
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-xs items-center">
              <q-btn
                round
                dense
                size="sm"
                icon="check"
                :style="alumno.estado === 'presente'
                  ? 'background: #2E7D32; color: white;'
                  : 'background: #F0EAE0; color: #8B7355;'"
                @click="marcar(alumno, 'presente')"
              />
              <q-btn
                round
                dense
                size="sm"
                icon="close"
                :style="alumno.estado === 'ausente'
                  ? 'background: #C62828; color: white;'
                  : 'background: #F0EAE0; color: #8B7355;'"
                @click="marcar(alumno, 'ausente')"
              />
              <q-btn
                round
                dense
                size="sm"
                icon="description"
                :style="alumno.estado === 'justificado'
                  ? 'background: #F9A825; color: white;'
                  : 'background: #F0EAE0; color: #8B7355;'"
                @click="marcar(alumno, 'justificado')"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Leyenda de estados -->
    <div class="row q-gutter-sm q-mt-md">
      <div class="row items-center q-gutter-xs">
        <div style="width:10px; height:10px; border-radius:50%; background:#2E7D32;"></div>
        <span class="text-caption" style="color: #555;">Presente</span>
      </div>
      <div class="row items-center q-gutter-xs">
        <div style="width:10px; height:10px; border-radius:50%; background:#C62828;"></div>
        <span class="text-caption" style="color: #555;">Ausente</span>
      </div>
      <div class="row items-center q-gutter-xs">
        <div style="width:10px; height:10px; border-radius:50%; background:#F9A825;"></div>
        <span class="text-caption" style="color: #555;">Justificado</span>
      </div>
    </div>

    <!-- Botón guardar -->
    <div class="q-mt-lg row justify-end">
      <q-btn
        unelevated
        icon="save"
        label="Guardar asistencia"
        :loading="guardando"
        style="background: #0D1B3E; color: white; border-radius: 8px;"
        class="q-px-lg"
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

function iniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('')
}

function marcar(alumno, estado) {
  alumno.estado = alumno.estado === estado ? null : estado
}

async function guardar() {
  guardando.value = true
  await new Promise(r => setTimeout(r, 800))
  guardando.value = false
  $q.notify({
    type: 'positive',
    message: 'Asistencia guardada correctamente.',
    position: 'top',
  })
}
</script>