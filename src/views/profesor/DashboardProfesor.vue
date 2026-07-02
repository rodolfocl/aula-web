<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="text-h5 text-weight-bold q-mb-lg" style="color: #0D1B3E;">Mis Clases</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="instancias.length === 0" icon="🏫" message="No tienes clases asignadas actualmente" />

    <div v-else>
      <div class="seg-control q-mb-md">
        <button
          :class="['seg-btn', tabActual === 'activos' && 'seg-btn--active']"
          @click="tabActual = 'activos'"
        >
          Activos <span class="seg-count">{{ cursosActivos.length }}</span>
        </button>
        <button
          :class="['seg-btn', tabActual === 'finalizados' && 'seg-btn--active']"
          @click="tabActual = 'finalizados'"
        >
          Finalizados <span class="seg-count">{{ cursosFinalizados.length }}</span>
        </button>
      </div>

      <q-tab-panels v-model="tabActual" animated style="background: transparent;">
        <!-- Panel: Activos -->
        <q-tab-panel name="activos" class="q-pa-none">
          <EmptyState v-if="cursosActivos.length === 0" icon="🏫" message="No tienes clases activas actualmente" />
          <div v-else class="row q-col-gutter-md">
            <div v-for="inst in cursosActivos" :key="inst.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat class="curso-card">
                <div class="q-pa-md" style="background: #0D1B3E;">
                  <div class="row items-start justify-between no-wrap q-gutter-xs">
                    <div class="text-white text-subtitle1 text-weight-bold" style="flex: 1;">{{ inst.course_name }}</div>
                  </div>
                  <div class="text-caption q-mt-xs" style="color: #C9A96E;">{{ inst.year }} · Período {{ inst.period }}</div>
                </div>
                <div class="row items-center justify-between q-px-md q-py-sm">
                  <div style="display: flex; align-items: center; gap: 7px; color: #0D1B3E; font-size: 15px; font-weight: 600;">
                    <q-icon name="people" size="20px" style="color: #0D1B3E;" />
                    {{ inst.alumnos?.length ?? 0 }} alumnos inscritos
                  </div>
                  <q-btn
                    dense
                    unelevated
                    icon="person_add"
                    style="background: #0D1B3E; color: white; padding: 0 14px; height: 32px; border-radius: 6px;"
                    @click="abrirInscribirAlumno(inst)"
                  >
                    <q-tooltip class="pdv-tooltip">Inscribir alumno</q-tooltip>
                  </q-btn>
                </div>
                <q-separator style="border-color: rgba(0,0,0,0.06);" />
                <div class="alumno-list">
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
                        <div style="font-size: 12px; color: #888888;">{{ Number(alumno.absence_count) === 0 ? 'Sin ausencias' : `${alumno.absence_count} falta${alumno.absence_count > 1 ? 's' : ''}` }}</div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <span :style="badgeStyle(alumno.absence_count)">{{ badgeLabel(alumno.absence_count) }}</span>
                        <q-icon
                          v-if="inst.max_absences != null && Number(alumno.absence_count) > Number(inst.max_absences)"
                          name="error"
                          size="18px"
                          style="color: #C0392B;"
                        >
                          <q-tooltip class="pdv-tooltip">Alumno reprobado por asistencia</q-tooltip>
                        </q-icon>
                      </div>
                    </div>
                  </div>
                  <EmptyState v-else icon="👤" message="No hay alumnos inscritos en este curso" />
                </div>
                <q-separator style="border-color: rgba(0,0,0,0.06);" />
                <q-card-actions class="column q-pa-sm q-gutter-xs">
                  <div class="row q-gutter-xs full-width" style="margin-left: 0;">
                    <q-btn
                      unelevated
                      icon="how_to_reg"
                      label="Asistencia"
                      :to="{ name: 'PasarAsistencia', params: { id: inst.id } }"
                      style="background: #0D1B3E; color: white; border-radius: 8px; flex: 1;"
                      class="q-px-xs"
                    />
                    <q-btn
                      unelevated
                      icon="edit"
                      label="Notas"
                      :to="{ name: 'RegistrarNotas', params: { id: inst.id } }"
                      style="background: #0D1B3E; color: white; border-radius: 8px; flex: 1;"
                      class="q-px-xs"
                    />
                  </div>
                  <q-btn
                    flat
                    dense
                    label="Finalizar curso"
                    style="color: #C0392B; font-size: 12px; font-weight: 600;"
                    class="full-width"
                    @click="abrirFinalizar(inst)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </q-tab-panel>

        <!-- Panel: Finalizados -->
        <q-tab-panel name="finalizados" class="q-pa-none">
          <EmptyState v-if="cursosFinalizados.length === 0" icon="✅" message="No tienes clases finalizadas" />
          <div v-else class="row q-col-gutter-md">
            <div v-for="inst in cursosFinalizados" :key="inst.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat class="curso-card">
                <div class="q-pa-md" style="background: #616161;">
                  <div class="row items-start justify-between no-wrap q-gutter-xs">
                    <div class="text-white text-subtitle1 text-weight-bold" style="flex: 1;">{{ inst.course_name }}</div>
                    <q-badge style="background: rgba(255,255,255,0.15); color: white; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; flex-shrink: 0;">
                      Finalizado
                    </q-badge>
                  </div>
                  <div class="text-caption q-mt-xs" style="color: #C9A96E;">{{ inst.year }} · Período {{ inst.period }}</div>
                </div>
                <div class="q-px-md q-py-sm" style="display: flex; align-items: center; gap: 7px; color: #0D1B3E; font-size: 15px; font-weight: 600;">
                  <q-icon name="people" size="20px" style="color: #0D1B3E;" />
                  {{ inst.alumnos?.length ?? 0 }} alumnos inscritos
                </div>
                <q-separator style="border-color: rgba(0,0,0,0.06);" />
                <div class="alumno-list">
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
                        <div style="font-size: 12px; color: #888888;">{{ Number(alumno.absence_count) === 0 ? 'Sin ausencias' : `${alumno.absence_count} falta${alumno.absence_count > 1 ? 's' : ''}` }}</div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <span :style="badgeStyle(alumno.absence_count)">{{ badgeLabel(alumno.absence_count) }}</span>
                        <q-icon
                          v-if="inst.max_absences != null && Number(alumno.absence_count) > Number(inst.max_absences)"
                          name="error"
                          size="18px"
                          style="color: #C0392B;"
                        >
                          <q-tooltip class="pdv-tooltip">Alumno reprobado por asistencia</q-tooltip>
                        </q-icon>
                      </div>
                    </div>
                  </div>
                  <EmptyState v-else icon="👤" message="No hay alumnos inscritos en este curso" />
                </div>
              </q-card>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
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

    <!-- Modal inscribir alumno -->
    <q-dialog v-model="dialogoInscribir">
      <q-card class="pdv-dialog" style="min-width: 440px; max-width: 500px;">
        <div class="pdv-dialog-title">Inscribir alumno</div>
        <div class="pdv-dialog-body">
          <div style="font-size: 13px; color: #666; margin-top: -8px;">
            {{ instanciaInscribir?.course_name }} · {{ instanciaInscribir?.year }} — Período {{ instanciaInscribir?.period }}
          </div>
          <q-input
            v-model="busquedaAlumno"
            placeholder="Buscar por nombre..."
            dense
            outlined
            clearable
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
          <div v-if="buscandoAlumnos" class="row justify-center q-py-lg">
            <q-spinner-dots color="primary" size="32px" />
          </div>
          <div v-else-if="alumnosFiltrados.length === 0" style="text-align: center; color: #999; padding: 20px 0; font-size: 14px;">
            No hay alumnos disponibles para inscribir
          </div>
          <div v-else style="max-height: 320px; overflow-y: auto;">
            <div
              v-for="alumno in alumnosFiltrados"
              :key="alumno.id"
              style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 0.5px solid #EEEEEE;"
            >
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #1A2F6B; color: white; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  {{ iniciales(alumno.full_name) }}
                </div>
                <div style="font-size: 14px; color: #0D1B3E; font-weight: 500;">{{ alumno.full_name }}</div>
              </div>
              <q-icon
                name="person_add"
                size="22px"
                style="color: #0D1B3E; cursor: pointer; flex-shrink: 0;"
                @click="inscribirAlumno(alumno)"
              >
                <q-tooltip class="pdv-tooltip">Inscribir</q-tooltip>
              </q-icon>
            </div>
          </div>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cerrar" v-close-popup class="pdv-btn-cancel" />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import EmptyState from '../../components/EmptyState.vue'

const $q = useQuasar()
const auth = useAuthStore()
const instancias = ref([])
const cargando = ref(false)
const dialogoFinalizar = ref(false)
const instanciaAFinalizar = ref(null)
const motivoFinalizar = ref('')
const finalizando = ref(false)
const tabActual = ref('activos')
const dialogoInscribir = ref(false)
const instanciaInscribir = ref(null)
const busquedaAlumno = ref('')
const alumnosDisponibles = ref([])
const buscandoAlumnos = ref(false)
const inscribiendo = ref(null)

function esActivo(inst) {
  return inst.status === 'active'
}

function ordenPeriodo(period) {
  if (/segundo/i.test(period)) return 2
  if (/primer/i.test(period)) return 1
  return 0
}

function valorOrdenable(inst) {
  return inst.year * 10 + ordenPeriodo(inst.period)
}

const cursosActivos = computed(() =>
  instancias.value
    .filter(i => i.status === 'active')
    .sort((a, b) => valorOrdenable(b) - valorOrdenable(a))
)

const cursosFinalizados = computed(() =>
  instancias.value
    .filter(i => i.status !== 'active')
    .sort((a, b) => valorOrdenable(b) - valorOrdenable(a))
)

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('')
}

function badgeLabel(faltas) {
  const n = Number(faltas) || 0
  if (n === 0) return '0 faltas'
  if (n === 1) return '1 falta'
  return `${n} faltas`
}

function badgeStyle(faltas) {
  const n = Number(faltas) || 0
  const base = 'padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  if (n === 0) return `background: #E8F5E9; color: #27AE60; ${base}`
  if (n <= 2)  return `background: #FFF8E1; color: #E67E22; ${base}`
  return `background: #FFEBEE; color: #C0392B; ${base}`
}

const alumnosFiltrados = computed(() => {
  const q = (busquedaAlumno.value ?? '').trim().toLowerCase()
  if (!q) return alumnosDisponibles.value
  return alumnosDisponibles.value.filter(a => a.full_name?.toLowerCase().includes(q))
})

async function abrirInscribirAlumno(inst) {
  instanciaInscribir.value = inst
  busquedaAlumno.value = ''
  alumnosDisponibles.value = []
  dialogoInscribir.value = true
  buscandoAlumnos.value = true
  try {
    const { data } = await api.get('/users')
    const yaInscritos = new Set((inst.alumnos ?? []).map(a => a.id))
    alumnosDisponibles.value = data
      .filter(u => u.roles?.includes('alumno') && !yaInscritos.has(u.id))
      .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'es'))
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los alumnos.', position: 'top' })
  } finally {
    buscandoAlumnos.value = false
  }
}

async function inscribirAlumno(alumno) {
  inscribiendo.value = alumno.id
  try {
    await api.post('/enrollments', {
      student_id: alumno.id,
      instance_id: instanciaInscribir.value.id,
    })
    alumnosDisponibles.value = alumnosDisponibles.value.filter(a => a.id !== alumno.id)
    await cargarAlumnos(instanciaInscribir.value)
    $q.notify({ type: 'positive', message: `${alumno.full_name} inscrito correctamente.`, position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo inscribir al alumno.', position: 'top' })
  } finally {
    inscribiendo.value = null
  }
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
    inst.alumnos = data.slice().sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'es'))
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

<style scoped>
.curso-card {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 460px;
}

.alumno-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.alumno-list::-webkit-scrollbar {
  width: 4px;
}

.alumno-list::-webkit-scrollbar-track {
  background: transparent;
}

.alumno-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.seg-control {
  display: inline-flex;
  align-items: center;
  background: rgba(13, 27, 62, 0.07);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}

.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  border-radius: 17px;
  padding: 0 16px;
  height: 32px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(13, 27, 62, 0.45);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.seg-btn--active {
  background: #0D1B3E;
  color: white;
}

.seg-count {
  font-size: 11px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 1px 6px;
  line-height: 1.5;
  transition: background 0.2s ease;
}

.seg-btn--active .seg-count {
  background: rgba(255, 255, 255, 0.2);
}
</style>