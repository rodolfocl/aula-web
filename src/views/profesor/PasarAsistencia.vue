<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">

    <!-- Cabecera -->
    <div class="row items-center justify-between q-mb-lg" style="gap: 8px;">
      <div class="row items-center" style="flex: 1; min-width: 0;">
        <q-btn flat round dense icon="arrow_back" :to="{ name: 'ProfesorSesion' }" style="color: #0D1B3E;" class="q-mr-sm" />
        <div style="min-width: 0;">
          <div class="text-h6 text-weight-bold" style="color: #0D1B3E;">Pasar Asistencia</div>
          <div class="text-caption q-mt-xs" style="color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ instancia?.course_name }} · {{ instancia?.year }} Período {{ instancia?.period }}
          </div>
        </div>
      </div>
      <q-btn
        v-if="esActivo"
        unelevated icon="save" :label="$q.screen.gt.xs ? 'Guardar asistencia' : ''"
        :loading="guardando" :disable="!pendiente"
        style="background: #0D1B3E; color: white; border-radius: 8px; flex-shrink: 0;"
        class="q-px-md"
        @click="guardar"
      />
    </div>

    <!-- Spinner inicial -->
    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <template v-else>

      <!-- Sin alumnos -->
      <div v-if="filas.length === 0" class="column items-center q-mt-xl" style="color: #9E9E9E;">
        <q-icon name="people" size="56px" style="opacity: 0.35;" />
        <div class="q-mt-sm text-body1 text-weight-medium" style="color: #555;">No hay alumnos inscritos en este curso</div>
      </div>

      <template v-else>
        <div class="tabla-wrap">
          <table class="asistencia-table">
            <thead>
              <tr>
                <th class="th-sticky th-nombre">Estudiante</th>

                <th v-for="ses in sesiones" :key="ses.id" class="th-sesion">
                  <div class="fecha-click">
                    <span>{{ formatFecha(ses.scheduled_at) }}</span>
                    <q-icon name="edit" size="11px" class="edit-hint" />
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-date
                        :model-value="ses.scheduled_at?.slice(0, 10) || null"
                        mask="YYYY-MM-DD"
                        :first-day-of-week="1"
                        :locale="localeES"
                        @update:model-value="(val) => guardarFecha(ses, val)"
                      />
                    </q-popup-proxy>
                  </div>
                  <div v-if="esActivo && sesionSinRegistros(ses)" style="margin-top: 4px; text-align: center;">
                    <q-btn
                      round flat dense icon="delete_outline"
                      size="xs"
                      style="color: rgba(255,255,255,0.55); width: 20px; height: 20px;"
                      @click.stop="eliminarSesion(ses)"
                    >
                      <q-tooltip class="pdv-tooltip">Eliminar sesión (sin registros)</q-tooltip>
                    </q-btn>
                  </div>
                </th>

                <th v-if="esActivo" class="th-add">
                  <q-btn round unelevated dense icon="add" size="sm"
                    style="background: rgba(255,255,255,0.22); color: white; border: 1.5px solid rgba(255,255,255,0.5);"
                    @click="abrirDialogoSesion">
                    <q-tooltip class="pdv-tooltip">Nueva sesión</q-tooltip>
                  </q-btn>
                </th>

                <th class="th-faltas">Faltas</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="fila in filas" :key="fila.enrollment_id" class="fila-alumno">

                <td class="th-sticky td-nombre">
                  <div class="nombre-cell">
                    <div class="avatar-mini">{{ iniciales(fila.full_name) }}</div>
                    <span>{{ fila.full_name }}</span>
                  </div>
                </td>

                <td
                  v-for="ses in sesiones" :key="ses.id"
                  class="td-asistencia"
                  @click="ciclarEstado(fila, ses.id)"
                >
                  <div :class="['estado-badge', `estado-${fila.asistencia[ses.id] ?? 'null'}`]">
                    <q-icon :name="iconEstado(fila.asistencia[ses.id])" size="16px" />
                    <q-tooltip class="pdv-tooltip">{{ labelEstado(fila.asistencia[ses.id]) }}</q-tooltip>
                  </div>
                </td>

                <td v-if="esActivo" class="td-add" />

                <td class="td-faltas">
                  <div class="faltas-cell">
                    <span :style="faltasStyle(calcFaltas(fila))">{{ calcFaltas(fila) }}</span>
                    <q-icon
                      v-if="esReprobadoPorAsistencia(fila)"
                      name="error"
                      size="18px"
                      style="color: #C0392B;"
                    >
                      <q-tooltip class="pdv-tooltip">Alumno reprobado por asistencia</q-tooltip>
                    </q-icon>
                  </div>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

        <!-- Leyenda -->
        <div class="row q-gutter-md q-mt-md items-center">
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background:#27AE60;"></div>
            <span class="text-caption" style="color: #555;">Presente</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background:#C0392B;"></div>
            <span class="text-caption" style="color: #555;">Ausente (cuenta falta)</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background:#E67E22;"></div>
            <span class="text-caption" style="color: #555;">Justificado (no penaliza)</span>
          </div>
          <div class="row items-center q-gutter-xs">
            <div style="width:12px; height:12px; border-radius:50%; background:#E0E0E0;"></div>
            <span class="text-caption" style="color: #555;">Sin registrar</span>
          </div>
        </div>
      </template>
    </template>

    <!-- Dialog: nueva sesión -->
    <q-dialog v-model="dialogoSesion" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title">Nueva sesión</div>
        <div class="pdv-dialog-body">
          <AppDateField v-model="formSesion.fecha" label="Fecha *" autofocus />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Agregar" :loading="guardandoSesion" :disable="!formSesion.fecha"
            style="background: #0D1B3E; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
            @click="confirmarSesion"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import AppDateField from '../../components/AppDateField.vue'

const route = useRoute()
const $q = useQuasar()

const instancia     = ref(null)
const esActivo      = computed(() => instancia.value?.status === 'active')
const sesiones      = ref([])
const filas         = ref([])
const cargando      = ref(false)
const guardando     = ref(false)
const pendiente     = ref(false)

const dialogoSesion   = ref(false)
const guardandoSesion = ref(false)
const formSesion      = ref({ fecha: '' })

const localeES = {
  days:        ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  daysShort:   ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  months:      ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
}

// ── Edición de fecha de sesión (clic en header → calendario) ──────────────────
async function guardarFecha(ses, nuevaFecha) {
  if (!nuevaFecha || nuevaFecha === ses.scheduled_at?.slice(0, 10)) return
  try {
    await api.patch(`/sessions/${ses.id}`, {
      scheduled_at: new Date(nuevaFecha + 'T12:00:00Z').toISOString(),
    })
    ses.scheduled_at = new Date(nuevaFecha + 'T12:00:00Z').toISOString()
    $q.notify({ type: 'positive', message: 'Fecha actualizada.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo actualizar la fecha.', position: 'top' })
  }
}

// ── Ciclo de estados ──────────────────────────────────────────────────────────
const CICLO = [null, 'present', 'absent', 'justified']

function ciclarEstado(fila, sessionId) {
  if (!esActivo.value) return
  const idx = CICLO.indexOf(fila.asistencia[sessionId])
  fila.asistencia[sessionId] = CICLO[(idx + 1) % CICLO.length]
  pendiente.value = true
}

// ── Presentación ──────────────────────────────────────────────────────────────
function iconEstado(status) {
  if (status === 'present')   return 'check'
  if (status === 'absent')    return 'close'
  if (status === 'justified') return 'description'
  return 'remove'
}

function labelEstado(status) {
  if (status === 'present')   return 'Presente'
  if (status === 'absent')    return 'Ausente'
  if (status === 'justified') return 'Justificado'
  return 'Sin registrar — clic para marcar'
}

function calcFaltas(fila) {
  return Object.values(fila.asistencia).filter(s => s === 'absent').length
}

function faltasStyle(n) {
  if (n === 0) return 'color: #27AE60; font-weight: 600;'
  if (n <= 2)  return 'color: #E67E22; font-weight: 700; font-size: 15px;'
  return 'color: #C0392B; font-weight: 700; font-size: 15px;'
}

function esReprobadoPorAsistencia(fila) {
  const max = instancia.value?.max_absences
  if (max == null) return false
  return calcFaltas(fila) > max
}

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('')
}

function formatFecha(fechaISO) {
  if (!fechaISO) return ''
  const d = new Date(fechaISO)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

// ── Carga ─────────────────────────────────────────────────────────────────────
async function cargarTabla() {
  cargando.value = true
  try {
    const [{ data: inst }, { data: tabla }] = await Promise.all([
      api.get(`/courses/${route.params.id}`),
      api.get(`/courses/${route.params.id}/attendance-table`),
    ])
    instancia.value = inst
    sesiones.value  = tabla.sesiones
    filas.value     = tabla.filas
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la información del curso.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

// ── Guardar ───────────────────────────────────────────────────────────────────
async function guardar() {
  const registros = []
  for (const fila of filas.value) {
    for (const [sessionId, status] of Object.entries(fila.asistencia)) {
      if (status !== null) {
        registros.push({ session_id: sessionId, enrollment_id: fila.enrollment_id, status })
      }
    }
  }
  if (!registros.length) return

  guardando.value = true
  try {
    await api.post('/attendance/bulk', { registros })
    $q.notify({ type: 'positive', message: 'Asistencia guardada correctamente.', position: 'top' })
    pendiente.value = false
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la asistencia.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

// ── Eliminar sesión ───────────────────────────────────────────────────────────
function sesionSinRegistros(ses) {
  return filas.value.every(fila => fila.asistencia[ses.id] == null)
}

function eliminarSesion(ses) {
  $q.dialog({
    title: 'Eliminar sesión',
    message: `¿Eliminar la sesión del ${formatFecha(ses.scheduled_at)}? Esta acción no se puede deshacer.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { flat: true, label: 'Cancelar' },
  }).onOk(async () => {
    try {
      await api.delete(`/sessions/${ses.id}`)
      sesiones.value = sesiones.value.filter(s => s.id !== ses.id)
      for (const fila of filas.value) delete fila.asistencia[ses.id]
      $q.notify({ type: 'positive', message: 'Sesión eliminada.', position: 'top' })
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar la sesión.', position: 'top' })
    }
  })
}

// ── Nueva sesión ──────────────────────────────────────────────────────────────
function abrirDialogoSesion() {
  formSesion.value = { fecha: '' }
  dialogoSesion.value = true
}

async function confirmarSesion() {
  guardandoSesion.value = true
  try {
    const fechaDisplay = formatFecha(formSesion.value.fecha + 'T12:00:00Z')
    const { data: nueva } = await api.post('/sessions', {
      offering_id:  route.params.id,
      scheduled_at: new Date(formSesion.value.fecha + 'T12:00:00Z').toISOString(),
      title:        `Sesión ${fechaDisplay}`,
    })
    sesiones.value.push(nueva)
    for (const fila of filas.value) fila.asistencia[nueva.id] = null
    dialogoSesion.value = false
    $q.notify({ type: 'positive', message: 'Sesión creada.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo crear la sesión.', position: 'top' })
  } finally {
    guardandoSesion.value = false
  }
}

onMounted(cargarTabla)
</script>

<style scoped>
.tabla-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.asistencia-table {
  border-collapse: collapse;
  min-width: 100%;
  font-size: 13px;
}

/* ── Sticky ───────────────── */
.th-sticky {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #0D1B3E;
}

thead .th-sticky { z-index: 3; }
tbody .th-sticky { background: white; }

/* ── Cabecera ─────────────── */
.asistencia-table thead tr {
  background: #0D1B3E;
}

.asistencia-table thead th {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  white-space: nowrap;
}

.th-nombre  { min-width: 220px; text-align: left; }
.th-sesion  { min-width: 90px; }
.th-add     { width: 44px; padding: 8px !important; }
.th-faltas  { min-width: 70px; }

/* ── Filas ────────────────── */
.fila-alumno {
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.1s;
}

.fila-alumno:last-child { border-bottom: none; }
.fila-alumno:hover { background: #F5F7FA; }
.fila-alumno:hover .th-sticky { background: #F5F7FA; }

/* ── Celda nombre ─────────── */
.td-nombre {
  padding: 10px 16px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  color: #0D1B3E;
}

.nombre-cell { display: flex; align-items: center; gap: 10px; }

.avatar-mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1A2F6B;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Celda asistencia ─────── */
.td-asistencia {
  text-align: center;
  padding: 6px 8px;
  border-right: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.td-asistencia:hover { background: rgba(0, 0, 0, 0.03); }

.estado-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: transform 0.1s, opacity 0.1s;
}

.td-asistencia:hover .estado-badge { transform: scale(1.12); }

.estado-present   { background: #E8F5E9; color: #2E7D32; }
.estado-absent    { background: #FFEBEE; color: #C0392B; }
.estado-justified { background: #FFF3E0; color: #E67E22; }
.estado-null      { background: #F5F5F5; color: #BDBDBD; }

.td-add    { width: 44px; }
.td-faltas { text-align: center; padding: 10px 16px; }
.faltas-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

/* ── Edición de fecha de sesión (via calendario popup) ── */
.fecha-click {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.fecha-click:hover {
  background: rgba(255, 255, 255, 0.15);
}
.fecha-click .edit-hint {
  opacity: 0;
  transition: opacity 0.15s;
}
.fecha-click:hover .edit-hint {
  opacity: 0.7;
}

/* ── Mobile: tabla con scroll horizontal, celdas compactas ── */
@media (max-width: 599px) {
  .asistencia-table {
    font-size: 11px;
  }

  .asistencia-table thead th {
    padding: 8px 10px;
    font-size: 10px;
  }

  .th-nombre  { min-width: 150px; }
  .th-sesion  { min-width: 70px; }
  .th-faltas  { min-width: 54px; }

  .td-nombre {
    padding: 8px 10px;
  }

  .avatar-mini {
    width: 24px;
    height: 24px;
    font-size: 9px;
  }

  .td-asistencia {
    padding: 4px 6px;
  }

  .estado-badge {
    width: 26px;
    height: 26px;
  }

  .td-faltas {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>

<style>
.pdv-tooltip {
  background: #0D1B3E;
  color: white;
  font-size: 12px;
  border-radius: 6px;
}
</style>