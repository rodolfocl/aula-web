<template>
  <q-page style="background: #F7F8FA; min-height: 100vh;">

    <!-- ── LISTADO DE CARPETAS ──────────────────────────────── -->
    <template v-if="!cursoSeleccionado">
      <div style="padding: 28px 24px 0; max-width: 860px; margin: 0 auto;">
        <div style="margin-bottom: 24px;">
          <div style="font-size: 20px; font-weight: 700; color: #0D1B3E;">Archivos por clase</div>
          <div style="font-size: 13px; color: #64748B; margin-top: 4px;">
            Selecciona una clase para ver y gestionar sus documentos.
          </div>
        </div>

        <div v-if="cargandoCursos" class="row justify-center q-mt-xl">
          <q-spinner color="primary" size="36px" />
        </div>

        <div v-else-if="errorCursos" class="estado-vacio">
          <i class="ti ti-alert-circle" style="font-size: 32px; color: #C0392B;" />
          <div>{{ errorCursos }}</div>
          <q-btn flat label="Reintentar" color="primary" @click="cargarCursos" />
        </div>

        <div v-else-if="cursos.length === 0" class="estado-vacio">
          <i class="ti ti-folder-open" style="font-size: 48px; color: #CBD5E1;" />
          <div style="color: #94A3B8;">No tienes clases asignadas.</div>
        </div>

        <div v-else class="carpetas-list">
          <div
            v-for="curso in cursos"
            :key="curso.id"
            class="carpeta-card"
            :class="{ 'carpeta-card--clickable': !!curso.drive_folder_id }"
            @click="curso.drive_folder_id && seleccionarCurso(curso)"
          >
            <div
              class="carpeta-icono"
              :class="curso.drive_folder_id ? 'carpeta-icono--activo' : 'carpeta-icono--inactivo'"
            >
              <i
                :class="curso.drive_folder_id ? 'ti ti-folder' : 'ti ti-folder-off'"
                :style="`font-size: 22px; color: ${curso.drive_folder_id ? '#C9A96E' : '#94A3B8'};`"
              />
            </div>

            <div class="carpeta-info">
              <div class="carpeta-nombre">{{ curso.course_name }}</div>
              <div class="carpeta-meta">
                {{ curso.teacher_name }} · {{ curso.year }}
                <span v-if="curso.period"> · {{ curso.period }}</span>
              </div>
              <div v-if="!curso.drive_folder_id" style="font-size: 12px; color: #E67E22; margin-top: 2px;">
                Sin carpeta en Drive
              </div>
            </div>

            <template v-if="curso.drive_folder_id">
              <i class="ti ti-chevron-right" style="font-size: 18px; color: #CBD5E1; flex-shrink: 0;" />
            </template>
            <template v-else>
              <q-btn
                unelevated
                label="Crear carpeta"
                style="background: #0D1B3E; color: #fff; border-radius: 8px; font-size: 13px; white-space: nowrap; flex-shrink: 0;"
                :loading="creandoCarpetaId === curso.id"
                @click.stop="crearCarpetaDesdeListado(curso)"
              />
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ── GRID DE ARCHIVOS ────────────────────────────────── -->
    <template v-else>
      <div style="padding: 28px 24px 0; max-width: 1040px; margin: 0 auto;">

        <!-- Breadcrumb -->
        <div class="row items-center q-mb-md" style="gap: 8px;">
          <span class="breadcrumb-link" @click="volverALista">← Archivos</span>
          <span style="color: #CBD5E1; font-size: 13px;">/</span>
          <span style="font-size: 13px; font-weight: 600; color: #0D1B3E;">
            {{ cursoSeleccionado.course_name }}
          </span>
        </div>

        <!-- Header clase -->
        <div class="row items-center justify-between q-mb-lg" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 18px; font-weight: 700; color: #0D1B3E;">
              {{ cursoSeleccionado.course_name }}
            </div>
            <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
              {{ cursoSeleccionado.teacher_name }} · {{ cursoSeleccionado.year }}
            </div>
          </div>

          <q-btn
            v-if="!cursoSeleccionado.drive_folder_id"
            unelevated
            label="Crear carpeta"
            style="background: #C9A96E; color: #fff; border-radius: 8px; font-size: 13px;"
            :loading="creandoCarpeta"
            @click="crearCarpeta"
          />
        </div>

        <!-- Sin carpeta -->
        <div v-if="!cursoSeleccionado.drive_folder_id" class="estado-vacio">
          <i class="ti ti-folder-off" style="font-size: 48px; color: #CBD5E1;" />
          <div style="color: #94A3B8; text-align: center;">
            Esta clase aún no tiene carpeta en Google Drive.<br>
            Haz clic en "Crear carpeta" para inicializarla.
          </div>
        </div>

        <template v-else>
          <!-- Drop zone -->
          <div
            class="drop-zone"
            :class="{ 'drop-zone--activa': dragging }"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
            @click="abrirSelectorArchivo"
          >
            <i class="ti ti-cloud-upload" style="font-size: 24px; color: #94A3B8;" />
            <span style="font-size: 13px; color: #94A3B8;">
              Arrastra archivos aquí o haz clic para seleccionar
            </span>
          </div>

          <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onArchivosSeleccionados" />

          <!-- Progreso subida -->
          <div v-if="subiendoArchivos" class="q-mb-md">
            <div style="font-size: 12px; color: #64748B; margin-bottom: 6px;">
              Subiendo {{ nombreArchivoSubiendo }}…
            </div>
            <q-linear-progress :value="progresoSubida" color="primary" rounded style="height: 6px;" />
          </div>

          <div v-if="cargandoArchivos" class="row justify-center q-mt-lg">
            <q-spinner color="primary" size="32px" />
          </div>

          <div v-else-if="errorArchivos" class="estado-vacio">
            <i class="ti ti-alert-circle" style="font-size: 28px; color: #C0392B;" />
            <div>{{ errorArchivos }}</div>
            <q-btn flat label="Reintentar" color="primary" @click="cargarArchivos" />
          </div>

          <div v-else-if="archivos.length === 0" class="estado-vacio" style="margin-top: 12px;">
            <i class="ti ti-files-off" style="font-size: 40px; color: #CBD5E1;" />
            <div style="color: #94A3B8;">Aún no hay archivos en esta carpeta.</div>
          </div>

          <!-- GRID -->
          <div v-else class="archivos-grid">
            <div v-for="archivo in archivos" :key="archivo.id" class="archivo-card">
              <!-- Área de miniatura -->
              <div class="archivo-thumbnail" @click="abrirPreview(archivo)">
                <img
                  v-if="archivo.thumbnailLink && !thumbnailErrors.has(archivo.id)"
                  :src="archivo.thumbnailLink"
                  :alt="archivo.name"
                  class="archivo-thumb-img"
                  @error="onThumbnailError(archivo.id)"
                />
                <div
                  v-else
                  class="archivo-thumb-fallback"
                  :style="`background: ${bgMime(archivo.mimeType)};`"
                >
                  <i
                    :class="`ti ${iconoMimeTi(archivo.mimeType)}`"
                    :style="`font-size: 44px; color: ${colorIconoMime(archivo.mimeType)};`"
                  />
                </div>
                <span v-if="badgeMime(archivo.mimeType)" class="archivo-badge">
                  {{ badgeMime(archivo.mimeType) }}
                </span>
              </div>

              <!-- Cuerpo card -->
              <div class="archivo-body">
                <div class="archivo-nombre" :title="archivo.name">{{ archivo.name }}</div>
                <div class="archivo-meta">
                  {{ formatearTamaño(archivo.size) }}
                  <span v-if="archivo.modifiedTime"> · {{ formatearFecha(archivo.modifiedTime) }}</span>
                </div>

                <div class="archivo-acciones">
                  <q-btn
                    unelevated
                    label="Abrir"
                    class="archivo-btn-abrir"
                    @click="abrirPreview(archivo)"
                  />
                  <q-btn flat round dense class="archivo-btn-icono" @click="descargarArchivo(archivo)">
                    <i class="ti ti-download" style="font-size: 16px; color: #0D1B3E;" />
                    <q-tooltip class="pdv-tooltip">Descargar</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="puedeEliminar"
                    flat round dense
                    class="archivo-btn-icono archivo-btn-icono--rojo"
                    @click="confirmarEliminar(archivo)"
                  >
                    <i class="ti ti-trash" style="font-size: 16px; color: #C0392B;" />
                    <q-tooltip class="pdv-tooltip">Eliminar</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- ── MODAL PREVIEW ────────────────────────────────────── -->
    <q-dialog v-model="previewAbierto" @hide="previewError = false">
      <div class="preview-modal">
        <!-- Header -->
        <div class="preview-header">
          <span class="preview-titulo">{{ archivoPreview?.name }}</span>
          <div class="row items-center" style="gap: 8px; flex-shrink: 0;">
            <q-btn
              flat
              label="Abrir en Drive ↗"
              class="preview-btn-secundario"
              tag="a"
              :href="archivoPreview?.webViewLink"
              target="_blank"
            />
            <q-btn
              flat
              class="preview-btn-secundario"
              @click="archivoPreview && descargarArchivo(archivoPreview)"
            >
              <i class="ti ti-download" style="font-size: 15px; margin-right: 4px;" />
              Descargar
            </q-btn>
            <q-btn flat round dense @click="previewAbierto = false">
              <i class="ti ti-x" style="font-size: 18px; color: #64748B;" />
            </q-btn>
          </div>
        </div>

        <!-- Iframe preview -->
        <div v-if="!previewError" class="preview-content">
          <iframe
            v-if="archivoPreview"
            :src="`https://drive.google.com/file/d/${archivoPreview.id}/preview`"
            class="preview-iframe"
            allow="autoplay"
            @error="previewError = true"
          />
        </div>

        <!-- Fallback -->
        <div v-else class="preview-fallback">
          <i class="ti ti-file-alert" style="font-size: 48px; color: #CBD5E1;" />
          <div style="color: #64748B; text-align: center; font-size: 14px;">
            No se puede previsualizar este archivo
          </div>
          <div class="row" style="gap: 8px; margin-top: 8px;">
            <q-btn
              unelevated
              label="Abrir en Drive"
              style="background: #0D1B3E; color: #fff; border-radius: 8px;"
              tag="a"
              :href="archivoPreview?.webViewLink"
              target="_blank"
            />
            <q-btn
              flat
              label="Descargar"
              style="border: 1px solid #E7E9EE; border-radius: 8px; color: #0D1B3E;"
              @click="archivoPreview && descargarArchivo(archivoPreview)"
            />
          </div>
        </div>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

const $q     = useQuasar()
const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const esAdmin    = computed(() => auth.hasRole('administrador'))
const esProfesor = computed(() => auth.hasRole('profesor'))
const puedeEliminar = computed(() => esAdmin.value || esProfesor.value)

// ── Lista de cursos ───────────────────────────────────────
const cursos             = ref([])
const cargandoCursos     = ref(false)
const errorCursos        = ref('')
const cursoSeleccionado  = ref(null)

async function cargarCursos() {
  cargandoCursos.value = true
  errorCursos.value = ''
  try {
    const { data } = await api.get('/courses', { params: { status: 'active' } })
    cursos.value = data
  } catch {
    errorCursos.value = 'No se pudieron cargar las clases. Intenta de nuevo.'
  } finally {
    cargandoCursos.value = false
  }
}

function seleccionarCurso(curso) {
  cursoSeleccionado.value = { ...curso }
  router.replace({ name: 'ArchivosDocumentos', params: { id: curso.id } })
  cargarArchivos()
}

function volverALista() {
  cursoSeleccionado.value = null
  archivos.value = []
  errorArchivos.value = ''
  thumbnailErrors.value = new Set()
  router.replace({ name: 'Archivos' })
}

// ── Crear carpeta (desde detalle) ─────────────────────────
const creandoCarpeta = ref(false)

async function crearCarpeta() {
  creandoCarpeta.value = true
  try {
    const { data } = await api.post(`/courses/${cursoSeleccionado.value.id}/documents/folder`)
    cursoSeleccionado.value = { ...cursoSeleccionado.value, drive_folder_id: data.drive_folder_id }
    const idx = cursos.value.findIndex(c => c.id === cursoSeleccionado.value.id)
    if (idx !== -1) cursos.value[idx].drive_folder_id = data.drive_folder_id
    $q.notify({ type: 'positive', message: 'Carpeta creada en Google Drive.', position: 'top' })
    await cargarArchivos()
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo crear la carpeta.'
    $q.notify({ type: 'negative', message: msg, position: 'top' })
  } finally {
    creandoCarpeta.value = false
  }
}

// ── Crear carpeta (desde listado) ─────────────────────────
const creandoCarpetaId = ref(null)

async function crearCarpetaDesdeListado(curso) {
  creandoCarpetaId.value = curso.id
  try {
    const { data } = await api.post(`/courses/${curso.id}/documents/folder`)
    const idx = cursos.value.findIndex(c => c.id === curso.id)
    if (idx !== -1) cursos.value[idx].drive_folder_id = data.drive_folder_id
    $q.notify({ type: 'positive', message: 'Carpeta creada. Accediendo…', position: 'top' })
    seleccionarCurso({ ...cursos.value[idx] })
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo crear la carpeta.'
    $q.notify({ type: 'negative', message: msg, position: 'top' })
  } finally {
    creandoCarpetaId.value = null
  }
}

// ── Archivos ──────────────────────────────────────────────
const archivos         = ref([])
const cargandoArchivos = ref(false)
const errorArchivos    = ref('')

async function cargarArchivos() {
  if (!cursoSeleccionado.value) return
  cargandoArchivos.value = true
  errorArchivos.value = ''
  try {
    const { data } = await api.get(`/courses/${cursoSeleccionado.value.id}/documents`)
    archivos.value = data.files ?? []
    if (data.drive_folder_id && !cursoSeleccionado.value.drive_folder_id) {
      cursoSeleccionado.value = { ...cursoSeleccionado.value, drive_folder_id: data.drive_folder_id }
    }
  } catch (err) {
    errorArchivos.value = err.response?.data?.error || 'No se pudieron cargar los archivos.'
  } finally {
    cargandoArchivos.value = false
  }
}

// ── Thumbnails ────────────────────────────────────────────
const thumbnailErrors = ref(new Set())

function onThumbnailError(id) {
  thumbnailErrors.value = new Set([...thumbnailErrors.value, id])
}

// ── Subida ────────────────────────────────────────────────
const fileInputRef          = ref(null)
const dragging              = ref(false)
const subiendoArchivos      = ref(false)
const progresoSubida        = ref(0)
const nombreArchivoSubiendo = ref('')

function abrirSelectorArchivo() {
  fileInputRef.value?.click()
}

async function onArchivosSeleccionados(event) {
  const files = Array.from(event.target.files ?? [])
  if (files.length === 0) return
  await subirArchivos(files)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function onDrop(event) {
  dragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length === 0) return
  await subirArchivos(files)
}

async function subirArchivos(files) {
  subiendoArchivos.value = true
  progresoSubida.value = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    nombreArchivoSubiendo.value = file.name
    progresoSubida.value = i / files.length

    const form = new FormData()
    form.append('file', file)

    try {
      await api.post(`/courses/${cursoSeleccionado.value.id}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (e) => {
          const chunk = e.progress ?? 0
          progresoSubida.value = i / files.length + chunk / files.length
        },
      })
    } catch (err) {
      const msg = err.response?.data?.error || `Error al subir "${file.name}".`
      $q.notify({ type: 'negative', message: msg, position: 'top' })
    }
  }

  progresoSubida.value = 1
  subiendoArchivos.value = false
  $q.notify({ type: 'positive', message: 'Archivos subidos correctamente.', position: 'top' })
  await cargarArchivos()
}

// ── Preview ───────────────────────────────────────────────
const previewAbierto  = ref(false)
const archivoPreview  = ref(null)
const previewError    = ref(false)

function abrirPreview(archivo) {
  archivoPreview.value = archivo
  previewError.value   = false
  previewAbierto.value = true
}

// ── Descarga ──────────────────────────────────────────────
async function descargarArchivo(archivo) {
  try {
    const response = await api.get(
      `/courses/${cursoSeleccionado.value.id}/documents/${archivo.id}/download`,
      { responseType: 'blob', timeout: 0 }
    )
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = archivo.name
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo descargar el archivo.', position: 'top' })
  }
}

// ── Eliminar ──────────────────────────────────────────────
function confirmarEliminar(archivo) {
  $q.dialog({
    title: 'Eliminar archivo',
    message: `¿Eliminar "${archivo.name}"? Esta acción no se puede deshacer.`,
    cancel: { flat: true, label: 'Cancelar', color: 'grey-7' },
    ok: { unelevated: true, label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/courses/${cursoSeleccionado.value.id}/documents/${archivo.id}`)
      archivos.value = archivos.value.filter(a => a.id !== archivo.id)
      $q.notify({ type: 'positive', message: 'Archivo eliminado.', position: 'top' })
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar el archivo.', position: 'top' })
    }
  })
}

// ── Helpers de tipo MIME ──────────────────────────────────
function iconoMimeTi(mime) {
  if (!mime) return 'ti-file'
  if (mime.startsWith('image/')) return 'ti-photo'
  if (mime.startsWith('video/')) return 'ti-video'
  if (mime.startsWith('audio/')) return 'ti-music'
  if (mime.includes('pdf')) return 'ti-file-type-pdf'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return 'ti-table'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'ti-presentation'
  if (mime.includes('document') || mime.includes('word')) return 'ti-file-text'
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('compress')) return 'ti-file-zip'
  return 'ti-file'
}

function colorIconoMime(mime) {
  if (!mime) return '#94A3B8'
  if (mime.startsWith('image/')) return '#7C3AED'
  if (mime.startsWith('video/')) return '#DC2626'
  if (mime.startsWith('audio/')) return '#D97706'
  if (mime.includes('pdf')) return '#DC2626'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '#16A34A'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '#EA580C'
  if (mime.includes('document') || mime.includes('word')) return '#2563EB'
  return '#64748B'
}

function bgMime(mime) {
  if (!mime) return '#F1F5F9'
  if (mime.startsWith('image/')) return '#EDE9FE'
  if (mime.startsWith('video/')) return '#FEE2E2'
  if (mime.startsWith('audio/')) return '#FEF3C7'
  if (mime.includes('pdf')) return '#FEE2E2'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '#DCFCE7'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '#FFEDD5'
  if (mime.includes('document') || mime.includes('word')) return '#DBEAFE'
  return '#F1F5F9'
}

function badgeMime(mime) {
  if (!mime) return ''
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'XLS'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT'
  if (mime.includes('document') || mime.includes('word')) return 'DOC'
  if (mime.includes('csv')) return 'CSV'
  if (mime.includes('zip')) return 'ZIP'
  return ''
}

function formatearTamaño(bytes) {
  if (!bytes) return '—'
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Inicialización ────────────────────────────────────────
onMounted(async () => {
  await cargarCursos()
  const idParam = route.params.id
  if (idParam) {
    const found = cursos.value.find(c => String(c.id) === String(idParam))
    if (found) seleccionarCurso(found)
  }
})
</script>

<style scoped>
/* ── CARPETAS ─────────────────────────────────────────── */
.carpetas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 40px;
}

.carpeta-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid #E7E9EE;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.carpeta-card--clickable {
  cursor: pointer;
}

.carpeta-card--clickable:hover {
  border-color: #C9A96E;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}

.carpeta-icono {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carpeta-icono--activo {
  background: rgba(201, 169, 110, 0.12);
}

.carpeta-icono--inactivo {
  background: #F1F5F9;
}

.carpeta-info {
  flex: 1;
  min-width: 0;
}

.carpeta-nombre {
  font-size: 15px;
  font-weight: 600;
  color: #0D1B3E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carpeta-meta {
  font-size: 13px;
  color: #64748B;
  margin-top: 2px;
}

/* ── GRID DE ARCHIVOS ────────────────────────────────── */
.archivos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-bottom: 40px;
}

@media (max-width: 768px) {
  .archivos-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .archivos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.archivo-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E7E9EE;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.archivo-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-color: #D1D5DB;
}

.archivo-thumbnail {
  position: relative;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  background: #F7F8FA;
}

.archivo-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.archivo-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archivo-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: #C0392B;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 5px;
}

.archivo-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.archivo-nombre {
  font-size: 13px;
  font-weight: 600;
  color: #0D1B3E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archivo-meta {
  font-size: 11px;
  color: #94A3B8;
  margin-bottom: 10px;
}

.archivo-acciones {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
}

.archivo-btn-abrir {
  flex: 1;
  background: #F1F5F9 !important;
  color: #0D1B3E !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  height: 34px !important;
  min-height: 34px !important;
}

.archivo-btn-abrir:hover {
  background: #E2E8F0 !important;
}

.archivo-btn-icono {
  width: 34px !important;
  height: 34px !important;
  border-radius: 8px !important;
  background: #F1F5F9 !important;
}

.archivo-btn-icono:hover {
  background: #E2E8F0 !important;
}

.archivo-btn-icono--rojo {
  background: #FEE2E2 !important;
}

.archivo-btn-icono--rojo:hover {
  background: #FECACA !important;
}

/* ── DROP ZONE ───────────────────────────────────────── */
.drop-zone {
  border: 2px dashed #E7E9EE;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  margin-bottom: 20px;
  background: #fff;
}

.drop-zone:hover,
.drop-zone--activa {
  border-color: #C9A96E;
  background: #FFFBF3;
}

/* ── PREVIEW MODAL ───────────────────────────────────── */
.preview-modal {
  background: #fff;
  border-radius: 16px;
  width: 90vw;
  max-width: 960px;
  height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #E7E9EE;
  gap: 12px;
  flex-shrink: 0;
}

.preview-titulo {
  font-size: 15px;
  font-weight: 600;
  color: #0D1B3E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.preview-btn-secundario {
  font-size: 13px !important;
  color: #0D1B3E !important;
  border: 1px solid #E7E9EE !important;
  border-radius: 8px !important;
  padding: 4px 12px !important;
}

.preview-content {
  flex: 1;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-fallback {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* ── COMUNES ─────────────────────────────────────────── */
.breadcrumb-link {
  font-size: 13px;
  color: #64748B;
  cursor: pointer;
  transition: color 0.12s;
}

.breadcrumb-link:hover {
  color: #0D1B3E;
}

.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  font-size: 14px;
  color: #94A3B8;
}
</style>

<style>
.pdv-tooltip {
  background: #0D1B3E !important;
  color: #fff !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
}
</style>