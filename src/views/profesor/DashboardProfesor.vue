<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold text-primary q-mb-md">Mis Cursos</div>

    <div class="row q-col-gutter-md">
      <div
        v-for="curso in cursos"
        :key="curso.id"
        class="col-12 col-sm-6 col-lg-4"
      >
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ curso.nombre }}</div>
            <div class="text-caption text-grey-6">{{ curso.periodo }}</div>
            <q-separator class="q-my-sm" />
            <div class="row items-center q-gutter-sm">
              <q-chip dense icon="people" color="primary" text-color="white">
                {{ curso.totalAlumnos }} alumnos
              </q-chip>
              <q-chip dense icon="event" color="secondary" text-color="white">
                {{ curso.proximaClase }}
              </q-chip>
            </div>
          </q-card-section>

          <!-- Lista de alumnos -->
          <q-expansion-item label="Ver alumnos" icon="list" dense>
            <q-list dense separator class="q-px-md q-pb-sm">
              <q-item v-for="alumno in curso.alumnos" :key="alumno.id" dense>
                <q-item-section avatar>
                  <q-avatar size="28px" color="primary" text-color="white" font-size="12px">
                    {{ alumno.nombre.charAt(0) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ alumno.nombre }}</q-item-label>
                  <q-item-label caption>{{ alumno.asistencia }}% asistencia</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    :name="alumno.asistencia >= 75 ? 'check_circle' : 'warning'"
                    :color="alumno.asistencia >= 75 ? 'positive' : 'warning'"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-card-actions>
            <q-btn
              flat
              color="primary"
              icon="how_to_reg"
              label="Pasar asistencia"
              :to="{ name: 'PasarAsistencia', params: { id: curso.id } }"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const cursos = ref([
  {
    id: 1,
    nombre: 'Teología Bíblica II',
    periodo: '2026-1',
    totalAlumnos: 3,
    proximaClase: 'Jueves 10:00',
    alumnos: [
      { id: 1, nombre: 'María González', asistencia: 68 },
      { id: 2, nombre: 'Juan Pérez', asistencia: 95 },
      { id: 3, nombre: 'Laura Díaz', asistencia: 80 },
    ],
  },
  {
    id: 2,
    nombre: 'Hermenéutica Avanzada',
    periodo: '2026-1',
    totalAlumnos: 2,
    proximaClase: 'Viernes 14:00',
    alumnos: [
      { id: 4, nombre: 'Rodrigo Soto', asistencia: 90 },
      { id: 5, nombre: 'Carmen Rojas', asistencia: 78 },
    ],
  },
])
</script>