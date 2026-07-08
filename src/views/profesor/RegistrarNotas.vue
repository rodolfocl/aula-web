<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">

    <!-- Cabecera -->
    <div class="row items-center justify-between q-mb-lg" style="gap: 8px;">
      <div class="row items-center" style="flex: 1; min-width: 0;">
        <q-btn flat round dense icon="arrow_back" :to="{ name: 'ProfesorSesion' }" style="color: #0D1B3E;" class="q-mr-sm" />
        <div style="min-width: 0;">
          <div class="text-h6 text-weight-bold" style="color: #0D1B3E;">Registrar Notas</div>
          <div class="text-caption q-mt-xs" style="color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ instancia?.course_name }} · {{ instancia?.year }} Período {{ instancia?.period }}
          </div>
        </div>
      </div>
      <q-btn
        v-if="esActivo"
        unelevated icon="save" :label="$q.screen.gt.xs ? 'Guardar notas' : ''"
        :loading="guardando" :disable="!hayNotas"
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
          <table class="notas-table">
            <thead>
              <tr>
                <th class="th-sticky th-nombre">Estudiante</th>

                <th v-for="ev in evaluaciones" :key="ev.id" class="th-eval">
                  <!-- Edición inline del nombre -->
                  <input
                    v-if="esActivo && editandoNombreId === ev.id"
                    :ref="el => { if (el) nombreInputEl = el }"
                    v-model="editandoNombre"
                    class="nombre-edit-input"
                    @blur="guardarNombre(ev)"
                    @keydown.enter.prevent="guardarNombre(ev)"
                    @keydown.esc="cancelarNombre"
                  />
                  <div v-else class="ev-nombre-click" :style="!esActivo && 'cursor: default; pointer-events: none;'" @click="esActivo && iniciarEditarNombre(ev)">
                    <span>{{ ev.name }}</span>
                    <q-icon name="edit" size="11px" class="edit-hint" />
                  </div>
                  <div class="ev-date">{{ formatFechaCorta(ev.date) }}</div>
                </th>

                <th v-if="esActivo" class="th-add">
                  <q-btn round unelevated dense icon="add" size="sm"
                    style="background: rgba(255,255,255,0.22); color: white; border: 1.5px solid rgba(255,255,255,0.5);"
                    @click="abrirDialogoCrear">
                    <q-tooltip class="pdv-tooltip">Nueva evaluación</q-tooltip>
                  </q-btn>
                </th>

                <th class="th-promedio">Promedio</th>
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

                <td v-for="ev in evaluaciones" :key="ev.id" class="td-nota">
                  <q-tooltip
                    v-if="hasError(fila.enrollment_id, ev.id)"
                    :target="true"
                    anchor="top middle"
                    self="bottom middle"
                    class="pdv-tooltip"
                  >
                    Rango válido: 1.0 – 7.0
                  </q-tooltip>
                  <input
                    type="number" min="1.0" max="7.0" step="0.1" placeholder="—"
                    :readonly="!esActivo"
                    :class="['nota-input', hasError(fila.enrollment_id, ev.id) && 'nota-input--error', !esActivo && 'nota-input--readonly']"
                    :value="fila.notas[ev.id]"
                    :style="hasError(fila.enrollment_id, ev.id) ? {} : inputStyle(fila.notas[ev.id])"
                    @blur="esActivo && setNota(fila, ev.id, $event.target.value)"
                  />
                </td>

                <td v-if="esActivo" class="td-add" />

                <td class="td-promedio">
                  <span :style="promedioStyle(calcPromedio(fila))">{{ calcPromedio(fila) }}</span>
                </td>

              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- Dialog: nueva evaluación -->
    <q-dialog v-model="dialogoForm" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title">Nueva evaluación</div>
        <div class="pdv-dialog-body">
          <q-input v-model="form.name" label="Nombre *" placeholder="Ej: Examen 1, Trabajo grupal…" outlined dense autofocus />
          <AppDateField v-model="form.date" label="Fecha *" />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Crear" :loading="guardandoForm" :disable="!form.name.trim() || !form.date"
            style="background: #0D1B3E; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
            @click="confirmarForm"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import AppDateField from '../../components/AppDateField.vue'

const route = useRoute()
const $q = useQuasar()

const instancia    = ref(null)
const esActivo     = computed(() => instancia.value?.status === 'active')
const evaluaciones = ref([])
const filas        = ref([])
const cargando     = ref(false)
const guardando    = ref(false)

const dialogoForm   = ref(false)
const guardandoForm = ref(false)
const form          = ref({ name: '', date: '' })

const editandoNombreId = ref(null)
const editandoNombre   = ref('')
const nombreInputEl    = ref(null)

// ── Utilidades ────────────────────────────────────────────────────────────────

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('')
}

function formatFechaCorta(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

// ── Normalización (helper reutilizable) ───────────────────────────────────────
// Devuelve { value: number|null, valid: boolean }
function normalizeGrade(raw) {
  const trimmed = String(raw ?? '').trim()
  if (trimmed === '') return { value: null, valid: true }
  const n = parseFloat(trimmed)
  if (isNaN(n)) return { value: null, valid: false }
  const rounded = Math.round(n * 10) / 10
  if (rounded < 1.0 || rounded > 7.0) return { value: null, valid: false }
  return { value: rounded, valid: true }
}

// ── Estado de error por celda (flash 1.5s) ────────────────────────────────────
const errorCells = ref({})

function flashError(enrollmentId, evalId) {
  const key = `${enrollmentId}:${evalId}`
  errorCells.value = { ...errorCells.value, [key]: true }
  setTimeout(() => {
    const next = { ...errorCells.value }
    delete next[key]
    errorCells.value = next
  }, 1500)
}

function hasError(enrollmentId, evalId) {
  return !!errorCells.value[`${enrollmentId}:${evalId}`]
}

function inputStyle(nota) {
  const n = parseFloat(nota)
  if (nota === null || nota === '' || isNaN(n)) return {}
  if (n >= 4.0) return { borderColor: '#27AE60', color: '#1B5E20' }
  if (n >= 3.0) return { borderColor: '#E67E22', color: '#7A5C00' }
  return { borderColor: '#C0392B', color: '#7F0000' }
}

function calcPromedio(fila) {
  const vals = Object.values(fila.notas).map(n => parseFloat(n)).filter(n => !isNaN(n))
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function promedioStyle(val) {
  const n = parseFloat(val)
  if (isNaN(n)) return 'color: #BDBDBD; font-weight: 500;'
  if (n >= 4.0) return 'color: #1B5E20; font-weight: 700; font-size: 15px;'
  if (n >= 3.0) return 'color: #7A5C00; font-weight: 700; font-size: 15px;'
  return 'color: #7F0000; font-weight: 700; font-size: 15px;'
}

// ── Edición inline nombre ─────────────────────────────────────────────────────

function iniciarEditarNombre(ev) {
  editandoNombreId.value = ev.id
  editandoNombre.value   = ev.name
  nextTick(() => { nombreInputEl.value?.focus(); nombreInputEl.value?.select() })
}

function cancelarNombre() {
  editandoNombreId.value = null
  editandoNombre.value   = ''
}

async function guardarNombre(ev) {
  const nuevoNombre = editandoNombre.value.trim()
  editandoNombreId.value = null
  if (!nuevoNombre || nuevoNombre === ev.name) return
  try {
    await api.put(`/evaluations/${ev.id}`, { name: nuevoNombre })
    ev.name = nuevoNombre
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo renombrar la evaluación.', position: 'top' })
  }
}

// ── Celdas ────────────────────────────────────────────────────────────────────

function setNota(fila, evalId, raw) {
  const { value, valid } = normalizeGrade(raw)
  if (!valid) flashError(fila.enrollment_id, evalId)
  fila.notas[evalId] = value
}

const hayNotas = computed(() =>
  filas.value.some(f => Object.values(f.notas).some(n => n !== null && !isNaN(parseFloat(n))))
)

// ── Carga ─────────────────────────────────────────────────────────────────────

async function cargarTabla() {
  cargando.value = true
  try {
    const [{ data: inst }, { data: tabla }] = await Promise.all([
      api.get(`/courses/${route.params.id}`),
      api.get(`/courses/${route.params.id}/grades-table`),
    ])
    instancia.value    = inst
    evaluaciones.value = tabla.evaluaciones
    filas.value        = tabla.filas
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la información del curso.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

// ── Guardar ───────────────────────────────────────────────────────────────────

async function guardar() {
  for (const fila of filas.value) {
    for (const [evalId, nota] of Object.entries(fila.notas)) {
      if (nota === null) continue
      const { valid } = normalizeGrade(nota)
      if (!valid) {
        flashError(fila.enrollment_id, evalId)
        $q.notify({ type: 'negative', message: 'Hay notas fuera del rango 1.0–7.0. Corrígelas antes de guardar.', position: 'top' })
        return
      }
    }
  }

  const payloads = evaluaciones.value
    .map(ev => ({
      evaluationId: ev.id,
      grades: filas.value
        .map(f => ({ enrollment_id: f.enrollment_id, raw: f.notas[ev.id] }))
        .filter(({ raw }) => raw !== null && !isNaN(parseFloat(raw)))
        .map(({ enrollment_id, raw }) => ({ enrollment_id, grade: normalizeGrade(raw).value })),
    }))
    .filter(p => p.grades.length > 0)

  if (!payloads.length) return

  guardando.value = true
  try {
    await Promise.all(payloads.map(p => api.post(`/evaluations/${p.evaluationId}/grades`, { grades: p.grades })))
    $q.notify({ type: 'positive', message: 'Notas guardadas correctamente.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron guardar las notas.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

// ── Nueva evaluación ──────────────────────────────────────────────────────────

function abrirDialogoCrear() {
  form.value = { name: '', date: '' }
  dialogoForm.value = true
}

async function confirmarForm() {
  guardandoForm.value = true
  try {
    const { data: nueva } = await api.post(
      `/courses/${route.params.id}/evaluations`,
      { name: form.value.name.trim(), date: form.value.date }
    )
    evaluaciones.value.push(nueva)
    for (const fila of filas.value) fila.notas[nueva.id] = null
    dialogoForm.value = false
    $q.notify({ type: 'positive', message: 'Evaluación creada.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo crear la evaluación.', position: 'top' })
  } finally {
    guardandoForm.value = false
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

.notas-table {
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
.notas-table thead tr {
  background: #0D1B3E;
}

.notas-table thead th {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  white-space: nowrap;
}

.th-nombre { min-width: 220px; text-align: left; }
.th-eval   { min-width: 110px; }
.th-add    { width: 44px; padding: 8px !important; }
.th-promedio { min-width: 90px; }

/* ── Header evaluación ────── */
.ev-nombre-click {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 5px;
  transition: background 0.15s;
}

.ev-nombre-click:hover { background: rgba(255, 255, 255, 0.12); }

.edit-hint { opacity: 0.5; transition: opacity 0.15s; color: #90CAF9; }
.ev-nombre-click:hover .edit-hint { opacity: 1; }

.ev-date {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
}

.nombre-edit-input {
  font-size: 12px;
  font-weight: 700;
  color: white;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.7);
  outline: none;
  background: transparent;
  text-align: center;
  width: 100%;
  padding: 1px 4px;
}

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

/* ── Celda nota ───────────── */
.td-nota {
  text-align: center;
  padding: 7px 10px;
  border-right: 1px solid rgba(0, 0, 0, 0.04);
}

.nota-input {
  width: 64px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #0D1B3E;
  border: 1.5px solid #E0E0E0;
  border-radius: 6px;
  padding: 5px 4px;
  outline: none;
  background: transparent;
  transition: border-color 0.15s, box-shadow 0.15s;
  -moz-appearance: textfield;
}

.nota-input::placeholder { color: #BDBDBD; }

.nota-input::-webkit-outer-spin-button,
.nota-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.nota-input:focus {
  border-color: #0D1B3E;
  box-shadow: 0 0 0 2px rgba(13, 27, 62, 0.08);
}

.nota-input--readonly {
  cursor: default;
  pointer-events: none;
  background: #FAFAFA;
  border-color: transparent;
  color: #555;
}

.nota-input--error {
  border-color: #C0392B !important;
  background: #FFEBEE !important;
  color: #7F0000 !important;
  animation: shake 0.35s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  60%       { transform: translateX(4px); }
  80%       { transform: translateX(-2px); }
}

.td-add { width: 44px; }

/* ── Celda promedio ───────── */
.td-promedio { text-align: center; padding: 10px 16px; }

/* ── Mobile: tabla con scroll horizontal, celdas compactas ── */
@media (max-width: 599px) {
  .notas-table {
    font-size: 11px;
  }

  .notas-table thead th {
    padding: 8px 8px;
    font-size: 10px;
  }

  .th-nombre   { min-width: 150px; }
  .th-eval     { min-width: 80px; }
  .th-promedio { min-width: 70px; }

  .td-nombre {
    padding: 8px 10px;
  }

  .avatar-mini {
    width: 24px;
    height: 24px;
    font-size: 9px;
  }

  .td-nota {
    padding: 5px 6px;
  }

  .nota-input {
    width: 52px;
    font-size: 13px;
    padding: 4px 3px;
  }

  .td-promedio {
    padding: 8px 10px;
  }
}
</style>