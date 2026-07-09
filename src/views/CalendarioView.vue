<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">

    <div class="text-h6 text-weight-bold q-mb-md" style="color: #0D1B3E;">Calendario</div>

    <div class="cal-wrap">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- ── Diálogo de detalle de evento ─────────────────────── -->
    <q-dialog v-model="showDialog">
      <q-card class="pdv-dialog" style="min-width: 320px; max-width: 420px;">

        <div class="pdv-dialog-title" style="display: flex; align-items: center; gap: 10px;">
          <div :style="`width: 10px; height: 10px; border-radius: 50%; background: ${evento?.color}; flex-shrink: 0;`" />
          <span>{{ evento?.courseName }}</span>
        </div>

        <div class="pdv-dialog-body" style="gap: 12px;">
          <div class="evento-detail">
            <q-icon name="person_outline" size="18px" style="color: #64748B; flex-shrink: 0;" />
            <span>{{ evento?.teacher }}</span>
          </div>
          <div v-if="evento?.time" class="evento-detail">
            <q-icon name="schedule" size="18px" style="color: #64748B; flex-shrink: 0;" />
            <span>{{ evento?.time }}</span>
          </div>
          <div class="evento-detail">
            <q-icon name="people_outline" size="18px" style="color: #64748B; flex-shrink: 0;" />
            <span>{{ evento?.students }} alumno{{ evento?.students !== 1 ? 's' : '' }} inscrito{{ evento?.students !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div class="pdv-dialog-actions">
          <q-btn flat label="Cerrar" v-close-popup class="pdv-btn-cancel" />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import api from '../services/api'

const $q = useQuasar()

const showDialog = ref(false)
const evento     = ref(null)

const calendarOptions = {
  plugins:     [dayGridPlugin, timeGridPlugin, listPlugin],
  locale:      esLocale,
  // Vista por defecto: lista en mobile (< 600px), grilla mensual en desktop
  initialView: window.innerWidth < 600 ? 'listMonth' : 'dayGridMonth',
  headerToolbar: {
    left:   'prev,next today',
    center: 'title',
    right:  'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
  },
  dayMaxEvents: true,
  height:       'auto',
  firstDay:     1, // Lunes primero

  // FullCalendar llama esto cada vez que cambia el rango visible
  events: async (info, successCallback, failureCallback) => {
    try {
      const { data } = await api.get('/calendar/events', {
        params: {
          start: info.startStr.slice(0, 10),
          end:   info.endStr.slice(0, 10),
        },
      })
      successCallback(data)
    } catch (err) {
      $q.notify({ type: 'negative', message: 'No se pudieron cargar las clases.', position: 'top' })
      failureCallback(err)
    }
  },

  eventClick(info) {
    const p = info.event.extendedProps
    evento.value = {
      courseName: p.courseName,
      teacher:    p.teacher,
      time:       p.time,
      students:   p.students,
      color:      info.event.backgroundColor,
    }
    showDialog.value = true
  },

  // En resize a mobile, forzar vista lista si estaba en grilla
  windowResize(arg) {
    if (window.innerWidth < 600 && !arg.view.type.startsWith('list')) {
      arg.view.calendar.changeView('listMonth')
    }
  },
}
</script>

<style scoped>
.cal-wrap {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.evento-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1E293B;
}
</style>

<style>
/* Sin scoped: FullCalendar renderiza fuera del shadow del componente */

/* ── Variables de marca ────────────────────────────────── */
.fc {
  --fc-border-color:                 #E2E8F0;
  --fc-today-bg-color:               rgba(201, 169, 110, 0.10);
  --fc-button-bg-color:              #0B1835;
  --fc-button-border-color:          #0B1835;
  --fc-button-active-bg-color:       #C9A96E;
  --fc-button-active-border-color:   #C9A96E;
  --fc-button-hover-bg-color:        #1a2d5a;
  --fc-button-hover-border-color:    #1a2d5a;
  --fc-button-text-color:            #FFFFFF;
  --fc-page-bg-color:                #FFFFFF;
  --fc-neutral-bg-color:             #F8FAFC;
  --fc-neutral-text-color:           #64748B;
  --fc-list-event-hover-bg-color:    rgba(201, 169, 110, 0.08);
  font-family: inherit;
}

/* ── Botones de navegación ─────────────────────────────── */
.fc .fc-button {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  text-transform: none;
  letter-spacing: 0;
  box-shadow: none;
}

.fc .fc-button:focus {
  box-shadow: 0 0 0 2px rgba(201, 169, 110, 0.35);
}

.fc .fc-button-group {
  gap: 2px;
}

/* ── Título del mes ─────────────────────────────────────── */
.fc .fc-toolbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #0D1B3E;
}

/* ── Encabezados de día (Lun, Mar…) ────────────────────── */
.fc .fc-col-header-cell-cushion {
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 8px 4px;
  text-decoration: none;
}

/* ── Número del día ─────────────────────────────────────── */
.fc .fc-daygrid-day-number {
  font-size: 13px;
  color: #1E293B;
  font-weight: 500;
  padding: 6px 8px;
  text-decoration: none;
}

/* ── Día de hoy: círculo navy en el número ──────────────── */
.fc .fc-day-today .fc-daygrid-day-number {
  background: #0B1835;
  color: #FFFFFF;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 4px;
}

/* ── Chips de evento ────────────────────────────────────── */
.fc .fc-event {
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  padding: 1px 4px;
}

.fc .fc-event:hover {
  filter: brightness(0.92);
}

/* ── "+N more" ──────────────────────────────────────────── */
.fc .fc-daygrid-more-link {
  font-size: 11px;
  color: #64748B;
  font-weight: 600;
}

/* ── Vista Lista ─────────────────────────────────────────── */
.fc .fc-list-day-cushion {
  background: #F8FAFC;
  font-size: 13px;
  font-weight: 700;
  color: #0D1B3E;
  padding: 8px 14px;
}

.fc .fc-list-event-title a {
  color: #1E293B;
  text-decoration: none;
  font-size: 14px;
}

.fc .fc-list-event-time {
  color: #64748B;
  font-size: 13px;
}

.fc .fc-list-empty {
  background: #F8FAFC;
  color: #94A3B8;
  font-size: 14px;
}

/* ── Popover de "+N more" ───────────────────────────────── */
.fc .fc-popover {
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

.fc .fc-popover-header {
  background: #0B1835;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
}

.fc .fc-popover-close {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

/* ── Mobile: reducir padding de celdas ──────────────────── */
@media (max-width: 599px) {
  .cal-wrap {
    padding: 12px;
  }
  .fc .fc-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .fc .fc-toolbar-title {
    font-size: 15px;
  }
  .fc .fc-button {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>