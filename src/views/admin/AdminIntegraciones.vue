<template>
  <q-page style="background: #F7F8FA; min-height: 100vh; padding: 28px 24px;">

    <div style="color: #0D1B3E; font-size: 20px; font-weight: 700; margin-bottom: 24px;">
      Integraciones
    </div>

    <!-- ── TARJETA GOOGLE ─────────────────────────────────── -->
    <div class="integracion-card">
      <div class="integracion-header">
        <div class="integracion-logo">
          <i class="ti ti-brand-google" style="font-size: 24px; color: #4285F4;" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 600; color: #0D1B3E;">Google Workspace</div>
          <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Drive · Calendar · Meet</div>
        </div>
        <div class="integracion-badge" :class="conectado ? 'badge--conectado' : 'badge--desconectado'">
          <span class="badge-dot" />
          {{ conectado ? 'Conectado' : 'Desconectado' }}
        </div>
      </div>

      <q-separator style="border-color: #F1F5F9;" />

      <!-- Estado cargando -->
      <div v-if="cargandoStatus" class="integracion-body" style="justify-content: center;">
        <q-spinner color="primary" size="24px" />
      </div>

      <!-- Estado cargado -->
      <div v-else class="integracion-body">
        <div v-if="conectado" class="info-row">
          <i class="ti ti-mail" style="font-size: 15px; color: #64748B; flex-shrink: 0;" />
          <span style="font-size: 13px; color: #0D1B3E;">{{ emailConectado }}</span>
        </div>
        <div v-if="conectado && fechaConexion" class="info-row">
          <i class="ti ti-calendar-check" style="font-size: 15px; color: #64748B; flex-shrink: 0;" />
          <span style="font-size: 13px; color: #64748B;">Conectado el {{ formatearFecha(fechaConexion) }}</span>
        </div>
        <div v-if="!conectado" class="info-row">
          <i class="ti ti-info-circle" style="font-size: 15px; color: #94A3B8; flex-shrink: 0;" />
          <span style="font-size: 13px; color: #94A3B8;">
            Conectá una cuenta de Google para habilitar el explorador de archivos y la creación de eventos Meet.
          </span>
        </div>

        <div class="integracion-acciones">
          <q-btn
            unelevated
            :loading="conectando"
            style="background: #0D1B3E; color: #fff; border-radius: 8px; font-size: 13px; height: 36px;"
            @click="conectarGoogle"
          >
            <i class="ti ti-brand-google" style="font-size: 14px; margin-right: 8px;" />
            {{ conectado ? 'Reconectar cuenta' : 'Conectar Google' }}
          </q-btn>

          <q-btn
            v-if="conectado"
            flat
            :loading="desconectando"
            style="border: 1px solid #E7E9EE; border-radius: 8px; font-size: 13px; height: 36px; color: #C0392B;"
            @click="confirmarDesconectar"
          >
            <i class="ti ti-unlink" style="font-size: 14px; margin-right: 8px;" />
            Desconectar
          </q-btn>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'

const $q = useQuasar()

const cargandoStatus = ref(true)
const conectado      = ref(false)
const emailConectado = ref(null)
const fechaConexion  = ref(null)
const conectando     = ref(false)
const desconectando  = ref(false)

async function cargarStatus() {
  cargandoStatus.value = true
  try {
    const { data } = await api.get('/admin/google/status')
    conectado.value      = data.connected
    emailConectado.value = data.email ?? null
    fechaConexion.value  = data.connected_at ?? null
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo obtener el estado de la integración.', position: 'top' })
  } finally {
    cargandoStatus.value = false
  }
}

async function conectarGoogle() {
  conectando.value = true
  try {
    const { data } = await api.get('/admin/google/connect')
    window.open(data.url, '_blank', 'noopener')
    $q.notify({
      type: 'info',
      message: 'Autoriza en la pestaña que se abrió. Cuando termines, recargá esta página para ver el estado actualizado.',
      position: 'top',
      timeout: 9000,
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo iniciar la conexión con Google.', position: 'top' })
  } finally {
    conectando.value = false
  }
}

function confirmarDesconectar() {
  $q.dialog({
    title: 'Desconectar Google',
    message: '¿Seguro que querés desconectar la cuenta de Google? Esto deshabilitará el explorador de archivos y la creación de eventos Meet hasta que vuelvas a conectar.',
    cancel: { flat: true, label: 'Cancelar', color: 'grey-7' },
    ok: { unelevated: true, label: 'Desconectar', color: 'negative' },
    persistent: true,
  }).onOk(desconectarGoogle)
}

async function desconectarGoogle() {
  desconectando.value = true
  try {
    await api.delete('/admin/google/disconnect')
    conectado.value      = false
    emailConectado.value = null
    fechaConexion.value  = null
    $q.notify({ type: 'positive', message: 'Cuenta de Google desconectada.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo desconectar la cuenta.', position: 'top' })
  } finally {
    desconectando.value = false
  }
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
}

onMounted(cargarStatus)
</script>

<style scoped>
.integracion-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E7E9EE;
  max-width: 560px;
  overflow: hidden;
}

.integracion-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.integracion-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #EFF6FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.integracion-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.badge--conectado {
  background: #DCFCE7;
  color: #16A34A;
}

.badge--desconectado {
  background: #F1F5F9;
  color: #64748B;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.integracion-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.integracion-acciones {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}
</style>