<template>
  <q-page class="q-pa-md" style="background: #F7F8FA; min-height: 100vh;">
    <div style="color: #13224A; font-size: 20px; font-weight: 700;" class="q-mb-lg">Clases</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="instancias.length === 0" icon="🏫" message="No hay clases asignadas actualmente" />

    <div v-else>
      <!-- Tabs + buscador -->
      <div class="row items-center justify-between q-mb-md" style="flex-wrap: wrap; gap: 10px;">
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
        <q-input
          v-model="busqueda"
          placeholder="Buscar plantilla o curso…"
          dense outlined clearable
          style="min-width: 200px; max-width: 300px; background: white; border-radius: 8px;"
        >
          <template #prepend><q-icon name="search" color="grey-5" /></template>
        </q-input>
      </div>

      <!-- Empty per tab -->
      <EmptyState
        v-if="plantillasFiltradas.length === 0"
        icon="🏫"
        :message="tabActual === 'activos' ? 'No hay clases activas' : 'No hay clases finalizadas'"
      />

      <!-- Layout dos paneles -->
      <div v-else class="dos-paneles">

        <!-- PANEL IZQUIERDO: lista de plantillas -->
        <div class="panel-izq">
          <div
            v-for="grupo in plantillasFiltradas"
            :key="grupo.template_id"
            :class="['plantilla-item', plantillaSeleccionada === grupo.template_id && 'plantilla-item--activa']"
            @click="seleccionarPlantilla(grupo.template_id)"
          >
            <span class="plantilla-nombre">{{ grupo.nombre }}</span>
            <span class="plantilla-badge">{{ grupo.instancias.length }}</span>
          </div>
        </div>

        <!-- PANEL DERECHO: cards del grupo seleccionado -->
        <div v-if="grupoActual" class="panel-der">
          <!-- Encabezado -->
          <div class="panel-der-header">
            <div class="panel-der-icon">
              <i class="ti ti-book-2" style="font-size: 20px; color: white;" />
            </div>
            <div>
              <div style="font-size: 17px; font-weight: 700; color: #13224A;">{{ grupoActual.nombre }}</div>
              <div style="font-size: 13px; color: #9AA0AB;">
                {{ grupoActual.instancias.length }}
                {{ grupoActual.instancias.length === 1 ? 'curso' : 'cursos' }}
                ·
                {{ totalAlumnosGrupo }}
                {{ totalAlumnosGrupo === 1 ? 'alumno' : 'alumnos' }} en total
              </div>
            </div>
          </div>

          <!-- Cards de cursos -->
          <div class="cursos-lista">
            <div
              v-for="inst in grupoActual.instancias"
              :key="inst.id"
              class="curso-card"
            >
              <!-- Franja de estado izquierda -->
              <div :class="['curso-stripe', esActivo(inst) ? 'stripe-activo' : 'stripe-finalizado']" />

              <!-- Bloque: nombre + período + lápiz (activos) -->
              <div class="curso-bloque curso-bloque-nombre">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div class="curso-nombre">{{ inst.course_name }} {{ inst.year }}</div>
                  <div v-if="esActivo(inst)" style="position: relative; display: inline-flex; flex-shrink: 0;" @click.stop>
                    <button class="pdv-action-btn" style="width: 26px; height: 26px;" @click.stop="abrirEditar(inst)">
                      <q-icon name="edit" size="13px" />
                    </button>
                    <div style="position: absolute; inset: 0; pointer-events: none;">
                      <q-tooltip class="pdv-tooltip">Editar curso</q-tooltip>
                    </div>
                  </div>
                </div>
                <div class="curso-meta">{{ inst.year }} · {{ inst.period ?? '—' }}</div>
              </div>

              <!-- Bloque: profesor -->
              <div class="curso-bloque">
                <div class="curso-bloque-label">Profesor</div>
                <div class="curso-bloque-valor">{{ inst.teacher_name ?? '—' }}</div>
              </div>

              <!-- Bloque: día y hora -->
              <div class="curso-bloque">
                <div class="curso-bloque-label">Día y hora</div>
                <div class="curso-bloque-valor">
                  {{ [inst.day_of_week, inst.schedule_time?.slice(0,5)].filter(Boolean).join(' · ') || '—' }}
                </div>
              </div>

              <!-- Bloque: alumnos (clickeable → drawer) -->
              <div
                class="curso-bloque curso-bloque-alumnos curso-bloque-ver"
                @click.stop="abrirDrawer(inst)"
              >
                <div class="curso-bloque-label">Alumnos</div>
                <div class="curso-bloque-valor" style="display: flex; align-items: center; gap: 5px;">
                  <q-spinner-dots v-if="inst.cargandoAlumnos" size="14px" color="grey-5" />
                  <span v-else>{{ alumnosActivos(inst).length }}</span>
                  <q-icon name="visibility" size="15px" style="color: #9AA0AB;" />
                </div>
              </div>

              <!-- Acciones -->
              <div class="curso-acciones" @click.stop>
                <template v-if="esActivo(inst)">
                  <q-btn
                    unelevated dense no-caps
                    label="Asistencia"
                    class="curso-btn curso-btn-accion"
                    :to="{ name: 'PasarAsistencia', params: { id: inst.id } }"
                  />
                  <q-btn
                    unelevated dense no-caps
                    label="Notas"
                    class="curso-btn curso-btn-accion"
                    :to="{ name: 'RegistrarNotas', params: { id: inst.id } }"
                  />
                  <q-btn
                    unelevated dense no-caps
                    label="Finalizar"
                    class="curso-btn curso-btn-peligro"
                    @click="abrirFinalizar(inst)"
                  />
                </template>
                <template v-else>
                  <q-btn
                    unelevated dense no-caps
                    label="Ver asistencia"
                    class="curso-btn curso-btn-neutro"
                    :to="{ name: 'PasarAsistencia', params: { id: inst.id } }"
                  />
                  <q-btn
                    unelevated dense no-caps
                    label="Ver notas"
                    class="curso-btn curso-btn-neutro"
                    :to="{ name: 'RegistrarNotas', params: { id: inst.id } }"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal finalizar curso -->
    <q-dialog v-model="dialogoFinalizar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title" style="color: #991B1B;">Finalizar curso</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Estás seguro que deseas finalizar
            <strong>{{ instanciaAFinalizar?.course_name }} {{ instanciaAFinalizar?.year }}</strong> —
            Período {{ instanciaAFinalizar?.period }}?
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

    <!-- Modal editar curso -->
    <q-dialog v-model="dialogoEditar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 420px; max-width: 480px;'">
        <div class="pdv-dialog-title">Editar curso</div>
        <div class="pdv-dialog-body">
          <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">
            {{ instanciaEditando?.course_name }} {{ instanciaEditando?.year }}
          </div>
          <q-select
            v-model="formEditar.teacher_id"
            :options="opcionesProfesores"
            :loading="cargandoProfesores"
            label="Profesor"
            emit-value map-options dense outlined clearable
          />
          <q-select
            v-model="formEditar.day_of_week"
            :options="DIAS"
            label="Día"
            clearable dense outlined
          />
          <q-input
            v-model="formEditar.schedule_time"
            label="Hora"
            type="time"
            dense outlined
          />
          <q-select
            v-model="formEditar.period"
            :options="PERIODOS"
            label="Período"
            clearable dense outlined
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Guardar" :loading="guardandoEditar"
            class="pdv-btn-save"
            @click="guardarEdicion"
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
            {{ instanciaInscribir?.course_name }} {{ instanciaInscribir?.year }} — Período {{ instanciaInscribir?.period }}
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

    <!-- Drawer de alumnos del curso -->
    <ClasesDrawer
      v-model="drawerAbierto"
      :instancia="instanciaDrawer"
      @agregar-alumno="abrirInscribirAlumno"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import EmptyState from '../../components/EmptyState.vue'
import ClasesDrawer from '../../components/ClasesDrawer.vue'

const $q = useQuasar()

const instancias = ref([])
const cargando   = ref(false)
const tabActual  = ref('activos')
const busqueda   = ref('')
const plantillaSeleccionada = ref(null)

const dialogoFinalizar   = ref(false)
const instanciaAFinalizar = ref(null)
const motivoFinalizar    = ref('')
const finalizando        = ref(false)

const DIAS    = ['Lunes', 'Martes', 'Miércoles']
const PERIODOS = ['Primer período', 'Segundo período']

const dialogoEditar      = ref(false)
const instanciaEditando  = ref(null)
const formEditar         = ref({ teacher_id: null, day_of_week: '', schedule_time: '', period: '' })
const guardandoEditar    = ref(false)
const profesores         = ref([])
const cargandoProfesores = ref(false)

const dialogoInscribir   = ref(false)
const instanciaInscribir = ref(null)
const busquedaAlumno     = ref('')
const alumnosDisponibles = ref([])
const buscandoAlumnos    = ref(false)
const inscribiendo       = ref(null)

const drawerAbierto   = ref(false)
const instanciaDrawer = ref(null)

// ── Helpers ──────────────────────────────────────────────────────────

function esActivo(inst) {
  return inst.status === 'active'
}

function ordenPeriodo(period) {
  if (/segundo/i.test(period)) return 2
  if (/primer/i.test(period))  return 1
  return 0
}

function valorOrdenable(inst) {
  return inst.year * 10 + ordenPeriodo(inst.period)
}

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Computed ─────────────────────────────────────────────────────────

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

const plantillasFiltradas = computed(() => {
  const base = tabActual.value === 'activos' ? cursosActivos.value : cursosFinalizados.value
  const q = busqueda.value.trim().toLowerCase()
  const filtrado = q
    ? base.filter(i => i.course_name?.toLowerCase().includes(q))
    : base

  const mapa = {}
  for (const inst of filtrado) {
    const key = inst.template_id ?? inst.course_name
    if (!mapa[key]) {
      mapa[key] = { template_id: key, nombre: inst.course_name, instancias: [] }
    }
    mapa[key].instancias.push(inst)
  }
  for (const g of Object.values(mapa)) {
    g.instancias.sort((a, b) => valorOrdenable(b) - valorOrdenable(a))
  }
  return Object.values(mapa).sort((a, b) =>
    (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es')
  )
})

watch(plantillasFiltradas, (grupos) => {
  const estaEnGrupos = grupos.some(g => g.template_id === plantillaSeleccionada.value)
  if (!estaEnGrupos) {
    plantillaSeleccionada.value = grupos[0]?.template_id ?? null
    drawerAbierto.value = false
  }
}, { immediate: true })

const grupoActual = computed(() =>
  plantillasFiltradas.value.find(g => g.template_id === plantillaSeleccionada.value) ?? null
)

function alumnosActivos(inst) {
  return (inst.alumnos ?? []).filter(a => a.status !== 'withdrawn')
}

const totalAlumnosGrupo = computed(() =>
  grupoActual.value?.instancias.reduce((sum, inst) => sum + alumnosActivos(inst).length, 0) ?? 0
)

const opcionesProfesores = computed(() =>
  profesores.value.map(p => ({ label: p.full_name, value: p.id }))
)

const alumnosFiltrados = computed(() => {
  const q = (busquedaAlumno.value ?? '').trim().toLowerCase()
  if (!q) return alumnosDisponibles.value
  return alumnosDisponibles.value.filter(a => a.full_name?.toLowerCase().includes(q))
})

// ── Acciones: editar curso ────────────────────────────────────────────

async function abrirEditar(inst) {
  instanciaEditando.value = inst
  formEditar.value = {
    teacher_id:    inst.teacher_id ?? null,
    day_of_week:   inst.day_of_week ?? '',
    schedule_time: inst.schedule_time?.slice(0, 5) ?? '',
    period:        inst.period ?? '',
  }
  dialogoEditar.value = true
  if (profesores.value.length === 0) {
    cargandoProfesores.value = true
    try {
      const { data } = await api.get('/users')
      profesores.value = data.filter(u => u.roles?.includes('profesor'))
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudieron cargar los profesores.', position: 'top' })
    } finally {
      cargandoProfesores.value = false
    }
  }
}

async function guardarEdicion() {
  guardandoEditar.value = true
  try {
    const payload = {
      teacher_id:    formEditar.value.teacher_id,
      day_of_week:   formEditar.value.day_of_week || null,
      schedule_time: formEditar.value.schedule_time || null,
      period:        formEditar.value.period || null,
    }
    await api.patch(`/courses/${instanciaEditando.value.id}`, payload)
    const inst = instanciaEditando.value
    inst.teacher_id    = payload.teacher_id
    inst.teacher_name  = profesores.value.find(p => p.id === payload.teacher_id)?.full_name ?? inst.teacher_name
    inst.day_of_week   = payload.day_of_week
    inst.schedule_time = payload.schedule_time ? payload.schedule_time + ':00' : null
    inst.period        = payload.period
    dialogoEditar.value = false
    $q.notify({ type: 'positive', message: 'Curso actualizado correctamente.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo actualizar el curso.', position: 'top' })
  } finally {
    guardandoEditar.value = false
  }
}

// ── Acciones: plantilla ───────────────────────────────────────────────

function seleccionarPlantilla(id) {
  if (plantillaSeleccionada.value !== id) {
    drawerAbierto.value = false
    instanciaDrawer.value = null
  }
  plantillaSeleccionada.value = id
}

// ── Acciones: drawer ──────────────────────────────────────────────────

function abrirDrawer(inst) {
  instanciaDrawer.value = inst
  drawerAbierto.value = true
}

// ── Acciones: inscribir alumno ────────────────────────────────────────

async function abrirInscribirAlumno(inst) {
  instanciaInscribir.value = inst
  busquedaAlumno.value = ''
  alumnosDisponibles.value = []
  dialogoInscribir.value = true
  buscandoAlumnos.value = true
  try {
    const { data } = await api.get('/users')
    const yaInscritos = new Set(
      (inst.alumnos ?? [])
        .filter(a => a.status !== 'withdrawn')
        .map(a => a.student_id ?? a.id)
    )
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

// ── Acciones: finalizar ───────────────────────────────────────────────

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

// ── Carga de datos ────────────────────────────────────────────────────

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
/* ── Selector Activos / Finalizados ── */
.seg-control {
  display: inline-flex;
  align-items: center;
  background: rgba(19,34,74,0.07);
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
  color: rgba(19,34,74,0.45);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.seg-btn--active {
  background: #13224A;
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

/* ── Layout dos paneles ── */
.dos-paneles {
  display: flex;
  background: white;
  border-radius: 14px;
  border: 1px solid #E7E9EE;
  overflow: hidden;
  min-height: 420px;
}

/* ── Panel izquierdo ── */
.panel-izq {
  width: 290px;
  flex-shrink: 0;
  border-right: 1px solid #E7E9EE;
  overflow-y: auto;
}

.plantilla-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid #F0F2F5;
  border-left: 3px solid transparent;
  transition: background 0.15s;
  gap: 8px;
}

.plantilla-item:last-child { border-bottom: none; }
.plantilla-item:hover { background: #F4F7FC; }

.plantilla-item--activa {
  background: #F4F7FC;
  border-left-color: #13224A;
}

.plantilla-nombre {
  font-size: 14px;
  font-weight: 500;
  color: #13224A;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plantilla-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: #E7E9EE;
  color: #13224A;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Panel derecho ── */
.panel-der {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.panel-der-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #E7E9EE;
}

.panel-der-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #13224A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Lista de cards de cursos ── */
.cursos-lista {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.curso-card {
  display: flex;
  align-items: center;
  gap: 0;
  background: white;
  border: 1px solid #E7E9EE;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
  min-height: 72px;
}

.curso-card:hover {
  border-color: #C5CCD8;
  box-shadow: 0 2px 8px rgba(19,34,74,0.07);
}

.curso-bloque-ver {
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 6px;
}

.curso-bloque-ver:hover {
  background: #F4F7FC;
}

/* Franja de estado */
.curso-stripe {
  width: 4px;
  align-self: stretch;
  flex-shrink: 0;
}

.stripe-activo    { background: #27AE60; }
.stripe-finalizado { background: #CBD5E1; }

/* Bloques de info */
.curso-bloque {
  padding: 14px 16px;
  min-width: 0;
}

.curso-bloque-nombre {
  width: 200px;
  flex-shrink: 0;
}

.curso-nombre {
  font-size: 14px;
  font-weight: 700;
  color: #13224A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.curso-meta {
  font-size: 12px;
  color: #9AA0AB;
  margin-top: 2px;
}

.curso-bloque-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9AA0AB;
  margin-bottom: 3px;
}

.curso-bloque-valor {
  font-size: 13.5px;
  color: #13224A;
  font-weight: 500;
  white-space: nowrap;
}

.curso-bloque-alumnos {
  min-width: 80px;
}

/* Acciones */
.curso-acciones {
  margin-left: auto;
  padding: 0 16px 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.curso-btn {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  border-radius: 7px !important;
  padding: 0 12px !important;
  height: 32px !important;
}

.curso-btn-accion {
  background: #F0F4FA !important;
  color: #13224A !important;
}

.curso-btn-accion:hover {
  background: #E2E9F5 !important;
}

.curso-btn-neutro {
  background: #F5F5F5 !important;
  color: #64748B !important;
}

.curso-btn-peligro {
  background: #FEF2F1 !important;
  color: #C0392B !important;
}

.curso-btn-peligro:hover {
  background: #FCDAD7 !important;
}
</style>
