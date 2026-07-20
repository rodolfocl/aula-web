<template>
  <q-page style="background: #F7F8FA; min-height: 100vh;">
    <div style="padding: 28px 24px 0;">

      <!-- ── HEADER: BREADCRUMB + ACCIONES ─────────────────── -->
      <div class="explorer-header">
        <div class="breadcrumb-nav">
          <q-btn
            v-if="breadcrumb.length > 0"
            flat round dense
            class="btn-volver"
            @click="navegarA(parentFolderId)"
          >
            <i class="ti ti-arrow-left" style="font-size: 18px; color: #0D1B3E;" />
            <q-tooltip class="pdv-tooltip">Volver</q-tooltip>
          </q-btn>
          <span class="breadcrumb-link" @click="navegarA(null)">
            <i class="ti ti-folders" style="font-size: 15px; vertical-align: middle; margin-right: 4px;" />
            Archivos
          </span>
          <template v-for="(seg, idx) in breadcrumb" :key="seg.id">
            <i class="ti ti-chevron-right" style="font-size: 12px; color: #CBD5E1; margin: 0 4px;" />
            <span
              v-if="idx < breadcrumb.length - 1"
              class="breadcrumb-link"
              @click="navegarA(seg.id)"
            >{{ seg.name }}</span>
            <span v-else class="breadcrumb-actual">{{ seg.name }}</span>
          </template>
        </div>

        <div class="acciones-header">
          <q-btn
            unelevated
            style="background: #0D1B3E; color: #fff; border-radius: 8px; font-size: 13px; height: 36px;"
            @click="abrirDialogoNuevaCarpeta"
          >
            <i class="ti ti-folder-plus" style="font-size: 15px; margin-right: 6px;" />
            Nueva carpeta
          </q-btn>
        </div>
      </div>

      <!-- ── DROP ZONE ───────────────────────────────────────── -->
      <div
        class="drop-zone"
        :class="{ 'drop-zone--activa': dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.self="dragging = false"
        @drop.prevent="onDrop"
        @click="abrirSelectorArchivo"
      >
        <i class="ti ti-cloud-upload" style="font-size: 20px; color: #94A3B8;" />
        <span style="font-size: 13px; color: #94A3B8;">Arrastra archivos aquí o haz clic para seleccionar</span>
      </div>
      <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onArchivosSeleccionados" />

      <!-- ── PROGRESO SUBIDA ──────────────────────────────────── -->
      <div v-if="subiendoArchivos" class="q-mb-lg">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 12px; color: #64748B;">Subiendo {{ nombreArchivoSubiendo }}…</span>
          <q-btn flat round dense @click="cancelarSubida" style="width: 24px; height: 24px; min-height: unset;">
            <i class="ti ti-x" style="font-size: 14px; color: #94A3B8;" />
            <q-tooltip class="pdv-tooltip">Cancelar subida</q-tooltip>
          </q-btn>
        </div>
        <q-linear-progress :value="progresoSubida" color="primary" rounded style="height: 6px;" />
      </div>

      <!-- ── LOADING ─────────────────────────────────────────── -->
      <div v-if="cargando" class="row justify-center q-mt-xl">
        <q-spinner color="primary" size="36px" />
      </div>

      <!-- ── ERROR ───────────────────────────────────────────── -->
      <div v-else-if="error" class="estado-vacio">
        <template v-if="errorCodigo === 'GOOGLE_INVALID_GRANT'">
          <i class="ti ti-brand-google" style="font-size: 36px; color: #64748B;" />
          <div style="font-weight: 600; color: #0D1B3E; text-align: center; max-width: 360px;">
            La conexión con Google expiró
          </div>
          <div style="font-size: 13px; color: #64748B; text-align: center; max-width: 360px;">
            {{ esPropietarioGoogle
              ? 'Es necesario reconectar la cuenta de Google para acceder a los archivos.'
              : 'Contacta al administrador para reconectar la cuenta de Google.' }}
          </div>
          <q-btn
            v-if="esPropietarioGoogle"
            unelevated
            :loading="reconectando"
            style="background: #0D1B3E; color: #fff; border-radius: 8px; margin-top: 4px;"
            @click="reconectarGoogle"
          >
            <i class="ti ti-refresh" style="font-size: 15px; margin-right: 8px;" />
            Reconectar Google
          </q-btn>
        </template>
        <template v-else>
          <i class="ti ti-alert-circle" style="font-size: 32px; color: #C0392B;" />
          <div>{{ error }}</div>
          <q-btn flat label="Reintentar" color="primary" @click="cargarContenido()" />
        </template>
      </div>

      <template v-else>
        <!-- ── VACÍO ─────────────────────────────────────────── -->
        <div v-if="carpetas.length === 0 && archivos.length === 0" class="estado-vacio">
          <i class="ti ti-folder-open" style="font-size: 48px; color: #CBD5E1;" />
          <div style="color: #94A3B8;">Esta carpeta está vacía</div>
          <div style="font-size: 12px; color: #CBD5E1;">Crea una subcarpeta o sube archivos para empezar</div>
        </div>

        <!-- ── LISTADO ────────────────────────────────────────── -->
        <div v-else class="items-list">

          <!-- Cabecera de columnas -->
          <div class="items-col-header">
            <div style="flex: 1; padding-left: 44px;">Nombre</div>
            <div class="col-size">Tamaño</div>
            <div class="col-date">Modificado</div>
            <div class="col-actions" />
          </div>

          <!-- Carpetas -->
          <template v-if="carpetas.length > 0">
            <div class="items-section-label">Carpetas</div>
            <div
              v-for="carpeta in carpetasPaginadas"
              :key="carpeta.id"
              class="item-row item-row--carpeta"
              @click="navegarA(carpeta.id)"
            >
              <div class="item-icono-wrap" style="position: relative;">
                <i class="ti ti-folder-filled" style="font-size: 22px; color: #C9A96E;" />
                <i
                  v-if="carpeta.starred"
                  class="ti ti-star-filled item-star-badge"
                />
              </div>
              <div class="item-nombre-wrap">
                <span class="item-nombre">{{ carpeta.name }}</span>
              </div>
              <div class="col-size">—</div>
              <div class="col-date">{{ carpeta.modifiedTime ? formatearFecha(carpeta.modifiedTime) : '—' }}</div>
              <div class="col-actions" @click.stop>
                <q-btn flat round dense class="item-btn">
                  <i class="ti ti-dots-vertical" style="font-size: 16px; color: #94A3B8;" />
                  <q-menu auto-close>
                    <q-list style="min-width: 160px; padding: 4px 0;">
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="toggleStar(carpeta)">
                        <i
                          :class="`ti ${carpeta.starred ? 'ti-star-off' : 'ti-star'}`"
                          style="font-size: 15px; color: #C9A96E; margin-right: 10px;"
                        />
                        <span style="font-size: 13px; color: #0D1B3E;">{{ carpeta.starred ? 'Quitar destacado' : 'Destacar' }}</span>
                      </q-item>
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="iniciarRenombre(carpeta)">
                        <i class="ti ti-pencil" style="font-size: 15px; color: #64748B; margin-right: 10px;" />
                        <span style="font-size: 13px; color: #0D1B3E;">Renombrar</span>
                      </q-item>
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="abrirDialogoMover(carpeta)">
                        <i class="ti ti-folder-symlink" style="font-size: 15px; color: #64748B; margin-right: 10px;" />
                        <span style="font-size: 13px; color: #0D1B3E;">Mover a…</span>
                      </q-item>
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="confirmarEliminar(carpeta, true)">
                        <i class="ti ti-trash" style="font-size: 15px; color: #C0392B; margin-right: 10px;" />
                        <span style="font-size: 13px; color: #C0392B;">Eliminar</span>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <div v-if="totalPaginasCarpetas > 1" class="paginacion-wrap">
              <q-pagination
                v-model="paginaCarpetas"
                :max="totalPaginasCarpetas"
                :max-pages="6"
                boundary-numbers
                color="grey-7"
                size="sm"
              />
            </div>
          </template>

          <!-- Archivos -->
          <template v-if="archivos.length > 0">
            <div class="items-section-label">Archivos</div>
            <div
              v-for="archivo in archivosPaginados"
              :key="archivo.id"
              class="item-row"
              @click="abrirPreview(archivo)"
            >
              <div class="item-icono-wrap" style="position: relative;">
                <div class="item-icono-archivo" :style="`background: ${bgMime(archivo.mimeType)};`">
                  <i
                    :class="`ti ${iconoMimeTi(archivo.mimeType)}`"
                    :style="`font-size: 16px; color: ${colorIconoMime(archivo.mimeType)};`"
                  />
                </div>
                <i
                  v-if="archivo.starred"
                  class="ti ti-star-filled item-star-badge"
                />
              </div>
              <div class="item-nombre-wrap">
                <span class="item-nombre">{{ archivo.name }}</span>
              </div>
              <div class="col-size">{{ formatearTamaño(archivo.size) }}</div>
              <div class="col-date">{{ archivo.modifiedTime ? formatearFecha(archivo.modifiedTime) : '—' }}</div>
              <div class="col-actions" @click.stop>
                <q-btn flat round dense class="item-btn" @click="descargarArchivo(archivo)">
                  <i class="ti ti-download" style="font-size: 15px; color: #64748B;" />
                  <q-tooltip class="pdv-tooltip">Descargar</q-tooltip>
                </q-btn>
                <q-btn flat round dense class="item-btn">
                  <i class="ti ti-dots-vertical" style="font-size: 16px; color: #94A3B8;" />
                  <q-menu auto-close>
                    <q-list style="min-width: 160px; padding: 4px 0;">
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="toggleStar(archivo)">
                        <i
                          :class="`ti ${archivo.starred ? 'ti-star-off' : 'ti-star'}`"
                          style="font-size: 15px; color: #C9A96E; margin-right: 10px;"
                        />
                        <span style="font-size: 13px; color: #0D1B3E;">{{ archivo.starred ? 'Quitar destacado' : 'Destacar' }}</span>
                      </q-item>
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="iniciarRenombre(archivo)">
                        <i class="ti ti-pencil" style="font-size: 15px; color: #64748B; margin-right: 10px;" />
                        <span style="font-size: 13px; color: #0D1B3E;">Renombrar</span>
                      </q-item>
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="abrirDialogoMover(archivo)">
                        <i class="ti ti-folder-symlink" style="font-size: 15px; color: #64748B; margin-right: 10px;" />
                        <span style="font-size: 13px; color: #0D1B3E;">Mover a…</span>
                      </q-item>
                      <q-item clickable v-ripple style="padding: 8px 16px;" @click="confirmarEliminar(archivo, false)">
                        <i class="ti ti-trash" style="font-size: 15px; color: #C0392B; margin-right: 10px;" />
                        <span style="font-size: 13px; color: #C0392B;">Eliminar</span>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <div v-if="totalPaginasArchivos > 1" class="paginacion-wrap">
              <q-pagination
                v-model="paginaArchivos"
                :max="totalPaginasArchivos"
                :max-pages="6"
                boundary-numbers
                color="grey-7"
                size="sm"
              />
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- ── DIÁLOGO NUEVA CARPETA ───────────────────────────── -->
    <q-dialog v-model="dialogoNuevaCarpeta">
      <q-card class="pdv-dialog" style="min-width: 340px;">
        <div class="pdv-dialog-title">Nueva carpeta</div>
        <div class="pdv-dialog-body">
          <q-input
            v-model="nombreNuevaCarpeta"
            label="Nombre de la carpeta"
            outlined
            dense
            autofocus
            @keyup.enter="crearCarpeta"
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" class="pdv-btn-cancel" @click="dialogoNuevaCarpeta = false" />
          <q-btn
            unelevated
            label="Crear"
            class="pdv-btn-save"
            :loading="creandoCarpeta"
            :disable="!nombreNuevaCarpeta.trim()"
            @click="crearCarpeta"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── DIÁLOGO RENOMBRAR ────────────────────────────────── -->
    <q-dialog v-model="dialogoRenombre">
      <q-card class="pdv-dialog" style="min-width: 340px;">
        <div class="pdv-dialog-title">Renombrar</div>
        <div class="pdv-dialog-body">
          <q-input
            v-model="nuevoNombre"
            label="Nuevo nombre"
            outlined
            dense
            autofocus
            @keyup.enter="ejecutarRenombre"
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" class="pdv-btn-cancel" @click="dialogoRenombre = false" />
          <q-btn
            unelevated
            label="Guardar"
            class="pdv-btn-save"
            :loading="renombrando"
            :disable="!nuevoNombre.trim()"
            @click="ejecutarRenombre"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── DIÁLOGO MOVER ──────────────────────────────────── -->
    <q-dialog v-model="dialogoMover" @hide="itemAMover = null">
      <q-card class="pdv-dialog" style="min-width: 440px; max-width: 540px;">
        <div class="pdv-dialog-title" style="padding-bottom: 0;">
          Mover "{{ itemAMover?.name }}"
        </div>

        <!-- Breadcrumb del picker -->
        <div class="move-picker-breadcrumb">
          <span class="move-picker-link" @click="cargarNavMover(null)">
            <i class="ti ti-folders" style="font-size: 13px; vertical-align: middle; margin-right: 3px;" />
            Archivos
          </span>
          <template v-for="(seg, idx) in moveNavBreadcrumb" :key="seg.id">
            <i class="ti ti-chevron-right" style="font-size: 11px; color: #CBD5E1; margin: 0 3px;" />
            <span
              v-if="idx < moveNavBreadcrumb.length - 1"
              class="move-picker-link"
              @click="cargarNavMover(seg.id)"
            >{{ seg.name }}</span>
            <span v-else class="move-picker-link move-picker-link--actual">{{ seg.name }}</span>
          </template>
        </div>

        <!-- Lista de carpetas navegables -->
        <div class="move-picker-lista">
          <div v-if="moveNavCargando" class="row justify-center q-pa-lg">
            <q-spinner color="primary" size="24px" />
          </div>
          <div v-else-if="moveNavCarpetas.length === 0" class="move-picker-vacio">
            <i class="ti ti-folder-open" style="font-size: 26px; color: #CBD5E1;" />
            <span>Sin subcarpetas</span>
          </div>
          <template v-else>
            <div
              v-for="carpeta in moveNavCarpetas"
              :key="carpeta.id"
              class="move-picker-item"
              @click="cargarNavMover(carpeta.id)"
            >
              <i class="ti ti-folder-filled" style="font-size: 18px; color: #C9A96E; flex-shrink: 0;" />
              <span class="move-picker-nombre">{{ carpeta.name }}</span>
              <i class="ti ti-chevron-right" style="font-size: 13px; color: #CBD5E1; flex-shrink: 0;" />
            </div>
          </template>
        </div>

        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" class="pdv-btn-cancel" @click="dialogoMover = false" />
          <q-btn
            unelevated
            class="pdv-btn-save"
            :loading="moviendoItem"
            :disable="moveEsMismaUbicacion"
            @click="ejecutarMover"
          >
            <i class="ti ti-folder-symlink" style="font-size: 14px; margin-right: 6px;" />
            Mover aquí
          </q-btn>
        </div>
      </q-card>
    </q-dialog>

    <!-- ── MODAL PREVIEW ────────────────────────────────────── -->
    <q-dialog v-model="previewAbierto" @hide="previewError = false">
      <div class="preview-modal">
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
            <q-btn flat class="preview-btn-secundario" @click="archivoPreview && descargarArchivo(archivoPreview)">
              <i class="ti ti-download" style="font-size: 15px; margin-right: 4px;" />
              Descargar
            </q-btn>
            <q-btn flat round dense @click="previewAbierto = false">
              <i class="ti ti-x" style="font-size: 18px; color: #64748B;" />
            </q-btn>
          </div>
        </div>
        <div v-if="!previewError" class="preview-content">
          <iframe
            v-if="archivoPreview"
            :src="`https://drive.google.com/file/d/${archivoPreview.id}/preview`"
            class="preview-iframe"
            allow="autoplay"
            @error="previewError = true"
          />
        </div>
        <div v-else class="preview-fallback">
          <i class="ti ti-file-alert" style="font-size: 48px; color: #CBD5E1;" />
          <div style="color: #64748B; text-align: center; font-size: 14px;">No se puede previsualizar este archivo</div>
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
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { isOwner } from '../config/owner'

const $q     = useQuasar()
const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const esPropietarioGoogle = computed(() => isOwner(auth.user?.email))

// ── Paginación ────────────────────────────────────────────
const POR_PAGINA = 10
const paginaCarpetas = ref(1)
const paginaArchivos = ref(1)

const carpetasPaginadas = computed(() => {
  const start = (paginaCarpetas.value - 1) * POR_PAGINA
  return carpetas.value.slice(start, start + POR_PAGINA)
})

const archivosPaginados = computed(() => {
  const start = (paginaArchivos.value - 1) * POR_PAGINA
  return archivos.value.slice(start, start + POR_PAGINA)
})

const totalPaginasCarpetas = computed(() => Math.ceil(carpetas.value.length / POR_PAGINA))
const totalPaginasArchivos = computed(() => Math.ceil(archivos.value.length / POR_PAGINA))

// ── Estado del explorador ─────────────────────────────────
const currentFolderId = ref(null)
const parentFolderId  = computed(() => {
  if (breadcrumb.value.length === 0) return null
  if (breadcrumb.value.length === 1) return null
  return breadcrumb.value[breadcrumb.value.length - 2].id
})
const breadcrumb      = ref([])
const carpetas        = ref([])
const archivos        = ref([])
const cargando        = ref(false)
const error           = ref('')
const errorCodigo     = ref(null)
const reconectando    = ref(false)

async function cargarContenido(folderId = currentFolderId.value) {
  cargando.value = true
  error.value = ''
  errorCodigo.value = null
  try {
    const params = folderId ? { folderId } : {}
    const { data } = await api.get('/drive/browse', { params })
    currentFolderId.value = data.currentFolderId ?? folderId
    breadcrumb.value      = data.breadcrumb ?? []
    carpetas.value        = data.folders ?? []
    archivos.value        = data.files ?? []
    paginaCarpetas.value  = 1
    paginaArchivos.value  = 1
  } catch (err) {
    errorCodigo.value = err.response?.data?.code ?? null
    error.value = err.response?.data?.error || 'No se pudo cargar el contenido. Intenta de nuevo.'
  } finally {
    cargando.value = false
  }
}

async function reconectarGoogle() {
  reconectando.value = true
  try {
    const { data } = await api.get('/admin/google/connect')
    window.open(data.url, '_blank', 'noopener')
    $q.notify({
      type: 'info',
      message: 'Autoriza en la pestaña que se abrió y luego recargá esta página.',
      position: 'top',
      timeout: 8000,
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo iniciar la reconexión con Google.', position: 'top' })
  } finally {
    reconectando.value = false
  }
}

function navegarA(folderId) {
  currentFolderId.value = folderId
  const query = folderId ? { folderId } : {}
  router.replace({ name: 'Archivos', query })
  cargarContenido(folderId)
}

// ── Nueva carpeta ─────────────────────────────────────────
const dialogoNuevaCarpeta = ref(false)
const nombreNuevaCarpeta  = ref('')
const creandoCarpeta      = ref(false)

function abrirDialogoNuevaCarpeta() {
  nombreNuevaCarpeta.value = ''
  dialogoNuevaCarpeta.value = true
}

async function crearCarpeta() {
  if (!nombreNuevaCarpeta.value.trim()) return
  creandoCarpeta.value = true
  try {
    await api.post('/drive/folders', {
      parentId: currentFolderId.value,
      name: nombreNuevaCarpeta.value.trim(),
    })
    dialogoNuevaCarpeta.value = false
    $q.notify({ type: 'positive', message: 'Carpeta creada.', position: 'top' })
    await cargarContenido()
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo crear la carpeta.'
    $q.notify({ type: 'negative', message: msg, position: 'top' })
  } finally {
    creandoCarpeta.value = false
  }
}

// ── Subida de archivos ────────────────────────────────────
const fileInputRef          = ref(null)
const dragging              = ref(false)
const subiendoArchivos      = ref(false)
const progresoSubida        = ref(0)
const nombreArchivoSubiendo = ref('')
let uploadAbortController   = null

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

function cancelarSubida() {
  $q.dialog({
    title: 'Cancelar subida',
    message: `¿Cancelar la subida de "${nombreArchivoSubiendo.value}"? El archivo no se guardará.`,
    cancel: { flat: true, label: 'Continuar subiendo', color: 'grey-7' },
    ok: { unelevated: true, label: 'Cancelar subida', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    uploadAbortController?.abort()
  })
}

async function subirArchivos(files) {
  subiendoArchivos.value = true
  progresoSubida.value = 0
  const folderId = currentFolderId.value ?? 'root'
  let errores = 0
  let cancelado = false

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    nombreArchivoSubiendo.value = file.name
    progresoSubida.value = i / files.length

    const form = new FormData()
    form.append('file', file)
    uploadAbortController = new AbortController()

    try {
      await api.post(`/drive/folders/${folderId}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        signal: uploadAbortController.signal,
        onUploadProgress: (e) => {
          const chunk = e.progress ?? 0
          progresoSubida.value = i / files.length + chunk / files.length
        },
      })
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        cancelado = true
        break
      }
      errores++
      const msg = err.response?.data?.error || `Error al subir "${file.name}".`
      $q.notify({ type: 'negative', message: msg, position: 'top' })
    }
  }

  uploadAbortController = null
  progresoSubida.value = 1
  subiendoArchivos.value = false

  if (cancelado) {
    $q.notify({ type: 'warning', message: 'Subida cancelada.', position: 'top' })
  } else if (errores < files.length) {
    $q.notify({ type: 'positive', message: 'Archivos subidos correctamente.', position: 'top' })
  }
  await cargarContenido()
}

// ── Descarga ──────────────────────────────────────────────
async function descargarArchivo(archivo) {
  try {
    const response = await api.get(`/drive/files/${archivo.id}/download`, {
      responseType: 'blob',
      timeout: 0,
    })
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

// ── Renombrar ─────────────────────────────────────────────
const dialogoRenombre = ref(false)
const nuevoNombre     = ref('')
const renombrando     = ref(false)
const itemEnEdicion   = ref(null)

function iniciarRenombre(item) {
  itemEnEdicion.value  = item
  nuevoNombre.value    = item.name
  dialogoRenombre.value = true
}

async function ejecutarRenombre() {
  if (!nuevoNombre.value.trim() || !itemEnEdicion.value) return
  renombrando.value = true
  try {
    await api.patch(`/drive/items/${itemEnEdicion.value.id}`, { name: nuevoNombre.value.trim() })
    dialogoRenombre.value = false
    $q.notify({ type: 'positive', message: 'Renombrado correctamente.', position: 'top' })
    await cargarContenido()
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo renombrar.'
    $q.notify({ type: 'negative', message: msg, position: 'top' })
  } finally {
    renombrando.value = false
  }
}

// ── Eliminar ──────────────────────────────────────────────
function confirmarEliminar(item, esCarpeta) {
  $q.dialog({
    title: esCarpeta ? 'Eliminar carpeta' : 'Eliminar archivo',
    message: esCarpeta
      ? `¿Eliminar la carpeta "${item.name}" y todo su contenido? Esta acción no se puede deshacer.`
      : `¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`,
    cancel: { flat: true, label: 'Cancelar', color: 'grey-7' },
    ok: { unelevated: true, label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/drive/items/${item.id}`)
      if (esCarpeta) {
        carpetas.value = carpetas.value.filter(c => c.id !== item.id)
      } else {
        archivos.value = archivos.value.filter(a => a.id !== item.id)
      }
      $q.notify({ type: 'positive', message: 'Eliminado correctamente.', position: 'top' })
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar.', position: 'top' })
    }
  })
}

// ── Mover ────────────────────────────────────────────────
const dialogoMover     = ref(false)
const itemAMover       = ref(null)
const moveNavFolderId  = ref(null)
const moveNavBreadcrumb = ref([])
const moveNavCarpetas  = ref([])
const moveNavCargando  = ref(false)
const moviendoItem     = ref(false)

const moveEsMismaUbicacion = computed(() => moveNavFolderId.value === currentFolderId.value)

async function abrirDialogoMover(item) {
  itemAMover.value      = item
  moveNavFolderId.value = null
  moveNavBreadcrumb.value = []
  moveNavCarpetas.value = []
  dialogoMover.value    = true
  await cargarNavMover(null)
}

async function cargarNavMover(folderId) {
  moveNavCargando.value = true
  try {
    const params = folderId ? { folderId } : {}
    const { data } = await api.get('/drive/browse', { params })
    moveNavFolderId.value   = data.currentFolderId ?? folderId
    moveNavBreadcrumb.value = data.breadcrumb ?? []
    moveNavCarpetas.value   = (data.folders ?? []).filter(f => f.id !== itemAMover.value?.id)
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar las carpetas.', position: 'top' })
  } finally {
    moveNavCargando.value = false
  }
}

async function ejecutarMover() {
  if (!itemAMover.value || !moveNavFolderId.value || moveEsMismaUbicacion.value) return
  moviendoItem.value = true
  try {
    await api.patch(`/drive/items/${itemAMover.value.id}/move`, { newParentId: moveNavFolderId.value })
    const destino = moveNavBreadcrumb.value.length > 0
      ? moveNavBreadcrumb.value.at(-1).name
      : 'Archivos'
    const esCarpeta = itemAMover.value.mimeType === 'application/vnd.google-apps.folder'
    if (esCarpeta) {
      carpetas.value = carpetas.value.filter(c => c.id !== itemAMover.value.id)
    } else {
      archivos.value = archivos.value.filter(a => a.id !== itemAMover.value.id)
    }
    dialogoMover.value = false
    $q.notify({ type: 'positive', message: `Movido a "${destino}".`, position: 'top' })
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo mover el elemento.'
    $q.notify({ type: 'negative', message: msg, position: 'top' })
  } finally {
    moviendoItem.value = false
  }
}

// ── Destacar ──────────────────────────────────────────────
async function toggleStar(item) {
  const nuevoEstado = !item.starred
  try {
    const { data } = await api.patch(`/drive/items/${item.id}/star`, { starred: nuevoEstado })
    const esCarpeta = item.mimeType === 'application/vnd.google-apps.folder'
    const lista = esCarpeta ? carpetas : archivos
    const idx = lista.value.findIndex(i => i.id === item.id)
    if (idx !== -1) lista.value[idx] = { ...lista.value[idx], starred: data.starred }
    lista.value = [...lista.value].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0) || a.name.localeCompare(b.name, 'es'))
    if (esCarpeta) paginaCarpetas.value = 1
    else paginaArchivos.value = 1
    $q.notify({
      type: 'positive',
      message: nuevoEstado ? `"${item.name}" destacado.` : `"${item.name}" quitado de destacados.`,
      position: 'top',
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cambiar el estado de destacado.', position: 'top' })
  }
}

// ── Preview ───────────────────────────────────────────────
const previewAbierto = ref(false)
const archivoPreview = ref(null)
const previewError   = ref(false)

function abrirPreview(archivo) {
  archivoPreview.value = archivo
  previewError.value   = false
  previewAbierto.value = true
}

// ── Helpers MIME ──────────────────────────────────────────
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
onMounted(() => {
  const folderId = route.query.folderId ?? null
  currentFolderId.value = folderId
  cargarContenido(folderId)
})
</script>

<style scoped>
/* ── HEADER ──────────────────────────────────────────── */
.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  font-size: 14px;
}

.btn-volver {
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  margin-right: 6px;
  flex-shrink: 0;
}

.btn-volver:hover {
  background: #E7E9EE !important;
}

.breadcrumb-link {
  color: #64748B;
  cursor: pointer;
  transition: color 0.12s;
  font-weight: 500;
}

.breadcrumb-link:hover {
  color: #0D1B3E;
}

.breadcrumb-actual {
  font-size: 14px;
  font-weight: 700;
  color: #0D1B3E;
}

.acciones-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* ── DROP ZONE ───────────────────────────────────────── */
.drop-zone {
  border: 2px dashed #E7E9EE;
  border-radius: 12px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  margin: 0 auto 20px;
  background: #fff;
  max-width: 860px;
  height: 80px;
}

.drop-zone:hover,
.drop-zone--activa {
  border-color: #C9A96E;
  background: #FFFBF3;
}

/* ── LISTADO ─────────────────────────────────────────── */
.items-list {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E7E9EE;
  overflow: hidden;
  margin-bottom: 40px;
}

.items-col-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #F1F5F9;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items-section-label {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 16px 4px;
  border-top: 1px solid #F1F5F9;
}

.items-section-label:first-child {
  border-top: none;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #F7F8FA;
  transition: background 0.12s;
  gap: 12px;
  min-height: 52px;
  cursor: pointer;
}

.item-row:last-child {
  border-bottom: none;
}

.item-row--carpeta {
  cursor: pointer;
}

.item-row:hover {
  background: #F7F8FA;
}

.item-icono-wrap {
  flex-shrink: 0;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icono-archivo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-star-badge {
  position: absolute;
  bottom: -3px;
  right: -4px;
  font-size: 11px;
  color: #C9A96E;
  background: #fff;
  border-radius: 50%;
  line-height: 1;
}

.item-nombre-wrap {
  flex: 1;
  min-width: 0;
}

.item-nombre {
  font-size: 14px;
  font-weight: 500;
  color: #0D1B3E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.col-size {
  width: 100px;
  text-align: right;
  font-size: 12px;
  color: #94A3B8;
  flex-shrink: 0;
}

.col-date {
  width: 130px;
  text-align: right;
  font-size: 12px;
  color: #94A3B8;
  flex-shrink: 0;
}

.col-actions {
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.item-btn {
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
}

.item-btn:hover {
  background: #F1F5F9 !important;
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

/* ── PAGINACIÓN ──────────────────────────────────────── */
.paginacion-wrap {
  display: flex;
  justify-content: center;
  padding: 10px 0 8px;
  border-top: 1px solid #F1F5F9;
}

.paginacion-wrap :deep(.q-btn--active .q-btn__content) {
  color: #fff;
}

.paginacion-wrap :deep(.q-btn--active) {
  background: #0D1B3E !important;
}

/* ── DIÁLOGO MOVER ───────────────────────────────────── */
.move-picker-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 10px 20px 8px;
  font-size: 12px;
  background: #F7F8FA;
  border-top: 1px solid #E7E9EE;
  border-bottom: 1px solid #E7E9EE;
}

.move-picker-link {
  color: #64748B;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.12s;
}

.move-picker-link:hover {
  color: #0D1B3E;
}

.move-picker-link--actual {
  color: #0D1B3E;
  font-weight: 600;
  cursor: default;
}

.move-picker-lista {
  min-height: 180px;
  max-height: 280px;
  overflow-y: auto;
}

.move-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 20px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #F7F8FA;
  font-size: 14px;
  color: #0D1B3E;
  font-weight: 500;
}

.move-picker-item:last-child {
  border-bottom: none;
}

.move-picker-item:hover {
  background: #F7F8FA;
}

.move-picker-nombre {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.move-picker-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 0;
  font-size: 13px;
  color: #94A3B8;
}

/* ── ESTADO VACÍO ────────────────────────────────────── */
.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  font-size: 14px;
  color: #94A3B8;
}

/* ── RESPONSIVE ──────────────────────────────────────── */
@media (max-width: 600px) {
  .col-size,
  .col-date,
  .items-col-header {
    display: none;
  }
  .acciones-header {
    width: 100%;
    justify-content: flex-end;
  }
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
