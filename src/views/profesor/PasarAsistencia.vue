<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <!-- Cabecera -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="arrow_back" :to="{ name: 'ProfesorDashboard' }" style="color: #0D1B3E;" class="q-mr-sm" />
      <div>
        <div class="text-h6 text-weight-bold" style="color: #0D1B3E;">Pasar Asistencia</div>
        <div class="text-caption q-mt-xs" style="color: #8B7355;">
          {{ instancia?.course_name }} · {{ fechaHoy }}
        </div>
      </div>
    </div>

    <!-- Spinner carga -->
    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <template v-else>
      <!-- Sin alumnos -->
      <div v-if="alumnos.length === 0" class="column items-center q-mt-xl" style="color: #9E9E9E;">
        <q-icon name="people" size="48px" style="opacity: 0.4;" />
        <div class="q-mt-sm text-body1">No hay alumnos inscritos en este curso.</div>
      </div>

      <template v-else>
        <!-- Lista de alumnos -->
        <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
          <q-list separator>
            <q-item v-for="alumno in alumnos" :key="alumno.id" style="padding: 14px 16px;">
              <q-item-section avatar style="min-width: 44px;">
                <q-avatar size="40px" style="background: #1A2F6B; color: white; font-size: 14px; font-weight: 700;">
                  {{ iniciales(alumno.full_name) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium" style="color: #0D1B3E; font-size: 14px;">
                  {{ alumno.full_name }}
                </q-item-label>
                <q-item-label caption style="color: #8B7355;">
                  {{ alumno.absence_count }} falta{{ alumno.absence_count !== 1 ? 's' : '' }} acumulada{{ alumno.absence_count !== 1 ? 's' : '' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs items-center">
                  <q-btn
                    round dense size="sm" icon="check"
                    :style="alumno.estado === 'present'
                      ? 'background: #27AE60; color: white; box-shadow: 0 0 0 2px #1a7a44;'
                      : 'background: #27AE60; color: white; opacity: 0.4;'"
                    @click="marcar(alumno, 'present')"
                  >
                    <q-tooltip class="pdv-tooltip">Presente</q-tooltip>
                  </q-btn>
                  <q-btn
                    round dense size="sm" icon="close"
                    :style="alumno.estado === 'absent'
                      ? 'background: #C0392B; color: white; box-shadow: 0 0 0 2px #8e1a1a;'
                      : 'background: #C0392B; color: white; opacity: 0.4;'"
                    @click="marcar(alumno, 'absent')"
                  >
                    <q-tooltip class="pdv-tooltip">Ausente</q-tooltip>
                  </q-btn>
                  <q-btn
                    round dense size="sm" icon="description"
                    :style="alumno.estado === 'justified'
                      ? 'background: #E67E22; color: white; box-shadow: 0 0 0 2px #a85510;'
                      : 'background: #E67E22; color: white; opacity: 0.4;'"
                    @click="marcar(alumno, 'justified')"
                  >
                    <q-tooltip class="pdv-tooltip">Justificado</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Leyenda -->
        <div class="row q-gutter-md q-mt-md">
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background:#27AE60;"></div>
            <span class="text-caption" style="color: #555;">Presente</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background:#C0392B;"></div>
            <span class="text-caption" style="color: #555;">Ausente</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background: #E67E22;"></div>
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
            :disable="!hayMarcados"
            style="background: #0D1B3E; color: white; border-radius: 8px;"
            class="q-px-lg"
            @click="guardar"
          />
        </div>
      </template>
    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import api from '../../services/api'

const route = useRoute()
const $q = useQuasar()
const instancia = ref(null)
const alumnos = ref([])
const cargando = ref(false)
const guardando = ref(false)

const fechaHoy = computed(() => new Date().toLocaleDateString('es-CL', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
}))

const hayMarcados = computed(() => alumnos.value.some(a => a.estado !== null))

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('')
}

function marcar(alumno, estado) {
  alumno.estado = alumno.estado === estado ? null : estado
}

onMounted(async () => {
  cargando.value = true
  try {
    const [{ data: inst }, { data: estudiantes }] = await Promise.all([
      api.get(`/course-instances/${route.params.id}`),
      api.get(`/enrollments/instance/${route.params.id}`),
    ])
    instancia.value = inst
    alumnos.value = estudiantes.map(e => ({ ...e, estado: null }))
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la información del curso.', position: 'top' })
  } finally {
    cargando.value = false
  }
})

async function guardar() {
  guardando.value = true
  try {
    const { data: sesion } = await api.post('/sessions', {
      offering_id: Number(route.params.id),
      scheduled_at: new Date().toISOString(),
      title: `Clase del ${fechaHoy.value}`,
    })

    await Promise.all(
      alumnos.value
        .filter(a => a.estado !== null)
        .map(a => api.post('/attendance', {
          enrollment_id: a.id,
          session_id: sesion.id,
          status: a.estado,
        }))
    )

    $q.notify({ type: 'positive', message: 'Asistencia guardada correctamente.', position: 'top' })
    alumnos.value.forEach(a => { a.estado = null })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la asistencia.', position: 'top' })
  } finally {
    guardando.value = false
  }
}
</script>