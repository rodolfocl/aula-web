<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <template v-else>

      <!-- ── Bienvenida ── -->
      <div class="q-mb-lg">
        <div style="font-size: 22px; font-weight: 700; color: #0D1B3E;">
          Hola {{ primerNombre }}
        </div>
        <div style="font-size: 14px; color: #64748B; margin-top: 2px; text-transform: capitalize;">
          {{ fechaFormateada }}
        </div>
        <div v-if="summary?.clasesHoy?.length" style="margin-top: 8px;">
          <span class="pdv-pill pdv-pill-navy">
            <i class="ti ti-calendar-event" style="font-size: 12px; margin-right: 5px;" />
            {{ summary.clasesHoy.length === 1 ? '1 curso se dicta hoy' : `${summary.clasesHoy.length} cursos se dictan hoy` }}
          </span>
        </div>
      </div>

      <!-- ── Métricas (solo admin) ── -->
      <div v-if="esAdmin && summary?.metrics" class="row q-col-gutter-md q-mb-lg">
        <div class="col-6 col-md-3">
          <div class="metric-card">
            <div class="metric-label">Cursos activos</div>
            <div class="metric-value">{{ summary.metrics.cursosActivos }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="metric-card">
            <div class="metric-label">Profesores activos</div>
            <div class="metric-value">{{ summary.metrics.profesoresActivos }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="metric-card">
            <div class="metric-label">Alumnos inscritos</div>
            <div class="metric-value">{{ summary.metrics.alumnosInscritos }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="metric-card">
            <div class="metric-label">Sesiones esta semana</div>
            <div class="metric-value">{{ summary.metrics.sesionesEstaSemana }}</div>
          </div>
        </div>
      </div>

      <!-- ── Clases de hoy ── -->
      <template v-if="esAdmin || esProfesor">
        <div class="section-title">{{ esAdmin ? 'Clases de hoy' : 'Tus clases de hoy' }}</div>
        <q-card flat class="section-card q-mb-lg">
          <div v-if="!summary?.clasesHoy?.length" class="empty-section">
            <i class="ti ti-calendar-off" style="font-size: 28px; color: #CBD5E1; display: block; margin-bottom: 6px;" />
            No hay clases programadas para hoy
          </div>
          <template v-else>
            <div
              v-for="(clase, idx) in summary.clasesHoy"
              :key="clase.id"
              class="clase-row"
              :class="{ 'clase-row-border': idx < summary.clasesHoy.length - 1 }"
            >
              <div class="clase-dot" />
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 600; color: #0D1B3E;">{{ clase.course_name }}</div>
                <div v-if="esAdmin" style="font-size: 12px; color: #64748B; margin-top: 1px;">{{ clase.teacher_name }}</div>
              </div>
              <div v-if="clase.schedule_time" style="font-size: 13px; font-weight: 600; color: #0D1B3E; flex-shrink: 0;">
                {{ clase.schedule_time }}
              </div>
            </div>
          </template>
        </q-card>
      </template>

      <!-- ── Alertas (solo admin) ── -->
      <template v-if="esAdmin">
        <div class="section-title q-mb-sm">Requiere tu atención</div>
        <div class="row q-col-gutter-md">

          <!-- Asistencia baja -->
          <div class="col-12 col-md-6">
            <q-card flat class="section-card">
              <div class="alert-header">
                <i class="ti ti-chart-bar" style="font-size: 16px; color: #C0392B; margin-right: 8px;" />
                <span style="flex: 1;">Cursos con asistencia baja</span>
                <span v-if="alerts?.cursosAsistenciaBaja?.length" class="pdv-pill pdv-pill-error" style="font-size: 10px;">
                  {{ alerts.cursosAsistenciaBaja.length }}
                </span>
              </div>
              <q-separator style="border-color: #F1F5F9;" />
              <div v-if="cargandoAlertas" class="row justify-center q-pa-lg">
                <q-spinner-dots color="primary" size="28px" />
              </div>
              <div v-else-if="!alerts?.cursosAsistenciaBaja?.length" class="empty-section-ok">
                <i class="ti ti-circle-check" style="font-size: 24px; color: #22C55E; display: block; margin-bottom: 5px;" />
                Todo en orden
              </div>
              <template v-else>
                <div
                  v-for="(curso, idx) in alerts.cursosAsistenciaBaja"
                  :key="curso.course_id"
                  class="alert-row"
                  :class="{ 'clase-row-border': idx < alerts.cursosAsistenciaBaja.length - 1 }"
                >
                  <div style="flex: 1; min-width: 0; font-size: 13.5px; color: #0D1B3E; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {{ curso.course_name }}
                  </div>
                  <span class="pdv-pill pdv-pill-error">{{ curso.attendance_pct }}%</span>
                </div>
              </template>
            </q-card>
          </div>

          <!-- Alumnos en riesgo -->
          <div class="col-12 col-md-6">
            <q-card flat class="section-card">
              <div class="alert-header">
                <i class="ti ti-alert-triangle" style="font-size: 16px; color: #E67E22; margin-right: 8px;" />
                <span style="flex: 1;">Alumnos en riesgo de reprobar</span>
                <span v-if="alerts?.alumnosEnRiesgo?.length" class="pdv-pill pdv-pill-warning" style="font-size: 10px;">
                  {{ alerts.alumnosEnRiesgo.length }}
                </span>
              </div>
              <q-separator style="border-color: #F1F5F9;" />
              <div v-if="cargandoAlertas" class="row justify-center q-pa-lg">
                <q-spinner-dots color="primary" size="28px" />
              </div>
              <div v-else-if="!alerts?.alumnosEnRiesgo?.length" class="empty-section-ok">
                <i class="ti ti-circle-check" style="font-size: 24px; color: #22C55E; display: block; margin-bottom: 5px;" />
                Todo en orden
              </div>
              <template v-else>
                <div
                  v-for="(alumno, idx) in alerts.alumnosEnRiesgo"
                  :key="`${alumno.student_name}-${alumno.course_name}`"
                  class="alert-row"
                  :class="{ 'clase-row-border': idx < alerts.alumnosEnRiesgo.length - 1 }"
                >
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13.5px; color: #0D1B3E; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {{ alumno.student_name }}
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 1px;">{{ alumno.course_name }}</div>
                  </div>
                  <span class="pdv-pill pdv-pill-warning">{{ alumno.avg_grade }}</span>
                </div>
              </template>
            </q-card>
          </div>

        </div>
      </template>

    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

const auth = useAuthStore()
const cargando = ref(false)
const cargandoAlertas = ref(false)
const summary = ref(null)
const alerts = ref(null)

const esAdmin = computed(() => auth.hasRole('administrador'))
const esProfesor = computed(() => !esAdmin.value && auth.hasRole('profesor'))

const primerNombre = computed(() => {
  const nombre = auth.user?.full_name ?? auth.user?.nombre ?? ''
  return nombre.split(' ')[0] || nombre
})

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const fechaFormateada = computed(() => {
  const d = new Date()
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
})

onMounted(async () => {
  cargando.value = true
  try {
    if (esAdmin.value || esProfesor.value) {
      const params = esProfesor.value ? { teacher_id: auth.user.id } : {}
      const { data } = await api.get('/dashboard/summary', { params })
      summary.value = data
    }
  } catch {
    summary.value = null
  } finally {
    cargando.value = false
  }

  if (esAdmin.value) {
    cargandoAlertas.value = true
    try {
      const { data } = await api.get('/dashboard/alerts')
      alerts.value = data
    } catch {
      alerts.value = { cursosAsistenciaBaja: [], alumnosEnRiesgo: [] }
    } finally {
      cargandoAlertas.value = false
    }
  }
})
</script>

<style scoped>
.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: var(--pdv-shadow-card);
  text-align: center;
}

.metric-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 38px;
  font-weight: 700;
  color: #0D1B3E;
  line-height: 1;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #0D1B3E;
  margin-bottom: 10px;
}

.section-card {
  background: white;
  border-radius: 12px !important;
  box-shadow: var(--pdv-shadow-card) !important;
  overflow: hidden;
}

.clase-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
}

.clase-row-border {
  border-bottom: 1px solid #F1F5F9;
}

.clase-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #C9A96E;
  flex-shrink: 0;
}

.alert-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: #0D1B3E;
}

.alert-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.empty-section {
  padding: 32px 16px;
  text-align: center;
  color: #94A3B8;
  font-size: 13.5px;
  line-height: 1.5;
}

.empty-section-ok {
  padding: 28px 16px;
  text-align: center;
  color: #22C55E;
  font-size: 13.5px;
  font-weight: 600;
}
</style>
