<template>
  <teleport to="body">
    <transition name="studentDrawer">
      <div
        v-if="abierto"
        class="sd-overlay"
        @click.self="cerrar"
      >
        <div class="sd-panel">

          <!-- ── Header blanco ── -->
          <div class="sd-header">
            <div class="sd-avatar">{{ iniciales(usuario?.full_name) }}</div>
            <div class="sd-header-info">
              <div class="sd-name">{{ usuario?.full_name }}</div>
              <div class="sd-email">{{ usuario?.email }}</div>
              <div class="sd-badges">
                <span
                  v-for="rol in (usuario?.roles || [])"
                  :key="rol"
                  class="sd-badge-rol"
                >{{ rol }}</span>
                <span :class="['sd-badge-estado', usuario?.active ? 'sd-badge-activo' : 'sd-badge-inactivo']">
                  <span class="sd-dot" />
                  {{ usuario?.active ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
            <button class="sd-close" @click="cerrar">
              <q-icon name="close" size="17px" />
            </button>
          </div>

          <!-- ── Métricas ── -->
          <div class="sd-metrics">
            <div class="sd-metric">
              <div class="sd-metric-value">{{ esAlumno && !cargando ? inscripciones.length : '—' }}</div>
              <div class="sd-metric-label">Cursos</div>
            </div>
            <div class="sd-metric-sep" />
            <div class="sd-metric">
              <div class="sd-metric-value">—</div>
              <div class="sd-metric-label">Promedio</div>
            </div>
            <div class="sd-metric-sep" />
            <div class="sd-metric">
              <div class="sd-metric-value">—</div>
              <div class="sd-metric-label">Asistencia</div>
            </div>
          </div>

          <!-- ── Historial ── -->
          <div class="sd-body">
            <div class="sd-body-title">Historial académico</div>

            <div v-if="!esAlumno" class="sd-empty">
              <q-icon name="person" size="32px" style="color: #C8BFB4;" />
              <span>Solo los alumnos tienen historial</span>
            </div>

            <div v-else-if="cargando" class="sd-empty">
              <q-spinner-dots color="primary" size="34px" />
            </div>

            <div v-else-if="inscripciones.length === 0" class="sd-empty">
              <q-icon name="school" size="32px" style="color: #C8BFB4;" />
              <span>Sin cursos en el historial</span>
            </div>

            <template v-else>

              <!-- En curso -->
              <div v-if="enCurso.length > 0" class="sd-group">
                <div class="sd-group-label sd-label-blue">
                  <span class="sd-dot sd-dot-blue" />
                  EN CURSO
                </div>
                <div class="sd-card-list">
                  <div v-for="e in enCurso" :key="e.id" class="sd-course-row">
                    <div class="sd-course-info">
                      <div class="sd-course-name">{{ e.course_name }}</div>
                      <div class="sd-course-meta">{{ e.year }} · Período {{ e.period }}</div>
                    </div>
                    <span class="sd-status sd-status-blue">En curso</span>
                  </div>
                </div>
              </div>

              <!-- Aprobados -->
              <div v-if="aprobados.length > 0" class="sd-group">
                <div class="sd-group-label sd-label-green">
                  <span class="sd-dot sd-dot-green" />
                  APROBADOS
                </div>
                <div class="sd-card-list">
                  <div v-for="e in aprobados" :key="e.id" class="sd-course-row">
                    <div class="sd-course-info">
                      <div class="sd-course-name">{{ e.course_name }}</div>
                      <div class="sd-course-meta">{{ e.year }} · Período {{ e.period }}</div>
                    </div>
                    <span class="sd-status sd-status-green">Aprobado</span>
                  </div>
                </div>
              </div>

              <!-- No completados -->
              <div v-if="noCompletados.length > 0" class="sd-group">
                <div class="sd-group-label sd-label-red">
                  <span class="sd-dot sd-dot-red" />
                  NO COMPLETADOS
                </div>
                <div class="sd-card-list">
                  <div v-for="e in noCompletados" :key="e.id" class="sd-course-row">
                    <div class="sd-course-info">
                      <div class="sd-course-name">{{ e.course_name }}</div>
                      <div class="sd-course-meta">{{ e.year }} · Período {{ e.period }}</div>
                    </div>
                    <span class="sd-status sd-status-red">No completado</span>
                  </div>
                </div>
              </div>

            </template>
          </div>

          <!-- ── Footer ── -->
          <div class="sd-footer">
            <button class="sd-btn-cancel" @click="cerrar">Cerrar</button>
            <button class="sd-btn-edit" @click="$emit('edit', usuario)">Editar alumno</button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  usuario:    { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'edit'])

const $q = useQuasar()
const inscripciones = ref([])
const cargando = ref(false)

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const esAlumno = computed(() => (props.usuario?.roles ?? []).includes('alumno'))

const enCurso       = computed(() => inscripciones.value.filter(e => e.status === 'in_progress'))
const aprobados     = computed(() => inscripciones.value.filter(e => e.status === 'approved'))
const noCompletados = computed(() => inscripciones.value.filter(e => e.status === 'failed'))

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function cerrar() {
  emit('update:modelValue', false)
}

async function cargarHistorial() {
  if (!props.usuario?.id || !esAlumno.value) return
  cargando.value = true
  inscripciones.value = []
  try {
    const { data } = await api.get(`/enrollments/student/${props.usuario.id}`)
    inscripciones.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el historial.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) cargarHistorial()
  else inscripciones.value = []
})

watch(() => props.usuario?.id, (id) => {
  if (props.modelValue && id) cargarHistorial()
})

function onKeydown(e) {
  if (e.key === 'Escape' && abierto.value) cerrar()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style>
/* Sin scoped: panel se renderiza vía teleport fuera del componente */

.sd-overlay {
  position: fixed;
  inset: 0;
  z-index: 5100;
  background: rgba(0, 0, 0, 0.35);
}

.sd-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 440px;
  max-width: 100vw;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.12);
}

/* ── Animación ── */
.studentDrawer-enter-active { transition: opacity 0.22s ease; }
.studentDrawer-leave-active { transition: opacity 0.18s ease; }
.studentDrawer-enter-from,
.studentDrawer-leave-to    { opacity: 0; }

.studentDrawer-enter-active .sd-panel,
.studentDrawer-leave-active .sd-panel {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.studentDrawer-enter-from .sd-panel,
.studentDrawer-leave-to .sd-panel {
  transform: translateX(100%);
}

/* ── Header ── */
.sd-header {
  background: #FFFFFF;
  border-bottom: 1px solid #EAE4DA;
  padding: 22px 18px 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-shrink: 0;
}

.sd-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #CBD5E1;
  color: #334155;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.sd-header-info {
  flex: 1;
  min-width: 0;
}

.sd-name {
  font-size: 17px;
  font-weight: 700;
  color: #20232A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.sd-email {
  font-size: 12.5px;
  color: #8C8275;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.sd-badge-rol {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid #D5CDBF;
  font-size: 11px;
  font-weight: 500;
  color: #20232A;
  text-transform: capitalize;
  background: transparent;
}

.sd-badge-estado {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
}

.sd-badge-activo  { color: #3F7A52; }
.sd-badge-inactivo { color: #B56A5E; }

.sd-close {
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
  transition: background 0.15s, color 0.15s;
}
.sd-close:hover { background: #F4F1EC; color: #20232A; }

/* ── Métricas ── */
.sd-metrics {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #EAE4DA;
  flex-shrink: 0;
  background: #FFFFFF;
}

.sd-metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 8px;
  gap: 4px;
}

.sd-metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #20232A;
  line-height: 1;
}

.sd-metric-label {
  font-size: 10px;
  font-weight: 600;
  color: #8C8275;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sd-metric-sep {
  width: 1px;
  background: #EAE4DA;
  align-self: stretch;
  margin: 14px 0;
}

/* ── Body ── */
.sd-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #FFFFFF;
}

.sd-body-title {
  font-size: 11px;
  font-weight: 700;
  color: #8C8275;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

.sd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: #B5ADA3;
  font-size: 13px;
}

/* ── Grupos de historial ── */
.sd-group {
  margin-bottom: 18px;
}

.sd-group-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  margin-bottom: 8px;
}

.sd-label-blue  { color: #1E40AF; }
.sd-label-green { color: #3F7A52; }
.sd-label-red   { color: #B56A5E; }

/* ── Dot indicators ── */
.sd-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sd-badge-activo  .sd-dot { background: #3F7A52; }
.sd-badge-inactivo .sd-dot { background: #B56A5E; }
.sd-dot-blue  { background: #1E40AF; }
.sd-dot-green { background: #3F7A52; }
.sd-dot-red   { background: #B56A5E; }

/* ── Tarjetas de cursos ── */
.sd-card-list {
  background: #FFFFFF;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #EAE4DA;
}

.sd-course-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #F1EDE3;
  gap: 12px;
}

.sd-course-row:last-child { border-bottom: none; }

.sd-course-info { min-width: 0; flex: 1; }

.sd-course-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #20232A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd-course-meta {
  font-size: 11.5px;
  color: #8C8275;
  margin-top: 2px;
}

/* ── Texto de estado (sin fondo) ── */
.sd-status {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.sd-status-blue  { color: #1E40AF; }
.sd-status-green { color: #3F7A52; }
.sd-status-red   { color: #B56A5E; }

/* ── Footer ── */
.sd-footer {
  flex-shrink: 0;
  background: #FFFFFF;
  border-top: 1px solid #EAE4DA;
  padding: 14px 16px;
  display: flex;
  gap: 8px;
}

.sd-btn-cancel {
  flex: 1;
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
.sd-btn-cancel:hover { background: #F4F1EC; }

.sd-btn-edit {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: #20232A;
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.sd-btn-edit:hover { background: #333740; }

/* ── Mobile ── */
@media (max-width: 599px) {
  .sd-panel { width: 100vw; }
}
</style>
