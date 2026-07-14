<template>
  <q-page class="q-pa-md" style="background: #F7F8FA; min-height: 100vh;">
    <div style="color: #13224A; font-size: 20px; font-weight: 700;" class="q-mb-lg">Clases</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="instancias.length === 0" icon="🏫" message="No hay clases asignadas actualmente" />

    <div v-else>
      <!-- ── Tabs + buscador ──────────────────────────────────── -->
      <div class="row items-center justify-between q-mb-lg" style="flex-wrap: wrap; gap: 10px;">
        <div class="seg-control">
          <button
            :class="['seg-btn', tabActual === 'todas' && 'seg-btn--active']"
            @click="tabActual = 'todas'"
          >
            Todas <span class="seg-count">{{ instancias.length }}</span>
          </button>
          <button
            :class="['seg-btn', tabActual === 'activas' && 'seg-btn--active']"
            @click="tabActual = 'activas'"
          >
            Activas <span class="seg-count">{{ cursosActivos.length }}</span>
          </button>
          <button
            :class="['seg-btn', tabActual === 'finalizadas' && 'seg-btn--active']"
            @click="tabActual = 'finalizadas'"
          >
            Finalizadas <span class="seg-count">{{ cursosFinalizados.length }}</span>
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

      <!-- ── Empty per tab ───────────────────────────────────── -->
      <EmptyState
        v-if="instanciasParaTab.length === 0"
        icon="🏫"
        :message="busqueda ? 'No se encontraron clases' : tabActual === 'activas' ? 'No hay clases activas' : 'No hay clases finalizadas'"
      />

      <template v-else>
        <!-- ── HERO: Tu próxima clase ──────────────────────────── -->
        <div
          v-if="heroInst"
          :class="['hero-card', instanciaModal && instanciaModal.id !== heroInst.id ? 'hero-card--dimmed' : '']"
        >
          <div class="hero-label">TU PRÓXIMA CLASE</div>

          <div class="hero-top">
            <div style="min-width: 0; flex: 1;">
              <div class="hero-nombre">{{ heroInst.course_name }}</div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
                <div class="hero-meta" style="margin-top: 0;">{{ heroMeta(heroInst) }}</div>
                <button class="hero-alumnos-btn" @click.stop="abrirDrawer(heroInst)">
                  <q-spinner-dots v-if="heroInst.cargandoAlumnos" size="12px" style="color: rgba(255,255,255,0.6);" />
                  <template v-else>{{ alumnosActivos(heroInst).length }} {{ alumnosActivos(heroInst).length === 1 ? 'alumno' : 'alumnos' }}</template>
                  <q-icon name="visibility" size="14px" />
                </button>
              </div>
            </div>
            <div @click.stop style="display: flex; flex-direction: column; gap: 6px;">
              <button class="hero-edit-btn" @click.stop="abrirEditar(heroInst)">
                <q-icon name="edit" size="14px" />
                <q-tooltip class="pdv-tooltip">Editar curso</q-tooltip>
              </button>
              <button class="hero-edit-btn hero-finish-btn" @click.stop="abrirFinalizar(heroInst)">
                <q-icon name="check_circle" size="14px" />
                <q-tooltip class="pdv-tooltip">Terminar curso</q-tooltip>
              </button>
            </div>
          </div>

          <div class="hero-acciones">
            <div style="position: relative; display: inline-flex;">
              <button
                :class="['hero-btn', heroInst.google_meet_link ? 'hero-btn-meet' : 'hero-btn-disabled']"
                :disabled="!heroInst.google_meet_link"
                @click="heroInst.google_meet_link && abrirMeet(heroInst.google_meet_link)"
              >
                <q-icon name="videocam" size="15px" style="margin-right: 4px;" />
                Iniciar Clase
              </button>
              <div v-if="!heroInst.google_meet_link" style="position: absolute; inset: 0; pointer-events: none;">
                <q-tooltip class="pdv-tooltip">Este curso no tiene reunión de Meet configurada</q-tooltip>
              </div>
            </div>
            <button class="hero-btn hero-btn-accion" @click="abrirModal(heroInst, 'asistencia')">
              Asistencia
            </button>
            <button class="hero-btn hero-btn-accion" @click="abrirModal(heroInst, 'notas')">
              Notas
            </button>
            <div v-if="instanciaModal?.id === heroInst.id" class="hero-editando-chip">
              {{ modalTipo === 'asistencia' ? 'Editando asistencia' : 'Editando notas' }}
            </div>
          </div>
        </div>

        <!-- ── Cursos propios extra + Otras clases ─────────────── -->
        <template v-for="seccion in seccionesListado" :key="seccion.key">
          <div v-if="seccion.label" class="otras-clases-label">{{ seccion.label }}</div>
          <div class="cursos-lista">
            <div
              v-for="inst in seccion.items"
              :key="inst.id"
              :class="[
                'curso-card',
                instanciaModal && instanciaModal.id !== inst.id ? 'curso-card--dimmed' : '',
                instanciaModal?.id === inst.id ? 'curso-card--editando' : '',
              ]"
            >
              <!-- Franja de estado izquierda -->
              <div :class="['curso-stripe', stripeClass(inst, seccion.esPropia)]" />

              <!-- Bloque: nombre + período + lápiz -->
              <div class="curso-bloque curso-bloque-nombre">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div class="curso-nombre">{{ inst.course_name }}</div>
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

              <!-- Bloque: alumnos → drawer -->
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
                <div v-if="instanciaModal?.id === inst.id" class="editando-chip">
                  {{ modalTipo === 'asistencia' ? 'Editando asistencia' : 'Editando notas' }}
                </div>
                <template v-if="esActivo(inst)">
                  <div style="position: relative; display: inline-flex;">
                    <q-btn
                      unelevated dense no-caps icon="videocam" label="Iniciar Clase"
                      :class="['curso-btn', inst.google_meet_link ? 'curso-btn-meet' : 'curso-btn-meet-disabled']"
                      :disable="!inst.google_meet_link"
                      @click="inst.google_meet_link && abrirMeet(inst.google_meet_link)"
                    />
                    <div v-if="!inst.google_meet_link" style="position: absolute; inset: 0; pointer-events: none;">
                      <q-tooltip class="pdv-tooltip">Este curso no tiene reunión de Meet configurada</q-tooltip>
                    </div>
                  </div>
                  <q-btn unelevated dense no-caps label="Asistencia" class="curso-btn curso-btn-accion" @click="abrirModal(inst, 'asistencia')" />
                  <q-btn unelevated dense no-caps label="Notas"       class="curso-btn curso-btn-accion" @click="abrirModal(inst, 'notas')" />
                  <q-btn unelevated dense no-caps label="Finalizar"   class="curso-btn curso-btn-peligro" @click="abrirFinalizar(inst)" />
                </template>
                <template v-else>
                  <q-btn unelevated dense no-caps label="Ver asistencia" class="curso-btn curso-btn-neutro" @click="abrirModal(inst, 'asistencia')" />
                  <q-btn unelevated dense no-caps label="Ver notas"      class="curso-btn curso-btn-neutro" @click="abrirModal(inst, 'notas')" />
                </template>
              </div>
            </div>
          </div>

          <!-- ── Paginación (solo sección "otras") ──────────────── -->
          <div v-if="seccion.key === 'otras' && totalPaginasOtras > 1" class="paginacion">
            <button
              class="pag-btn"
              :class="paginaOtras === 1 ? 'pag-btn--dis' : ''"
              :disabled="paginaOtras === 1"
              @click="paginaOtras--"
            >‹ Anterior</button>
            <span class="pag-info">Página {{ paginaOtras }} de {{ totalPaginasOtras }}</span>
            <button
              class="pag-btn"
              :class="paginaOtras === totalPaginasOtras ? 'pag-btn--dis' : ''"
              :disabled="paginaOtras === totalPaginasOtras"
              @click="paginaOtras++"
            >Siguiente ›</button>
          </div>
        </template>
      </template>
    </div>

    <!-- ── Modal finalizar curso ───────────────────────────────── -->
    <q-dialog v-model="dialogoFinalizar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title" style="color: #991B1B;">Finalizar curso</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Estás seguro que deseas finalizar
            <strong>{{ instanciaAFinalizar?.course_name }} {{ instanciaAFinalizar?.year }}</strong> —
            Período {{ instanciaAFinalizar?.period }}?
          </p>
          <q-input v-model="motivoFinalizar" label="Motivo o comentario de cierre" type="textarea" autogrow />
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

    <!-- ── Modal editar curso ──────────────────────────────────── -->
    <q-dialog v-model="dialogoEditar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 420px; max-width: 480px;'">
        <div class="pdv-dialog-title">Editar curso</div>
        <div class="pdv-dialog-body">
          <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">
            {{ instanciaEditando?.course_name }} {{ instanciaEditando?.year }}
          </div>
          <q-select v-model="formEditar.teacher_id" :options="opcionesProfesores" :loading="cargandoProfesores" label="Profesor" emit-value map-options dense outlined clearable />
          <q-select v-model="formEditar.day_of_week" :options="DIAS" label="Día" clearable dense outlined />
          <q-input  v-model="formEditar.schedule_time" label="Hora" type="time" dense outlined />
          <q-select v-model="formEditar.period" :options="PERIODOS" label="Período" clearable dense outlined />
          <AppDateField v-model="formEditar.start_date" label="Fecha inicio" />
          <AppDateField v-model="formEditar.end_date"   label="Fecha fin" />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn unelevated label="Guardar" :loading="guardandoEditar" class="pdv-btn-save" @click="guardarEdicion" />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── Modal inscribir alumno ─────────────────────────────── -->
    <q-dialog v-model="dialogoInscribir" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 440px; max-width: 500px;'">
        <div class="pdv-dialog-title">Inscribir alumno</div>
        <div class="pdv-dialog-body">
          <div style="font-size: 13px; color: #64748B; margin-top: -8px;">
            {{ instanciaInscribir?.course_name }} {{ instanciaInscribir?.year }} — Período {{ instanciaInscribir?.period }}
          </div>
          <q-input v-model="busquedaAlumno" placeholder="Buscar por nombre..." dense outlined clearable>
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
              v-for="alumno in alumnosFiltrados" :key="alumno.id"
              style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9;"
            >
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="pdv-avatar pdv-avatar-sm">{{ iniciales(alumno.full_name) }}</div>
                <div style="font-size: 14px; color: #0D1B3E; font-weight: 500;">{{ alumno.full_name }}</div>
              </div>
              <button class="pdv-action-btn pdv-action-success" @click="inscribirAlumno(alumno)">
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

    <!-- ── Drawer de alumnos ───────────────────────────────────── -->
    <ClasesDrawer
      v-model="drawerAbierto"
      :instancia="instanciaDrawer"
      @agregar-alumno="abrirInscribirAlumno"
    />

    <!-- ── Modales asistencia / notas ─────────────────────────── -->
    <AsistenciaModal v-if="modalTipo === 'asistencia' && instanciaModal" :instancia="instanciaModal" @close="cerrarModal" />
    <NotasModal      v-if="modalTipo === 'notas'      && instanciaModal" :instancia="instanciaModal" @close="cerrarModal" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import EmptyState     from '../../components/EmptyState.vue'
import ClasesDrawer   from '../../components/ClasesDrawer.vue'
import AppDateField   from '../../components/AppDateField.vue'
import AsistenciaModal from '../../components/AsistenciaModal.vue'
import NotasModal     from '../../components/NotasModal.vue'
import { useAuthStore } from '../../stores/authStore'

defineOptions({ name: 'DashboardProfesor' })

const $q   = useQuasar()
const auth = useAuthStore()

// ── Estado base ───────────────────────────────────────────────────────
const instancias = ref([])
const cargando   = ref(false)
const tabActual  = ref('activas')
const busqueda   = ref('')

const dialogoFinalizar    = ref(false)
const instanciaAFinalizar = ref(null)
const motivoFinalizar     = ref('')
const finalizando         = ref(false)

const DIAS    = ['Lunes', 'Martes', 'Miércoles']
const PERIODOS = ['Primer período', 'Segundo período']

const dialogoEditar      = ref(false)
const instanciaEditando  = ref(null)
const formEditar         = ref({ teacher_id: null, day_of_week: '', schedule_time: '', period: '', start_date: '', end_date: '' })
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

const modalTipo      = ref(null)
const instanciaModal = ref(null)

// ── Helpers ───────────────────────────────────────────────────────────
function esActivo(inst)  { return inst.status === 'active' }
function abrirMeet(link) { window.open(link, '_blank', 'noopener,noreferrer') }

function ordenPeriodo(period) {
  if (/segundo/i.test(period)) return 2
  if (/primer/i.test(period))  return 1
  return 0
}

function valorOrdenable(inst) { return inst.year * 10 + ordenPeriodo(inst.period) }

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const DIAS_NUM = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 }

function minutosHastaClase(inst) {
  const diaCurso = DIAS_NUM[inst.day_of_week]
  if (diaCurso === undefined) return Infinity
  const [h, m] = (inst.schedule_time?.slice(0, 5) ?? '00:00').split(':').map(Number)
  const now = new Date()
  const hoy = now.getDay()
  const horaActual = now.getHours() * 60 + now.getMinutes()
  const horaCurso  = (h ?? 0) * 60 + (m ?? 0)
  let dias = (diaCurso - hoy + 7) % 7
  if (dias === 0 && horaCurso <= horaActual) dias = 7
  return dias * 1440 + horaCurso
}

function sortByScheduleProximity(lista) {
  return [...lista].sort((a, b) => minutosHastaClase(a) - minutosHastaClase(b))
}

function heroMeta(inst) {
  const diaHora = [inst.day_of_week, inst.schedule_time?.slice(0, 5)].filter(Boolean).join(' ')
  return [diaHora, inst.period].filter(Boolean).join(' · ')
}

function stripeClass(inst, esPropia) {
  if (esPropia) return 'stripe-propia'
  return esActivo(inst) ? 'stripe-activo' : 'stripe-finalizado'
}

// ── Computed base ─────────────────────────────────────────────────────
const cursosActivos = computed(() =>
  instancias.value.filter(i => i.status === 'active').sort((a, b) => valorOrdenable(b) - valorOrdenable(a))
)

const cursosFinalizados = computed(() =>
  instancias.value.filter(i => i.status !== 'active').sort((a, b) => valorOrdenable(b) - valorOrdenable(a))
)

const instanciasParaTab = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  let base
  if      (tabActual.value === 'todas')      base = [...cursosActivos.value, ...cursosFinalizados.value]
  else if (tabActual.value === 'activas')    base = cursosActivos.value
  else                                        base = cursosFinalizados.value
  return q ? base.filter(i => i.course_name?.toLowerCase().includes(q)) : base
})

const esProfesor = computed(() => auth.hasRole('profesor'))
const userId     = computed(() => auth.user?.id)

const heroInst = computed(() => {
  if (!esProfesor.value || tabActual.value === 'finalizadas') return null
  const mias = instanciasParaTab.value.filter(i => i.teacher_id === userId.value && i.status === 'active')
  return mias.length ? sortByScheduleProximity(mias)[0] : null
})

const instanciasHeroExtra = computed(() => {
  if (!heroInst.value) return []
  const mias = instanciasParaTab.value.filter(i => i.teacher_id === userId.value && i.status === 'active')
  return sortByScheduleProximity(mias).slice(1)
})

const instanciasOtrasConFiltro = computed(() => {
  const heroIds = new Set([heroInst.value?.id, ...instanciasHeroExtra.value.map(i => i.id)].filter(Boolean))
  return instanciasParaTab.value.filter(i => !heroIds.has(i.id))
})

const ITEMS_POR_PAGINA = 10
const paginaOtras = ref(1)

watch([tabActual, busqueda], () => { paginaOtras.value = 1 })

const totalPaginasOtras = computed(() =>
  Math.ceil(instanciasOtrasConFiltro.value.length / ITEMS_POR_PAGINA)
)

const instanciasOtrasPaginadas = computed(() => {
  const inicio = (paginaOtras.value - 1) * ITEMS_POR_PAGINA
  return instanciasOtrasConFiltro.value.slice(inicio, inicio + ITEMS_POR_PAGINA)
})

const seccionesListado = computed(() => {
  const secciones = []
  if (instanciasHeroExtra.value.length > 0) {
    secciones.push({ key: 'extra', label: null, items: instanciasHeroExtra.value, esPropia: true })
  }
  if (instanciasOtrasConFiltro.value.length > 0) {
    secciones.push({
      key: 'otras',
      label: heroInst.value ? 'Otras clases' : null,
      items: instanciasOtrasPaginadas.value,
      esPropia: false,
    })
  }
  return secciones
})

function alumnosActivos(inst) {
  return (inst.alumnos ?? []).filter(a => a.status !== 'withdrawn')
}

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
    start_date:    inst.start_date?.slice(0, 10) ?? '',
    end_date:      inst.end_date?.slice(0, 10) ?? '',
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

function scheduleChanged() {
  const inst = instanciaEditando.value
  return (
    formEditar.value.start_date  !== (inst.start_date?.slice(0, 10) ?? '') ||
    formEditar.value.end_date    !== (inst.end_date?.slice(0, 10) ?? '') ||
    formEditar.value.day_of_week !== (inst.day_of_week ?? '')
  )
}

async function doGuardarEdicion() {
  guardandoEditar.value = true
  try {
    const payload = {
      teacher_id:    formEditar.value.teacher_id,
      day_of_week:   formEditar.value.day_of_week || null,
      schedule_time: formEditar.value.schedule_time || null,
      period:        formEditar.value.period || null,
      start_date:    formEditar.value.start_date || null,
      end_date:      formEditar.value.end_date || null,
    }
    await api.patch(`/courses/${instanciaEditando.value.id}`, payload)
    const inst = instanciaEditando.value
    inst.teacher_id    = payload.teacher_id
    inst.teacher_name  = profesores.value.find(p => p.id === payload.teacher_id)?.full_name ?? inst.teacher_name
    inst.day_of_week   = payload.day_of_week
    inst.schedule_time = payload.schedule_time ? payload.schedule_time + ':00' : null
    inst.period        = payload.period
    inst.start_date    = payload.start_date
    inst.end_date      = payload.end_date
    dialogoEditar.value = false
    $q.notify({ type: 'positive', message: 'Curso actualizado correctamente.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo actualizar el curso.', position: 'top' })
  } finally {
    guardandoEditar.value = false
  }
}

function guardarEdicion() {
  if (scheduleChanged()) {
    $q.dialog({
      title: 'Actualizar sesiones',
      message: 'Se generarán nuevas sesiones según las fechas indicadas. Las sesiones que ya tienen asistencia registrada no se verán afectadas.',
      cancel: { flat: true, label: 'Cancelar', color: 'grey-7' },
      ok: { unelevated: true, label: 'Confirmar', style: 'background: #0D1B3E; color: white; border-radius: 6px;' },
      persistent: true,
    }).onOk(() => doGuardarEdicion())
  } else {
    doGuardarEdicion()
  }
}

// ── Acciones: modales ─────────────────────────────────────────────────
function abrirModal(inst, tipo) { instanciaModal.value = inst; modalTipo.value = tipo }
function cerrarModal()          { modalTipo.value = null; instanciaModal.value = null }

// ── Acciones: drawer ──────────────────────────────────────────────────
function abrirDrawer(inst) { instanciaDrawer.value = inst; drawerAbierto.value = true }

// ── Acciones: inscribir alumno ────────────────────────────────────────
async function abrirInscribirAlumno(inst) {
  instanciaInscribir.value = inst
  busquedaAlumno.value     = ''
  alumnosDisponibles.value = []
  dialogoInscribir.value   = true
  buscandoAlumnos.value    = true
  try {
    const { data } = await api.get('/users')
    const yaInscritos = new Set(
      (inst.alumnos ?? []).filter(a => a.status !== 'withdrawn').map(a => a.student_id ?? a.id)
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
    await api.post('/enrollments', { student_id: alumno.id, course_id: instanciaInscribir.value.id })
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
  motivoFinalizar.value     = ''
  dialogoFinalizar.value    = true
}

async function confirmarFinalizar() {
  finalizando.value = true
  try {
    await api.patch(`/courses/${instanciaAFinalizar.value.id}`, { status: 'finished', close_reason: motivoFinalizar.value.trim() })
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
function generateBatchId() { return Math.random().toString(36).slice(2, 9) }

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
    const { data } = await api.get('/courses', { headers: { 'X-Batch-Id': batchId } })
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
/* ── Tabs ── */
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

.seg-btn--active { background: #13224A; color: white; }

.seg-count {
  font-size: 11px;
  font-weight: 700;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 1px 6px;
  line-height: 1.5;
  transition: background 0.2s ease;
}

.seg-btn--active .seg-count { background: rgba(255,255,255,0.2); }

/* ── Hero card ── */
.hero-card {
  background: #13224A;
  border-radius: 18px;
  padding: 26px 30px 22px;
  margin-bottom: 18px;
  transition: opacity 0.2s;
}

.hero-card--dimmed { opacity: 0.52; }

.hero-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #E3A96E;
  margin-bottom: 10px;
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.hero-nombre {
  font-size: 22px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  margin-bottom: 5px;
}

.hero-meta {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
}

.hero-alumnos-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 20px;
  padding: 3px 10px 3px 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.hero-alumnos-btn:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

.hero-edit-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.65);
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.hero-edit-btn:hover { background: rgba(255,255,255,0.1); }
.hero-finish-btn:hover { background: rgba(192,57,43,0.25); color: #F1948A; border-color: rgba(192,57,43,0.4); }

.hero-acciones {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.hero-btn-meet {
  background: #4A9D69;
  color: white;
}
.hero-btn-meet:hover { background: #3A8859; }

.hero-btn-disabled {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
  cursor: not-allowed;
}

.hero-btn-accion {
  background: rgba(255,255,255,0.12);
  color: white;
}
.hero-btn-accion:hover { background: rgba(255,255,255,0.2); }

.hero-editando-chip {
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.85);
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
}

/* ── Label de sección ── */
.otras-clases-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9AA0AB;
  padding: 4px 0 8px;
}

/* ── Lista de cards ── */
.cursos-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
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
  min-height: 80px;
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
.curso-bloque-ver:hover { background: #F4F7FC; }

/* Franjas de estado */
.curso-stripe        { width: 4px; align-self: stretch; flex-shrink: 0; }
.stripe-activo       { background: #4A9D69; }
.stripe-propia       { background: #4A6EA8; }
.stripe-finalizado   { background: #CBD5E1; }

/* Bloques de info */
.curso-bloque { padding: 18px 16px; min-width: 0; }

.curso-bloque-nombre {
  flex: 0 1 auto;
  min-width: 160px;
  max-width: 320px;
}

.curso-nombre {
  font-size: 14px;
  font-weight: 700;
  color: #13224A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.curso-meta { font-size: 12px; color: #9AA0AB; margin-top: 2px; }

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

.curso-bloque-alumnos { min-width: 80px; }

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

.curso-btn-accion        { background: #F0F4FA !important; color: #13224A !important; }
.curso-btn-accion:hover  { background: #E2E9F5 !important; }
.curso-btn-neutro        { background: #F5F5F5 !important; color: #64748B !important; }
.curso-btn-peligro       { background: #FEF2F1 !important; color: #C0392B !important; }
.curso-btn-peligro:hover { background: #FCDAD7 !important; }
.curso-btn-meet          { background: #E8F5E9 !important; color: #1E7E34 !important; }
.curso-btn-meet:hover    { background: #C8E6C9 !important; }
.curso-btn-meet-disabled { background: #F5F5F5 !important; color: #BDBDBD !important; cursor: not-allowed !important; }

/* ── Resaltado modal activo ── */
.curso-card--editando {
  border-color: #8E9EBB !important;
  background: #E0E6F2 !important;
  box-shadow: 0 2px 12px rgba(19, 34, 74, 0.14) !important;
}

.curso-card--dimmed { opacity: 0.52; transition: opacity 0.2s; }

/* ── Paginación ── */
.paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 0 4px;
}

.pag-btn {
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 7px;
  padding: 5px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #13224A;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pag-btn:hover:not(:disabled) {
  background: #F0F4FA;
  border-color: #C5CCD8;
}
.pag-btn--dis {
  color: #CBD5E1;
  cursor: default;
}

.pag-info {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
  white-space: nowrap;
}

.editando-chip {
  display: inline-flex;
  align-items: center;
  background: #DDE2EE;
  color: #3D5185;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
