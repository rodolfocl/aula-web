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

// Paleta suave de marca para pills (usada cuando el evento no trae color propio)
const PILL_PALETTE = [
  { bg: 'rgba(46, 125, 50, 0.12)',   text: '#1B5E20' },
  { bg: 'rgba(11, 24, 53, 0.10)',    text: '#0B1835' },
  { bg: 'rgba(201, 169, 110, 0.22)', text: '#7A5A10' },
  { bg: 'rgba(230, 126, 34, 0.15)',  text: '#B7600A' },
  { bg: 'rgba(192, 57, 43, 0.12)',   text: '#A0291B' },
]

// Asignación secuencial: primera clave vista → índice 0 (verde), segunda → 1 (navy), etc.
// Así el orden de la paleta se respeta según el orden de aparición de los cursos/plantillas.
const _colorMap = new Map()

function pillColors(event) {
  const bg = event.backgroundColor
  const isDefaultFC = !bg || bg === '#3788d8' || bg === '#3b86ff'
  const key = isDefaultFC
    ? (event.extendedProps?.courseName || event.title || '')
    : bg

  if (!_colorMap.has(key)) {
    _colorMap.set(key, _colorMap.size % PILL_PALETTE.length)
  }
  return PILL_PALETTE[_colorMap.get(key)]
}

// Extrae HH:MM del Date de inicio del evento
function fmtTime(date) {
  if (!date) return ''
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const calendarOptions = {
  plugins:     [dayGridPlugin, timeGridPlugin, listPlugin],
  locale:      esLocale,
  initialView: window.innerWidth < 600 ? 'listMonth' : 'dayGridMonth',
  headerToolbar: {
    left:   'prev,next today',
    center: 'title',
    right:  'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
  },
  dayMaxEvents:    3,       // muestra hasta 3 pills; el resto → "+N más"
  moreLinkClick:   'timeGridDay', // "+N más" abre la vista Día para esa fecha
  height:          'auto',
  firstDay:        1,
  displayEventTime: false,  // desactiva el tiempo nativo de FC (lo mostramos en el pill)

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

  // Renderizado personalizado del pill — evita la hora duplicada
  eventContent(arg) {
    const event  = arg.event
    const time   = fmtTime(event.start)
    const name   = event.extendedProps?.courseName || event.title || ''
    const colors = pillColors(event)
    return {
      html: `<div class="cal-pill" style="background:${colors.bg};color:${colors.text};">` +
            `<span class="cal-pill-time">${time}</span>` +
            `<span class="cal-pill-name">${name}</span>` +
            `</div>`,
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
  --fc-border-color:              #E2E8F0;
  --fc-today-bg-color:            rgba(201, 169, 110, 0.10);
  --fc-page-bg-color:             #FFFFFF;
  --fc-neutral-bg-color:          #F8FAFC;
  --fc-neutral-text-color:        #64748B;
  --fc-list-event-hover-bg-color: rgba(201, 169, 110, 0.08);
  font-family: inherit;
}

/* ── Base común de todos los botones ───────────────────── */
.fc .fc-button {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  text-transform: none;
  letter-spacing: 0;
  box-shadow: none !important;
  transition: background 0.15s, color 0.15s;
}

.fc .fc-button:focus {
  box-shadow: 0 0 0 2px rgba(201, 169, 110, 0.35) !important;
}

/* ── Botones de navegación (prev, next, today) ──────────
   Fondo gris claro, texto navy — igual al mockup          */
.fc .fc-prev-button,
.fc .fc-next-button,
.fc .fc-today-button {
  background: #F1F5F9 !important;
  border: none !important;
  color: #0D1B3E !important;
}

.fc .fc-prev-button:hover,
.fc .fc-next-button:hover,
.fc .fc-today-button:hover {
  background: #E2E8F0 !important;
}

/* ── Selector de vista (Mes / Semana / Día / Agenda) ────
   Contenedor pill gris, botón activo navy, resto texto   */
.fc .fc-toolbar-chunk:last-child .fc-button-group {
  background: #F1F5F9;
  border-radius: 10px;
  padding: 3px;
  gap: 0;
}

.fc .fc-button-group .fc-button {
  background: transparent !important;
  border: none !important;
  color: #64748B !important;
  border-radius: 8px !important;
  padding: 5px 14px !important;
}

.fc .fc-button-group .fc-button.fc-button-active {
  background: #0D1B3E !important;
  color: #FFFFFF !important;
  font-weight: 600 !important;
}

.fc .fc-button-group .fc-button:hover:not(.fc-button-active) {
  background: #E2E8F0 !important;
  color: #0D1B3E !important;
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

/* ── Pill de evento ─────────────────────────────────────── */
.fc .fc-event {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 1px 0;
  cursor: pointer;
}

.fc .fc-event:hover .cal-pill {
  filter: brightness(0.93);
}

/* Elimina el punto de color que FC añade por defecto */
.fc .fc-daygrid-event-dot {
  display: none;
}

.cal-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 6px;
  padding: 3px 7px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.cal-pill-time {
  flex-shrink: 0;
  font-weight: 700;
}

.cal-pill-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── "+N más" ───────────────────────────────────────────── */
.fc .fc-daygrid-more-link {
  font-size: 11px;
  color: #C9A96E;
  font-weight: 700;
  padding: 2px 6px;
}

.fc .fc-daygrid-more-link:hover {
  color: #8B6914;
  text-decoration: underline;
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