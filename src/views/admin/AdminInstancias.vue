<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold" style="color: #0D1B3E;">Gestión de Instancias</div>
      <div style="position: relative; display: inline-flex;">
        <q-btn
          unelevated icon="add" label="Nueva instancia"
          :style="isAdmin ? 'background: #0D1B3E; color: white; border-radius: 8px;' : 'background: #CCCCCC; color: #888888; border-radius: 8px; opacity: 0.5; pointer-events: none;'"
          @click="abrirDialogo()"
        />
        <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
          <q-tooltip class="pdv-tooltip">Solo los administradores pueden crear</q-tooltip>
        </div>
      </div>
    </div>

    <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
      <q-table
        :rows="instancias"
        :columns="columnas"
        row-key="id"
        flat
        :loading="cargando"
        :pagination="{ rowsPerPage: 15 }"
        :rows-per-page-options="[5, 10, 15, 25, 50, 0]"
      >
        <template #no-data>
          <EmptyState icon="📅" message="No hay instancias registradas" />
        </template>

        <template #loading>
          <q-inner-loading showing>
            <q-spinner-dots color="primary" size="40px" />
          </q-inner-loading>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :style="badgeEstado(props.value)">{{ labelEstado(props.value) }}</q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="q-gutter-xs">
            <div style="position: relative; display: inline-flex;">
              <q-btn
                flat round dense icon="edit" size="sm"
                :style="isAdmin ? 'color: #0D1B3E;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'"
                @click="abrirDialogo(props.row)"
              />
              <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
              </div>
            </div>
            <div v-if="props.row.status === 'active'" style="position: relative; display: inline-flex;">
              <q-btn
                flat round dense icon="block" size="sm"
                :style="isAdmin ? 'color: #C0392B;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'"
                @click="abrirCierre(props.row)"
              />
              <div style="position: absolute; inset: 0; cursor: not-allowed;">
                <q-tooltip class="pdv-tooltip">{{ isAdmin ? 'Cerrar instancia' : 'Solo los administradores pueden cerrar instancias' }}</q-tooltip>
              </div>
            </div>
            <div v-if="props.row.status === 'finished'" style="position: relative; display: inline-flex;">
              <q-btn
                flat round dense icon="play_circle_outline" size="sm"
                :style="isAdmin ? 'color: #2E7D32;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'"
                @click="abrirReapertura(props.row)"
              />
              <div style="position: absolute; inset: 0; cursor: not-allowed;">
                <q-tooltip class="pdv-tooltip">{{ isAdmin ? 'Reabrir instancia' : 'Solo los administradores pueden reabrir instancias' }}</q-tooltip>
              </div>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog crear/editar -->
    <q-dialog v-model="dialogo">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title">{{ editando ? 'Editar Instancia' : 'Nueva Instancia' }}</div>
        <div class="pdv-dialog-body">
          <q-select
            v-model="form.course_id"
            label="Curso"
            :options="opcionesCursos"
            option-label="label"
            option-value="value"
            emit-value
            map-options
          />
          <q-select
            v-model="form.teacher_id"
            label="Profesor"
            :options="opcionesProfesores"
            option-label="label"
            option-value="value"
            emit-value
            map-options
          />
          <div class="row q-gutter-md">
            <q-input v-model.number="form.year" label="Año" type="number" style="flex: 1;" />
            <q-input v-model="form.period" label="Período (ej: 1, 2)" style="flex: 1;" />
          </div>
          <q-input v-model="form.start_date" label="Fecha inicio" type="date" />
          <q-input v-model="form.end_date" label="Fecha fin" type="date" />
          <q-input v-model.number="form.max_absences" label="Máx. ausencias permitidas" type="number" />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn unelevated label="Guardar" class="pdv-btn-save" :loading="guardando" @click="guardar" />
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialog cerrar instancia -->
    <q-dialog v-model="dialogoCierre">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title" style="color: #C0392B;">Cerrar instancia</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Estás seguro que deseas cerrar
            <strong>{{ instanciaActiva?.course_name }}</strong> —
            <strong>{{ instanciaActiva?.year }} Período {{ instanciaActiva?.period }}</strong>?
          </p>
          <q-input v-model="motivoCierre" label="Motivo del cierre" type="textarea" autogrow />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Cerrar instancia" :loading="cerrando"
            :disable="motivoCierre.trim().length < 10"
            style="background: #C0392B; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
            @click="confirmarCierre"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialog reabrir instancia -->
    <q-dialog v-model="dialogoReapertura">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title" style="color: #2E7D32;">Reabrir instancia</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Estás seguro que deseas reabrir
            <strong>{{ instanciaActiva?.course_name }}</strong> —
            <strong>{{ instanciaActiva?.year }} Período {{ instanciaActiva?.period }}</strong>?
          </p>
          <q-input v-model="motivoReapertura" label="Motivo de reapertura" type="textarea" autogrow />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Reabrir instancia" :loading="reabriendo"
            :disable="motivoReapertura.trim().length < 10"
            style="background: #2E7D32; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
            @click="confirmarReapertura"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { usePermissions } from '../../composables/usePermissions'
import EmptyState from '../../components/EmptyState.vue'

const $q = useQuasar()
const { isAdmin } = usePermissions()
const instancias = ref([])
const cursos = ref([])
const profesores = ref([])
const cargando = ref(false)
const guardando = ref(false)

const dialogo = ref(false)
const editando = ref(null)

const instanciaActiva = ref(null)
const dialogoCierre = ref(false)
const motivoCierre = ref('')
const cerrando = ref(false)

const dialogoReapertura = ref(false)
const motivoReapertura = ref('')
const reabriendo = ref(false)

const opcionesCursos = computed(() =>
  cursos.value.map(c => ({ label: c.name, value: c.id }))
)
const opcionesProfesores = computed(() =>
  profesores.value
    .filter(u => Array.isArray(u.roles) && u.roles.includes('profesor'))
    .map(u => ({ label: u.full_name, value: u.id }))
)

const columnas = [
  { name: 'course_name', label: 'Curso', field: 'course_name', align: 'left', sortable: true },
  { name: 'teacher_name', label: 'Profesor', field: 'teacher_name', align: 'left' },
  { name: 'year', label: 'Año', field: 'year', align: 'center' },
  { name: 'period', label: 'Período', field: 'period', align: 'center' },
  { name: 'start_date', label: 'Inicio', field: 'start_date', align: 'center' },
  { name: 'end_date', label: 'Fin', field: 'end_date', align: 'center' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const formVacio = () => ({
  course_id: null, teacher_id: null, year: new Date().getFullYear(),
  period: '', start_date: '', end_date: '', max_absences: 3,
})
const form = ref(formVacio())

function badgeEstado(status) {
  if (status === 'active')    return 'background: #E8F5E9; color: #1B5E20; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  if (status === 'cancelled') return 'background: #FFEBEE; color: #7F0000; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  return 'background: #F5F5F5; color: #616161; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
}

function labelEstado(status) {
  if (status === 'active')    return 'Activa'
  if (status === 'finished')  return 'Finalizada'
  if (status === 'cancelled') return 'Cancelada'
  return status ?? '—'
}

async function cargarInstancias() {
  cargando.value = true
  try {
    const { data } = await api.get('/course-instances')
    instancias.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la lista de instancias.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarInstancias()
  try {
    const [{ data: c }, { data: u }] = await Promise.all([
      api.get('/courses', { params: { includeInactive: false } }),
      api.get('/users'),
    ])
    cursos.value = c
    profesores.value = u
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar los datos del formulario.', position: 'top' })
  }
})

function abrirDialogo(instancia = null) {
  editando.value = instancia
  form.value = instancia
    ? {
        course_id: instancia.course_id,
        teacher_id: instancia.teacher_id,
        year: instancia.year,
        period: instancia.period,
        start_date: instancia.start_date?.slice(0, 10) ?? '',
        end_date: instancia.end_date?.slice(0, 10) ?? '',
        max_absences: instancia.max_absences ?? 3,
      }
    : formVacio()
  dialogo.value = true
}

async function guardar() {
  guardando.value = true
  try {
    if (editando.value) {
      await api.patch(`/course-instances/${editando.value.id}`, form.value)
      $q.notify({ type: 'positive', message: 'Instancia actualizada.', position: 'top' })
    } else {
      await api.post('/course-instances', form.value)
      $q.notify({ type: 'positive', message: 'Instancia creada.', position: 'top' })
    }
    dialogo.value = false
    await cargarInstancias()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la instancia.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

function abrirCierre(instancia) {
  instanciaActiva.value = instancia
  motivoCierre.value = ''
  dialogoCierre.value = true
}

async function confirmarCierre() {
  cerrando.value = true
  try {
    await api.patch(`/course-instances/${instanciaActiva.value.id}`, {
      status: 'finished',
      close_reason: motivoCierre.value.trim(),
    })
    await cargarInstancias()
    dialogoCierre.value = false
    $q.notify({ type: 'positive', message: 'Instancia cerrada correctamente.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cerrar la instancia.', position: 'top' })
  } finally {
    cerrando.value = false
  }
}

function abrirReapertura(instancia) {
  instanciaActiva.value = instancia
  motivoReapertura.value = ''
  dialogoReapertura.value = true
}

async function confirmarReapertura() {
  reabriendo.value = true
  try {
    await api.patch(`/course-instances/${instanciaActiva.value.id}`, {
      status: 'active',
      reopen_reason: motivoReapertura.value.trim(),
    })
    await cargarInstancias()
    dialogoReapertura.value = false
    $q.notify({ type: 'positive', message: 'Instancia reabierta correctamente.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo reabrir la instancia.', position: 'top' })
  } finally {
    reabriendo.value = false
  }
}
</script>