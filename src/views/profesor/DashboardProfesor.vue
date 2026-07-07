<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div style="color: #0D1B3E; font-size: 20px; font-weight: 700;" class="q-mb-lg">Clases</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="instancias.length === 0" icon="🏫" message="No hay clases asignadas actualmente" />

    <div v-else>
      <!-- Selector Activos / Finalizados -->
      <div class="q-mb-lg">
        <div class="seg-control">
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
      </div>

      <q-tab-panels v-model="tabActual" animated style="background: transparent;">

        <!-- Panel: Activos -->
        <q-tab-panel name="activos" class="q-pa-none">
          <EmptyState v-if="cursosActivos.length === 0" icon="🏫" message="No hay clases activas actualmente" />
          <div v-else class="row q-col-gutter-md">
            <div v-for="inst in cursosActivos" :key="inst.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat class="curso-card">
                <!-- Header -->
                <div class="q-pa-md card-header-active">
                  <div class="row items-start justify-between no-wrap q-gutter-xs">
                    <div class="text-white text-subtitle1 text-weight-bold" style="flex: 1;">{{ inst.course_name }}</div>
                  </div>
                  <div class="text-caption text-weight-bold q-mt-xs" style="color: rgba(255,255,255,0.7);">
                    {{ inst.year }} · Período {{ inst.period }}
                  </div>
                </div>

                <!-- Sub-header: alumno count + inscribir -->
                <div class="row items-center justify-between q-px-md q-py-sm">
                  <div style="display: flex; align-items: center; gap: 7px; color: #0D1B3E; font-size: 14px; font-weight: 600;">
                    <q-icon name="people" size="18px" style="color: #64748B;" />
                    {{ inst.alumnos?.length ?? 0 }} alumnos
                  </div>
                  <q-btn
                    dense unelevated icon="person_add"
                    style="background: #0D1B3E; color: white; padding: 0 12px; height: 30px; border-radius: 8px;"
                    @click="abrirInscribirAlumno(inst)"
                  >
                    <q-tooltip class="pdv-tooltip">Inscribir alumno</q-tooltip>
                  </q-btn>
                </div>

                <q-separator style="border-color: #F1F5F9;" />

                <!-- Lista de alumnos -->
                <div class="alumno-list">
                  <div v-if="inst.cargandoAlumnos" class="row justify-center q-pa-md">
                    <q-spinner-dots color="primary" size="28px" />
                  </div>
                  <div v-else-if="inst.alumnos?.length" style="padding: 0 8px;">
                    <div
                      v-for="alumno in inst.alumnos"
                      :key="alumno.id"
                      class="alumno-row"
                    >
                      <div class="pdv-avatar pdv-avatar-sm">{{ iniciales(alumno.full_name) }}</div>
                      <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 13.5px; color: #0D1B3E; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          {{ alumno.full_name }}
                        </div>
                        <div style="font-size: 11px; color: #94A3B8;">
                          {{ Number(alumno.absence_count) === 0 ? 'Sin ausencias' : `${alumno.absence_count} falta${alumno.absence_count > 1 ? 's' : ''}` }}
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <span :class="['pdv-pill', faltasPill(alumno.absence_count)]">
                          {{ badgeLabel(alumno.absence_count) }}
                        </span>
                        <q-icon
                          v-if="inst.max_absences != null && Number(alumno.absence_count) > Number(inst.max_absences)"
                          name="error" size="16px" style="color: #991B1B;"
                        >
                          <q-tooltip class="pdv-tooltip">Alumno reprobado por asistencia</q-tooltip>
                        </q-icon>
                      </div>
                    </div>
                  </div>
                  <EmptyState v-else icon="👤" message="No hay alumnos inscritos" />
                </div>

                <q-separator style="border-color: #F1F5F9;" />

                <!-- Acciones -->
                <q-card-actions class="column q-pa-sm q-gutter-xs">
                  <div class="row q-gutter-xs full-width" style="margin-left: 0;">
                    <q-btn
                      unelevated icon="how_to_reg" label="Asistencia"
                      :to="{ name: 'PasarAsistencia', params: { id: inst.id } }"
                      style="background: #0D1B3E; color: white; border-radius: 8px; flex: 1;"
                      class="q-px-xs"
                    />
                    <q-btn
                      unelevated icon="edit" label="Notas"
                      :to="{ name: 'RegistrarNotas', params: { id: inst.id } }"
                      style="background: #0D1B3E; color: white; border-radius: 8px; flex: 1;"
                      class="q-px-xs"
                    />
                  </div>
                  <q-btn
                    flat dense label="Finalizar curso"
                    style="color: #991B1B; font-size: 12px; font-weight: 600;"
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
          <EmptyState v-if="cursosFinalizados.length === 0" icon="✅" message="No hay clases finalizadas" />
          <div v-else class="row q-col-gutter-md">
            <div v-for="inst in cursosFinalizados" :key="inst.id" class="col-12 col-sm-6 col-lg-4">
              <q-card flat class="curso-card">
                <div class="q-pa-md" style="background: #64748B;">
                  <div class="row items-start justify-between no-wrap q-gutter-xs">
                    <div class="text-white text-subtitle1 text-weight-bold" style="flex: 1;">{{ inst.course_name }}</div>
                    <span class="pdv-pill" style="background: rgba(255,255,255,0.15); color: white; font-size: 10px; flex-shrink: 0;">
                      Finalizado
                    </span>
                  </div>
                  <div class="text-caption text-weight-bold q-mt-xs" style="color: rgba(255,255,255,0.7);">
                    {{ inst.year }} · Período {{ inst.period }}
                  </div>
                </div>
                <div class="q-px-md q-py-sm" style="display: flex; align-items: center; gap: 7px; color: #0D1B3E; font-size: 14px; font-weight: 600;">
                  <q-icon name="people" size="18px" style="color: #64748B;" />
                  {{ inst.alumnos?.length ?? 0 }} alumnos
                </div>
                <q-separator style="border-color: #F1F5F9;" />
                <div class="alumno-list">
                  <div v-if="inst.cargandoAlumnos" class="row justify-center q-pa-md">
                    <q-spinner-dots color="primary" size="28px" />
                  </div>
                  <div v-else-if="inst.alumnos?.length" style="padding: 0 8px;">
                    <div
                      v-for="alumno in inst.alumnos"
                      :key="alumno.id"
                      class="alumno-row"
                    >
                      <div class="pdv-avatar pdv-avatar-sm">{{ iniciales(alumno.full_name) }}</div>
                      <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 13.5px; color: #0D1B3E; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          {{ alumno.full_name }}
                        </div>
                        <div style="font-size: 11px; color: #94A3B8;">
                          {{ Number(alumno.absence_count) === 0 ? 'Sin ausencias' : `${alumno.absence_count} falta${alumno.absence_count > 1 ? 's' : ''}` }}
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <span :class="['pdv-pill', faltasPill(alumno.absence_count)]">
                          {{ badgeLabel(alumno.absence_count) }}
                        </span>
                        <q-icon
                          v-if="inst.max_absences != null && Number(alumno.absence_count) > Number(inst.max_absences)"
                          name="error" size="16px" style="color: #991B1B;"
                        >
                          <q-tooltip class="pdv-tooltip">Alumno reprobado por asistencia</q-tooltip>
                        </q-icon>
                      </div>
                    </div>
                  </div>
                  <EmptyState v-else icon="👤" message="No hay alumnos inscritos" />
                </div>
              </q-card>
            </div>
          </div>
        </q-tab-panel>

      </q-tab-panels>
    </div>

    <!-- Modal finalizar curso -->
    <q-dialog v-model="dialogoFinalizar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title" style="color: #991B1B;">Finalizar curso</div>
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
            unelevated label="Finalizar curso" :loading="finalizando"
            :disable="motivoFinalizar.trim().length < 10"
            style="background: #991B1B; color: white; border-radius: 8px; padding: 0 24px; font-weight: 600;"
            @click="confirmarFinalizar"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Modal inscribir alumno -->
    <q-dialog v-model="dialogoInscribir" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 440px; max-width: 500px;'">
        <div class="pdv-dialog-title">Inscribir alumno</div>
        <div class="pdv-dialog-body">
          <div style="font-size: 13px; color: #64748B; margin-top: -8px;">
            {{ instanciaInscribir?.course_name }} · {{ instanciaInscribir?.year }} — Período {{ instanciaInscribir?.period }}
          </div>
          <q-input
            v-model="busquedaAlumno"
            placeholder="Buscar por nombre..."
            dense outlined clearable
          >
            <template #prepend><q-icon name="search" color="grey-5" /></template>
          </q-input>
          <div v-if="buscandoAlumnos" class="row justify-center q-py-lg">
            <q-spinner-dots color="primary" size="32px" />
          </div>
          <div v-else-if="alumnosFiltrados.length === 0" style="text-align: center; color: #94A3B8; padding: 20px 0; font-size: 14px;">
            No hay alumnos disponibles para inscribir
          </div>
          <div v-else style="max-height: 320px; overflow-y: auto;">
            <div
              v-for="alumno in alumnosFiltrados"
              :key="alumno.id"
              style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9;"
            >
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="pdv-avatar pdv-avatar-sm">{{ iniciales(alumno.full_name) }}</div>
                <div style="font-size: 14px; color: #0D1B3E; font-weight: 500;">{{ alumno.full_name }}</div>
              </div>
              <button
                class="pdv-action-btn pdv-action-success"
                @click="inscribirAlumno(alumno)"
              >
                <q-icon name="person_add" size="16px" />
                <q-tooltip class="pdv-tooltip">Inscribir</q-tooltip>
              </button>
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
import EmptyState from '../../components/EmptyState.vue'

const $q = useQuasar()
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
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function badgeLabel(faltas) {
  const n = Number(faltas) || 0
  if (n === 0) return '0 faltas'
  if (n === 1) return '1 falta'
  return `${n} faltas`
}

function faltasPill(faltas) {
  const n = Number(faltas) || 0
  if (n === 0) return 'pdv-pill-success'
  if (n <= 2)  return 'pdv-pill-warning'
  return 'pdv-pill-error'
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
      course_id: instanciaInscribir.value.id,
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
    await api.patch(`/courses/${instanciaAFinalizar.value.id}`, {
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

function generateBatchId() {
  return Math.random().toString(36).slice(2, 9)
}

async function cargarAlumnos(inst, batchId = null) {
  inst.cargandoAlumnos = true
  try {
    const config = batchId ? { headers: { 'X-Batch-Id': batchId } } : {}
    const { data } = await api.get(`/enrollments/instance/${inst.id}`, config)
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
    const batchId = generateBatchId()
    const { data } = await api.get('/courses', {
      headers: { 'X-Batch-Id': batchId },
    })
    instancias.value = data.map(i => ({ ...i, alumnos: null, cargandoAlumnos: false }))
    await Promise.all(instancias.value.map(inst => cargarAlumnos(inst, batchId)))
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
  border-radius: 14px !important;
  box-shadow: var(--pdv-shadow-card) !important;
  border: none !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 460px;
  transition: box-shadow 0.2s;
}

.curso-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06) !important;
}

.card-header-active {
  background: #0D1B3E;
}

.alumno-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.alumno-list::-webkit-scrollbar { width: 4px; }
.alumno-list::-webkit-scrollbar-track { background: transparent; }
.alumno-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }

.alumno-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 4px;
  border-bottom: 1px solid #F8FAFC;
}

.alumno-row:last-child { border-bottom: none; }

/* ── Selector Activos / Finalizados ── */
.seg-control {
  display: inline-flex;
  align-items: center;
  background: rgba(13,27,62,0.07);
  border-radius: 22px;
  padding: 3px;
  gap: 2px;
}

.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  border-radius: 19px;
  padding: 0 18px;
  height: 34px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(13,27,62,0.45);
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
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 1px 6px;
  line-height: 1.5;
  transition: background 0.2s ease;
}

.seg-btn--active .seg-count {
  background: rgba(255,255,255,0.2);
}
</style>
