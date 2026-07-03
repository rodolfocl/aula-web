<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div style="color: #0D1B3E; font-size: 20px; font-weight: 700;" class="q-mb-md">Mi Historial</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="inscripciones.length === 0" icon="🎓" message="No tienes cursos en tu historial aún" />

    <template v-else>

      <!-- En curso -->
      <div class="q-mb-lg">
        <div class="section-label q-mb-sm">
          <q-icon name="menu_book" size="18px" style="color: #1E40AF;" />
          En curso
        </div>
        <EmptyState v-if="enCurso.length === 0" icon="📖" message="No tienes cursos activos actualmente" />
        <q-card v-else flat class="history-card">
          <q-list separator>
            <q-item v-for="e in enCurso" :key="e.id" style="padding: 12px 16px;">
              <q-item-section>
                <q-item-label style="color: #0D1B3E; font-weight: 500; font-size: 14px;">{{ e.course_name }}</q-item-label>
                <q-item-label caption style="color: #94A3B8; margin-top: 2px;">{{ e.year }} · Período {{ e.period }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <span v-if="e.is_historical" class="pdv-pill pdv-pill-neutral" style="font-size: 10px;">Histórico</span>
                  <span class="pdv-pill pdv-pill-info" style="font-size: 10px;">En curso</span>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Aprobados -->
      <div v-if="aprobados.length > 0" class="q-mb-lg">
        <div class="section-label q-mb-sm">
          <q-icon name="check_circle" size="18px" style="color: #065F46;" />
          Aprobados
        </div>
        <q-card flat class="history-card">
          <q-list separator>
            <q-item v-for="e in aprobados" :key="e.id" style="padding: 12px 16px;">
              <q-item-section>
                <q-item-label style="color: #0D1B3E; font-weight: 500; font-size: 14px;">{{ e.course_name }}</q-item-label>
                <q-item-label caption style="color: #94A3B8; margin-top: 2px;">{{ e.year }} · Período {{ e.period }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <span v-if="e.is_historical" class="pdv-pill pdv-pill-neutral" style="font-size: 10px;">Histórico</span>
                  <span class="pdv-pill pdv-pill-success" style="font-size: 10px;">Aprobado</span>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- No completados -->
      <div v-if="noCompletados.length > 0">
        <div class="section-label q-mb-sm">
          <q-icon name="cancel" size="18px" style="color: #991B1B;" />
          No completados
        </div>
        <q-card flat class="history-card">
          <q-list separator>
            <q-item v-for="e in noCompletados" :key="e.id" style="padding: 12px 16px;">
              <q-item-section>
                <q-item-label style="color: #0D1B3E; font-weight: 500; font-size: 14px;">{{ e.course_name }}</q-item-label>
                <q-item-label caption style="color: #94A3B8; margin-top: 2px;">{{ e.year }} · Período {{ e.period }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <span v-if="e.is_historical" class="pdv-pill pdv-pill-neutral" style="font-size: 10px;">Histórico</span>
                  <span class="pdv-pill pdv-pill-error" style="font-size: 10px;">No completado</span>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import EmptyState from '../../components/EmptyState.vue'

const $q = useQuasar()
const auth = useAuthStore()
const inscripciones = ref([])
const cargando = ref(false)

const enCurso       = computed(() => inscripciones.value.filter(e => e.status === 'in_progress'))
const aprobados     = computed(() => inscripciones.value.filter(e => e.status === 'approved'))
const noCompletados = computed(() => inscripciones.value.filter(e => e.status === 'failed'))

onMounted(async () => {
  cargando.value = true
  try {
    const { data } = await api.get(`/enrollments/student/${auth.user.id}`)
    inscripciones.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar tus inscripciones.', position: 'top' })
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.history-card {
  background: white;
  border-radius: 14px !important;
  box-shadow: var(--pdv-shadow-card) !important;
  border: none !important;
  overflow: hidden;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0D1B3E;
  font-size: 14px;
  font-weight: 600;
}

:deep(.q-list .q-separator) {
  border-color: #F1F5F9;
}
</style>
