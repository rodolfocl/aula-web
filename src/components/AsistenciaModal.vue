<template>
  <Teleport to="body">
    <div class="ma-overlay" @mousedown.self="cerrar">
      <div ref="cardEl" class="ma-card" tabindex="-1">

        <!-- HEADER -->
        <div class="ma-header">
          <div style="min-width: 0; flex: 1;">
            <h2 class="ma-title">Pasar Asistencia</h2>
            <p class="ma-subtitle">{{ subtitulo }}</p>
          </div>
          <button class="ma-close-btn" aria-label="Cerrar" @click="cerrar">×</button>
        </div>

        <div class="ma-sep" />

        <!-- BODY -->
        <div class="ma-body">
          <div v-if="cargando" class="ma-centrado">
            <q-spinner-dots color="primary" size="40px" />
          </div>
          <div v-else-if="filas.length === 0" class="ma-centrado ma-vacio">
            No hay alumnos inscritos en este curso
          </div>
          <div v-else class="ma-tabla-wrap">
            <table class="ma-tabla">
              <thead>
                <tr>
                  <th class="ma-th ma-th-alumno">Estudiante</th>

                  <th v-for="ses in sesiones" :key="ses.id" class="ma-th ma-th-ses">
                    <div class="ma-fecha-cell">
                      <span>{{ formatFechaCorta(ses.scheduled_at) }}</span>
                      <q-icon name="edit" size="10px" class="ma-edit-hint" />
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
                    <div v-if="esActivo && sesionSinRegistros(ses)" style="text-align:center;margin-top:2px;">
                      <q-btn
                        round flat dense icon="delete_outline" size="xs"
                        style="color:#9AA0AB;"
                        @click.stop="eliminarSesion(ses)"
                      >
                        <q-tooltip class="pdv-tooltip">Eliminar sesión (sin registros)</q-tooltip>
                      </q-btn>
                    </div>
                  </th>

                  <th v-if="esActivo" class="ma-th ma-th-add">
                    <button class="ma-add-btn" @click="abrirDialogoSesion">
                      <q-icon name="add" size="14px" />
                      <q-tooltip class="pdv-tooltip">Nueva sesión</q-tooltip>
                    </button>
                  </th>

                  <th class="ma-th ma-th-faltas">Faltas</th>
                  <th class="ma-th ma-th-pct">% Asist.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fila in filas" :key="fila.enrollment_id">
                  <td class="ma-td-alumno">
                    <div class="ma-alumno-cell">
                      <div class="ma-avatar">{{ iniciales(fila.full_name) }}</div>
                      <span
                        class="ma-alumno-nombre"
                        :style="estadoAsistencia(fila) === 'reprobado' ? 'color:#C0392B;font-weight:700;' : estadoAsistencia(fila) === 'riesgo' ? 'color:#E67E22;font-weight:700;' : ''"
                      >{{ fila.full_name }}</span>
                      <div v-if="estadoAsistencia(fila)" style="position:relative;display:inline-flex;flex-shrink:0;">
                        <q-icon
                          :name="estadoAsistencia(fila) === 'reprobado' ? 'error' : 'warning'"
                          size="14px"
                          :style="estadoAsistencia(fila) === 'reprobado' ? 'color:#C0392B;' : 'color:#E67E22;'"
                        />
                        <q-tooltip class="pdv-tooltip">
                          {{ estadoAsistencia(fila) === 'reprobado' ? 'Reprobado por asistencia' : 'Alumno en riesgo por asistencia' }}
                        </q-tooltip>
                      </div>
                    </div>
                  </td>

                  <td
                    v-for="ses in sesiones"
                    :key="ses.id"
                    class="ma-td-estado"
                    :style="esActivo ? 'cursor:pointer;' : ''"
                    @click="esActivo && ciclarEstado(fila, ses.id)"
                  >
                    <div :class="['ma-estado', `ma-estado-${fila.asistencia[ses.id] ?? 'null'}`]">
                      <q-tooltip class="pdv-tooltip">{{ labelEstado(fila.asistencia[ses.id]) }}</q-tooltip>
                    </div>
                  </td>

                  <td v-if="esActivo" class="ma-td-add" />

                  <td class="ma-td-faltas">
                    <span :style="faltasStyle(calcFaltas(fila))">{{ calcFaltas(fila) }}</span>
                  </td>
                  <td class="ma-td-pct">
                    <span :style="pctStyle(calcPct(fila))">{{ calcPct(fila) }}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="ma-sep" />

        <!-- FOOTER -->
        <div class="ma-footer">
          <div class="ma-leyenda">
            <span class="ma-dot" style="background:#4A9D69;" />
            <span class="ma-leyenda-txt">Presente</span>
            <span class="ma-dot" style="background:#C0392B;" />
            <span class="ma-leyenda-txt">Ausente</span>
            <span class="ma-dot" style="background:#E2A83B;" />
            <span class="ma-leyenda-txt">Justificado</span>
          </div>
          <div class="ma-footer-acciones">
            <button class="ma-btn-cancelar" @click="cerrar">Cancelar</button>
            <button
              v-if="esActivo"
              class="ma-btn-guardar"
              :disabled="!pendiente || guardando"
              @click="guardar"
            >
              {{ guardando ? 'Guardando…' : 'Guardar asistencia' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog: nueva sesión -->
    <q-dialog v-model="dialogoSesion">
      <q-card class="pdv-dialog" style="min-width:320px;">
        <div class="pdv-dialog-title">Nueva sesión</div>
        <div class="pdv-dialog-body">
          <AppDateField v-model="formSesion.fecha" label="Fecha *" autofocus />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Agregar"
            :loading="guardandoSesion" :disable="!formSesion.fecha"
            style="background:#13224A;color:white;border-radius:6px;padding:0 24px;font-weight:600;"
            @click="confirmarSesion"
          />
        </div>
      </q-card>
    </q-dialog>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import AppDateField from './AppDateField.vue'

const props = defineProps({
  instancia: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const $q    = useQuasar()
const cardEl = ref(null)

const sesiones      = ref([])
const filas         = ref([])
const cargando      = ref(false)
const guardando     = ref(false)
const pendiente     = ref(false)

const dialogoSesion   = ref(false)
const guardandoSesion = ref(false)
const formSesion      = ref({ fecha: '' })

const esActivo = computed(() => props.instancia?.status === 'active')

const subtitulo = computed(() => {
  const i = props.instancia
  if (!i) return ''
  const horaCorta = i.schedule_time?.slice(0, 5)
  const diaHora   = [i.day_of_week, horaCorta].filter(Boolean).join(' ')
  return [i.course_name, i.teacher_name, diaHora].filter(Boolean).join(' · ')
})

const localeES = {
  days:        ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  daysShort:   ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  months:      ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
}

// ── Utilidades ─────────────────────────────────────────────────────────
function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return ''
  const d = new Date(fechaISO)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}`
}

function formatFecha(fechaISO) {
  if (!fechaISO) return ''
  const d = new Date(fechaISO)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

// ── Estados de asistencia ───────────────────────────────────────────────
const CICLO = [null, 'present', 'absent', 'justified']

function ciclarEstado(fila, sessionId) {
  const idx = CICLO.indexOf(fila.asistencia[sessionId])
  fila.asistencia[sessionId] = CICLO[(idx + 1) % CICLO.length]
  pendiente.value = true
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
  if (n === 0) return 'color:#4A9D69;font-weight:700;font-size:15px;'
  if (n <= 2)  return 'color:#E2A83B;font-weight:700;font-size:15px;'
  return 'color:#C0392B;font-weight:700;font-size:15px;'
}

function calcPct(fila) {
  const vals = Object.values(fila.asistencia).filter(s => s !== null)
  if (!vals.length) return 100
  const presentes = vals.filter(s => s === 'present' || s === 'justified').length
  return Math.round((presentes / vals.length) * 100)
}

function pctStyle(pct) {
  const color = pct >= 75 ? '#4A9D69' : pct >= 60 ? '#E2A83B' : '#C0392B'
  return `color:${color};font-weight:700;font-size:15px;`
}

function estadoAsistencia(fila) {
  const max = props.instancia?.max_absences
  if (max == null) return null
  const faltas = calcFaltas(fila)
  if (faltas > max)  return 'reprobado'
  if (faltas === max) return 'riesgo'
  return null
}

function sesionSinRegistros(ses) {
  return filas.value.every(f => f.asistencia[ses.id] == null)
}

// ── Edición fecha sesión ────────────────────────────────────────────────
async function guardarFecha(ses, nuevaFecha) {
  if (!nuevaFecha || nuevaFecha === ses.scheduled_at?.slice(0, 10)) return
  try {
    await api.patch(`/sessions/${ses.id}`, { scheduled_at: new Date(nuevaFecha + 'T12:00:00Z').toISOString() })
    ses.scheduled_at = new Date(nuevaFecha + 'T12:00:00Z').toISOString()
    $q.notify({ type: 'positive', message: 'Fecha actualizada.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo actualizar la fecha.', position: 'top' })
  }
}

// ── Eliminar sesión ─────────────────────────────────────────────────────
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

// ── Nueva sesión ────────────────────────────────────────────────────────
function abrirDialogoSesion() {
  formSesion.value = { fecha: '' }
  dialogoSesion.value = true
}

async function confirmarSesion() {
  guardandoSesion.value = true
  try {
    const fechaDisplay = formatFecha(formSesion.value.fecha + 'T12:00:00Z')
    const { data: nueva } = await api.post('/sessions', {
      offering_id:  props.instancia.id,
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

// ── Guardar asistencia ──────────────────────────────────────────────────
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
    cerrar()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la asistencia.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

// ── Carga ────────────────────────────────────────────────────────────────
async function cargar() {
  cargando.value = true
  try {
    const { data: tabla } = await api.get(`/courses/${props.instancia.id}/attendance-table`)
    sesiones.value = tabla.sesiones
    filas.value    = tabla.filas
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la asistencia.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

// ── Cerrar ───────────────────────────────────────────────────────────────
function cerrar() {
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') cerrar()
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await cargar()
  await nextTick()
  cardEl.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* ── Overlay ── */
.ma-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

/* ── Card modal ── */
.ma-card {
  background: white;
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.10);
  width: 100%;
  max-width: 880px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;
}

/* ── Header ── */
.ma-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 16px;
  flex-shrink: 0;
}

.ma-title {
  font-size: 22px;
  font-weight: 700;
  color: #13224A;
  margin: 0 0 4px;
  line-height: 1.2;
}

.ma-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ma-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #F3F4F6;
  color: #6B7280;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.ma-close-btn:hover { background: #E5E7EB; }

/* ── Separador ── */
.ma-sep {
  height: 1px;
  background: #E7E9EE;
  flex-shrink: 0;
}

/* ── Body ── */
.ma-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.ma-centrado {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.ma-vacio { color: #9AA0AB; font-size: 14px; }

/* ── Tabla ── */
.ma-tabla-wrap { overflow-x: auto; }

.ma-tabla {
  border-collapse: collapse;
  width: 100%;
  font-size: 13.5px;
}

.ma-th {
  padding: 11px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9AA0AB;
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid #F0F1F4;
  background: white;
}

.ma-th-alumno {
  text-align: left;
  min-width: 210px;
  position: sticky;
  left: 0;
  z-index: 3;
  background: white;
  box-shadow: 2px 0 6px -2px rgba(0, 0, 0, 0.08);
}
.ma-th-ses    { min-width: 72px; }
.ma-th-add    { width: 50px; }
.ma-th-faltas { min-width: 70px; }
.ma-th-pct    { min-width: 80px; }

/* Fecha clickeable */
.ma-fecha-cell {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
  transition: background 0.15s;
  font-size: 13px;
  font-weight: 600;
  color: #13224A;
}
.ma-fecha-cell:hover { background: #F3F4F6; }
.ma-edit-hint { opacity: 0; transition: opacity 0.15s; color: #9AA0AB; }
.ma-fecha-cell:hover .ma-edit-hint { opacity: 1; }

/* Filas */
.ma-tabla tbody tr {
  border-bottom: 1px solid #F0F1F4;
  transition: background 0.1s;
}
.ma-tabla tbody tr:last-child { border-bottom: none; }
.ma-tabla tbody tr:hover { background: #FAFBFC; }

.ma-td-alumno {
  padding: 12px 16px;
  position: sticky;
  left: 0;
  z-index: 1;
  background: white;
  box-shadow: 2px 0 6px -2px rgba(0, 0, 0, 0.06);
}

.ma-tabla tbody tr:hover .ma-td-alumno {
  background: #FAFBFC;
}

.ma-alumno-cell { display: flex; align-items: center; gap: 10px; }

.ma-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E8ECF4;
  color: #13224A;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ma-alumno-nombre { font-size: 14px; font-weight: 500; color: #13224A; }

.ma-td-estado { text-align: center; padding: 10px 8px; }

/* Círculos de estado */
.ma-estado {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-block;
  transition: transform 0.12s, box-shadow 0.12s;
}

.ma-td-estado:hover .ma-estado { transform: scale(1.15); }

.ma-estado-present   { background: #4A9D69; }
.ma-estado-absent    { background: #C0392B; }
.ma-estado-justified { background: #E2A83B; }
.ma-estado-null      { background: transparent; border: 2px solid #DFE3E8; }

.ma-td-add { width: 50px; }

.ma-add-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px dashed #C5CCD8;
  background: transparent;
  color: #9AA0AB;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.ma-add-btn:hover { border-color: #13224A; color: #13224A; background: #F4F7FC; }

.ma-td-faltas { text-align: center; padding: 10px 16px; }
.ma-td-pct    { text-align: center; padding: 10px 16px; }

/* ── Footer ── */
.ma-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}

.ma-leyenda { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.ma-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ma-leyenda-txt { font-size: 13px; color: #6B7280; margin-right: 8px; }

.ma-footer-acciones {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.ma-btn-cancelar {
  background: transparent;
  border: none;
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  transition: color 0.15s;
}
.ma-btn-cancelar:hover { color: #13224A; }

.ma-btn-guardar {
  background: #13224A;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.ma-btn-guardar:hover:not(:disabled) { background: #1E3470; }
.ma-btn-guardar:disabled { opacity: 0.45; cursor: not-allowed; }
</style>

<style>
.pdv-tooltip {
  background: #0D1B3E;
  color: white;
  font-size: 12px;
  border-radius: 6px;
}
</style>
