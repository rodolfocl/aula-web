<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold text-primary q-mb-md">Mi Dashboard</div>

    <!-- Alertas de inasistencia -->
    <q-banner
      v-for="alerta in alertasInasistencia"
      :key="alerta.id"
      class="bg-warning text-dark q-mb-sm rounded-borders"
      dense
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      <strong>{{ alerta.ramo }}</strong> — {{ alerta.mensaje }}
    </q-banner>

    <div class="row q-col-gutter-md q-mt-sm">
      <!-- Ramos en curso -->
      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              <q-icon name="menu_book" color="primary" class="q-mr-xs" />
              Ramos en Curso
            </div>
            <q-list separator>
              <q-item v-for="ramo in ramosEnCurso" :key="ramo.id">
                <q-item-section>
                  <q-item-label>{{ ramo.nombre }}</q-item-label>
                  <q-item-label caption>Profesor: {{ ramo.profesor }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    :color="ramo.asistencia >= 75 ? 'positive' : 'negative'"
                    text-color="white"
                    dense
                    icon="event_available"
                  >
                    {{ ramo.asistencia }}% asist.
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Ramos aprobados -->
      <div class="col-12 col-md-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              <q-icon name="check_circle" color="positive" class="q-mr-xs" />
              Ramos Aprobados
            </div>
            <q-list separator>
              <q-item v-for="ramo in ramosAprobados" :key="ramo.id">
                <q-item-section>
                  <q-item-label>{{ ramo.nombre }}</q-item-label>
                  <q-item-label caption>{{ ramo.periodo }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="positive">Aprobado</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const alertasInasistencia = ref([
  { id: 1, ramo: 'Teología Bíblica II', mensaje: 'Tu asistencia es de 68%, bajo el mínimo del 75%.' },
])

const ramosEnCurso = ref([
  { id: 1, nombre: 'Teología Bíblica II', profesor: 'Carlos Muñoz', asistencia: 68 },
  { id: 2, nombre: 'Homilética I', profesor: 'Pedro Soto', asistencia: 90 },
  { id: 3, nombre: 'Griego Bíblico', profesor: 'Luis Vera', asistencia: 82 },
])

const ramosAprobados = ref([
  { id: 1, nombre: 'Introducción a la Teología', periodo: '2025-1' },
  { id: 2, nombre: 'Hermenéutica', periodo: '2025-1' },
  { id: 3, nombre: 'Historia de la Iglesia', periodo: '2025-2' },
])
</script>