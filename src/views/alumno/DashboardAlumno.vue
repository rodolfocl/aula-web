<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="text-h5 text-weight-bold q-mb-md" style="color: #0D1B3E;">Mi Historial</div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="inscripciones.length === 0" icon="🎓" message="No tienes cursos en tu historial aún" />

    <template v-else>
      <!-- En curso -->
      <div class="q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-sm" style="color: #0D1B3E;">
          <q-icon name="menu_book" class="q-mr-xs" style="color: #C9A96E;" />
          En curso
        </div>
        <EmptyState v-if="enCurso.length === 0" icon="📖" message="No tienes cursos activos actualmente" />
        <q-card v-else flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
          <q-list separator>
            <q-item v-for="e in enCurso" :key="e.id">
              <q-item-section>
                <q-item-label style="color: #0D1B3E; font-weight: 500;">{{ e.course_name }}</q-item-label>
                <q-item-label caption style="color: #8B7355;">{{ e.year }} · Período {{ e.period }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge v-if="e.is_historical" style="background: #E0E0E0; color: #757575; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">Histórico</q-badge>
                  <q-badge style="background: #E3F2FD; color: #1565C0; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">En curso</q-badge>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Aprobados -->
      <div v-if="aprobados.length > 0" class="q-mb-lg">
        <div class="text-subtitle1 text-weight-medium q-mb-sm" style="color: #0D1B3E;">
          <q-icon name="check_circle" class="q-mr-xs" style="color: #2E7D32;" />
          Aprobados
        </div>
        <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
          <q-list separator>
            <q-item v-for="e in aprobados" :key="e.id">
              <q-item-section>
                <q-item-label style="color: #0D1B3E; font-weight: 500;">{{ e.course_name }}</q-item-label>
                <q-item-label caption style="color: #8B7355;">{{ e.year }} · Período {{ e.period }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge v-if="e.is_historical" style="background: #E0E0E0; color: #757575; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">Histórico</q-badge>
                  <q-badge style="background: #E8F5E9; color: #1B5E20; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">Aprobado</q-badge>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- No completados -->
      <div v-if="noCompletados.length > 0">
        <div class="text-subtitle1 text-weight-medium q-mb-sm" style="color: #0D1B3E;">
          <q-icon name="cancel" class="q-mr-xs" style="color: #C0392B;" />
          No completados
        </div>
        <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
          <q-list separator>
            <q-item v-for="e in noCompletados" :key="e.id">
              <q-item-section>
                <q-item-label style="color: #0D1B3E; font-weight: 500;">{{ e.course_name }}</q-item-label>
                <q-item-label caption style="color: #8B7355;">{{ e.year }} · Período {{ e.period }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge v-if="e.is_historical" style="background: #E0E0E0; color: #757575; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">Histórico</q-badge>
                  <q-badge style="background: #FFEBEE; color: #7F0000; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">No completado</q-badge>
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