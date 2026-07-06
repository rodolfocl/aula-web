<template>
  <teleport to="body">
    <transition name="cursos-drawer">
      <div
        v-if="abierto"
        class="cursosDrawer-overlay"
        @click.self="abierto = false"
      >
        <div class="cursosDrawer-panel">

          <!-- ── Header + Tabs ── -->
          <div style="flex-shrink: 0; background: white; border-bottom: 1px solid #E2E8F0;">
            <div class="row items-center justify-between no-wrap" style="padding: 20px 20px 14px; gap: 12px;">
              <div style="min-width: 0;">
                <div style="font-size: 17px; font-weight: 700; color: #0D1B3E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ plantilla?.name }}
                </div>
                <div style="font-size: 12px; color: #94A3B8; margin-top: 2px;">Cursos dictados a partir de esta plantilla</div>
              </div>
              <q-btn flat round dense icon="close" color="grey-5" style="flex-shrink: 0;" @click="abierto = false" />
            </div>

            <q-tabs
              v-model="tabActual"
              align="left"
              dense
              no-caps
              active-color="#0D1B3E"
              indicator-color="#0D1B3E"
            >
              <q-tab name="activos" style="font-size: 13px; min-height: 38px; padding: 0 20px;">
                <span>Activos</span>
                <span
                  v-if="!cargando"
                  style="margin-left: 7px; background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px; line-height: 1.6;"
                >{{ activos.length }}</span>
              </q-tab>
              <q-tab name="anteriores" style="font-size: 13px; min-height: 38px; padding: 0 20px;">
                <span>Anteriores</span>
                <span
                  v-if="!cargando"
                  style="margin-left: 7px; background: #F1F5F9; color: #64748B; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px; line-height: 1.6;"
                >{{ anteriores.length }}</span>
              </q-tab>
            </q-tabs>
          </div>

          <!-- ── Loading ── -->
          <div v-if="cargando" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #F8FAFC;">
            <q-spinner-dots color="primary" size="40px" />
          </div>

          <!-- ── Tab Panels ── -->
          <q-tab-panels v-else v-model="tabActual" animated style="flex: 1; overflow-y: auto; background: #F8FAFC;">

            <!-- Activos -->
            <q-tab-panel name="activos" style="padding: 14px 16px;">
              <div v-if="activos.length === 0" class="column items-center" style="padding: 48px 0; color: #94A3B8; gap: 8px;">
                <q-icon name="event_busy" size="36px" />
                <span style="font-size: 13px;">Sin cursos activos</span>
              </div>
              <div v-else class="column" style="gap: 10px;">
                <q-card
                  v-for="inst in activos"
                  :key="inst.id"
                  flat
                  style="background: white; border-radius: 12px; box-shadow: var(--pdv-shadow-card); padding: 14px 16px;"
                >
                  <div class="row items-start justify-between no-wrap" style="gap: 12px;">
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-weight: 600; font-size: 13.5px; color: #0D1B3E; margin-bottom: 3px;">{{ inst.teacher_name }}</div>
                      <div style="font-size: 12.5px; color: #64748B; margin-bottom: 2px;">
                        {{ inst.year }} · {{ inst.period }}<template v-if="inst.day_of_week"> · {{ inst.day_of_week }}</template>
                      </div>
                      <div v-if="inst.start_date" style="font-size: 12px; color: #94A3B8;">
                        {{ inst.start_date?.slice(0,10) }} → {{ inst.end_date?.slice(0,10) ?? '—' }}
                      </div>
                    </div>
                    <div class="column items-end" style="gap: 8px; flex-shrink: 0;">
                      <span :class="['pdv-pill', pillEstado(inst.status)]">{{ labelEstado(inst.status) }}</span>
                      <div class="row items-center" style="gap: 6px;">
                        <AccionBtn icono="edit" variante="blue" :deshabilitado="!isAdmin" tooltip-admin="Editar curso" tooltip-no-admin="Solo los administradores pueden editar" @click="abrirDialogo(inst)" />
                        <AccionBtn icono="block" variante="danger" :deshabilitado="!isAdmin" tooltip-admin="Cerrar curso" tooltip-no-admin="Solo los administradores pueden cerrar" @click="abrirCierre(inst)" />
                      </div>
                    </div>
                  </div>
                </q-card>
              </div>
            </q-tab-panel>

            <!-- Anteriores -->
            <q-tab-panel name="anteriores" style="padding: 14px 16px;">
              <div v-if="anteriores.length === 0" class="column items-center" style="padding: 48px 0; color: #94A3B8; gap: 8px;">
                <q-icon name="history_edu" size="32px" />
                <span style="font-size: 13px;">Sin cursos anteriores</span>
              </div>
              <div v-else class="column" style="gap: 10px;">
                <q-card
                  v-for="inst in anteriores"
                  :key="inst.id"
                  flat
                  style="background: white; border-radius: 12px; box-shadow: var(--pdv-shadow-card); padding: 14px 16px;"
                >
                  <div class="row items-start justify-between no-wrap" style="gap: 12px;">
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-weight: 600; font-size: 13.5px; color: #0D1B3E; margin-bottom: 3px;">{{ inst.teacher_name }}</div>
                      <div style="font-size: 12.5px; color: #64748B; margin-bottom: 2px;">
                        {{ inst.year }} · {{ inst.period }}<template v-if="inst.day_of_week"> · {{ inst.day_of_week }}</template>
                      </div>
                      <div v-if="inst.start_date" style="font-size: 12px; color: #94A3B8;">
                        {{ inst.start_date?.slice(0,10) }} → {{ inst.end_date?.slice(0,10) ?? '—' }}
                      </div>
                    </div>
                    <div class="column items-end" style="gap: 8px; flex-shrink: 0;">
                      <span :class="['pdv-pill', pillEstado(inst.status)]">{{ labelEstado(inst.status) }}</span>
                      <div class="row items-center" style="gap: 6px;">
                        <AccionBtn icono="edit" variante="blue" :deshabilitado="!isAdmin" tooltip-admin="Editar curso" tooltip-no-admin="Solo los administradores pueden editar" @click="abrirDialogo(inst)" />
                        <AccionBtn v-if="inst.status === 'finished'" icono="play_circle_outline" variante="success" :deshabilitado="!isAdmin" tooltip-admin="Reabrir curso" tooltip-no-admin="Solo los administradores pueden reabrir" @click="abrirReapertura(inst)" />
                      </div>
                    </div>
                  </div>
                </q-card>
              </div>
            </q-tab-panel>

          </q-tab-panels>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ── Dialog: editar instancia ── -->
  <q-dialog v-model="dialogoEditar" :maximized="$q.screen.lt.sm">
    <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
      <div class="pdv-dialog-title">Editar Curso</div>
      <div class="pdv-dialog-body">
        <q-input :model-value="plantilla?.name" label="Plantilla de Curso" readonly outlined dense bg-color="grey-1" />
        <q-select
          v-model="form.teacher_id"
          label="Profesor"
          :options="opcionesProfesores"
          option-label="label"
          option-value="value"
          emit-value map-options
          outlined dense options-dense
          :loading="cargandoProfesores"
        />
        <div class="row q-gutter-md">
          <q-input v-model.number="form.year" label="Año" type="number" outlined dense style="flex: 1;" />
          <q-select v-model="form.period" label="Período" :options="opcionesPeriodo" outlined dense options-dense style="flex: 1;" />
        </div>
        <div class="row q-gutter-md">
          <q-select v-model="form.day_of_week" label="Día" :options="DIAS" clearable outlined dense options-dense style="flex: 1;" />
          <div style="flex: 1;" />
        </div>
        <AppDateField v-model="form.start_date" label="Fecha inicio" />
        <AppDateField v-model="form.end_date" label="Fecha fin" />
        <q-input v-model.number="form.max_absences" label="Máx. ausencias permitidas" type="number" outlined dense />
      </div>
      <div class="pdv-dialog-actions">
        <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
        <q-btn unelevated label="Guardar" class="pdv-btn-save" :loading="guardando" @click="guardar" />
      </div>
    </q-card>
  </q-dialog>

  <!-- ── Dialog: cerrar curso ── -->
  <q-dialog v-model="dialogoCierre" :maximized="$q.screen.lt.sm">
    <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
      <div class="pdv-dialog-title" style="color: #991B1B;">Cerrar curso</div>
      <div class="pdv-dialog-body">
        <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
          ¿Estás seguro que deseas cerrar
          <strong>{{ instanciaActual?.course_name }}</strong> —
          <strong>{{ instanciaActual?.year }} Período {{ instanciaActual?.period }}</strong>?
        </p>
        <q-input v-model="motivoCierre" label="Motivo del cierre" type="textarea" autogrow outlined dense />
      </div>
      <div class="pdv-dialog-actions">
        <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
        <q-btn
          unelevated label="Cerrar curso" :loading="cerrando"
          :disable="motivoCierre.trim().length < 10"
          style="background: #991B1B; color: white; border-radius: 8px; padding: 0 24px; font-weight: 600;"
          @click="confirmarCierre"
        />
      </div>
    </q-card>
  </q-dialog>

  <!-- ── Dialog: reabrir curso ── -->
  <q-dialog v-model="dialogoReapertura" :maximized="$q.screen.lt.sm">
    <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
      <div class="pdv-dialog-title" style="color: #065F46;">Reabrir curso</div>
      <div class="pdv-dialog-body">
        <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
          ¿Estás seguro que deseas reabrir
          <strong>{{ instanciaActual?.course_name }}</strong> —
          <strong>{{ instanciaActual?.year }} Período {{ instanciaActual?.period }}</strong>?
        </p>
        <q-input v-model="motivoReapertura" label="Motivo de reapertura" type="textarea" autogrow outlined dense />
      </div>
      <div class="pdv-dialog-actions">
        <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
        <q-btn
          unelevated label="Reabrir curso" :loading="reabriendo"
          :disable="motivoReapertura.trim().length < 10"
          style="background: #065F46; color: white; border-radius: 8px; padding: 0 24px; font-weight: 600;"
          @click="confirmarReapertura"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { usePermissions } from '../composables/usePermissions'
import AppDateField from './AppDateField.vue'

const AccionBtn = {
  props: ['icono', 'variante', 'deshabilitado', 'tooltipAdmin', 'tooltipNoAdmin'],
  emits: ['click'],
  template: `
    <div style="position: relative; display: inline-flex;">
      <button
        :class="['pdv-action-btn', 'pdv-action-' + variante, { 'pdv-action-disabled': deshabilitado }]"
        @click="!deshabilitado && $emit('click')"
      >
        <q-icon :name="icono" size="16px" />
      </button>
      <div style="position: absolute; inset: 0; cursor: not-allowed; pointer-events: none;">
        <q-tooltip class="pdv-tooltip">{{ deshabilitado ? tooltipNoAdmin : tooltipAdmin }}</q-tooltip>
      </div>
    </div>
  `,
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  plantilla:  { type: Object, default: null },
  tabInicial: { type: String, default: 'activos' },
})
const emit = defineEmits(['update:modelValue', 'actualizado'])

const $q      = useQuasar()
const { isAdmin } = usePermissions()

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// ── Estado ────────────────────────────────────────────────────────
const instancias        = ref([])
const cargando          = ref(false)
const tabActual         = ref('activos')
const profesores        = ref([])
const cargandoProfesores = ref(false)

const dialogoEditar    = ref(false)
const editando         = ref(null)
const guardando        = ref(false)

const instanciaActual  = ref(null)
const dialogoCierre    = ref(false)
const motivoCierre     = ref('')
const cerrando         = ref(false)

const dialogoReapertura = ref(false)
const motivoReapertura  = ref('')
const reabriendo        = ref(false)

const PERIODOS_BASE = ['Anual','Primer semestre', 'Segundo semestre', 'Seminario']
const DIAS = ['Lunes', 'Martes', 'Miércoles']

const opcionesPeriodo = computed(() => {
  if (editando.value && form.value.period && !PERIODOS_BASE.includes(form.value.period)) {
    return [form.value.period, ...PERIODOS_BASE]
  }
  return PERIODOS_BASE
})

const opcionesProfesores = computed(() =>
  profesores.value
    .filter(u => Array.isArray(u.roles) && u.roles.includes('profesor'))
    .map(u => ({ label: u.full_name, value: u.id }))
)

const activos    = computed(() => instancias.value.filter(i => i.status === 'active'))
const anteriores = computed(() => instancias.value.filter(i => i.status !== 'active'))

const formVacio = () => ({
  teacher_id: null, year: new Date().getFullYear(),
  period: '', day_of_week: null, start_date: '', end_date: '', max_absences: null,
})
const form = ref(formVacio())

// Carga al abrir y sincroniza la tab inicial
watch(() => props.modelValue, (val) => {
  if (val) {
    tabActual.value = props.tabInicial
    cargarInstancias()
  }
})
watch(() => props.tabInicial, (val) => { tabActual.value = val })

// ── Carga ─────────────────────────────────────────────────────────
async function cargarInstancias() {
  if (!props.plantilla?.id) return
  cargando.value = true
  try {
    const { data } = await api.get('/course-instances', {
      params: { course_id: props.plantilla.id },
    })
    instancias.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar los cursos.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function pillEstado(status) {
  if (status === 'active')    return 'pdv-pill-success'
  if (status === 'cancelled') return 'pdv-pill-error'
  return 'pdv-pill-neutral'
}
function labelEstado(status) {
  if (status === 'active')    return 'Activa'
  if (status === 'finished')  return 'Finalizada'
  if (status === 'cancelled') return 'Cancelada'
  return status ?? '—'
}

// ── Editar ────────────────────────────────────────────────────────
async function abrirDialogo(inst) {
  if (profesores.value.length === 0) {
    cargandoProfesores.value = true
    try {
      const { data } = await api.get('/users')
      profesores.value = data
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo cargar los profesores.', position: 'top' })
      return
    } finally {
      cargandoProfesores.value = false
    }
  }
  editando.value = inst
  form.value = {
    teacher_id:   inst.teacher_id,
    year:         inst.year,
    period:       inst.period,
    day_of_week:  inst.day_of_week ?? null,
    start_date:   inst.start_date?.slice(0, 10) ?? '',
    end_date:     inst.end_date?.slice(0, 10) ?? '',
    max_absences: inst.max_absences ?? null,
  }
  dialogoEditar.value = true
}

async function guardar() {
  guardando.value = true
  try {
    await api.patch(`/course-instances/${editando.value.id}`, form.value)
    $q.notify({ type: 'positive', message: 'Curso actualizado.', position: 'top' })
    dialogoEditar.value = false
    await cargarInstancias()
    emit('actualizado')
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar el curso.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

// ── Cerrar ────────────────────────────────────────────────────────
function abrirCierre(inst) {
  instanciaActual.value = inst
  motivoCierre.value = ''
  dialogoCierre.value = true
}
async function confirmarCierre() {
  cerrando.value = true
  try {
    await api.patch(`/course-instances/${instanciaActual.value.id}`, {
      status: 'finished',
      close_reason: motivoCierre.value.trim(),
    })
    dialogoCierre.value = false
    $q.notify({ type: 'positive', message: 'Curso cerrado correctamente.', position: 'top' })
    await cargarInstancias()
    emit('actualizado')
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cerrar el curso.', position: 'top' })
  } finally {
    cerrando.value = false
  }
}

// ── Reabrir ───────────────────────────────────────────────────────
function abrirReapertura(inst) {
  instanciaActual.value = inst
  motivoReapertura.value = ''
  dialogoReapertura.value = true
}
async function confirmarReapertura() {
  reabriendo.value = true
  try {
    await api.patch(`/course-instances/${instanciaActual.value.id}`, {
      status: 'active',
      reopen_reason: motivoReapertura.value.trim(),
    })
    dialogoReapertura.value = false
    $q.notify({ type: 'positive', message: 'Curso reabierto correctamente.', position: 'top' })
    await cargarInstancias()
    emit('actualizado')
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo reabrir el curso.', position: 'top' })
  } finally {
    reabriendo.value = false
  }
}
</script>

<style>
/* Sin scoped: el panel se renderiza vía teleport fuera del componente */
.cursosDrawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.38);
}

.cursosDrawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 560px;
  max-width: 100vw;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14);
}

/* ── Animación ── */
.cursos-drawer-enter-active {
  transition: opacity 0.22s ease;
}
.cursos-drawer-leave-active {
  transition: opacity 0.18s ease;
}
.cursos-drawer-enter-from,
.cursos-drawer-leave-to {
  opacity: 0;
}
.cursos-drawer-enter-active .cursosDrawer-panel,
.cursos-drawer-leave-active .cursosDrawer-panel {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.cursos-drawer-enter-from .cursosDrawer-panel,
.cursos-drawer-leave-to .cursosDrawer-panel {
  transform: translateX(100%);
}

/* ── Mobile: ancho completo ── */
@media (max-width: 599px) {
  .cursosDrawer-panel {
    width: 100vw;
  }
}
</style>
