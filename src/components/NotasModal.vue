<template>
  <Teleport to="body">
    <div class="nm-overlay" @mousedown.self="cerrar">
      <div ref="cardEl" class="nm-card" tabindex="-1">

        <!-- HEADER -->
        <div class="nm-header">
          <div style="min-width:0;flex:1;">
            <h2 class="nm-title">Registrar Notas</h2>
            <p class="nm-subtitle">{{ subtitulo }}</p>
          </div>
          <button class="nm-close-btn" aria-label="Cerrar" @click="cerrar">×</button>
        </div>

        <div class="nm-sep" />

        <!-- BODY -->
        <div class="nm-body">
          <div v-if="cargando" class="nm-centrado">
            <q-spinner-dots color="primary" size="40px" />
          </div>
          <div v-else-if="filas.length === 0" class="nm-centrado nm-vacio">
            No hay alumnos inscritos en este curso
          </div>
          <div v-else class="nm-tabla-wrap">
            <table class="nm-tabla">
              <thead>
                <tr>
                  <th class="nm-th nm-th-alumno">Estudiante</th>

                  <th v-for="ev in evaluaciones" :key="ev.id" class="nm-th nm-th-eval">
                    <input
                      v-if="esActivo && editandoNombreId === ev.id"
                      :ref="el => { if (el) nombreInputEl = el }"
                      v-model="editandoNombre"
                      class="nm-nombre-input"
                      @blur="guardarNombre(ev)"
                      @keydown.enter.prevent="guardarNombre(ev)"
                      @keydown.esc="cancelarNombre"
                    />
                    <div
                      v-else
                      class="nm-ev-nombre"
                      :style="!esActivo && 'cursor:default;pointer-events:none;'"
                      @click="esActivo && iniciarEditarNombre(ev)"
                    >
                      <span>{{ ev.name }}</span>
                      <q-icon name="edit" size="10px" class="nm-edit-hint" />
                    </div>
                    <div class="nm-ev-fecha">{{ formatFechaCorta(ev.date) }}</div>
                  </th>

                  <th v-if="esActivo" class="nm-th nm-th-add">
                    <button class="nm-add-btn" @click="abrirDialogoCrear">
                      <q-icon name="add" size="14px" />
                      <q-tooltip class="pdv-tooltip">Nueva evaluación</q-tooltip>
                    </button>
                  </th>

                  <th class="nm-th nm-th-promedio">Promedio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fila in filas" :key="fila.enrollment_id">
                  <td class="nm-td-alumno">
                    <div class="nm-alumno-cell">
                      <div class="nm-avatar">{{ iniciales(fila.full_name) }}</div>
                      <span class="nm-alumno-nombre">{{ fila.full_name }}</span>
                    </div>
                  </td>

                  <td v-for="ev in evaluaciones" :key="ev.id" class="nm-td-nota">
                    <q-tooltip
                      v-if="hasError(fila.enrollment_id, ev.id)"
                      anchor="top middle"
                      self="bottom middle"
                      class="pdv-tooltip"
                    >
                      Rango válido: 1.0 – 7.0
                    </q-tooltip>
                    <input
                      type="number" min="1.0" max="7.0" step="0.1" placeholder="—"
                      :readonly="!esActivo"
                      :class="['nm-nota-input', hasError(fila.enrollment_id, ev.id) && 'nm-nota-input--error', !esActivo && 'nm-nota-input--readonly']"
                      :value="fila.notas[ev.id]"
                      :style="hasError(fila.enrollment_id, ev.id) ? {} : inputStyle(fila.notas[ev.id])"
                      @blur="esActivo && setNota(fila, ev.id, $event.target.value)"
                    />
                  </td>

                  <td v-if="esActivo" class="nm-td-add" />

                  <td class="nm-td-promedio">
                    <span :style="promedioStyle(calcPromedio(fila))">{{ calcPromedio(fila) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="nm-sep" />

        <!-- FOOTER -->
        <div class="nm-footer">
          <div />
          <div class="nm-footer-acciones">
            <button class="nm-btn-cancelar" @click="cerrar">Cancelar</button>
            <button
              v-if="esActivo"
              class="nm-btn-guardar"
              :disabled="!hayNotas || guardando"
              @click="guardar"
            >
              {{ guardando ? 'Guardando…' : 'Guardar notas' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog: nueva evaluación -->
    <q-dialog v-model="dialogoForm">
      <q-card class="pdv-dialog" style="min-width:320px;">
        <div class="pdv-dialog-title">Nueva evaluación</div>
        <div class="pdv-dialog-body">
          <q-input v-model="form.name" label="Nombre *" placeholder="Ej: Examen 1, Trabajo grupal…" outlined dense autofocus />
          <AppDateField v-model="form.date" label="Fecha *" />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Crear"
            :loading="guardandoForm" :disable="!form.name.trim() || !form.date"
            style="background:#13224A;color:white;border-radius:6px;padding:0 24px;font-weight:600;"
            @click="confirmarForm"
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

const evaluaciones  = ref([])
const filas         = ref([])
const cargando      = ref(false)
const guardando     = ref(false)
const dialogoForm   = ref(false)
const guardandoForm = ref(false)
const form          = ref({ name: '', date: '' })

const editandoNombreId = ref(null)
const editandoNombre   = ref('')
const nombreInputEl    = ref(null)
const errorCells       = ref({})

const esActivo = computed(() => props.instancia?.status === 'active')

const subtitulo = computed(() => {
  const i = props.instancia
  if (!i) return ''
  const anoPeriodo = i.year && i.period ? `${i.year} ${i.period}` : (i.year ?? i.period ?? '')
  return [i.course_name, anoPeriodo].filter(Boolean).join(' · ')
})

const hayNotas = computed(() =>
  filas.value.some(f => Object.values(f.notas).some(n => n !== null && !isNaN(parseFloat(n))))
)

// ── Utilidades ─────────────────────────────────────────────────────────
function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatFechaCorta(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}`
}

function normalizeGrade(raw) {
  const trimmed = String(raw ?? '').trim()
  if (trimmed === '') return { value: null, valid: true }
  const n = parseFloat(trimmed)
  if (isNaN(n)) return { value: null, valid: false }
  const rounded = Math.round(n * 10) / 10
  if (rounded < 1.0 || rounded > 7.0) return { value: null, valid: false }
  return { value: rounded, valid: true }
}

// ── Error de celda (flash 1.5s) ────────────────────────────────────────
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
  if (n >= 4.0) return { borderColor: '#4A9D69', color: '#1B5E20' }
  if (n >= 3.0) return { borderColor: '#E2A83B', color: '#7A5C00' }
  return { borderColor: '#C0392B', color: '#7F0000' }
}

function calcPromedio(fila) {
  const vals = Object.values(fila.notas).map(n => parseFloat(n)).filter(n => !isNaN(n))
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function promedioStyle(val) {
  const n = parseFloat(val)
  if (isNaN(n)) return 'color:#BDBDBD;font-weight:500;'
  if (n >= 4.0) return 'color:#1B5E20;font-weight:700;font-size:15px;'
  if (n >= 3.0) return 'color:#7A5C00;font-weight:700;font-size:15px;'
  return 'color:#7F0000;font-weight:700;font-size:15px;'
}

// ── Edición inline nombre ───────────────────────────────────────────────
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

// ── Celdas ──────────────────────────────────────────────────────────────
function setNota(fila, evalId, raw) {
  const { value, valid } = normalizeGrade(raw)
  if (!valid) flashError(fila.enrollment_id, evalId)
  fila.notas[evalId] = value
}

// ── Carga ────────────────────────────────────────────────────────────────
async function cargar() {
  cargando.value = true
  try {
    const { data: tabla } = await api.get(`/courses/${props.instancia.id}/grades-table`)
    evaluaciones.value = tabla.evaluaciones
    filas.value        = tabla.filas
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar las notas.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

// ── Guardar notas ────────────────────────────────────────────────────────
async function guardar() {
  for (const fila of filas.value) {
    for (const [evalId, nota] of Object.entries(fila.notas)) {
      if (nota === null) continue
      const { valid } = normalizeGrade(nota)
      if (!valid) {
        flashError(fila.enrollment_id, evalId)
        $q.notify({ type: 'negative', message: 'Hay notas fuera del rango 1.0–7.0.', position: 'top' })
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
    cerrar()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron guardar las notas.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

// ── Nueva evaluación ─────────────────────────────────────────────────────
function abrirDialogoCrear() {
  form.value = { name: '', date: '' }
  dialogoForm.value = true
}

async function confirmarForm() {
  guardandoForm.value = true
  try {
    const { data: nueva } = await api.post(
      `/courses/${props.instancia.id}/evaluations`,
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

// ── Cierre ───────────────────────────────────────────────────────────────
function cerrar() { emit('close') }

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
.nm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.52);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.nm-card {
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

.nm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 16px;
  flex-shrink: 0;
}

.nm-title {
  font-size: 22px;
  font-weight: 700;
  color: #13224A;
  margin: 0 0 4px;
  line-height: 1.2;
}

.nm-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.nm-close-btn {
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
.nm-close-btn:hover { background: #E5E7EB; }

.nm-sep { height: 1px; background: #E7E9EE; flex-shrink: 0; }

.nm-body { flex: 1; overflow-y: auto; min-height: 0; }

.nm-centrado { display: flex; align-items: center; justify-content: center; padding: 48px 24px; }

.nm-vacio { color: #9AA0AB; font-size: 14px; }

.nm-tabla-wrap { overflow-x: auto; }

.nm-tabla {
  border-collapse: collapse;
  width: 100%;
  font-size: 13.5px;
}

.nm-th {
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

.nm-th-alumno  { text-align: left; min-width: 200px; }
.nm-th-eval    { min-width: 110px; }
.nm-th-add     { width: 50px; }
.nm-th-promedio { min-width: 90px; }

/* Nombre evaluación inline editable */
.nm-ev-nombre {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
  transition: background 0.15s;
  font-weight: 700;
  color: #13224A;
  font-size: 12px;
}
.nm-ev-nombre:hover { background: #F3F4F6; }
.nm-edit-hint { opacity: 0; transition: opacity 0.15s; color: #9AA0AB; }
.nm-ev-nombre:hover .nm-edit-hint { opacity: 1; }

.nm-ev-fecha { font-size: 11px; color: #9AA0AB; margin-top: 2px; }

.nm-nombre-input {
  font-size: 12px;
  font-weight: 700;
  color: #13224A;
  border: none;
  border-bottom: 2px solid #13224A;
  outline: none;
  background: transparent;
  text-align: center;
  width: 100%;
  padding: 1px 4px;
}

/* Filas */
.nm-tabla tbody tr {
  border-bottom: 1px solid #F0F1F4;
  transition: background 0.1s;
}
.nm-tabla tbody tr:last-child { border-bottom: none; }
.nm-tabla tbody tr:hover { background: #FAFBFC; }

.nm-td-alumno { padding: 12px 16px; }

.nm-alumno-cell { display: flex; align-items: center; gap: 10px; }

.nm-avatar {
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

.nm-alumno-nombre { font-size: 14px; font-weight: 500; color: #13224A; }

.nm-td-nota { text-align: center; padding: 8px 10px; border-right: 1px solid #F0F1F4; }

.nm-nota-input {
  width: 64px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #13224A;
  border: 1.5px solid #E7E9EE;
  border-radius: 6px;
  padding: 5px 4px;
  outline: none;
  background: transparent;
  transition: border-color 0.15s, box-shadow 0.15s;
  -moz-appearance: textfield;
}
.nm-nota-input::placeholder { color: #C5CCD8; }
.nm-nota-input::-webkit-outer-spin-button,
.nm-nota-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.nm-nota-input:focus { border-color: #13224A; box-shadow: 0 0 0 2px rgba(19,34,74,0.08); }
.nm-nota-input--readonly { cursor: default; pointer-events: none; background: #FAFAFA; border-color: transparent; color: #555; }
.nm-nota-input--error {
  border-color: #C0392B !important;
  background: #FFEBEE !important;
  color: #7F0000 !important;
  animation: nm-shake 0.35s ease;
}

@keyframes nm-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  60%       { transform: translateX(4px); }
  80%       { transform: translateX(-2px); }
}

.nm-td-add { width: 50px; }

.nm-add-btn {
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
.nm-add-btn:hover { border-color: #13224A; color: #13224A; background: #F4F7FC; }

.nm-td-promedio { text-align: center; padding: 10px 16px; }

.nm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  flex-shrink: 0;
  gap: 12px;
}

.nm-footer-acciones {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.nm-btn-cancelar {
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
.nm-btn-cancelar:hover { color: #13224A; }

.nm-btn-guardar {
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
.nm-btn-guardar:hover:not(:disabled) { background: #1E3470; }
.nm-btn-guardar:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
