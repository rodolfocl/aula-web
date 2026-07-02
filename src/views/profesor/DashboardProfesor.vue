<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="text-h5 text-weight-bold q-mb-lg" style="color: #0D1B3E;">Mis Clases</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <div v-else-if="instancias.length === 0" class="column items-center q-mt-xl" style="color: #9E9E9E;">
      <q-icon name="school" size="48px" style="opacity: 0.4;" />
      <div class="q-mt-sm text-body1">No tienes cursos asignados actualmente.</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="inst in instancias" :key="inst.id" class="col-12 col-sm-6 col-lg-4">
        <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Cabecera -->
          <div class="q-pa-md" :style="esActivo(inst) ? 'background: #0D1B3E;' : 'background: #616161;'">
            <div class="row items-start justify-between no-wrap q-gutter-xs">
              <div class="text-white text-subtitle1 text-weight-bold" style="flex: 1;">{{ inst.course_name }}</div>
              <q-badge
                v-if="!esActivo(inst)"
                style="background: rgba(255,255,255,0.15); color: white; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; flex-shrink: 0;"
              >
                Finalizado
              </q-badge>
            </div>
            <div class="text-caption q-mt-xs" style="color: #C9A96E;">{{ inst.year }} · Período {{ inst.period }}</div>
          </div>

          <!-- Chip alumnos -->
          <q-card-section class="q-py-sm">
            <q-chip dense icon="people" style="background: rgba(13,27,62,0.08); color: #0D1B3E; font-size: 12px;">
              {{ inst.alumnos?.length ?? 0 }} alumnos
            </q-chip>
          </q-card-section>

          <q-separator style="border-color: rgba(0,0,0,0.06);" />

          <!-- Lista de alumnos -->
          <div v-if="inst.cargandoAlumnos" class="row justify-center q-pa-md">
            <q-spinner-dots color="primary" size="28px" />
          </div>
          <div v-else-if="inst.alumnos?.length" style="padding: 0 8px;">
            <div
              v-for="alumno in inst.alumnos"
              :key="alumno.id"
              style="display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 0.5px solid #EEEEEE;"
            >
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #1A2F6B; color: white; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                {{ iniciales(alumno.full_name) }}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; color: #0D1B3E; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ alumno.full_name }}</div>
                <div style="font-size: 12px; color: #888888;">{{ alumno.absence_count === 0 ? 'Sin ausencias' : `${alumno.absence_count} falta${alumno.absence_count > 1 ? 's' : ''}` }}</div>
              </div>
              <span :style="badgeStyle(alumno.absence_count)">{{ badgeLabel(alumno.absence_count) }}</span>
            </div>
          </div>
          <div v-else class="text-caption q-pa-md" style="color: #9E9E9E;">Sin alumnos inscritos.</div>

          <!-- Acciones solo en instancias activas -->
          <template v-if="esActivo(inst)">
            <q-separator style="border-color: rgba(0,0,0,0.06);" />
            <q-card-actions class="column q-pa-sm q-gutter-xs">
              <q-btn
                unelevated
                icon="how_to_reg"
                label="Pasar asistencia"
                :to="{ name: 'PasarAsistencia', params: { id: inst.id } }"
                style="background: #0D1B3E; color: white; border-radius: 8px;"
                class="q-px-md full-width"
              />
              <q-btn
                flat
                dense
                label="Finalizar curso"
                style="color: #C0392B; font-size: 12px; font-weight: 600;"
                class="full-width"
                @click="abrirFinalizar(inst)"
              />
            </q-card-actions>
          </template>
        </q-card>
      </div>
    </div>

    <!-- Modal finalizar curso -->
    <q-dialog v-model="dialogoFinalizar">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title" style="color: #C0392B;">Finalizar curso</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Estás seguro que deseas finalizar
            <strong>{{ instanciaAFinalizar?.course_name }}</strong> —
            Período {{ instanciaAFinalizar?.period }} {{ instanciaAFinalizar?.year }}?
          </p>
          <q-input
            v-model="motivoFinalizar"
            label="Motivo o comentario de cierre"
            type="textarea"
            autogrow
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated
            label="Finalizar curso"
            :loading="finalizando"
            :disable="motivoFinalizar.trim().length < 10"
            style="background: #C0392B; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
            @click="confirmarFinalizar"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const $q = useQuasar()
const auth = useAuthStore()
const instancias = ref([])
const cargando = ref(false)
const dialogoFinalizar = ref(false)
const instanciaAFinalizar = ref(null)
const motivoFinalizar = ref('')
const finalizando = ref(false)

function esActivo(inst) {
  return inst.status === 'active'
}

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('')
}

function badgeLabel(faltas) {
  if (faltas === 0) return 'Al día'
  if (faltas === 1) return '1 falta'
  return `${faltas} faltas`
}

function badgeStyle(faltas) {
  if (faltas === 0) return 'background: #E8F5E9; color: #1B5E20; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  if (faltas <= 2)  return 'background: #FFF8E1; color: #7A5C00; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  return 'background: #FFEBEE; color: #7F0000; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
}

function abrirFinalizar(inst) {
  instanciaAFinalizar.value = inst
  motivoFinalizar.value = ''
  dialogoFinalizar.value = true
}

async function confirmarFinalizar() {
  finalizando.value = true
  try {
    await api.patch(`/course-instances/${instanciaAFinalizar.value.id}`, {
      status: 'finished',
      close_reason: motivoFinalizar.value.trim(),
    })
    instanciaAFinalizar.value.status = 'finished'
    dialogoFinalizar.value = false
    $q.notify({ type: 'positive', message: 'Curso finalizado correctamente.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo finalizar el curso.', position: 'top' })
  } finally {
    finalizando.value = false
  }
}

async function cargarAlumnos(inst) {
  inst.cargandoAlumnos = true
  try {
    const { data } = await api.get(`/enrollments/instance/${inst.id}`)
    inst.alumnos = data
  } catch {
    inst.alumnos = []
  } finally {
    inst.cargandoAlumnos = false
  }
}

onMounted(async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/course-instances', {
      params: { teacher_id: auth.user.id },
    })
    instancias.value = data.map(i => ({ ...i, alumnos: null, cargandoAlumnos: false }))
    await Promise.all(instancias.value.map(cargarAlumnos))
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los cursos.', position: 'top' })
  } finally {
    cargando.value = false
  }
})
</script>
