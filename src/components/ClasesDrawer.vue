<template>
  <teleport to="body">
    <transition name="clasesDrawer">
      <div v-if="abierto" class="cd-overlay" @click.self="cerrar">
        <div class="cd-panel">

          <!-- ── Header ── -->
          <div class="cd-header">
            <div class="cd-header-info">
              <div class="cd-subtitulo">{{ instancia?.course_name }}</div>
              <div class="cd-titulo">{{ instancia?.course_name }} {{ instancia?.year }}</div>
              <div class="cd-chips">
                <span
                  v-if="instancia?.day_of_week || instancia?.schedule_time"
                  class="cd-chip"
                >
                  <i class="ti ti-clock" style="font-size: 12px;" />
                  {{ [instancia?.day_of_week, instancia?.schedule_time?.slice(0,5)].filter(Boolean).join(' · ') }}
                </span>
                <span v-else class="cd-chip">—</span>
                <span v-if="instancia?.teacher_name" class="cd-chip">
                  <i class="ti ti-user" style="font-size: 12px;" />
                  {{ instancia.teacher_name }}
                </span>
                <span v-if="instancia?.period" class="cd-chip">{{ instancia.period }}</span>
              </div>
            </div>
            <button class="cd-close" @click="cerrar">
              <q-icon name="close" size="17px" />
            </button>
          </div>

          <!-- ── Body ── -->
          <div class="cd-body">
            <div class="cd-section-header">
              <div class="cd-section-title">Alumnos inscritos</div>
              <button v-if="!cursoFinalizado" class="cd-btn-add" @click="$emit('agregarAlumno', instancia)">
                <q-icon name="person_add" size="14px" />
                Agregar alumno
              </button>
              <button v-else class="cd-btn-diploma-todos" :disabled="generandoTodos" @click="generarTodos">
                <q-spinner-dots v-if="generandoTodos" size="14px" />
                <i v-else class="ti ti-certificate" style="font-size: 14px;" />
                {{ generandoTodos ? 'Generando…' : 'Generar todos los diplomas' }}
              </button>
            </div>

            <div v-if="!instancia || instancia.cargandoAlumnos" class="cd-empty">
              <q-spinner-dots color="primary" size="34px" />
            </div>

            <div v-else-if="alumnosActivos.length === 0" class="cd-empty">
              <q-icon name="person_off" size="32px" style="color: #C5CCD8;" />
              <span>Aún no hay alumnos inscritos</span>
            </div>

            <div v-else class="cd-alumno-list">
              <div
                v-for="alumno in alumnosActivos"
                :key="alumno.id"
                class="cd-alumno-item"
              >
                <div class="cd-alumno-row">
                  <div class="cd-avatar">{{ iniciales(alumno.full_name) }}</div>
                  <div class="cd-alumno-info">
                    <div class="cd-alumno-nombre">{{ alumno.full_name }}</div>
                    <div class="cd-alumno-meta">
                      {{ Number(alumno.absence_count) === 0
                        ? 'Sin ausencias'
                        : `${alumno.absence_count} falta${alumno.absence_count > 1 ? 's' : ''}` }}
                    </div>
                  </div>
                  <!-- Botón diploma (solo cursos finalizados) -->
                  <div v-if="cursoFinalizado" style="position: relative; display: inline-flex; margin-right: 4px;" @click.stop>
                    <button
                      v-if="estadoDiploma(alumno).estado === 'generando'"
                      class="pdv-action-btn pdv-action-disabled"
                    >
                      <q-spinner-dots size="14px" />
                    </button>
                    <button
                      v-else-if="estadoDiploma(alumno).estado === 'generado'"
                      class="pdv-action-btn cd-diploma-btn cd-diploma-btn--generado"
                      @click="descargarDiploma(alumno)"
                    >
                      <i class="ti ti-file-type-pdf" style="font-size: 16px;" />
                    </button>
                    <button
                      v-else
                      class="pdv-action-btn cd-diploma-btn"
                      @click="generarDiploma(alumno)"
                    >
                      <i class="ti ti-certificate" style="font-size: 16px;" />
                    </button>
                    <div style="position: absolute; inset: 0; pointer-events: none;">
                      <q-tooltip class="pdv-tooltip">
                        {{ estadoDiploma(alumno).estado === 'generado' ? 'Descargar diploma' : 'Generar diploma' }}
                      </q-tooltip>
                    </div>
                  </div>

                  <!-- Botón eliminar (solo cursos activos) -->
                  <div v-if="!cursoFinalizado" style="position: relative; display: inline-flex;" @click.stop>
                    <button
                      :class="['pdv-action-btn', 'pdv-action-danger', eliminando === alumno.id && 'pdv-action-disabled']"
                      @click="eliminando !== alumno.id && confirmarEliminar(alumno)"
                    >
                      <q-spinner-dots v-if="eliminando === alumno.id" size="14px" />
                      <q-icon v-else name="delete" size="16px" />
                    </button>
                    <div style="position: absolute; inset: 0; pointer-events: none;">
                      <q-tooltip class="pdv-tooltip">Eliminar del curso</q-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Footer ── -->
          <div class="cd-footer">
            <button class="cd-btn-cancel" @click="cerrar">Cerrar</button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>

  <!-- Diálogo confirmar eliminación -->
  <q-dialog v-model="dialogoEliminar">
    <q-card class="pdv-dialog" style="min-width: 360px; max-width: 440px;">
      <div class="pdv-dialog-title" style="color: #C0392B;">Eliminar del curso</div>
      <div class="pdv-dialog-body">
        <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.5;">
          ¿Estás seguro de eliminar a
          <strong>{{ alumnoAEliminar?.full_name }}</strong> del curso
          <strong>{{ instancia?.course_name }} {{ instancia?.year }}</strong>?
        </p>
      </div>
      <div class="pdv-dialog-actions">
        <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
        <q-btn
          unelevated label="Eliminar" :loading="eliminando !== null"
          style="background: #C0392B; color: white; border-radius: 8px; padding: 0 24px; font-weight: 600;"
          @click="ejecutarEliminar"
        />
      </div>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  instancia:  { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'agregarAlumno'])

const $q = useQuasar()

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const alumnosActivos = computed(() =>
  (props.instancia?.alumnos ?? []).filter(a => a.status !== 'withdrawn')
)

const cursoFinalizado = computed(() =>
  props.instancia?.status != null && props.instancia.status !== 'active'
)

// Estado diplomas por enrollment id: { estado: 'sin_generar'|'generando'|'generado', url: null|string }
const diplomaEstados  = ref({})
const generandoTodos  = ref(false)

watch(() => props.instancia?.id, () => {
  diplomaEstados.value = {}
  generandoTodos.value = false
})

function estadoDiploma(alumno) {
  return diplomaEstados.value[alumno.id] ?? { estado: 'sin_generar', url: null }
}

async function generarDiploma(alumno) {
  diplomaEstados.value = { ...diplomaEstados.value, [alumno.id]: { estado: 'generando', url: null } }
  try {
    const response = await api.post(
      `/courses/${props.instancia.id}/diplomas/${alumno.id}`,
      {},
      { responseType: 'blob' },
    )
    const contentType = response.headers['content-type'] ?? ''
    if (contentType.includes('application/pdf')) {
      // Fallback: Drive no disponible — descarga directa del buffer
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] ?? 'diploma.pdf'
      a.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      diplomaEstados.value = { ...diplomaEstados.value, [alumno.id]: { estado: 'sin_generar', url: null } }
    } else {
      const text = await response.data.text()
      const { url } = JSON.parse(text)
      diplomaEstados.value = { ...diplomaEstados.value, [alumno.id]: { estado: 'generado', url } }
      $q.notify({ type: 'positive', message: `Diploma de ${alumno.full_name} generado correctamente.`, position: 'top' })
    }
  } catch {
    diplomaEstados.value = { ...diplomaEstados.value, [alumno.id]: { estado: 'sin_generar', url: null } }
    $q.notify({ type: 'negative', message: `No se pudo generar el diploma de ${alumno.full_name}.`, position: 'top' })
  }
}

function descargarDiploma(alumno) {
  const { url } = estadoDiploma(alumno)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

async function generarTodos() {
  const pendientes = alumnosActivos.value.filter(a => estadoDiploma(a).estado === 'sin_generar')
  if (!pendientes.length) return
  generandoTodos.value = true
  try {
    await Promise.all(pendientes.map(a => generarDiploma(a)))
    const errores = pendientes.filter(a => estadoDiploma(a).estado === 'sin_generar').length
    if (!errores) {
      $q.notify({ type: 'positive', message: 'Todos los diplomas generados correctamente.', position: 'top' })
    }
  } finally {
    generandoTodos.value = false
  }
}

const dialogoEliminar   = ref(false)
const alumnoAEliminar   = ref(null)
const eliminando        = ref(null)

function cerrar() {
  emit('update:modelValue', false)
}

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function confirmarEliminar(alumno) {
  alumnoAEliminar.value = alumno
  dialogoEliminar.value = true
}

async function ejecutarEliminar() {
  const alumno = alumnoAEliminar.value
  if (!alumno) return
  eliminando.value = alumno.id
  try {
    await api.patch(`/enrollments/${alumno.id}/status`, { status: 'withdrawn' })
    if (props.instancia?.alumnos) {
      const idx = props.instancia.alumnos.findIndex(a => a.id === alumno.id)
      if (idx >= 0) props.instancia.alumnos[idx] = { ...props.instancia.alumnos[idx], status: 'withdrawn' }
    }
    dialogoEliminar.value = false
    $q.notify({ type: 'positive', message: `${alumno.full_name} eliminado del curso.`, position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo eliminar al alumno.', position: 'top' })
  } finally {
    eliminando.value = null
    alumnoAEliminar.value = null
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && abierto.value && !dialogoEliminar.value) {
    cerrar()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style>
/* Sin scoped: panel se renderiza vía teleport */

.cd-overlay {
  position: fixed;
  inset: 0;
  z-index: 5200;
  background: rgba(0, 0, 0, 0.35);
}

.cd-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 460px;
  max-width: 100vw;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.12);
}

/* ── Animación ── */
.clasesDrawer-enter-active { transition: opacity 0.22s ease; }
.clasesDrawer-leave-active { transition: opacity 0.18s ease; }
.clasesDrawer-enter-from,
.clasesDrawer-leave-to     { opacity: 0; }
.clasesDrawer-enter-active .cd-panel,
.clasesDrawer-leave-active .cd-panel {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.clasesDrawer-enter-from .cd-panel,
.clasesDrawer-leave-to .cd-panel { transform: translateX(100%); }

/* ── Header ── */
.cd-header {
  background: #FFFFFF;
  border-bottom: 1px solid #EAE4DA;
  padding: 20px 18px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
}

.cd-header-info { flex: 1; min-width: 0; }

.cd-subtitulo {
  font-size: 11px;
  font-weight: 700;
  color: #9AA0AB;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 4px;
}

.cd-titulo {
  font-size: 18px;
  font-weight: 700;
  color: #13224A;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 10px;
}

.cd-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cd-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #E7E9EE;
  background: #F7F8FA;
  font-size: 12px;
  font-weight: 500;
  color: #555B6A;
}

.cd-close {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid #EAE4DA;
  background: transparent;
  color: #8C8275;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.cd-close:hover { background: #F4F1EC; color: #20232A; }

/* ── Body ── */
.cd-body {
  flex: 1;
  overflow-y: auto;
  background: #FFFFFF;
}

.cd-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 10px;
  border-bottom: 1px solid #F0F2F5;
}

.cd-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #8C8275;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.cd-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #13224A;
  background: transparent;
  color: #13224A;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.cd-btn-add:hover { background: #F4F7FC; }

.cd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  color: #9AA0AB;
  font-size: 13px;
}

/* ── Lista de alumnos ── */
.cd-alumno-list { padding: 4px 0; }

.cd-alumno-item {
  border-bottom: 1px solid #F0F2F5;
  transition: background 0.12s;
}
.cd-alumno-item:last-child { border-bottom: none; }

.cd-alumno-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
}

.cd-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #475569;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cd-alumno-info { flex: 1; min-width: 0; }

.cd-alumno-nombre {
  font-size: 14px;
  font-weight: 600;
  color: #13224A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-alumno-meta {
  font-size: 11.5px;
  color: #9AA0AB;
  margin-top: 2px;
}

/* ── Footer ── */
.cd-footer {
  flex-shrink: 0;
  background: #FFFFFF;
  border-top: 1px solid #EAE4DA;
  padding: 14px 18px;
}

.cd-btn-cancel {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #D5CDBF;
  background: #FFFFFF;
  color: #555;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.cd-btn-cancel:hover { background: #F4F1EC; }

/* ── Botón diploma individual ── */
.cd-diploma-btn {
  border: 1.5px solid #4A6EA8 !important;
  color: #4A6EA8;
}
.cd-diploma-btn:hover { background: #EEF2FB; }

.cd-diploma-btn--generado {
  background: #FEF2F2;
  color: #C0392B;
  border: 1.5px solid #C0392B !important;
}
.cd-diploma-btn--generado:hover { background: #FEE2E2 !important; color: #C0392B !important; }

/* ── Botón generar todos ── */
.cd-btn-diploma-todos {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1.5px solid #4A6EA8;
  background: transparent;
  color: #4A6EA8;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.cd-btn-diploma-todos:hover:not(:disabled) { background: #EEF2FB; }
.cd-btn-diploma-todos:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Mobile ── */
@media (max-width: 599px) {
  .cd-panel { width: 100vw; }
}
</style>
