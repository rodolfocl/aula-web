<template>
  <q-page class="q-pa-md" style="background: #F5F0E8; min-height: 100vh;">
    <div class="text-h5 text-weight-bold q-mb-lg" style="color: #0D1B3E;">Mis Cursos</div>

    <div class="row q-col-gutter-md">
      <div
        v-for="curso in cursos"
        :key="curso.id"
        class="col-12 col-sm-6 col-lg-4"
      >
        <q-card flat class="curso-card" style="background: white; border-radius: 12px; border: 1px solid #E8D5B0; overflow: hidden;">
          <!-- Cabecera del curso -->
          <div class="q-pa-md" style="background: #0D1B3E;">
            <div class="text-white text-subtitle1 text-weight-bold">{{ curso.nombre }}</div>
            <div class="text-caption q-mt-xs" style="color: #C9A96E;">{{ curso.periodo }}</div>
          </div>

          <!-- Chips de info -->
          <q-card-section class="q-py-sm">
            <div class="row q-gutter-sm items-center">
              <q-chip
                dense
                icon="people"
                style="background: rgba(13,27,62,0.08); color: #0D1B3E; font-size: 12px;"
              >
                {{ curso.totalAlumnos }} alumnos
              </q-chip>
              <q-chip
                dense
                icon="access_time"
                style="background: rgba(201,169,110,0.2); color: #7A5C1E; font-size: 12px;"
              >
                {{ curso.proximaClase }}
              </q-chip>
            </div>
          </q-card-section>

          <q-separator style="border-color: #F0EAE0;" />

          <!-- Lista de alumnos -->
          <q-list dense class="q-px-xs q-py-xs">
            <q-item
              v-for="alumno in curso.alumnos"
              :key="alumno.id"
              dense
              class="q-py-sm rounded-borders"
              style="min-height: 52px;"
            >
              <q-item-section avatar style="min-width: 40px;">
                <q-avatar
                  size="36px"
                  style="background: #1A2F6B; color: white; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;"
                >
                  {{ iniciales(alumno.nombre) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium" style="color: #0D1B3E; font-size: 14px;">
                  {{ alumno.nombre }}
                </q-item-label>
                <q-item-label caption style="color: #8B7355;">
                  {{ alumno.faltas === 0 ? 'Sin ausencias' : `${alumno.faltas} falta${alumno.faltas > 1 ? 's' : ''}` }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :style="badgeStyle(alumno.faltas)"
                  :label="badgeLabel(alumno.faltas)"
                  class="badge-asistencia"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator style="border-color: #F0EAE0;" />

          <q-card-actions>
            <q-btn
              unelevated
              icon="how_to_reg"
              label="Pasar asistencia"
              :to="{ name: 'PasarAsistencia', params: { id: curso.id } }"
              style="background: #0D1B3E; color: white; border-radius: 8px;"
              class="q-px-md full-width"
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
      { id: 1, nombre: 'María González', faltas: 3 },
      { id: 2, nombre: 'Juan Pérez', faltas: 0 },
      { id: 3, nombre: 'Laura Díaz', faltas: 2 },
    ],
  },
  {
    id: 2,
    nombre: 'Hermenéutica Avanzada',
    periodo: '2026-1',
    totalAlumnos: 2,
    proximaClase: 'Viernes 14:00',
    alumnos: [
      { id: 4, nombre: 'Rodrigo Soto', faltas: 1 },
      { id: 5, nombre: 'Carmen Rojas', faltas: 0 },
    ],
  },
])

function iniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('')
}

function badgeLabel(faltas) {
  if (faltas === 0) return 'Al día'
  if (faltas === 1) return '1 falta'
  return `${faltas} faltas`
}

function badgeStyle(faltas) {
  if (faltas === 0) {
    return 'background: #E8F5E9; color: #1B5E20; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  }
  if (faltas <= 2) {
    return 'background: #FFF8E1; color: #7A5C00; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
  }
  return 'background: #FFEBEE; color: #7F0000; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
}
</script>